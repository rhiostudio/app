'use client';
/* Quests (/dashboard/quests): a short list of things to try, each done when the server sees it happened, each worth a
   few free credits once per account. Data: /api/quests (lib/quests.ts). Signed out, the list is shown without progress. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {api,I} from '@/app/ui';
import {cn} from '@/lib/utils';
import type {View} from '@/lib/routes';
import {DashPage,EmptyState,Kpi,KpiRow,PageHeader,StatusBadge} from './parts';

type Quest={id:string;title:string;text:string;go:string;icon:string;credits:number;done:boolean;claimed:boolean};
type Data={signedIn:boolean;enabled:boolean;credits:number;earned:number;quests:Quest[]};

export function QuestsPage({auth,onSignIn,onGo,onClaimed}:{auth:boolean;onSignIn:()=>void;onGo:(v:View)=>void;onClaimed:()=>void}){
 const [data,setData]=useState<Data|null>(null);const [busy,setBusy]=useState('');
 const load=useCallback(()=>{api('/api/quests').then(setData).catch(()=>null);},[]);
 useEffect(()=>{load();},[load,auth]);
 async function claim(q:Quest){
  if(busy)return;setBusy(q.id);
  try{const d=await api('/api/quests',{method:'POST',body:JSON.stringify({id:q.id})});setData(cur=>cur?{...cur,...d}:d);
   toast.success(d.credits>0?`+${d.credits} credits`:'Quest claimed',{description:q.title});onClaimed();}
  catch(e){toast.error((e as Error).message);load();}finally{setBusy('');}
 }
 const list=data?.quests||[];const done=list.filter(q=>q.done).length,claimed=list.filter(q=>q.claimed).length,open=list.filter(q=>q.done&&!q.claimed).length;
 const head=<PageHeader icon="target" tone="lime" title="Quests" text="Try what your agent can do. Each quest is done when the server sees it happened, and gives free credits once per account."
  actions={!auth?<Button onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>:undefined}/>;
 if(data&&!data.enabled)return <DashPage>{head}<EmptyState title="Quests are switched off on this server" text="Everything else works as usual."/></DashPage>;
 return <DashPage>
  {head}
  <KpiRow>
   <Kpi label="Done" value={data?`${done}/${list.length}`:'—'} hint={open?`${open} ready to claim`:'Finished quests'} tone="lime" icon="check"/>
   <Kpi label="Claimed" value={data?`${claimed}/${list.length}`:'—'} hint="Once per account" tone="mint" icon="target"/>
   <Kpi label="Credits from quests" value={data?data.earned:'—'} hint="Free credits" tone="amber" icon="coins"/>
   <Kpi label="Per quest" value={data?(data.credits>0?`+${data.credits} CR`:'—'):'—'} hint={data&&data.credits===0?'No credits on this server':'Added when you claim'} tone="iris" icon="hype"/>
  </KpiRow>
  <ol className="stagger grid gap-3 lg:grid-cols-2">{list.map((q,i)=><li key={q.id} className={cn('grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border bg-card p-4 transition-colors',q.claimed&&'bg-secondary/30')}>
   <span className={cn('grid size-10 place-items-center rounded-lg',q.done?'bg-lime/20 text-foreground':'bg-secondary text-muted-foreground')}><I id={q.done?'check':q.icon}/></span>
   <div className="grid gap-1">
    <b className="flex flex-wrap items-center gap-2 text-sm font-semibold"><span className="font-mono text-[11px] text-muted-foreground tabular-nums">{String(i+1).padStart(2,'0')}</span>{q.title}
     {q.claimed?<StatusBadge kind="archived">claimed</StatusBadge>:q.done?<StatusBadge kind="live">done</StatusBadge>:null}</b>
    <p className="text-[13px] text-muted-foreground">{q.text}</p>
   </div>
   <div className="col-start-2 flex flex-wrap items-center justify-between gap-2">
    <span className="font-mono text-[11px] tracking-[.04em] text-muted-foreground">{q.credits>0?`+${q.credits} free credits`:'no credits on this server'}</span>
    {q.claimed?<span className="text-[12.5px] text-muted-foreground">Added to your balance</span>
     :q.done?<Button size="sm" disabled={!!busy} onClick={()=>claim(q)}>{busy===q.id?'Claiming…':q.credits>0?`Claim +${q.credits}`:'Claim'}</Button>
     :<Button size="sm" variant="outline" onClick={()=>auth?onGo(q.go as View):onSignIn()}>{auth?'Go':'Connect wallet'}<I id="arrow"/></Button>}
   </div>
  </li>)}</ol>
  {!data&&<p className="text-sm text-muted-foreground">Loading quests…</p>}
  <p className="max-w-[80ch] text-xs text-muted-foreground">Quest credits are free credits, like the ones a new account starts with: they pay for runs and are spent before bought credits. They are never part of claimable earnings and cannot be withdrawn. New quests are added over time.</p>
 </DashPage>;
}
