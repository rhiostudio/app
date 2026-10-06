'use client';
/* The chat on a published agent's page (/a/<id>): talk to the agent in its own voice. Every message is a normal paid
   run (POST /api/talk, lib/talk.ts): it costs a few credits plus the creator's price, lands in History, and the last
   turns of the conversation go with it as context. Before the first message the agent's own greeting and questions to start
   from are shown (its creator wrote them; they cost nothing). Each answer can be marked helpful or not (POST /api/rate,
   lib/ratings.ts). "Share" puts the conversation so far (the last answered message
   and up to five turns before it) on a public page, /s/<id> (lib/share.ts), and "Stop sharing" takes it down. The conversation's id is kept in this browser, so coming back to
   the page reopens it; "New conversation" starts a fresh one. Signed out, the box asks to connect a wallet, unless the
   agent's creator lets visitors try it without one (agent.guest, lib/embed.ts): then a frame with that guest chat is
   shown instead, where a few answers a day are paid by the creator. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {ThumbsDown,ThumbsUp} from 'lucide-react';
import {api,copyText,I,TextOut} from '@/app/ui';
import {chatAsk,chatReads} from '@/lib/chat-tools';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Thumb} from '@/components/landing/mocks';
import {cn} from '@/lib/utils';
import type {MarketAgent} from '@/lib/agents';
import type {CharacterId} from '@/lib/characters';

type Info={signedIn:boolean;mode:'live'|'sample';message:number;max:number;balance:number|null;/** this server has a Telegram bot */telegram?:boolean};
type Line={id:string;asked:string;answer:string;ok:boolean;cost:number;error?:string;pending?:boolean;/** the visitor's own mark: 1 helpful, -1 not */rating?:number|null};
const key=(agent:string)=>`rhio-talk:${agent}`;
const stored=(agent:string)=>{try{const v=localStorage.getItem(key(agent));return v&&/^[0-9a-f-]{36}$/i.test(v)?v:null;}catch{return null;}};
const keep=(agent:string,thread:string)=>{try{localStorage.setItem(key(agent),thread);}catch{/* the conversation still works for this visit */}};

export function AgentTalk({agent,auth,onSignIn,onSpent,onMood,ask}:{agent:MarketAgent;auth:boolean;onSignIn:()=>void;onSpent:()=>void;
 /** the question the link came with (/a/<id>?ask=N): it waits in the box, it is not sent by itself */ask?:string;
 /** what the character on the stage should do: think while it answers, nod when the answer is there */onMood?:(m:'think'|'answer'|'idle')=>void}){
 const [info,setInfo]=useState<Info|null>(null);const [lines,setLines]=useState<Line[]>([]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);
 const thread=useRef<string>('');const end=useRef<HTMLDivElement|null>(null);
 // the public page of this conversation, once shared: which message it ends with and its public id
 const [shared,setShared]=useState<{run:string;id:string}|null>(null);const [sharing,setSharing]=useState(false);
 const load=useCallback(async()=>{
  const t=stored(agent.id);thread.current=t||crypto.randomUUID();
  try{const d=await api(`/api/talk?agent=${agent.id}${t?`&thread=${t}`:''}`);setInfo(d);setLines(d.messages||[]);}catch{setInfo(null);}
 },[agent.id]);
 useEffect(()=>{load();},[load,auth]);
 // a link to one of its questions: the question is ready to send (sending costs credits, so the visitor presses Send)
 const asked=useRef('');
 useEffect(()=>{if(ask&&asked.current!==ask){asked.current=ask;setText(t=>t.trim()?t:ask);}},[ask]);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[lines.length,busy]);

 const each=(info?.message??0)+(agent.mine?0:agent.talkPrice);
 const short=info?.balance!==null&&info?.balance!==undefined&&info.balance<each;
 async function send(preset?:string){
  const message=(preset??text).trim();if(!message||busy||!info)return;
  if(!auth){onSignIn();return;}
  const id=crypto.randomUUID();setBusy(true);setText('');setLines(l=>[...l,{id,asked:message,answer:'',ok:false,cost:0,pending:true}]);onMood?.('think');
  try{
   const r=await api('/api/talk',{method:'POST',body:JSON.stringify({id,agentId:agent.id,thread:thread.current,message,...(agent.mine?{}:{expectedPrice:agent.talkPrice})})});
   keep(agent.id,thread.current);
   setLines(l=>l.map(x=>x.id===id?{id,asked:message,answer:r.answer,ok:true,cost:r.cost}:x));setInfo(i=>i&&{...i,balance:r.balance});onMood?.('answer');onSpent();
  }catch(e:any){setLines(l=>l.map(x=>x.id===id?{id,asked:message,answer:'',ok:false,cost:0,error:e.message}:x));onMood?.('idle');}
  finally{setBusy(false);}
 }
 /** Marks an answer helpful or not; the same button again takes the mark back. */
 async function rate(l:Line,value:number){
  const next=l.rating===value?0:value;setLines(ls=>ls.map(x=>x.id===l.id?{...x,rating:next||null}:x));
  try{await api('/api/rate',{method:'POST',body:JSON.stringify({runId:l.id,value:next})});}
  catch(e:any){setLines(ls=>ls.map(x=>x.id===l.id?{...x,rating:l.rating??null}:x));toast.error(e.message);}
 }
 function fresh(){thread.current=crypto.randomUUID();try{localStorage.removeItem(key(agent.id));}catch{/* nothing kept */}setLines([]);setShared(null);toast.success('New conversation');}
 // signed out, on an agent whose creator pays a few answers for visitors: the guest chat instead of the wallet box
 const guest=!auth&&agent.guest?agent.guest:null;
 const [tone,setTone]=useState('');
 useEffect(()=>{try{setTone(document.documentElement.getAttribute('data-theme')==='light'?'light':'dark');}catch{setTone('dark');}},[]);
 const answered=lines.filter(l=>l.ok);const last=answered[answered.length-1];
 const link=shared?`${location.origin}/s/${shared.id}`:'';
 async function share(){
  if(!last||sharing)return;setSharing(true);
  try{const d=await api('/api/share',{method:'POST',body:JSON.stringify({runId:last.id,showTask:true,turns:Math.min(answered.length-1,5)})});setShared({run:last.id,id:d.id});
   copyText(`${location.origin}/s/${d.id}`,()=>toast.success('Public link created and copied'),()=>toast.success('Public link created'));}
  catch(e:any){toast.error(e.message);}finally{setSharing(false);}
 }
 async function unshare(){
  if(!shared||sharing)return;setSharing(true);
  try{await api('/api/share',{method:'DELETE',body:JSON.stringify({runId:shared.run})});setShared(null);toast.success('The page is taken down');}
  catch(e:any){toast.error(e.message);}finally{setSharing(false);}
 }

 return <section className="grid gap-3 rounded-2xl border bg-card p-5" aria-label={`Talk to ${agent.name}`}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div className="flex items-center gap-3"><Thumb id={agent.skin as CharacterId} className="size-10 rounded-lg bg-t-lime object-[50%_18%]"/>
    <div className="grid leading-tight"><b className="font-display text-lg font-medium tracking-[-.02em]">Talk to {agent.name}</b>
     <span className="font-mono text-[10.5px] tracking-[.06em] text-muted-foreground uppercase">{info?`${each} credits per message${!agent.mine&&agent.talkPrice>0?` · ${agent.talkPrice} to its creator`:''}`:'Loading…'}</span></div></div>
   {lines.length>0&&<div className="flex flex-wrap gap-1">{last&&!shared&&<Button size="sm" variant="ghost" disabled={busy||sharing} onClick={share}><I id="share"/>{sharing?'Sharing…':'Share'}</Button>}<Button size="sm" variant="ghost" disabled={busy} onClick={fresh}><I id="reset"/>New conversation</Button></div>}
  </div>
  {guest&&<div className="grid gap-3">
   <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><b className="text-sm font-semibold">Try it without a wallet</b><span className="text-[12.5px] text-muted-foreground">No account needed: a few answers a day are on its creator, who can read what is asked here.</span></div>
   {tone&&<iframe src={`/embed/${guest}?theme=${tone}${ask&&agent.starters.includes(ask)?`&ask=${agent.starters.indexOf(ask)+1}`:''}`} title={`Try ${agent.name} without a wallet`} loading="lazy" className="h-[520px] w-full rounded-xl border bg-background"/>}
   <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={onSignIn}><I id="wallet"/>Connect wallet</Button>
    <span className="text-xs text-muted-foreground">for a conversation of your own: it is kept in your History, you can share it, and you pay your own messages ({each} credits each).</span></div>
  </div>}
  {!guest&&<div className="grid max-h-[460px] min-h-28 content-start gap-3 overflow-y-auto rounded-xl border bg-background p-3" aria-live="polite">
   {!lines.length&&<div className="grid gap-3">
    {agent.greeting?<div className="flex max-w-[92%] items-start gap-2 justify-self-start"><Thumb id={agent.skin as CharacterId} className="size-7 shrink-0 rounded-md bg-t-lime object-[50%_18%]"/>
      <p className="rounded-2xl rounded-bl-md border bg-card px-3.5 py-2 text-[14px] break-words whitespace-pre-wrap">{agent.greeting}</p></div>
     :<p className="p-3 text-center text-[13.5px] text-muted-foreground">Say hello, or ask {agent.name} what it thinks about something. It answers in its own voice.</p>}
    {agent.starters.length>0&&<div className="flex flex-wrap gap-1.5">{agent.starters.map(q=><button key={q} type="button" disabled={busy||!info||(auth&&short)} onClick={()=>send(q)}
     className="rounded-full border bg-card px-3 py-1.5 text-left text-[13px] transition-colors hover:border-foreground/40 disabled:opacity-50">{q}</button>)}</div>}
    {info?.mode==='sample'&&<p className="text-[12px] text-muted-foreground">AI is not connected here, so answers are labelled workflow samples.</p>}
   </div>}
   {lines.map(l=><div key={l.id} className="grid gap-2">
    <p className="max-w-[85%] justify-self-end rounded-2xl rounded-br-md bg-lime px-3.5 py-2 text-[14px] break-words whitespace-pre-wrap text-ink">{l.asked}</p>
    <div className="flex max-w-[92%] items-start gap-2 justify-self-start">
     <Thumb id={agent.skin as CharacterId} className="size-7 shrink-0 rounded-md bg-t-lime object-[50%_18%]"/>
     <div className={cn('rounded-2xl rounded-bl-md border px-3.5 py-2',l.error?'border-coral/40 bg-t-coral text-coral':'bg-card')}>
      {l.pending?<span className="text-[13.5px] text-muted-foreground">{agent.name} is thinking…</span>
       :l.error?<span className="text-[13.5px]">{l.error}</span>
       :l.ok?<TextOut text={l.answer}/>:<span className="text-[13.5px] text-muted-foreground">This message was not answered; its credits were returned.</span>}
     </div>
    </div>
    {l.ok&&<div className="ml-9 flex items-center gap-1 text-muted-foreground">
     <button type="button" aria-label="Helpful" aria-pressed={l.rating===1} onClick={()=>rate(l,1)} className={cn('grid size-7 place-items-center rounded-md transition-colors hover:bg-secondary hover:text-foreground',l.rating===1&&'bg-lime/20 text-foreground')}><ThumbsUp className="size-3.5" aria-hidden="true"/></button>
     <button type="button" aria-label="Not helpful" aria-pressed={l.rating===-1} onClick={()=>rate(l,-1)} className={cn('grid size-7 place-items-center rounded-md transition-colors hover:bg-secondary hover:text-foreground',l.rating===-1&&'bg-t-coral text-coral')}><ThumbsDown className="size-3.5" aria-hidden="true"/></button>
    </div>}
   </div>)}
   <div ref={end}/>
  </div>}
  {shared&&<div className="grid gap-2 rounded-xl border bg-secondary/40 p-3">
   <span className="text-[12.5px] text-muted-foreground">{shared.run===last?.id?'This conversation is public up to here.':'The public page ends before your newer messages. Share again to include them.'} Anyone with the link can read it; it does not say who you are.</span>
   <div className="flex flex-wrap gap-2"><Input readOnly value={link} aria-label="Public link" onFocus={e=>e.currentTarget.select()} className="h-9 min-w-[200px] flex-1 font-mono text-[12px]"/>
    <Button size="sm" variant="outline" className="h-9" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy</Button>
    <Button size="sm" className="h-9" asChild><a href={`https://x.com/intent/post?text=${encodeURIComponent(`I talked to ${agent.name}, an AI agent on RHIO:`)}&url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
    {shared.run!==last?.id&&<Button size="sm" variant="outline" className="h-9" disabled={sharing} onClick={share}>Share again</Button>}
    <Button size="sm" variant="ghost" className="h-9" disabled={sharing} onClick={unshare}>Stop sharing</Button></div>
  </div>}
  {!guest&&<div className="grid gap-2">
   {ask&&text===ask&&<span className="text-[12.5px] text-muted-foreground">This question came with the link. Send it, or write your own.</span>}
   <Textarea value={text} onChange={e=>setText(e.target.value)} maxLength={info?.max??2000} disabled={busy} aria-label={`Message to ${agent.name}`} placeholder={auth?`Message ${agent.name}…`:'Connect a wallet to talk'} className="min-h-16"
    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
   <div className="flex flex-wrap items-center gap-3">
    {auth?<Button disabled={busy||!text.trim()||!info||short} onClick={()=>send()}><I id="arrow"/>{busy?'Waiting…':'Send'}</Button>
     :<Button onClick={onSignIn}><I id="wallet"/>Connect wallet to talk</Button>}
    <span className="text-xs text-muted-foreground">{short?`A message costs ${each} credits and you have ${info?.balance}.`:auth&&info?.balance!==null&&info?.balance!==undefined?`You have ${info.balance} credits. Enter sends, Shift+Enter makes a new line.`:'Each message is a run, paid in credits.'}</span>
   </div>
  </div>}
  {info?.telegram&&info.mode==='live'&&<a href={`/dashboard/schedules?chat=${agent.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 justify-self-start rounded-lg border px-3 py-2 text-[13px] transition-colors hover:border-foreground/40"><b className="font-medium">Add {agent.name} to my Telegram</b><span className="text-muted-foreground">It answers in your own chat or group, paid per answer from your credits.</span><I id="arrow" className="i size-3.5"/></a>}
  {info?.mode==='live'&&chatReads(agent.skills)&&<p className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] text-muted-foreground"><I id="scan" className="i mt-0.5 size-3.5 shrink-0"/><span><b className="font-medium text-foreground">It can read {chatReads(agent.skills)}.</b> {chatAsk(agent.skills)}: the numbers it read are shown under its answer.</span></p>}
  <p className="text-[12px] text-muted-foreground">{agent.name} is an AI character. It cannot browse here, it can be wrong, and nothing it says is financial advice. Its creator’s instructions are never shown. Your messages are kept in your History.</p>
 </section>;
}
