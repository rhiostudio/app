'use client';
/* "On your site" (Schedules page): a chat with one of the account's agents to paste into its own website
   (GET/POST/DELETE /api/embed, lib/embed.ts). The creator picks the agent, names the one site that may show it and
   how many answers a day it may give, and copies the frame. Visitors need no account: each answer is a chat message
   paid from this account's credits. */
import {useCallback,useEffect,useState} from 'react';
import {toast} from 'sonner';
import {api,copyText,I,FieldLabel} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import type {Agent} from '@/lib/agents';

type Embed={id:string;agentId:string;agentName:string;origin:string;daily:number;used:number;active:boolean;created:string;gone:boolean};
type Limits={max:number;daily:number[];perVisitor:number;chars:number;/** credits for one answer */message:number;mode:'live'|'sample';/** live runs a day the whole account may make */perAccount?:number};
type View={embeds:Embed[];limits:Limits};
const frame=(id:string,name:string)=>`<iframe src="${typeof location!=='undefined'?location.origin:''}/embed/${id}" title="Chat with ${name.replace(/"/g,'')}" width="380" height="560" style="border:0;border-radius:16px;max-width:100%" loading="lazy"></iframe>`;

export function EmbedPanel({agents}:{agents:Agent[]}){
 const saved=agents.filter(a=>a.id&&!a.archived);
 const [v,setV]=useState<View|null>(null);const [busy,setBusy]=useState('');const [open,setOpen]=useState(false);
 const [agentId,setAgentId]=useState('');const [origin,setOrigin]=useState('');const [daily,setDaily]=useState('50');
 const refresh=useCallback(()=>{api('/api/embed').then(setV).catch(()=>null);},[]);
 useEffect(()=>{refresh();},[refresh]);
 const act=async(key:string,init:RequestInit,done?:string)=>{if(busy)return false;setBusy(key);try{setV(await api('/api/embed',init));if(done)toast.success(done);return true;}catch(e:any){toast.error(e.message);refresh();return false;}finally{setBusy('');}};
 const post=(key:string,payload:object,done?:string)=>act(key,{method:'POST',body:JSON.stringify(payload)},done);
 const L=v?.limits;const full=!!v&&!!L&&v.embeds.length>=L.max;const pick=saved.find(a=>a.id===agentId)||saved[0];
 return <section className="grid gap-4 rounded-xl border bg-card p-5">
  <div className="grid gap-1"><b className="text-[15px] font-semibold">On your site</b>
   <p className="text-[13px] text-muted-foreground">Put a chat with one of your agents on your own website. Visitors need no wallet and no account: each answer is a chat message paid from your credits{L?` (${L.message} per answer)`:''}, and it lands in your History.</p></div>
  {v&&v.embeds.length>0&&<div className="grid gap-2">{v.embeds.map(e=><div key={e.id} className="grid gap-2 rounded-lg border bg-secondary/30 px-3 py-2.5">
   <div className="flex flex-wrap items-center gap-3">
    <div className="grid min-w-40 flex-1"><b className="truncate text-[13px] font-medium">{e.agentName} · {e.origin.replace(/^https?:\/\//,'')}</b>
     <span className={e.gone?'text-[11.5px] text-coral':'text-[11.5px] text-muted-foreground'}>{e.gone?'This agent was archived: the chat does not answer.':`${e.used}/${e.daily} answers today${e.active?'':' · switched off'}`}</span></div>
    <label className="flex items-center gap-2 text-[12px] text-muted-foreground"><Switch checked={e.active} disabled={!!busy} aria-label={e.active?'Switch this chat off':'Switch this chat on'} onCheckedChange={on=>post('a'+e.id,{action:'update',id:e.id,active:on})}/>On</label>
    <NativeSelect size="sm" value={String(e.daily)} disabled={!!busy} aria-label="Answers per day" onChange={ev=>post('d'+e.id,{action:'update',id:e.id,daily:Number(ev.target.value)})}>{(L?.daily||[e.daily]).map(n=><NativeSelectOption key={n} value={String(n)}>{n} a day</NativeSelectOption>)}</NativeSelect>
    <Button size="sm" variant="outline" asChild><a href={`/embed/${e.id}`} target="_blank" rel="noreferrer noopener">Preview</a></Button>
    <Button size="sm" variant="ghost" disabled={!!busy} onClick={()=>{if(confirm('Remove this chat? The frame on your site will say it is not available.'))act('x'+e.id,{method:'DELETE',body:JSON.stringify({id:e.id})});}}><I id="archive"/>Remove</Button>
   </div>
   <div className="flex items-start gap-2"><code className="min-w-0 flex-1 rounded-md border bg-background px-2.5 py-1.5 font-mono text-[11px] leading-relaxed break-all text-muted-foreground">{frame(e.id,e.agentName)}</code>
    <Button size="sm" variant="outline" onClick={()=>copyText(frame(e.id,e.agentName),toast.success,toast.error)}><I id="copy"/>Copy</Button></div>
  </div>)}</div>}
  {!open?<div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" disabled={full||!saved.length} onClick={()=>setOpen(true)}><I id="plus"/>Add a chat to a site</Button>
   <span className="text-xs text-muted-foreground">{!saved.length?'Save an agent in the Studio first.':full?`You have ${L!.max} chats, the maximum. Remove one first.`:''}</span></div>
  :<div className="grid gap-3 rounded-lg border bg-secondary/30 p-4">
   <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
    <div className="grid gap-2"><FieldLabel htmlFor="emb-agent">Agent</FieldLabel><NativeSelect id="emb-agent" value={pick?.id||''} onChange={e=>setAgentId(e.target.value)}>{saved.map(a=><NativeSelectOption key={a.id} value={a.id!}>{a.name}</NativeSelectOption>)}</NativeSelect></div>
    <div className="grid gap-2"><FieldLabel htmlFor="emb-site">Your site</FieldLabel><Input id="emb-site" value={origin} onChange={e=>setOrigin(e.target.value)} maxLength={200} placeholder="https://example.com" inputMode="url" autoComplete="url"/></div>
    <div className="grid gap-2"><FieldLabel htmlFor="emb-daily">Answers a day</FieldLabel><NativeSelect id="emb-daily" value={daily} onChange={e=>setDaily(e.target.value)}>{(L?.daily||[50]).map(n=><NativeSelectOption key={n} value={String(n)}>{n}</NativeSelectOption>)}</NativeSelect></div>
   </div>
   <p className="text-[12px] text-muted-foreground">At most {daily} answers a day, so at most {L?Number(daily)*L.message:'…'} credits a day from your balance; one visitor gets up to {L?.perVisitor??15} a day. The chat shows on the site you name here and nowhere else in a browser. Someone who calls its address with a program can still use up the day’s answers, never more. {L?.perAccount&&L.mode==='live'?` Answers count as live runs of your account, and all of them together (here, in Telegram and your own) stop at ${L.perAccount} a day on this server.`:''} The agent’s instructions are never shown, and it answers without web search.{L?.mode==='sample'?' AI is not connected on this server, so answers are labelled workflow samples.':''}</p>
   <div className="flex flex-wrap gap-2"><Button disabled={!!busy||!pick||origin.trim().length<4} onClick={async()=>{if(await post('new',{action:'create',agentId:pick!.id,origin,daily:Number(daily)},'The chat is ready: copy the frame into your site')){setOpen(false);setOrigin('');}}}><I id="check"/>{busy==='new'?'Creating…':'Create the chat'}</Button>
    <Button variant="ghost" disabled={!!busy} onClick={()=>setOpen(false)}>Cancel</Button></div>
  </div>}
 </section>;
}
