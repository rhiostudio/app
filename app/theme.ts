'use client';
import {useEffect,useState} from 'react';

// Theme preference: dark by default, "light" stored in localStorage. The inline
// THEME_BOOT script in app/layout.tsx applies it before first paint.
export type Theme='dark'|'light';
const KEY='rhio-theme';

function read():Theme{
 try{return localStorage.getItem(KEY)==='dark'?'dark':'light';}catch{return 'light';}
}

export function useTheme():[Theme,(t:Theme)=>void]{
 const [theme,setTheme]=useState<Theme>('light');
 useEffect(()=>{setTheme(read());},[]);
 const apply=(t:Theme)=>{
  setTheme(t);
  const root=document.documentElement;root.classList.add('theme-anim');window.setTimeout(()=>root.classList.remove('theme-anim'),450);
  if(t==='light')document.documentElement.dataset.theme='light';else delete document.documentElement.dataset.theme;
  try{localStorage.setItem(KEY,t);}catch{}
 };
 return [theme,apply];
}
