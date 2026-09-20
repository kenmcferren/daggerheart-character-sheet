import {toMd,title} from './lib.mjs';
import {pageItems,lines,lineText,extractTable,mdTable} from './tables.mjs';
// Render a single-column page region (y in [yMin,yMax]) as markdown: prose runs + tables whose header matches headerRe.
export function flowPage(p,{yMax=9999,yMin=45,headerRe=/^Name (Trait|Thresholds)/,level=3,labelLevel=3}={}){
  const its=pageItems(p).filter(i=>i.y<=yMax&&i.y>=yMin);
  const ls=lines(its); const out=[]; let run=[];
  const flush=()=>{ if(!run.length) return;
    // trailing short label lines before a table -> heading
    out.push({type:'text',lines:run}); run=[]; };
  const toLine=l=>({p,c:0,t:lineText(l),w:l.items[l.items.length-1].x+l.items[l.items.length-1].w-l.items[0].x,maxW:480,gap:0,blank:false,y:l.y});
  let i=0;
  while(i<ls.length){
    const l=ls[i];
    if(headerRe.test(lineText(l))){
      flush();
      const x0=l.items[0].x;
      let j=i+1; while(j<ls.length&&!(ls[j].items[0].x<x0-4&&ls[j].items.length<=2&&j>i)) j++;
      const yEnd=j<ls.length?ls[j].y+3:yMin;
      const t=extractTable(p,{hdr:l,yEnd,anchorCol:1});
      const merged=[]; for(const r of t.rows){ if(!r[0]&&merged.length){ const m=merged[merged.length-1]; r.forEach((c,k)=>{ if(c) m[k]=m[k]?m[k]+(k===r.length-1?' ':'; ')+c:c; }); } else merged.push([...r]); } t.rows=merged;
      out.push({type:'table',t}); i=j; continue;
    }
    if(/^Base( Base)?$/.test(lineText(l))){ i++; continue; }
    run.push(toLine(l)); i++;
  }
  flush();
  return out.map(o=>{
    if(o.type==='table') return mdTable(o.t.headers,o.t.rows);
    // heading detection: a short line without terminal punctuation directly after a gap or table -> heading
    const ls2=o.lines; const parts=[]; let buf=[];
    for(const l of ls2){
      const isLabel=l.t.length<40&&!/[.:!?,]$/.test(l.t)&&/^[A-Z]/.test(l.t)&&l.w<300;
      if(isLabel){ if(buf.length){parts.push(toMd(buf,{level}).trim()); buf=[];} parts.push('#'.repeat(labelLevel)+' '+l.t); }
      else buf.push(l);
    }
    if(buf.length) parts.push(toMd(buf,{level}).trim());
    return parts.join('\n\n');
  }).join('\n\n')+'\n';
}
