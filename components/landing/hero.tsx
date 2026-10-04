'use client';
/* Landing hero (white, no background motion). Split layout: copy on the left; on the right a fanned
   deck of portrait cards (active card in front, the next ones spread to the right like a hand of
   cards) with a labelled progress rail. On mobile the same cards become a native horizontal
   scroll-snap row with dots. Followed by the skills strip with crosshair corners. */
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {characters,powers,type CharacterId} from '@/lib/characters';
import {openSkills} from '@/lib/agents';
import {I,SKILL_ICON} from '@/app/ui';
import {cn} from '@/lib/utils';
import {Corners,CutButton,Eyebrow,Marquee,reduced} from '@/components/rhio/motion';
import {Thumb} from './mocks';
import {gsap} from '@/components/rhio/gsap-motion';
import {ContractPill} from '@/components/rhio/contract-pill';

type Card={k:string;t:string;bg:string;fg:string;id:CharacterId};
const DECK:Card[]=[
 {k:'Roster',t:`${characters.length} original 3D characters`,bg:'bg-lime',fg:'text-ink',id:'atlas'},
 {k:'Persona',t:'A mind that travels with every task',bg:'bg-iris',fg:'text-white',id:'mira'},
 {k:'Skills',t:'Skills that do real work, more unlocking',bg:'bg-[#262825]',fg:'text-white',id:'scout'},
 {k:'Outfits',t:'Dress every piece, in any color',bg:'bg-coral',fg:'text-ink',id:'nova'},
 {k:'Stage',t:'26 motions and 6 powers',bg:'bg-sky',fg:'text-ink',id:'volt'},
 {k:'Discover',t:'Publish it and earn per run',bg:'bg-amber',fg:'text-ink',id:'cole'},
 {k:'Rewards',t:'NVDA rewards for holders, open',bg:'bg-mint',fg:'text-ink',id:'lumi'},
];
const HOLD=3800;

function CardFace({c,k,className,style,onClick,hidden,cardRef}:{c:Card;k:number;className?:string;style?:CSSProperties;onClick?:()=>void;hidden?:boolean;cardRef?:(el:HTMLElement|null)=>void}){
 return <article ref={cardRef} aria-hidden={hidden} onClick={onClick} style={style}
  className={cn('relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl p-5 select-none',c.bg,c.fg,className)}>
  <header className="relative z-10 flex items-center justify-between font-mono text-[10.5px] font-semibold tracking-[.1em] uppercase"><span>#{String(k+1).padStart(2,'0')}</span><span className="rounded-lg border border-current/25 px-2 py-0.5">{c.k}</span></header>
  <Thumb id={c.id} eager={k<2} className="pointer-events-none absolute inset-x-0 top-[12%] mx-auto h-[70%] w-auto object-contain"/>
  <h3 className="relative z-10 mt-auto max-w-[90%] font-display text-[clamp(20px,1.7vw,26px)] leading-[1.08] font-medium tracking-[-.03em]">{c.t}</h3>
 </article>;
}

export function Hero({onNavigate,onPick}:{onNavigate:(v:'studio')=>void;onPick:(id:CharacterId)=>void}){
 const N=DECK.length;const [a,setA]=useState(0);const [paused,setPaused]=useState(false);const drag=useRef<number|null>(null);
 const row=useRef<HTMLDivElement>(null);const [dot,setDot]=useState(0);
 const cards=useRef<(HTMLElement|null)[]>([]);const first=useRef(true);const bar=useRef<HTMLSpanElement|null>(null);
 useEffect(()=>{const instant=first.current;first.current=false;const calm=reduced();
  cards.current.forEach((el,k)=>{if(!el)return;const o=(k-a+N)%N;const gone=o===N-1;const vis=o<=3;
   gsap.set(el,{zIndex:N-o});
   gsap.to(el,{xPercent:gone?-18:o*14,yPercent:-50,rotation:gone?-8:o*3,scale:gone?.92:1-o*.07,autoAlpha:gone||!vis?0:1,duration:instant?0:calm?.5:.95,ease:calm?'power2.out':'expo.out',overwrite:'auto'});
  });},[a,N]);
 useEffect(()=>{const el=bar.current;if(!el)return;
  // the active segment fills over the hold time; when paused it stays half-lit instead of snapping
  if(paused){gsap.set(el,{scaleX:1,transformOrigin:'left center',opacity:.5});return;}
  const tw=gsap.fromTo(el,{scaleX:0,opacity:1},{scaleX:1,duration:HOLD/1000,ease:'none',transformOrigin:'left center'});return()=>{tw.kill();};},[a,paused]);
 useEffect(()=>{if(paused)return;const t=setTimeout(()=>setA(x=>(x+1)%N),HOLD);return()=>clearTimeout(t);},[paused,a,N]);
 const step=(d:number)=>setA(x=>(x+d+N)%N);
 const onRowScroll=()=>{const el=row.current;if(!el)return;const w=(el.firstElementChild as HTMLElement)?.offsetWidth||1;setDot(Math.round(el.scrollLeft/(w+12)));};
 const skills=openSkills();
 return <>
  <section className="relative bg-background">
   <h1 className="sr-only">RHIO Agent Studio: build AI agents with a face and put them to work.</h1>
   <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-[clamp(16px,3vw,40px)] pt-[clamp(28px,5vh,64px)] pb-[clamp(40px,6vh,72px)] md:min-h-[calc(100svh-var(--top)-40px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] lg:gap-12">
    {/* copy */}
    <div className="stagger grid min-w-0 content-center justify-items-start gap-7">
     <Eyebrow tone="iris">AI agents with a face · private preview</Eyebrow>
     <p aria-hidden="true" className="font-display text-[clamp(44px,5.6vw,92px)] leading-[.96] tracking-[-.05em]"><span className="font-light">Build AI agents</span><br/><span className="font-medium">with a face.</span></p>
     <p className="max-w-[44ch] text-[clamp(15.5px,1.2vw,17px)] leading-relaxed text-muted-foreground">Pick a character, dress it, give it a mind and equip skills that research, write, translate and review code. Then share it, publish it or run it.</p>
     <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap"><CutButton size="lg" className="magnetic w-full sm:w-auto" onClick={()=>onNavigate('studio')}>Open the studio <I id="arrow"/></CutButton><CutButton size="lg" variant="outline" className="w-full sm:w-auto" onClick={()=>document.getElementById('the-idea')?.scrollIntoView({behavior:'smooth'})}>How it works</CutButton></div>
     <ContractPill className="w-full sm:w-auto"/>
     <dl className="grid w-full max-w-[480px] grid-cols-3 border-y border-dashed border-foreground/20">
      {[[characters.length,'Characters'],[skills.length,'Agent skills'],[powers.length,'Powers']].map(([n,l],k)=><div key={l as string} className={cn('flex flex-col-reverse gap-1 py-4',k>0&&'border-l border-dashed border-foreground/20 pl-4')}><dt className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">{l}</dt><dd className="font-display text-[28px] leading-none font-medium tracking-[-.04em]">{n}</dd></div>)}
     </dl>
     <span className="font-mono text-[10.5px] tracking-[.06em] text-muted-foreground uppercase">Preview credits have no monetary value</span>
    </div>

    {/* fanned deck (tablet / desktop) */}
    <div className="max-md:hidden">
     <div role="region" aria-roledescription="carousel" aria-label="What is inside RHIO" tabIndex={0}
      className="float relative h-[clamp(360px,44vw,540px)] cursor-grab touch-pan-y outline-none active:cursor-grabbing"
      onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}}
      onPointerDown={e=>{drag.current=e.clientX;}} onPointerUp={e=>{const s=drag.current;drag.current=null;if(s===null)return;const dx=e.clientX-s;if(Math.abs(dx)>30)step(dx<0?1:-1);}}>
      {DECK.map((c,k)=>{const o=(k-a+N)%N;
       return <CardFace key={c.k} c={c} k={k} hidden={o!==0} cardRef={el=>{cards.current[k]=el;}} onClick={()=>{if(o===0)onPick(c.id);else setA(k);}}
        className={cn('tilt absolute top-1/2 left-[2%] w-[clamp(210px,25vw,340px)] shadow-[0_30px_60px_-34px_rgb(0_0_0/.45)] will-change-transform',o!==0&&'cursor-pointer')}
        style={{transform:`translate(${k===N-1?-18:k*14}%,-50%) rotate(${k===N-1?-8:k*3}deg) scale(${k===N-1?.92:1-k*.07})`,opacity:k===N-1||k>3?0:1,zIndex:N-k}}/>;})}
     </div>
     {/* progress rail */}
     <div className="mt-6 grid gap-3">
      <div className="stagger flex gap-1.5">{DECK.map((c,k)=><button key={c.k} onClick={()=>setA(k)} aria-label={`Show ${c.k}`} className="relative h-1 flex-1 overflow-hidden rounded-lg bg-foreground/10">
       <span className={cn('absolute inset-0 bg-foreground/35 transition-opacity duration-500',k<a?'opacity-100':'opacity-0')}/>
       {k===a&&<span key={a} ref={bar} className="absolute inset-0 origin-left bg-foreground"/>}
      </button>)}</div>
      <div className="flex items-center justify-between gap-3">
       <span className="font-mono text-[10.5px] tracking-[.1em] uppercase"><b className="font-semibold">{String(a+1).padStart(2,'0')}</b><span className="text-muted-foreground"> / {String(N).padStart(2,'0')} · {DECK[a].k}</span></span>
       <div className="flex gap-1.5">
        <button onClick={()=>step(-1)} aria-label="Previous card" className="grid size-9 place-items-center rounded-lg border transition-colors hover:bg-secondary [&_svg]:size-4"><I id="arrow" className="i rotate-180"/></button>
        <button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play':'Pause'} className="grid size-9 place-items-center rounded-lg border transition-colors hover:bg-secondary [&_svg]:size-4"><I id={paused?'play':'pause'}/></button>
        <button onClick={()=>step(1)} aria-label="Next card" className="grid size-9 place-items-center rounded-lg border transition-colors hover:bg-secondary [&_svg]:size-4"><I id="arrow"/></button>
       </div>
      </div>
     </div>
    </div>

    {/* mobile: native horizontal scroll with snap */}
    <div className="-mx-4 min-w-0 md:hidden">
     <div ref={row} onScroll={onRowScroll} className="stagger flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2" aria-label="What is inside RHIO">
      {DECK.map((c,k)=><CardFace key={c.k} c={c} k={k} onClick={()=>onPick(c.id)} className="w-[72vw] max-w-[300px] shrink-0 snap-center"/>)}
     </div>
     <div className="mt-3 flex items-center justify-between px-4">
      <div className="flex gap-1.5">{DECK.map((c,k)=><span key={c.k} className={cn('h-1.5 rounded-lg transition-all duration-300',k===dot?'w-5 bg-foreground':'w-1.5 bg-foreground/20')}/>)}</div>
      <span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Swipe · {DECK[Math.min(dot,N-1)].k}</span>
     </div>
    </div>
   </div>
  </section>

  {/* skills strip (Twenty "trusted by") */}
  <section className="bg-background px-4 pb-4">
   <div className="relative mx-auto flex max-w-[1280px] items-stretch border">
    <Corners/>
    <span className="grid shrink-0 place-items-center border-r px-6 font-mono text-[10.5px] leading-tight font-semibold tracking-[.1em] uppercase max-sm:hidden">What agents<br/>do today</span>
    <Marquee duration={40} gap="0px" className="min-w-0 flex-1">
     {[...skills.map(s=>({k:s.id,icon:SKILL_ICON[s.icon]||'globe',t:s.name})),...powers.map(p=>({k:p.id,icon:p.id,t:p.name}))].map(x=><span key={x.k} className="flex h-16 items-center gap-2.5 border-r px-7 text-[15px] font-medium whitespace-nowrap text-foreground/80 [&_svg]:size-4"><I id={x.icon}/>{x.t}</span>)}
    </Marquee>
    <span className="flex shrink-0 items-center gap-2 border-l px-5 text-[13px] text-muted-foreground max-md:hidden"><I id="clock"/>schedule any skill</span>
   </div>
  </section>
 </>;
}
