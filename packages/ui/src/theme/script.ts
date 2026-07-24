import { THEME_STORAGE_KEY } from "./resolution";

export const themeInitializerScript = `(()=>{const r=document.documentElement;let t="light";try{const s=localStorage.getItem("${THEME_STORAGE_KEY}");t=s==="light"||s==="dark"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch{try{t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch{t="light"}}r.dataset.theme=t;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t})()`;
