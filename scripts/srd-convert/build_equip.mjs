import {stream,find,toMd,write,clean} from './lib.mjs';
import {pageItems,lines,lineText,extractTable,mdTable,textOutside} from './tables.mjs';
import {md,SRC} from './build_a.mjs';

const tierName=t=>({1:'Tier 1 (Level 1)',2:'Tier 2 (Levels 2–4)',3:'Tier 3 (Levels 5–7)',4:'Tier 4 (Levels 8–10)'}[t]);
// ------- generic walker: events top->bottom per page; tables run until the next event
function walk(pFrom,pTo,{isHeader,labels}){
  const tables=[]; const st={cat:null,tier:null,kind:null};
  for(let p=pFrom;p<=pTo;p++){
    const ls=lines(pageItems(p)); const ev=[];
    for(const l of ls){ const t=lineText(l); if(isHeader(t)) ev.push({type:'hdr',l,t}); else{ const lab=labels(t); if(lab) ev.push({type:'lab',l,lab,t}); } }
    ev.forEach((e,k)=>{
      if(e.type==='lab'){ Object.assign(st,e.lab); }
      else { const next=ev[k+1]; const yEnd=next?next.l.y+3:45; const tb=extractTable(p,{hdr:e.l,yEnd,anchorCol:1}); tables.push({...st,page:p,hdrY:e.l.y,yEnd,...tb}); }
    });
  }
  return tables;
}
export const weaponTables=walk(56,69,{
  isHeader:t=>/^Name Trait Range Damage Burden Feature$/.test(t),
  labels:t=>{ let m;
    if(t==='PRIMARY WEAPON TABLES') return {cat:'Primary',kind:null};
    if(t==='SECONDARY WEAPON TABLES') return {cat:'Secondary',kind:null};
    if(m=t.match(/^TIER (\d)/)) return {tier:+m[1]};
    if(t==='Physical Weapons') return {kind:'Physical Weapons'};
    if(t==='Magic Weapons') return {kind:'Magic Weapons'};
    return null; }});
export const armorTables=walk(72,74,{
  isHeader:t=>/^Name Thresholds Score( Feature)?$/.test(t),
  labels:t=>{ let m; if(m=t.match(/^TIER (\d)/)) return {tier:+m[1]}; return null; }});
if(process.argv[1]?.endsWith('build_equip.mjs')){
  for(const t of [...weaponTables,...armorTables]) console.log(t.cat,t.tier,t.kind,'p'+t.page,t.headers.join('/'),t.rows.length,'rows | first:',t.rows[0]?.join(' ; ').slice(0,90),'| last:',t.rows.at(-1)?.join(' ; ').slice(0,80));
}
