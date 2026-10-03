'use client';
/* Public page of one published agent (/a/<id>): the link people post on X or send to a friend. It shows what
   Discover shows (name, character, skills, price, how often it ran); the creator's instructions are never part of
   the data. Its link preview comes from app/a/[id]/page.tsx and /api/og/agent/<id>. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import Avatar from '@/app/avatar';
import {api,copyText,I,SKILL_ICON} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/app/parts';
import {getCharacter} from '@/lib/characters';
import {skillCatalog,type MarketAgent} from '@/lib/agents';
import {agentPath,type View} from '@/lib/routes';
import {SiteFooter} from './site-footer';

type Go=(v:View,doc?:string)=>void;
const skill=(id:string)=>skillCatalog.find(s=>s.id===id);

export function AgentPage({id,onRun,onNavigate}:{id:string;onRun:(a:MarketAgent)=>void;onNavigate:Go}){
 const [agent,setAgent]=useState<MarketAgent|null>(null);const [state,setState]=useState<'loading'|'ready'|'missing'>('loading');
 useEffect(()=>{let alive=true;setState('loading');setAgent(null);
  api(`/api/market?id=${encodeURIComponent(id)}`).then(d=>{if(!alive)return;setAgent(d.agent);setState('ready');}).catch(()=>{if(alive)setState('missing');});
  return()=>{alive=false;};},[id]);

 if(state==='missing')return <>
  <section className="mx-auto grid min-h-[calc(100svh-var(--top)-40px)] max-w-[720px] place-content-center justify-items-center gap-5 px-4 py-16 text-center">
   <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">Agent</span>
   <h1 className="font-display text-[clamp(32px,5vw,56px)] leading-none font-medium tracking-[-.045em]">This agent is not available</h1>
   <p className="max-w-[46ch] text-muted-foreground">Its creator may have taken it out of Discover, or the link is mistyped.</p>
   <div className="flex flex-wrap justify-center gap-2"><Button onClick={()=>onNavigate('discover')}>Browse Discover</Button><Button variant="outline" onClick={()=>onNavigate('home')}>Go home</Button></div>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;

 const c=agent?getCharacter(agent.skin):null;
 const link=typeof location!=='undefined'?location.origin+agentPath(id):agentPath(id);
 const post=agent?`https://x.com/intent/post?text=${encodeURIComponent(`${agent.name}, an AI agent on RHIO`)}&url=${encodeURIComponent(link)}`:'#';
 return <>
  <section className="mx-auto grid max-w-[1120px] items-start gap-8 px-[clamp(16px,3vw,32px)] pt-10 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
   <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-stage max-md:aspect-[4/4.2]">
    {agent?<Avatar skin={agent.skin} appearance={agent.appearance} look={agent.look} animation={agent.motion||'Idle'}/>:<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading…</div>}
   </div>
   <div className="grid gap-6 md:pt-6">
    <div className="grid gap-3">
     <div className="flex flex-wrap items-center gap-2">
      <StatusBadge kind="live">Published</StatusBadge>
      {c&&<span className="font-mono text-[11px] tracking-[.08em] text-muted-foreground uppercase">{c.name} · {c.role}</span>}
     </div>
     <h1 className="font-display text-[clamp(34px,5vw,60px)] leading-[1.02] font-medium tracking-[-.045em] break-words">{agent?.name||' '}</h1>
     {agent?.tagline&&<p className="max-w-[52ch] text-[17px] leading-relaxed text-muted-foreground">{agent.tagline}</p>}
    </div>

    {agent&&<div className="grid gap-2">
     <span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">What it does</span>
     <ul className="grid gap-2">{agent.skills.map(s=>{const k=skill(s);return <li key={s} className="flex items-start gap-3 rounded-xl border bg-card p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary"><I id={SKILL_ICON[k?.icon||'']||'globe'}/></span>
      <span className="grid gap-0.5"><b className="text-sm font-semibold">{k?.name||s}</b>{k?.description&&<span className="text-[13px] text-muted-foreground">{k.description}</span>}</span>
     </li>;})}</ul>
    </div>}

    {agent&&<div className="grid grid-cols-3 overflow-hidden rounded-xl border text-center">
     {([['Price',agent.price===0?'Free':`${agent.price} CR`,agent.price===0?'per run':'per run, plus the skill'],['Runs',String(agent.uses),'so far'],['Answers in',agent.language,agent.tone]] as const).map(([l,v,h],k)=>
      <div key={l} className={k?'grid gap-0.5 border-l p-3':'grid gap-0.5 p-3'}><span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">{l}</span><b className="font-display text-xl font-medium tabular-nums">{v}</b><span className="text-[11.5px] text-muted-foreground">{h}</span></div>)}
    </div>}

    <div className="flex flex-wrap gap-2">
     <Button size="lg" disabled={!agent} onClick={()=>agent&&onRun(agent)}>Run a task<I id="arrow"/></Button>
     <Button size="lg" variant="outline" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy link</Button>
     <Button size="lg" variant="outline" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
    </div>
    <p className="text-[12.5px] text-muted-foreground">{agent?`By ${agent.mine?'you':agent.creator}. `:''}You pay in credits when you run it. The creator's instructions are never shown.</p>
   </div>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}
