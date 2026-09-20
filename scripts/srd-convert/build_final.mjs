import fs from 'fs'; import path from 'path';
import {stream,find,toMd,write,OUT} from './lib.mjs';
import {secs} from './build_c.mjs';
import {adversaries,environments} from './build_gm.mjs';
import {structures,ancNames,commNames} from './build_b.mjs';
const lst=(dir)=>(secs[dir]||[]).map(([n,f,d])=>`- [${n}](${f}) — ${d}`).join('\n');
// About
{ const a=0, b=find('CONTENTS',0,2,2);
  write('About This SRD.md',`# About This SRD\n\nSource document: **Daggerheart SRD 2.0** ("System Reference Document"), 224 pages, saved in the project root as \`Daggerheart SRD.pdf\`. These Markdown files are a split of that PDF into small, cross-linked pieces. Wording is the SRD's; only layout was changed (columns re-flowed, tables rebuilt as Markdown tables).\n\n${toMd(stream.slice(a,b),{level:2}).replace(/^DAGGERHEART\s*/i,'').trim()}\n\n## Known conversion notes\n\nSee [Conversion Notes.md](Conversion Notes.md).\n`);
}
// folder indexes
write('Core Mechanics/Core Mechanics.md',`# Core Mechanics\n\n> Source: Daggerheart SRD 2.0, pp. 46–54\n\n${lst('Core Mechanics')}\n\nRelated: [Equipment.md](../Equipment/Equipment.md) (weapons, armor, items), [GM Guidance.md](../GM Guidance/GM Guidance.md).\n`);
write('GM Guidance/GM Guidance.md',`# GM Guidance (Running an Adventure)\n\n> Source: Daggerheart SRD 2.0, pp. 85–92 and 183–184\n\n${lst('GM Guidance')}\n\nAdversaries and environments: [Adversaries.md](../Adversaries/Adversaries.md), [Environments.md](../Environments/Environments.md).\n`);
write('Campaign Frames/Campaign Frames Index.md',`# Campaign Frames — Index\n\n${lst('Campaign Frames')}\n`);
{ const p='Supplemental Campaign Mechanics/Supplemental Campaign Mechanics.md'; const cur=fs.readFileSync(path.join(OUT,p),'utf8');
  fs.writeFileSync(path.join(OUT,p),cur.trimEnd()+`\n\n## Files\n\n${lst('Supplemental Campaign Mechanics').split('\n').filter(l=>!/^- \[Supplemental Campaign Mechanics\]/.test(l)).join('\n')}\n`,'utf8'); }
// master index
const cls=structures.classes;
write('SRD Index.md',`# Daggerheart SRD — Index

Start here. This folder is the Daggerheart SRD 2.0 split into small Markdown files. Each folder has its own index file; this file points to all of them.

- Full source: \`Daggerheart SRD.pdf\` (project root). Provenance, license and conversion notes: [About This SRD.md](About This SRD.md), [Conversion Notes.md](Conversion Notes.md).

## Character creation (start here for building a PC)

| Step | What | Files |
|---|---|---|
| — | Overview of all 9 steps, with the files each step needs | [Character Creation.md](Character Creation.md) |
| 1 | Class and subclass | [Classes.md](Classes/Classes.md) → e.g. [Bard Class.md](Classes/Bard Class.md) |
| 2 | Heritage (ancestry + community) | [Ancestries.md](Ancestries/Ancestries.md), [Communities.md](Communities/Communities.md) |
| 3 | Traits | [Traits.md](Traits.md) |
| 4 | Evasion, HP, Stress, Hope | class file; [Combat.md](Core Mechanics/Combat.md); [Hope and Fear.md](Core Mechanics/Hope and Fear.md) |
| 5 | Starting equipment | [Equipment.md](Equipment/Equipment.md), [Primary Weapons Tier 1.md](Equipment/Primary Weapons Tier 1.md), [Secondary Weapons Tier 1.md](Equipment/Secondary Weapons Tier 1.md), [Armor Tier 1.md](Equipment/Armor Tier 1.md), [Consumables.md](Equipment/Consumables.md) |
| 6 | Background | class file (Background Questions) |
| 7 | Experiences | [Experiences.md](Experiences.md) |
| 8 | Domain cards | [Domains.md](Domains/Domains.md) → e.g. [Valor Domain.md](Domains/Valor Domain.md); rules in [Domain Cards.md](Domains/Domain Cards.md) |
| 9 | Connections | class file (Connections) |

Level-up and multiclassing: [Leveling Up.md](Core Mechanics/Leveling Up.md), [Multiclassing.md](Core Mechanics/Multiclassing.md).

## Player-facing content

| Topic | Index file | Contents |
|---|---|---|
| Introduction | [Introduction.md](Introduction.md) | What the game is, golden rule, basics |
| Classes | [Classes.md](Classes/Classes.md) | 13 classes, each with both subclasses |
| Domains | [Domains.md](Domains/Domains.md) | 10 domains × 21 domain cards (210 cards) |
| Ancestries | [Ancestries.md](Ancestries/Ancestries.md) | ${structures.anc.length} ancestry files (Mixed Ancestry rules included) |
| Communities | [Communities.md](Communities/Communities.md) | ${commNames.length} communities |
| Transformations | [Transformations.md](Transformations/Transformations.md) | 6 transformations |
| Core mechanics | [Core Mechanics.md](Core Mechanics/Core Mechanics.md) | Action rolls, combat, conditions, downtime, death, leveling, multiclassing |
| Equipment | [Equipment.md](Equipment/Equipment.md) | Weapons (primary and secondary, tiers 1–4), armor, combat wheelchair, items, consumables, gold |

## GM-facing content

| Topic | Index file | Contents |
|---|---|---|
| GM guidance | [GM Guidance.md](GM Guidance/GM Guidance.md) | Principles, practices, moves, Fear, difficulty benchmarks, countdowns |
| Adversaries | [Adversaries.md](Adversaries/Adversaries.md), [Adversary Index.md](Adversaries/Adversary Index.md) | Stat block rules and ${adversaries.length} adversaries, tiers 1–4 |
| Environments | [Environments.md](Environments/Environments.md) | Environment rules and ${environments.length} environments, tiers 1–4 |
| Campaign frames | [Campaign Frames.md](Campaign Frames/Campaign Frames.md), [Campaign Frames Index.md](Campaign Frames/Campaign Frames Index.md) | The Witherwild Campaign Frame |
| Supplemental mechanics | [Supplemental Campaign Mechanics.md](Supplemental Campaign Mechanics/Supplemental Campaign Mechanics.md) | Factions, feasts, grimdark, tech, western, colossal, magic school, fairy tale, monster hunting, hex crawl |

## Which file do I need?

- **"What does class X get?"** → \`Classes/<Class> Class.md\`
- **"What does domain card Y do?"** → find its domain in [Domains.md](Domains/Domains.md), open \`Domains/<Domain> Domain.md\`
- **"What weapons/armor exist at tier N?"** → \`Equipment/Primary Weapons Tier N.md\`, \`Secondary Weapons Tier N.md\`, \`Armor Tier N.md\`
- **"How does a rule work?"** → [Core Mechanics.md](Core Mechanics/Core Mechanics.md)
- **"Stat block for monster Z"** → [Adversary Index.md](Adversaries/Adversary Index.md)
`);
