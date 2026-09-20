import {stream,find,toMd,write,title} from './lib.mjs';
import {md,SRC} from './build_a.mjs';
import {reg,secs} from './build_c.mjs';
const T=(a,b,level=2)=>toMd(stream.slice(a,b),{level});
const at=(t,p,from=0)=>{const i=find(t,from,p,p); if(i<0) throw new Error('anchor '+t+' p'+p); return i;};
const out=(dir,name,a,b,desc,{skip=1,pre='',post=''}={})=>{ write(`${dir}/${name}.md`,`# ${name}\n\n${SRC(a,b)}${pre}${T(a+skip,b)}${post}`); reg(dir,name,`${name}.md`,desc); };
// Additional GM guidance
{ const a=at('ADDITIONAL GM',183), b=at('CAMPAIGN FRAMES',184);
  out('GM Guidance','Additional GM Guidance',a,b,'Story beats, preparing combat encounters, session rewards, crafting scenes, phased battles, using downtime.',{skip:2}); }
// Campaign frames
const cf=at('CAMPAIGN FRAMES',184), ww=at('The Witherwild',184);
out('Campaign Frames','Campaign Frames',cf,ww,'What a campaign frame is and what each contains.');
const W=[
 ['Witherwild Campaign Frame',ww,()=>at('COMMUNITIES',185),'Pitch, tone and feel, themes, touchstones, overview.'],
 ['Witherwild Communities',null,()=>at('ANCESTRIES',186),'How communities fit the Witherwild.'],
 ['Witherwild Ancestries',null,()=>at('CLASSES',187),'How ancestries fit the Witherwild.'],
 ['Witherwild Classes',null,()=>at('PLAYER PRINCIPLES',187),'How classes fit the Witherwild.'],
 ['Witherwild Principles',null,()=>at('DISTINCTIONS',188),'Player and GM principles.'],
 ['Witherwild Distinctions',null,()=>at('THE INCITING INCIDENT',189),'Setting distinctions.'],
 ['Witherwild Inciting Incident',null,()=>at('CAMPAIGN MECHANICS',189),'The event that launches the campaign.'],
 ['Witherwild Campaign Mechanics',null,()=>at('SESSION ZERO QUESTIONS',189),'Corruption from the Witherwild.'],
 ['Witherwild Session Zero Questions',null,()=>at('SUPPLEMENTAL',190),'Session zero questions.'],
];
let start=ww;
for(const [name,_,endF,desc] of W){ const end=endF(); out('Campaign Frames',name,start,end,desc,{skip:name==='Witherwild Campaign Frame'?0:1}); start=end; }
// Supplemental
const SUP=[
 ['Supplemental Campaign Mechanics',at('SUPPLEMENTAL',190),at('FACTION TRACKING',190),'Index of optional mechanics.',2],
 ['Faction Tracking',at('FACTION TRACKING',190),at('EVERYDAY HERO STARTING EQUIPMENT',191),'Faction cards, relationships, objective countdowns.',1],
 ['Everyday Hero Starting Equipment',at('EVERYDAY HERO STARTING EQUIPMENT',191),at('Feasts',192),'Mundane starting equipment for everyday-hero campaigns.',1],
 ['Feasts',at('Feasts',192),at('Grimdark',195),'Ingredients, cooking meals, restaurants.',1],
 ['Grimdark Campaigns',at('Grimdark',195),at('TECH-BASED',195),'Shadow-touched adversaries, sacred bonfires and torches.',2],
 ['Tech-Based Campaigns',at('TECH-BASED',195),at('WESTERN CAMPAIGNS',197),'Tech damage, iconic weapons, crafting and trading scrap.',2],
 ['Western Campaigns',at('WESTERN CAMPAIGNS',197),at('COLOSSAL',198),'Weapons and loot for western campaigns.',1],
 ['Colossal Adversaries',at('COLOSSAL',198),at('FLOATING MAGIC',199),'Segmented colossus adversaries and how to run them.',2],
 ['Floating Magic School Campaigns',at('FLOATING MAGIC',199),at('FAIRY TALE',200),'Flight and less lethal campaigns.',2],
 ['Fairy Tale Campaigns',at('FAIRY TALE',200),at('MONSTER HUNTING CAMPAIGNS',201),'Curses, transforming adversaries, building villains collaboratively.',2],
 ['Monster Hunting Campaigns',at('MONSTER HUNTING CAMPAIGNS',201),at('HEX CRAWL',203),'Equipment, transformations, the hunt, making a monster.',1],
 ['Hex Crawl Campaigns',at('HEX CRAWL',203),at('APPENDIX',206),'Hex maps, travel, resources, encounters, doom tracks.',2],
];
for(const [name,a,b,desc,skip] of SUP) out('Supplemental Campaign Mechanics',name,a,b,desc,{skip});
