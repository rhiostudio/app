/* Link-preview picture of one page (1200x630 PNG), used by pageMetadata() (lib/page-cards.ts): the page's own headline
   and three points next to a character, a different one per page. The rewards card shows the live vault numbers
   instead (lib/rewards.ts rewardsOverview: public data only). An unknown key gets the site's general picture. */
import {ImageResponse} from 'next/og';
import {env} from 'cloudflare:workers';
import {formatUnits} from 'viem';
import {appOrigin} from '@/lib/server';
import {PAGE_CARDS,isPageCard} from '@/lib/page-cards';
import {rewardsOverview} from '@/lib/rewards';
import {getCharacter} from '@/lib/characters';

const W=1200,H=630;
async function asset(url:string,type:string){
 try{
  const r=await fetch(url);if(!r.ok)return '';
  const b=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,i+0x8000));
  return `data:${type};base64,${btoa(s)}`;
 }catch{return '';}
}
const fixed=(raw:string,dec:number,digits:number)=>Number(formatUnits(BigInt(raw),dec)).toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});

/** Live numbers for the rewards card; null when the program is not running here (the card then shows its plain text). */
async function rewardNumbers(){
 const db=(env as unknown as {DB?:D1Database}).DB;if(!db)return null;
 const o=await rewardsOverview(db,null).catch(()=>null);
 if(!o||!o.live||!o.token||!o.vault)return null;
 const dec=o.token.decimals,sym=o.token.symbol,refills=o.fundings.length;
 return {headline:`${fixed(o.vault.balance,dec,4)} ${sym} in the reward vault`,
  stats:[['Refills',refills?`${refills}, read from the chain`:'none yet'],['Rate',`$${o.usdPerUnitHour}/h per ${Number(o.rhioPerUnit).toLocaleString('en-US')} RHIO`],
   [`${sym} price`,o.price?`$${Number(o.price.usd).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:'waiting'],['Earning now',`${o.recorder?.earners??0} holders`]] as [string,string][]};
}

export async function GET(request:Request){
 const origin=appOrigin(request);
 const key=new URL(request.url).pathname.split('/').filter(Boolean).pop()||'';
 if(!isPageCard(key))return Response.redirect(`${origin}/og.png`,302);
 const c=PAGE_CARDS[key];
 const live=key==='rewards'?await rewardNumbers():null;
 const [img,logo]=await Promise.all([asset(`${origin}/characters/card/${getCharacter(c.character).id}.jpg`,'image/jpeg'),asset(`${origin}/brands/rhio-logo-lime.png`,'image/png')]);
 const headline=live?.headline||c.headline;
 return new ImageResponse(
  <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:'#0b110d',color:'#f4f6f1',fontFamily:'sans-serif'}}>
   <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:720,height:H,padding:'56px 0 56px 64px'}}>
    <div style={{display:'flex',alignItems:'center',gap:14}}>
     {logo?<img src={logo} width={172} height={52}/>:<div style={{display:'flex',fontSize:26,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
     <div style={{display:'flex',fontSize:18,letterSpacing:4,color:'#8a968c',marginLeft:4}}>{c.kicker}</div>
    </div>
    <div style={{display:'flex',fontSize:headline.length>34?56:68,lineHeight:1.06,letterSpacing:-2,color:live?'#c8ff24':'#f4f6f1'}}>{headline}</div>
    {live?<div style={{display:'flex',flexWrap:'wrap',gap:12,width:640}}>
      {live.stats.map(([l,v])=><div key={l} style={{display:'flex',flexDirection:'column',gap:4,width:314,padding:'14px 18px',borderRadius:14,border:'1px solid #2e4033'}}>
       <div style={{display:'flex',fontSize:15,letterSpacing:2,color:'#8a968c'}}>{l.toUpperCase()}</div><div style={{display:'flex',fontSize:23}}>{v}</div></div>)}
     </div>
     :<div style={{display:'flex',flexDirection:'column',gap:12}}>
      {c.lines.map(l=><div key={l} style={{display:'flex',alignItems:'center',gap:14,fontSize:28,color:'#d9e4d6'}}><div style={{display:'flex',width:10,height:10,borderRadius:10,backgroundColor:'#c8ff24'}}/>{l}</div>)}
     </div>}
   </div>
   {img?<img src={img} width={480} height={H} style={{position:'absolute',right:0,top:0}}/>:null}
  </div>,
  {width:W,height:H,headers:{'Cache-Control':`public, max-age=${live?600:86400}`}},
 );
}
