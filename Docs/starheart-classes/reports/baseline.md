# Baseline (Series 12, prompt 1)

Script: `node scripts/starheart-metrics.mjs [file] [--factor 1.1]`. Full per-class and per-subclass tables for the 13 core classes and the 10 draft classes: `metrics-raw.md` (same folder). Source counted: `source-v0.md`.

## How things are counted
- Words: rules text only. Feature names, stat lines, Spellcast Trait lines and headings are not counted. Core uses `rules` (not `short`).
- Feature: a named entry. Unnamed continuation paragraphs, sub-bullets, and the bold-led bullets inside a class-level feature (Twin Energies' Mote / Weapon / Aura) fold into the feature above.
- Class level = Hope feature + class features. Subclass ranks = foundation / specialization / mastery. A class is its class level plus its two subclasses.
- Not counted for core: stances, companion options, beastforms (class `supplements`). The draft has nothing equivalent.
- Judgment calls: Solarian's Supernova (Graviton) and (Photon) count as two features; Soldier Armor Storm's "Armor Master" is one feature.

## Result: the draft is lighter in words, heavier in features

| Measure (mean) | Core (13 classes) | Draft (10 classes) | Draft vs core |
|---|---|---|---|
| Class level words | 139 | 129 | -8% |
| Class level features | 2.9 | 3.1 | +7% |
| Whole class words | 458 | 420 | -8% |
| Whole class features | 11.7 | 14.1 | +21% |
| Subclass words (all ranks) | 159 | 146 | -9% |
| Subclass features (all ranks) | 4.4 | 5.5 | +25% |

- On words the draft is already below core. Cuts will mostly come from merging and removing features, not from trimming sentences.
- On features the draft already sits about 20-25% above core, which covers "slightly more complex" on this measure. Prompt 6 checks the other parts of complexity.
- Per-feature length is short (about 30 words against core's 39), so many small features add up.

## Over the proposed budget
Budget (core mean x 1.10, rounded):

| Level | Words | Features |
|---|---|---|
| Class level | 155 | 3 |
| One subclass, all ranks | 175 | 5 |
| Subclass foundation / specialization / mastery | 60 / 55 / 60 | 1.5 each |
| Whole class | 505 | about 14 |

Over on words:
- Class level: Mechanic 173, Biohacker 167.
- Whole class: Mechanic 527.
- Subclass: Gene Splicer 198, Coronal 191, Overwatch 184, Mechsuit 181.

Over on features (more than 5 in one subclass): Coronal 7; Spellweaver, Bondsmage, Sidereal, Armor Storm, Neutronic, Electronic, Mechsuit, Drone Controller, Physiologist, Infiltrator 6 each (11 of 20 subclasses). Whole class above 14: Witchwarper 16; Mystic, Solarian, Mechanic, Biohacker 15.

Thin spots (under the core minimum for that rank, 25 words foundation / 19 specialization / 27 mastery): Weapons Specialist mastery 8 words, Tinker mastery 13, Commander specialization 16, Electronic mastery 24. Leave alone unless prompt 6 says the subclass is short on content.

## Oddities in the draft (for prompts 2-3; nothing edited)
Structure:
- Aspis Sleeper "Hope Feature" has a heading and no text; "Force of Will" follows as its own paragraph.
- A feature named "XXX" (Spellweaver mastery).
- Soldier has no Stress in its stat line, and neither Soldier subclass (Tactician, Armor Storm) has a Spellcast trait line.
- Stat line format varies: "HP: 5; Stress 6" vs "HP 6", "Evasion 12" vs "Evasion: 11".
- Rank headings vary: "Foundation Features", "Foundation Feature", "Specialist Features" (Sidereal). Subclass headings: "Subclass: Commander" vs bare "Spellweaver". "Spellcast Trait" vs "Spellcasting Trait".
- Machine Whisperer is word-for-word identical in Mechanic and Technomancer.
- Core subclasses rank-by-rank have 1-2 features; the draft has 3 in Coronal specialization, Neutronic specialization, and Armor Storm foundation, and a two-feature mastery in Mystic (both), Tinker/Overwatch and others.

Spelling and wording spotted on first read (prompt 2-3 will do the full pass): "Spendor", "Grimore", "Constant Gardner", "warn and/or encourage an ally" (likely "ward"), "a (B)" in Crimson Rite, double periods ("15/40..", "Warp Casting" line), "Within your Field" capitalization, a missing period after Abrupt Appearance.

Possible consistency problems to check later: undefined or loose terms ("tag team", "Spellcast Reaction roll", "Primary Threat", "Sidekick" armor slots vs the Mechsuit rewrite), Hope-cost features priced differently (2, 3, 3, 3, 3), Evasion 10-13 vs core 9-12, Soldier HP 8 vs core max 7.

## Decisions for the owner
1. Which budget should prompts 4-5 aim at? (A) core mean x 1.10, as above (recommended); (B) core mean x 1.15, whole class about 525 words; (C) words only, no feature target.
2. Should cuts mainly merge or drop features (target 4-5 per subclass, 14 per class) rather than shorten wording? (A) Yes (recommended); (B) No, shorten wording only and keep every feature.

## Owner answers (2026-10-26)
1. Budget B: core mean x 1.15 (class level 160 words / 3.5 features; one subclass 185 words / 5 features; ranks 65 / 55 / 60 words; whole class 525 words).
2. Merge/drop features (A). Changes go to the owner as one batch per class before they are applied.
3. Variance allowance (2026-10-26): up to two classes may run to 630 words (the core maximum, Witch); every other class stays at or under 525. Owner picks the two when prompts 4-5 propose cuts. Today only Mechanic (527) is over 525.
