import fs from 'fs'; import path from 'path';
const OUT='C:/Users/kenmc/Documents/Daggerheart Character Sheet Printable/Daggerheart SRD Files';
const files=[]; (function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); e.isDirectory()?walk(p):files.push(p);} })(OUT);
const foot=[],odd=[];
for(const f of files){ const t=fs.readFileSync(f,'utf8').split('\n').filter(l=>!l.startsWith('> Source')).join('\n'); const rel=path.relative(OUT,f);
  if(/Daggerheart SRD( \d|\b.*\bSRD \d+$)/m.test(t)&&/^(Daggerheart SRD \d+|\d+ Daggerheart SRD)$/m.test(t)) foot.push(rel);
  if(/\*\*\*|\$\{|undefined|\[object/.test(t)) odd.push(rel); }
console.log('footer-lines',foot,'odd',odd);
