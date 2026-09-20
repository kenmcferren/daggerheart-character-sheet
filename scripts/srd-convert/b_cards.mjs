import {stream,find,findAll,toMd,title} from './lib.mjs';
// Domain card reference: p206+. Domain headings can sit mid-column, so cards are assigned by their own "Level N Domain Type" line.
const first=find(/^Domain Card reference$/i,0,206,206);
const body=stream.slice(first+1).filter(l=>l.p>=206&&!/^[A-Z]+ DOMAIN$/.test(l.t));
const idx=[]; body.forEach((l,i)=>{ if(/^Level \d+ /.test(body[i+1]?.t||'')&&/^[-–\s]*[A-Z][A-Z0-9 \-–'’:!,.]+$/.test(l.t)) idx.push(i); });
export const cards={};
idx.forEach((s,j)=>{
  const e=j+1<idx.length?idx[j+1]:body.length; const b=body.slice(s,e);
  const m=b[1].t.match(/^Level (\d+) (.+?) (Spell|Ability|Grimoire)$/);
  const rc=b[2]?.t.match(/^Recall Cost: (\d+)/);
  const dom=m?m[2]:'UNKNOWN';
  (cards[dom]??=[]).push({name:title(b[0].t.replace(/^[-–\s]+/,'').replace(/ - /g,'-')),level:m?+m[1]:null,domain:dom,type:m?m[3]:null,recall:rc?+rc[1]:null,text:toMd(b.slice(3),{level:4}),raw:b});
});
export const cardCount=idx.length;
