'use client';
/* "Sources" (Studio → Persona): what the agent answers from. The creator pastes notes, an FAQ or an old thread, gives
   it a title, and it is stored for this agent (GET/POST/DELETE /api/knowledge, lib/knowledge.ts). With every message
   or task the agent is given the passages that share words with it, and the titles are listed under the answer.
   "Try a question" shows which passages a question would bring up, without running the AI. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,I,FieldLabel} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Segmented} from '@/components/app/parts';

type Kind='notes'|'faq'|'thread';
type Source={id:string;title:string;kind:Kind;chars:number;created:string};
type Limits={sources:number;source:number;total:number;title:number};
type Found={title:string;text:string};
const KINDS:{value:Kind;label:string;hint:string}[]=[
 {value:'notes',label:'Notes',hint:'What your project is, dates, links, how things work. One paragraph per subject, with an empty line between them.'},
 {value:'faq',label:'FAQ',hint:'Questions people keep asking, each with its answer. Leave an empty line between one pair and the next.'},
 {value:'thread',label:'Old thread',hint:'A thread or a long post you wrote. Leave an empty line between posts.'},
];
const kindLabel=(k:string)=>KINDS.find(x=>x.value===k)?.label||'Notes';

export function KnowledgeBox({auth,agentId,onSignIn,ensureSaved,onChanged}:{auth:boolean;/** the saved agent being edited, when it has been saved */agentId?:string;onSignIn:()=>void;
 /** saves the agent being edited when it is new and gives its id */ensureSaved:()=>Promise<string|null>;/** the agent's sources changed (its check no longer counts) */onChanged:()=>void}){
 const [sources,setSources]=useState<Source[]|null>(null);const [limits,setLimits]=useState<Limits|null>(null);
 const [adding,setAdding]=useState(false);const [kind,setKind]=useState<Kind>('notes');const [title,setTitle]=useState('');const [text,setText]=useState('');const [busy,setBusy]=useState(false);
 const [question,setQuestion]=useState('');const [found,setFound]=useState<Found[]|null>(null);const [asking,setAsking]=useState(false);
 // the sources of the agent on screen; a new agent has none until it is saved
 useEffect(()=>{setSources(null);setFound(null);if(!auth||!agentId){setSources([]);return;}let alive=true;
  api(`/api/knowledge?agent=${agentId}`).then(d=>{if(alive){setSources(d.sources);setLimits(d.limits);}}).catch(()=>{if(alive)setSources([]);});return()=>{alive=false;};},[auth,agentId]);
 const max=limits?.source??12000;const used=(sources||[]).reduce((n,s)=>n+s.chars,0);const total=limits?.total??60000;const full=!!sources&&sources.length>=(limits?.sources??8);
 const n=text.trim().length;
 async function add(){
  if(busy)return;if(!auth){onSignIn();return;}
  setBusy(true);
  try{
   const id=await ensureSaved();if(!id)return;
   const d=await api('/api/knowledge',{method:'POST',body:JSON.stringify({agentId:id,title,kind,text})});
   setSources(d.sources);setTitle('');setText('');setAdding(false);setFound(null);onChanged();
   toast.success('Source added',{description:`Cut into ${d.passages} ${d.passages===1?'passage':'passages'}. Try a question below to see what it brings up.`});
  }catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 async function remove(s:Source){
  if(busy||!agentId)return;setBusy(true);
  try{const d=await api('/api/knowledge',{method:'DELETE',body:JSON.stringify({agentId,id:s.id})});setSources(d.sources);setFound(null);onChanged();toast.success('Source removed');}
  catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 async function ask(){
  if(asking||!agentId||question.trim().length<3)return;setAsking(true);
  try{const d=await api('/api/knowledge',{method:'POST',body:JSON.stringify({action:'try',agentId,question})});setFound(d.found);}
  catch(e:any){toast.error(e.message);}finally{setAsking(false);}
 }
 return <div className="grid gap-3 rounded-xl border bg-secondary/40 p-4">
  <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-sm font-semibold">Sources <span className="font-normal text-muted-foreground">(what it answers from)</span></b>
   {!!sources?.length&&<span className="text-xs text-muted-foreground tabular-nums">{sources.length} of {limits?.sources??8} · {used.toLocaleString('en-US')} / {total.toLocaleString('en-US')} characters</span>}</div>
  <p className="text-[13px] text-muted-foreground">Paste your notes, an FAQ or an old thread. For each message the agent is given the passages that match it, and answers from them. The titles of the sources it used are shown under the answer.</p>
  {sources===null?<p className="text-[13px] text-muted-foreground">Loading…</p>:sources.length>0&&<ul className="grid gap-1.5">{sources.map(s=><li key={s.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
   <span className="shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">{kindLabel(s.kind)}</span>
   <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{s.title}</span>
   <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{s.chars.toLocaleString('en-US')}</span>
   <button type="button" disabled={busy} onClick={()=>remove(s)} aria-label={`Remove ${s.title}`} className="shrink-0 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50">Remove</button>
  </li>)}</ul>}
  {!adding?<div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" disabled={full} onClick={()=>{if(!auth){onSignIn();return;}setAdding(true);}}><I id="plus"/>Add a source</Button>
    {full&&<span className="text-xs text-muted-foreground">This agent holds {limits?.sources??8} sources. Remove one to add another.</span>}</div>
  :<div className="grid gap-3 rounded-lg border bg-card p-4">
   <Segmented value={kind} onChange={setKind} items={KINDS.map(k=>[k.value,k.label] as [Kind,string])}/>
   <div className="grid gap-2"><FieldLabel htmlFor="kb-title">Title <span className="font-normal">(shown under the answers that come from it)</span></FieldLabel>
    <Input id="kb-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={limits?.title??60} disabled={busy} placeholder={kind==='faq'?'e.g. FAQ':kind==='thread'?'e.g. Thread: how the rewards work':'e.g. About the project'}/></div>
   <div className="grid gap-2"><FieldLabel htmlFor="kb-text">Text</FieldLabel>
    <Textarea id="kb-text" value={text} onChange={e=>setText(e.target.value)} maxLength={max} disabled={busy} className="min-h-40 text-[13px]" placeholder={KINDS.find(k=>k.value===kind)!.hint}/>
    <span className="text-xs text-muted-foreground tabular-nums">{n.toLocaleString('en-US')} / {max.toLocaleString('en-US')} characters{used+n>total?' · over what one agent holds in all':''}</span></div>
   <div className="flex flex-wrap items-center gap-2"><Button disabled={busy||!title.trim()||n<40||used+n>total} onClick={add}><I id="check"/>{busy?'Adding…':'Add source'}</Button><Button variant="ghost" disabled={busy} onClick={()=>setAdding(false)}>Cancel</Button></div>
   <p className="text-[12px] text-muted-foreground">Paste only what you wrote or may use, and nothing private: the agent can repeat any of it to whoever asks. Adding a source costs nothing.</p>
  </div>}
  {!!sources?.length&&<div className="grid gap-2 border-t pt-3">
   <FieldLabel htmlFor="kb-try">Try a question <span className="font-normal">(shows what the agent would be given; no AI, no credits)</span></FieldLabel>
   <div className="flex gap-2"><Input id="kb-try" value={question} onChange={e=>{setQuestion(e.target.value);setFound(null);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();ask();}}} maxLength={500} placeholder="e.g. When do rewards get paid?"/><Button variant="outline" disabled={asking||question.trim().length<3} onClick={ask}>{asking?'Looking…':'Look up'}</Button></div>
   {found&&(found.length?<ul className="grid gap-1.5">{found.map((f,i)=><li key={i} className="grid gap-1 rounded-lg border bg-card px-3 py-2"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">{f.title}</span><p className="text-[13px] leading-relaxed whitespace-pre-wrap">{f.text}</p></li>)}</ul>
    :<p className="text-[13px] text-muted-foreground">Nothing in the sources shares words with that question, so the agent would answer without them. Passages are matched by the words they share with a question: add the words people use when they ask.</p>)}
  </div>}
  {!!sources?.length&&<p className="text-[12px] text-muted-foreground">Changing the sources changes what the agent says, so a passed agent check no longer counts until you run it again.</p>}
 </div>;
}
