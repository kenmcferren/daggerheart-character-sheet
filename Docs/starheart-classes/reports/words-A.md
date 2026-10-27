# Word-count reduction, part A (Series 12, prompt 4)

Classes: Envoy, Mystic, Operative, Solarian, Soldier. Source: `v1-clean.md` (prompt 2-3 answers all applied). Counts from `node scripts/starheart-metrics.mjs Docs/starheart-classes/v1-clean.md` (script now also reads `###` subclass headings; same counting rule as the baseline). `v2-reduced.md` is NOT written yet: per the owner rule, every change below waits for your answers and is applied at the start of prompt 5, which creates `v2-reduced.md` with these five classes.

## Finding: words are not the problem
Budget (core x 1.15): class level 160 words / 3.5 features; subclass 185 / 5; ranks 65 / 55 / 60; whole class 525 words, about 14 features.

| Class | Words (budget 525) | Features (aim 14) | Over budget |
|---|---|---|---|
| Envoy | 377 | 11 | none |
| Mystic | 405 | 15 | features +1; Spellweaver 6, Bondsmage 6 |
| Operative | 356 | 13 | none |
| Solarian | 504 | 15 | features +1; Coronal 7, Sidereal 6 |
| Soldier | 363 | 14 | Armor Storm 6 (foundation has 3) |

No class is over the word budget, so pure word trimming buys little. The proposals below are feature merges (same mechanics, fewer named features) plus two small example cuts. Anything that would change a mechanic is listed at the end, not proposed.

## Before and after (if every proposal below is accepted; word figures approximate, the script recounts after applying)

| Class | Before words / features | After words / features | Subclass features before -> after |
|---|---|---|---|
| Envoy | 377 / 11 | 377 / 11 | 4, 4 -> 4, 4 |
| Mystic | 405 / 15 | ~396 / 13 | Spellweaver 6 -> 5, Bondsmage 6 -> 5 |
| Operative | 356 / 13 | ~339 / 13 | 5, 5 -> 5, 5 |
| Solarian | 504 / 15 | ~492 / 14 | Coronal 7 -> 6, Sidereal 6 |
| Soldier | 363 / 14 | ~359 / 13 (option A) | Armor Storm 6 -> 5 |

## Batch 12: Envoy
- No proposals. All subclass and class figures are inside the budget. Thin spot, no action: Commander specialization is 16 words (core minimum for that rank is 19). Prompt 6 decides whether it needs content.

## Batch 13: Mystic
- MY1. Spellweaver foundation: fold Eldritch Forge into Arcane Font (one idea: earn VP, spend VP). Before: two features. After: "**Arcane Font:** When you cast a spell, gain a VP. Spend 3 VP before you cast a spell to gain one of the following effects on a success: (A) increase a die size listed in the spell by 1, (B) increase the range by 1 range band, or (C) cast it as though standing at the location of another creature in your Mystic Bond. (A d20 becomes d20+6.)" (A) merge (recommended) (B) keep two features.
- MY2. Bondsmage foundation: fold Guiding Light into Full Hearts (both change the VP economy). After: "**Full Hearts:** You refill your VP each rest instead of each long rest. When you would gain a Hope, you may gain a VP instead. If your action roll was with Hope, clearing an ally's Stress or Hit Point costs 1 VP instead of 2." (A) merge (recommended) (B) keep two features.

## Batch 14: Operative
- OP1. Cut the example and a parenthesis (no mechanic). Tech Savvy after: "Gain an additional domain card at level 1. On all domain cards, replace the words "Spell" and "Magic" with "Tech", and "Grimoire" with "Kit". If you swap out a Tech or Kit card, reduce the Stress cost to do so by 1." Called Shot after: "... Your spotlight ends after the shot." (drops "(preventing movement)", already implied by "if you have not moved"). (A) cut both (recommended; about 17 words) (B) keep.
- Note, no action: Weapons Specialist mastery is one 8-word feature (Baba Yaga); core minimum is 27. Prompt 6.

## Batch 15: Solarian
- SO1. Coronal mastery: merge Supernova (Graviton) and Supernova (Photon) into one feature, since they share cost and roll. After: "**Supernova:** Spend 2 Hope. Make a Spellcast Roll. Graviton: Targets within Far range you succeed against are pulled into Very Close range of you, mark 1 Hit Point and 2 Stress, and are temporarily Restrained. Photon: Targets within Very Close range you succeed against are pushed to Far range, mark 2 Hit Points and 1 Stress, and are temporarily Vulnerable." (A) merge (recommended; about 12 words) (B) keep two.
- SO2. Coronal would still have 6 features (target 5) and Sidereal 6. Both are two-per-rank with distinct effects, so no merge changes nothing mechanical. If you want them at 5, the candidates are in the "not proposed" list. (A) leave at 6 for now, decide after the power pass (recommended) (B) tell me which feature to drop.

## Batch 16: Soldier
- SD1. Armor Storm has three foundation features (core maximum is 2). (A) fold Imposition (Presence roll -> Strength roll) into Armor Master as its last sentence: foundation 3 -> 2, subclass 6 -> 5, no mechanic change (recommended) (B) drop Quick Stitch (group Armor Slot sharing) instead, a mechanics change (C) leave at 6.
- Note, no action: Suppression and Dread Abilities are tight; Tactician is at 5.

## Not proposed (would change a mechanic; for prompts 6-8)
- Mystic: Bondsmage Constant Gardener and Empathic Bond are both small VP boosts; either could go if Bondsmage reads too dense.
- Solarian: Coronal Ejection overlaps Mote and Radiant Aura; Sidereal Warpage and Slingshot overlap Graviton/Photon pairs. Candidates if features must drop.
- Soldier: Quick Stitch (support) and Aegis Protocol (extra Armor Slot mark) overlap with Armor Master.
- Operative: Precision 1 and Precision 2 both raise Called Shot damage; Precision 2 could absorb Precision 1.

## Reply format
"MY1. A, MY2. A, OP1. A, SO1. A, SO2. A, SD1. A" or "all A". Answers are applied at the start of prompt 5, then part B (Witchwarper, Mechanic, Technomancer, Biohacker, Aspis Sleeper) gets the same pass.
