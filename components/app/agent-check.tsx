'use client';
/* The agent check in the publish dialog: the studio tries the creator's own saved agent with four real messages and
   shows, check by check, what happened (POST /api/agents/check, lib/agent-check.ts). An agent that passed shows
   "Checked" on its page for as long as its instructions stay the ones that were checked. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import type {Agent} from '@/lib/agents';
import {StatusBadge} from './parts';
import {FIX_LINES,hasLine,type HardKind} from '@/lib/check-questions';

type Check=NonNullable<Agent['check']>;
const day=(iso:string)=>new Date(iso).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});

export function AgentCheck({agent,balance,onDone,onFix}:{agent:Agent;balance:number|null;/** adds a sentence to the agent's instructions and saves it */onFix?:(line:string)=>Promise<void>;/** the workspace is read again: the balance and the agent's check changed */onDone:()=>void}){
 const [info,setInfo]=useState<{live:boolean;cost:number}|null>(null);const [busy,setBusy]=useState(false);const [fresh,setFresh]=useState<Check|null>(null);const [fixing,setFixing]=useState('');
 /** the sentence that mends a failed check, when there is one and the instructions do not have it yet */
 const fixFor=(id:string)=>{const line=(FIX_LINES as Record<string,string|undefined>)[id as HardKind];return line&&!hasLine(agent.personality,line)?line:null;};
 async function fix(id:string){const line=fixFor(id);if(!line||!onFix||fixing)return;setFixing(id);try{await onFix(line);/* the agent changed: show the check as the workspace has it now, not this dialog's copy */setFresh(null);}finally{setFixing('');}}
 useEffect(()=>{let alive=true;api('/api/agents/check').then(d=>{if(alive)setInfo(d);}).catch(()=>null);return()=>{alive=false;};},[]);
 const check=fresh||agent.check||null;const good=!!check&&check.passed&&check.current;
 const poor=!!info&&balance!==null&&balance<info.cost;
 async function run(){
  if(busy||!info||!agent.id)return;setBusy(true);
  try{const d=await api('/api/agents/check',{method:'POST',body:JSON.stringify({id:crypto.randomUUID(),agentId:agent.id})});setFresh(d.check);onDone();
   toast[d.check.passed?'success':'message'](d.check.passed?`${agent.name} passed the check`:`${agent.name} did not pass every check`);}
  catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 return <div className="grid gap-3 rounded-lg border bg-secondary/40 p-3">
  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm font-semibold">Agent check</b>
   <StatusBadge kind={good?'live':check&&!check.passed?'failed':'private'}>{good?`checked ${day(check!.at)}`:!check?'not checked':!check.passed?'not passed':'changed since the check'}</StatusBadge></div>
  <p className="text-[12.5px] text-muted-foreground">The studio sends your agent four real messages and looks at the answers: does it answer, does it keep its instructions to itself, does it stay away from buy or sell advice, does it say it is an AI. An agent that passes shows “Checked” on its page until you change its instructions.</p>
  {check&&<ul className="grid gap-1.5">{check.items.map(i=><li key={i.id} className="flex items-start gap-2 text-[12.5px]">
   <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold',i.ok?'bg-lime text-ink':'bg-coral text-white')}>{i.ok?'✓':'!'}</span>
   <span><b className="font-medium text-foreground">{i.title}.</b> <span className="text-muted-foreground">{i.note}</span>
    {!i.ok&&onFix&&fixFor(i.id)&&<span className="mt-1.5 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" className="h-7 text-[12px]" disabled={!!fixing||busy} onClick={()=>fix(i.id)}><I id="plus"/>{fixing===i.id?'Adding…':'Add the line that fixes it'}</Button><span className="text-muted-foreground">“{fixFor(i.id)}”</span></span>}
    {!i.ok&&!fixFor(i.id)&&i.id in FIX_LINES&&<span className="mt-1 block text-muted-foreground">The line for this is in its instructions now. Check it again.</span>}</span></li>)}</ul>}
  {check&&!check.current&&<p className="text-[12.5px] text-muted-foreground">You changed its name, instructions, tone or notes after this check, so it no longer counts. Check it again.</p>}
  <div className="flex flex-wrap items-center gap-3">
   <Button size="sm" variant={good?'outline':'default'} disabled={busy||!info||!info.live||poor} onClick={run}><I id="scan"/>{busy?'Talking to it…':check?'Check again':'Check this agent'}</Button>
   <span className="text-xs text-muted-foreground">{!info?'':!info.live?'AI is not connected on this server, so an agent cannot be checked here.':poor?`A check costs ${info.cost} credits and you have ${balance}.`:`${info.cost} credits. A check, not a guarantee: an AI can answer differently next time.`}</span></div>
 </div>;
}
