'use client';
/* "Write its opening for me" (Studio → Persona, above the greeting): from what the creator already wrote about the
   agent, a draft of its greeting and three questions to start from (POST /api/opening, lib/opening.ts). The draft is
   shown first; the greeting and the questions on the agent change only when the creator presses "Use these". The
   agent is saved before drafting, so the draft is written from what is on screen. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,I} from '@/app/ui';
import {Button} from '@/components/ui/button';

type Info={live:boolean;cost:number};
type Draft={greeting:string;starters:string[];cost:number};

export function OpeningBox({auth,balance,short,onSignIn,ensureSaved,onUse,onSpent}:{auth:boolean;balance:number|null;/** the instructions are too short to write an opening from */short:boolean;onSignIn:()=>void;
 /** saves the agent being edited when it changed and gives its id */ensureSaved:()=>Promise<string|null>;onUse:(greeting:string,starters:string[])=>void;onSpent:()=>void}){
 const [info,setInfo]=useState<Info|null>(null);const [busy,setBusy]=useState(false);const [draft,setDraft]=useState<Draft|null>(null);
 useEffect(()=>{let alive=true;api('/api/opening').then(d=>{if(alive)setInfo(d);}).catch(()=>null);return()=>{alive=false;};},[]);
 const poor=!!info&&balance!==null&&balance<info.cost;
 async function write(){
  if(busy||!info)return;if(!auth){onSignIn();return;}
  setBusy(true);
  try{
   const agentId=await ensureSaved();if(!agentId)return;
   const d=await api('/api/opening',{method:'POST',body:JSON.stringify({id:crypto.randomUUID(),agentId})});
   onSpent();
   if(!d.greeting&&!d.starters.length){setDraft(null);toast.error('The draft came back in a shape that could not be read. Try again.');return;}
   setDraft({greeting:d.greeting,starters:d.starters,cost:d.cost});
  }catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 if(info&&!info.live)return null;
 return <div className="grid gap-3 rounded-xl border bg-secondary/40 p-3">
  <div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" disabled={busy||!info||short||(auth&&poor)} onClick={write}><I id="pen"/>{busy?'Writing…':draft?'Write it again':'Write its opening for me'}</Button>
   <span className="min-w-0 flex-1 text-xs text-muted-foreground">{!info?'':short?'Write a few lines of instructions first: the opening is written from them.':auth&&poor?`A draft costs ${info.cost} credits and you have ${balance}.`:`A greeting and three questions, drafted from its instructions and notes. ${info.cost} credits; nothing changes until you press Use these.`}</span></div>
  {draft&&<div className="grid gap-2 rounded-lg border bg-card p-3">
   {draft.greeting&&<p className="text-[13.5px]"><span className="mr-2 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">Greeting</span>{draft.greeting}</p>}
   {draft.starters.length>0&&<ul className="grid gap-1">{draft.starters.map(q=><li key={q} className="text-[13.5px]"><span className="mr-2 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">Question</span>{q}</li>)}</ul>}
   <div className="flex flex-wrap items-center gap-2 pt-1"><Button size="sm" onClick={()=>{onUse(draft.greeting,draft.starters);setDraft(null);toast.success('Opening filled in. Save the agent to keep it.');}}><I id="check"/>Use these</Button>
    <Button size="sm" variant="ghost" onClick={()=>setDraft(null)}>Discard</Button>
    <span className="text-xs text-muted-foreground">Replaces the greeting and questions below. You can edit them after.</span></div>
  </div>}
 </div>;
}
