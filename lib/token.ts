/* RHIO token contract. The address is NOT written in the code: it comes from RHIO_TOKEN_ADDRESS in the server
   environment (lib/chain.ts), is handed to the page by app/layout.tsx and read with useRhioToken()
   (components/rhio/token-context.tsx). Without it the UI says "Not deployed yet" and copying is disabled, so nothing
   fake can be copied. Only a mainnet address (Robinhood Chain 4663) is ever shown: a test token on the testnet or on a
   local chain must never look like the real contract. */
export const shortAddress=(a:string)=>a.length>12?`${a.slice(0,6)}…${a.slice(-4)}`:a;
