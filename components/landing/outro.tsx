'use client';
/* Closing sections:
   - TokenBand: ZATS "rule" band as a clean light panel (no wave) with a tilted solid note.
   - Faq: Twenty dark FAQ; questions come from the FAQ section of the docs content.
   - Closing: ZATS white closing panel + Twenty-style footer. */
import {Card} from '@/components/ui/card';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {CONTENT} from '@/lib/rhio3d/content';
import {I} from '@/app/ui';
import {BracketLink,CutButton,DashedRule,Eyebrow,Marquee,Reveal} from '@/components/rhio/motion';
import {Logo} from '@/components/rhio/navbar';
import {Headline} from './features';
import {SiteFooter} from '@/components/rhio/site-footer';

import type {View} from '@/lib/routes';
type Go=(v:View,doc?:string)=>void;

export function TokenBand({onNavigate}:{onNavigate:Go}){
 return <section className="px-2 pt-[clamp(60px,8vw,110px)] max-[820px]:px-0">
  <div className="rounded-xl border bg-surface px-4 pt-[clamp(64px,8vw,110px)] pb-[clamp(56px,7vw,96px)] text-center max-[820px]:rounded-none">
   <div className="grid justify-items-center gap-6">
    <Eyebrow tone="amber">Holder rewards · NVDA</Eyebrow>
    <Reveal><h2 className="text-[clamp(46px,8vw,118px)] leading-[.95]"><span className="font-display font-medium tracking-[-.05em]">Hold RHIO.</span><br/><span className="font-display font-light tracking-[-.05em] text-muted-foreground">Earn NVDA.</span></h2></Reveal>
    <Reveal className="relative mt-4 flex items-start justify-center max-sm:flex-col max-sm:items-center">
     <div className="grid w-[270px] gap-1">
      <Card className="items-center gap-3 rounded-2xl p-6 text-center shadow-[0_30px_60px_-36px_rgb(0_0_0/.35)]">
       <span className="flex rounded-lg border p-0.5 text-xs"><span className="rounded-lg bg-foreground px-3 py-0.5 text-background">Status</span><span className="px-3 py-0.5 text-muted-foreground">Chain</span></span>
       <b className="mt-2 font-display text-6xl leading-none font-medium tracking-[-.05em]">NVDA</b>
       <span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">Stock Token · holder reward</span>
       <CutButton size="sm" variant="lime" className="mt-1" onClick={()=>onNavigate('paper')}>How it works <I id="arrow"/></CutButton>
      </Card>
      <div className="rounded-2xl border border-dashed bg-card px-4 py-3 font-mono text-[10px] tracking-[.06em] uppercase">Open. First payout after the RHIO token launches.</div>
     </div>
     <div className="mt-12 -ml-7 w-[170px] rotate-[8deg] rounded-xl bg-sky px-4 pt-4 pb-5 text-center text-[#062233] shadow-[0_30px_60px_-36px_rgb(0_0_0/.4)] transition-transform duration-700 ease-smooth hover:rotate-[2deg] max-sm:mt-[-24px] max-sm:ml-36">
      <span className="font-mono text-[10px] font-bold tracking-[.1em] uppercase">Not yet</span>
      <ul className="mt-3 grid gap-0.5 font-mono text-[11px] uppercase line-through">{['token sale','airdrop','staking'].map(x=><li key={x}>{x}</li>)}</ul>
     </div>
    </Reveal>
   </div>
  </div>
  <div className="mx-auto grid max-w-[1180px] items-start gap-8 px-4 pt-16 pb-6 md:grid-cols-[240px_1fr]">
   <Eyebrow tone="amber">What it would add</Eyebrow>
   <Reveal className="grid max-w-[640px] gap-6">
    <p className="text-[clamp(20px,2vw,27px)] leading-snug font-medium tracking-[-.02em]">Creators already earn credits when others run their agents. Holding RHIO adds fee discounts and NVDA rewards: every 3,000,000 RHIO held earns $0.01 of tokenized NVDA per hour on Robinhood Chain.</p>
    <p className="text-sm text-muted-foreground">The RHIO token has not launched, so no period has paid out yet. Stock Tokens are debt securities, not shares, and are not available to US persons or in restricted countries; holders confirm eligibility before claiming. Nothing here is financial advice.</p>
    <div className="flex flex-wrap gap-2"><CutButton onClick={()=>onNavigate('paper')}>Tokenomics</CutButton><CutButton variant="outline" onClick={()=>onNavigate('roadmap')}>Roadmap</CutButton></div>
   </Reveal>
  </div>
 </section>;
}

function faqItems(){
 const faq=CONTENT.docs.find(d=>d.id==='faq');if(!faq)return [];
 return faq.body.split('\n').map(l=>l.match(/^\*\*(.+?)\*\*\s*(.+)$/)).filter(Boolean).map(m=>({q:m![1],a:m![2]}));
}
export function Faq({onNavigate}:{onNavigate:Go}){
 const items=faqItems();
 return <section className="tone-flip mt-[clamp(60px,8vw,110px)] px-4 py-[clamp(72px,9vw,120px)]">
  <div className="mx-auto grid max-w-[1180px] gap-12">
   <Reveal className="grid gap-5">
    <Eyebrow tone="iris">Any questions?</Eyebrow>
    <Headline lead="Stop chatting with a box." rest="Start building, with RHIO."/>
    <div className="flex flex-wrap gap-2"><CutButton variant="light" className="magnetic" onClick={()=>onNavigate('studio')}>Get started</CutButton><CutButton variant="outline" onClick={()=>onNavigate('docs','faq')}>All answers</CutButton></div>
   </Reveal>
   <Accordion type="single" collapsible className="stagger mx-auto w-full max-w-3xl">
    {items.map((f,k)=><AccordionItem key={f.q} value={String(k)} className="border-white/15">
     <AccordionTrigger className="gap-4 py-5 text-[clamp(17px,1.6vw,21px)] font-normal text-foreground/80 hover:text-foreground hover:no-underline data-[state=open]:text-foreground [&>svg]:text-muted-foreground"><span className="flex items-start gap-4"><span className="pt-1 font-mono text-[11px] text-muted-foreground">{String(k+1).padStart(2,'0')}</span>{f.q}</span></AccordionTrigger>
     <AccordionContent className="pb-6 pl-10 text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
    </AccordionItem>)}
   </Accordion>
  </div>
 </section>;
}

export function Closing({onNavigate}:{onNavigate:Go}){
 return <section className="p-2 max-[820px]:p-0">
  <div className="overflow-hidden rounded-xl border bg-background max-[820px]:rounded-none">
   <div className="grid justify-items-center gap-7 px-4 pt-[clamp(70px,9vw,120px)] text-center">
    <span className="font-mono text-[10.5px] leading-relaxed tracking-[.1em] uppercase">Build it, dress it, equip it.<br/>Free during private preview.</span>
    <Reveal><h2 className="text-[clamp(52px,10vw,150px)] leading-[.9]"><span className="font-display font-medium tracking-[-.055em]">Put your agent</span><br/><span className="font-display font-light tracking-[-.055em]">to work.</span></h2></Reveal>
    <div className="flex flex-wrap justify-center gap-2"><CutButton size="lg" variant="lime" className="magnetic" onClick={()=>onNavigate('studio')}>Open the studio <I id="arrow"/></CutButton><CutButton size="lg" variant="outline" onClick={()=>onNavigate('docs','start')}>Read the docs</CutButton></div>
   </div>
   <Marquee duration={50} gap="0px" className="mt-[clamp(60px,8vw,100px)] border-y">
    {['Build','Dress','Equip','Publish','Run','Earn'].map((w,k)=><span key={w} className="flex items-center gap-6 border-r px-10 py-5 font-display text-[clamp(28px,3.4vw,48px)] font-light tracking-[-.03em] whitespace-nowrap"><i className={['size-3 rounded-[3px] bg-lime','size-3 rounded-[3px] bg-iris','size-3 rounded-[3px] bg-coral','size-3 rounded-[3px] bg-sky','size-3 rounded-[3px] bg-amber','size-3 rounded-[3px] bg-mint'][k]}/>{w}</span>)}
   </Marquee>
   <div className="mt-[clamp(48px,6vw,80px)]"><SiteFooter onNavigate={onNavigate}/></div>
  </div>
 </section>;
}
