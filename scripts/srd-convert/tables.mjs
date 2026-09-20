import fs from 'fs';
import {clean} from './lib.mjs';
const pages=JSON.parse(fs.readFileSync('pages.json','utf8'));
export const pageItems=n=>pages[n-1].items.filter(i=>i.y>45&&!/^Daggerheart SRD/.test(i.s.trim()));
const norm=s=>s.replace(/\s+/g,' ').trim();
// items grouped into visual lines by y
export function lines(items,tol=2.5){
  const s=[...items].sort((a,b)=>b.y-a.y||a.x-b.x); const out=[];
  for(const i of s){ const l=out.find(l=>Math.abs(l.y-i.y)<tol); if(l)l.items.push(i); else out.push({y:i.y,items:[i]}); }
  out.forEach(l=>l.items.sort((a,b)=>a.x-b.x)); return out.sort((a,b)=>b.y-a.y);
}
// headers: lines whose text matches
export function findLines(pageNo,re){ return lines(pageItems(pageNo)).filter(l=>re.test(norm(l.items.map(i=>i.s).join(' ')))); }
export function lineText(l){ return norm(l.items.map(i=>i.s).join(' ')); }
/** Extract a table under a header line. hdr: line object; yEnd: lower y bound (exclusive); xMin/xMax range. anchorCol: column whose presence starts a row. */
export function extractTable(pageNo,{hdr,yTop,yEnd=45,xMin=0,xMax=999,anchorCol=1,headers,bounds}){
  const hItems=hdr?hdr.items.filter(i=>i.x>=xMin&&i.x<xMax&&i.s.trim()):[];
  const hx=bounds||hItems.map(i=>i.x); const hl=headers||hItems.map(i=>norm(i.s)); const top=hdr?hdr.y:yTop;
  const data=pageItems(pageNo).filter(i=>i.y<top-2&&i.y>yEnd&&i.x>=xMin-4&&i.x<xMax&&i.s.trim());
  const colOf=x=>{let c=0; hx.forEach((h,k)=>{ if(h<=x+8)c=k; }); return c;};
  const rows=[]; let cur=null;
  for(const l of lines(data)){
    const hasAnchor=l.items.some(i=>colOf(i.x)===anchorCol);
    if(hasAnchor||!cur){ cur={cells:hl.map(()=>[])}; rows.push(cur); }
    for(const i of l.items) cur.cells[colOf(i.x)].push(i.s);
  }
  return {headers:hl,rows:rows.map(r=>r.cells.map(c=>clean(c.join(' ').replace(/\s+/g,' '))))};
}
export const mdTable=(headers,rows)=>`| ${headers.join(' | ')} |\n|${headers.map(()=>'---').join('|')}|\n${rows.map(r=>'| '+r.map(c=>(c||'').replace(/\|/g,'\\|')).join(' | ')+' |').join('\n')}\n`;
/** Text lines of a page excluding band rectangles [{yTop,yBottom,xMin,xMax}] — returns stream-like lines col0 then col1 */
export function textOutside(pageNo,bands,{yMax=9999,yMin=45}={}){
  const its=pageItems(pageNo).filter(i=>i.y<=yMax&&i.y>=yMin&&!bands.some(b=>i.y<=b.yTop&&i.y>=b.yBottom&&i.x>=(b.xMin??0)&&i.x<(b.xMax??999)));
  const mid=306; const out=[];
  for(const c of [0,1]){
    const ls=lines(its.filter(i=>(i.x<mid-5?0:1)===c));
    const ws=ls.map(l=>l.items[l.items.length-1].x+l.items[l.items.length-1].w-l.items[0].x).sort((a,b)=>a-b); const maxW=ws.length?ws[Math.floor(ws.length*0.9)]:300;
    let prev=null;
    for(const l of ls){ const w=l.items[l.items.length-1].x+l.items[l.items.length-1].w-l.items[0].x; out.push({y:l.y,p:pageNo,c,t:norm(l.items.map(i=>i.s).join(' ')),w,maxW,gap:prev?prev-l.y:0,blank:false}); prev=l.y; }
  }
  return out;
}
