import {stream,find,findAll,toMd,write,title,clean,safe} from './lib.mjs';
import {md,SRC} from './build_a.mjs';
import {gmOut,secs,reg} from './build_c.mjs';
import {pageItems,lines,lineText,extractTable,mdTable,textOutside} from './tables.mjs';
const T=(a,b,level=2)=>toMd(stream.slice(a,b),{level});
const NL='\n';
// ---------- GM files
const GMDIR='GM Guidance';
for(const [name,{ia,ib,desc}] of Object.entries(gmOut)){
  let body;
  if(name==='GM Moves'||name==='GM Difficulty Benchmarks'){
    const ls88=lines(pageItems(88)); const first=ls88.find(l=>/^Incidental/.test(lineText(l)));
    const t=extractTable(88,{yTop:first.y+8,yEnd:400,anchorCol:0,bounds:[0,100,230],headers:['Scene Type','Examples','Fear to Spend']});
    const hy=ls88.find(l=>lineText(l)==='DIFFICULTY BENCHMARKS').y;
    const txt88=textOutside(88,[{yTop:first.y+10,yBottom:385,xMin:0,xMax:300},{yTop:280,yBottom:0}]);
    const isMove=l=>(l.c===0&&l.y>hy+3)||(l.c===1&&l.y>352);
    if(name==='GM Moves'){
      const pre=stream.slice(ia+1,find(/^The dramatic tension/,ia,88,88)).filter(l=>l.p<88);
      const mv=txt88.filter(isMove);
      const cut=mv.findIndex(l=>/consult the following table:$/.test(l.t));
      body=toMd([...pre,...mv.slice(0,cut+1)],{level:2})+NL+mdTable(t.headers,t.rows)+NL+toMd(mv.slice(cut+1),{level:2});
    } else {
      const bm=txt88.filter(l=>!isMove(l));
      body=toMd(bm.filter(l=>l.t!=='DIFFICULTY BENCHMARKS'),{level:2});
      for(const p of [88,89,90]){
        const ls=lines(pageItems(p));
        const traits=ls.filter(l=>l.items.length===1&&/^(AGILITY|STRENGTH|FINESSE|INSTINCT|PRESENCE|KNOWLEDGE)$/.test(l.items[0].s.trim()));
        traits.forEach((tl,k)=>{
          const hdr=ls.find(l=>l.y<tl.y&&l.y>tl.y-12&&/^roll/.test(lineText(l)));
          const next=traits[k+1];
          const tb=extractTable(p,{hdr,yEnd:next?next.y+4:(p===90?520:45),anchorCol:0});
          tb.headers=tb.headers.map((h,i)=>i===0?'Difficulty':title(h.toUpperCase()));
          body+=NL+'## '+title(tl.items[0].s.trim().toUpperCase())+' Rolls'+NL+NL+mdTable(tb.headers,tb.rows);
        });
      }
    }
  } else body=T(ia+1,ib);
  write(`${GMDIR}/${name}.md`,`# ${name}\n\n${SRC(ia,ib)}${body}`); reg(GMDIR,name,`${name}.md`,desc);
}
// ---------- adversaries & environments
const NAME=/^[A-Z][A-Z0-9 '’\-:.,&()]+$/;
function blocks(a,b){
  const idx=[]; for(let i=a;i<b-1;i++){ if(NAME.test(stream[i].t)&&/^Tier \d+ /.test(stream[i+1].t)&&stream[i].t!=='FEATURES') idx.push(i>a&&/:$/.test(stream[i-1].t)&&NAME.test(stream[i-1].t)?i-1:i); }
  return idx.map((s,k)=>({s,e:k+1<idx.length?idx[k+1]:b}));
}
const LABEL=/^(.{2,70}?) - (Passive|Action|Reaction):/;
function parse(bl,kind){
  let L=stream.slice(bl.s,bl.e);
  if(!/^Tier \d+ /.test(L[1].t)){ L=[{...L[1],t:L[0].t+' '+L[1].t},...L.slice(2)]; }
  const name=title(L[0].t.replace(/^-+\s*/,'')).replace(/-O’-/g,'-o’-').replace(/-The-/g,'-the-').replace(/Of The/g,'of the');
  const tt=L[1].t.match(/^Tier (\d+) (.+)$/); const tier=+tt[1], type=tt[2];
  const fi=L.findIndex((l,i)=>i>1&&l.t==='FEATURES');
  const head=L.slice(2,fi<0?L.length:fi), feats=fi<0?[]:L.slice(fi+1);
  const fields={desc:[],motives:[],diff:[],atk:[],exp:[],pot:[]}; let cur='desc';
  for(const l of head){
    if(/^Motives & Tactics:/.test(l.t)) cur='motives'; else if(/^Impulses:/.test(l.t)) cur='motives';
    else if(/^Difficulty:/.test(l.t)) cur='diff'; else if(/^ATK:/.test(l.t)) cur='atk'; else if(/^Experience:/.test(l.t)) cur='exp'; else if(/^Potential Adversaries:/.test(l.t)) cur='pot';
    fields[cur].push(l.t);
  }
  const J=a=>clean(a.join(' '));
  // features
  const items=[]; let c=null;
  for(const l of feats){
    if(LABEL.test(l.t)){ c={label:null,paras:[l.t],prev:l}; items.push(c); continue; }
    if(!c){ c={paras:[l.t],prev:l}; items.push(c); continue; }
    const short=c.prev.w<c.prev.maxW*0.86&&/[.!?:)”"’']$/.test(c.prev.t);
    if(/^[•◦]/.test(l.t)) c.paras.push(l.t);
    else if(short||l.gap>16||/^[•◦]/.test(c.paras.at(-1))&&false) c.paras.push(l.t);
    else c.paras[c.paras.length-1]+=' '+l.t;
    c.prev=l;
  }
  const featMd=items.map(it=>{
    const [first,...rest]=it.paras.map(clean);
    const m=first.match(LABEL); let out;
    out=m?`- **${m[1]} - ${m[2]}:**${first.slice(m[0].length)}`:`- ${first}`;
    for(const r of rest){ if(/^[•◦]/.test(r)) out+=`\n  - ${r.replace(/^[•◦]\s*/,'')}`; else if(/\?$/.test(r)) out+=`\n  - *${r}*`; else out+=`\n  ${r}`; }
    return out;
  }).join('\n');
  const md=[`# ${name}`,'',`**Tier ${tier} ${type}**`,'',J(fields.desc)?`*${J(fields.desc)}*`:'',''];
  const bold=s=>s.replace(/^(Motives & Tactics|Impulses|Difficulty|ATK|Experience|Potential Adversaries):/,'**$1:**').replace(/\| (Thresholds|HP|Stress):/g,'| **$1:**').replace(/^(\*\*ATK:\*\* [^|]+\| )([^:|]+):/,'$1**$2:**');
  for(const k of ['motives','diff','atk','exp','pot']) if(fields[k].length) md.push('- '+bold(J(fields[k])));
  md.push('','## Features','',featMd||'_None listed._','');
  const diff=J(fields.diff), dm=diff.match(/Difficulty: (\d+)/);
  const th=diff.match(/Thresholds: ([^|]+)/), hp=diff.match(/HP: (\d+)/), st=diff.match(/Stress: (\d+)/);
  return {name,tier,type,md:md.join('\n'),diff:dm?dm[1]:'',th:th?th[1].trim():'',hp:hp?hp[1]:'',st:st?st[1]:'',pages:[stream[bl.s].p,stream[bl.e-1].p],desc:J(fields.desc)};
}
export const adversaries=[], environments=[];
{
  const heads=[1,2,3,4].map(t=>find(new RegExp(`^TIER ${t} ADVERSARIES`),0,97,146));
  const end=find(/^USING ENVIRONMENTS$/,0,158,158);
  heads.forEach((h,k)=>{ const e=k+1<heads.length?heads[k+1]:end; for(const bl of blocks(h,e)){ const a=parse(bl,'adv'); adversaries.push(a); write(`Adversaries/Tier ${a.tier}/${safe(a.name)}.md`,a.md+`\n> Source: Daggerheart SRD 2.0, p. ${a.pages[0]}. Rules: [Adversaries.md](../Adversaries.md)\n`); } });
  const eh=[1,2,3,4].map(t=>find(new RegExp(`^TIER ${t} ENVIRONMENTS`),0,160,180));
  const eend=find(/^ADDITIONAL GM$/,0,183,183);
  eh.forEach((h,k)=>{ const e=k+1<eh.length?eh[k+1]:eend; for(const bl of blocks(h,e)){ const a=parse(bl,'env'); environments.push(a); write(`Environments/Tier ${a.tier}/${safe(a.name)}.md`,a.md+`\n> Source: Daggerheart SRD 2.0, p. ${a.pages[0]}. Rules: [Environments.md](../Environments.md)\n`); } });
}
// rules files
{
  const a=find('ADVERSARIES AND',0,93,93), b=find('ADVERSARY STAT BLOCK BENCHMARKS',a,95,95);
  const pgs=[95];
  const hdr=lines(pageItems(95)).find(l=>/^Adversary Statistic/.test(lineText(l)));
  const bt=extractTable(95,{hdr,yEnd:600,anchorCol:0,bounds:[0,190,285,380,470],headers:['Adversary Statistic','Tier 1','Tier 2','Tier 3','Tier 4']});
  const rows=adversaries.reduce((m,x)=>{(m[x.tier]??=0);m[x.tier]++;return m;},{});
  write('Adversaries/Adversaries.md',`# Adversaries\n\n${SRC(a,b)}${toMd(stream.slice(a+2,b),{level:2})}\n## Adversary Stat Block Benchmarks\n\n${mdTable(bt.headers,bt.rows)}\n## Adversary Files\n\n- [Adversary Index.md](Adversary Index.md) — every adversary with tier, type, Difficulty, thresholds, HP and Stress\n${[1,2,3,4].map(t=>`- Tier ${t}: \`Adversaries/Tier ${t}/<Name>.md\` (${rows[t]||0} adversaries)`).join('\n')}\n\nSee also: [Environments.md](../Environments/Environments.md), [GM Rolling Dice.md](../GM Guidance/GM Rolling Dice.md).\n`);
  const idx=[1,2,3,4].map(t=>`## Tier ${t}\n\n${mdTable(['Adversary','Type','Difficulty','Thresholds','HP','Stress'],adversaries.filter(x=>x.tier===t).map(x=>[`[${x.name}](Tier ${t}/${safe(x.name)}.md)`,x.type,x.diff,x.th,x.hp,x.st]))}`).join('\n');
  write('Adversaries/Adversary Index.md',`# Adversary Index\n\nAll adversaries in this SRD. Rules and stat block format: [Adversaries.md](Adversaries.md).\n\n${idx}`);
  const ea=find('USING ENVIRONMENTS',0,158,158), eb=find(/^TIER 1 ENVIRONMENTS/,ea,160,160);
  const eidx=[1,2,3,4].map(t=>`## Tier ${t}\n\n${mdTable(['Environment','Type','Difficulty'],environments.filter(x=>x.tier===t).map(x=>[`[${x.name}](Tier ${t}/${safe(x.name)}.md)`,x.type,x.diff]))}`).join('\n');
  write('Environments/Environments.md',`# Environments\n\n${SRC(ea,eb)}${toMd(stream.slice(ea+1,eb),{level:2})}\n## Environment Index\n\n${eidx}`);
}
