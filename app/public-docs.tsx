'use client';
/* Public docs (/docs, /whitepaper, /roadmap): an editorial reading layout for visitors, different from the
   compact 3-column docs inside the dashboard (/dashboard/docs, DocsShell). Big header, kind tabs, sticky section
   chips, one centered reading column with an "on this page" rail on wide screens, prev/next, then the footer. */
import {useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {CONTENT} from '@/lib/rhio3d/content';
import type {DocSection} from '@/lib/rhio3d/engine';
import {DOC_GROUPS,Markdown,RoadmapPage,headingsOf,type DocKind} from './content-pages';
import {SiteFooter} from '@/components/rhio/site-footer';
import type {View} from '@/lib/routes';

type Go=(v:View,doc?:string)=>void;
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const minutes=(t:string)=>Math.max(1,Math.round(t.split(/\s+/).length/220));

function KindTabs({kind,onNavigate}:{kind:DocKind|'roadmap';onNavigate:Go}){
 const tabs:[DocKind|'roadmap',string,string][]=[['docs','Docs','book'],['paper','Whitepaper','doc'],['roadmap','Roadmap','map']];
 return <div role="tablist" className="inline-flex gap-1 rounded-xl border bg-card p-1">{tabs.map(([k,t,ic])=><button key={k} role="tab" aria-selected={kind===k} onClick={()=>onNavigate(k)}
  className={cn('flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4',kind===k&&'bg-foreground text-background hover:text-background')}><I id={ic}/>{t}</button>)}</div>;
}

function Hero({kicker,title,meta,kind,onNavigate}:{kicker:string;title:string;meta:string;kind:DocKind|'roadmap';onNavigate:Go}){
 return <header className="border-b bg-t-lime/40">
  <div className="mx-auto grid max-w-[1180px] gap-5 px-[clamp(16px,3vw,32px)] pt-[clamp(28px,5vw,56px)] pb-8">
   <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11px] tracking-[.08em] text-muted-foreground uppercase"><button onClick={()=>onNavigate('home')} className="hover:text-foreground">RHIO</button><span>/</span><span>{kicker}</span></nav>
   <h1 className="max-w-[20ch] font-display text-[clamp(34px,5.2vw,64px)] leading-[1.02] font-medium tracking-[-.045em]">{title}</h1>
   <div className="flex flex-wrap items-center justify-between gap-4"><span className="font-mono text-[11px] tracking-[.06em] text-muted-foreground uppercase">{meta}</span><KindTabs kind={kind} onNavigate={onNavigate}/></div>
  </div>
 </header>;
}

export function PublicDocs({kind,page,onPage,onNavigate}:{kind:DocKind;page:string;onPage:(k:DocKind,id:string)=>void;onNavigate:Go}){
 const list:DocSection[]=kind==='docs'?CONTENT.docs:CONTENT.paper.sections;
 const sec=list.find(s=>s.id===page)||list[0];const idx=list.indexOf(sec);const prev=list[idx-1];const next=list[idx+1];
 const heads=useMemo(()=>headingsOf(sec.body),[sec.body]);const prefix=`pub-${kind}-${sec.id}-`;
 const groups=DOC_GROUPS.filter(g=>g.kind===kind);const [active,setActive]=useState('');const chips=useRef<HTMLDivElement>(null);
 useEffect(()=>{setActive(heads[0]?prefix+slug(heads[0]):'');
  chips.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'center'});
  const els=heads.map(h=>document.getElementById(prefix+slug(h))).filter(Boolean) as HTMLElement[];if(!els.length)return;
  const io=new IntersectionObserver(en=>{en.forEach(x=>{if(x.isIntersecting)setActive(x.target.id);});},{rootMargin:'-20% 0px -65% 0px'});els.forEach(e=>io.observe(e));return()=>io.disconnect();},[kind,sec.id]); // eslint-disable-line react-hooks/exhaustive-deps
 return <>
  <Hero kicker={kind==='docs'?'Docs':'Whitepaper'} title={sec.title} kind={kind} onNavigate={onNavigate}
   meta={`${kind==='paper'?CONTENT.paper.status+' · ':''}${minutes(sec.body)} min read · ${CONTENT.version}`}/>
  {/* section chips, sticky under the navbar */}
  <div className="sticky top-[var(--top)] z-20 border-b bg-background/95 backdrop-blur">
   <div ref={chips} className="mx-auto flex max-w-[1180px] gap-1.5 overflow-x-auto px-[clamp(16px,3vw,32px)] py-2.5">
    {groups.flatMap(g=>g.items).map(it=><button key={it.id} onClick={()=>onPage(kind,it.id)} aria-current={it.id===sec.id?'page':undefined}
     className="h-8 shrink-0 rounded-lg border px-3 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background">{it.title}</button>)}
   </div>
  </div>
  <div className="mx-auto grid max-w-[1180px] gap-10 px-[clamp(16px,3vw,32px)] pt-10 pb-16 xl:grid-cols-[minmax(0,1fr)_220px]">
   <article className="mx-auto w-full max-w-[72ch]">
    <div className="doc-md text-[15.5px] leading-[1.75]"><Markdown src={sec.body} idPrefix={prefix}/></div>
    <div className="mt-12 grid gap-3 sm:grid-cols-2">
     {prev?<button onClick={()=>onPage(kind,prev.id)} className="grid gap-1 rounded-xl border p-4 text-left transition-colors hover:border-foreground/30"><span className="font-mono text-[10.5px] tracking-[.08em] text-muted-foreground uppercase">← Previous</span><b className="font-medium">{prev.title}</b></button>:<span/>}
     {next&&<button onClick={()=>onPage(kind,next.id)} className="grid gap-1 rounded-xl border p-4 text-right transition-colors hover:border-foreground/30 sm:col-start-2"><span className="font-mono text-[10.5px] tracking-[.08em] text-muted-foreground uppercase">Next →</span><b className="font-medium">{next.title}</b></button>}
    </div>
   </article>
   {!!heads.length&&<aside className="sticky top-[calc(var(--top)+72px)] h-fit max-xl:hidden">
    <span className="font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">On this page</span>
    <ul className="mt-3 grid gap-1.5 border-l">{heads.map(h=>{const id=prefix+slug(h);return <li key={id}><a href={`#${id}`} onClick={e=>{e.preventDefault();document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});}}
     className={cn('-ml-px block border-l py-0.5 pl-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground',active===id&&'border-foreground text-foreground')}>{h}</a></li>;})}</ul>
   </aside>}
  </div>
  <CtaBand onNavigate={onNavigate}/>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}

export function PublicRoadmap({onNavigate}:{onNavigate:Go}){
 const done=CONTENT.roadmap.flatMap(p=>p.items).filter(([s])=>s==='done').length;const all=CONTENT.roadmap.flatMap(p=>p.items).length;
 return <>
  <Hero kicker="Roadmap" title="What has shipped, and what comes next" kind="roadmap" onNavigate={onNavigate} meta={`${done} of ${all} items shipped · dates are targets, not promises`}/>
  <div className="mx-auto max-w-[1000px] px-[clamp(16px,3vw,32px)] pt-10 pb-16"><RoadmapPage/></div>
  <CtaBand onNavigate={onNavigate}/>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}

function CtaBand({onNavigate}:{onNavigate:Go}){
 return <section className="border-t bg-card">
  <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-[clamp(16px,3vw,32px)] py-8">
   <div className="grid gap-1"><b className="font-display text-xl font-medium tracking-[-.02em]">Ready to build an agent?</b><span className="text-sm text-muted-foreground">Connect a wallet on Robinhood Chain and open the studio.</span></div>
   <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>onNavigate('login')}><I id="wallet"/>Connect wallet</Button><Button onClick={()=>onNavigate('studio')}>Open the studio<I id="arrow"/></Button></div>
  </div>
 </section>;
}
