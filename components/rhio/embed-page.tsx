'use client';
/* The chat a creator places on their own site (/embed/<id>, shown inside a frame there; lib/embed.ts). No navigation,
   no sign-in: a visitor reads the agent's greeting and writes. Every answer is paid by the account that made the
   embed, so the page never shows credits or prices. The page tells the server which site it is shown on
   (the frame's parent); the server answers for the site its creator named, and for the creator opening it directly
   as a preview. The conversation's id lives in this browser's storage for the frame, so a reload keeps the thread
   for the agent, though not the text on screen. ?theme=light or ?theme=dark picks the look. */
import {useEffect,useRef,useState} from 'react';
import {api,I,TextOut} from '@/app/ui';
import {useThumb} from '@/app/avatar';
import {lookFor} from '@/lib/characters';
import {agentPath} from '@/lib/routes';

type Info={/** what it can read in this chat, in words ('' when nothing) */reads?:string;/** how to ask for it */ask?:string;id:string;name:string;skin:string;look:unknown;appearance:unknown;motion:string|null;tagline:string;greeting:string;starters:string[];agentId:string|null;mode:'live'|'sample';max:number;preview:boolean;active:boolean};
type Line={id:string;asked:string;answer:string;error?:string;pending?:boolean};

/** The site this page is framed by ('' when it is opened on its own). */
function parentSite(){
 try{if(window.top===window)return '';}catch{/* a cross-site parent: we are framed */}
 try{const a=(location as unknown as {ancestorOrigins?:{length:number;[i:number]:string}}).ancestorOrigins;if(a&&a.length)return a[0];}catch{/* not supported */}
 try{return document.referrer?new URL(document.referrer).origin:'unknown';}catch{return 'unknown';}
}
const threadOf=(id:string)=>{const k=`rhio-embed:${id}`;try{const had=localStorage.getItem(k);if(had&&/^[0-9a-f-]{36}$/.test(had))return had;const t=crypto.randomUUID();localStorage.setItem(k,t);return t;}catch{return crypto.randomUUID();}};

function Face({info}:{info:Info}){
 const src=useThumb(lookFor(info.skin as never,info.look as never,info.appearance as never),info.skin as never,true);
 return <span className="grid size-10 shrink-0 overflow-hidden rounded-xl bg-lime"><img src={src} alt="" draggable={false} className="h-full w-full origin-[50%_14%] scale-[1.7] object-cover object-[50%_12%]"/></span>;
}

export function EmbedPage({id}:{id:string}){
 const [info,setInfo]=useState<Info|null>(null);const [problem,setProblem]=useState('');
 const [lines,setLines]=useState<Line[]>([]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);
 const site=useRef('');const thread=useRef('');const end=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  try{const t=new URLSearchParams(location.search).get('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch{/* keep the default */}
  site.current=parentSite();thread.current=threadOf(id);let alive=true;
  api(`/api/embed?id=${encodeURIComponent(id)}&site=${encodeURIComponent(site.current)}`).then(d=>{if(alive)setInfo(d.embed);}).catch(e=>{if(alive)setProblem(e.message||'This chat is not available.');});
  return()=>{alive=false;};},[id]);
 useEffect(()=>{end.current?.scrollIntoView({block:'end'});},[lines]);
 async function send(given?:string){
  const message=(given??text).trim();if(!message||busy||!info)return;
  const rid=crypto.randomUUID();setBusy(true);setText('');setLines(l=>[...l,{id:rid,asked:message,answer:'',pending:true}]);
  try{
   const r=await api('/api/embed',{method:'POST',body:JSON.stringify({action:'say',id,site:site.current,thread:thread.current,rid,message})});
   setLines(l=>l.map(x=>x.id===rid?{id:rid,asked:message,answer:r.answer}:x));
  }catch(e:any){setLines(l=>l.map(x=>x.id===rid?{id:rid,asked:message,answer:'',error:e.message||'That message could not be answered.'}:x));}
  finally{setBusy(false);}
 }
 if(problem)return <div className="grid min-h-svh place-content-center gap-2 bg-background p-6 text-center"><b className="text-[15px] font-medium">Chat not available</b><p className="max-w-[36ch] text-[13px] text-muted-foreground">{problem}</p></div>;
 return <div className="flex h-svh min-h-80 flex-col bg-background text-foreground">
  <header className="flex items-center gap-3 border-b px-4 py-3">
   {info?<Face info={info}/>:<span className="size-10 shrink-0 rounded-xl bg-secondary"/>}
   <div className="grid min-w-0 flex-1"><b className="truncate text-[15px] font-medium">{info?.name||' '}</b><span className="truncate text-[12px] text-muted-foreground">{info?(info.tagline||'AI character'):'Loading…'}</span></div>
   {info?.preview&&<span className="shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase" title="You are looking at your own chat. Messages you send here are charged like your visitors’.">Preview</span>}
  </header>
  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]" aria-live="polite">
   <div className="grid gap-3">
    {info&&lines.length===0&&<>
     <div className="max-w-[88%] justify-self-start rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-[14.5px]">{info.greeting||`Hi. Ask ${info.name} anything.`}</div>
     {info.reads&&info.mode==='live'&&<p className="text-[12px] text-muted-foreground">It can read {info.reads}. {info.ask||'Paste an address'}.</p>}
     {info.starters.length>0&&<div className="flex flex-wrap gap-1.5">{info.starters.map(s=><button key={s} type="button" disabled={busy} onClick={()=>send(s)} className="rounded-xl border px-3 py-1.5 text-left text-[13px] transition-colors hover:border-foreground/40">{s}</button>)}</div>}
    </>}
    {lines.map(l=><div key={l.id} className="grid gap-2">
     <p className="max-w-[85%] justify-self-end rounded-2xl rounded-br-md bg-lime px-3.5 py-2 text-[14.5px] break-words whitespace-pre-wrap text-ink">{l.asked}</p>
     <div className="max-w-[92%] justify-self-start rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-[14.5px]">
      {l.pending?<span className="text-muted-foreground">Thinking…</span>:l.error?<span className="text-muted-foreground">{l.error}</span>:<TextOut text={l.answer}/>}</div>
    </div>)}
    <div ref={end}/>
   </div>
  </div>
  <form className="flex items-end gap-2 border-t p-3" onSubmit={e=>{e.preventDefault();send();}}>
   <textarea value={text} onChange={e=>setText(e.target.value)} maxLength={info?.max??600} rows={1} disabled={!info||busy} aria-label={info?`Message to ${info.name}`:'Message'} placeholder={info?`Message ${info.name}…`:''}
    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}
    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border bg-card px-3 py-2 text-[14.5px] outline-none focus:border-foreground/40 disabled:opacity-60"/>
   <button type="submit" disabled={!info||busy||!text.trim()} aria-label="Send" className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime text-ink transition-opacity disabled:opacity-40"><I id="arrow" className="i size-4"/></button>
  </form>
  <p className="px-4 pb-2.5 text-[11px] text-muted-foreground">An AI character{info?.mode==='sample'?' (workflow sample: AI is not connected here)':''}. It can be wrong, and nothing it says is financial advice. <a href={info?.agentId?agentPath(info.agentId):'/'} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-foreground">On RHIO</a></p>
 </div>;
}
