const c=require('../packs/core/srd-core.json').content;
for (const id of process.argv.slice(2)) {
  const k=c.classes.find(x=>x.id===id);
  console.log('=== CLASS',id); console.log('HOPE',JSON.stringify(k.hopeFeature));
  k.features.forEach((f,i)=>console.log('F',i,JSON.stringify(f)));
  c.subclasses.filter(s=>s.class===id).forEach(s=>{console.log('SUB',s.id);s.features.forEach((f,i)=>console.log(' ',i,f.level,JSON.stringify({name:f.name,rules:f.rules})))});
  if(k.stances)k.stances.forEach(s=>console.log('STANCE',s.id,s.tier,JSON.stringify(s.rules)));
  if(k.companion)k.companion.levelUpOptions.forEach(s=>console.log('COMP',s.id,JSON.stringify(s.rules)));
}
