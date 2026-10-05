/* Route marker: the app shell in app/layout.tsx renders this screen from the pathname (lib/routes.ts,
   components/app/insights.tsx). A creator's own numbers: signed-in only (proxy.ts), and not for search engines. */
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Insights',robots:{index:false,follow:false}};
export default function Page(){return null;}
