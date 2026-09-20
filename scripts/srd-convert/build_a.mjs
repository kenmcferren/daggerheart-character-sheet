import fs from 'fs';
import {stream,find,findAll,toMd,title,write,safe,clean,OUT} from './lib.mjs';
import {cards} from './b_cards.mjs';
import {classes} from './b_classes.mjs';
const S=(a,b)=>stream.slice(a,b);
const md=(a,b,o)=>toMd(S(a,b),o);
const pg=(a,b)=>{const x=stream[a].p,y=stream[b-1].p;return x===y?`p. ${x}`:`pp. ${x}–${y}`;};
const SRC=(a,b)=>`> Source: Daggerheart SRD 2.0, ${pg(a,b)}\n\n`;
const idx={}; // for master index
const L=(name,path,desc)=>`- [${name}](${path}) — ${desc}`;
// ---------------- Introduction
{ const a=find('INTRODUCTION',0,3,3), b=find('CHARACTER CREATION',0,4,4);
  write('Introduction.md',`# Introduction\n\n${SRC(a,b)}${md(a+1,b)}`); }
// ---------------- Character creation
const ccA=find('CHARACTER CREATION',0,4,4), ccB=find('CORE MATERIALS',0,7,7);
const stepNames={1:'Choose a Class and Subclass',2:'Choose Your Heritage',3:'Assign Character Traits',4:'Record Additional Character Information',5:'Choose Your Starting Equipment',6:'Create Your Background',7:'Create Your Experiences',8:'Choose Domain Cards',9:'Create Your Connections'};
const stepFiles={
 1:'[Classes.md](Classes/Classes.md) → the chosen class file in `Classes/` (e.g. [Bard Class.md](Classes/Bard Class.md)). Subclass features are inside the class file.',
 2:'[Ancestries.md](Ancestries/Ancestries.md) → one ancestry file in `Ancestries/`; [Communities.md](Communities/Communities.md) → one community file in `Communities/`.',
 3:'[Traits.md](Traits.md)',
 4:'The chosen class file (starting Evasion and Hit Points). [Core Mechanics/Combat.md](Core Mechanics/Combat.md) explains Evasion, HP, Stress; [Core Mechanics/Hope and Fear.md](Core Mechanics/Hope and Fear.md) explains Hope.',
 5:'[Equipment.md](Equipment/Equipment.md), then Tier 1 files: [Primary Weapons Tier 1.md](Equipment/Primary Weapons Tier 1.md), [Secondary Weapons Tier 1.md](Equipment/Secondary Weapons Tier 1.md), [Armor Tier 1.md](Equipment/Armor Tier 1.md), and starting potions in [Consumables.md](Equipment/Consumables.md).',
 6:'The chosen class file (Background Questions section).',
 7:'[Experiences.md](Experiences.md)',
 8:'[Domains.md](Domains/Domains.md) → the class\'s two domain files (e.g. [Valor Domain.md](Domains/Valor Domain.md)). Rules for loadout and vault: [Domain Cards.md](Domains/Domain Cards.md).',
 9:'The chosen class file (Connections section).'};
{
  let body=md(ccA+1,ccB);
  // split at "## Step N"
  const parts=body.split(/^## Step (\d)\n/m); // [pre, n, text, n, text...]
  let out=`# Character Creation\n\n${SRC(ccA,ccB)}${parts[0].trim()}\n`;
  const stepText={};
  for(let i=1;i<parts.length;i+=2){ const n=+parts[i]; let t=parts[i+1].replace(/^\n?[^\n]+\n/,'').trim(); // drop restated title line
    stepText[n]=t; }
  for(const n of Object.keys(stepNames)){
    out+=`\n## Step ${n}: ${stepNames[n]}\n\n**Files needed:** ${stepFiles[n]}\n\n`;
    if(n==3) out+='Assign the modifiers +2, +1, +1, +0, +0, −1 to the six traits in any order. Trait descriptions are in Traits.md.\n';
    else if(n==7) out+='Your PC gets two Experiences at character creation, each with a +2 modifier. Rules and example Experiences are in Experiences.md.\n';
    else out+=stepText[n]+'\n';
  }
  write('Character Creation.md',out);
  // Traits + Experiences
  const s3=body.split(/^## Step 3\n/m)[1].split(/^## Step 4\n/m)[0].replace(/^\n?[^\n]+\n/,'').trim();
  write('Traits.md',`# Traits\n\n${SRC(ccA,ccB)}Used in [Character Creation.md](Character Creation.md), Step 3.\n\n${s3}\n`);
  const s7=body.split(/^## Step 7\n/m)[1].split(/^## Step 8\n/m)[0].replace(/^\n?[^\n]+\n/,'').trim();
  write('Experiences.md',`# Experiences\n\n${SRC(ccA,ccB)}Used in [Character Creation.md](Character Creation.md), Step 7. Experiences are also used in play: see [Making Moves and Taking Action.md](Core Mechanics/Making Moves and Taking Action.md).\n\n${s7.replace(/^## Example Experiences/m,'## Example Experiences')}\n`);
}
// ---------------- Domains
const domA=find('DOMAINS',0,7,7), domEnd=find('Class Domains',0,8,8);
const domNames=['Arcana','Blade','Bone','Codex','Dread','Grace','Midnight','Sage','Splendor','Valor'];
const domInfo={};
{ for(const d of domNames){ const i=find(d.toUpperCase(),0,7,7); let j=i+1; while(j<i+15&&!(/classes?.?$/.test(stream[j].t)&&stream.slice(i+1,j+1).some(l=>/accessed by/.test(l.t)))) j++; j++; const txt=clean(stream.slice(i+1,j).map(l=>l.t).join(' ')); const m=txt.match(/can be accessed by the (.+?) classes?.?$/i);
    domInfo[d]={desc:txt.replace(/\s*The \w+ domain can be accessed by.*$/,''),classes:m?m[1].split(/,\s*(?:and\s*)?|\s+and\s+/).map(x=>x.replace(/ (and )?classes?$/,'').trim()).filter(Boolean):[]}; }
}
{
  const a=find('DOMAIN CARDS',0,8,8);
  const classDomList=stream.slice(find('Class Domains',0,8,8),find('DOMAIN CARDS',0,8,8)).map(l=>l.t).join(' ');
  write('Domains/Domain Cards.md',`# Domain Cards\n\n${SRC(a,find('CLASSES',a,8,8))}${md(a+1,find('CLASSES',a,8,8))}`);
}

export {idx,S,md,pg,SRC,domInfo,domNames};
