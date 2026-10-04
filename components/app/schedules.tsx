'use client';
/* Scheduled agent work (/dashboard/schedules and the Studio "Automate" tab). The owner picks an agent, one of its
   skills, the task, how many times a day and the time of the first run. The server scheduler runs it on those slots
   and charges credits per run; results land in History and, when the schedule has a delivery channel, in the owner's
   Discord channel or Telegram chat. Data: /api/schedules (lib/schedules.ts), /api/notify (lib/notify.ts). */
import {useCallback,useEffect,useMemo,useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';
import {Input} from '@/components/ui/input';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {FaDiscord,FaTelegram} from 'react-icons/fa6';
import {api,I,Options,FieldLabel} from '@/app/ui';
import {cn} from '@/lib/utils';
import {skillCatalog,type Agent} from '@/lib/agents';
import {Thumb} from '@/components/landing/mocks';
import type {CharacterId} from '@/lib/characters';
import {DashPage,EmptyState,Kpi,KpiRow,PageHeader,StatusBadge} from './parts';

export type Schedule={id:string;agent_id:string;agent_name:string|null;skin:string|null;skill:string;prompt:string;per_day:number;start_minute:number;mode:string;active:boolean;
 next_run:string;last_run:string|null;last_status:string|null;last_run_id:string|null;runs:number;created:string;notify?:string|null};
export type Channel={id:string;kind:'discord'|'telegram';label:string;ok:boolean;lastSent:string|null;lastError:string|null;chat?:{agentId:string;skill:string;daily:number;used:number}|null};
export type Delivery={discord:boolean;telegram:boolean;max:number};
export type Limits={enabled:boolean;runCost:number;max:number;dailyCap:number;perDay:number[];usedToday:number;mode:'live'|'sample';skillCosts?:Record<string,number>;
 /** the account's holder tier and every tier's limits (where the token is set) */tier?:string;tierName?:string;perks?:{id:string;name:string;min:string;schedules:number;dailyRuns:number;channels:number}[]|null};
/** Credits for one scheduled run of this skill (the server's price list, else the flat schedule cost). */
const runCostOf=(l:Limits|null|undefined,skill:string)=>l?.skillCosts?.[skill]??l?.runCost??5;
type Data={schedules:Schedule[];limits:Limits;channels?:Channel[];delivery?:Delivery};

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
export function ScheduleForm({agents,agent,limits,balance,count,channels=[],onSaved,ensureSaved}:{agents:Agent[];agent?:Agent;limits:Limits|null;balance:number|null;count:number;channels?:Channel[];onSaved:(d:Data)=>void;ensureSaved?:()=>Promise<string|null>}){
 const saved=agents.filter(a=>a.id&&!a.archived);
 const [agentId,setAgentId]=useState(agent?.id||saved[0]?.id||'');
 const target=agent||saved.find(a=>a.id===agentId);
 const skills=(target?.skills||[]) as readonly string[];
 const [skill,setSkill]=useState(skills[0]||'');const sk=skills.includes(skill)?skill:skills[0]||'';
 const [prompt,setPrompt]=useState('');const [perDay,setPerDay]=useState('3');const [time,setTime]=useState('08:00');const [busy,setBusy]=useState(false);
 const [notify,setNotify]=useState<string|null>(null);const sendTo=channels.some(c=>c.id===notify)?notify:null;
 const n=Number(perDay);const each=runCostOf(limits,sk);const cost=each*n;const days=balance!==null&&cost>0?Math.floor(balance/cost):null;
 const full=!!limits&&count>=limits.max;
 async function save(){
  if(busy)return;setBusy(true);
  try{
   const id=agent?(ensureSaved?await ensureSaved():agent.id):agentId;if(!id){setBusy(false);return;}
   const d=await api('/api/schedules',{method:'POST',body:JSON.stringify({agentId:id,skill:sk,prompt,perDay:n,startMinute:toUtcMinute(time),notify:sendTo})});
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
  <div className="grid gap-2"><FieldLabel htmlFor="sch-send">Send each result to</FieldLabel>
   {channels.length?<SendTo id="sch-send" value={sendTo} channels={channels} onChange={setNotify}/>
   :<p className="text-[12.5px] text-muted-foreground">History only. Connect Discord or Telegram under Schedules → Delivery to have results sent to you.</p>}</div>
  <div className="grid gap-1.5 rounded-xl border bg-secondary/40 p-3 text-[12.5px]">
   <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground"><I id="clock" className="i size-3.5"/>Runs at <b className="text-foreground tabular-nums">{slots(n,toUtcMinute(time)).join(' · ')}</b> (your time)</span>
   <span className="text-muted-foreground"><b className="text-foreground">{cost} credits/day</b> ({each} per run){days!==null?` · your balance covers about ${days} day${days===1?'':'s'}`:''}. Out of credits pauses the schedule. {limits?.mode==='sample'?'AI is not connected here, so runs return a labelled workflow sample.':''}</span>
  </div>
  <div className="flex flex-wrap items-center gap-3"><Button className="h-10" disabled={busy||!sk||prompt.trim().length<3||full||limits?.enabled===false} onClick={save}><I id="clock"/>{busy?'Saving…':'Schedule it'}</Button>
   <span className="text-xs text-muted-foreground">{full?`You have ${limits!.max} schedules, the maximum. Delete one first.`:limits?`${count}/${limits.max} schedules · ${limits.usedToday}/${limits.dailyCap} scheduled runs today`:''}</span></div>
 </div>;
}

/** One schedule: frequency, next run, last result, pause/resume and delete. */
export function ScheduleCard({s,onChange,compact,channels=[]}:{s:Schedule;onChange:(d:Data)=>void;compact?:boolean;channels?:Channel[]}){
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
  <div className="flex flex-wrap items-center justify-between gap-2">
   {channels.length?<label className="flex items-center gap-2 text-[12px] text-muted-foreground">Send to<SendTo value={channels.some(c=>c.id===s.notify)?s.notify!:null} channels={channels} disabled={busy} onChange={v=>call('PATCH',{id:s.id,notify:v})}/></label>:<span/>}
   <Button size="sm" variant="ghost" disabled={busy} onClick={()=>{if(confirm('Delete this schedule? Past runs stay in History.'))call('DELETE',{id:s.id});}}><I id="archive"/>Delete</Button></div>
 </div>;
}

/** Limits by holder tier, the account's own tier marked. Shown only where the RHIO token is set. */
function TierPerks({limits,onRefresh}:{limits:Limits;onRefresh:()=>void}){
 const [busy,setBusy]=useState(false);
 if(!limits.perks)return null;
 const refresh=async()=>{setBusy(true);try{await api('/api/tier');}catch{/* the page still shows the last known tier */}onRefresh();setBusy(false);};
 return <section className="grid gap-3 rounded-xl border bg-card p-5">
  <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[15px] font-semibold">Holder perks</b>
   <span className="text-[12.5px] text-muted-foreground">Your tier: <b className="text-foreground">{limits.tierName||'Free'}</b> · <button type="button" disabled={busy} onClick={refresh} className="underline underline-offset-4 hover:text-foreground">{busy?'Checking…':'Check again'}</button></span></div>
  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{limits.perks.map(p=><div key={p.id} className={cn('grid gap-1 rounded-lg border p-3',p.id===limits.tier&&'border-lime bg-lime/10')}>
   <span className="flex items-baseline justify-between gap-2"><b className="text-sm font-semibold">{p.name}</b><span className="font-mono text-[10.5px] text-muted-foreground">{p.min==='0'?'no RHIO needed':`${Number(p.min).toLocaleString('en-US')}+ RHIO`}</span></span>
   <span className="text-[12.5px] text-muted-foreground tabular-nums">{p.schedules} schedules · {p.dailyRuns} runs a day · {p.channels} channels</span>
  </div>)}</div>
  <p className="text-xs text-muted-foreground">Limits grow with the RHIO your linked wallets hold; the server reads the balance from the chain and checks it again every few hours. Runs cost the same credits on every tier. <a href="/tiers" className="underline underline-offset-4 hover:text-foreground">All tiers</a></p>
 </section>;
}

/** One channel's icon. */
const KindIcon=({kind,className}:{kind:string;className?:string})=>kind==='discord'?<FaDiscord className={className}/>:<FaTelegram className={className}/>;
type DeliveryView={config:Delivery;channels:Channel[];pending:{link:string;group:string;expires:number}|null;chatCosts?:Record<string,number>};

/** A Telegram channel's chat setting: which agent and skill answer questions there, and how many a day. */
function ChatSetup({c,agents,costs,busy,onSave}:{c:Channel;agents:Agent[];costs:Record<string,number>;busy:boolean;onSave:(p:{agentId:string|null;skill?:string;daily?:number})=>Promise<boolean>}){
 const saved=agents.filter(a=>a.id&&!a.archived);
 const [open,setOpen]=useState(false);
 const [agentId,setAgentId]=useState(c.chat?.agentId||'');const agent=saved.find(a=>a.id===agentId)||saved[0];
 const skills=(agent?.skills||[]) as readonly string[];
 const [skill,setSkill]=useState(c.chat?.skill||'');const sk=skills.includes(skill)?skill:skills[0]||'';
 const [daily,setDaily]=useState(String(c.chat?.daily||20));
 const current=c.chat?saved.find(a=>a.id===c.chat!.agentId):null;
 return <div className="grid basis-full gap-2 border-t pt-2">
  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
   <span>{c.chat?<>Answers here: <b className="text-foreground">{current?.name||'an agent'} · {skillName(c.chat.skill)}</b> · {c.chat.used}/{c.chat.daily} today</>:'No agent answers in this chat.'}</span>
   <Button size="sm" variant="ghost" onClick={()=>setOpen(o=>!o)}>{open?'Close':c.chat?'Change':'Let an agent answer'}</Button>
  </div>
  {open&&(agent?<div className="grid gap-2">
   <div className="grid gap-2 sm:grid-cols-3">
    <NativeSelect size="sm" value={agent.id} onChange={e=>setAgentId(e.target.value)} aria-label="Agent that answers">{saved.map(a=><NativeSelectOption key={a.id} value={a.id!}>{a.name}</NativeSelectOption>)}</NativeSelect>
    <NativeSelect size="sm" value={sk} onChange={e=>setSkill(e.target.value)} aria-label="Skill that answers">{skills.map(s=><NativeSelectOption key={s} value={s}>{skillName(s)}</NativeSelectOption>)}</NativeSelect>
    <NativeSelect size="sm" value={daily} onChange={e=>setDaily(e.target.value)} aria-label="Answers per day">{[5,20,50,100].map(n=><NativeSelectOption key={n} value={String(n)}>{n} answers a day</NativeSelectOption>)}</NativeSelect>
   </div>
   <p className="text-[12px] text-muted-foreground">In a private chat every message is a question; in a group people write <b className="text-foreground">/ask</b> and the question. Each answer is a live run of this skill ({costs[sk]??'a few'} credits from your balance), at most {daily} a day in this chat. In a group everyone there can ask, their questions go to the AI provider and land in your History, and the agent answers without web search.</p>
   <div className="flex flex-wrap gap-2">
    <Button size="sm" disabled={busy||!sk} onClick={async()=>{if(await onSave({agentId:agent.id!,skill:sk,daily:Number(daily)}))setOpen(false);}}>Save</Button>
    {c.chat&&<Button size="sm" variant="outline" disabled={busy} onClick={async()=>{if(await onSave({agentId:null}))setOpen(false);}}>Turn off</Button>}
   </div>
  </div>:<p className="text-[12px] text-muted-foreground">Save an agent in the Studio first; then it can answer here.</p>)}
 </div>;
}

/** Delivery channels of the account: connect Discord (webhook address) or Telegram (the server's bot), test, remove,
    and let an agent answer in a Telegram chat. */
export function DeliveryPanel({onChange,agents=[]}:{onChange:()=>void;agents?:Agent[]}){
 const [v,setV]=useState<DeliveryView|null>(null);const [url,setUrl]=useState('');const [busy,setBusy]=useState('');
 const sig=v?v.channels.map(c=>c.id+(c.ok?1:0)).join():null;
 // the schedule cards list the same channels: reload them when a channel was added, removed or stopped
 useEffect(()=>{if(sig!==null)onChange();},[sig,onChange]);
 const refresh=useCallback(()=>{api('/api/notify').then(setV).catch(()=>null);},[]);
 useEffect(()=>{refresh();},[refresh]);
 // while a Telegram link is open, ask the server every few seconds whether the chat pressed Start
 const waiting=!!v?.pending;
 useEffect(()=>{if(!waiting)return;const t=setInterval(refresh,3500);return ()=>clearInterval(t);},[waiting,refresh]);
 const act=async(key:string,init:RequestInit,done?:string)=>{if(busy)return false;setBusy(key);try{setV(await api('/api/notify',init));if(done)toast.success(done);return true;}catch(e:any){toast.error(e.message);refresh();return false;}finally{setBusy('');}};
 const post=(key:string,payload:object,done?:string)=>act(key,{method:'POST',body:JSON.stringify(payload)},done);
 const C=v?.config;const full=!!v&&!!C&&v.channels.length>=C.max;
 return <section className="grid gap-4 rounded-xl border bg-card p-5">
  <div className="grid gap-1"><b className="text-[15px] font-semibold">Delivery</b>
   <p className="text-[13px] text-muted-foreground">Have a schedule send each finished run to your Discord channel or Telegram chat, and let an agent answer questions in a Telegram chat. The text then leaves RHIO for that service. Research answers that used Google Search stay in History; only a notice is sent.</p></div>
  {v&&v.channels.length>0&&<div className="grid gap-2">{v.channels.map(c=><div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-secondary/30 px-3 py-2">
   <KindIcon kind={c.kind} className="size-4 shrink-0 text-muted-foreground"/>
   <div className="grid min-w-40 flex-1"><b className="truncate text-[13px] font-medium">{c.label}</b>
    <span className={cn('text-[11.5px]',c.ok?'text-muted-foreground':'text-coral')}>{c.ok?(c.lastError?`Last send failed: ${c.lastError}`:c.lastSent?`Last sent ${when(c.lastSent)}`:'Connected'):`Disconnected: ${c.lastError||'connect it again'}`}</span></div>
   <Button size="sm" variant="outline" disabled={!!busy} onClick={()=>post('t'+c.id,{action:'test',id:c.id},'Test message sent')}>{busy==='t'+c.id?'Sending…':'Send test'}</Button>
   <Button size="sm" variant="ghost" disabled={!!busy} onClick={()=>{if(confirm('Remove this channel? Schedules that send to it go back to History only.'))act('d'+c.id,{method:'DELETE',body:JSON.stringify({id:c.id})});}}><I id="archive"/>Remove</Button>
   {c.kind==='telegram'&&c.ok&&<ChatSetup key={c.id+(c.chat?c.chat.agentId+c.chat.skill+c.chat.daily:'')} c={c} agents={agents} costs={v.chatCosts||{}} busy={!!busy} onSave={p=>post('c'+c.id,{action:'chat',id:c.id,...p},p.agentId?'The agent now answers in this chat':'Chat answers turned off')}/>}
  </div>)}</div>}
  <div className="grid gap-3 lg:grid-cols-2">
   <div className="grid content-start gap-2 rounded-lg border p-3">
    <span className="flex items-center gap-2 text-[13px] font-medium"><FaDiscord className="size-4"/>Discord</span>
    {C&&!C.discord?<p className="text-[12.5px] text-muted-foreground">Discord delivery is switched off on this server.</p>:<>
     <p className="text-[12.5px] text-muted-foreground">In Discord: channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL. Anyone holding that address can post to the channel, so it is kept on the server and not shown again.</p>
     <div className="flex gap-2"><Input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/…" autoComplete="off" spellCheck={false} aria-label="Discord webhook address" className="h-9 text-[13px]"/>
      <Button className="h-9" disabled={!!busy||full||url.trim().length<20} onClick={async()=>{if(await post('discord',{action:'discord',url:url.trim()},'Discord channel connected'))setUrl('');}}>{busy==='discord'?'Checking…':'Connect'}</Button></div></>}
   </div>
   <div className="grid content-start gap-2 rounded-lg border p-3">
    <span className="flex items-center gap-2 text-[13px] font-medium"><FaTelegram className="size-4"/>Telegram</span>
    {C&&!C.telegram?<p className="text-[12.5px] text-muted-foreground">Telegram delivery is not set up on this server yet.</p>
    :v?.pending?<>
     <p className="text-[12.5px] text-muted-foreground">Open the bot and press <b className="text-foreground">Start</b>. This page notices on its own; the link works once, for 10 minutes.</p>
     <div className="flex flex-wrap gap-2"><Button asChild className="h-9"><a href={v.pending.link} target="_blank" rel="noopener noreferrer"><FaTelegram/>Open in Telegram</a></Button>
      <Button asChild variant="outline" className="h-9"><a href={v.pending.group} target="_blank" rel="noopener noreferrer">Add to a group</a></Button></div>
     <span className="text-[11.5px] text-muted-foreground">Waiting for your chat…</span></>
    :<>
     <p className="text-[12.5px] text-muted-foreground">Connect a private chat or a group with the studio&apos;s bot. In a group, everyone in it sees the reports.</p>
     <Button variant="outline" className="h-9 justify-self-start" disabled={!!busy||full||!v} onClick={()=>post('telegram',{action:'telegram'})}>{busy==='telegram'?'Preparing…':'Connect Telegram'}</Button></>}
   </div>
  </div>
  {full&&<p className="text-xs text-muted-foreground">You have {C!.max} channels, the maximum. Remove one to add another.</p>}
 </section>;
}

/** Where a schedule sends its results: History only, or one of the account's channels. */
function SendTo({value,channels,onChange,disabled,id}:{value:string|null;channels:Channel[];onChange:(v:string|null)=>void;disabled?:boolean;id?:string}){
 return <NativeSelect id={id} size="sm" value={value||''} disabled={disabled} onChange={e=>onChange(e.target.value||null)} aria-label="Send each result to">
  <NativeSelectOption value="">History only</NativeSelectOption>
  {channels.map(c=><NativeSelectOption key={c.id} value={c.id}>{c.label}{c.ok?'':' (disconnected)'}</NativeSelectOption>)}
 </NativeSelect>;
}

export function SchedulesPage({auth,agents,balance,onSignIn,onOpenHistory}:{auth:boolean;agents:Agent[];balance:number|null;onSignIn:()=>void;onOpenHistory:()=>void}){
 const {data,setData,load}=useSchedules(auth);const [adding,setAdding]=useState(false);const channels=data?.channels||[];
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
   <ScheduleForm agents={agents} limits={L} balance={balance} count={list.length} channels={channels} onSaved={d=>{setData(d);setAdding(false);}}/>
  </section>}
  {list.length>0&&<div className="stagger grid gap-3 lg:grid-cols-2">{list.map(s=><ScheduleCard key={s.id} s={s} onChange={setData} channels={channels}/>)}</div>}
  <DeliveryPanel onChange={load} agents={agents}/>
  {L&&<TierPerks limits={L} onRefresh={load}/>}
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
  {mine.map(s=><ScheduleCard key={s.id} s={s} onChange={setData} compact channels={data?.channels||[]}/>)}
  <ScheduleForm agents={agents} agent={agent} limits={data?.limits||null} balance={balance} count={data?.schedules.length||0} channels={data?.channels||[]} ensureSaved={ensureSaved} onSaved={setData}/>
 </div>;
}
