'use client';
/* The weekly board (/top): the published agents that were used most in the last seven days (GET /api/board,
   lib/board.ts). The first three stand on cards of the hero deck, the rest are rows. An agent's place comes from how
   many different accounts used it, then from how many runs; its creator's own runs do not count. Next to each: how it
   moved against the seven days before. The board gives nothing (no credits, no better place elsewhere): it is a list
   of what was used. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {useThumb} from '@/app/avatar';
import {api,copyText,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {getCharacter,lookFor} from '@/lib/characters';
import type {Board,BoardEntry} from '@/lib/board';
import type {View} from '@/lib/routes';
import {SiteFooter} from './site-footer';

type Go=(v:View,doc?:string)=>void;
/** The first three colours of the hero deck. */
const DECK=[['bg-lime','text-ink'],['bg-iris','text-white'],['bg-coral','text-ink']] as const;
const plural=(n:number,one:string,many:string)=>`${n.toLocaleString('en-US')} ${n===1?one:many}`;
const move=(e:BoardEntry)=>e.before===null?{text:'NEW',tone:'text-lime'}:e.before>e.rank?{text:`▲ ${e.before-e.rank}`,tone:'text-lime'}:e.before<e.rank?{text:`▼ ${e.rank-e.before}`,tone:'text-coral'}:{text:'—',tone:'text-muted-foreground'};
const moveTitle=(e:BoardEntry)=>e.before===null?'Not on the list in the seven days before':e.before===e.rank?'Same place as in the seven days before':`Place ${e.before} in the seven days before`;

/** One of the first three: a card of the deck with its place, the character and its numbers. */
function Podium({e,onOpen}:{e:BoardEntry;onOpen:()=>void}){
 const a=e.agent;const src=useThumb(lookFor(a.skin,a.look,a.appearance),a.skin,true);const [bg,fg]=DECK[e.rank-1]||DECK[0];const m=move(e);
 return <button type="button" onClick={onOpen} aria-label={`Open ${a.name}, place ${e.rank}`}
  className={cn('group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl p-4 text-left outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1',bg,fg)}>
  <span className="relative z-10 flex items-center justify-between gap-2 font-mono text-[10.5px] font-semibold tracking-[.1em] uppercase">
   <span>#{String(e.rank).padStart(2,'0')}</span>
   <span className="flex min-w-0 items-center gap-1 rounded-lg border border-current/25 px-2 py-0.5" title={moveTitle(e)}>{m.text}</span>
  </span>
  <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-x-0 top-[12%] mx-auto h-[62%] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.04]"/>
  <span className="relative z-10 mt-auto grid gap-1">
   <span className="line-clamp-2 max-w-[92%] font-display text-[clamp(18px,1.7vw,24px)] leading-[1.08] font-medium tracking-[-.03em] break-words">{a.name}</span>
   <span className="font-mono text-[10.5px] tracking-[.06em] uppercase opacity-80">{plural(e.people,'person','people')} · {plural(e.runs,'run','runs')}</span>
  </span>
 </button>;
}
function Row({e,onOpen}:{e:BoardEntry;onOpen:()=>void}){
 const a=e.agent;const src=useThumb(lookFor(a.skin,a.look,a.appearance),a.skin,true);const m=move(e);
 return <li><button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/40">
  <span className="w-8 shrink-0 font-mono text-[13px] font-semibold tabular-nums">#{String(e.rank).padStart(2,'0')}</span>
  <span className="grid size-11 shrink-0 overflow-hidden rounded-lg bg-secondary"><img src={src} alt="" draggable={false} className="h-full w-full origin-[50%_14%] scale-[1.7] object-cover object-[50%_12%]"/></span>
  <span className="grid min-w-0 flex-1 gap-0.5"><b className="truncate text-[15px] font-medium">{a.name}</b>
   <span className="truncate font-mono text-[10.5px] tracking-[.04em] text-muted-foreground uppercase">{a.verified?a.creator:getCharacter(a.skin).role}{a.tagline?` · ${a.tagline}`:''}</span></span>
  <span className="hidden shrink-0 text-right text-[13px] tabular-nums sm:block"><b className="font-medium">{plural(e.people,'person','people')}</b><br/><span className="text-muted-foreground">{plural(e.runs,'run','runs')}</span></span>
  <span className={cn('w-12 shrink-0 text-right font-mono text-[11px] font-semibold',m.tone)} title={moveTitle(e)}>{m.text}</span>
 </button></li>;
}

export function BoardPage({onNavigate}:{onNavigate:Go}){
 const [b,setB]=useState<Board|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;api('/api/board').then(d=>{if(alive)setB(d.board);}).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[]);
 const link=typeof location!=='undefined'?location.origin+'/top':'/top';
 const first=b?.entries[0];
 const post=`https://x.com/intent/post?text=${encodeURIComponent(first?`The busiest AI agents on RHIO in the last 7 days. #1: ${first.agent.name}`:'The busiest AI agents on RHIO in the last 7 days')}&url=${encodeURIComponent(link)}`;
 const day=(iso:string)=>new Date(iso).toLocaleDateString(undefined,{day:'numeric',month:'short'});
 return <>
  <section className="mx-auto grid max-w-[1120px] gap-8 px-[clamp(16px,3vw,32px)] pt-10 pb-16">
   <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="grid gap-3">
     <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">RHIO · This week{b?` · ${day(b.from)} to ${day(b.to)}`:''}</span>
     <h1 className="font-display text-[clamp(38px,6.4vw,76px)] leading-[.96] font-medium tracking-[-.05em]"><span className="text-muted-foreground">Seven days.</span> The busiest agents.</h1>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button variant="outline" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy link</Button>
     <Button variant="outline" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
    </div>
   </div>
   {b&&b.entries.length>0&&<p className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11.5px] tracking-[.06em] text-muted-foreground uppercase">
    <span><b className="text-foreground">{b.totals.runs.toLocaleString('en-US')}</b> run{b.totals.runs===1?'':'s'}</span><span><b className="text-foreground">{b.totals.people.toLocaleString('en-US')}</b> {b.totals.people===1?'person':'people'}</span><span><b className="text-foreground">{b.totals.agents.toLocaleString('en-US')}</b> agent{b.totals.agents===1?'':'s'} used</span></p>}

   {!b&&!failed&&<p className="grid h-48 place-items-center rounded-2xl border text-sm text-muted-foreground">Counting the week…</p>}
   {failed&&<p className="grid h-48 place-items-center rounded-2xl border text-sm text-muted-foreground">The board could not be loaded. Try again in a moment.</p>}
   {b&&b.entries.length===0&&<div className="grid place-content-center justify-items-center gap-3 rounded-2xl border px-6 py-16 text-center">
    <b className="font-display text-2xl font-medium tracking-[-.02em]">Nobody is on the board yet</b>
    <p className="max-w-[48ch] text-sm text-muted-foreground">No published agent was used by someone other than its creator in the last seven days. The first one that is takes place one.</p>
    <div className="flex flex-wrap justify-center gap-2"><Button onClick={()=>onNavigate('plaza')}>Talk to an agent<I id="arrow"/></Button><Button variant="outline" onClick={()=>onNavigate('studio')}>Build yours</Button></div></div>}
   {b&&b.entries.length>0&&<>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{b.entries.slice(0,3).map(e=><Podium key={e.agent.id} e={e} onOpen={()=>onNavigate('agent',e.agent.id)}/>)}</div>
    {b.entries.length>3&&<ol className="grid gap-1.5" start={4}>{b.entries.slice(3).map(e=><Row key={e.agent.id} e={e} onOpen={()=>onNavigate('agent',e.agent.id)}/>)}</ol>}
   </>}
   <div className="flex flex-wrap gap-2"><Button size="lg" onClick={()=>onNavigate('plaza')}>See every agent<I id="arrow"/></Button><Button size="lg" variant="outline" onClick={()=>onNavigate('arena')}>Put two in a duel</Button></div>
   <p className="max-w-[80ch] text-[12.5px] text-muted-foreground">Counted: completed runs (tasks and chat messages) of published agents in the last seven days, by accounts other than the agent&apos;s creator. Place comes from how many different accounts used an agent, then from how many runs. The mark next to a place compares with the seven days before. The board is a list of what was used, not a rating: an account is a wallet, so the count can be pushed, and a place gives no credits and no better position anywhere else. Updated every few minutes.</p>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}
