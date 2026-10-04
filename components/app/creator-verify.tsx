'use client';
/* Creator verification (Profile page): a creator shows that an X handle is theirs by posting a code from it, and a
   reviewer on the team confirms it; then the creator's published agents say "@handle, verified creator".
   Data: /api/creator (lib/creators.ts). A reviewer (an account listed in CREATOR_ADMINS) also sees the requests
   that wait, each with the link to open and the code to look for. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {api,copyText,I,FieldLabel} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {StatusBadge} from './parts';

type Mine={status:'none'|'pending'|'review'|'verified'|'rejected';handle?:string;code?:string;proof?:string|null;note?:string|null;post?:string};
type Item={owner:string;handle:string;code:string;post:string;proof:string;updated:string};
type Data={signedIn:boolean;enabled:boolean;admin:boolean;mine:Mine;review:Item[]};

export function CreatorVerify({auth}:{auth:boolean}){
 const [d,setD]=useState<Data|null>(null);const [handle,setHandle]=useState('');const [url,setUrl]=useState('');const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{setD(await api('/api/creator'));}catch{setD(null);}},[]);
 useEffect(()=>{load();},[load,auth]);
 const act=async(payload:object,ok?:string)=>{if(busy)return;setBusy(true);try{setD(await api('/api/creator',{method:'POST',body:JSON.stringify(payload)}));if(ok)toast.success(ok);}catch(e:any){toast.error(e.message);}finally{setBusy(false);}};
 if(!auth||!d)return null;
 const m=d.mine;const intent=m.post?`https://x.com/intent/post?text=${encodeURIComponent(m.post)}`:'#';
 return <>
  <section className="grid gap-3 rounded-xl border bg-card p-5">
   <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-[15px] font-semibold">Creator verification</b>
    <StatusBadge kind={m.status==='verified'?'live':m.status==='review'?'pending':m.status==='rejected'?'failed':'private'}>{m.status==='none'?'not verified':m.status==='pending'?'code given':m.status==='review'?'in review':m.status}</StatusBadge></div>
   {m.status==='verified'?<>
     <p className="text-[13.5px] text-muted-foreground">You are verified as <a className="font-medium text-foreground underline underline-offset-4" href={`https://x.com/${m.handle}`} target="_blank" rel="noreferrer noopener">@{m.handle}</a>. Every agent you publish shows it.</p>
     <Button size="sm" variant="ghost" className="justify-self-start" disabled={busy} onClick={()=>{if(confirm('Remove your verification? Your agents go back to an anonymous creator name.'))act({action:'withdraw'},'Verification removed');}}>Remove verification</Button>
    </>
   :!d.enabled?<p className="text-[13.5px] text-muted-foreground">Verification is not open on this server yet. Your agents show an anonymous creator name until it is.</p>
   :m.status==='none'||m.status==='rejected'?<>
     {m.status==='rejected'&&<p className="rounded-lg bg-t-coral px-3 py-2 text-[13px] text-coral">Your request for @{m.handle} was not confirmed{m.note?`: ${m.note}`:'.'} You can try again.</p>}
     <p className="text-[13.5px] text-muted-foreground">Show that an X handle is yours and your published agents say “@handle, verified creator” instead of an anonymous name.</p>
     <div className="grid gap-2"><FieldLabel htmlFor="cv-handle">Your X handle</FieldLabel>
      <div className="flex gap-2"><Input id="cv-handle" value={handle} maxLength={16} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" className="h-9 max-w-xs"/>
       <Button className="h-9" disabled={busy||handle.replace(/^@/,'').trim().length<1} onClick={()=>act({action:'start',handle})}>Get my code</Button></div></div>
    </>
   :m.status==='pending'?<>
     <p className="text-[13.5px] text-muted-foreground"><b className="text-foreground">1.</b> Post this from <b className="text-foreground">@{m.handle}</b>. <b className="text-foreground">2.</b> Paste the link to that post below. A person on the team then checks it.</p>
     <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-secondary/50 p-3"><code className="min-w-0 flex-1 font-mono text-[12.5px] break-words">{m.post}</code>
      <Button size="sm" variant="outline" onClick={()=>copyText(m.post||'',toast.success,toast.error)}><I id="copy"/>Copy</Button>
      <Button size="sm" asChild><a href={intent} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button></div>
     <div className="grid gap-2"><FieldLabel htmlFor="cv-url">Link to your post</FieldLabel>
      <div className="flex gap-2"><Input id="cv-url" value={url} maxLength={200} onChange={e=>setUrl(e.target.value)} placeholder={`https://x.com/${m.handle}/status/…`} className="h-9 font-mono text-[12px]"/>
       <Button className="h-9" disabled={busy||url.trim().length<10} onClick={()=>act({action:'proof',url},'Sent for review')}>Send</Button></div></div>
     <button type="button" className="justify-self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={()=>act({action:'withdraw'})}>Use another handle</button>
    </>
   :<>
     <p className="text-[13.5px] text-muted-foreground">Your request for <b className="text-foreground">@{m.handle}</b> waits for a person on the team to check <a className="underline underline-offset-4" href={m.proof||'#'} target="_blank" rel="noreferrer noopener">your post</a>. Keep the post up until it is confirmed.</p>
     <button type="button" className="justify-self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={()=>act({action:'withdraw'})}>Withdraw the request</button>
    </>}
   <p className="text-[12px] text-muted-foreground">Nothing is read from your X account: you post a code, we look at that one post. A handle is verified for one account only.</p>
  </section>
  {d.admin&&<section className="grid gap-3 rounded-xl border border-lime bg-card p-5">
   <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[15px] font-semibold">Creator requests to review</b><span className="font-mono text-[11px] text-muted-foreground">{d.review.length} waiting</span></div>
   {!d.review.length?<p className="text-[13px] text-muted-foreground">Nothing waits. You see this because your wallet is a reviewer on this server.</p>
   :d.review.map(r=><div key={r.owner} className="grid gap-2 rounded-lg border bg-secondary/40 p-3">
     <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-sm font-semibold">@{r.handle}</b><span className="font-mono text-[10.5px] text-muted-foreground">{new Date(r.updated).toLocaleString()}</span></div>
     <p className="text-[12.5px] text-muted-foreground">Open the post and confirm two things: it is posted by <b className="text-foreground">@{r.handle}</b>, and it contains <code className="font-mono text-foreground">{r.code}</code>.</p>
     <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" asChild><a href={r.proof} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Open the post</a></Button>
      <Button size="sm" disabled={busy} onClick={()=>act({action:'approve',owner:r.owner},`@${r.handle} verified`)}><I id="check"/>Approve</Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={()=>{const note=prompt('Why not? The creator sees this (optional).');if(note!==null)act({action:'reject',owner:r.owner,note},'Rejected');}}>Reject</Button>
     </div>
    </div>)}
  </section>}
 </>;
}
