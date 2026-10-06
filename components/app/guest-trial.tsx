'use client';
/* In the publish dialog of a published agent: "Let visitors try it without a wallet". The creator chooses how many
   answers a day signed-out visitors of the agent's page may get; each answer is a chat message paid from the
   creator's credits, exactly like an answer of a chat on the creator's own site (lib/embed.ts: a guest chat is an
   embed whose place is the agent's page). Off removes it. Nothing here costs anything until a visitor writes. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,Options} from '@/app/ui';
import type {Agent} from '@/lib/agents';
import {StatusBadge} from './parts';

type Guest={id:string;agentId:string;daily:number;used:number;active:boolean};
type Limits={daily:number[];perVisitor:number;mode:'live'|'sample';message:number;perAccount:number};
const PAGE='rhio:page';

export function GuestTrial({agent}:{agent:Agent}){
 const [d,setD]=useState<{guests:Guest[];limits:Limits}|null>(null);const [busy,setBusy]=useState(false);
 const load=useCallback(()=>{api('/api/embed').then(setD).catch(()=>null);},[]);
 useEffect(()=>{load();},[load,agent.id]);
 const g=d?.guests.find(x=>x.agentId===agent.id)||null;const on=!!g&&g.active;const L=d?.limits;
 async function set(value:string){
  if(busy||!d)return;const want=value==='off'?0:Number(value);if((on?g!.daily:0)===want)return;
  setBusy(true);
  try{
   const next=want===0?await api('/api/embed',{method:'DELETE',body:JSON.stringify({id:g!.id})})
    :g?await api('/api/embed',{method:'POST',body:JSON.stringify({action:'update',id:g.id,daily:want,active:true})})
    :await api('/api/embed',{method:'POST',body:JSON.stringify({action:'create',agentId:agent.id,origin:PAGE,daily:want})});
   setD(next);toast.success(want===0?'Visitors need a wallet again':`Visitors can try ${agent.name} without a wallet`);
  }catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 return <div className="grid gap-3 rounded-lg border bg-secondary/40 p-3">
  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm font-semibold">Let visitors try it without a wallet</b>
   <StatusBadge kind={on?'live':'private'}>{on?`${g!.used} of ${g!.daily} today`:'off'}</StatusBadge></div>
  <p className="text-[12.5px] text-muted-foreground">People who open its page signed out can send it a few messages right there, with no account. <b className="font-medium text-foreground">You pay each answer</b> from your credits{L?` (${L.message} per answer)`:''}, up to the number you choose per day; one visitor gets at most {L?.perVisitor??15} a day. To keep talking, they connect a wallet and pay their own messages.</p>
  <Options label="Answers a day for visitors without a wallet" value={on?String(g!.daily):'off'} options={[['off','Off'],...(L?.daily||[20,50,100,200,500]).map(n=>[String(n),String(n)] as const)]} onChange={set}/>
  <p className="text-xs text-muted-foreground">{L?`Your account’s limit of ${L.perAccount} live runs a day counts these answers too. `:''}A script can use up a day’s amount, so choose a number you are fine with spending.</p>
 </div>;
}
