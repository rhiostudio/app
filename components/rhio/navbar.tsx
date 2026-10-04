'use client';
/* App header and mobile navigation.
   Desktop (≥1024): a floating, centered bar (logo · mega-menu triggers · actions). Each trigger opens
   a full-width mega panel under the bar: grouped links with tinted icons plus a featured card.
   Tablet (821–1023): same bar, groups move into a right-side Sheet with accordions.
   Mobile (≤820): compact top bar + floating bottom tab bar + "More" drawer. */
import {lazy,Suspense,useEffect,useState,type ReactNode} from 'react';
import {NavigationMenu,NavigationMenuContent,NavigationMenuItem,NavigationMenuLink,NavigationMenuList,NavigationMenuTrigger} from '@/components/ui/navigation-menu';
import {Button} from '@/components/ui/button';
import {Kbd} from '@/components/ui/kbd';
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle} from '@/components/ui/sheet';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {cn} from '@/lib/utils';
import {FaXTwitter} from 'react-icons/fa6';
import {SOCIAL} from '@/lib/site';
import {I} from '@/app/ui';
import {CutButton,TINT_BG,type Tone} from './motion';
import {TOKEN_LINE,useTokenStage} from './token-context';
import {Thumb} from '@/components/landing/mocks';

/* The mobile "More" drawer (vaul) loads the first time it opens. */
const MoreDrawer=lazy(()=>import('./more-drawer').then(m=>({default:m.MoreDrawer})));
import type {View} from '@/lib/routes';
export type {View};
export type NavLink={id:View;title:string;icon:string;desc:string;tone:Tone;doc?:string};
export const PRODUCT:NavLink[]=[
 {id:'studio',title:'Studio',icon:'cube',desc:'Build, dress and equip an agent',tone:'lime'},
 {id:'skills',title:'Skills',icon:'layers',desc:'Ten open skills and six stage powers',tone:'iris'},
 {id:'discover',title:'Discover',icon:'store',desc:'Agents other creators published',tone:'coral'},
 {id:'plaza',title:'Plaza',icon:'users',desc:'The published agents in one place: click one and talk to it',tone:'lime'},
 {id:'discover',title:'Templates',icon:'list',desc:'Start from a ready-made agent',tone:'amber',doc:'templates'},
];
export const WORKSPACE:NavLink[]=[
 {id:'agents',title:'My agents',icon:'users',desc:'Saved agents, prices and publishing',tone:'sky'},
 {id:'creators',title:'Creator agents',icon:'pen',desc:'An agent in your own voice, written from your posts; you earn per message',tone:'lime'},
 {id:'teams',title:'Teams',icon:'link',desc:'Two or three agents in a line: each hands its answer to the next',tone:'iris'},
 {id:'schedules',title:'Schedules',icon:'cal',desc:'Agents that run a skill on their own, a few times a day',tone:'iris'},
 {id:'recipes',title:'Recipes',icon:'play',desc:'Ready-made automations: one click and the agent runs it every day',tone:'coral'},
 {id:'referral',title:'Invite friends',icon:'users',desc:'Free credits for both, and a higher holder reward for you',tone:'lime'},
 {id:'quests',title:'Quests',icon:'target',desc:'Try what your agent can do and collect free credits',tone:'lime'},
 {id:'activity',title:'History',icon:'clock',desc:'Every run, output and cost',tone:'mint'},
 {id:'credits',title:'Credits',icon:'coins',desc:'Balance, earnings and ledger',tone:'amber'},
 {id:'wallet',title:'Wallet & chain',icon:'wallet',desc:'Top-ups, claims and holder tiers on Robinhood Chain',tone:'sky'},
 {id:'rewards',title:'Holder rewards',icon:'hype',desc:'Hold RHIO, earn NVDA Stock Tokens each period',tone:'lime'},
];
export const RESOURCES:NavLink[]=[
 {id:'docs',title:'Getting started',icon:'book',desc:'Build your first agent',tone:'lime',doc:'start'},
 {id:'docs',title:'Agent skills',icon:'layers',desc:'What each skill does',tone:'iris',doc:'skills'},
 {id:'docs',title:'Credits & prices',icon:'coins',desc:'How pay-per-run works',tone:'amber',doc:'credits'},
 {id:'docs',title:'FAQ',icon:'bulb',desc:'Short answers to common questions',tone:'sky',doc:'faq'},
 {id:'paper',title:'Whitepaper',icon:'doc',desc:'The token, holder rewards and economics',tone:'coral'},
 {id:'tiers',title:'Holder tiers',icon:'layers',desc:'What holding RHIO unlocks: more schedules, runs and channels',tone:'amber'},
 {id:'whales',title:'Whale watch',icon:'scan',desc:'Biggest RHIO transfers and holders, from the chain',tone:'lime'},
 {id:'roadmap',title:'Roadmap',icon:'map',desc:'Shipped, in progress, planned',tone:'mint'},
];
const TONE_TEXT:Record<Tone,string>={lime:'text-[#3f5f00] dark:text-lime',iris:'text-iris',coral:'text-coral',sky:'text-[#1f7fcf] dark:text-sky',amber:'text-[#9a6500] dark:text-amber',mint:'text-[#15845a] dark:text-mint',pink:'text-pink',ink:'text-foreground'};
export function ToneIcon({icon,tone,className}:{icon:string;tone:Tone;className?:string}){
 return <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[18px]',TINT_BG[tone],TONE_TEXT[tone],className)}><I id={icon}/></span>;
}

export function Logo({onClick,className}:{onClick?:()=>void;className?:string}){
 return <button onClick={onClick} aria-label="RHIO home" className={cn('flex items-center gap-2.5',className)}>
  <svg viewBox="-12 -12 484 432" className="h-8 w-9" aria-hidden="true"><g fill="#c8ff24"><path d="M48 12H278Q302 12 322 33L379 90Q403 114 403 145V169Q403 217 355 217H268V146Q268 116 239 116H48Q28 116 28 96V32Q28 12 48 12Z"/><path d="M71 140H163V335Q163 355 143 355H20Q0 355 0 335V226Q0 218 8 209L57 154Q64 140 71 140Z"/><path d="M195 234H272Q282 234 292 245L447 392Q462 408 441 408H315Q302 408 292 398L180 282Q175 276 175 268V254Q175 234 195 234Z"/></g></svg>
  <span className="font-display text-[19px] font-bold tracking-[-.01em] text-foreground">RHIO</span>
 </button>;
}

type Props={appMode?:boolean;view:View;navigate:(v:View,doc?:string)=>void;onSearch:()=>void;theme:'dark'|'light';setTheme:(t:'dark'|'light')=>void;auth:boolean;balance:number|null;email:string;onAccount:()=>void;onSignIn:()=>void};

function MegaLink({l,onGo,active}:{l:NavLink;onGo:()=>void;active:boolean}){
 return <NavigationMenuLink asChild data-active={active}>
  <button onClick={onGo} className="group/ml flex w-full flex-row items-start gap-3 rounded-xl p-3 text-left transition-colors duration-300 hover:bg-secondary data-[active=true]:bg-secondary">
   <ToneIcon icon={l.icon} tone={l.tone} className="transition-transform duration-300 group-hover/ml:-translate-y-0.5"/>
   <span className="grid gap-0.5"><span className="text-[14px] font-semibold text-foreground">{l.title}</span><span className="text-[12.5px] leading-snug text-muted-foreground">{l.desc}</span></span>
  </button>
 </NavigationMenuLink>;
}
function Featured({tone,kicker,title,text,cta,onClick,children}:{tone:Tone;kicker:string;title:string;text:string;cta:string;onClick:()=>void;children?:ReactNode}){
 return <NavigationMenuLink asChild>
  <button onClick={onClick} className={cn('group/ft lift flex h-full animate-[pop-in_.5s_var(--ease-smooth)_.15s_both] flex-col justify-between gap-4 rounded-xl border border-hairline p-4 text-left',TINT_BG[tone])}>
   <span className="grid gap-1.5"><span className="font-mono text-[10px] font-semibold tracking-[.1em] text-muted-foreground uppercase">{kicker}</span><span className="font-display text-[17px] leading-tight font-medium tracking-[-.02em] text-foreground">{title}</span><span className="text-[12.5px] leading-snug text-muted-foreground">{text}</span></span>
   {children}
   <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[.1em] text-foreground uppercase [&_svg]:size-3.5 [&_svg]:transition-transform group-hover/ft:[&_svg]:translate-x-1">{cta}<I id="arrow"/></span>
  </button>
 </NavigationMenuLink>;
}
const panel='absolute right-0 left-auto top-full mt-2 w-[min(780px,calc(100vw-24px))] rounded-2xl border bg-popover p-3 shadow-[0_30px_60px_-30px_rgb(0_0_0/.35)] md:w-[min(780px,calc(100vw-24px))]';

export function Navbar(p:Props){
 const [sheet,setSheet]=useState(false);const stage=useTokenStage();
 const trig='h-9 rounded-lg bg-transparent px-2.5 text-[14px] font-medium text-foreground/80 transition-colors duration-300 hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground';
 const go=(l:NavLink)=>p.navigate(l.id,l.doc);
 return <>
  {/* desktop: no band across the page; the logo sits bare on the page (no chip), only the menu pill has a
      background, and the gap between them lets clicks through to the page. Phones keep a solid top bar. */}
  <header className={cn('pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 py-3 max-[820px]:pointer-events-auto max-[820px]:bg-background max-[820px]:px-0 max-[820px]:py-0',p.appMode&&'min-[821px]:hidden')}>
   <div className="flex w-[calc(100%*6/7)] items-center justify-between gap-x-3 max-[1100px]:w-full max-[820px]:flex max-[820px]:h-[var(--top)] max-[820px]:items-center max-[820px]:justify-between max-[820px]:border-b max-[820px]:px-4">
    <div className="pointer-events-auto flex h-14 w-fit shrink-0 items-center max-[820px]:h-auto"><Logo onClick={()=>p.navigate('home')}/></div>
    <div className="pointer-events-auto relative flex h-14 w-fit min-w-0 items-center gap-1 rounded-xl border bg-background px-2 shadow-[0_14px_34px_-22px_rgb(0_0_0/.4)] max-[820px]:h-auto max-[820px]:border-0 max-[820px]:bg-transparent max-[820px]:px-0 max-[820px]:shadow-none">
    <NavigationMenu viewport={false} className="static max-w-none flex-none max-[1023px]:hidden [&>div]:!static">
     <NavigationMenuList className="gap-0.5">
      <NavigationMenuItem className="static"><NavigationMenuTrigger className={trig}>Product</NavigationMenuTrigger>
       <NavigationMenuContent className={panel}><div className="grid grid-cols-[1fr_1fr_280px] gap-2">
        <div className="col-span-2 grid content-start gap-1"><span className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold tracking-[.1em] text-muted-foreground uppercase">Build</span><div className="stagger grid grid-cols-2 gap-1">{PRODUCT.map(l=><MegaLink key={l.title} l={l} active={p.view===l.id&&!l.doc} onGo={()=>go(l)}/>)}</div></div>
        <Featured tone="lime" kicker="The roster" title="25 originals, built live" text="Pick a character, dress it, give it a mind." cta="Open the studio" onClick={()=>p.navigate('studio')}>
         <span className="flex -space-x-3">{(['atlas','lumi','scout','kira'] as const).map(id=><Thumb key={id} id={id} className="size-12 rounded-lg border-2 border-[var(--t-lime)] bg-background object-[50%_18%]"/>)}</span>
        </Featured>
       </div></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem className="static"><NavigationMenuTrigger className={trig}>Workspace</NavigationMenuTrigger>
       <NavigationMenuContent className={panel}><div className="grid grid-cols-[1fr_1fr_1fr_280px] gap-2">
        <div className="col-span-3 grid content-start gap-1"><span className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold tracking-[.1em] text-muted-foreground uppercase">Your workspace</span><div className="stagger grid grid-cols-2 gap-1">{WORKSPACE.map(l=><MegaLink key={l.title} l={l} active={p.view===l.id} onGo={()=>go(l)}/>)}</div></div>
        {p.auth?<Featured tone="amber" kicker="Balance" title={`${p.balance??'—'} preview credits`} text="Credits pay for runs. They have no monetary value." cta="See credits" onClick={()=>p.navigate('credits')}/>
         :<Featured tone="iris" kicker="Account" title="Connect your wallet" text="Robinhood Wallet or any EVM wallet. Save agents, publish them and run tasks." cta="Connect wallet" onClick={p.onSignIn}/>}
       </div></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem className="static"><NavigationMenuTrigger className={trig}>Resources</NavigationMenuTrigger>
       <NavigationMenuContent className={panel}><div className="grid grid-cols-[1fr_1fr_280px] gap-2">
        <div className="col-span-2 grid content-start gap-1"><span className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold tracking-[.1em] text-muted-foreground uppercase">Learn</span><div className="stagger grid grid-cols-2 gap-1">{RESOURCES.map(l=><MegaLink key={l.title} l={l} active={p.view===l.id&&!l.doc} onGo={()=>go(l)}/>)}</div></div>
        <Featured tone="sky" kicker="Honest by default" title="What is live, what is planned" text={`Credits, skills and publishing are live. Chain top-ups and claims run only where the operator switched them on. ${TOKEN_LINE[stage]}`} cta="Read the overview" onClick={()=>p.navigate('docs','overview')}/>
       </div></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink asChild data-active={p.view==='discover'}><button onClick={()=>p.navigate('discover')} className={cn(trig,'inline-flex items-center data-[active=true]:bg-secondary')}>Discover</button></NavigationMenuLink></NavigationMenuItem>
     </NavigationMenuList>
    </NavigationMenu>
    <div className="flex items-center gap-1">
     <Button variant="ghost" onClick={p.onSearch} className="h-9 gap-2 rounded-lg px-2.5 text-muted-foreground max-[1180px]:w-9 max-[1180px]:px-0" aria-label="Search (Ctrl K)"><I id="search"/><span className="text-[13px] max-[1180px]:hidden">Search</span><Kbd className="max-[1180px]:hidden">Ctrl K</Kbd></Button>
     <Button variant="ghost" size="icon" className="rounded-lg" onClick={()=>p.setTheme(p.theme==='dark'?'light':'dark')} aria-label={p.theme==='dark'?'Switch to light theme':'Switch to dark theme'}><I id={p.theme==='dark'?'sun':'moon'}/></Button>
     <a href={SOCIAL.x} target="_blank" rel="noreferrer noopener" aria-label="RHIO on X" title="RHIO on X" className="grid size-9 place-items-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground [&_svg]:size-[15px]"><FaXTwitter/></a>
     {p.auth?<Button variant="ghost" onClick={p.onAccount} className="h-9 gap-2 rounded-lg px-3 font-mono text-[12px]" title={p.email||'Account'}><span className="size-2 rounded-lg bg-lime"/>{p.balance??'—'} CR</Button>
      :<Button variant="ghost" onClick={p.onSignIn} className="h-9 gap-2 rounded-lg px-3 text-[14px] max-[820px]:hidden"><I id="wallet"/>Connect</Button>}
     {p.view!=='studio'&&<CutButton size="sm" onClick={()=>p.navigate('studio')} className="magnetic max-[820px]:hidden">Open studio</CutButton>}
     {!p.auth&&<Button size="sm" shape="pill" onClick={p.onSignIn} className="min-[821px]:hidden">Connect</Button>}
     <Button variant="outline" size="icon" className="rounded-lg min-[1024px]:hidden max-[820px]:hidden" onClick={()=>setSheet(true)} aria-label="Open menu"><I id="grid"/></Button>
    </div>
   </div>
   </div>
  </header>
  <div aria-hidden="true" className={cn('h-[var(--top)]',p.appMode&&'min-[821px]:hidden')}/>
  <Sheet open={sheet} onOpenChange={setSheet}>
   <SheetContent side="right" className="w-[340px] gap-0 p-0">
    <SheetHeader className="border-b"><SheetTitle>Menu</SheetTitle><SheetDescription>Everything in RHIO.</SheetDescription></SheetHeader>
    <Accordion type="multiple" defaultValue={['Product']} className="px-4">
     {([['Product',PRODUCT],['Workspace',WORKSPACE],['Resources',RESOURCES]] as const).map(([g,items])=><AccordionItem key={g} value={g}>
      <AccordionTrigger className="text-[15px]">{g}</AccordionTrigger>
      <AccordionContent className="stagger grid gap-1">{items.map(l=><button key={l.title} onClick={()=>{setSheet(false);go(l);}} className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-secondary"><ToneIcon icon={l.icon} tone={l.tone} className="size-8"/><span className="grid"><b className="text-sm font-semibold">{l.title}</b><span className="text-xs text-muted-foreground">{l.desc}</span></span></button>)}</AccordionContent>
     </AccordionItem>)}
    </Accordion>
   </SheetContent>
  </Sheet>
 </>;
}

const TABS:{id:View;title:string;icon:string}[]=[{id:'home',title:'Home',icon:'home'},{id:'discover',title:'Discover',icon:'store'},{id:'studio',title:'Studio',icon:'cube'},{id:'agents',title:'Agents',icon:'users'}];
export function BottomNav(p:Props){
 const [more,setMore]=useState(false);const [moreOpened,setMoreOpened]=useState(false);
 useEffect(()=>{if(more)setMoreOpened(true);},[more]);
 const moreItems:NavLink[]=[PRODUCT[1],WORKSPACE[1],WORKSPACE[2],{id:'docs',title:'Docs',icon:'book',desc:'',tone:'lime'},RESOURCES[4],RESOURCES[5]];
 const moreActive=moreItems.some(l=>l.id===p.view);
 const go=(v:View,doc?:string)=>{setMore(false);p.navigate(v,doc);};
 return <>
  <nav aria-label="Sections" className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 hidden h-16 items-center gap-1 rounded-xl border bg-background px-1.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/.45)] max-[820px]:flex">
   {TABS.map(t=>t.id==='studio'
    ?<button key={t.id} onClick={()=>go(t.id)} aria-current={p.view===t.id?'page':undefined} className={cn('mx-1 flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-2xl bg-lime px-3 text-sm font-semibold text-ink transition-transform duration-300 active:scale-95 [&_svg]:size-5',p.view===t.id&&'ring-2 ring-foreground/20 ring-offset-2 ring-offset-background')}><I id="cube"/>Studio</button>
    :<TabButton key={t.id} active={p.view===t.id} icon={t.icon} label={t.title} onClick={()=>go(t.id)}/>)}
   <TabButton active={moreActive||more} icon="grid" label="More" onClick={()=>setMore(true)}/>
  </nav>
  {moreOpened&&<Suspense fallback={null}><MoreDrawer open={more} onOpenChange={setMore} items={moreItems} view={p.view} theme={p.theme} setTheme={p.setTheme} onSearch={p.onSearch} go={go}/></Suspense>}
 </>;
}
function TabButton({active,icon,label,onClick}:{active:boolean;icon:string;label:string;onClick:()=>void}){
 return <button onClick={onClick} aria-current={active?'page':undefined} className={cn('grid flex-1 justify-items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300',active&&'text-foreground')}>
  <span className={cn('grid h-7 w-12 place-items-center rounded-lg transition-colors duration-300 [&_svg]:size-5',active&&'bg-secondary')}><I id={icon}/></span>{label}
 </button>;
}
