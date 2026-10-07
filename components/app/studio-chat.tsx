'use client';
/* The Studio's Chat tab: talk to the agent you are editing, before anyone else can. A message goes through the same
   door as the chat on a published agent's page (POST /api/talk, lib/talk.ts): a paid run in the agent's own voice,
   with its notes, sources and the two reading skills; on your own agent there is no creator price. The agent need not
   be published. Each message first saves what is on screen (ensureSaved), so the answer always comes from the agent
   as it is now; when the agent changed since the last message a new conversation starts, because the earlier turns
   would carry the old voice into the next answer. Nothing is kept in the browser's storage: the conversation of the
   agent last talked to stays in memory (`kept`) while the app is open, so going to another tab of the Studio and back
   does not lose it (the panel is unmounted in between); the messages themselves are in History, like any run. */
import {useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {api,I,TextOut} from '@/app/ui';
import {chatAsk,chatReads} from '@/lib/chat-tools';
import {FIX_LINES,HARD_QUESTIONS,addLine,hasLine,judge,type HardKind} from '@/lib/check-questions';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Thumb} from '@/components/landing/mocks';
import {cn} from '@/lib/utils';

/** An answer pinned to the agent's public page (lib/share.ts): the run, and what was asked. */
type Pin={runId:string;asked:string};
import type {Agent} from '@/lib/agents';
import type {CharacterId} from '@/lib/characters';

type Info={mode:'live'|'sample';message:number;max:number;balance:number|null};
type Line={id:string;asked:string;answer:string;ok:boolean;error?:string;pending?:boolean;
 /** one of the three hard questions: which rule its answer is read by, and how it read */kind?:HardKind;verdict?:{ok:boolean;note:string}}|{id:string;note:string};
type Said=Extract<Line,{asked:string}>;
/** The conversation on screen, kept while the app is open: the Studio unmounts a tab's panel when another tab opens. */
let kept:{agent:string;thread:string;asked:string;lines:Line[]}|null=null;
/** What an answer depends on: when this changes between two messages, the conversation starts again. */
const mark=(a:Agent)=>JSON.stringify([a.name,a.personality,a.tone,a.knowledge||'',[...a.skills].sort()]);

export function StudioChat({agent,auth,published,onSignIn,ensureSaved,onSpent,onMood,onPersona}:{/** the agent being edited (the draft) */agent:Agent;auth:boolean;published:boolean;onSignIn:()=>void;
 /** saves the draft when it changed and gives the saved agent's id */ensureSaved:()=>Promise<string|null>;onSpent:()=>void;
 /** what the character on the stage should do */onMood?:(m:'think'|'answer')=>void;
 /** puts new instructions into the agent being edited (a line that mends a rule was added) */onPersona:(next:string)=>void}){
 const [info,setInfo]=useState<Info|null>(null);const [lines,setLines]=useState<Line[]>([]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);
 const thread=useRef('');const asked=useRef('');const end=useRef<HTMLDivElement|null>(null);
 /** the agent the conversation on screen belongs to (undefined: a draft that was never saved) */
 const holder=useRef<string|undefined>(undefined);
 useEffect(()=>{let alive=true;api('/api/talk').then(d=>{if(alive)setInfo(d);}).catch(()=>{if(alive)setInfo(null);});return()=>{alive=false;};},[auth]);
 // the answers pinned to its public page (up to `pinMax`): kept on the server, so they are here after a reload too
 const [pins,setPins]=useState<Pin[]>([]);const [pinMax,setPinMax]=useState(3);const [pinning,setPinning]=useState('');
 useEffect(()=>{let alive=true;if(!auth||!agent.id){setPins([]);return;}
  api(`/api/share?agent=${agent.id}`).then(d=>{if(alive){setPins(d.pinned||[]);setPinMax(d.max||3);}}).catch(()=>{if(alive)setPins([]);});return()=>{alive=false;};},[auth,agent.id]);
 async function pin(runId:string,asked:string,on:boolean){
  if(pinning)return;setPinning(runId);
  try{await api('/api/share',{method:'POST',body:JSON.stringify({runId,pin:on})});
   setPins(p=>on?(p.some(x=>x.runId===runId)?p:[...p,{runId,asked}]):p.filter(x=>x.runId!==runId));
   toast.success(on?(published?`Pinned. It now shows on ${agent.name}\u2019s page.`:`Pinned. It shows on ${agent.name}\u2019s page once you publish it.`):'Unpinned');
  }catch(e:any){toast.error(e.message);}finally{setPinning('');}
 }
 // back on this tab: the conversation as it was. Another agent opened in the Studio: its own conversation. A draft
 // that got its id from its first save keeps what is on screen.
 useEffect(()=>{
  const id=agent.id;
  if(id&&kept&&kept.agent===id){thread.current=kept.thread;asked.current=kept.asked;setLines(kept.lines);}
  else if(holder.current!==undefined&&holder.current!==id){thread.current='';asked.current='';setLines([]);}
  holder.current=id;
 },[agent.id]);
 useEffect(()=>{const id=holder.current;if(id&&thread.current)kept={agent:id,thread:thread.current,asked:asked.current,lines:lines.filter(l=>!('pending' in l&&l.pending))};},[lines]);
 useEffect(()=>{if(lines.length)end.current?.scrollIntoView({block:'nearest'});},[lines.length,busy]);

 const each=info?.message??0;const short=info?.balance!==null&&info?.balance!==undefined&&info.balance<each;
 const starters=(agent.starters||[]).map(s=>s.trim()).filter(Boolean);const answered=lines.some(l=>'asked' in l);
 async function send(preset?:string,kind?:HardKind){
  const message=(preset??text).trim();if(!message||busy||!info)return;
  if(!auth){onSignIn();return;}
  setBusy(true);
  try{
   const agentId=await ensureSaved();if(!agentId)return;
   const now=mark(agent);const changed=!!thread.current&&asked.current!==now;
   if(!thread.current||changed)thread.current=crypto.randomUUID();
   asked.current=now;
   const id=crypto.randomUUID();setText('');const instructions=agent.personality;
   setLines(l=>[...l,...(changed?[{id:crypto.randomUUID(),note:'You changed the agent. A new conversation starts here, so it answers without the earlier turns.'}]:[]),{id,asked:message,answer:'',ok:false,pending:true,kind}]);onMood?.('think');
   try{
    const r=await api('/api/talk',{method:'POST',body:JSON.stringify({id,agentId,thread:thread.current,message})});
    // a hard question: read the answer by the agent check's own rule (with the instructions it was sent with)
    const done:Said={id,asked:message,answer:r.answer,ok:true,kind,...(kind&&info.mode==='live'?{verdict:judge(kind,r.answer,instructions)}:{})};
    // the answer of a message sent just before leaving the tab is still there on the way back
    if(kept&&kept.agent===agentId&&kept.thread===thread.current&&!kept.lines.some(x=>x.id===id))kept={...kept,lines:[...kept.lines,done]};
    setLines(l=>l.map(x=>x.id===id?done:x));setInfo(i=>i&&{...i,balance:r.balance});onMood?.('answer');onSpent();
   }catch(e:any){setLines(l=>l.map(x=>x.id===id?{id,asked:message,answer:'',ok:false,error:e.message||'That message was not answered.'}:x));}
  }finally{setBusy(false);}
 }
 /** Adds the sentence that mends a rule to the instructions on screen; the next message saves it and starts a new conversation. */
 function fix(kind:HardKind){
  const next=addLine(agent.personality,FIX_LINES[kind]);
  if(!next){toast.error('Its instructions are full. Shorten them in the Persona tab, then add the line.');return;}
  onPersona(next);toast.success('Added to its instructions. Ask again to hear the difference.');
 }
 function fresh(){thread.current='';asked.current='';setLines([]);if(kept&&kept.agent===agent.id)kept=null;}

 return <section className="grid gap-3" aria-label={`Chat with ${agent.name}`}>
  <div className="flex items-start justify-between gap-2">
   <p className="text-sm text-muted-foreground">Talk to <b className="text-foreground">{agent.name||'your agent'}</b> the way a visitor will{published?'':', before you publish it'}. It answers in its own voice from the instructions, notes and sources you gave it.</p>
   {answered&&<Button size="sm" variant="ghost" className="shrink-0" disabled={busy} onClick={fresh}><I id="reset"/>New</Button>}
  </div>
  <div className="grid max-h-[420px] min-h-32 content-start gap-3 overflow-y-auto rounded-xl border bg-background p-3 [scrollbar-width:thin]" aria-live="polite">
   {!lines.length&&<div className="grid gap-3">
    {agent.greeting?.trim()?<div className="flex max-w-[94%] items-start gap-2 justify-self-start"><Thumb id={agent.skin as CharacterId} className="size-7 shrink-0 rounded-md bg-t-lime object-[50%_18%]"/>
      <p className="rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-[13.5px] break-words whitespace-pre-wrap">{agent.greeting}</p></div>
     :<p className="px-2 py-3 text-center text-[13px] text-muted-foreground">Say hello, or ask it something a visitor would. Add a greeting and questions to start from in the Persona tab and they show here.</p>}
    {starters.length>0&&<div className="flex flex-wrap gap-1.5">{starters.map(q=><button key={q} type="button" disabled={busy||!info||(auth&&short)} onClick={()=>send(q)}
     className="rounded-full border bg-card px-3 py-1.5 text-left text-[12.5px] transition-colors hover:border-foreground/40 disabled:opacity-50">{q}</button>)}</div>}
   </div>}
   {lines.map(l=>'note' in l?<p key={l.id} className="border-y py-2 text-center text-[12px] text-muted-foreground">{l.note}</p>:<div key={l.id} className="grid gap-2">
    <p className="max-w-[88%] justify-self-end rounded-2xl rounded-br-md bg-lime px-3 py-2 text-[13.5px] break-words whitespace-pre-wrap text-ink">{l.asked}</p>
    <div className="flex max-w-[96%] items-start gap-2 justify-self-start">
     <Thumb id={agent.skin as CharacterId} className="size-7 shrink-0 rounded-md bg-t-lime object-[50%_18%]"/>
     <div className={cn('min-w-0 rounded-2xl rounded-bl-md border px-3 py-2',l.error?'border-coral/40 bg-t-coral text-coral':'bg-card')}>
      {l.pending?<span className="text-[13px] text-muted-foreground">{agent.name} is thinking…</span>:l.error?<span className="text-[13px]">{l.error}</span>:<TextOut text={l.answer}/>}
     </div>
    </div>
    {l.ok&&!l.pending&&info?.mode==='live'&&(pins.some(p=>p.runId===l.id)
     ?<div className="ml-9 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground"><span className="rounded-md border border-lime bg-lime/10 px-2 py-0.5 font-medium text-foreground">Pinned to its page</span><button type="button" disabled={!!pinning} onClick={()=>pin(l.id,l.asked,false)} className="underline underline-offset-4 hover:text-foreground disabled:opacity-50">Unpin</button></div>
     :<button type="button" disabled={!!pinning||pins.length>=pinMax} title={pins.length>=pinMax?`Its page shows up to ${pinMax} pinned answers. Unpin one first.`:'Show this question and answer on the agent\u2019s public page'} onClick={()=>pin(l.id,l.asked,true)} className="ml-9 flex items-center gap-1.5 justify-self-start rounded-md border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"><I id="plus" className="i size-3"/>{pinning===l.id?'Pinning\u2026':'Pin to its page'}</button>)}
    {l.kind&&l.verdict&&<div className={cn('ml-9 grid gap-2 rounded-lg border px-3 py-2 text-[12.5px]',l.verdict.ok?'bg-secondary/40':'border-coral/40 bg-t-coral')}>
     <span><b className={cn('font-medium',l.verdict.ok?'text-foreground':'text-coral')}>{l.verdict.ok?'Held.':'Did not hold.'}</b> <span className="text-muted-foreground">{l.verdict.note}</span></span>
     {!l.verdict.ok&&(hasLine(agent.personality,FIX_LINES[l.kind])
      ?<span className="text-muted-foreground">The line for this is in its instructions now. Ask again to hear the difference; if it still does not hold, word it more strongly in the Persona tab.</span>
      :<div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>fix(l.kind!)}><I id="plus"/>Add the line that fixes it</Button><span className="text-muted-foreground">“{FIX_LINES[l.kind]}”</span></div>)}
    </div>}
   </div>)}
   <div ref={end}/>
  </div>
  {pins.length>0&&<div className="grid gap-1.5 rounded-lg border px-3 py-2.5">
   <span className="text-[12.5px] text-muted-foreground"><b className="font-medium text-foreground">On its page: {pins.length} of {pinMax} pinned answers.</b> Visitors see these under \u201cHow it answers\u201d.</span>
   <ul className="grid gap-1">{pins.map(p=><li key={p.runId} className="flex items-start justify-between gap-2 text-[12.5px]"><span className="min-w-0 break-words">\u201c{p.asked}\u201d</span><button type="button" disabled={!!pinning} onClick={()=>pin(p.runId,p.asked,false)} className="shrink-0 text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50">Unpin</button></li>)}</ul>
  </div>}
  <Textarea value={text} onChange={e=>setText(e.target.value)} maxLength={info?.max??2000} disabled={busy} aria-label={`Message to ${agent.name}`} placeholder={auth?`Message ${agent.name||'your agent'}…`:'Connect a wallet to talk to it'} className="min-h-16"
   onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
  <div className="flex flex-wrap items-center gap-3">
   {auth?<Button disabled={busy||!text.trim()||!info||short} onClick={()=>send()}><I id="arrow"/>{busy?'Waiting…':'Send'}</Button>
    :<Button onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>}
   <span className="text-xs text-muted-foreground">{!info?'Loading…':short?`A message costs ${each} credits and you have ${info.balance}.`:`${each} credits per message${auth&&info.balance!==null?` · you have ${info.balance}`:''}`}</span>
  </div>
  {info?.mode==='live'&&<div className="grid gap-1.5 rounded-lg border px-3 py-2.5">
   <span className="text-[12.5px] text-muted-foreground"><b className="font-medium text-foreground">Worth trying before you publish.</b> The agent check asks these same three; each one is sent as a message, and the answer is read by the check’s own rule.</span>
   <div className="flex flex-wrap gap-1.5">{HARD_QUESTIONS.map(q=><button key={q.label} type="button" title={`“${q.text}” ${q.good}`} disabled={busy||!info||(auth&&short)} onClick={()=>send(q.text,q.kind)}
    className="rounded-full border bg-card px-3 py-1.5 text-left text-[12.5px] transition-colors hover:border-foreground/40 disabled:opacity-50">{q.label}</button>)}</div>
  </div>}
  {info?.mode==='sample'&&<p className="text-[12px] text-muted-foreground">AI is not connected here, so answers are labelled workflow samples.</p>}
  {info?.mode==='live'&&chatReads(agent.skills)&&<p className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] text-muted-foreground"><I id="scan" className="i mt-0.5 size-3.5 shrink-0"/><span><b className="font-medium text-foreground">It can read {chatReads(agent.skills)}.</b> {chatAsk(agent.skills)}: the numbers it read are shown under its answer.</span></p>}
  <p className="text-[12px] text-muted-foreground">Sending saves your changes first, so it answers as the agent on screen. After a change the conversation starts again. On your own agent a message costs the message price only; visitors of a published agent also pay the chat price you set. The other skills run from the Run tab, not here. Messages are kept in your History.</p>
 </section>;
}
