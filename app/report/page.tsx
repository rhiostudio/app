/* Route marker for the daily reward report (/report): the app shell in app/layout.tsx renders the screen from the
   pathname (lib/routes.ts, components/rhio/report-page.tsx). The page has its own link preview (lib/page-cards.ts);
   its picture shows live numbers, so its address changes with the hour. */
import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/page-cards';
export function generateMetadata():Metadata{return pageMetadata('report',`r1-${Math.floor(Date.now()/3600e3)}`);}
export default function Page(){return null;}
