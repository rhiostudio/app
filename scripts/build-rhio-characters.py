"""Build RHIO's original animated GLB companions using only Python's standard library.

These are purpose-built interactive 3D models, not recolors of RobotExpressive.
Run from any directory: python scripts/build-rhio-characters.py
"""
import json
import math
from pathlib import Path
import struct

PI = math.pi


def unit(v):
    length = math.sqrt(sum(x*x for x in v)) or 1
    return [x/length for x in v]


def quaternion(axis, angle):
    return [x*math.sin(angle/2) for x in axis] + [math.cos(angle/2)]


def sphere():
    p, n, ix = [], [], []
    for j in range(25):
        t = PI*j/24
        for i in range(41):
            a = 2*PI*i/40
            v = [math.sin(t)*math.cos(a), math.cos(t), math.sin(t)*math.sin(a)]
            p.append(v)
            n.append(v)
    for j in range(24):
        for i in range(40):
            a=j*41+i
            ix.extend([a,a+1,a+41,a+1,a+42,a+41])
    return p,n,ix


def rounded_box():
    p,n,ix=[],[],[]
    # Rounded cube from six gridded faces projected onto a box Minkowski sum.
    for axis in range(3):
        for sign in [-1,1]:
            start=len(p)
            other=[k for k in range(3) if k!=axis]
            for j in range(13):
                for i in range(13):
                    v=[0.,0.,0.]
                    v[axis]=sign*.5
                    v[other[0]]=i/12-.5
                    v[other[1]]=j/12-.5
                    core=[max(-.34,min(.34,x)) for x in v]
                    normal=unit([v[k]-core[k] for k in range(3)])
                    p.append([core[k]+.16*normal[k] for k in range(3)])
                    n.append(normal)
            for j in range(12):
                for i in range(12):
                    a=start+j*13+i
                    for tri in [(a,a+1,a+13),(a+1,a+14,a+13)]:
                        u=[p[tri[1]][k]-p[tri[0]][k] for k in range(3)]
                        v=[p[tri[2]][k]-p[tri[0]][k] for k in range(3)]
                        cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
                        ix.extend(tri if sum(cross[k]*n[tri[0]][k] for k in range(3))>0 else tri[::-1])
    return p,n,ix


def torus():
    p,n,ix=[],[],[]
    for j in range(65):
        a=2*PI*j/64
        for i in range(13):
            b=2*PI*i/12
            p.append([(1+.075*math.cos(b))*math.cos(a),.075*math.sin(b),(1+.075*math.cos(b))*math.sin(a)])
            n.append([math.cos(b)*math.cos(a),math.sin(b),math.cos(b)*math.sin(a)])
    for j in range(64):
        for i in range(12):
            a=j*13+i
            ix.extend([a,a+1,a+13,a+1,a+14,a+13])
    return p,n,ix


def tailored(torso=False):
    # Elliptical rings create tapered clothing instead of rectangular limb blocks.
    rings=([(-.5,.35,.37),(-.46,.42,.45),(-.22,.43,.48),(.16,.5,.5),(.35,.5,.47),(.46,.43,.36),(.5,.32,.29)] if torso else [(-.5,.24,.24),(-.46,.34,.34),(-.37,.37,.37),(.32,.48,.48),(.43,.46,.46),(.49,.34,.34),(.5,.22,.22)])
    p,n,ix=[],[],[]
    for j,(y,rx,rz) in enumerate(rings):
        before=rings[max(0,j-1)];after=rings[min(len(rings)-1,j+1)]
        dy=after[0]-before[0]
        for i in range(33):
            a=2*PI*i/32;ca,sa=math.cos(a),math.sin(a)
            p.append([rx*ca,y,rz*sa]);n.append(unit([ca/rx,-((after[1]-before[1])*ca*ca/rx+(after[2]-before[2])*sa*sa/rz)/dy,sa/rz]))
    for j in range(len(rings)-1):
        for i in range(32):
            a=j*33+i;ix.extend([a,a+33,a+1,a+1,a+33,a+34])
    for row,up in [(0,False),(len(rings)-1,True)]:
        center=len(p);p.append([0,rings[row][0],0]);n.append([0,1 if up else -1,0])
        for i in range(32):
            a=row*33+i;ix.extend([center,a+1,a] if up else [center,a,a+1])
    return p,n,ix


def shield():
    # A beveled five-sided armor shell, with a raised central plane.
    outline=[(-.9,.8),(.9,.8),(1.,.05),(0.,-1.),(-1.,.05)]
    p,n,ix=[],[],[]
    def triangle(a,b,c):
        u=[b[k]-a[k] for k in range(3)]
        v=[c[k]-a[k] for k in range(3)]
        normal=unit([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]])
        start=len(p)
        p.extend([a,b,c]);n.extend([normal]*3);ix.extend([start,start+1,start+2])
    for i,(x,y) in enumerate(outline):
        xx,yy=outline[(i+1)%5]
        a=[x,y,0];b=[xx,yy,0];c=[x*.84,y*.84,.22];d=[xx*.84,yy*.84,.22]
        triangle([0,0,.28],d,c)
        triangle(a,c,b);triangle(b,c,d)
        triangle([0,0,-.18],a,b)
    return p,n,ix


class Model:
    def __init__(self, name, color):
        self.data=bytearray()
        self.g={"asset":{"version":"2.0","generator":"RHIO original character workshop"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"name":name,"children":[]}],"meshes":[],"materials":[],"accessors":[],"bufferViews":[],"animations":[]}
        self.geometry={}
        for key,fn in [('sphere',sphere),('box',rounded_box),('ring',torus),('shield',shield),('limb',tailored),('torso',lambda:tailored(True))]:
            p,n,ix=fn()
            self.geometry[key]=(self.access(p,'VEC3'),self.access(n,'VEC3'),self.access(ix,'SCALAR',True))
        self.material('Shell',color,.22,.3)
        self.material('Ink',[.012,.024,.025,1],.35,.25)
        self.material('Ceramic',[.77,.84,.78,1],.12,.32)
        self.material('Lime',[.59,1,.015,1],.16,.25,[.22,.5,.002])
        self.material('Lens',[.04,.065,.06,1],.55,.15)
        self.material('Metal',[.17,.22,.21,1],.75,.26)
        self.cache={}

    def access(self,rows,kind,indices=False):
        while len(self.data)%4:self.data.append(0)
        offset=len(self.data)
        flat=rows if kind=='SCALAR' else [x for row in rows for x in row]
        self.data.extend(struct.pack('<'+('H' if indices else 'f')*len(flat),*flat))
        self.g['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(self.data)-offset})
        acc={'bufferView':len(self.g['bufferViews'])-1,'componentType':5123 if indices else 5126,'count':len(rows),'type':kind}
        if kind=='SCALAR':acc.update(min=[min(rows)],max=[max(rows)])
        elif kind=='VEC3':acc.update(min=[min(v[k] for v in rows) for k in range(3)],max=[max(v[k] for v in rows) for k in range(3)])
        self.g['accessors'].append(acc)
        return len(self.g['accessors'])-1

    def material(self,name,color,metal,rough,glow=None):
        mat={'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':metal,'roughnessFactor':rough}}
        if glow:mat['emissiveFactor']=glow
        self.g['materials'].append(mat)

    def group(self,name,at=(0,0,0),parent=0):
        idx=len(self.g['nodes'])
        self.g['nodes'].append({'name':name,'translation':list(at),'children':[]})
        self.g['nodes'][parent]['children'].append(idx)
        return idx

    def part(self,name,shape,mat,at,scale,parent=0,rotation=None):
        key=(shape,mat)
        if key not in self.cache:
            p,n,ix=self.geometry[shape]
            self.cache[key]=len(self.g['meshes'])
            self.g['meshes'].append({'name':shape+' '+mat,'primitives':[{'attributes':{'POSITION':p,'NORMAL':n},'indices':ix,'material':next(i for i,m in enumerate(self.g['materials']) if m['name']==mat)}]})
        idx=self.group(name,at,parent)
        self.g['nodes'][idx].update(mesh=self.cache[key],scale=list(scale))
        if rotation:self.g['nodes'][idx]['rotation']=rotation
        return idx

    def animations(self,arm):
        for name in ['Idle','Wave','Dance','Jump','Spin','Bow','Cheer']:
            samplers=[];channels=[]
            times=[i*3/32 for i in range(33)]
            time_index=self.access(times,'SCALAR')
            def track(node,path,values,kind):
                samplers.append({'input':time_index,'output':self.access(values,kind),'interpolation':'LINEAR'})
                channels.append({'sampler':len(samplers)-1,'target':{'node':node,'path':path}})
            track(0,'translation',[[0,.7*math.sin(PI*t/3)**2,0] if name=='Jump' else [0,.16*math.sin(4*PI*t/3)**2,0] if name=='Cheer' else [0,.055*math.sin(2*PI*t/3),0] if name!='Dance' else [.12*math.sin(2*PI*t/3),.11*(1-math.cos(4*PI*t/3)),0] for t in times],'VEC3')
            track(0,'rotation',[quaternion([0,1,0],2*PI*t/3) if name=='Spin' else quaternion([1,0,0],.3*math.sin(PI*t/3)**2) if name=='Bow' else quaternion([0,0,1],(.025 if name!='Dance' else .16)*math.sin(2*PI*t/3)) for t in times],'VEC4')
            track(arm,'rotation',[quaternion([0,0,1],(.0 if name=='Idle' else -.6-.45*math.sin(4*PI*t/3) if name=='Wave' else -.45*math.sin(4*PI*t/3))) for t in times],'VEC4')
            self.g['animations'].append({'name':name,'samplers':samplers,'channels':channels})

    def save(self,filename):
        while len(self.data)%4:self.data.append(0)
        self.g['buffers']=[{'byteLength':len(self.data)}]
        doc=json.dumps(self.g,separators=(',',':')).encode()
        doc+=b' '*((-len(doc))%4)
        payload=struct.pack('<III',0x46546c67,2,12+8+len(doc)+8+len(self.data))+struct.pack('<II',len(doc),0x4e4f534a)+doc+struct.pack('<II',len(self.data),0x004e4942)+self.data
        filename.write_bytes(payload)
        print(filename.name,len(payload),'bytes',len(self.g['nodes']),'parts',len(self.g['animations']),'animations')


def build_scout():
    m=Model('Scout - orbital research capsule',[.59,1,.015,1])
    m.part('Floating ceramic capsule','sphere','Ceramic',(0,1.85,0),(.85,1.15,.72))
    m.part('Lime crown','sphere','Shell',(0,2.33,-.08),(.84,.7,.69))
    m.part('Dark observation panel','box','Ink',(0,1.94,.59),(1.33,.81,.28))
    for x in [-.32,.32]:
        m.part('Soft square eye','box','Lime',(x,2,.759),(.18,.26,.055))
    m.part('Status smile','box','Ceramic',(0,1.71,.755),(.28,.05,.04))
    m.part('Orbital sensor ring','ring','Metal',(0,1.55,0),(1.22,1.22,1.22),rotation=quaternion([0,0,1],.17))
    for x in [-1,1]:
        m.part('Sensor pod','sphere','Shell',(x*1.16,1.55+x*.2,0),(.21,.25,.25))
        m.part('Sensor glass','sphere','Lens',(x*1.17,1.58+x*.2,.2),(.14,.15,.09))
    m.part('Lower thruster','box','Ink',(0,.79,0),(.6,.28,.6))
    m.part('Thruster core','sphere','Lime',(0,.65,0),(.23,.1,.23))
    m.part('Top antenna stem','box','Metal',(.38,2.93,-.05),(.055,.4,.055))
    m.part('Antenna beacon','sphere','Lime',(.38,3.13,-.05),(.1,.1,.1))
    arm=m.group('Greeting fin',(.85,1.72,-.12))
    m.part('Floating fin','box','Shell',(.2,-.05,0),(.48,.24,.44),arm,quaternion([0,0,1],-.22))
    m.animations(arm)
    return m


def build_maker():
    m=Model('Maker - compact creative workshop',[.48,.3,.85,1])
    m.part('Rounded workshop chassis','box','Shell',(0,1.63,0),(1.72,1.7,1.15))
    m.part('Top ceramic cap','box','Ceramic',(0,2.51,-.04),(1.58,.23,1.01))
    m.part('Face bezel','box','Ink',(0,1.94,.56),(1.4,.94,.25))
    m.part('Glass display','box','Lens',(0,1.94,.7),(1.18,.72,.05))
    for x in [-.3,.3]:m.part('Display eye','box','Lime',(x,2,.74),(.24,.13,.04))
    m.part('Friendly status line','box','Ceramic',(0,1.73,.74),(.3,.065,.04))
    m.part('Front utility drawer','box','Ink',(0,1.16,.59),(1.24,.34,.12))
    for x in [-.35,0,.35]:m.part('Tool slot','box','Ceramic',(x,1.17,.675),(.19,.095,.04))
    for x in [-1,1]:
        m.part('Lower spring','box','Metal',(x*.52,.59,0),(.24,.37,.28))
        m.part('Wide magnetic boot','box','Ink',(x*.52,.36,.12),(.68,.38,.92))
        m.part('Boot accent','box','Shell',(x*.52,.4,.51),(.47,.1,.1))
    m.part('Side arm connector','sphere','Metal',(-.96,1.68,0),(.23,.23,.23))
    m.part('Left tool arm','box','Ceramic',(-1.14,1.45,0),(.25,.66,.28),rotation=quaternion([0,0,1],-.2))
    m.part('Left grip','box','Ink',(-1.19,1.07,.03),(.42,.32,.4))
    arm=m.group('Articulated creator tool',(.98,1.82,0))
    m.part('Shoulder joint','sphere','Metal',(0,0,0),(.22,.22,.22),arm)
    m.part('Raised tool arm','box','Ceramic',(.27,.14,0),(.61,.23,.25),arm,quaternion([0,0,1],.35))
    m.part('Tool housing','box','Shell',(.53,.42,0),(.35,.49,.39),arm)
    m.part('Tool nib','box','Metal',(.53,.74,0),(.13,.3,.13),arm)
    m.part('Creation tip','sphere','Lime',(.53,.91,0),(.11,.11,.11),arm)
    m.part('Top module','box','Shell',(-.38,2.72,0),(.38,.23,.42))
    m.animations(arm)
    return m


def build_guardian():
    m=Model('Guardian - floating sentinel shell',[.77,.84,.8,1])
    m.part('Core sphere','sphere','Ink',(0,1.71,-.08),(.79,.92,.68))
    m.part('Armored shield body','shield','Shell',(0,1.77,.28),(1.05,1.07,1.))
    m.part('Dark face inset','box','Ink',(0,2.23,.48),(1.39,.43,.26))
    for x in [-.31,.31]:m.part('Sentinel eye','box','Lime',(x,2.24,.632),(.28,.08,.035))
    m.part('Central power cell','box','Metal',(0,1.65,.61),(.46,.43,.1))
    for x,y,s in [(-.1,1.75,(.21,.07,.035)),(-.14,1.62,(.07,.19,.035)),(.07,1.58,(.09,.21,.035))]:
        m.part('Modular crest','box','Lime',(x,y,.68),s,rotation=quaternion([0,0,1],.65 if x>0 else 0))
    m.part('Lower shield accent','box','Lime',(0,1.02,.51),(.12,.32,.06))
    m.part('Halo stabilizer','ring','Metal',(0,.73,0),(1.02,1.02,1.02))
    m.part('Hover base','sphere','Lime',(0,.7,0),(.3,.08,.3))
    for sign in [-1,1]:
        pivot=m.group('Right greeting shield' if sign==1 else 'Left stabilizer',(sign*1.02,1.9,-.08))
        m.part('Side armor','shield','Shell',(sign*.21,-.1,0),(.31,.62,.75),pivot,quaternion([0,0,1],-sign*.18))
        m.part('Side status strip','box','Lime',(sign*.21,-.01,.2),(.08,.39,.04),pivot)
        if sign==1:arm=pivot
    m.part('Crown sensor','box','Metal',(0,2.78,0),(.36,.22,.4))
    m.part('Crown signal','box','Lime',(0,2.85,.19),(.22,.055,.04))
    m.animations(arm)
    return m


def linear(hex_color):
    values=[int(hex_color[i:i+2],16)/255 for i in (1,3,5)]
    return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]+[1]


def euler(x=0,y=0,z=0):
    cx,sx=math.cos(x/2),math.sin(x/2)
    cy,sy=math.cos(y/2),math.sin(y/2)
    cz,sz=math.cos(z/2),math.sin(z/2)
    return [sx*cy*cz+cx*sy*sz,cx*sy*cz-sx*cy*sz,cx*cy*sz+sx*sy*cz,cx*cy*cz-sx*sy*sz]


def humanoid_animations(m,rig):
    names=['Idle','Wave','Dance','Walk','Run','Jump','Spin','Bow','Clap','Pray','Think','Cheer']
    for name in names:
        times=[i*4/48 for i in range(49)]
        values={key:[] for key in ['root','chest','head','la','ra','le','re','ll','rl','lk','rk']}
        translations=[]
        for t in times:
            phase=t/4*2*PI;s=math.sin(phase);c=math.cos(phase);ease=math.sin(phase/2)**2
            pose={k:[0,0,0] for k in values}
            pose['la'][2]=-.07;pose['ra'][2]=.07
            bob=.012*(1-c)
            if name=='Wave':pose['ra']=[0,0,2.25];pose['re']=[.5*s,0,.2+.3*math.sin(phase*3)];pose['head'][2]=-.08
            elif name=='Dance':
                bob=.045*(1-math.cos(phase*2));pose['root']=[0,.2*s,.13*s];pose['la']=[-.4,0,-.7-.4*s];pose['ra']=[-.4,0,.7-.4*s];pose['le'][0]=-.8;pose['re'][0]=-.8;pose['ll'][0]=.32*s;pose['rl'][0]=-.32*s
            elif name in ['Walk','Run']:
                stride=math.sin(phase*2);power=.65 if name=='Run' else .4;bob=(.05 if name=='Run' else .02)*(1-math.cos(phase*4));pose['chest'][0]=.15 if name=='Run' else .02
                pose['ll'][0]=power*stride;pose['rl'][0]=-power*stride;pose['lk'][0]=max(0,-stride)*power;pose['rk'][0]=max(0,stride)*power;pose['la'][0]=-power*stride;pose['ra'][0]=power*stride;pose['le'][0]=-.9 if name=='Run' else -.1;pose['re'][0]=-.9 if name=='Run' else -.1
            elif name=='Jump':
                bob=.7*ease;pose['la'][2]=-1.6*ease;pose['ra'][2]=1.6*ease;pose['ll'][0]=-.25*ease;pose['rl'][0]=-.25*ease;pose['lk'][0]=.5*ease;pose['rk'][0]=.5*ease
            elif name=='Spin':pose['root'][1]=phase;pose['la'][2]=-.55;pose['ra'][2]=.55
            elif name=='Bow':pose['chest'][0]=.65*ease;pose['head'][0]=.15*ease;pose['la'][0]=-.2*ease;pose['ra'][0]=-.2*ease
            elif name in ['Clap','Pray']:
                inward=.44+(.16*math.cos(phase*4) if name=='Clap' else .14);pose['la']=[-.6,0,inward];pose['ra']=[-.6,0,-inward];pose['le']=[-1.25,0,.18];pose['re']=[-1.25,0,-.18];pose['head'][0]=.13 if name=='Pray' else 0
            elif name=='Think':pose['ra']=[-.45,0,-.2];pose['re']=[-1.95,0,-.25];pose['head']=[.1,-.12,.08];pose['la']=[-.25,0,.15]
            elif name=='Cheer':
                bob=.1*(1-math.cos(phase*2));pose['la']=[0,0,-2.65+.14*s];pose['ra']=[0,0,2.65+.14*s];pose['le'][0]=-.3;pose['re'][0]=-.3
            else:pose['chest'][2]=.015*s;pose['head'][1]=.07*s
            translations.append([0,bob,0])
            for key in values:values[key].append(euler(*pose[key]))
        samplers=[];channels=[];ti=m.access(times,'SCALAR')
        def track(node,path,v,kind):
            samplers.append({'input':ti,'output':m.access(v,kind),'interpolation':'LINEAR'})
            channels.append({'sampler':len(samplers)-1,'target':{'node':node,'path':path}})
        track(0,'translation',translations,'VEC3')
        for key,v in values.items():track(rig[key],'rotation',v,'VEC4')
        m.g['animations'].append({'name':name,'samplers':samplers,'channels':channels})


HUMANOIDS=[('atlas','#252b31'),('nova','#9b73dd'),('orbit','#d3dfdf'),('kira','#356f69'),('dash','#466dcc'),('byte','#c8ff24'),('echo','#d2759b'),('terra','#a58f55'),('volt','#7487a8')]


def build_humanoid(style,color):
    m=Model(style.title()+' - RHIO articulated avatar',linear(color))
    m.material('Skin',linear('#bd855d'),0,.58)
    m.material('Hair',linear('#261e1c'),0,.65)
    for name,base in [('AccessoryVisor',[.025,.07,.09,1]),('AccessoryHeadphones',[.04,.055,.06,1]),('AccessoryHalo',[.59,1,.015,1])]:
        m.material(name,base,.5,.23)
        if not (style=='atlas' and name=='AccessoryVisor' or style=='echo' and name=='AccessoryHeadphones'):
            m.g['materials'][-1]['pbrMetallicRoughness']['baseColorFactor'][3]=0
        m.g['materials'][-1]['alphaMode']='BLEND'
    rig={'root':0}
    rig['chest']=m.group('Spine',(0,1.76,0))
    chest=rig['chest'];slim=style in ['nova','kira']
    width=.69 if slim else .82
    torso_shape='box' if style in ['byte','volt'] else 'torso'
    m.part('Outfit torso',torso_shape,'Shell',(0,.4,0),(width,.92,.44),chest)
    m.part('Waist','box','Ink',(0,-.02,0),(.59,.26,.39),chest)
    if style=='atlas':
        m.part('Shirt','box','Ceramic',(0,.56,.22),(.29,.51,.045),chest)
        m.part('Necktie','shield','Ink',(0,.54,.27),(.055,.26,.1),chest)
        for sign in [-1,1]:m.part('Tailored lapel','box','Shell',(sign*.19,.57,.26),(.17,.55,.07),chest,euler(0,0,sign*.28))
        for y in [.23,.36]:m.part('Jacket button','sphere','Metal',(.01,y,.255),(.022,.022,.012),chest)
        m.part('Pocket square','box','Ceramic',(-.24,.51,.255),(.12,.05,.02),chest)
    elif style=='orbit':
        m.part('Life support pack','box','Metal',(0,.37,-.37),(.75,.78,.36),chest)
        m.part('Chest instrument','box','Metal',(0,.46,.27),(.42,.34,.15),chest)
        for x in [-.12,0,.12]:m.part('Suit readout','box','Lime',(x,.48,.355),(.055,.11,.025),chest)
    elif style=='kira':
        for sign in [-1,1]:m.part('Long coat panel','box','Shell',(sign*.24,-.26,0),(.43,.8,.49),chest,euler(0,0,sign*.06))
        m.part('Contrast lapel','box','Ceramic',(-.13,.53,.24),(.13,.61,.06),chest,euler(0,0,-.2))
    elif style=='echo':
        m.part('Hoodie pocket','box','Shell',(0,.13,.27),(.48,.22,.08),chest)
        for x in [-.09,.09]:m.part('Drawstring','box','Ceramic',(x,.62,.27),(.024,.31,.03),chest)
        m.part('Hood collar','ring','Shell',(0,.81,-.05),(.25,.55,.25),chest)
    elif style=='terra':
        m.part('Explorer pack','box','Shell',(0,.32,-.4),(.64,.84,.4),chest)
        for sign in [-1,1]:
            m.part('Pack strap','box','Ink',(sign*.24,.4,.26),(.075,.78,.05),chest)
            m.part('Utility pocket','box','Ceramic',(sign*.25,.05,.27),(.24,.23,.1),chest)
    elif style=='byte':
        m.part('Android breastplate','box','Metal',(0,.4,.2),(.62,.62,.16),chest)
        m.part('Core','sphere','Lime',(0,.48,.31),(.12,.12,.035),chest)
    elif style=='volt':
        m.part('Armored chest plate','shield','Shell',(0,.43,.27),(.46,.45,.5),chest)
        m.part('Power spine','box','Lime',(0,.48,.44),(.07,.45,.045),chest)
    else:
        m.part('Jacket center zip','box','Metal',(0,.37,.238),(.035,.83,.035),chest)
        m.part('Chest insignia','box','Lime',(-.22,.58,.255),(.14,.08,.045),chest)
        if style=='nova':m.part('Ribbed collar','ring','Ink',(0,.84,0),(.18,.6,.18),chest)
        if style=='dash':
            for x in [-.28,.28]:m.part('Track stripe','box','Ceramic',(x,.38,.245),(.045,.76,.04),chest)
    rig['head']=m.group('Head',(0,.91,0),chest);head=rig['head']
    robot=style=='byte'
    m.part('Neck','sphere','Metal' if robot else 'Skin',(0,.02,0),(.11,.17,.105),head)
    m.part('Head form','box' if robot else 'sphere','Shell' if robot else 'Skin',(0,.29,0),(.44,.52,.4) if robot else (.235,.29,.22),head)
    if robot:
        m.part('Digital face','box','Ink',(0,.3,.2),(.37,.28,.06),head)
        for x in [-.1,.1]:m.part('Digital eye','box','Lime',(x,.33,.239),(.075,.04,.02),head)
    else:
        for sign in [-1,1]:
            m.part('Ear','sphere','Skin',(sign*.231,.29,0),(.047,.079,.042),head)
            m.part('Eye','sphere','Ink',(sign*.081,.32,.201),(.028,.02,.014),head)
            m.part('Brow','box','Hair',(sign*.084,.369,.197),(.079,.018,.02),head,euler(0,0,sign*.06))
        m.part('Nose','sphere','Skin',(0,.263,.223),(.038,.05,.043),head)
        m.part('Mouth','box','Ink',(0,.17,.204),(.091,.015,.013),head)
        m.part('Hair cap','sphere','Hair',(0,.475,-.023),(.238,.14,.221),head)
        if style in ['nova','kira']:
            for sign in [-1,1]:m.part('Bob side','sphere','Hair',(sign*.205,.26,-.07),(.065,.25,.18),head)
        else:m.part('Swept fringe','box','Hair',(-.025,.43,.173),(.37,.085,.12),head,euler(0,0,.1))
    if style=='orbit':
        m.part('Helmet shell','sphere','Shell',(0,.29,-.055),(.35,.38,.3),head)
        m.part('Helmet front glass','sphere','Lens',(0,.29,.15),(.292,.3,.21),head)
        m.part('Helmet light','box','Lime',(0,.65,.08),(.16,.07,.12),head)
    if style=='terra':
        m.part('Explorer brim','sphere','Shell',(0,.55,0),(.4,.035,.34),head)
        m.part('Hat crown','box','Shell',(0,.65,-.02),(.45,.25,.4),head)
    # All humanoids carry optional accessories, hidden by material alpha when not selected.
    m.part('Optional visor','box','AccessoryVisor',(0,.34,.253),(.51,.17,.115),head)
    for sign in [-1,1]:m.part('Optional headphone ear','box','AccessoryHeadphones',(sign*.3,.3,0),(.14,.24,.22),head)
    m.part('Optional headphone band','ring','AccessoryHeadphones',(0,.3,0),(.32,.32,.32),head,euler(PI/2,0,0))
    m.part('Optional halo','ring','AccessoryHalo',(0,.8,0),(.34,.34,.34),head)
    for sign,key in [(-1,'l'),(1,'r')]:
        shoulder=m.group(key+' shoulder',(sign*(width/2+.065),.7,0),chest);rig[key+'a']=shoulder
        if style=='volt':m.part('Large shoulder armor','box','Shell',(sign*.04,-.03,0),(.46,.37,.55),shoulder)
        m.part('Upper sleeve','box' if robot else 'limb','Shell',(0,-.23,0),(.255,.52,.29),shoulder)
        elbow=m.group(key+' elbow',(0,-.48,0),shoulder);rig[key+'e']=elbow
        m.part('Elbow joint','sphere','Metal' if robot else 'Shell',(0,0,0),(.11,.11,.12),elbow)
        m.part('Lower sleeve','box' if robot else 'limb','Shell',(0,-.205,.01),(.205,.41,.24),elbow)
        m.part('Cuff','box','Ceramic',(0,-.4,.015),(.22,.08,.25),elbow)
        m.part('Accent wristband','box','Lime',(0,-.385,.145),(.13,.035,.04),elbow)
        m.part('Hand','box','Metal' if robot or style=='orbit' else 'Skin',(0,-.51,.025),(.17,.19,.14),elbow)
        m.part('Thumb','sphere','Metal' if robot or style=='orbit' else 'Skin',(-sign*.091,-.485,.055),(.04,.065,.04),elbow)
        hip=m.group(key+' hip',(sign*.19,1.64,0));rig[key+'l']=hip
        m.part('Trouser thigh','box' if robot else 'limb','Shell' if style!='atlas' else 'Ink',(0,-.335,0),(.29,.67,.34),hip)
        knee=m.group(key+' knee',(0,-.67,0),hip);rig[key+'k']=knee
        m.part('Trouser shin','box' if robot else 'limb','Shell' if style not in ['atlas','kira'] else 'Ink',(0,-.305,0),(.25,.61,.3),knee)
        m.part('Boot','box','Ink',(0,-.68,.1),(.3,.24,.53),knee)
        m.part('Sole','box','Ceramic',(0,-.78,.1),(.31,.07,.54),knee)
        if style in ['dash','volt']:m.part('Knee accent','box','Lime',(0,-.02,.17),(.14,.16,.04),knee)
    humanoid_animations(m,rig)
    return m


if __name__=='__main__':
    out=Path(__file__).resolve().parent.parent/'public/models'
    out.mkdir(parents=True,exist_ok=True)
    for name,build in [('scout',build_scout),('maker',build_maker),('guardian',build_guardian)]:
        build().save(out/f'rhio-{name}.glb')
    for name,color in HUMANOIDS:
        build_humanoid(name,color).save(out/f'rhio-{name}.glb')
