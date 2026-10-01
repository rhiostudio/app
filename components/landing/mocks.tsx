'use client';
/* Product mockups used across the landing (hero window, use-case tabs, bento). They are
   illustrations built from shadcn primitives; numbers shown are labelled as samples. */
import {characters,getCharacter,type CharacterId} from '@/lib/characters';
import {skillCatalog} from '@/lib/agents';
import {presetImage} from '@/app/avatar';
import {I,SKILL_ICON} from '@/app/ui';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {cn} from '@/lib/utils';

export function Thumb({id,className,eager}:{id:CharacterId;className?:string;eager?:boolean}){
 // static picture of the default look: no 3D engine on pages that only show character cards
 const c=getCharacter(id);
 return <img className={cn('object-cover',className)} alt={`${c.name}, ${c.role}`} src={presetImage(id)} loading={eager?'eager':'lazy'} decoding="async" draggable={false}/>;
}
const usable=()=>skillCatalog.filter(s=>!s.planned&&!s.locked);
const Label=({children}:{children:React.ReactNode})=><span className="font-mono text-[10px] font-medium tracking-[.1em] text-muted-foreground uppercase">{children}</span>;
const Chip=({on,children}:{on?:boolean;children:React.ReactNode})=><span className={cn('rounded-lg border px-3 py-1 text-[12.5px] font-medium',on?'border-lime bg-lime text-ink':'border-border bg-card')}>{children}</span>;

export function RosterMock({onPick,active='scout'}:{onPick?:(id:CharacterId)=>void;active?:CharacterId}){
 const ids:CharacterId[]=['atlas','nova','scout','kira','byte','lumi','maker','zara'];
 return <div className="grid gap-3">
  <div className="flex items-center justify-between"><Label>Characters · {characters.length}</Label><span className="flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs text-muted-foreground [&_svg]:size-3.5"><I id="search"/>Search</span></div>
  <div className="stagger grid grid-cols-4 gap-2 max-[420px]:grid-cols-3">{ids.map((id,k)=><button key={id} onClick={()=>onPick?.(id)} className={cn('grid gap-1.5 rounded-xl border p-1.5 text-center text-xs font-semibold transition-transform hover:-translate-y-0.5 max-[420px]:[&:nth-child(n+7)]:hidden',id===active?'border-lime bg-lime text-ink':'bg-card')}>
   <Thumb id={id} className="aspect-[4/5] w-full rounded-lg bg-muted object-[50%_22%]"/>{getCharacter(id).name}
  </button>)}</div>
 </div>;
}
export function OutfitMock(){
 const row=(l:string,o:string[],on:number)=><div className="grid gap-2"><Label>{l}</Label><div className="flex flex-wrap gap-1.5">{o.map((x,k)=><Chip key={x} on={k===on}>{x}</Chip>)}</div></div>;
 return <div className="grid gap-4">
  <div className="flex items-center justify-between"><Label>Outfit</Label><Badge className="gap-1 rounded-lg font-mono text-[10px] uppercase [&_svg]:size-3"><I id="dice"/>Randomize</Badge></div>
  {row('Hair',['Short','Swept','Buzz','Spiky','Afro','Bun'],1)}{row('Top',['T-shirt','Hoodie','Blazer','Jacket'],2)}
  <div className="grid gap-2"><Label>Color</Label><div className="flex gap-2">{['#1d2a22','#c8ff24','#ff6fb1','#6fb7ff','#f2c14e','#e9e9e2'].map((c,k)=><i key={c} className={cn('size-7 rounded-lg border',k===1&&'ring-2 ring-foreground ring-offset-2 ring-offset-card')} style={{background:c}}/>)}</div></div>
 </div>;
}
export function PersonaMock({name='My Scout'}:{name?:string}){
 return <div className="grid gap-4">
  <div className="grid gap-2"><Label>Agent name</Label><div className="rounded-lg border bg-card px-3 py-2.5 text-sm">{name}</div></div>
  <div className="grid gap-2"><Label>Instructions</Label><div className="min-h-24 rounded-lg border bg-card px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">Research carefully. Separate facts from opinions and state uncertainty. End with what to verify.<span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-blink bg-foreground"/></div></div>
  <div className="grid gap-2"><Label>Tone</Label><div className="flex gap-1.5"><Chip>Friendly</Chip><Chip on>Professional</Chip><Chip>Concise</Chip></div></div>
 </div>;
}
export function SkillsMock({count=4}:{count?:number}){
 return <div className="grid">
  <div className="flex items-center justify-between pb-2"><Label>Skills</Label><Label>3 / 4 equipped</Label></div>
  <div className="stagger">{usable().slice(0,count).map((s,k)=><div key={s.id} className="flex items-center gap-3 border-b py-3 last:border-0">
   <span className="grid size-9 place-items-center rounded-lg bg-secondary text-brand"><I id={SKILL_ICON[s.icon]||'globe'}/></span>
   <span className="grid flex-1 gap-0.5"><b className="text-sm font-semibold">{s.name}</b><span className="text-xs text-muted-foreground">{s.category}</span></span>
   <Switch checked={k<3} aria-label={s.name} tabIndex={-1} className="pointer-events-none"/>
  </div>)}</div>
 </div>;
}
export function PublishMock({id='scout',name='My Scout'}:{id?:CharacterId;name?:string}){
 return <div className="grid gap-4">
  <div className="flex items-center gap-3 border-b pb-4"><Thumb id={id} className="h-16 w-14 rounded-lg bg-muted object-[50%_20%]"/><div className="grid flex-1"><b className="text-[15px]">{name}</b><span className="text-xs text-muted-foreground">Research · Summaries · Drafts</span></div><Badge className="rounded-lg font-mono text-[10px] uppercase">Live</Badge></div>
  <div className="flex items-end justify-between"><Label>Price per run</Label><b className="font-display text-6xl leading-none font-medium tracking-[-.05em]">12<span className="ml-1.5 text-base font-normal tracking-normal text-muted-foreground">CR</span></b></div>
  <div className="grid grid-cols-3 border-y">{[['Runs','48'],['Earned','576 CR'],['Fee','0%']].map(([l,v])=><div key={l} className="grid gap-1 py-3"><Label>{l}</Label><b className="text-base">{v}</b></div>)}</div>
  <Label>Sample numbers · preview credits</Label>
 </div>;
}
