/* Route marker for the public agent teams page (/teams): the app shell in app/layout.tsx renders the screen from the
   pathname (lib/routes.ts, components/rhio/teams-page.tsx). The page has its own link preview (lib/page-cards.ts). */
import {pageMetadata} from '@/lib/page-cards';
export const metadata=pageMetadata('teams');
export default function Page(){return null;}
