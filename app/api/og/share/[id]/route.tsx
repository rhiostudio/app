/* Link-preview picture of one shared answer (1200x630 PNG), used as og:image / twitter:image by app/s/[id]/page.tsx.
   Only what the public page shows (lib/share.ts): the agent's name and character, the skill and the start of the
   answer. An id that is not shared (anymore) gets the site's general picture. */
import {ImageResponse} from 'next/og';
import {env} from 'cloudflare:workers';
import {appOrigin} from '@/lib/server';
import {sharedRun,excerpt} from '@/lib/share';
import {getCharacter} from '@/lib/characters';

const W=1200,H=630;
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
 const s=db?await sharedRun(db,id).catch(()=>null):null;
 if(!s)return Response.redirect(`${origin}/og.png`,302);
 const [img,logo]=await Promise.all([asset(`${origin}/characters/card/${getCharacter(s.skin).id}.jpg`,'image/jpeg'),asset(`${origin}/brands/rhio-logo-lime.png`,'image/png')]);
 const quote=excerpt(s.text,230);
 return new ImageResponse(
  <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:'#0b110d',color:'#f4f6f1',fontFamily:'sans-serif'}}>
   <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:720,height:H,padding:'56px 0 56px 64px'}}>
    <div style={{display:'flex',alignItems:'center',gap:14}}>
     {logo?<img src={logo} width={172} height={52}/>:<div style={{display:'flex',fontSize:26,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
     <div style={{display:'flex',fontSize:18,letterSpacing:4,color:'#8a968c',marginLeft:4}}>{s.sample?'WORKFLOW SAMPLE':'ANSWER'}</div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
     <div style={{display:'flex',fontSize:quote.length>150?34:quote.length>80?42:54,lineHeight:1.22,letterSpacing:-1}}>{quote}</div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:14}}>
     <div style={{display:'flex',padding:'10px 20px',borderRadius:12,backgroundColor:'#c8ff24',color:'#0b110d',fontSize:26}}>{s.agentName.length>26?s.agentName.slice(0,25)+'…':s.agentName}</div>
     {s.skillName?<div style={{display:'flex',padding:'9px 16px',borderRadius:999,border:'1px solid #2e4033',color:'#d9e4d6',fontSize:22}}>{s.skillName}</div>:null}
    </div>
   </div>
   {img?<img src={img} width={480} height={H} style={{position:'absolute',right:0,top:0}}/>:null}
  </div>,
  {width:W,height:H,headers:{'Cache-Control':'public, max-age=600'}},
 );
}
