import {stream,find,findAll,toMd,title,write,slice} from './lib.mjs';
export const CLASSES=['ASSASSIN','BARD','BRAWLER','DRUID','GUARDIAN','RANGER','ROGUE','SERAPH','SORCERER','WARLOCK','WARRIOR','WITCH','WIZARD'];
export const classes=[];
let cur=find('ASSASSIN',0,8,9); const idx=[];
for(const n of CLASSES){ const i=find(n,cur>0?cur:0,8,32); if(i<0) throw new Error('class '+n); idx.push(i); cur=i+1; }
const endI=find('ANCESTRIES',idx[idx.length-1],28,33);
CLASSES.forEach((n,k)=>{
  const s=idx[k], e=k+1<idx.length?idx[k+1]:endI; const b=stream.slice(s+1,e);
  const txt=b.map(l=>l.t).join('\n');
  const dom=txt.match(/DOMAINS – (.+)/)?.[1]; const ev=txt.match(/STARTING EVASION – (\d+)/)?.[1]; const hp=txt.match(/STARTING HIT POINTS – (\d+)/)?.[1];
  const sub=b.map(l=>l.t).join(' ').match(/Choose either the (.+?) or (.+?) subclass\./);
  classes.push({raw:b,name:title(n),domains:dom,evasion:ev,hp,subs:sub?[sub[1],sub[2]]:null,md:toMd(b,{level:2}),first:s,last:e-1,pages:[stream[s].p,stream[e-1].p]});
});
