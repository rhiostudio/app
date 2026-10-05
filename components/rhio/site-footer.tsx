'use client';
/* Site footer for the public pages (home, docs, whitepaper, roadmap, login). Compact: brand + social on top,
   link columns in a 2-column grid on phones and 4 columns on wide screens. */
import {FaXTwitter,FaGithub} from 'react-icons/fa6';
import {cn} from '@/lib/utils';
import {Logo,type View} from './navbar';
import {CONTENT} from '@/lib/rhio3d/content';
import {SOCIAL} from '@/lib/site';

type Go=(v:View,doc?:string)=>void;
const COLS:[string,[View,string,string?][]][]=[
 ['Product',[['studio','Studio'],['discover','Discover'],['plaza','Plaza'],['arena','Arena'],['top','This week'],['skills','Skills'],['recipes','Recipes'],['teamup','Teams'],['creators','Creator agents'],['verified','Verified creators'],['overview','Dashboard']]],
 ['Learn',[['docs','Getting started',"start"],['docs','FAQ','faq'],['paper','Whitepaper'],['roadmap','Roadmap'],['whales','Whale watch'],['tiers','Holder tiers']]],
 ['Account',[['login','Connect wallet'],['wallet','Wallet & chain'],['rewards','Holder rewards'],['referral','Invite friends'],['profile','Profile']]],
];

export function SocialLinks({className=''}:{className?:string}){
 return <div className={`flex items-center gap-1.5 ${className}`}>
  <a href={SOCIAL.x} target="_blank" rel="noreferrer noopener" aria-label="RHIO on X" className="grid size-9 place-items-center rounded-lg border bg-card text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground [&_svg]:size-4"><FaXTwitter/></a>
  <a href={SOCIAL.github} target="_blank" rel="noreferrer noopener" aria-label="RHIO on GitHub" className="grid size-9 place-items-center rounded-lg border bg-card text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground [&_svg]:size-4"><FaGithub/></a>
 </div>;
}

/* Official Robinhood Chain wordmark, unmodified (public/brands, source in public/licenses/robinhood-chain-logo.txt).
   Brand rules: only approved pairings (white on black in dark mode, black on white in light mode), clear space of at
   least one "R" around it, and always the full name "Robinhood Chain". */
export function BuiltOnRobinhoodChain(){
 return <a href="https://docs.robinhood.com/chain" target="_blank" rel="noreferrer noopener" aria-label="Built on Robinhood Chain"
  className="inline-flex items-center gap-3 rounded-full border border-black/15 bg-white px-3.5 py-2 normal-case tracking-normal transition-opacity hover:opacity-85 dark:border-white/15 dark:bg-black">
  <span className="font-mono text-[10px] tracking-[.08em] text-black/60 uppercase dark:text-white/65">Built on</span>
  <img src="/brands/robinhood-chain-black.svg" alt="Robinhood Chain" width={107} height={14} loading="lazy" decoding="async" className="h-3.5 w-auto dark:hidden"/>
  <img src="/brands/robinhood-chain-white.svg" alt="Robinhood Chain" width={107} height={14} loading="lazy" decoding="async" className="hidden h-3.5 w-auto dark:block"/>
 </a>;
}

export function SiteFooter({onNavigate}:{onNavigate:Go}){
 return <footer className="border-t bg-background">
  <div className="mx-auto grid max-w-[1260px] gap-6 px-[clamp(16px,3vw,32px)] py-6 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] md:gap-8 md:py-10">
   <div className="grid content-start gap-3 max-md:grid-cols-[1fr_auto] max-md:items-center">
    <Logo onClick={()=>onNavigate('home')}/>
    <SocialLinks className="md:order-last"/>
    <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground max-md:col-span-2">AI agents with a face, a wardrobe and real skills. Built on Robinhood Chain.</p>
   </div>
   <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:contents">
    {COLS.map(([h,items],k)=><nav key={h} aria-label={h} className={cn('grid content-start gap-1 md:gap-1.5',k===2&&'col-span-2 grid-cols-2 gap-x-4 md:col-span-1 md:grid-cols-1')}>
     <b className={cn('mb-1 text-[13px] font-semibold',k===2&&'col-span-2 md:col-span-1')}>{h}</b>
     {items.map(([v,t,doc])=><button key={t} onClick={()=>onNavigate(v,doc)} className="justify-self-start text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground">{t}</button>)}
    </nav>)}
   </div>
  </div>
  <div className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-2 border-t border-dashed px-[clamp(16px,3vw,32px)] py-4 font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">
   <BuiltOnRobinhoodChain/><span>RHIO · {CONTENT.version}</span>
  </div>
 </footer>;
}
