'use client';
/* Scheduled agent work (/dashboard/schedules and the Studio "Automate" tab). The owner picks an agent, one of its
   skills, the task, how many times a day and the time of the first run. The server scheduler runs it on those slots
   and charges credits per run; results land in History. Data: /api/schedules (lib/schedules.ts). */
import {useCallback,useEffect,useMemo,useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';
import {api,I,Options,FieldLabel} from '@/app/ui';
import {cn} from '@/lib/utils';
import {skillCatalog,type Agent} from '@/lib/agents';
import {Thumb} from '@/components/landing/mocks';
import type {CharacterId} from '@/lib/characters';
import {DashPage,EmptyState,Kpi,KpiRow,PageHeader,StatusBadge} from './parts';

export type Schedule={id:string;agent_id:string;agent_name:string|null;skin:string|null;skill:string;prompt:string;per_day:number;start_minute:number;mode:string;active:boolean;
 next_run:string;last_run:string|null;last_status:string|null;last_run_id:string|null;runs:number;created:string};
export type Limits={enabled:boolean;runCost:number;max:number;dailyCap:number;perDay:number[];usedToday:number;mode:'live'|'sample';skillCosts?:Record<string,number>};
/** Credits for one scheduled run of this skill (the server's price list, else the flat schedule cost). */
const runCostOf=(l:Limits|null|undefined,skill:string)=>l?.skillCosts?.[skill]??l?.runCost??5;
type Data={schedules:Schedule[];limits:Limits};

const skillName=(id:string)=>skillCatalog.find(s=>s.id===id)?.name||id;
const pad=(n:number)=>String(n).padStart(2,'0');
/** Local "HH:MM" <-> UTC minute of day. */
const toUtcMinute=(hhmm:string)=>{const [h,m]=hhmm.split(':').map(Number);const d=new Date();d.setHours(h||0,m||0,0,0);return d.getUTCHours()*60+d.getUTCMinutes();};
const fromUtcMinute=(min:number)=>{const d=new Date();d.setUTCHours(Math.floor(min/60),min%60,0,0);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const slots=(perDay:number,startUtc:number)=>Array.from({length:perDay},(_,k)=>fromUtcMinute((startUtc+k*1440/perDay)%1440)).sort();
const when=(iso:string)=>{const d=new Date(iso);const today=new Date().toDateString()===d.toDateString();return (today?'today ':d.toLocaleDateString(undefined,{day:'numeric',month:'short'})+' ')+`${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const freq=(n:number)=>n===1?'Once a day':n===24?'Every hour':`${n}× a day`;

export function useSchedules(auth:boolean){
 const [data,setData]=useState<Data|null>(null);
 const load=useCallback(async()=>{if(!auth){setData(null);return;}try{setData(await api('/api/schedules'));}catch{setData(null);}},[auth]);
 useEffect(()=>{load();},[load]);
 return {data,setData,load};
}

/** Create form. `agent` fixes the agent (Studio); otherwise the owner picks one of their saved agents. */
export function ScheduleForm({agents,agent,limits,balance,count,onSaved,ensureSaved}:{agents:Agent[];agent?:Agent;limits:Limits|null;balance:number|null;count:number;onSaved:(d:Data)=>void;ensureSaved?:()=>Promise<string|null>}){
 const saved=agents.filter(a=>a.id&&!a.archived);
 const [agentId,setAgentId]=useState(agent?.id||saved[0]?.id||'');
 const target=agent||saved.find(a=>a.id===agentId);
 const skills=(target?.skills||[]) as readonly string[];
 const [skill,setSkill]=useState(skills[0]||'');const sk=skills.includes(skill)?skill:skills[0]||'';
 const [prompt,setPrompt]=useState('');const [perDay,setPerDay]=useState('3');const [time,setTime]=useState('08:00');const [busy,setBusy]=useState(false);
 const n=Number(perDay);const each=runCostOf(limits,sk);const cost=each*n;const days=balance!==null&&cost>0?Math.floor(balance/cost):null;
 const full=!!limits&&count>=limits.max;
 async function save(){
  if(busy)return;setBusy(true);
  try{
   const id=agent?(ensureSaved?await ensureSaved():agent.id):agentId;if(!id){setBusy(false);return;}
   const d=await api('/api/schedules',{method:'POST',body:JSON.stringify({agentId:id,skill:sk,prompt,perDay:n,startMinute:toUtcMinute(time)})});
   toast.success(`Scheduled: ${freq(n).toLowerCase()}, first run ${when(d.schedules.find((s:Schedule)=>s.id===d.id)?.next_run||new Date().toISOString())}`);setPrompt('');onSaved(d);
  }catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 if(!agent&&!saved.length)return <p className="rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">Save an agent in the Studio first, then schedule its work here.</p>;
 return <div className="grid gap-4">
  {!agent&&<div className="grid gap-2"><FieldLabel>Agent</FieldLabel><div className="flex flex-wrap gap-1.5">{saved.map(a=><button key={a.id} onClick={()=>setAgentId(a.id!)} className={cn('flex h-9 items-center gap-2 rounded-lg border bg-card pr-3 pl-1 text-[13px] font-medium transition-colors',agentId===a.id?'border-lime bg-lime/10':'hover:border-foreground/30')}>
   <Thumb id={a.skin as CharacterId} className="size-7 rounded-md object-[50%_18%]"/>{a.name}</button>)}</div></div>}
  {skills.length?<Options label="Skill" value={sk} options={skills.map(s=>[s,skillName(s)] as const)} onChange={setSkill}/>:<p className="text-[13px] text-muted-foreground">Equip a skill first.</p>}
  <div className="grid gap-2"><FieldLabel htmlFor="sch-task">What should it do each time?</FieldLabel>
   <Textarea id="sch-task" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={4000} className="min-h-24" placeholder="e.g. Summarize the three biggest AI stories today and list one action for me"/></div>
  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
   <Options label="How often" value={perDay} options={(limits?.perDay||[1,2,3,4,6,8,12,24]).map(v=>[String(v),v===24?'Hourly':`${v}×/day`] as const)} onChange={setPerDay}/>
   <div className="grid gap-2"><FieldLabel htmlFor="sch-time">First run</FieldLabel><input id="sch-time" type="time" value={time} onChange={e=>setTime(e.target.value)} className="h-8 rounded-lg border bg-card px-2 text-[13px] tabular-nums"/></div>
  </div>
  <div className="grid gap-1.5 rounded-xl border bg-secondary/40 p-3 text-[12.5px]">
   <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground"><I id="clock" className="i size-3.5"/>Runs at <b className="text-foreground tabular-nums">{slots(n,toUtcMinute(time)).join(' · ')}</b> (your time)</span>
   <span className="text-muted-foreground"><b className="text-foreground">{cost} credits/day</b> ({each} per run){days!==null?` · your balance covers about ${days} day${days===1?'':'s'}`:''}. Out of credits pauses the schedule. {limits?.mode==='sample'?'AI is not connected here, so runs return a labelled workflow sample.':''}</span>
  </div>
  <div className="flex flex-wrap items-center gap-3"><Button className="h-10" disabled={busy||!sk||prompt.trim().length<3||full||limits?.enabled===false} onClick={save}><I id="clock"/>{busy?'Saving…':'Schedule it'}</Button>
   <span className="text-xs text-muted-foreground">{full?`You have ${limits!.max} schedules, the maximum. Delete one first.`:limits?`${count}/${limits.max} schedules · ${limits.usedToday}/${limits.dailyCap} scheduled runs today`:''}</span></div>
 </div>;
}

/** One schedule: frequency, next run, last result, pause/resume and delete. */
export function ScheduleCard({s,onChange,compact}:{s:Schedule;onChange:(d:Data)=>void;compact?:boolean}){
 const [busy,setBusy]=useState(false);
 const call=async(method:string,payload:object)=>{setBusy(true);try{onChange(await api('/api/schedules',{method,body:JSON.stringify(payload)}));}catch(e:any){toast.error(e.message);}finally{setBusy(false);}};
 const failed=!!s.last_status&&/^(Paused|Failed|Skipped)/.test(s.last_status)&&s.last_status!=='Paused by you';
 return <div className={cn('grid gap-3 rounded-xl border bg-card p-4 transition-colors',!s.active&&'bg-secondary/30')}>
  <div className="flex items-start gap-3">
   {!compact&&<Thumb id={(s.skin||'atlas') as CharacterId} className="size-11 shrink-0 rounded-lg bg-t-lime object-[50%_18%]"/>}
   <div className="grid min-w-0 flex-1 gap-1">
    <b className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">{compact?skillName(s.skill):`${s.agent_name||'Removed agent'} · ${skillName(s.skill)}`}<StatusBadge kind={s.active?'live':'archived'}>{s.active?freq(s.per_day):'paused'}</StatusBadge></b>
    <p className="line-clamp-2 text-[12.5px] text-muted-foreground">{s.prompt}</p>
   </div>
   <Switch checked={s.active} disabled={busy} aria-label={s.active?'Pause schedule':'Resume schedule'} onCheckedChange={v=>call('PATCH',{id:s.id,active:v})}/>
  </div>
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
   <span>{s.active?<>Next <b className="text-foreground">{when(s.next_run)}</b></>:'Not running'}</span>
   <span>{slots(s.per_day,s.start_minute).join(' · ')}</span>
   <span>{s.runs} run{s.runs===1?'':'s'}</span>
  </div>
  {s.last_status&&<p className={cn('rounded-lg px-2.5 py-1.5 text-[12px]',failed?'bg-t-coral text-coral':'bg-secondary/60 text-muted-foreground')}>{s.last_status}{s.last_run?` · ${when(s.last_run)}`:''}</p>}
  <div className="flex justify-end"><Button size="sm" variant="ghost" disabled={busy} onClick={()=>{if(confirm('Delete this schedule? Past runs stay in History.'))call('DELETE',{id:s.id});}}><I id="archive"/>Delete</Button></div>
 </div>;
}

export function SchedulesPage({auth,agents,balance,onSignIn,onOpenHistory}:{auth:boolean;agents:Agent[];balance:number|null;onSignIn:()=>void;onOpenHistory:()=>void}){
 const {data,setData}=useSchedules(auth);const [adding,setAdding]=useState(false);
 const list=data?.schedules||[];const L=data?.limits||null;const active=list.filter(s=>s.active);
 const perDay=useMemo(()=>active.reduce((a,s)=>a+s.per_day,0),[active]);
 const perDayCost=useMemo(()=>active.reduce((a,s)=>a+s.per_day*runCostOf(L,s.skill),0),[active,L]);
 const costs=Object.values(L?.skillCosts||{});const lo=costs.length?Math.min(...costs):L?.runCost??5,hi=costs.length?Math.max(...costs):lo;
 if(!auth)return <DashPage><PageHeader icon="clock" tone="mint" title="Schedules" text="Let your agents work on their own: pick a skill, the task and how many times a day."/><EmptyState title="Sign in to schedule agents" text="Schedules run your saved agents on the server and use credits per run." action={<Button onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>}/></DashPage>;
 return <DashPage>
  <PageHeader icon="clock" tone="mint" title="Schedules" text="Your agents work on their own: pick an agent, a skill, the task and how many times a day. Each run uses credits and lands in History."
   actions={<><Button variant="outline" onClick={onOpenHistory}><I id="clock"/>History</Button><Button onClick={()=>setAdding(a=>!a)} disabled={!!L&&list.length>=L.max&&!adding}><I id="plus"/>New schedule</Button></>}/>
  <KpiRow>
   <Kpi label="Active" value={`${active.length}/${L?.max??3}`} hint="Schedules per account" tone="mint" icon="clock"/>
   <Kpi label="Runs per day" value={perDay} hint={`${perDayCost} credits/day`} tone="lime" icon="coins"/>
   <Kpi label="Today" value={`${L?.usedToday??0}/${L?.dailyCap??24}`} hint="Scheduled runs, daily cap" tone="iris" icon="layers"/>
   <Kpi label="Cost per run" value={lo===hi?`${lo} CR`:`${lo}–${hi} CR`} hint={L?.mode==='live'?'Live AI':'Workflow sample'} tone="amber" icon="hype"/>
  </KpiRow>
  {(adding||(!list.length&&data))&&<section className="grid gap-4 rounded-xl border bg-card p-5">
   <b className="text-[15px] font-semibold">New schedule</b>
   <ScheduleForm agents={agents} limits={L} balance={balance} count={list.length} onSaved={d=>{setData(d);setAdding(false);}}/>
  </section>}
  {list.length>0&&<div className="stagger grid gap-3 lg:grid-cols-2">{list.map(s=><ScheduleCard key={s.id} s={s} onChange={setData}/>)}</div>}
  <p className="text-xs text-muted-foreground">Times use your device clock. A slot missed while the server was down is skipped, not repeated. When credits run out, or the agent or skill is removed, the schedule pauses and shows why.</p>
 </DashPage>;
}

/** Studio "Automate" tab: schedules of the agent being edited. */
export function AgentSchedules({auth,agent,agents,balance,ensureSaved,onSignIn}:{auth:boolean;agent:Agent;agents:Agent[];balance:number|null;ensureSaved:()=>Promise<string|null>;onSignIn:()=>void}){
 const {data,setData}=useSchedules(auth);
 if(!auth)return <div className="grid gap-3"><p className="text-sm text-muted-foreground">Schedule this agent to work on its own, a few times a day. Sign in to set it up.</p><Button variant="outline" className="justify-self-start" onClick={onSignIn}><I id="wallet"/>Connect wallet</Button></div>;
 const mine=(data?.schedules||[]).filter(s=>agent.id&&s.agent_id===agent.id);
 return <div className="grid gap-4">
  <p className="text-sm text-muted-foreground">Let <b className="text-foreground">{agent.name}</b> run a skill on its own. Choose the task and how many times a day; each run uses credits and shows up in History.</p>
  {mine.map(s=><ScheduleCard key={s.id} s={s} onChange={setData} compact/>)}
  <ScheduleForm agents={agents} agent={agent} limits={data?.limits||null} balance={balance} count={data?.schedules.length||0} ensureSaved={ensureSaved} onSaved={setData}/>
 </div>;
}
