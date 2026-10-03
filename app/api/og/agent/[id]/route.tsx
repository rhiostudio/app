/* Link-preview picture of one published agent (1200x630 PNG), used as og:image / twitter:image by app/a/[id]/page.tsx.
   Public data only (lib/market.ts): name, tagline, skills, price and the character's picture. An agent that is not
   published gets the site's general picture instead, so a private agent cannot be probed through this route. */
import {ImageResponse} from 'next/og';
import {env} from 'cloudflare:workers';
import {appOrigin} from '@/lib/server';
import {publishedAgent,skillLabel,priceLabel} from '@/lib/market';
import {getCharacter} from '@/lib/characters';

const W=1200,H=630;
const clip=(s:string,n:number)=>s.length>n?s.slice(0,n-1).trimEnd()+'…':s;

/** A static file of this site as a data URI (satori cannot read the asset binding). Empty when it cannot be read; the
    card is then drawn without it. Both files come from scripts/render-agent-cards.mjs: the character's panel
    (480x630 JPEG; satori reads JPEG and PNG, not WebP) and the real RHIO logo with a transparent background. */
async function asset(url:string,type:string){
 try{
  const r=await fetch(url);if(!r.ok)return '';
  const b=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,i+0x8000));
  return `data:${type};base64,${btoa(s)}`;
 }catch{return '';}
}

export async function GET(request:Request){
 const origin=appOrigin(request);
 const id=new URL(request.url).pathname.split('/').filter(Boolean).pop()||'';
 const db=(env as unknown as {DB?:D1Database}).DB;
 const a=db?await publishedAgent(db,id).catch(()=>null):null;
 if(!a)return Response.redirect(`${origin}/og.png`,302);
 const [img,logo]=await Promise.all([asset(`${origin}/characters/card/${getCharacter(a.skin).id}.jpg`,'image/jpeg'),asset(`${origin}/brands/rhio-logo-lime.png`,'image/png')]);
 const skills:string[]=(Array.isArray(a.skills)?a.skills:[]).slice(0,4).map((s:string)=>skillLabel(s));
 const name=String(a.name||'Agent'),tagline=String(a.tagline||'');
 return new ImageResponse(
  <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:'#0b110d',color:'#f4f6f1',fontFamily:'sans-serif'}}>
   <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:720,height:H,padding:'56px 0 56px 64px'}}>
    <div style={{display:'flex',alignItems:'center',gap:14}}>
     {logo?<img src={logo} width={172} height={52}/>:<div style={{display:'flex',fontSize:26,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
     <div style={{display:'flex',fontSize:18,letterSpacing:4,color:'#8a968c',marginLeft:4}}>AGENT</div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
     <div style={{display:'flex',fontSize:name.length>18?64:84,lineHeight:1.02,letterSpacing:-2}}>{clip(name,40)}</div>
     {tagline?<div style={{display:'flex',fontSize:30,lineHeight:1.3,color:'#b9c3ba'}}>{clip(tagline,96)}</div>:null}
     <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:6}}>
      {skills.map(s=><div key={s} style={{display:'flex',padding:'8px 16px',borderRadius:999,border:'1px solid #2e4033',color:'#d9e4d6',fontSize:22}}>{s}</div>)}
     </div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:18}}>
     <div style={{display:'flex',padding:'12px 22px',borderRadius:12,backgroundColor:'#c8ff24',color:'#0b110d',fontSize:26}}>{priceLabel(a.price)}</div>
     <div style={{display:'flex',fontSize:22,color:'#8a968c'}}>rhio.studio</div>
    </div>
   </div>
   {img?<img src={img} width={480} height={H} style={{position:'absolute',right:0,top:0}}/>:null}
  </div>,
  {width:W,height:H,headers:{'Cache-Control':'public, max-age=3600'}},
 );
}
