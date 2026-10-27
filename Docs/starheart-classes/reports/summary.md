# Series 12 summary: Starheart classes

Final text: `Docs/starheart-classes/v4-final.md` (design only; nothing is in a pack, wizard or sheet). Version chain: `source-v0.md` (owner draft, untouched) -> `v1-clean.md` -> `v2-reduced.md` -> `v3-tuned.md` -> `v4-final.md`. Tools: `scripts/starheart-metrics.mjs`, `scripts/starheart-complexity.mjs`, `scripts/starheart-power.mjs`.

## Final numbers against core

Budget (core mean x 1.15): 525 words and about 14 features per class. Complexity is the keyword proxy (core mean 16.2, max 24). Power is the model's total damage per round against a core class (ceiling 1.5x, flag 1.3x), with the Trait-as-Proficiency sensitivity in brackets.

| Class | Words | Features | Complexity (x core mean) | Power T1 / T2 (x core) |
|---|---|---|---|---|
| Envoy | 377 | 11 | 17 (1.0) | **1.40 / 1.48** [1.51 / 1.47] |
| Mystic | 366 | 12 | 25 (1.5) | 0.78 / 0.99 (Bondsmage 0.73 / 0.79) |
| Operative | 340 | 13 | 14 (0.9) | 1.10 / **1.34** (Technologist 0.73 / 0.79) |
| Solarian | 468 | 13 | 30 (1.8) | 1.02 / **1.36** (Coronal; Sidereal 1.02 / 0.92) |
| Soldier | 402 | 13 | 20 (1.2) | 0.73 / 0.94 |
| Witchwarper | 458 | 15 | 20 (1.2) | 0.91 / **1.34** (Electronic; Neutronic 0.91 / 1.17) |
| Mechanic | 513 | 13 | 31 (1.9) | 0.73 / 1.09 |
| Technomancer | 401 | 13 | 20 (1.2) | 1.28 / **1.47** (Overwatch; Tinker 0.73 / 0.79) |
| Biohacker | 504 | 15 | 22 (1.4) | 1.00 / 1.26 (Physiologist 1.09 / 1.26) |
| Aspis Sleeper | 412 | 14 | 17 (1.0) | 0.78 / 1.24 (Executioner 1.13 / 1.24) |
| **Mean** | **424** (core 458) | **13.2** (core 11.7) | **21.6** (1.3x core) | |

- Every class is at or under 525 words; the 630-word variance allowance was never needed.
- Features sit about 13% above core, inside the "slightly more complex" aim.
- No subclass reaches 1.5x on the standard model; the highest is Envoy at 1.48 and Overwatch at 1.47.

## What was decided (2026-10-26)
- Grammar: ten classes normalized to core terms, ids, headings; part A and B owner batches all answered. Mechanic and Technomancer Machine Whisperer kept as is (TB1 declined: improvise).
- Words: merges MY1, MY2, OP1, SO1, SD1, WW1, WW2, MC1-MC3, TC2, AS1. Eldritch Forge into Arcane Font; Guiding Light into Full Hearts; both Supernovas merged; Imposition into Armor Master; Warp Casting into Quantum Field; Targeting Systems into Armor Up.
- Complexity: Ejection, Magical Refraction, Patch Up removed; Configurable resistances merged. Crimson Rite simplified to +1 Proficiency on the attack.
- Power: only PT6 taken (Physiologist "marks 1 Hit Point" costs 2 Serum Tokens). PT1-PT5, PT7 declined.
- Theme: TA6 and TA7 (Soldier Dread Abilities: non-targeted Dread spells work as written but count as abilities; Strength stands in for the Spellcast Trait and Spellcast Rolls on Dread cards; Dread described as fear, suppression and pressure), TB2 (Witchwarper describes summoned creatures as entities from other dimensions, necrotic energy as entropic), TB3 (Technomancer: on Codex cards "Book" and "Grimoire" become "Program"). TA1-TA5 and TB1, TB4 declined or no change.

## Unresolved items
- Power: six subclasses over the 1.3x flag on the model (Envoy 1.40 / 1.48, Operative Weapons Specialist T2 1.34, Coronal T2 1.36, Electronic T2 1.34, Overwatch T2 1.47 with T1 1.28). With Trait-as-Proficiency weapons Envoy T1 reaches 1.51 and Overwatch T2 1.53. Tuning candidates sit in `power-B.md` (PT1-PT5).
- The model is a heuristic: typical core damage feature (+1d6 / +2d6), 0.7 uptime, 1 Hit Point valued at 0.55 of a hit, never checked against real play.
- Take Down (Aspis Sleeper Executioner, Tier 2) ends an adversary on a Severe hit; not in the numbers.
- Complexity: the proxy still reads Solarian 1.8x and Mechanic 1.9x core because it counts keywords; removing branches did not register. Needs a table playtest.
- Trait-as-Proficiency weapons: the Hammer (d12+3, Strength) makes a Tier 1 baseline 69% stronger; a weapon-balance question, separate from the classes.
- Mystic Bond (up to 10 creatures), Aspis Sleeper Buried Protocols (max +7), Gadget and Ordnance references and the "Studied Adversary" name (Claude's pick) have not been reviewed in play.
- Cards: Dread (6 flagged), Midnight (5) and Codex (15) vocabulary remain on non-Operative, non-Technomancer classes by owner choice; Sage is unchanged for Mechanic and Technomancer apart from Machine Whisperer.

## Out of scope, now on the long-term list
Source pack (classes, subclasses, tokens and pools as trackers), wizard and level-up support, sheet printing, Tier 2+ class card text, any class equipment (`long-term-to-do.md`).

## Owner next
Decide when to archive Series 12 (`Docs/archive/`) and when to commit. Nothing is committed.
