import {publicChainConfig} from '@/lib/chain';
/** Public Robinhood Chain settings: network, public RPC, token and treasury addresses, rates, tiers. */
export function GET(){return Response.json(publicChainConfig(),{headers:{'Cache-Control':'no-store'}});}
