/* Link-preview picture of one page (1200x630 PNG), used by pageMetadata() (lib/page-cards.ts): the page's own headline
   and three points next to a character, a different one per page. The rewards card shows the live vault numbers
   instead (lib/rewards.ts rewardsOverview: public data only). The tiers card has its own layout: the character on the
   left, and one tile per tier with what it needs and gives here. The invite card shows two characters and what an
   invitation gives on this server right now (lib/referrals.ts). The agent teams card is drawn like the website: two
   cards of the hero deck on the page background. An unknown key gets the site's general picture. */
import {ImageResponse} from 'next/og';
import {env} from 'cloudflare:workers';
import {formatUnits} from 'viem';
import {appOrigin} from '@/lib/server';
import {PAGE_CARDS,isPageCard,type PageCard} from '@/lib/page-cards';
import {rewardsOverview} from '@/lib/rewards';
import {tierRows} from '@/lib/schedules';
import {referralConfig,referralProgram} from '@/lib/referrals';
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
 const c:PageCard=PAGE_CARDS[key];
 const live=key==='rewards'?await rewardNumbers():null;
 const [img,logo]=await Promise.all([asset(`${origin}/characters/card/${getCharacter(c.character).id}.jpg`,'image/jpeg'),asset(`${origin}/brands/rhio-logo-lime.png`,'image/png')]);
 const headline=live?.headline||c.headline;
 const tiers=key==='tiers'?tierRows():null;
 if(key==='invite'||key==='referral'){
  // the same picture for every invite link: it says what an invitation gives, never who sent it
  const ref=referralConfig();const credits=ref.enabled?ref.credits:0;
  const pair=await asset(`${origin}/characters/card/pair-invite.jpg`,'image/jpeg');
  // the program page says what the inviter gets (the holder reward boost, where it runs); an invite link says what the
  // invited person gets
  const prog=key==='referral'?referralProgram():null;const b=prog?.boost||null;
  const head=key==='referral'?(b?['Invite friends.',`Earn up to ${(1+b.percent*b.maxFriends/100).toFixed(1)}x`,`${b.token} rewards.`]:credits>0?['Invite friends.','You both get',`${credits} free credits.`]:['Invite friends','to build an AI agent','with a face.'])
   :credits>0?['You are invited.','You both get',`${credits} free credits.`]:['You are invited.','Build an AI agent','with a face.'];
  const points=key==='referral'?(b?[`+${b.percent}% per friend who holds ${Number(b.unit)>=1e6?`${Number(b.unit)/1e6}M`:Number(b.unit).toLocaleString('en-US')} RHIO`,`Up to ${b.maxFriends} friends`,...(credits>0?[`${credits} free credits each, too`]:[])]:c.lines)
   :credits>0?['Sign in with a new account','Run your first task',`${credits} free credits for you and your friend`]:c.lines;
  return new ImageResponse(
   <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:'#0b110d',color:'#f4f6f1',fontFamily:'sans-serif'}}>
    {pair?<img src={pair} width={640} height={H} style={{position:'absolute',right:-30,top:0}}/>:null}
    <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:640,height:H,padding:'52px 0 48px 60px'}}>
     <div style={{display:'flex',alignItems:'center',gap:14}}>
      {logo?<img src={logo} width={160} height={48}/>:<div style={{display:'flex',fontSize:26,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
      <div style={{display:'flex',fontSize:17,letterSpacing:4,color:'#8a968c',marginLeft:4}}>{c.kicker}</div>
     </div>
     <div style={{display:'flex',flexDirection:'column'}}>
      {head.map((l,i)=><div key={l} style={{display:'flex',fontSize:68,lineHeight:1.1,letterSpacing:-2.5,color:i===2?'#c8ff24':'#f4f6f1'}}>{l}</div>)}
     </div>
     <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {points.map(l=><div key={l} style={{display:'flex',alignItems:'center',gap:14,fontSize:25,color:'#d9e4d6'}}><div style={{display:'flex',width:10,height:10,borderRadius:10,backgroundColor:'#c8ff24'}}/>{l}</div>)}
     </div>
    </div>
   </div>,
   {width:W,height:H,headers:{'Cache-Control':'public, max-age=600'}},
  );
 }
 if(key==='teams'){
  // In the website's own style: the page background, a two-tone headline, mono labels, and two
  // cards of the hero deck (a lime one and an iris one), the first agent handing over to the second.
  const [one,two]=await Promise.all([asset(`${origin}/characters/card/team-atlas.png`,'image/png'),asset(`${origin}/characters/card/team-nova.png`,'image/png')]);
  const INK='#1f201e',BG='#171816',TEXT='#f3f4ef',MUTED='#a0a59c',LINE='rgba(255,255,255,0.14)';
  const deck=[{n:'#01',tag:'RESEARCHER',title:'Answers the task',bg:'#c8ff24',fg:INK,img:one,left:628,top:112,turn:-4},
   {n:'#02',tag:'WRITER',title:'Works from that answer',bg:'#5b5bf6',fg:'#ffffff',img:two,left:886,top:150,turn:4}];
  return new ImageResponse(
   <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:BG,color:TEXT,fontFamily:'sans-serif'}}>
    <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:600,height:H,padding:'54px 0 52px 64px'}}>
     <div style={{display:'flex',alignItems:'center',gap:18}}>
      {logo?<img src={logo} width={146} height={44}/>:<div style={{display:'flex',fontSize:24,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
      <div style={{display:'flex',alignItems:'center',gap:10,fontSize:16,letterSpacing:3.5,color:MUTED}}><div style={{display:'flex',width:9,height:9,borderRadius:9,backgroundColor:'#c8ff24'}}/>{c.kicker}</div>
     </div>
     <div style={{display:'flex',flexDirection:'column',fontSize:72,lineHeight:1.04,letterSpacing:-3}}>
      <div style={{display:'flex',color:MUTED}}>One agent</div>
      <div style={{display:'flex',color:MUTED}}>hands its work</div>
      <div style={{display:'flex',color:TEXT}}>to the next.</div>
     </div>
     <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:10}}>
       {['YOUR AGENTS','HIRED AGENTS','2 TO 3 STEPS'].map(l=><div key={l} style={{display:'flex',alignItems:'center',flexShrink:0,height:40,padding:'0 16px',borderRadius:999,border:`1px solid ${LINE}`,fontSize:14,letterSpacing:2,whiteSpace:'nowrap',color:TEXT}}>{l}</div>)}
      </div>
      <div style={{display:'flex',fontSize:15,letterSpacing:2.6,color:MUTED}}>RHIO.STUDIO/TEAMS</div>
     </div>
    </div>
    {deck.map(d=><div key={d.n} style={{display:'flex',flexDirection:'column',justifyContent:'space-between',position:'absolute',left:d.left,top:d.top,width:268,height:366,padding:20,borderRadius:22,backgroundColor:d.bg,color:d.fg,transform:`rotate(${d.turn}deg)`,boxShadow:'0 24px 60px rgba(0,0,0,0.45)'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:14,letterSpacing:2.2}}>
      <div style={{display:'flex'}}>{d.n}</div>
      <div style={{display:'flex',padding:'4px 10px',borderRadius:9,border:`1px solid ${d.fg==='#ffffff'?'rgba(255,255,255,0.35)':'rgba(31,32,30,0.3)'}`}}>{d.tag}</div>
     </div>
     {d.img?<img src={d.img} width={195} height={260} style={{position:'absolute',left:36,top:44}}/>:null}
     <div style={{display:'flex',fontSize:25,lineHeight:1.1,letterSpacing:-0.8}}>{d.title}</div>
    </div>)}
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',left:858,top:286,width:76,height:76,borderRadius:76,backgroundColor:INK,border:`5px solid ${BG}`}}>
     <svg width="36" height="36" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" stroke="#c8ff24" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
   </div>,
   {width:W,height:H,headers:{'Cache-Control':'public, max-age=3600'}},
  );
 }
 if(c.layout==='left')return new ImageResponse(
  <div style={{width:W,height:H,display:'flex',position:'relative',backgroundColor:'#0b110d',color:'#f4f6f1',fontFamily:'sans-serif'}}>
   {img?<img src={img} width={480} height={H} style={{position:'absolute',left:-40,top:0}}/>:null}
   <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',position:'absolute',left:420,top:0,width:780,height:H,padding:'52px 60px 52px 0'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
     <div style={{display:'flex',fontSize:18,letterSpacing:4,color:'#8a968c'}}>{c.kicker}</div>
     {logo?<img src={logo} width={146} height={44}/>:<div style={{display:'flex',fontSize:24,letterSpacing:6,color:'#c8ff24'}}>RHIO</div>}
    </div>
    <div style={{display:'flex',fontSize:70,lineHeight:1.02,letterSpacing:-2.5}}>{c.headline}</div>
    {tiers?<div style={{display:'flex',flexWrap:'wrap',gap:12}}>
      {tiers.map(t=><div key={t.id} style={{display:'flex',flexDirection:'column',gap:6,width:354,padding:'14px 18px',borderRadius:16,border:t.id==='studio'?'1px solid #c8ff24':'1px solid #2e4033',backgroundColor:t.id==='studio'?'#141f0c':'#0f1711'}}>
       <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><div style={{display:'flex',fontSize:27,color:t.id==='studio'?'#c8ff24':'#f4f6f1'}}>{t.name}</div>
        <div style={{display:'flex',fontSize:16,color:'#8a968c'}}>{t.min==='0'?'no RHIO needed':`${Number(t.min).toLocaleString('en-US')}+ RHIO`}</div></div>
       <div style={{display:'flex',flexDirection:'column',fontSize:18,lineHeight:1.35,color:'#b9c3ba'}}><div style={{display:'flex'}}>{`${t.schedules} schedules · ${t.channels} channels`}</div><div style={{display:'flex'}}>{`${t.dailyRuns} scheduled runs a day`}</div></div>
      </div>)}
     </div>
     :<div style={{display:'flex',flexDirection:'column',gap:12}}>
      {c.lines.map(l=><div key={l} style={{display:'flex',alignItems:'center',gap:14,fontSize:28,color:'#d9e4d6'}}><div style={{display:'flex',width:10,height:10,borderRadius:10,backgroundColor:'#c8ff24'}}/>{l}</div>)}
     </div>}
   </div>
  </div>,
  {width:W,height:H,headers:{'Cache-Control':'public, max-age=3600'}},
 );
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
