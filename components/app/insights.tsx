'use client';
/* Insights (/dashboard/insights): what one of the account's own agents did in the last seven days (GET /api/insights,
   lib/insights.ts). People and answers, credits earned, marks, where it answered, and how its sources held up, with
   the questions they did not cover from the creator's own channels (their site, their Telegram chats, their own
   messages). What other accounts asked on the agent's page is counted, never shown.
   The chart: answers per day over fourteen days, two series stacked. Its two colours are the site's iris and a
   deeper step of its coral: that pair passes the lightness, colour-blind separation and contrast checks on both the
   dark and the light card (lime, the brand fill, does not: it is too light to be a mark on white). Identity is never
   colour alone: a legend, a tooltip per day and a table view carry the same numbers. */
import {useCallback,useEffect,useState} from 'react';
import {api,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {Thumb} from '@/components/landing/mocks';
import type {CharacterId} from '@/lib/characters';
import type {Insights} from '@/lib/insights';
import {DashPage,EmptyState,Kpi,KpiRow,PageHeader} from './parts';

const SERIES=[{key:'others' as const,label:'To other people',color:'#5b5bf6'},{key:'own' as const,label:'Paid by you',color:'#e8590c'}];
const num=(v:number)=>v.toLocaleString('en-US');
const dayLabel=(d:string)=>new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined,{day:'numeric',month:'short',timeZone:'UTC'});
/** "+3 on the 7 days before", "same as the 7 days before", or nothing to compare with. */
const against=(now:number,before:number)=>now===before?'Same as the 7 days before':`${now>before?'+':'−'}${num(Math.abs(now-before))} on the 7 days before`;

/** Answers per day, stacked: to other people, and paid by the creator. */
function DailyChart({series}:{series:Insights['series']}){
 const [on,setOn]=useState<number|null>(null);
 const top=Math.max(1,...series.map(s=>s.others+s.own));
 const total=series.reduce((a,s)=>a+s.others+s.own,0);const H=132;
 const h=(v:number)=>Math.max(v>0?3:0,Math.round(v*H/top));
 const shown=on!==null?series[on]:null;
 return <div className="grid gap-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <b className="text-[15px] font-semibold">Answers per day <span className="font-normal text-muted-foreground">· last 14 days (UTC)</span></b>
   <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">{SERIES.map(s=><li key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{background:s.color}}/>{s.label}</li>)}</ul>
  </div>
  <div className="relative">
   <span className="absolute -top-1 left-0 font-mono text-[10.5px] text-muted-foreground tabular-nums">{num(top)}</span>
   <div role="img" aria-label={`Answers per day over the last 14 days: ${num(total)} in all. The table below has every value.`} className="flex items-end gap-[6px] border-b pt-4 pl-7" style={{height:H+16}}>
    {series.map((s,i)=><div key={s.day} className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center" onMouseEnter={()=>setOn(i)} onMouseLeave={()=>setOn(v=>v===i?null:v)} onFocus={()=>setOn(i)} onBlur={()=>setOn(v=>v===i?null:v)} tabIndex={0} aria-label={`${dayLabel(s.day)}: ${s.others} to other people, ${s.own} paid by you`}>
     <div className={cn('flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity',on!==null&&on!==i&&'opacity-45')}>
      {SERIES.map((k,j)=>{const v=s[k.key];if(!v)return null;const last=j===SERIES.length-1||!SERIES.slice(j+1).some(x=>s[x.key]);return <span key={k.key} style={{height:h(v),background:k.color}} className={last?'rounded-t-[4px]':''}/>;})}
     </div>
    </div>)}
   </div>
   {shown&&<div className="pointer-events-none absolute -top-2 right-0 grid gap-0.5 rounded-lg border bg-popover px-3 py-2 text-[12px] shadow-sm" role="status">
    <b className="font-medium">{dayLabel(shown.day)}</b>{SERIES.map(k=><span key={k.key} className="flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-[2px]" style={{background:k.color}}/>{k.label}<b className="ml-auto pl-3 font-medium text-foreground tabular-nums">{num(shown[k.key])}</b></span>)}</div>}
   <div className="flex justify-between pt-1.5 pl-7 font-mono text-[10.5px] text-muted-foreground"><span>{series[0]?dayLabel(series[0].day):''}</span><span>{series[series.length-1]?dayLabel(series[series.length-1].day):''}</span></div>
  </div>
  <details className="text-[12.5px]"><summary className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground">Show as a table</summary>
   <table className="mt-2 w-full max-w-md border-collapse text-left tabular-nums"><thead><tr className="border-b text-muted-foreground"><th className="py-1 font-normal">Day</th>{SERIES.map(k=><th key={k.key} className="py-1 text-right font-normal">{k.label}</th>)}</tr></thead>
    <tbody>{series.map(s=><tr key={s.day} className="border-b border-border/50"><td className="py-1">{dayLabel(s.day)}</td>{SERIES.map(k=><td key={k.key} className="py-1 text-right">{num(s[k.key])}</td>)}</tr>)}</tbody></table></details>
 </div>;
}

export function InsightsPage({auth,tick,onSignIn,onSources,onStart}:{auth:boolean;/** changes whenever the account's agents were loaded again */tick:unknown;onSignIn:()=>void;
 /** opens the Studio on the persona tab (sources) for that agent */onSources:(agentId:string)=>void;onStart:()=>void}){
 const [d,setD]=useState<Insights|null>(null);
 const [pick,setPick]=useState<string|null>(()=>{try{return new URLSearchParams(location.search).get('agent');}catch{return null;}});
 const load=useCallback(()=>{if(!auth){setD(null);return;}api(`/api/insights${pick?`?agent=${encodeURIComponent(pick)}`:''}`).then(setD).catch(()=>null);},[pick,auth]);
 useEffect(()=>{load();},[load,tick]);
 const a=d?.agent||null;const n=d?.now||null;const b=d?.before||null;const own=d?.own||null;
 const marks=n?n.up+n.down:0;const read=n&&own?n.covered+n.uncovered+own.covered+own.uncovered:0;const missed=n&&own?n.uncovered+own.uncovered:0;
 const quiet=!!d&&!!n&&!!own&&n.answers===0&&n.failed===0&&own.site===0&&own.telegram===0&&d.series.every(s=>!s.others&&!s.own);
 const WHERE={site:'Your site',telegram:'Telegram',you:'You'} as const;
 return <DashPage>
  <PageHeader title="Insights" icon="hype" tone="iris" text="What your agent did in the last seven days: who it answered, what you earned, and where its sources fell short."/>
  {!auth?<EmptyState title="Connect a wallet to see your agents" text="Insights are read from your own agents' runs." action={<Button onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>}/>
  :!d?<p className="grid h-40 place-items-center rounded-xl border text-sm text-muted-foreground">Reading the week…</p>
  :!a?<EmptyState title="No agent yet" text="Save an agent in the Studio, publish it, and its week shows up here." action={<Button onClick={onStart}>Open the launch guide<I id="arrow"/></Button>}/>
  :<>
   {d.agents.length>1&&<div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">Agent</span>
    {d.agents.slice(0,12).map(x=><button key={x.id} type="button" onClick={()=>setPick(x.id)} aria-pressed={a.id===x.id} className={cn('flex h-9 items-center gap-2 rounded-lg border bg-card pr-3 pl-1 text-[13px] font-medium transition-colors',a.id===x.id?'border-lime bg-lime/10':'hover:border-foreground/30')}>
     <Thumb id={x.skin as CharacterId} className="size-7 rounded-md object-[50%_18%]"/>{x.name}</button>)}</div>}
   {!a.published&&<p className="rounded-lg border px-3 py-2 text-[13px] text-muted-foreground"><b className="font-medium text-foreground">{a.name}</b> is not published, so other people cannot use it yet. Its numbers below are your own site, your Telegram chats and your own messages.</p>}
   {n&&b&&<KpiRow>
    <Kpi label="People" value={num(n.people)} hint={against(n.people,b.people)} tone="iris" icon="users"/>
    <Kpi label="Answers to them" value={num(n.answers)} hint={n.answers?`${num(n.chats)} chat · ${num(n.answers-n.chats)} task${n.failed?` · ${num(n.failed)} failed, refunded`:''}`:against(n.answers,b.answers)} tone="sky" icon="layers"/>
    <Kpi label="Credits earned" value={num(n.earned)} hint={against(n.earned,b.earned)} tone="lime" icon="coins"/>
    <Kpi label="Helpful marks" value={marks?`${Math.round(n.up*100/marks)}%`:'—'} hint={marks?`${num(n.up)} helpful · ${num(n.down)} not`:'No marks this week'} tone="mint" icon="check"/>
   </KpiRow>}
   {quiet?<EmptyState title="A quiet week" text={a.published?'Nobody got an answer from this agent in the last seven days. Post its link, put it on your site or into a Telegram chat.':'Publish it, or put it on your site, and its answers show up here.'} action={<Button onClick={onStart}>Open the launch guide<I id="arrow"/></Button>}/>
   :<section className="rounded-xl border bg-card p-5"><DailyChart series={d.series}/></section>}
   {own&&n&&<div className="grid gap-3 lg:grid-cols-2">
    <section className="grid content-start gap-3 rounded-xl border bg-card p-5">
     <b className="text-[15px] font-semibold">Where it answered <span className="font-normal text-muted-foreground">· 7 days</span></b>
     <ul className="grid gap-2 text-[13.5px]">
      {[['Its page, Discover and the plaza',n.answers,'paid by the people who asked'],['Your own site',own.site,'paid by you'],['Your Telegram chats',own.telegram,'paid by you']].map(([t,v,by])=><li key={String(t)} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"><span>{t}<span className="text-muted-foreground"> · {by}</span></span><b className="font-medium tabular-nums">{num(Number(v))}</b></li>)}
     </ul>
     <p className="text-[12.5px] text-muted-foreground">{own.spent?`Your site and Telegram answers cost you ${num(own.spent)} credits this week.`:'Nothing was paid by you on your site or in Telegram this week.'} Credits you earn stay on RHIO.</p>
    </section>
    <section className="grid content-start gap-3 rounded-xl border bg-card p-5">
     <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[15px] font-semibold">Its sources <span className="font-normal text-muted-foreground">· 7 days</span></b><Button size="sm" variant="outline" onClick={()=>onSources(a.id)}>{d.sources?'Edit sources':'Add a source'}<I id="arrow"/></Button></div>
     {d.sources===0?<p className="text-[13.5px] text-muted-foreground">This agent has no sources, so it answers from its instructions alone. Paste your notes, an FAQ or an old thread and it answers from them.</p>
     :read===0?<p className="text-[13.5px] text-muted-foreground">{num(d.sources)} source{d.sources===1?'':'s'}. No answer has read them yet this week.</p>
     :<><p className="text-[13.5px]"><b className="font-medium tabular-nums">{num(read-missed)} of {num(read)}</b> answers used a source. <b className="font-medium tabular-nums">{num(missed)}</b> did not: the sources had nothing on the question, or it was small talk.</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${read-missed} of ${read} answers used a source`}><div className="h-full rounded-full bg-foreground" style={{width:`${Math.round((read-missed)*100/read)}%`}}/></div>
      {n.uncovered>0&&<p className="text-[12.5px] text-muted-foreground">{num(n.uncovered)} of those {n.uncovered===1?'was':'were'} asked by other people on its page. Their questions are theirs, so only the count is shown.</p>}</>}
    </section>
   </div>}
   {d.sources>0&&<section className="grid gap-3 rounded-xl border bg-card p-5">
    <b className="text-[15px] font-semibold">Asked, but not in its sources <span className="font-normal text-muted-foreground">· from your site, your Telegram chats and your own messages, 14 days</span></b>
    {d.gaps.length===0?<p className="text-[13.5px] text-muted-foreground">Nothing yet. When someone on your site or in your Telegram chat asks something the sources do not cover, it is listed here.</p>
    :<ul className="grid gap-1.5">{d.gaps.map((g,i)=><li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg border bg-secondary/30 px-3 py-2">
      <span className="min-w-0 flex-1 basis-64 text-[13.5px] break-words">{g.asked}</span>
      <span className="font-mono text-[10.5px] tracking-[.04em] text-muted-foreground uppercase">{WHERE[g.where]} · {g.kind==='nomatch'?'nothing matched':'passages not used'} · {new Date(g.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</span></li>)}</ul>}
    <p className="text-[12.5px] text-muted-foreground">A question lands here when no passage shared words with it, or when the AI was given passages and said it used none. That includes small talk, so read it as a list of candidates for a new source, not as errors.</p>
   </section>}
  </>}
 </DashPage>;
}
