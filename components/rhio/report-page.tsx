'use client';
/* Public daily reward report (/report, /report/<day>): the holder reward program in a handful of live numbers and a
   post that is ready to copy (GET /api/report, lib/report.ts, lib/report-text.ts). "Earned" means allocated to
   holders and claimable: holders claim from the vault themselves; a settled hour is a period, not a payout. Its link
   preview comes from app/report/page.tsx and /api/og/page/report;
   the day in the address only makes each day's link a new one, so a post shows that day's picture. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {api,copyText,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import type {View} from '@/lib/routes';
import {leftText,postLength,POST_MAX,type Report} from '@/lib/report-text';
import {SiteFooter} from './site-footer';

type Go=(v:View,doc?:string)=>void;

export function ReportPage({onNavigate}:{onNavigate:Go}){
 const [r,setR]=useState<Report|null>(null);const [state,setState]=useState<'loading'|'ready'|'off'>('loading');
 useEffect(()=>{let alive=true;const load=()=>api('/api/report').then(d=>{if(!alive)return;if(d.live){setR(d.report);setState('ready');}else setState('off');}).catch(()=>{if(alive)setState(s=>s==='ready'?s:'off');});
  load();const t=setInterval(load,120e3);return()=>{alive=false;clearInterval(t);};},[]);
 if(state==='off')return <>
  <section className="mx-auto grid min-h-[calc(100svh-var(--top)-40px)] max-w-[1120px] content-center gap-6 px-[clamp(16px,3vw,32px)] py-16">
   <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">RHIO · Holder rewards</span>
   <h1 className="font-display text-[clamp(40px,7vw,84px)] leading-[.96] font-medium tracking-[-.05em]">Reward report</h1>
   <p className="max-w-[60ch] rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Holder rewards are not running on this server, or no period has been settled yet.</p>
   <div><Button variant="outline" onClick={()=>onNavigate('home')}>Go home</Button></div>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
 const tiles:[string,string,string][]=r?[['Earned by holders',`${r.earned} ${r.symbol}`,`about ${r.earnedUsd} · claimable`],['Periods settled',r.periods.toLocaleString('en-US'),r.periodHours===1?'one every hour':`one every ${r.periodHours} hours`],
  ['Wallets earning',r.earners.toLocaleString('en-US'),`of ${r.holders.toLocaleString('en-US')} holding RHIO`],['Free in the vault',`${r.free} ${r.symbol}`,r.waiting?'less than a period needs: waiting for a refill':r.hoursLeft===null?`about ${r.freeUsd}`:`about ${r.freeUsd} · ${leftText(r.hoursLeft)} at today's rate`]]:[];
 const post=r?`https://x.com/intent/post?text=${encodeURIComponent(r.tweet)}`:'#';
 return <>
  <section className="mx-auto grid max-w-[1120px] gap-10 px-[clamp(16px,3vw,32px)] pt-10 pb-16">
   <div className="grid gap-3">
    <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">RHIO · Holder rewards</span>
    <h1 className="font-display text-[clamp(40px,7vw,84px)] leading-[.96] font-medium tracking-[-.05em]">{r?`Day ${r.day}`:'Reward report'}</h1>
    <p className="max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">{r?<>Since {new Date(r.since*1000).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})}. {r.rate}, at {r.price} per {r.symbol}.</>:'Reading the numbers…'}</p>
   </div>
   <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(r?tiles:Array.from({length:4},(_,i)=>[String(i),'—',''] as [string,string,string])).map(([l,v,h])=>
    <div key={l} className="grid gap-1 rounded-xl border bg-card p-4"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">{r?l:' '}</span>
     <b className="font-display text-[clamp(24px,3.2vw,36px)] leading-none font-medium tracking-[-.03em] tabular-nums">{v}</b><span className="text-[12px] text-muted-foreground">{h||' '}</span></div>)}</div>
   {r&&<div className="grid gap-3 rounded-2xl border bg-card p-6">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="font-display text-xl font-medium tracking-[-.02em]">Today&apos;s post, ready to copy</b><span className="font-mono text-[11px] text-muted-foreground">{postLength(r.tweet,r.link)} of {POST_MAX} characters on X</span></div>
    <pre className="overflow-x-auto rounded-xl border bg-secondary/50 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{r.tweet}</pre>
    <div className="flex flex-wrap gap-2">
     <Button onClick={()=>copyText(r.tweet,toast.success,toast.error)}><I id="copy"/>Copy post</Button>
     <Button variant="outline" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Open in X</a></Button>
     <Button variant="outline" asChild><a href={`/api/og/page/report?v=${r.day}-${Math.floor(Date.now()/3600e3)}`} target="_blank" rel="noreferrer noopener"><I id="download"/>Open the picture</a></Button>
     <Button variant="outline" onClick={()=>onNavigate('rewards')}>Rewards page<I id="arrow"/></Button>
    </div>
   </div>}
   {r?.waiting&&<p className="max-w-[80ch] rounded-xl border px-4 py-3 text-[13.5px]"><b className="font-medium">Periods are waiting for a refill.</b> <span className="text-muted-foreground">A period is only settled when the vault can cover everything it owes. The hours that wait are settled once it is refilled; nothing earned is lost.</span></p>}
   <p className="max-w-[80ch] text-[12.5px] text-muted-foreground">&quot;Earned&quot; is what has been allocated to holders and can be claimed; each holder claims from the reward vault with their own wallet{r?.claimed?`, and ${r.claimed} ${r.symbol} has been claimed so far`:''}. The dollar figures use the latest price the server holds and move with it. The reward contract has no independent audit and there is no published legal review of these payouts; the details and restrictions are in the whitepaper. Not financial advice.</p>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}
