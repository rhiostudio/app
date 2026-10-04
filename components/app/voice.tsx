'use client';
/* "Write it from my posts" (Studio → Persona): the creator pastes posts they wrote, and gets a draft of the agent's
   instructions in their own style plus a tagline (POST /api/voice, lib/voice.ts). The draft is shown first; nothing
   changes on the agent until the creator presses "Use this". Opt-in: the box asks the creator to confirm the posts
   are their own, and the server refuses the request without that. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,I,FieldLabel} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';

type Info={live:boolean;cost:number;min:number;max:number};
type Draft={persona:string;tagline:string;cost:number};

export function VoiceBox({auth,balance,open:startOpen,onSignIn,ensureSaved,onUse,onSpent}:{auth:boolean;balance:number|null;/** opened by a link (/dashboard/studio?voice=1) */open?:boolean;onSignIn:()=>void;
 /** saves the agent being edited when it is new and gives its id */ensureSaved:()=>Promise<string|null>;onUse:(persona:string,tagline:string)=>void;onSpent:()=>void}){
 const [open,setOpen]=useState(!!startOpen);const [info,setInfo]=useState<Info|null>(null);
 const [posts,setPosts]=useState('');const [own,setOwn]=useState(false);const [busy,setBusy]=useState(false);const [draft,setDraft]=useState<Draft|null>(null);
 useEffect(()=>{if(!open||info)return;let alive=true;api('/api/voice').then(d=>{if(alive)setInfo(d);}).catch(()=>null);return()=>{alive=false;};},[open,info]);
 const n=posts.trim().length;const short=!!info&&n<info.min;const poor=!!info&&balance!==null&&balance<info.cost;
 async function write(){
  if(busy||!info)return;if(!auth){onSignIn();return;}
  setBusy(true);
  try{
   const agentId=await ensureSaved();if(!agentId)return;
   const d=await api('/api/voice',{method:'POST',body:JSON.stringify({id:crypto.randomUUID(),agentId,posts,own:true})});
   setDraft({persona:d.persona,tagline:d.tagline,cost:d.cost});onSpent();
  }catch(e:any){toast.error(e.message);}finally{setBusy(false);}
 }
 if(!open)return <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={()=>setOpen(true)}><I id="pen"/>Write it from my posts</Button><span className="text-xs text-muted-foreground">Paste posts you wrote and get the instructions in your own voice.</span></div>;
 return <div className="grid gap-3 rounded-xl border bg-secondary/40 p-4">
  <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-sm font-semibold">Your voice, from your posts</b><button type="button" onClick={()=>setOpen(false)} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Close</button></div>
  {info&&!info.live?<p className="text-[13px] text-muted-foreground">AI is not connected on this server, so a voice cannot be drafted here.</p>:<>
   <div className="grid gap-2"><FieldLabel htmlFor="voice-posts">Posts you wrote</FieldLabel>
    <Textarea id="voice-posts" value={posts} onChange={e=>setPosts(e.target.value)} maxLength={info?.max??12000} disabled={busy} className="min-h-36 text-[13px]" placeholder={'Paste 10 to 30 of your own posts, one after another. Replies work too. The more of them sound like you, the better the draft.'}/>
    <span className="text-xs text-muted-foreground tabular-nums">{n.toLocaleString('en-US')} / {(info?.max??12000).toLocaleString('en-US')} characters{short?` · at least ${info!.min} needed`:''}</span></div>
   <label className="flex items-start gap-3 text-[13px]"><Switch checked={own} onCheckedChange={setOwn} disabled={busy} aria-label="These are my own posts"/><span>These are my own posts. <span className="text-muted-foreground">Do not paste someone else’s to copy their voice.</span></span></label>
   <div className="flex flex-wrap items-center gap-3"><Button disabled={busy||!info||short||!own||(auth&&poor)} onClick={write}><I id="pen"/>{busy?'Reading your posts…':draft?'Draft it again':'Draft my voice'}</Button>
    <span className="text-xs text-muted-foreground">{!info?'':auth&&poor?`A draft costs ${info.cost} credits and you have ${balance}.`:`${info.cost} credits per draft. It is saved in History; your agent changes only when you press Use this.`}</span></div>
   {draft&&<div className="grid gap-3 rounded-lg border bg-card p-4">
    {draft.tagline&&<div className="grid gap-1"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Tagline</span><p className="text-[14px]">{draft.tagline}</p></div>}
    <div className="grid gap-1"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Instructions</span><p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{draft.persona}</p></div>
    <div className="flex flex-wrap gap-2"><Button onClick={()=>{onUse(draft.persona,draft.tagline);setDraft(null);setOpen(false);toast.success('Your voice is in the instructions',{description:'Read it, change what is off, then save the agent.'});}}><I id="check"/>Use this</Button>
     <Button variant="ghost" onClick={()=>setDraft(null)}>Discard</Button></div>
   </div>}
   <p className="text-[12px] text-muted-foreground">The agent it describes is an AI character in your style, not you: it says so when asked. Private details in the posts are left out of the draft. Read the draft before you publish.</p>
  </>}
 </div>;
}
