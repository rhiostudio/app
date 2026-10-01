"""Render actual GLB geometry to lightweight catalog thumbnails. Requires numpy and Pillow.
This offline rasterizer is for catalog pictures; the interactive viewer renders the GLBs.
"""
import json
from pathlib import Path
import struct
import numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parent.parent
NAMES=['atlas','nova','orbit','kira','dash','byte','echo','terra','volt','scout','maker','guardian']

def render(name):
    raw=(ROOT/f'public/models/rhio-{name}.glb').read_bytes()
    magic,version,total=struct.unpack_from('<III',raw)
    assert magic==0x46546c67 and version==2 and total==len(raw)
    length,_=struct.unpack_from('<II',raw,12)
    g=json.loads(raw[20:20+length]);off=20+length
    blen,kind=struct.unpack_from('<II',raw,off);buf=raw[off+8:off+8+blen]
    assert kind==0x004e4942 and blen==g['buffers'][0]['byteLength']
    def acc(i):
        a=g['accessors'][i];v=g['bufferViews'][a['bufferView']]
        return np.frombuffer(buf,dtype={5126:'<f4',5123:'<u2'}[a['componentType']],offset=v.get('byteOffset',0)+a.get('byteOffset',0),count=a['count']*{'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]).reshape((a['count'],-1))
    for anim in g['animations']:
        for sample in anim['samplers']:
            t=acc(sample['input']);v=acc(sample['output'])
            assert len(t)==len(v) and np.all(np.diff(t[:,0])>0) and np.isfinite(v).all()
    humanoid=name not in ['scout','maker','guardian']
    assert len(g['animations'])==(12 if humanoid else 7)
    cam=np.array([-.22,.08,1.]);cam/=np.linalg.norm(cam)
    right=np.cross([0,1,0],cam);right/=np.linalg.norm(right);up=np.cross(cam,right)
    light=np.array([-.4,.8,1.]);light/=np.linalg.norm(light)
    polys=[]
    def visit(idx,parent):
        node=g['nodes'][idx];m=np.eye(4);x,y,z,w=node.get('rotation',[0,0,0,1])
        rot=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
        m[:3,:3]=rot@np.diag(node.get('scale',[1,1,1]));m[:3,3]=node.get('translation',[0,0,0]);m=parent@m
        if 'mesh' in node:
            for prim in g['meshes'][node['mesh']]['primitives']:
                mat=g['materials'][prim['material']];base=mat['pbrMetallicRoughness']['baseColorFactor']
                if base[3]<.1:continue
                p=acc(prim['attributes']['POSITION']);n=acc(prim['attributes']['NORMAL']);ix=acc(prim['indices']).reshape(-1,3)
                assert ix.max()<len(p) and np.isfinite(p).all()
                world=p@m[:3,:3].T+m[:3,3];n=n@np.linalg.inv(m[:3,:3]);n/=np.linalg.norm(n,axis=1)[:,None]
                target=world-[0,1.68,0]
                screen=np.column_stack([280+target@right*148,320-target@up*148])
                depths=world@cam
                shade=.32+.68*np.maximum(0,n@light)
                colors=np.clip((np.array(base[:3])*shade[:,None]+np.array(mat.get('emissiveFactor',[0,0,0]))*.22)**(1/2.2)*255,0,255)
                for tri in ix:
                    if (n[tri].mean(axis=0)@cam)<-.05:continue
                    coords=screen[tri]
                    polys.append((np.column_stack([coords,depths[tri]]),colors[tri]))
        for child in node.get('children',[]):visit(child,m)
    visit(0,np.eye(4))
    pixels=np.zeros((640,560,3),dtype=np.uint8);pixels[:]=[19,27,16];depth=np.full((640,560),-np.inf)
    for triangle,colors in polys:
        a,b,c=triangle;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(den)<1e-6:continue
        lo=np.floor(triangle.min(axis=0)).astype(int);hi=np.ceil(triangle.max(axis=0)).astype(int)
        x0=max(0,lo[0]);x1=min(559,hi[0]);y0=max(0,lo[1]);y1=min(639,hi[1])
        if x1<x0 or y1<y0:continue
        yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
        wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
        wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;wc=1-wa-wb
        zz=wa*a[2]+wb*b[2]+wc*c[2];section=depth[y0:y1+1,x0:x1+1];mask=(wa>=0)&(wb>=0)&(wc>=0)&(zz>section)
        section[mask]=zz[mask];rgb=wa[:,:,None]*colors[0]+wb[:,:,None]*colors[1]+wc[:,:,None]*colors[2]
        pixels[y0:y1+1,x0:x1+1][mask]=rgb[mask].astype(np.uint8)
    picture=Image.fromarray(pixels).resize((280,320),Image.Resampling.LANCZOS)
    picture.save(ROOT/f'public/characters/{name}.webp',quality=88)
    print(name,': geometry and',len(g['animations']),'motions verified; thumbnail rendered')
    return picture

if __name__=='__main__':
    (ROOT/'public/characters').mkdir(exist_ok=True)
    (ROOT/'outputs').mkdir(exist_ok=True)
    sheet=Image.new('RGB',(1120,1050),(19,27,16));draw=ImageDraw.Draw(sheet)
    try:font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',18)
    except OSError:font=ImageFont.load_default()
    for i,name in enumerate(NAMES):
        pic=render(name);x=i%4*280;y=i//4*350
        sheet.paste(pic,(x,y));draw.text((x+105,y+320),name.upper(),font=font,fill=(200,255,36))
    sheet.save(ROOT/'outputs/rhio-character-catalog.png')
