import {stream,find,toMd,write,title} from './lib.mjs';
import {md,SRC} from './build_a.mjs';
export const secs={}; // registry of generated files for index: dir -> [[name,file,desc]]
const reg=(dir,name,file,desc)=>{(secs[dir]??=[]).push([name,file,desc]);};
// generic: file from anchor a to anchor b (indices)
function sec(rel,ttl,a,b,{desc,pre='',post='',level=2}={}){
  write(rel,`# ${ttl}\n\n${SRC(a,b)}${pre}${toMdT(a,b,level)}${post}`);
}
const toMdT=(a,b,level)=>toMd(stream.slice(a,b),{level});
const F=(text,p)=>find(text,0,p,p);
// ---------------- Core Mechanics
const cmA=(t,p)=>find(t,0,p,p);
const CM=[
 ['Flow of the Game','FLOW OF THE GAME',46,'MAKING MOVES &',47,'Core gameplay loop, spotlight, player principles and best practices.'],
 ['Making Moves and Taking Action','MAKING MOVES &',47,'SPECIAL ROLLS',48,'Action rolls (traits, difficulty, dice and modifiers), failing forward, GM moves and adversary actions.'],
 ['Special Rolls','SPECIAL ROLLS',48,'ADVANTAGE & DISADVANTAGE',49,'Trait rolls, Spellcast rolls, reaction rolls, group action rolls, tag team rolls.'],
 ['Advantage and Disadvantage','ADVANTAGE & DISADVANTAGE',49,'HOPE & FEAR',49,'How advantage and disadvantage work.'],
 ['Hope and Fear','HOPE & FEAR',49,'COMBAT',50,'Hope, Fear, and the Duality Dice outcomes.'],
 ['Combat','COMBAT',50,'MAPS, RANGE,',51,'Evasion, HP and damage, thresholds, Stress, attacking, damage types, resistance and immunity.'],
 ['Maps Range and Movement','MAPS, RANGE,',51,'CONDITIONS',52,'Range bands, movement, area of effect, line of sight and cover.'],
 ['Conditions','CONDITIONS',52,'DOWNTIME',52,'Standard conditions (Hidden, Restrained, Vulnerable) and temporary tags.'],
 ['Downtime','DOWNTIME',52,'DEATH',53,'Rests, downtime moves and downtime consequences.'],
 ['Death','DEATH',53,'ADDITIONAL RULES',53,'Death moves and dying.'],
 ['Additional Rules','ADDITIONAL RULES',53,'LEVELING UP',53,'Rounding, rerolls, incoming damage, stacking effects, ongoing spells, spending resources.'],
 ['Leveling Up','LEVELING UP',53,'MULTICLASSING',54,'Level-up steps: tier achievements, advancements, damage thresholds, domain cards.'],
 ['Multiclassing','MULTICLASSING',54,'EQUIPMENT',55,'Rules for taking a second class.'],
];
for(const [name,a,pa,b,pb,desc] of CM){
  const ia=find(a,0,pa,pa), ib=find(b,ia,pb,pb); if(ia<0||ib<0) throw new Error(name+' '+ia+' '+ib);
  write(`Core Mechanics/${name}.md`,`# ${name}\n\n${SRC(ia,ib)}${toMdT(ia+1,ib,2).replace(/^## Step (\w+)\n\n## (.+)$/gm,'## Step $1: $2')}`); reg('Core Mechanics',name,`${name}.md`,desc);
}
// ---------------- GM
const GMs=[
 ['Running an Adventure','RUNNING AN ADVENTURE',85,'GM PRINCIPLES',85,'Introduction to running the game and GM guidance.'],
 ['GM Principles','GM PRINCIPLES',85,'GM PRACTICES',85,'The principles a GM follows.'],
 ['GM Practices','GM PRACTICES',85,'PITFALLS TO AVOID',86,'Practical techniques for running the table.'],
 ['GM Pitfalls','PITFALLS TO AVOID',86,'CORE GM MECHANICS',86,'Common mistakes to avoid.'],
 ['GM Rolling Dice','CORE GM MECHANICS',86,'MAKING MOVES',86,'Adversary attack rolls and guidance on action rolls.'],
 ['GM Moves','MAKING MOVES',86,'DIFFICULTY BENCHMARKS',88,'When and how to make GM moves, soft and hard moves, spending Fear.'],
 ['GM Difficulty Benchmarks','DIFFICULTY BENCHMARKS',88,'GIVING ADVANTAGE AND',90,'Difficulty benchmarks by trait (tables).'],
 ['GM Advantage and Adversary Rolls','GIVING ADVANTAGE AND',90,'COUNTDOWNS',91,'Giving advantage/disadvantage, adversary action rolls and attacks.'],
 ['Countdowns','COUNTDOWNS',91,'GIVING OUT GOLD,',91,'Standard, dynamic and advanced countdowns.'],
 ['Giving Out Gold Equipment and Loot','GIVING OUT GOLD,',91,'RUNNING GM NPCS',91,'Guidance on rewards.'],
 ['Running GM NPCs','RUNNING GM NPCS',91,'OPTIONAL GM MECHANICS',92,'NPC feature examples.'],
 ['Optional GM Mechanics','OPTIONAL GM MECHANICS',92,'ADVERSARIES AND',93,'Fate rolls, falling and collision damage, underwater, conflict between PCs.'],
];
export const gmOut={};
for(const [name,a,pa,b,pb,desc] of GMs){
  let ia=find(a,0,pa,pa); if(ia<0) throw new Error(name+' a');
  let ib=find(b,ia+1,pb,pb); if(ib<0){ ib=find(b.split(' ')[0],ia+1,pb,pb); } if(ib<0) throw new Error(name+' b');
  gmOut[name]={ia,ib,desc};
}
export {reg};
