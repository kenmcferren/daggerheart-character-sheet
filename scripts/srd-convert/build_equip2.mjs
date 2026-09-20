import {stream,find,toMd,write,clean} from './lib.mjs';
import {pageItems,lines,lineText,extractTable,mdTable,textOutside} from './tables.mjs';
import {md,SRC} from './build_a.mjs';
import {weaponTables,armorTables} from './build_equip.mjs';

const TN={1:'Tier 1 (Level 1)',2:'Tier 2 (Levels 2–4)',3:'Tier 3 (Levels 5–7)',4:'Tier 4 (Levels 8–10)'};
const heads=['Name','Trait','Range','Damage','Burden','Feature'];
// ---------- Equipment.md
{
  const a=find('EQUIPMENT',0,55,55), b=find('PRIMARY WEAPON TABLES',a,56,56);
  write('Equipment/Equipment.md',`# Equipment\n\n${SRC(a,b)}Rules for equipping weapons and armor, and how weapon stats work. Stat tables live in the tier files below.\n\n${md(a+1,b).trim()}\n\n## Equipment Files\n\n- Weapons (choose one Tier 1 primary weapon, or one Tier 1 primary plus one Tier 1 secondary, at character creation):\n${[1,2,3,4].map(t=>`  - [Primary Weapons Tier ${t}.md](Primary Weapons Tier ${t}.md) · [Secondary Weapons Tier ${t}.md](Secondary Weapons Tier ${t}.md)`).join('\n')}\n- [Combat Wheelchair.md](Combat Wheelchair.md) — wheelchair models (primary weapons)\n- Armor: [Armor.md](Armor.md) rules; ${[1,2,3,4].map(t=>`[Armor Tier ${t}.md](Armor Tier ${t}.md)`).join(', ')}\n- [Items.md](Items.md) — loot table of reusable items\n- [Consumables.md](Consumables.md) — one-use loot table\n`);
}
// ---------- weapons
for(const cat of ['Primary','Secondary']){
  const introA=find(cat.toUpperCase()+' WEAPON TABLES',0,56,66), introB=find(/^TIER 1/,introA,56,66);
  const intro=md(introA+1,introB).trim();
  for(let t=1;t<=4;t++){
    const tbs=weaponTables.filter(x=>x.cat===cat&&x.tier===t);
    const kinds=[...new Set(tbs.map(x=>x.kind))];
    let out=`# ${cat} Weapons — ${TN[t]}\n\n> Source: Daggerheart SRD 2.0, ${cat} Weapon Tables, pp. ${Math.min(...tbs.map(x=>x.page))}–${Math.max(...tbs.map(x=>x.page))}\n\n`;
    if(t===1) out+=intro+'\n\n';
    out+=`Weapon stat definitions: [Equipment.md](Equipment.md). Damage is dice plus a flat modifier; you roll a number of dice equal to your Proficiency. \`phy\` = physical damage, \`mag\` = magic damage.\n\n`;
    for(const k of kinds){
      const rows=tbs.filter(x=>x.kind===k).flatMap(x=>x.rows);
      out+=`## ${k??'Weapons'}\n\n`;
      if(k==='Magic Weapons') out+='All magic weapons require a Spellcast trait.\n\n';
      out+=mdTable(heads,rows)+'\n';
    }
    write(`Equipment/${cat} Weapons Tier ${t}.md`,out);
  }
}
// ---------- armor
{
  const a=find('ARMOR',0,72,72), b=find('ARMOR TABLES',a,72,72);
  const wi=find(/^While unarmored/,b,72,72), we=find(/^Gain a bonus to your damage thresholds equal to your/,wi,72,72);
  const intro=md(a+1,b).trim(), tail=md(wi,we).trim();
  write('Equipment/Armor.md',`# Armor\n\n${SRC(a,we)}${intro}\n\n${tail}\n\n## Armor Tables\n\n${[1,2,3,4].map(t=>`- [Armor Tier ${t}.md](Armor Tier ${t}.md) — ${TN[t]}`).join('\n')}\n\nSee also: [Equipment.md](Equipment.md), [Damage rules in Combat.md](../Core Mechanics/Combat.md).\n`);
  for(let t=1;t<=4;t++){
    const tbs=armorTables.filter(x=>x.tier===t); const rows=tbs.flatMap(x=>x.rows);
    write(`Equipment/Armor Tier ${t}.md`,`# Armor — ${TN[t]}\n\n> Source: Daggerheart SRD 2.0, Armor Tables, pp. ${Math.min(...tbs.map(x=>x.page))}–${Math.max(...tbs.map(x=>x.page))}\n\nBase Thresholds are Major / Severe damage thresholds (add your level to both). Rules: [Armor.md](Armor.md). You can't equip armor of a higher tier than you.\n\n${mdTable(['Name','Base Thresholds (Major / Severe)','Base Armor Score','Feature'],rows)}`);
  }
}
// ---------- combat wheelchair
{
  const p70=pageItems(70), p71=pageItems(71);
  const hdr70=lines(p70).find(l=>/^Name Tier Trait Range Damage Burden Feature$/.test(lineText(l)));
  const hdrs71=lines(p71).filter(l=>/^Name Tier Trait Range Damage Burden Feature$/.test(lineText(l)));
  const lightHead=lines(p70).find(l=>lineText(l)==='Light Frame Models');
  const main=toMd(textOutside(70,[],{yMin:lightHead.y+20}).filter(l=>!/^Combat Wheelchair$|^By Mark Thompson$/.test(l.t)),{level:2});
  const t1=extractTable(70,{hdr:hdr70,yEnd:45,anchorCol:1});
  const lightDesc=toMd(textOutside(70,[{yTop:hdr70.y+30,yBottom:0}],{yMax:lightHead.y+5,yMin:hdr70.y}),{level:3});
  // p71
  const ls71=lines(p71); const heavyY=ls71.find(l=>lineText(l)==='Heavy Frame Models').y, arcY=ls71.find(l=>lineText(l)==='Arcane Frame Models').y;
  const h71=hdrs71.sort((a,b)=>b.y-a.y);
  const t2=extractTable(71,{hdr:h71[0],yEnd:arcY+15,anchorCol:1}), t3=extractTable(71,{hdr:h71[1],yEnd:45,anchorCol:1});
  const heavyDesc=toMd(textOutside(71,[],{yMax:heavyY+5,yMin:h71[0].y}),{level:3});
  const arcDesc=toMd(textOutside(71,[],{yMax:arcY+5,yMin:h71[1].y}),{level:3});
  const strip=t=>t.replace(/^(Light|Heavy|Arcane) Frame Models\s*/m,'').replace(/^Name Tier Trait Range Damage Burden Feature\s*/m,'').trim()+'\n';
  const wh=['Name','Tier','Trait','Range','Damage','Burden','Feature'];
  write('Equipment/Combat Wheelchair.md',`# Combat Wheelchair\n\n> Source: Daggerheart SRD 2.0, pp. 70–71 (by Mark Thompson)\n\nThe combat wheelchair is a ruleset designed to help you play a wheelchair user in Daggerheart. This section provides mechanics and narrative guidance for you to work from, but feel free to adapt the flavor text to best suit your character. Have fun with your character's wheelchair design, and make it as unique or tailored to them as you please.\n\n${main.replace(/^[\s\S]*?(?=## Action and Movement)/,'')}\n\n## Light Frame Models\n\n${strip(lightDesc)}\n${mdTable(wh,t1.rows)}\n## Heavy Frame Models\n\n${strip(heavyDesc)}\n${mdTable(wh,t2.rows)}\n## Arcane Frame Models\n\n${strip(arcDesc)}\n${mdTable(wh,t3.rows)}`);
}
