import fs from 'fs'; import path from 'path';
export const OUT='C:/Users/kenmc/Documents/Daggerheart Character Sheet Printable/Daggerheart SRD Files';
const pages=JSON.parse(fs.readFileSync('pages.json','utf8'));
// page 102 override
{
  const [a,b]=fs.readFileSync('p102.txt','utf8').split('=====COL1\n');
  const pg=pages[101];
  pg.cols=[a,b].map(txt=>txt.split('\n').map((t,i,arr)=>({t,blank:false,x0:0,x1:1000,y:0})).reduce((acc,l)=>{ if(l.t===''){ acc.pendingBlank=true; return acc;} if(acc.pendingBlank){l.blank=true;acc.pendingBlank=false;} acc.push(l); return acc;},Object.assign([],{pendingBlank:false})));
  pg.override=true;
}
const FOOT=/^(Daggerheart SRD( \d+)?|\d+ Daggerheart SRD)$/;
export const stream=[];
for(const pg of pages){
  pg.cols.forEach((col,c)=>{
    const ls=col.filter(l=>!FOOT.test(l.t.trim()));
    const ws=ls.filter(l=>l.t.length>30).map(l=>l.x1-l.x0).filter(w=>w<400).sort((a,b)=>a-b); const maxW=ws.length?ws[Math.floor(ws.length*0.9)]:300;
    let prev=null;
    ls.forEach(l=>{
      const gap=(prev&&!pg.override)?prev.y-l.y:0;
      stream.push({p:pg.p,c,t:l.t.replace(/\s+/g,' ').trim(),w:l.x1-l.x0,maxW,gap,blank:!!l.blank,pg:pg.override});
      prev=l;
    });
  });
}
export function find(re,from=0,pMin=0,pMax=999){
  for(let i=from;i<stream.length;i++){const l=stream[i]; if(l.p<pMin||l.p>pMax)continue; if(re instanceof RegExp?re.test(l.t):l.t===re) return i;}
  return -1;
}
export function findAll(re,pMin=0,pMax=999){const r=[];stream.forEach((l,i)=>{if(l.p>=pMin&&l.p<=pMax&&(re instanceof RegExp?re.test(l.t):l.t===re))r.push(i)});return r;}
const SMALL=new Set(['and','of','the','to','in','for','a','an','or','on','with','at','by','as']);
const KEEP={GM:'GM',HP:'HP',PC:'PC',PCS:'PCs',NPC:'NPC',NPCS:'NPCs',SRD:'SRD',ATK:'ATK',D:'d'};
export function title(t){
  t=t.replace(/ - /g,'-').replace(/\s+/g,' ');
  return t.split(' ').map((w,i)=>{ const lw=w.toLowerCase(); if(KEEP[w])return KEEP[w]; if(i>0&&SMALL.has(lw))return lw; return w.split(/(-|\/|’|')/).map(x=>(x.length>1||/^[A-Za-z]$/.test(x))&&x.toLowerCase()!=='s'?x[0].toUpperCase()+x.slice(1).toLowerCase():x.toLowerCase()).join('');}).join(' ');
}
export const isHeading=t=>/^[A-Z][A-Z0-9 ,&'’:.\-–\/()!?]*$/.test(t)&&(t.match(/[A-Z]/g)||[]).length>=3&&!/^(PC|GM|HP)$/.test(t);
export function clean(t){
  return t.replace(/([A-Za-z])(fi|fl|ffi|ffl) (?=[a-z])/g,'$1$2').replace(/(^|\s)(fi|fl|ffi|ffl) (?=[a-z])/g,'$1$2')
   .replace(/ +([.,;:!?)])/g,'$1').replace(/\( +/g,'(').replace(/ ’/g,'’').replace(/\s+/g,' ').trim();
}
const BUL=/^[•◦→]\s*/;
const NEWPARA=/^(DOMAINS –|STARTING EVASION –|STARTING HIT POINTS –|CLASS ITEMS –|Level \d+ |Recall Cost:)/;
export function toMd(lines,{level=2,headingMap}={}){
  const out=[]; let para=null; let prev=null; let hsp='#'.repeat(level);
  const flush=()=>{ if(para){ out.push((para.bullet?'- ':'')+clean(para.text)+(para.bullet?'':'')); para=null; } };
  let lastWasBullet=false;
  for(const l of lines){
    let t=l.t; if(!t)continue;
    if(isHeading(t)){
      flush();
      const last=out[out.length-1];
      if(last&&last.startsWith('\u0001')&&prev&&(/( AND| &| TO| THE| OF| IN|,| DIRECT)$/.test(last.slice(1))||(prev.w>prev.maxW*0.6&&prev.c===l.c&&prev.p===l.p))){ out[out.length-1]=last+' '+t; }
      else out.push('\u0001'+t);
      prev=l; continue;
    }
    if(BUL.test(t)){ flush(); para={bullet:true,text:t.replace(BUL,'')}; }
    else {
      const newp=!para||l.gap>16||l.blank||NEWPARA.test(t)|| (prev&&prev.w<prev.maxW*0.86&&/[.!?:)”"’']$/.test(prev.t)&&!prev.pg) || (prev&&prev.pg&&false);
      if(newp){flush(); para={text:t};}
      else { para.text+=(para.text.endsWith('-')&&!/ -$/.test(para.text)?'':' ')+t; }
    }
    prev=l;
  }
  flush();
  // headings & spacing
  const res=[]; 
  for(const o of out){ if(o.startsWith('\u0001')){ res.push('','#'.repeat(level)+' '+(headingMap?.[o.slice(1)]??title(o.slice(1))),''); } else if(o.startsWith('- ')) res.push(o); else res.push('',o,''); }
  return res.join('\n').replace(/\n{3,}/g,'\n\n').replace(/\n\n(- )/g,(m,a)=>'\n'+a).replace(/\n{2,}$/,'\n').trim()+'\n';
}
const rmFiles=d=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) rmFiles(p); else fs.rmSync(p,{force:true}); } }; if(fs.existsSync(OUT)) rmFiles(OUT); const written=[];
export function write(rel,content){
  const f=path.join(OUT,rel); content=content.replace(/\]\(([^)]*\.md[^)]*)\)/g,(m,p)=>']('+p.replace(/ /g,'%20')+')'); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,content,'utf8'); written.push(rel);
}
export function slice(a,b){return stream.slice(a,b);}
export function safe(n){return n.replace(/[\/:*?"<>|]/g,'').trim();}
export {written};
