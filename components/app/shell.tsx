'use client';
/* Dashboard shell for the app views (Studio, My agents, Discover, Skills, History, Credits):
   shadcn Sidebar (inset variant, collapses to an icon rail) + a top bar with breadcrumb and actions.
   Mobile (≤820px) hides the sidebar; the app bottom bar and compact top bar take over. */
import {useEffect,useState,type ReactNode} from 'react';
import {Sidebar,SidebarContent,SidebarFooter,SidebarGroup,SidebarGroupContent,SidebarGroupLabel,SidebarHeader,SidebarInset,SidebarMenu,SidebarMenuBadge,SidebarMenuButton,SidebarMenuItem,SidebarProvider,SidebarSeparator,SidebarTrigger} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {Kbd} from '@/components/ui/kbd';
import {Progress} from '@/components/ui/progress';
import {Separator} from '@/components/ui/separator';
import {I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {Logo,type View} from '@/components/rhio/navbar';

export const APP_VIEWS:View[]=['overview','profile','studio','agents','discover','skills','schedules','quests','activity','credits','wallet','rewards','docs','paper','roadmap'];
type Item={id:View;title:string;icon:string;badge?:number|string};
const TITLES:Record<string,[string,string]>={overview:['Dashboard','Overview'],profile:['Account','Profile'],studio:['Build','Studio'],agents:['Build','My agents'],skills:['Build','Skills'],schedules:['Build','Schedules'],quests:['Dashboard','Quests'],discover:['Marketplace','Discover'],activity:['Account','History'],credits:['Account','Credits'],wallet:['Account','Wallet & chain'],rewards:['Account','Holder rewards'],docs:['Learn','Docs'],paper:['Learn','Whitepaper'],roadmap:['Learn','Roadmap']};

export function AppShell({view,navigate,onSearch,theme,setTheme,auth,label,balance,counts,onAccount,onSignIn,onNew,collapsed,children}:{
 view:View;navigate:(v:View,doc?:string)=>void;onSearch:()=>void;theme:'dark'|'light';setTheme:(t:'dark'|'light')=>void;
 auth:boolean;label:string;balance:number|null;counts:{agents:number;published:number;runs:number;schedules?:number};onAccount:()=>void;onSignIn:()=>void;onNew:()=>void;collapsed:boolean;children:ReactNode}){
 const groups:[string,Item[]][]=[
  ['Dashboard',[{id:'overview',title:'Overview',icon:'grid'},{id:'profile',title:'Profile',icon:'user'},{id:'quests',title:'Quests',icon:'target',badge:'+CR'}]],
  ['Build',[{id:'studio',title:'Studio',icon:'cube'},{id:'agents',title:'My agents',icon:'users',badge:counts.agents||undefined},{id:'skills',title:'Skills',icon:'layers'},{id:'schedules',title:'Schedules',icon:'clock',badge:counts.schedules||undefined}]],
  ['Marketplace',[{id:'discover',title:'Discover',icon:'store',badge:counts.published?`${counts.published} live`:undefined}]],
  ['Account',[{id:'activity',title:'History',icon:'clock',badge:counts.runs||undefined},{id:'credits',title:'Credits',icon:'coins'},{id:'wallet',title:'Wallet & chain',icon:'wallet'},{id:'rewards',title:'Holder rewards',icon:'hype',badge:'NVDA'}]],
 ];
 const [crumb,title]=TITLES[view]||['',''];
 const [open,setOpen]=useState(!collapsed);
 useEffect(()=>{setOpen(!collapsed);},[collapsed]);
 return <SidebarProvider open={open} onOpenChange={setOpen} className="max-[820px]:block">
  <Sidebar collapsible="icon" variant="inset" className="border-r-0">
   <SidebarHeader className="gap-3">
    <div className="flex items-center justify-between px-1 pt-1 group-data-[collapsible=icon]:justify-center"><Logo onClick={()=>navigate('home')} className="group-data-[collapsible=icon]:[&>span]:hidden"/></div>
    {auth
     ?<button onClick={onAccount} className="flex items-center gap-2.5 rounded-lg border bg-background p-2 text-left transition-colors hover:border-foreground/25 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
       <span className="grid size-8 shrink-0 place-items-center rounded-md bg-lime font-mono text-[11px] font-bold text-ink">{(label||'?').replace(/^0x/,'').slice(0,2).toUpperCase()}</span>
       <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><b className="truncate text-[13px] font-semibold">{label||'Signed in'}</b><span className="font-mono text-[10.5px] text-muted-foreground">Preview workspace</span></span>
       <I id="grid" className="i size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden"/>
      </button>
     :<Button onClick={onSignIn} className="w-full justify-center gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"><I id="wallet"/><span className="group-data-[collapsible=icon]:hidden">Connect wallet</span></Button>}
    <SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={onSearch} tooltip="Search" className="border bg-background text-muted-foreground"><I id="search"/><span>Search</span><Kbd className="ml-auto group-data-[collapsible=icon]:hidden">Ctrl K</Kbd></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
   </SidebarHeader>
   <SidebarContent>
    {groups.map(([g,items])=><SidebarGroup key={g}>
     <SidebarGroupLabel className="font-mono text-[10px] tracking-[.1em] uppercase">{g}</SidebarGroupLabel>
     <SidebarGroupContent><SidebarMenu className="stagger">{items.map(it=><SidebarMenuItem key={it.id}>
      <SidebarMenuButton isActive={view===it.id} tooltip={it.title} aria-label={it.title} onClick={()=>navigate(it.id)} className="h-9 data-[active=true]:bg-background data-[active=true]:shadow-[0_0_0_1px_var(--line2)] data-[active=true]:[&>svg]:text-brand">
       <I id={it.icon}/><span>{it.title}</span>
      </SidebarMenuButton>
      {it.badge!==undefined&&<SidebarMenuBadge className="font-mono text-[10px] text-muted-foreground">{it.badge}</SidebarMenuBadge>}
     </SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent>
    </SidebarGroup>)}
    <SidebarSeparator/>
    <SidebarGroup><SidebarGroupLabel className="font-mono text-[10px] tracking-[.1em] uppercase">Learn</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
     {([['docs','Docs','book'],['paper','Whitepaper','doc'],['roadmap','Roadmap','map']] as const).map(([id,t,ic])=><SidebarMenuItem key={id}><SidebarMenuButton isActive={view===id} tooltip={t} aria-label={t} onClick={()=>navigate(id)} className="h-9 text-muted-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-[0_0_0_1px_var(--line2)] data-[active=true]:[&>svg]:text-brand"><I id={ic}/><span>{t}</span></SidebarMenuButton></SidebarMenuItem>)}
    </SidebarMenu></SidebarGroupContent></SidebarGroup>
   </SidebarContent>
   <SidebarFooter className="gap-2">
    <div className="grid gap-2 rounded-lg border bg-t-lime p-3 group-data-[collapsible=icon]:hidden">
     <div className="flex items-center justify-between"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Preview credits</span><I id="coins" className="i size-3.5"/></div>
     <b className="font-display text-2xl leading-none font-medium tracking-[-.03em]">{balance??'—'}<span className="ml-1 text-xs font-normal text-muted-foreground">CR</span></b>
     <Progress value={Math.min(100,(balance??0)/100*100)} className="h-1.5 bg-background [&>div]:bg-foreground"/>
     <span className="text-[11px] leading-snug text-muted-foreground">Not cash. Top up and claim on the Wallet page.</span>
    </div>
    <SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="text-muted-foreground"><I id={theme==='dark'?'sun':'moon'}/><span>{theme==='dark'?'Light theme':'Dark theme'}</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
   </SidebarFooter>
  </Sidebar>
  <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:shadow-none">
   <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur-md md:rounded-t-xl max-[820px]:hidden">
    <SidebarTrigger className="rounded-md" aria-label="Toggle sidebar"/>
    <Separator orientation="vertical" className="h-5"/>
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm"><span className="text-muted-foreground">{crumb}</span><span className="text-muted-foreground/50">/</span><b className="truncate font-medium">{title}</b></nav>
    <div className="ml-auto flex items-center gap-1.5">
     <Button variant="ghost" size="icon" className="rounded-md" onClick={onSearch} aria-label="Search"><I id="search"/></Button>
     <Button variant="ghost" size="icon" className="rounded-md" onClick={()=>navigate('home')} aria-label="Back to the site"><I id="home"/></Button>
     {view!=='studio'&&<Button size="sm" variant={auth?'default':'outline'} onClick={onNew} className="gap-1.5"><I id="plus"/>New agent</Button>}
     {/* signed out: the hint and the sign-in button live here instead of a banner across every page */}
     {!auth&&<><span className="ml-1 text-[12.5px] text-muted-foreground max-[1180px]:hidden">Browsing without an account</span>
      <Button size="sm" onClick={onSignIn} className="gap-1.5"><I id="wallet"/>Connect wallet</Button></>}
    </div>
   </header>
   <div className={cn('min-w-0 flex-1 min-[821px]:[--top:48px]',view==='studio'?'':'')} data-view="">{children}</div>
  </SidebarInset>
 </SidebarProvider>;
}
