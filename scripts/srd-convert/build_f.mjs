import {stream,find,toMd,write} from './lib.mjs';
import './build_e.mjs';
import {pageItems,lines,lineText,textOutside,mdTable} from './tables.mjs';
const D='Supplemental Campaign Mechanics';
const NL='\n';
const it=(p,f)=>pageItems(p).find(f);
// ------------------------- Feasts (pp. 192-194): tables re-typed from the page images, prose from the text layer
{
  const feastsY=lines(pageItems(192)).find(l=>lineText(l)==='Feasts').y;
  const b192=[{yTop:172,yBottom:92,xMin:300}];
  const p193=pageItems(193), p194=pageItems(194);
  const envTop=p193.find(i=>i.x<300&&/^hope die result/i.test(i.s.trim())).y, envBot=p193.find(i=>i.x<300&&/^11–12$/.test(i.s.trim())).y;
  const ingTop=p193.find(i=>i.x>300&&/^result$/i.test(i.s.trim())).y, ingBot=p193.find(i=>i.x>300&&/^Eggs$/.test(i.s.trim())).y;
  const b193=[{yTop:envTop+5,yBottom:envBot-8,xMax:300},{yTop:ingTop+5,yBottom:ingBot-8,xMin:300}];
  const res=p194.filter(i=>i.x<300&&/^result$/i.test(i.s.trim())).sort((a,b)=>b.y-a.y);
  const secY=p194.find(i=>i.x<300&&/^Secretion$/.test(i.s.trim())).y, rawY=p194.find(i=>i.x<300&&/deadly when consumed raw/.test(i.s)).y;
  const nameY=p194.find(i=>i.x>300&&/^NAME$/i.test(i.s.trim())).y, restY=p194.find(i=>/^RESTAURANTS$/i.test(i.s.trim())).y;
  const b194=[{yTop:res[0].y+5,yBottom:secY-8,xMax:300},{yTop:res[1].y+5,yBottom:rawY-8,xMax:300},{yTop:nameY+8,yBottom:restY+16,xMin:300}];
  const feasts=find('Feasts',0,192,192);
  const lines192=textOutside(192,b192,{yMax:376}).filter(l=>l.t!=='Feasts');
  const ls=[...lines192,...textOutside(193,b193),...textOutside(194,b194)];
  let md=toMd(ls,{level:2});
  const T={
   'Hit Points to Ingredients Guide':mdTable(['Maximum Hit Points','Number of Ingredients'],[['1–4','1'],['5–7','2'],['8–10','3'],['12+','4']]),
   'Environmental Ingredients Guide':mdTable(['Hope Die Result','Flavor Profile'],[['1–2','Sweet (1)'],['3–4','Salty (1)'],['5–6','Bitter (1)'],['7–8','Sour (1)'],['9–10','Savory (1)'],['11–12','Weird (1)']]),
   'What kind of ingredient is it?':mdTable(['Result','Animal','Plant/Fungi'],[['Feet','Flower'],['Powder','Roots'],['Limb','Stems'],['Belly','Leaves'],['Fat','Bulbs'],['Eggs','Nuts'],['Marrow','Seeds'],['Tongue','Bark'],['Brain','Berries'],['Ribs','Fruit'],['Organ','Sap'],['Flesh','Pollen'],['Stones','Fungi'],['Eyes','Nectar'],['Jelly','Pods'],['Horn','Herbs'],['Meat','Algae'],['Scales','Moss'],['Wings','Grain'],['Secretion','Rind']].map((r,k)=>[String(k+1),...r])),
   'What’s interesting about it?':mdTable(['Result','Detail'],['It’s particularly tender.','It’s still wriggling.','It looks like something it isn’t','It has a pungent smell.','It’s brightly colored.','It’s completely translucent.','It’s an odd size or shape.','It has unique markings.','It recoils from the light.','It withers in the dark.','It smells unbelievably good.','It has an unexpected texture.','It’s encased in something.','It’s filled with something.','It’s emitting a colorful gas.','It comes apart in layers.','It must be prepared in a strange way.','It’s leathery or cartilaginous.','It’s brittle.','It’s deadly when consumed raw.'].map((d,k)=>[String(k+1),d])),
   'Example Special Ingredients':mdTable(['Name','Flavor Profile','Feature'],[
     ['Diregazelle Skull Marrow','Sweet (1), Salty (1), Sour (1)','**Built for Speed:** +1 bonus to Agility until your next rest'],
     ['Holy Cow’s Milk','Weird (1)','**Last Drop:** When you prepare a dish with this ingredient and there’s only one remaining die in the flavor pool, roll it and add the result to the dish’s Meal Rating.'],
     ['Ghost Scorpion Venom','Sour (1), Savory (1)','**Spicy:** If any matching sets from a dish prepared with this ingredient are worth 8 or more points, you can’t clear Stress from consuming the resulting dish.'],
     ['Deathflower','Bitter (2)','**Risky:** If you finish preparing a dish with this ingredient and have no matching sets of flavor dice, you clear all Hit Points and Stress and gain 3 Hope. Otherwise, the dish’s Meal Rating is 0 and you must make a death move.']]),
  };
  for(const [k,v] of Object.entries(T)){
    const at=md.indexOf(k); if(at<0) throw new Error('marker missing: '+k);
    md=md.slice(0,at).trimEnd()+'\n\n### '+k+'\n\n'+v+'\n'+md.slice(at+k.length).replace(/^\s+/,'');
  }
  write(`${D}/Feasts.md`,`# Feasts\n\n> Source: Daggerheart SRD 2.0, pp. 192–194. Tables were re-typed from the page images (the text layer scrambles them); see [Conversion Notes.md](../Conversion Notes.md).\n\nYou can use the following mechanics for campaigns in which the PCs harvest ingredients throughout play and use them to cook meals during downtime.\n\n${md.replace(/^You can use the following mechanics for campaigns in which the\s*PCs harvest ingredients[^\n]*\n\n?/m,'')}`);
}
// ------------------------- Tech-Based Campaigns (pp. 195-196)
{
  const a=find('TECH-BASED',0,195,195), b=find('WESTERN CAMPAIGNS',a,197,197);
  const p195=stream.slice(a,b).filter(l=>l.p===195);
  const p196=pageItems(196);
  const scrapY=p196.find(i=>/^Scrap Table$/.test(i.s.trim())).y, relicsY=p196.find(i=>/^RELICS$/i.test(i.s.trim())).y;
  const top=textOutside(196,[],{yMin:scrapY+4}), mid=textOutside(196,[],{yMax:scrapY-4,yMin:relicsY+12}), bot=textOutside(196,[],{yMax:relicsY+12});
  const midLines=mid.filter(l=>!/^(Scrap Table|Parts Reward Table)$/.test(l.t)&&/^(The table below|Use the following table)/.test(l.t));
  let md=toMd([...p195.slice(1),...top],{level:2});
  const scrap=mdTable(['Scrap Type (die)','Results'],[
    ['Shards (d6)','1: Gear · 2: Coil · 3: Wire · 4: Trigger · 5: Lens · 6: Crystal · 7–10: n/a'],
    ['Metals (d8)','1–2: Aluminum · 3–4: Copper · 5: Cobalt · 6: Silver · 7: Platinum · 8: Gold · 9–10: n/a'],
    ['Components (d10)','1–2: Fuse · 3–5: Circuit · 6–7: Disc · 8: Relay · 9: Capacitor · 10: Battery']]);
  const parts=mdTable(['Adversaries','Easy Fight','Standard Fight','Difficult Fight','Very Difficult Fight'],[
    ['Mostly non-tech-based','2 Shards','2 Shards, 1 Metal','2 Shards, 1 Metal, 1 Component','2 Shard, 2 Metals, 1 Component'],
    ['Mostly tech-based','2 Shards, 1 Metal','2 Shards, 2 Metals, 1 Component','3 Shards, 2 Metals, 1 Component','3 Shards, 3 Metals, 2 Components'],
    ['All tech-based','2 Shards, 1 Metal, 1 Component','3 Shards, 2 Metals, 2 Components','3 Shards, 3 Metals, 2 Components','4 Shards, 3 Metals, 3 Components']]);
  const midMd=`### Scrap Table\n\nThe table below lists generic outcomes you can replace as needed to suit your campaign.\n\n${scrap}\n### Parts Reward Table\n\nUse the following table as general guidance for Scrap rewards after encounters:\n\n${parts}\n`;
  const botMd=toMd(bot,{level:2});
  write(`${D}/Tech-Based Campaigns.md`,`# Tech-Based Campaigns\n\n> Source: Daggerheart SRD 2.0, pp. 195–196. The Scrap and Parts Reward tables were re-typed from the page image (see [Conversion Notes.md](../Conversion Notes.md)).\n\n${md}\n${midMd}\n${botMd}`);
}
