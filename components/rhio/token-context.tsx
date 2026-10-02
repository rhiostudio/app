'use client';
/* The RHIO token as the server knows it (RHIO_TOKEN_ADDRESS on Robinhood Chain mainnet), handed down from the root
   layout so the address is already in the first HTML. Every place that talks about the token reads this instead of a
   hard-coded address or a hard-coded "not live", so adding the token is a server setting and nothing else.
   A testnet build never shows a contract address and never says whether the real token exists: it cannot know. */
import {createContext,useContext,type ReactNode} from 'react';

export type RhioToken={address:string;explorer:string;rewardsLive:boolean};
/** 'test': testnet build. 'none': mainnet, no contract yet. 'token': the token, rewards off. 'rewards': both. */
export type TokenStage='test'|'none'|'token'|'rewards';
type TokenInfo={token:RhioToken|null;test:boolean};
const TokenContext=createContext<TokenInfo>({token:null,test:false});
export function TokenProvider({token,test,children}:TokenInfo&{children:ReactNode}){return <TokenContext.Provider value={{token,test}}>{children}</TokenContext.Provider>;}
/** The live RHIO token, or null while there is none (always null on a testnet build). */
export const useRhioToken=()=>useContext(TokenContext).token;
export function useTokenStage():TokenStage{const {token,test}=useContext(TokenContext);return test?'test':!token?'none':token.rewardsLive?'rewards':'token';}
/** One sentence on the token and holder rewards that is true for the state the server reports. */
export const TOKEN_LINE:Record<TokenStage,string>={
 test:'This is a testnet build: nothing here is the real RHIO token or a real reward.',
 none:'The RHIO token and holder rewards are not live.',
 token:'The RHIO token is live. NVDA holder rewards are not paying yet.',
 rewards:'The RHIO token is live and NVDA holder rewards are switched on; the Rewards page shows what is paid.',
};
