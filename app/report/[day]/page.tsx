/* Route marker for /report/<day>: the same screen as /report (lib/routes.ts, components/rhio/report-page.tsx). The day
   in the address only makes each day's link a new one, so a post made today shows today's picture and keeps it; the
   page itself always shows the numbers of now. Anything that is not a day number is not a page. */
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {pageMetadata} from '@/lib/page-cards';

type P={params:Promise<{day:string}>|{day:string}};
const dayOf=async({params}:P)=>{const {day}=await params;return /^[1-9]\d{0,4}$/.test(String(day||''))?String(day):null;};
export async function generateMetadata(p:P):Promise<Metadata>{
 const day=await dayOf(p);if(!day)return {title:'Not found',robots:{index:false,follow:false}};
 const m=pageMetadata('report',`r1-${day}-${Math.floor(Date.now()/3600e3)}`);
 return {...m,title:`Reward report · day ${day}`,alternates:{canonical:'/report'}};
}
export default async function Page(p:P){if(!await dayOf(p))notFound();return null;}
