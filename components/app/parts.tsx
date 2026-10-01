'use client';
/* Dashboard building blocks shared by the app views: page header, KPI cards, segmented filter,
   status badges, empty state. Solid tints, hairline borders, small bevelled corners. */
import type {ReactNode} from 'react';
import {Badge} from '@/components/ui/badge';
import {I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {TINT_BG,type Tone} from '@/components/rhio/motion';
import {ToneIcon} from '@/components/rhio/navbar';
import {Thumb} from '@/components/landing/mocks';
import type {CharacterId} from '@/lib/characters';

export function DashPage({children,wide}:{children:ReactNode;wide?:boolean}){
 return <div className={cn('stagger mx-auto grid w-full gap-6 px-[clamp(16px,2.4vw,32px)] pt-7 pb-16',wide?'max-w-[1400px]':'max-w-[1240px]')}>{children}</div>;
}

export function PageHeader({title,text,actions,tone='iris',icon}:{title:string;text?:string;actions?:ReactNode;tone?:Tone;icon:string}){
 return <div className="flex flex-wrap items-end justify-between gap-4">
  <div className="flex min-w-0 items-start gap-4">
   <ToneIcon icon={icon} tone={tone} className="size-11 rounded-lg [&_svg]:size-5"/>
   <div className="grid min-w-0 gap-1"><h1 className="font-display text-[clamp(24px,2.4vw,30px)] leading-tight font-medium tracking-[-.03em]">{title}</h1>{text&&<p className="max-w-[64ch] text-[14.5px] text-muted-foreground">{text}</p>}</div>
  </div>
  {actions&&<div className="flex flex-wrap items-center gap-2">{actions}</div>}
 </div>;
}

export function Kpi({label,value,hint,tone,icon,children}:{label:string;value:ReactNode;hint?:ReactNode;tone:Tone;icon:string;children?:ReactNode}){
 return <div className={cn('lift grid content-between gap-4 rounded-xl border p-4',TINT_BG[tone])}>
  <div className="flex items-center justify-between"><span className="font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">{label}</span><span className="grid size-7 place-items-center rounded-md bg-background/70 [&_svg]:size-3.5"><I id={icon}/></span></div>
  <div className="grid gap-1"><b className="font-display text-[30px] leading-none font-medium tracking-[-.04em] tabular-nums">{value}</b>{hint&&<span className="text-xs text-muted-foreground">{hint}</span>}</div>
  {children}
 </div>;
}
export function KpiRow({children}:{children:ReactNode}){return <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;}

/** Segmented filter with counts (All · Published · Private ...). */
export function Segmented<T extends string>({value,onChange,items,className}:{value:T;onChange:(v:T)=>void;items:[T,string,number?][];className?:string}){
 return <div role="tablist" className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border bg-secondary/60 p-1 sm:flex-wrap',className)}>
  {items.map(([v,l,n])=><button key={v} role="tab" aria-selected={value===v} onClick={()=>onChange(v)}
   className={cn('flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground',value===v&&'bg-background text-foreground shadow-[0_0_0_1px_var(--line2)]')}>
   {l}{n!==undefined&&<span className="rounded bg-secondary px-1.5 font-mono text-[10px] text-muted-foreground">{n}</span>}
  </button>)}
 </div>;
}

const STATUS:Record<string,string>={live:'bg-t-mint text-[#15845a] dark:text-mint',private:'bg-secondary text-muted-foreground',archived:'bg-t-amber text-[#9a6500] dark:text-amber',complete:'bg-t-mint text-[#15845a] dark:text-mint',failed:'bg-t-coral text-coral',pending:'bg-t-sky text-[#1f7fcf] dark:text-sky',sample:'bg-t-iris text-iris',live_ai:'bg-t-lime text-[#3f5f00] dark:text-lime',grant:'bg-t-lime text-[#3f5f00] dark:text-lime',run:'bg-t-sky text-[#1f7fcf] dark:text-sky',earning:'bg-t-mint text-[#15845a] dark:text-mint',refund:'bg-t-amber text-[#9a6500] dark:text-amber',fee:'bg-t-coral text-coral'};
export function StatusBadge({kind,children,className}:{kind:string;children?:ReactNode;className?:string}){
 return <Badge className={cn('rounded-md border-0 font-mono text-[10px] font-semibold tracking-[.06em] uppercase',STATUS[kind]||'bg-secondary text-muted-foreground',className)}>{children??kind}</Badge>;
}

export function EmptyState({title,text,action,chars=['atlas','lumi','scout']}:{title:string;text:string;action?:ReactNode;chars?:CharacterId[]}){
 return <div className="grid justify-items-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center">
  <div className="flex -space-x-4">{chars.map((c,k)=><Thumb key={c} id={c} className={cn('size-16 rounded-lg border-2 border-background object-[50%_18%]',['bg-t-lime','bg-t-iris','bg-t-coral'][k%3])}/>)}</div>
  <div className="grid gap-1"><b className="font-display text-lg font-medium">{title}</b><p className="max-w-[46ch] text-sm text-muted-foreground">{text}</p></div>
  {action}
 </div>;
}
