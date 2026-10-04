'use client';
/* Landing feature sections, each mixing references on purpose:
   - TheIdea: Twenty "the problem" split (solid color panel + serif/sans headline + dashed list).
   - FeatureRows: ZATS zig-zag rows on a dark band, white product cards on solid tint pads.
   - FolderCards: Twenty folder-tab cards with a stats row (numbers count up).
   Solid fills, hairline borders, no gradients. */
import type {ReactNode} from 'react';
import Avatar from '@/app/avatar';
import {Card} from '@/components/ui/card';
import {characters,powers,type CharacterId} from '@/lib/characters';
import {skillCatalog} from '@/lib/agents';
import {I,SKILL_ICON} from '@/app/ui';
import {cn} from '@/lib/utils';
import {BracketLink,CountUp,CutButton,DashedRule,Eyebrow,Reveal,TINT_BG,type Tone} from '@/components/rhio/motion';
import {OutfitMock,PersonaMock,PublishMock,RosterMock,SkillsMock} from './mocks';
import {TOKEN_LINE,useTokenStage} from '@/components/rhio/token-context';

/** Twenty-style heading: light serif lead-in + medium sans finish. */
export function Headline({lead,rest,className,as:Tag='h2'}:{lead:ReactNode;rest:ReactNode;className?:string;as?:'h2'|'h3'}){
 return <Tag className={cn('text-[clamp(32px,4.2vw,58px)] leading-[1.04] text-balance',className)}><span className="font-display font-light tracking-[-.04em]">{lead}</span> <span className="font-display font-medium tracking-[-.04em]">{rest}</span></Tag>;
}
export function SectionHead({eyebrow,tone='iris',lead,rest,sub,center,className}:{eyebrow:string;tone?:Tone;lead:ReactNode;rest:ReactNode;sub?:ReactNode;center?:boolean;className?:string}){
 return <Reveal className={cn('grid max-w-3xl gap-4',center&&'mx-auto justify-items-center text-center',className)}>
  <Eyebrow tone={tone}>{eyebrow}</Eyebrow><Headline lead={lead} rest={rest}/>{sub&&<p className="max-w-[56ch] text-[16px] leading-relaxed text-muted-foreground">{sub}</p>}
 </Reveal>;
}

export function TheIdea({onNavigate}:{onNavigate:(v:'studio')=>void}){
 const skills=skillCatalog.filter(s=>!s.planned&&!s.locked);
 return <section id="the-idea" className="scroll-mt-24 px-4 py-[clamp(72px,9vw,130px)]">
  <div className="mx-auto grid max-w-[1180px] items-center gap-[clamp(28px,5vw,80px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
   <Reveal className="relative rounded-xl bg-iris p-[clamp(14px,2.4vw,28px)]">
    <div className="overflow-hidden rounded-xl border border-[#1f201e]/10 bg-white text-[#1f201e]">
     <div className="flex h-9 items-center gap-2 border-b border-[#1f201e]/10 px-3"><span className="flex gap-1.5">{[0,1,2].map(k=><i key={k} className="size-2.5 rounded-lg bg-[#1f201e]/15"/>)}</span><span className="text-xs text-[#1f201e]/50">Studio / <b className="font-medium text-[#1f201e]">My Atlas</b></span><span className="ml-auto rounded-md bg-lime px-2 py-0.5 font-mono text-[10px] font-semibold uppercase">Save</span></div>
     <div className="grid h-[clamp(300px,30vw,400px)] grid-cols-[minmax(0,1fr)_180px] max-sm:grid-cols-1">
      <div className="relative bg-[#f5f5f2]"><div className="absolute top-3 left-3 z-10 grid"><span className="font-mono text-[10px] tracking-[.1em] text-[#1f201e]/50 uppercase">Operator · Deep scan</span><b className="font-display text-lg font-medium">My Atlas</b></div><Avatar skin="atlas" animation="Idle"/></div>
      <div className="grid content-start gap-2 border-l border-[#1f201e]/10 p-3 max-sm:hidden"><span className="font-mono text-[10px] tracking-[.1em] text-[#1f201e]/50 uppercase">Skills · {Math.min(skills.length,4)}/4</span>{skills.slice(0,4).map((s,k)=><span key={s.id} className={cn('flex items-center gap-2 rounded-lg border border-[#1f201e]/10 p-2 text-[12.5px] [&_svg]:size-4',k<3?'bg-[#f1fdd3]':'bg-white text-[#1f201e]/50')}><I id={SKILL_ICON[s.icon]||'globe'}/><b className="truncate font-medium">{s.name}</b></span>)}<span className="mt-1 rounded-lg bg-[#1f201e] py-2 text-center text-xs font-semibold text-white">Run task</span></div>
     </div>
    </div>
    <span className="absolute -top-3 right-6 rounded-md border bg-background px-2.5 py-1 font-mono text-[10px] tracking-[.06em] uppercase shadow-sm">Live 3D · not a video</span>
   </Reveal>
   <div className="grid gap-7">
    <SectionHead eyebrow="The idea" lead="An agent you can see" rest="is an agent you can trust."/>
    <DashedRule/>
    {[['A face for every agent','Characters blink, breathe and react while a task runs, so you always know what your agent is doing.'],['Skills, not decoration','Ten focused skills. Research, writing, documents, summaries, translation, ideas, code, plans, a wallet monitor and a whale watch.']].map(([t,p])=><Reveal key={t} className="grid gap-1.5"><b className="text-[15px] font-semibold">{t}</b><p className="max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground">{p}</p></Reveal>)}
    <div><CutButton className="nudge magnetic" onClick={()=>onNavigate('studio')}>Build one now <I id="arrow"/></CutButton></div>
   </div>
  </div>
 </section>;
}

type Row={k:string;tone:Tone;title:string;text:string;points:[string,string][];mock:ReactNode;flip?:boolean};
export function FeatureRows({onNavigate,onPick}:{onNavigate:(v:'studio')=>void;onPick:(id:CharacterId)=>void}){
 const rows:Row[]=[
  {k:'Roster',tone:'lime',title:'Pick a character. Built live.',text:'Every character is generated in your browser from primitives. They blink, breathe, glance at your cursor and react when you turn them.',points:[['users','Humans and bots'],['orb','A signature power'],['play','20 layered motions'],['target','Drag, zoom, pause']],mock:<RosterMock onPick={onPick}/>},
  {k:'Outfits',tone:'coral',flip:true,title:'Dress every piece.',text:'Body, hair, tops, bottoms, shoes, gear and glow. Mix presets, pick any color, or hit Randomize and keep what you like.',points:[['user','Hair, face, skin'],['pen','Any custom color'],['hype','Gear and glow'],['save','Saved with the agent']],mock:<OutfitMock/>},
  {k:'Persona',tone:'iris',title:'A mind that travels with every task.',text:'Name it, write its instructions, set a tone and an answer language. The persona is sent with every run.',points:[['doc','2,000-char instructions'],['sum','Three tones'],['lang','English or Indonesian'],['list','Starter templates']],mock:<PersonaMock/>},
  {k:'Skills',tone:'sky',flip:true,title:'Skills that do real work.',text:'Up to four per agent: research briefs, summaries, document Q&A, drafts, translations, plans and code reviews.',points:[['globe','Eight usable skills'],['layers','Four per agent'],['check','Labelled samples'],['bulb','Live AI when connected']],mock:<SkillsMock/>},
  {k:'Publish',tone:'amber',title:'Publish it. Set a price per run.',text:'Put an agent in Discover with a credit price. Others run it as-is; your instructions are never shown to them.',points:[['coins','0 to 500 CR a run'],['shield','Instructions not shown'],['archive','Unpublish any time'],['clock','Ledger for every run']],mock:<PublishMock/>},
 ];
 return <section className="tone-flip px-4 py-[clamp(80px,10vw,150px)]">
  <div className="mx-auto max-w-[1180px]">
   <div className="flex items-center gap-4 border-b pb-5"><Eyebrow tone="lime">What the studio does</Eyebrow><span className="ml-auto font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase max-sm:hidden">05 steps</span></div>
   {rows.map((r,i)=><article key={r.k} className="grid items-center gap-[clamp(28px,5vw,80px)] border-b py-[clamp(48px,7vw,100px)] last:border-b-0 lg:grid-cols-2">
    <Reveal className={cn('grid gap-4',r.flip&&'lg:order-2')}>
     <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">0{i+1} · {r.k}</span>
     <h3 className="font-display text-[clamp(26px,2.6vw,36px)] leading-[1.08] font-medium tracking-[-.03em]">{r.title}</h3>
     <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">{r.text}</p>
     <ul className="stagger mt-2 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-dashed border-foreground/20 pt-5 max-sm:grid-cols-1">{r.points.map(([ic,t])=><li key={t} className="flex items-center gap-2.5 font-mono text-[11px] tracking-[.06em] uppercase [&_svg]:size-4 [&_svg]:text-lime"><I id={ic}/>{t}</li>)}</ul>
    </Reveal>
    <Reveal delay={120} className={cn('rounded-xl p-[clamp(14px,2.4vw,28px)]',{lime:'bg-lime',coral:'bg-coral',iris:'bg-iris',sky:'bg-sky',amber:'bg-amber',mint:'bg-mint',pink:'bg-pink',ink:'bg-foreground'}[r.tone])}>
     <Card className="tone-light gap-0 rounded-xl border-[#1f201e]/10 p-5 shadow-[0_24px_48px_-28px_rgb(0_0_0/.5)]">{r.mock}</Card>
    </Reveal>
   </article>)}
   <div className="flex justify-center pt-10"><CutButton variant="lime" size="lg" className="magnetic" onClick={()=>onNavigate('studio')}>Open the studio <I id="arrow"/></CutButton></div>
  </div>
 </section>;
}

export function FolderCards({onNavigate}:{onNavigate:(v:'studio'|'discover'|'docs')=>void}){
 const stage=useTokenStage();
 const cards:{tab:string;tone:Tone;title:string;text:string;foot:[string,string];go:'studio'|'discover'|'docs';art:ReactNode}[]=[
  {tab:'Share',tone:'iris',title:'Share as a link or embed',text:'Send the whole agent as one link, or drop a live preview into any page with an iframe.',foot:['Link','Embed'],go:'studio',art:<div className="grid min-w-0 gap-2"><div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background p-2 text-xs"><span className="min-w-0 truncate font-mono text-muted-foreground">rhio…/#agent=eyJuYW1lIjoi…</span><span className="ml-auto shrink-0 rounded-md bg-lime px-2 py-1 font-semibold text-ink">Copy</span></div><div className="truncate rounded-lg border bg-background p-2 font-mono text-[11px] text-muted-foreground">&lt;iframe src=&quot;…?view=embed&quot; /&gt;</div></div>},
  {tab:'Discover',tone:'coral',title:'Run what others built',text:'Browse published agents and pay per run in credits. The creator keeps the price minus the fee.',foot:['Marketplace','Pay per run'],go:'discover',art:<div className="flex flex-wrap gap-1.5">{['Research companion','Content co-pilot','Knowledge keeper','Builder buddy'].map(t=><span key={t} className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium">{t}</span>)}</div>},
  {tab:'Docs',tone:'mint',title:'Honest about what is live',text:`Every page says what works today, what is switched on per server and what is only planned. ${TOKEN_LINE[stage]}`,foot:['Docs','Roadmap'],go:'docs',art:<div className="grid gap-1.5">{[['Skills and publishing','Live'],['Wallet sign-in','Live'],['USDG top-ups','Per server'],['Token and rewards',{test:'Testnet',none:'Planned',token:'Token live',rewards:'Live'}[stage]]].map(([a,b])=><div key={a} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs"><span>{a}</span><b className={cn('font-mono text-[10px] uppercase',/live/i.test(b)?'text-[#15845a] dark:text-mint':'text-muted-foreground')}>{b}</b></div>)}</div>},
 ];
 const stats:[number,string][]=[[characters.length,'Characters'],[20,'Motions'],[powers.length,'Powers'],[skillCatalog.filter(s=>!s.planned&&!s.locked).length,'Open skills']];
 return <section className="px-4 py-[clamp(80px,10vw,140px)]">
  <div className="mx-auto grid max-w-[1180px] gap-12">
   <SectionHead eyebrow="Stop settling for a chat box" tone="coral" lead="Assemble, dress and equip" rest="an agent that is quick to flex." sub="Compose a character, a persona and a skill set with one toolkit, then share it, publish it or run it."/>
   <div className="grid gap-4 md:grid-cols-3">
    {cards.map((c,k)=><Reveal key={c.tab} delay={k*80} className="group/folder min-w-0">
     <div className="relative pt-8">
      <span className={cn('absolute top-0 left-0 flex h-9 items-center rounded-t-xl border border-b-0 px-4 font-mono text-[10.5px] font-semibold tracking-[.1em] uppercase',TINT_BG[c.tone])}>{c.tab}</span>
      <div className="lift tilt grid h-full min-w-0 grid-cols-[minmax(0,1fr)] rounded-xl rounded-tl-none border bg-card">
       <div className={cn('m-2 min-w-0 overflow-hidden rounded-lg p-4',TINT_BG[c.tone])}>{c.art}</div>
       <div className="grid gap-1.5 px-5 pt-3 pb-5"><b className="text-[17px] font-semibold tracking-[-.01em]">{c.title}</b><p className="text-sm leading-relaxed text-muted-foreground">{c.text}</p></div>
       <button onClick={()=>onNavigate(c.go)} className="flex min-w-0 items-center overflow-hidden border-t text-left font-mono text-[10.5px] tracking-[.08em] text-muted-foreground uppercase transition-colors hover:text-foreground">
        <span className="border-r px-4 py-3">{c.foot[0]}</span><span className="px-4 py-3">{c.foot[1]}</span><span className="ml-auto grid size-10 place-items-center border-l text-foreground [&_svg]:size-4 [&_svg]:transition-transform group-hover/folder:[&_svg]:translate-x-0.5"><I id="arrow"/></span>
       </button>
      </div>
     </div>
    </Reveal>)}
   </div>
   <Reveal className="stagger grid grid-cols-4 border-y max-md:grid-cols-2">
    {stats.map(([n,l],k)=><div key={l} className={cn('grid gap-1 px-5 py-7',k>0&&'md:border-l md:border-dashed md:border-foreground/20',k%2===1&&'max-md:border-l max-md:border-dashed max-md:border-foreground/20',k>1&&'max-md:border-t')}><CountUp to={n} className="font-display text-[clamp(44px,5vw,68px)] leading-none font-medium tracking-[-.05em]"/><span className="font-mono text-[10.5px] tracking-[.1em] text-muted-foreground uppercase">{l}</span></div>)}
   </Reveal>
   <div className="flex justify-center"><BracketLink onClick={()=>onNavigate('docs')}>Read how it works</BracketLink></div>
  </div>
 </section>;
}
