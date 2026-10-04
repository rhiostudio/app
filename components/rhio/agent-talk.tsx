'use client';
/* The chat on a published agent's page (/a/<id>): talk to the agent in its own voice. Every message is a normal paid
   run (POST /api/talk, lib/talk.ts): it costs a few credits plus the creator's price, lands in History, and the last
   turns of the conversation go with it as context. "Share" puts the conversation so far (the last answered message
   and up to five turns before it) on a public page, /s/<id> (lib/share.ts), and "Stop sharing" takes it down. The conversation's id is kept in this browser, so coming back to
   the page reopens it; "New conversation" starts a fresh one. Signed out, the box asks to connect a wallet. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {api,copyText,I,TextOut} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Thumb} from '@/components/landing/mocks';
import {cn} from '@/lib/utils';
import type {MarketAgent} from '@/lib/agents';
import type {CharacterId} from '@/lib/characters';

type Info={signedIn:boolean;mode:'live'|'sample';message:number;max:number;balance:number|null};
type Line={id:string;asked:string;answer:string;ok:boolean;cost:number;error?:string;pending?:boolean};
const key=(agent:string)=>`rhio-talk:${agent}`;
const stored=(agent:string)=>{try{const v=localStorage.getItem(key(agent));return v&&/^[0-9a-f-]{36}$/i.test(v)?v:null;}catch{return null;}};
const keep=(agent:string,thread:string)=>{try{localStorage.setItem(key(agent),thread);}catch{/* the conversation still works for this visit */}};

export function AgentTalk({agent,auth,onSignIn,onSpent,onMood}:{agent:MarketAgent;auth:boolean;onSignIn:()=>void;onSpent:()=>void;
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
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[lines.length,busy]);

 const each=(info?.message??0)+(agent.mine?0:agent.talkPrice);
 const short=info?.balance!==null&&info?.balance!==undefined&&info.balance<each;
 async function send(){
  const message=text.trim();if(!message||busy||!info)return;
  if(!auth){onSignIn();return;}
  const id=crypto.randomUUID();setBusy(true);setText('');setLines(l=>[...l,{id,asked:message,answer:'',ok:false,cost:0,pending:true}]);onMood?.('think');
  try{
   const r=await api('/api/talk',{method:'POST',body:JSON.stringify({id,agentId:agent.id,thread:thread.current,message,...(agent.mine?{}:{expectedPrice:agent.talkPrice})})});
   keep(agent.id,thread.current);
   setLines(l=>l.map(x=>x.id===id?{id,asked:message,answer:r.answer,ok:true,cost:r.cost}:x));setInfo(i=>i&&{...i,balance:r.balance});onMood?.('answer');onSpent();
  }catch(e:any){setLines(l=>l.map(x=>x.id===id?{id,asked:message,answer:'',ok:false,cost:0,error:e.message}:x));onMood?.('idle');}
  finally{setBusy(false);}
 }
 function fresh(){thread.current=crypto.randomUUID();try{localStorage.removeItem(key(agent.id));}catch{/* nothing kept */}setLines([]);setShared(null);toast.success('New conversation');}
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
  <div className="grid max-h-[460px] min-h-28 content-start gap-3 overflow-y-auto rounded-xl border bg-background p-3" aria-live="polite">
   {!lines.length&&<p className="self-center p-3 text-center text-[13.5px] text-muted-foreground">Say hello, or ask {agent.name} what it thinks about something. It answers in its own voice{info?.mode==='sample'?'; AI is not connected here, so answers are labelled workflow samples':''}.</p>}
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
   </div>)}
   <div ref={end}/>
  </div>
  {shared&&<div className="grid gap-2 rounded-xl border bg-secondary/40 p-3">
   <span className="text-[12.5px] text-muted-foreground">{shared.run===last?.id?'This conversation is public up to here.':'The public page ends before your newer messages. Share again to include them.'} Anyone with the link can read it; it does not say who you are.</span>
   <div className="flex flex-wrap gap-2"><Input readOnly value={link} aria-label="Public link" onFocus={e=>e.currentTarget.select()} className="h-9 min-w-[200px] flex-1 font-mono text-[12px]"/>
    <Button size="sm" variant="outline" className="h-9" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy</Button>
    <Button size="sm" className="h-9" asChild><a href={`https://x.com/intent/post?text=${encodeURIComponent(`I talked to ${agent.name}, an AI agent on RHIO:`)}&url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
    {shared.run!==last?.id&&<Button size="sm" variant="outline" className="h-9" disabled={sharing} onClick={share}>Share again</Button>}
    <Button size="sm" variant="ghost" className="h-9" disabled={sharing} onClick={unshare}>Stop sharing</Button></div>
  </div>}
  <div className="grid gap-2">
   <Textarea value={text} onChange={e=>setText(e.target.value)} maxLength={info?.max??2000} disabled={busy} aria-label={`Message to ${agent.name}`} placeholder={auth?`Message ${agent.name}…`:'Connect a wallet to talk'} className="min-h-16"
    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
   <div className="flex flex-wrap items-center gap-3">
    {auth?<Button disabled={busy||!text.trim()||!info||short} onClick={send}><I id="arrow"/>{busy?'Waiting…':'Send'}</Button>
     :<Button onClick={onSignIn}><I id="wallet"/>Connect wallet to talk</Button>}
    <span className="text-xs text-muted-foreground">{short?`A message costs ${each} credits and you have ${info?.balance}.`:auth&&info?.balance!==null&&info?.balance!==undefined?`You have ${info.balance} credits. Enter sends, Shift+Enter makes a new line.`:'Each message is a run, paid in credits.'}</span>
   </div>
  </div>
  <p className="text-[12px] text-muted-foreground">{agent.name} is an AI character. It cannot browse here, it can be wrong, and nothing it says is financial advice. Its creator’s instructions are never shown. Your messages are kept in your History.</p>
 </section>;
}
