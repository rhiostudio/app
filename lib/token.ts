/* RHIO token contract. There is NO deployed contract yet (see the whitepaper and roadmap), so this
   stays null and the UI shows "Not deployed yet" with copying disabled. When a real contract is
   deployed on Robinhood Chain (chain 4663; explorer robinhoodchain.blockscout.com), set the checksummed
   address here and RHIO_TOKEN_ADDRESS in the Worker env (holder tiers read it, see lib/chain.ts).
   Never put a placeholder or test address here: people would copy it. */
export const RHIO_CONTRACT:{address:string;explorer?:string}|null=null;

export const shortAddress=(a:string)=>a.length>12?`${a.slice(0,6)}…${a.slice(-4)}`:a;
