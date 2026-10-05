/* Route marker for a chat placed on a creator's site (/embed/<id>). The app shell in app/layout.tsx renders it from
   the pathname (lib/routes.ts, components/rhio/embed-page.tsx) without navigation, to sit inside a frame. Search
   engines are asked not to index it: it is a part of someone else's page. proxy.ts lets other sites frame this path. */
import type {Metadata} from 'next';
export const metadata:Metadata={title:{absolute:'Chat · RHIO'},robots:{index:false,follow:false}};
export default function Page(){return null;}
