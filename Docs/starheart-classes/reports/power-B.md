# Power results, all ten classes and tuning proposals (Series 12, prompt 8)

## Applied first
- PW1 A, PW2 A: the standard model stays primary (assumptions A1-A4 in `power-model.md`), Trait-as-Proficiency is a sensitivity run, tuning happens here for all ten classes.
- Crimson Rite in `v3-tuned.md` now reads: "Spend 2 VP after a successful Spellcast Roll to increase the Proficiency of this attack by 1." The second-target option is gone, so the model dropped it too: Mystic Spellweaver Tier 2 falls from 1.34x to **0.99x**. Weaver still draws from Arcane Font and Crimson Rite.
- Model changes this prompt: added Witchwarper, Mechanic, Technomancer, Biohacker, Aspis Sleeper; valued "mark 1 Hit Point" at 0.55 of an average hit (new assumption A5: one Hit Point is a bit over half an average hit at both Tiers, since a hit usually marks 1-2); applied the same value retroactively to Solarian Coronal's Expulse (Photon half the switches, 60% fail), which was left qualitative before. Coronal Tier 1 1.02 -> 1.16, Tier 2 1.20 -> 1.36.

## All ten classes, x core damage per round (total including ally buffs)

| Class | Subclass | T1 now | T1 tuned | T2 now | T2 tuned | Trait-as-Prof T1 / T2 (tuned) |
|---|---|---|---|---|---|---|
| Envoy | Commander, Spymaster | 1.40 | 1.14 | 1.48 | 1.22 | 1.25 / 1.21 |
| Mystic | Spellweaver | 0.78 | 0.78 | 0.99 | 0.99 | 0.46 / 1.04 |
| Mystic | Bondsmage | 0.73 | 0.73 | 0.79 | 0.79 | 0.43 / 0.83 |
| Operative | Weapons Specialist | 1.10 | 1.10 | 1.34 | 1.25 | 1.26 / 1.26 |
| Operative | Technologist | 0.73 | 0.73 | 0.79 | 0.79 | 0.84 / 0.78 |
| Solarian | Sidereal | 1.02 | 1.02 | 0.92 | 0.92 | 0.60 / 0.97 |
| Solarian | Coronal | 1.16 | 1.16 | 1.36 | 1.30 | 0.76 / 1.36 |
| Soldier | Tactician | 0.73 | 0.73 | 0.90 | 0.90 | 0.84 / 0.89 |
| Soldier | Armor Storm | 0.73 | 0.73 | 0.94 | 0.94 | 0.84 / 0.94 |
| Witchwarper | Neutronic | 0.91 | 0.91 | 1.17 | 1.17 | 0.54 / 1.23 |
| Witchwarper | Electronic | 1.14 | 1.14 | 1.34 | 1.29 | 0.80 / 1.34 |
| Mechanic | Mechsuit | 0.73 | 0.73 | 0.79 | 0.79 | 0.84 / 0.78 |
| Mechanic | Drone Controller | 0.73 | 0.73 | 1.09 | 1.09 | 0.84 / 1.07 |
| Technomancer | Tinker | 0.73 | 0.73 | 0.79 | 0.79 | 0.43 / 0.83 |
| Technomancer | Overwatch | 1.28 | 1.08 | 1.47 | 1.19 | 0.76 / 1.24 |
| Biohacker | Gene Splicer | 1.00 | 1.00 | 1.16 | 1.16 | 1.11 / 1.15 |
| Biohacker | Physiologist | 1.18 | 1.09 | 1.42 | 1.26 | 1.21 / 1.26 |
| Aspis Sleeper | Infiltrator | 0.78 | 0.78 | 0.93 | 0.93 | 0.89 / 0.92 |
| Aspis Sleeper | Executioner | 1.13 | 1.13 | 1.24 | 1.24 | 1.24 / 1.24 |

"Tuned" is the result of the PT1-PT6 proposals below, not yet applied to the text. Data: `power-data.csv` (now), `power-data-tuned.csv`, `power-data-traitprof.csv`, `power-data-tuned-traitprof.csv`.

## Outliers
Over 1.3 now (6): Envoy 1.40 / 1.48, Operative Weapons Specialist T2 1.34, Solarian Coronal T2 1.36, Witchwarper Electronic T2 1.34, Technomancer Overwatch 1.28 / 1.47, Biohacker Physiologist T2 1.42. None reaches 1.5; Overwatch (1.53) and Envoy (1.51) reach it only in the Trait-as-Proficiency sensitivity run.

Far below 1.0 by this measure (0.73-0.79): Mystic Bondsmage, Operative Technologist, Technomancer Tinker, Mechanic Mechsuit, and at Tier 1 Soldier and Mechanic Drone Controller. Their output is non-damage by design (healing, gadgets, Sidekick armor, control). No numeric change proposed; if you want any of them nearer 1.0 on damage, say which.

## Notable non-damage power (not converted to damage)
- Burst: Aspis Sleeper Executioner Take Down (Tier 2): spend a Hope, and a Severe-damage hit takes the adversary out of the fight unless the GM pays 2 Fear. The biggest single swing in the set; not in the DPR figures. Candidate for a note when you playtest.
- Once-per-session or rest spikes: Envoy Stay on Target (change a Hope or Fear Die), Solarian Radiant Aura (counted), Aspis Sleeper Buried Protocols clear-Stress-and-gain-Hope.
- Free conversions: Technomancer Hope Feature (mark an Armor Slot for 2 Hope), Soldier Hope Feature (Hope instead of Armor Slots).
- Stacking: Biohacker Difficulty -2 lingers the whole scene and Chemical Cocktail doubles doses; Envoy Tokens turn Hope gains into aid; Overwatch tokens are spent after the roll, which is why the uncapped version flips almost every miss.
- Free actions: Witchwarper Wave Function moves the Field; Mechanic Sidekick acts instead of you (Telecast), so Follow-up is an upper bound.

## Tuning proposals (apply only after you answer)
Numbers are Tier 1 / Tier 2 totals after the change, from `--tune`.
- PT1. Envoy Squad Goals: the ally attack costs 2 Stress instead of 1. Envoy 1.40 / 1.48 -> 1.14 / 1.22. (A) apply (recommended) (B) keep 1 Stress but once per spotlight (same rate, no change) (C) leave.
- PT2. Operative Precision 2: "Your Called Shot bonus damage is always a d6" (drops the d8 with an Experience). 1.34 -> 1.25 at Tier 2. (A) apply (recommended) (B) leave.
- PT3. Solarian Gleaming Blade: "Increase your Solar Weapon damage by 1 die size (d10 and d12+2)" (drops the +2). Coronal Tier 2 1.36 -> 1.30. (A) apply (recommended) (B) leave.
- PT4. Witchwarper Probability Cloud: "Mark 2 Stress as a reaction ..." instead of 1. Electronic Tier 2 1.34 -> 1.29. (A) apply (recommended) (B) leave.
- PT5. Technomancer Magical Battery: "You can spend up to 3 tokens on a single roll." Overwatch 1.28 / 1.47 -> 1.08 / 1.19. (A) apply, cap 3 (recommended) (B) cap 4 instead (1.15 / 1.29) (C) leave.
- PT6. Biohacker Intermediate Serums: "The target marks 1 Hit Point" costs 2 Serum Tokens. Physiologist 1.18 / 1.42 -> 1.09 / 1.26. (A) apply (recommended) (B) leave.
- PT7. Mystic Spellweaver sits at 0.78 / 0.99 after your Crimson Rite edit. (A) leave (healing and VP support carry the class) (recommended) (B) tell me what to add.

If all of PT1-PT7 go as recommended, every subclass is between 0.73 and 1.30; the set average is about 0.96. Coronal lands exactly on 1.30; Electronic on 1.29.

## Did tuning undo prompts 4-6?
No text has changed yet, so this is a check of the current `v3-tuned.md` (with your Crimson Rite edit):
- Words / features: Envoy 377 / 11, Mystic 366 / 12, Operative 340 / 13, Solarian 468 / 13, Soldier 363 / 13, Witchwarper 443 / 15, Mechanic 513 / 13, Technomancer 391 / 13, Biohacker 500 / 15, Aspis Sleeper 412 / 14. All at or under 525. The PT1-PT6 edits swap a number or drop one clause; none adds a feature and the word count moves by a few words at most.
- Complexity (keyword proxy): Mystic 27 -> 25; everything else unchanged, so Solarian (30) and Mechanic (31) still read 1.8x and 1.9x core by the proxy. The proxy counts distinct words, so removing Ejection, Patch Up and three Configurable options does not register; the actual change was fewer mode branches (Solarian) and a smaller Sidekick rule set (Mechanic). I would not call those two "fixed"; treat them as lighter than the score says and check in playtest.

## Reply format
"PT1. A, PT2. A, PT3. A, PT4. A, PT5. A, PT6. A, PT7. A" or "all A". Answers are applied at the start of prompt 9 into `v3-tuned.md` (then re-run the model and metrics), followed by the first theme-breaking card pass.
