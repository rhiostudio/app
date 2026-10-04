'use client';
/* Quests (/dashboard/quests): a short list of things to try, each done when the server sees it happened, each worth a
   few free credits once per account. Data: /api/quests (lib/quests.ts). Signed out, the list is shown without progress. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api,copyText,I} from '@/app/ui';
import {cn} from '@/lib/utils';
import type {View} from '@/lib/routes';
import {DashPage,EmptyState,Kpi,KpiRow,PageHeader,StatusBadge} from './parts';

type Quest={id:string;title:string;text:string;go:string;icon:string;credits:number;done:boolean;claimed:boolean};
type Data={signedIn:boolean;enabled:boolean;credits:number;earned:number;quests:Quest[]};

type Invite={enabled:boolean;code?:string;credits?:number;max?:number;invited?:number;active?:number;earned?:number;invitedBy?:'waiting'|'paid'|null;
 boost?:{percent:number;maxFriends:number;unit:string;holding:number;multiplier:number;token:string}|null};
/** The account's invite link and how its invitations are doing (/api/referrals, lib/referrals.ts). */
function InviteCard({auth}:{auth:boolean}){
 const [d,setD]=useState<Invite|null>(null);
 useEffect(()=>{if(!auth)return;let alive=true;api('/api/referrals').then(x=>{if(alive)setD(x);}).catch(()=>null);return()=>{alive=false;};},[auth]);
 if(!auth||!d||!d.enabled||!d.code)return null;
 const link=`${location.origin}/r/${d.code}`;const credits=d.credits||0;
 const post=`https://x.com/intent/post?text=${encodeURIComponent(credits>0?`Build an AI agent with a face on RHIO. Use my invite and we both get ${credits} free credits after your first run:`:'Build an AI agent with a face on RHIO:')}&url=${encodeURIComponent(link)}`;
 return <section className="grid gap-3 rounded-xl border bg-card p-5">
  <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[15px] font-semibold">Invite a friend</b>
   <span className="text-[12.5px] text-muted-foreground tabular-nums">{d.invited||0} invited · {d.active||0} ran a task · {d.earned||0} credits earned</span></div>
  <p className="text-[13px] text-muted-foreground">{credits>0?<>When a friend signs in through your link with a new account and completes their first run, you each get <b className="text-foreground">{credits} free credits</b>. Up to {d.max} invitations are rewarded.</>:'Share your link. This server records invitations but gives no credits for them.'}</p>
  <div className="flex gap-2"><Input readOnly value={link} aria-label="Your invite link" onFocus={e=>e.currentTarget.select()} className="h-9 font-mono text-[12px]"/>
   <Button variant="outline" className="h-9" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy</Button>
   <Button className="h-9" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button></div>
  {d.boost&&<div className="grid gap-1 rounded-lg border bg-secondary/40 p-3">
   <span className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[13px] font-semibold">Holder reward boost</b>
    <span className="font-mono text-[12px] tabular-nums"><b className="text-foreground">×{(d.boost.multiplier/100).toFixed(1)}</b> now · {d.boost.holding} of your friends hold {Number(d.boost.unit).toLocaleString('en-US')} RHIO</span></span>
   <p className="text-[12.5px] text-muted-foreground">Every friend you invited who holds {Number(d.boost.unit).toLocaleString('en-US')} RHIO for a whole hour raises your own {d.boost.token} holder reward for that hour by {d.boost.percent}%, up to {d.boost.maxFriends} friends (×{(1+d.boost.percent*d.boost.maxFriends/100).toFixed(1)}). You need a reward of your own to boost: it multiplies what your wallets earn. It stops for a friend who no longer holds. <a href="/invite" className="underline underline-offset-4 hover:text-foreground">How it works</a></p>
  </div>}
  {d.invitedBy&&<p className="text-xs text-muted-foreground">{d.invitedBy==='paid'?'You were invited by a friend: your welcome bonus has been added.':'You were invited by a friend: your welcome bonus arrives after your first completed run.'}</p>}
 </section>;
}

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
  <InviteCard auth={auth}/>
  <p className="max-w-[80ch] text-xs text-muted-foreground">Quest credits are free credits, like the ones a new account starts with: they pay for runs and are spent before bought credits. They are never part of claimable earnings and cannot be withdrawn. New quests are added over time.</p>
 </DashPage>;
}
