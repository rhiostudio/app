'use client';
/* Reusable marketing primitives: motion helpers (Marquee, Reveal, CountUp, Typewriter, scroll
   progress) and small design atoms (Eyebrow, CutButton, BracketLink, Corners, DashedRule).
   Everything respects prefers-reduced-motion. No gradients, no scenery. */
import {useEffect,useRef,useState,type ButtonHTMLAttributes,type CSSProperties,type ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {gsap,ScrollTrigger} from './gsap-motion';

export const reduced=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export type Tone='lime'|'iris'|'coral'|'sky'|'amber'|'mint'|'pink'|'ink';
export const TONE_BG:Record<Tone,string>={lime:'bg-lime',iris:'bg-iris',coral:'bg-coral',sky:'bg-sky',amber:'bg-amber',mint:'bg-mint',pink:'bg-pink',ink:'bg-foreground'};
export const TINT_BG:Record<Tone,string>={lime:'bg-t-lime',iris:'bg-t-iris',coral:'bg-t-coral',sky:'bg-t-sky',amber:'bg-t-amber',mint:'bg-t-mint',pink:'bg-t-pink',ink:'bg-secondary'};

/** Infinite horizontal marquee. Children render twice; the copy is inert. */
export function Marquee({children,reverse,duration=40,gap='1rem',pauseOnHover=true,className}:{children:ReactNode;reverse?:boolean;duration?:number;gap?:string;pauseOnHover?:boolean;className?:string}){
 const track=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=track.current;if(!el||reduced())return;
  const gapPx=()=>parseFloat(getComputedStyle(el).columnGap)||0;
  const dist=()=>(el.scrollWidth+gapPx())/2;
  const tw=gsap.fromTo(el,{x:reverse?()=>-dist():0},{x:reverse?0:()=>-dist(),duration,ease:'none',repeat:-1,invalidateOnRefresh:true});
  const box=el.parentElement!;
  const slow=()=>gsap.to(tw,{timeScale:0,duration:.6,ease:'power2.out',overwrite:true});
  const go=()=>gsap.to(tw,{timeScale:1,duration:.8,ease:'power2.in',overwrite:true});
  if(pauseOnHover){box.addEventListener('pointerenter',slow);box.addEventListener('pointerleave',go);}
  return()=>{tw.kill();box.removeEventListener('pointerenter',slow);box.removeEventListener('pointerleave',go);};},[duration,reverse,pauseOnHover]);
 return <div className={cn('flex overflow-hidden',className)} style={{'--marquee-gap':gap} as CSSProperties}>
  <div ref={track} className="flex w-max shrink-0 items-center gap-[var(--marquee-gap)] will-change-transform">
   {children}<div className="contents" aria-hidden="true" inert>{children}</div>
  </div>
 </div>;
}

export function useInView<T extends Element>(once=true,margin='0px 0px -10% 0px'){
 const ref=useRef<T>(null);const [inView,setInView]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;if(reduced()||!('IntersectionObserver' in window)){setInView(true);return;}
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setInView(true);if(once)io.disconnect();}else if(!once)setInView(false);},{rootMargin:margin,threshold:.1});
  io.observe(el);return()=>io.disconnect();},[once,margin]);
 return [ref,inView] as const;
}

/** Fade-up on first view. */
export function Reveal({children,className,delay=0}:{children:ReactNode;className?:string;delay?:number}){
 return <div data-reveal="" data-delay={delay||undefined} className={className}>{children}</div>;
}

/** Twenty-style section label: a small solid square + text. */
export function Eyebrow({children,tone='iris',className}:{children:ReactNode;tone?:Tone;className?:string}){
 return <span className={cn('inline-flex items-center gap-2 text-[13px] font-medium text-foreground',className)}><i className={cn('h-2 w-3 rounded-[2px]',TONE_BG[tone])}/>{children}</span>;
}

/** Button with a chamfered bottom-right corner (Twenty). `outline` draws a 1px frame that follows the cut. */
const CUT='[clip-path:polygon(0_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%)]';
export function CutButton({variant='dark',size='md',className,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'dark'|'lime'|'light'|'outline';size?:'sm'|'md'|'lg'}){
 const sz=size==='sm'?'h-9 px-4 text-[11px]':size==='lg'?'h-12 px-6 text-[12.5px]':'h-11 px-5 text-[12px]';
 const inner=cn('inline-flex w-full items-center justify-center gap-2 font-mono font-semibold tracking-[.08em] uppercase transition-colors duration-300 [&_svg]:size-3.5',CUT,sz);
 if(variant==='outline')return <button {...props} className={cn('group/cut inline-flex bg-foreground/25 p-px transition-colors duration-300 hover:bg-foreground',CUT,className)}><span className={cn(inner,'bg-background text-foreground')}>{children}</span></button>;
 const fill=variant==='lime'?'bg-lime text-ink hover:bg-[var(--lime-hover)]':variant==='light'?'bg-white text-[#1f201e] hover:bg-white/85':'bg-foreground text-background hover:bg-foreground/85';
 return <button {...props} className={cn('inline-flex',className)}><span className={cn(inner,fill)}>{children}</span></button>;
}

/** Koyeb-style bracket CTA: ‹ LABEL › with brackets that slide apart on hover. */
export function BracketLink({children,onClick,className}:{children:ReactNode;onClick?:()=>void;className?:string}){
 return <button type="button" onClick={onClick} className={cn('group/bl inline-flex items-center gap-2 font-mono text-[11.5px] font-semibold tracking-[.1em] text-foreground uppercase transition-colors hover:text-brand',className)}>
  <span className="transition-transform duration-300 group-hover/bl:-translate-x-1">‹</span>{children}<span className="transition-transform duration-300 group-hover/bl:translate-x-1">›</span>
 </button>;
}

/** Crosshair "+" marks on the four corners of a relative parent. */
export function Corners({className,tone='text-foreground/40'}:{className?:string;tone?:string}){
 const mark=cn('absolute size-3 before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-current after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:bg-current',tone);
 return <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0',className)}>
  <span className={cn(mark,'-top-1.5 -left-1.5')}/><span className={cn(mark,'-top-1.5 -right-1.5')}/><span className={cn(mark,'-bottom-1.5 -left-1.5')}/><span className={cn(mark,'-right-1.5 -bottom-1.5')}/>
 </div>;
}
export function DashedRule({className}:{className?:string}){return <hr className={cn('border-0 border-t border-dashed border-foreground/20',className)}/>;}

/** Counts from 0 to `to` once visible. */
export function CountUp({to,suffix='',className,duration=1400}:{to:number;suffix?:string;className?:string;duration?:number}){
 const ref=useRef<HTMLSpanElement>(null);const [n,setN]=useState(to);
 useEffect(()=>{const el=ref.current;if(!el)return;if(reduced()){setN(to);return;}
  const o={v:0};setN(0);
  const tw=gsap.to(o,{v:to,duration:duration/1000,ease:'power3.out',paused:true,onUpdate:()=>setN(Math.round(o.v))});
  const st=ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:()=>tw.play()});
  return()=>{tw.kill();st.kill();};},[to,duration]);
 return <span ref={ref} className={cn('tabular-nums',className)}>{n}{suffix}</span>;
}

/** Types words one by one with a blinking caret. */
export function Typewriter({words,className}:{words:string[];className?:string}){
 const [i,setI]=useState(0);const [len,setLen]=useState(0);const [del,setDel]=useState(false);
 useEffect(()=>{if(reduced()){setLen(words[i].length);return;}
  const w=words[i];let t:ReturnType<typeof setTimeout>;
  if(!del&&len<w.length)t=setTimeout(()=>setLen(len+1),55);
  else if(!del)t=setTimeout(()=>setDel(true),1500);
  else if(len>0)t=setTimeout(()=>setLen(len-1),28);
  else{setDel(false);setI((i+1)%words.length);}
  return()=>clearTimeout(t);},[len,del,i,words]);
 return <span className={className}>{words[i].slice(0,len)}<span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[.12em] animate-blink bg-current"/></span>;
}

/** 0..1 progress of a tall element scrolling through the viewport, written to --p. */
export function useScrollProgress<T extends HTMLElement>(){
 const ref=useRef<T>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;if(reduced()){el.style.setProperty('--p','1');return;}
  const tw=gsap.fromTo(el,{'--p':0},{'--p':1,ease:'none',scrollTrigger:{trigger:el,start:'top top',end:'bottom bottom',scrub:.6}});
  return()=>{tw.scrollTrigger?.kill();tw.kill();};},[]);
 return ref;
}
