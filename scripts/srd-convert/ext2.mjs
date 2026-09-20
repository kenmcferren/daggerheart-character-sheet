import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const data=new Uint8Array(fs.readFileSync('C:/Users/kenmc/Documents/Daggerheart Character Sheet Printable/Daggerheart SRD.pdf'));
const doc=await pdfjs.getDocument({data}).promise;
const fix=(t,p)=>t.replace(/[\ue000-\uf8ff]/g,c=>{const n=c.charCodeAt(0)-0xe540; if(c==='\uf0e0')return '→'; if(c.charCodeAt(0)===0xe53f)return '0'; return n>=1&&n<=9?String(n):'⟦'+c.charCodeAt(0).toString(16)+'⟧'}).replace(/[\x00-\x1f]/g,c=>{ if(p===102) return '⟦c'+c.charCodeAt(0)+'⟧'; const o=c.charCodeAt(0); return o===30?',':o===26?'-':'⟦c'+o+'⟧'});
const pages=[];
for(let p=1;p<=doc.numPages;p++){
  const pg=await doc.getPage(p); const vp=pg.getViewport({scale:1});
  const tc=await pg.getTextContent();
  const items=tc.items.filter(i=>i.str.trim()).map(i=>({s:fix(i.str,p),x:i.transform[4],y:i.transform[5],w:i.width,h:i.height}));
  const mid=vp.width/2;
  const cols=[[],[]];
  for(const c of [0,1]){
    const its=items.filter(i=>(i.x<mid-5?0:1)===c).sort((a,b)=>b.y-a.y||a.x-b.x);
    let cur=null;
    for(const i of its){ if(cur&&Math.abs(cur.y-i.y)<3){cur.t+=(cur.t.endsWith(' ')||i.s.startsWith(' ')?'':' ')+i.s; cur.x1=Math.max(cur.x1,i.x+i.w); cur.x0=Math.min(cur.x0,i.x);} else {cur={y:i.y,t:i.s,x0:i.x,x1:i.x+i.w,h:i.h};cols[c].push(cur);} }
  }
  pages.push({p,w:vp.width,cols,items});
}
fs.writeFileSync('pages.json',JSON.stringify(pages));
console.log(pages.length);
