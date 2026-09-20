import {stream,find,findAll,toMd,title,write,safe,clean} from './lib.mjs';
import {cards} from './b_cards.mjs';
import {classes} from './b_classes.mjs';
import {domInfo,domNames,md,SRC,S,pg} from './build_a.mjs';
const cl=n=>`${n} Class`;
// ---------- classes
const classDomains={};
for(const c of classes){
  const r=c.raw; const iDom=r.findIndex(l=>/^DOMAINS –/.test(l.t)); const iHope=r.findIndex(l=>/HOPE FEATURE$/.test(l.t));
  const desc=toMd(r.slice(0,iDom));
  const statLines=r.slice(iDom,iHope).map(l=>l.t);
  const itemsIdx=statLines.findIndex(l=>/^CLASS ITEMS –/.test(l));
  const items=clean(statLines.slice(itemsIdx).join(' ').replace(/^CLASS ITEMS – /,''));
  const rest=toMd(r.slice(iHope),{level:2});
  const doms=c.domains.split(' & ');
  classDomains[c.name]=doms;
  c.file=`Classes/${cl(c.name)}.md`;
  const domLinks=doms.map(d=>`[${d}](../Domains/${d} Domain.md)`).join(' & ');
  write(c.file,`# ${c.name}\n\n${SRC(c.first,c.last+1)}${desc.trim()}\n\n## Quick Facts\n\n- **Domains:** ${domLinks}\n- **Starting Evasion:** ${c.evasion}\n- **Starting Hit Points:** ${c.hp}\n- **Class Items:** ${items}\n- **Subclasses:** ${c.subs?c.subs.join(', '):'see below'}\n\n${rest}`);
}
{
  const rows=classes.map(c=>`| [${c.name}](${cl(c.name)}.md) | ${c.domains} | ${c.evasion} | ${c.hp} | ${c.subs?c.subs.join(', '):''} |`).join('\n');
  const a=find('CLASSES',0,8,8), b=find('ASSASSIN',a,9,9);
  const sc=find('SUBCLASSES',a,8,9);
  write('Classes/Classes.md',`# Classes\n\n${SRC(a,b)}Index of the 13 classes in this SRD. Each class file holds the class description, quick facts, Hope feature, class feature(s), both subclasses (Foundation, Specialization and Mastery features), background questions, and connection questions.\n\n${md(a+1,sc).trim()}\n\n${md(sc,b).trim()}\n\n## Class Index\n\n| Class | Domains | Starting Evasion | Starting HP | Subclasses |\n|---|---|---|---|---|\n${rows}\n\nSee also: [Domains.md](../Domains/Domains.md), [Character Creation.md](../Character Creation.md) (Step 1), [Multiclassing.md](../Core Mechanics/Multiclassing.md).\n`);
}
// ---------- domains
{
  const byDomain={}; for(const c of classes) for(const d of classDomains[c.name]) (byDomain[d]??=[]).push(c.name);
  for(const d of domNames){
    const cs=cards[d];
    const rows=cs.map(c=>`| ${c.name} | ${c.level} | ${c.type} | ${c.recall} |`).join('\n');
    const body=cs.map(c=>`## ${c.name}\n\n**Level ${c.level} ${c.domain} ${c.type}** · Recall Cost: ${c.recall}\n\n${c.text.replace(/^#+ /gm,'#### ').trim()}\n`).join('\n');
    write(`Domains/${d} Domain.md`,`# ${d} Domain\n\n${domInfo[d].desc}\n\n**Classes with access:** ${byDomain[d].map(n=>`[${n}](../Classes/${n} Class.md)`).join(', ')}\n\n**Card rules:** [Domain Cards.md](Domain Cards.md) (level, recall cost, loadout and vault).\n\n> Source: Daggerheart SRD 2.0, Domains pp. 7–8; cards from the Appendix, pp. 206–224. ${cs.length} cards.\n\n## Card List\n\n| Card | Level | Type | Recall Cost |\n|---|---|---|---|\n${rows}\n\n${body}`);
  }
  const rows=domNames.map(d=>`| [${d}](${d} Domain.md) | ${byDomain[d].join(', ')} | ${cards[d].length} |`).join('\n');
  const crows=classes.map(c=>`- ${c.name}: ${classDomains[c.name].map(d=>`[${d}](${d} Domain.md)`).join(' & ')}`).join('\n');
  const a=find('DOMAINS',0,7,7), b=find('Class Domains',0,8,8);
  write('Domains/Domains.md',`# Domains\n\n${SRC(a,b)}There are ten domains, each a collection of cards granting features or special abilities around a theme. (The Daggerheart Core Set includes only Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, and Valor; this SRD also includes Dread.)\n\nPCs acquire two 1st-level domain cards at character creation and one more domain card at or below their level each time they level up. Each class grants access to two domains.\n\n## Domain Index\n\n| Domain | Classes with access | Cards |\n|---|---|---|\n${rows}\n\n## Domains by Class\n\n${crows}\n\n> Note: the SRD's class-domain list spells "Assassin" as "Assassion"; corrected here.\n\n## Related\n\n- [Domain Cards.md](Domain Cards.md) — card anatomy, loadout & vault, usage limits\n- [Character Creation.md](../Character Creation.md) — Step 8 (choose two level 1 cards)\n- [Leveling Up.md](../Core Mechanics/Leveling Up.md) — gaining domain cards\n`);
}
// ---------- ancestries / communities / transformations
export const ancNames=['Aetheris','Clank','Drakona','Dwarf','Elemental Kin','Elf','Faerie','Faun','Firbolg','Fungril','Galapa','Giant','Gnome','Goblin','Halfling','Human','Infernis','Katari','Orc','Ribbet','Simiah','Mixed Ancestry'];
export const commNames=['Duneborne','Freeborne','Frostborne','Hearthborne','Highborne','Loreborne','Orderborne','Reborne','Ridgeborne','Seaborne','Slyborne','Underborne','Wanderborne','Warborne','Wildborne'];
export const transNames=['Demigod','Ghost','Reanimated','Shapeshifter','Vampire','Werewolf'];
export const structures={};
function locate(names,pMin,pMax){ let cur=0; return names.map(n=>{const i=find(n.toUpperCase(),cur,pMin,pMax); if(i<0)throw new Error(n); cur=i+1; return i;}); }
{
  const idxs=locate(ancNames,32,38);
  const end=find('COMMUNITIES',idxs[idxs.length-1],38,38);
  const aIntro=find('ANCESTRIES',0,32,32);
  const kinNames=['Earthkin','Emberkin','Skykin','Tidekin'];
  const kin=kinNames.map(n=>find(n.toUpperCase(),0,33,34));
  const list=[];
  ancNames.forEach((n,k)=>{ const s=idxs[k], e=k+1<idxs.length?idxs[k+1]:end;
    if(n==='Elemental Kin'){
      write('Ancestries/Elemental Kin.md',`# Elemental Kin\n\n${SRC(s,kin[0])}Elemental Kin is a family of four ancestries, each with its own file: ${kinNames.map(x=>`[${x}](${x}.md)`).join(', ')}.\n\n${md(s+1,kin[0]).trim()}\n`);
      list.push(['Elemental Kin (overview)','Elemental Kin.md']);
      kin.forEach((ks,j)=>{ const ke=j+1<kin.length?kin[j+1]:e; const nm=kinNames[j]; write(`Ancestries/${nm}.md`,`# ${nm}\n\n${SRC(ks,ke)}Part of [Elemental Kin](Elemental Kin.md).\n\n${md(ks+1,ke).trim()}\n`); list.push([nm,`${nm}.md`]); });
    } else { write(`Ancestries/${n}.md`,`# ${n}\n\n${SRC(s,e)}${md(s+1,e).trim()}\n`); list.push([n,`${n}.md`]); }
  });
  structures.anc=list;
  write('Ancestries/Ancestries.md',`# Ancestries\n\n${SRC(aIntro,idxs[0])}${md(aIntro+1,idxs[0]).trim()}\n\n## Ancestry Index\n\n${list.map(([n,f])=>`- [${n}](${f})`).join('\n')}\n\nSee also: [Character Creation.md](../Character Creation.md) (Step 2), [Communities.md](../Communities/Communities.md).\n`);
}
{
  const idxs=locate(commNames,38,42);
  const end=find('TRANSFORMATIONS',idxs[idxs.length-1],42,42);
  commNames.forEach((n,k)=>{ const e=k+1<idxs.length?idxs[k+1]:end; write(`Communities/${n}.md`,`# ${n}\n\n${SRC(idxs[k],e)}${md(idxs[k]+1,e).trim()}\n`); });
  const a=find('COMMUNITIES',0,38,38);
  structures.comm=commNames;
  write('Communities/Communities.md',`# Communities\n\n${SRC(a,idxs[0])}${md(a+1,idxs[0]).trim()}\n\n## Community Index\n\n${commNames.map(n=>`- [${n}](${n}.md)`).join('\n')}\n\nSee also: [Character Creation.md](../Character Creation.md) (Step 2), [Ancestries.md](../Ancestries/Ancestries.md).\n`);
}
{
  const idxs=locate(transNames,43,45);
  const end=find('CORE MECHANICS',idxs[idxs.length-1],46,46);
  transNames.forEach((n,k)=>{ const e=k+1<idxs.length?idxs[k+1]:end; write(`Transformations/${n}.md`,`# ${n}\n\n${SRC(idxs[k],e)}${md(idxs[k]+1,e).trim()}\n`); });
  const a=find('TRANSFORMATIONS',0,42,42);
  structures.trans=transNames;
  write('Transformations/Transformations.md',`# Transformations\n\n${SRC(a,idxs[0])}${md(a+1,idxs[0]).trim()}\n\n## Transformation Index\n\n${transNames.map(n=>`- [${n}](${n}.md)`).join('\n')}\n`);
}
structures.classes=classes;
