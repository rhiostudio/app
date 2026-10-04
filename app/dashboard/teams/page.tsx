/* Route marker: the app shell in app/layout.tsx renders this screen from the pathname (lib/routes.ts).
   A link to it shows the agent teams card (lib/page-cards.ts). */
import {pageMetadata} from '@/lib/page-cards';
export const metadata=pageMetadata('teams');
export default function Page(){return null;}
