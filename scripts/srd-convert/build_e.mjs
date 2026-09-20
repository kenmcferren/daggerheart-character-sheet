import {stream,find,toMd,write,title} from './lib.mjs';
import {SRC} from './build_a.mjs';
import './build_d.mjs';
import {pageItems,lines,lineText,textOutside} from './tables.mjs';
import {flowPage} from './flow.mjs';
const D='Supplemental Campaign Mechanics';
const tc=s=>s.replace(/^(#+) ([A-Z][A-Z &,]+)$/gm,(m,h,t)=>h+' '+title(t));
const dropUntil=(s,re)=>{const i=s.search(re); return i>=0?s.slice(i):s;};
{
  const feastsY=lines(pageItems(192)).find(l=>lineText(l)==='Feasts').y;
  const a=find('EVERYDAY HERO STARTING EQUIPMENT',0,191,191);
  const p191=dropUntil(flowPage(191,{}),/### Primary Physical Weapons/);
  const p192=flowPage(192,{yMin:feastsY+10});
  write(`${D}/Everyday Hero Starting Equipment.md`,`# Everyday Hero Starting Equipment\n\n> Source: Daggerheart SRD 2.0, pp. 191–192\n\n${stream[a+1].t}\n\n${tc(p191)}\n${tc(p192)}`);
}
{ const p=dropUntil(flowPage(197,{}),/### Primary Weapons/);
  write(`${D}/Western Campaigns.md`,`# Western Campaigns\n\n> Source: Daggerheart SRD 2.0, p. 197\n\nYou can use the following mechanics in a western-themed campaign.\n\n## Weapons & Loot\n\n${tc(p)}`); }
{
  const a=find('MONSTER HUNTING CAMPAIGNS',0,201,201), b=find('HEX CRAWL',a,203,203);
  const p202=stream.findIndex(l=>l.p===202);
  const p201=dropUntil(flowPage(201,{}),/### Primary Weapons/);
  write(`${D}/Monster Hunting Campaigns.md`,`# Monster Hunting Campaigns\n\n> Source: Daggerheart SRD 2.0, pp. 201–202\n\nYou can use the following mechanics for monster hunting campaigns.\n\n## Monster Hunting Equipment\n\nYou can make the following weapons and items available to your players.\n\n${tc(p201)}\n${toMd(stream.slice(p202,b),{level:2})}`);
}
