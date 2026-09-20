import {stream,find,toMd,write} from './lib.mjs';
import {pageItems,lines,lineText,extractTable,mdTable} from './tables.mjs';
import {md,SRC} from './build_a.mjs';
export function lootTables(pFrom,pTo){
  const out=[];
  for(let p=pFrom;p<=pTo;p++){
    const ls=lines(pageItems(p)); const hdrs=ls.filter(l=>/^ROLL (Loot|LOOT)/.test(lineText(l)));
    const stops=ls.filter(l=>/^Additional (Items|Consumables)/.test(lineText(l)));
    for(const h of hdrs){
      const rollXs=h.items.filter(i=>/^ROLL$/i.test(i.s.trim())).map(i=>i.x);
      const ranges=rollXs.length>1?rollXs.map((x,k)=>[k===0?0:x-6,k+1<rollXs.length?rollXs[k+1]-6:999]):[[0,p===84?300:999]];
      const below=hdrs.filter(x=>x.y<h.y-5).sort((a,b)=>b.y-a.y)[0];
      for(const [xMin,xMax] of ranges){
        const stop=stops.filter(s=>s.y<h.y).sort((a,b)=>b.y-a.y)[0];
        let yEnd=45; if(stop&&(!below||stop.y>below.y)) yEnd=stop.y+2; else if(below&&rollXs.length<=1) yEnd=below.y+3;
        const t=extractTable(p,{hdr:h,yEnd,xMin,xMax,anchorCol:0});
        out.push({page:p,x:xMin,y:h.y,...t});
      }
    }
  }
  return out;
}
const rowsOf=(ts,test)=>ts.filter(test).flatMap(t=>t.rows).map(r=>[r[0],r[1],r[2]]);
const items=lootTables(75,79), cons=lootTables(80,84);
const split=(rows)=>{ const i=rows.findIndex((r,k)=>k>0&&+r[0]<+rows[k-1][0]); return [rows.slice(0,i),rows.slice(i)]; };
const [iCore,iAdd]=split(rowsOf(items,()=>true)), [cCore,cAdd]=split(rowsOf(cons,()=>true));
export const lootCounts={iCore:iCore.length,iAdd:iAdd.length,cCore:cCore.length,cAdd:cAdd.length};
const H=['Roll','Name','Description'];
{ // items
  const a=find('LOOT',0,75,75), b=find('Core Set Items',a,75,75);
  const addI=find(/^Additional Items/,b,77,77), addTxt=stream.slice(addI+1,addI+4).filter(l=>/^The following/.test(l.t)||/expansion|Expansion/.test(l.t)).map(l=>l.t).join(' ');
  write('Equipment/Items.md',`# Items (Loot)\n\n${SRC(a,b)}${md(a+1,b).trim()}\n\n## Item Tables\n\n- [Items Core Set.md](Items Core Set.md) — Core Set items (${iCore.length} entries, rolls 01–60)\n- [Items Hope and Fear Expansion.md](Items Hope and Fear Expansion.md) — additional items from the Hope & Fear Expansion Set (${iAdd.length} entries)\n\nSee also: [Consumables.md](Consumables.md), [Gold.md](Gold.md), [Equipment.md](Equipment.md).\n`);
  write('Equipment/Items Core Set.md',`# Core Set Items\n\n> Source: Daggerheart SRD 2.0, Items, pp. 75–77. Rules for using the table: [Items.md](Items.md).\n\nChoose a rarity, roll the associated number of d12s, add them together if needed, and find the matching row.\n\n${mdTable(H,iCore)}`);
  write('Equipment/Items Hope and Fear Expansion.md',`# Additional Items (Hope & Fear Expansion Set)\n\n> Source: Daggerheart SRD 2.0, Items, pp. 77–79. Rules for using the table: [Items.md](Items.md).\n\n${addTxt}\n\n${mdTable(H,iAdd)}`);
}
{ // consumables
  const a=find('CONSUMABLES',0,80,80), b=find('Core Set Consumables',a,80,80);
  write('Equipment/Consumables.md',`# Consumables\n\n${SRC(a,b)}${md(a+1,b).trim()}\n\n## Consumable Tables\n\n- [Consumables Core Set.md](Consumables Core Set.md) — Core Set consumables (${cCore.length} entries)\n- [Consumables Hope and Fear Expansion.md](Consumables Hope and Fear Expansion.md) — additional consumables (${cAdd.length} entries)\n\nSee also: [Items.md](Items.md), [Gold.md](Gold.md). Character creation gives one Minor Health Potion or Minor Stamina Potion (see [Character Creation.md](../Character Creation.md), Step 5).\n`);
  write('Equipment/Consumables Core Set.md',`# Core Set Consumables\n\n> Source: Daggerheart SRD 2.0, Consumables, pp. 80–81. Rules: [Consumables.md](Consumables.md).\n\n${mdTable(H,cCore)}`);
  write('Equipment/Consumables Hope and Fear Expansion.md',`# Additional Consumables (Hope & Fear Expansion Set)\n\n> Source: Daggerheart SRD 2.0, Consumables, pp. 82–84. Rules: [Consumables.md](Consumables.md).\n\n${mdTable(H,cAdd)}`);
}
{ // gold
  const a=find('GOLD',0,84,84), b=find('RUNNING AN ADVENTURE',a,85,85);
  write('Equipment/Gold.md',`# Gold\n\n${SRC(a,b)}${md(a+1,b).trim()}\n`);
}
if(process.argv[1]?.endsWith('build_loot.mjs')) console.log(lootCounts);
