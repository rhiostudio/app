'use client';
/* The launch guide (/dashboard/launch): the way from a character to an agent people talk to, as one list
   (GET /api/launch, lib/launch.ts). Each step says whether it is done for the chosen agent and opens the place where
   it is done: a tab of the Studio, the publish dialog (the agent check is in it), sharing, or another page. The guide
   stores nothing and pays nothing; it reads the agent again whenever the account's agents change.
   /dashboard/launch?agent=<id> opens it for that agent. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {api,copyText,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {Thumb} from '@/components/landing/mocks';
import type {CharacterId} from '@/lib/characters';
import {agentPath,type View} from '@/lib/routes';
import type {Launch,LaunchStep} from '@/lib/launch';
import {DashPage,PageHeader} from './parts';

type Data=Launch&{signedIn:boolean};
const ACTION:Record<string,string>={look:'Open the Studio',voice:'Write its voice',persona:'Open its persona',publish:'Open publishing',share:'Share it',profile:'Open your profile',schedules:'Open Schedules',arena:'Open the arena'};

export function LaunchPage({auth,tick,onSignIn,onStudio,onPublish,onGo}:{auth:boolean;/** changes whenever the account's agents were loaded again */tick:unknown;onSignIn:()=>void;
 /** opens the Studio on a tab for that agent (no agent: a new one) */onStudio:(agentId:string|null,tab:'look'|'persona',voice?:boolean)=>void;
 /** opens the publish dialog (price, agent check) for that agent */onPublish:(agentId:string)=>void;
 onGo:(v:View,query?:string)=>void}){
 const [d,setD]=useState<Data|null>(null);
 const [pick,setPick]=useState<string|null>(()=>{try{return new URLSearchParams(location.search).get('agent');}catch{return null;}});
 const load=useCallback(()=>{api(`/api/launch${pick?`?agent=${encodeURIComponent(pick)}`:''}`).then(setD).catch(()=>null);},[pick]);
 useEffect(()=>{load();},[load,auth,tick]);
 // coming back from another tab or window (a post, the agent's page): look again
 useEffect(()=>{const on=()=>{if(document.visibilityState==='visible')load();};document.addEventListener('visibilitychange',on);return()=>document.removeEventListener('visibilitychange',on);},[load]);
 const a=d?.agent||null;const total=d?.steps.length||0;const all=!!d&&total>0&&d.done===total;
 const link=a?(typeof location!=='undefined'?location.origin:'')+agentPath(a.id):'';
 const post=a?`https://x.com/intent/post?text=${encodeURIComponent(`Talk to ${a.name}, my AI agent on RHIO:`)}&url=${encodeURIComponent(link)}`:'#';
 const act=(s:LaunchStep)=>{
  if(!auth){onSignIn();return;}
  if(s.go==='look')onStudio(a?.id||null,'look');
  else if(s.go==='voice')onStudio(a?.id||null,'persona',true);
  else if(s.go==='persona')onStudio(a?.id||null,'persona');
  else if(s.go==='publish'){if(a)onPublish(a.id);else onStudio(null,'look');}
  else if(s.go==='profile')onGo('profile');
  else if(s.go==='schedules')onGo('schedules',s.id==='telegram'&&a?.published?`?chat=${a.id}`:'');
  else if(s.go==='arena')onGo('arena',a?.published?`?a=${a.id}`:'');
 };
 /** a step that needs an earlier one first */
 const locked=(s:LaunchStep)=>(s.id!=='character'&&!a)||((s.id==='first'||s.id==='telegram'||s.id==='duel')&&!a?.published);
 const row=(s:LaunchStep,i:number,next:boolean)=><li key={s.id} className={cn('grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border bg-card p-4 transition-colors',s.done&&'bg-secondary/30',next&&'border-foreground')}>
  <span className={cn('grid size-10 place-items-center rounded-lg font-mono text-[13px] font-semibold',s.done?'bg-lime text-ink':next?'bg-foreground text-background':'bg-secondary text-muted-foreground')}>{s.done?<I id="check"/>:String(i+1).padStart(2,'0')}</span>
  <div className="grid gap-1"><b className="flex flex-wrap items-center gap-2 text-sm font-semibold">{s.title}{next&&<span className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">next</span>}</b>
   <p className="text-[13px] text-muted-foreground">{s.text}</p></div>
  <div className="col-start-2 flex flex-wrap items-center gap-2">
   {s.go==='share'?(a?.published?<>
     <Button size="sm" variant={next?'default':'outline'} onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy its link</Button>
     <Button size="sm" variant="outline" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
     <Button size="sm" variant="ghost" asChild><a href={agentPath(a.id)} target="_blank" rel="noreferrer noopener">Open its page<I id="arrow"/></a></Button></>
    :<span className="text-[12.5px] text-muted-foreground">Publish it first; then it has a link to post.</span>)
   :locked(s)?<span className="text-[12.5px] text-muted-foreground">{!a?'Save an agent first.':'Publish it first.'}</span>
   :<Button size="sm" variant={next?'default':s.done?'ghost':'outline'} onClick={()=>act(s)}>{!auth?'Connect wallet':s.done?'Change it':ACTION[s.go]}<I id="arrow"/></Button>}
  </div>
 </li>;
 return <DashPage>
  <PageHeader title="Launch guide" icon="play" tone="lime" text="From a character to an agent people talk to, one step at a time. Each step is checked from what the Studio has saved; nothing here costs credits by itself."/>
  {d&&d.agents.length>1&&<div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">Agent</span>
   {d.agents.slice(0,12).map(x=><button key={x.id} type="button" onClick={()=>setPick(x.id)} aria-pressed={a?.id===x.id} className={cn('flex h-9 items-center gap-2 rounded-lg border bg-card pr-3 pl-1 text-[13px] font-medium transition-colors',a?.id===x.id?'border-lime bg-lime/10':'hover:border-foreground/30')}>
    <Thumb id={x.skin as CharacterId} className="size-7 rounded-md object-[50%_18%]"/>{x.name}</button>)}</div>}
  <div className="grid gap-3 rounded-xl border bg-card p-5">
   <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="grid gap-1"><span className="font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">{a?a.name:auth?'No agent yet':'Signed out'}</span>
     <b className="font-display text-[clamp(26px,3.4vw,40px)] leading-none font-medium tracking-[-.04em]">{d?(all?'Launched.':`${d.done} of ${total} done`):' '}</b></div>
    {all&&a?<Button asChild><a href={agentPath(a.id)} target="_blank" rel="noreferrer noopener">Open its page<I id="arrow"/></a></Button>
     :!auth?<Button onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>:null}
   </div>
   <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={total||1} aria-valuenow={d?.done||0} aria-label="Steps done"><div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{width:`${total?Math.round((d?.done||0)*100/total):0}%`}}/></div>
  </div>
  {d?<ol className="stagger grid gap-3">{d.steps.map((s,i)=>row(s,i,d.next===s.id))}</ol>:<p className="grid h-40 place-items-center rounded-xl border text-sm text-muted-foreground">Reading your agent…</p>}
  {d&&d.more.length>0&&<div className="grid gap-3">
   <span className="font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">Further, when you want</span>
   <ol className="grid gap-3 lg:grid-cols-2">{d.more.map((s,i)=>row(s,total+i,false))}</ol>
  </div>}
  <p className="max-w-[80ch] text-[12.5px] text-muted-foreground">What costs credits is what the steps open, at their usual prices: a voice draft, the agent check, and the messages you send your own agent. Adding sources, publishing and sharing are free. An agent you publish is an AI character and says so; what you earn from it are credits on RHIO.</p>
 </DashPage>;
}
