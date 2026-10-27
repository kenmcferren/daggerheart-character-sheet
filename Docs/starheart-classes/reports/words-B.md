# Word-count reduction, part B (Series 12, prompt 5)

## Part A applied
Batches 12-16 were answered "all A" (MY1: the "(a d20 becomes d20+6)" parenthetical now sits inside option (A)). `v2-reduced.md` holds Envoy, Mystic, Operative, Solarian, Soldier with those changes. Recount with the metrics script:

| Class | Before words / features | After words / features | Subclass features after |
|---|---|---|---|
| Envoy | 377 / 11 | 377 / 11 | 4, 4 |
| Mystic | 405 / 15 | 402 / 13 | 5, 5 |
| Operative | 356 / 13 | 340 / 13 | 5, 5 |
| Solarian | 504 / 15 | 499 / 14 | Sidereal 6, Coronal 6 |
| Soldier | 363 / 14 | 363 / 13 | Tactician 5, Armor Storm 5 |

Part A mean: 396 words, 12.8 features per class. Every class is under 525 words; Sidereal and Coronal stay at 6 features until the power pass (SO2 A).

## Part B baseline (v1-clean) and what is over

| Class | Words (budget 525) | Features (aim 14) | Over |
|---|---|---|---|
| Witchwarper | 453 | 16 | features +2; class level 4, Neutronic 6, Electronic 6 |
| Mechanic | 552 | 15 | words +27; class level 173 words (budget 160); Mechsuit 6, Drone Controller 6 |
| Technomancer | 416 | 13 | none (Tinker mastery is 12 words) |
| Biohacker | 500 | 15 | class level 161 words / 4 features; Physiologist 6 |
| Aspis Sleeper | 415 | 14 | Infiltrator 6 |

Mechanic is the only class over 525. With the cuts below it lands near 505, so the 630-word allowance is not needed yet (see AL1).

## Batch 17: Witchwarper
- WW1. Fold Warp Casting into Quantum Field (both define how spells use the Field): class features 4 -> 3. After, appended to Quantum Field: "... You can only select Spell domain cards. With every spell, replace "within Melee/Very Close/Close/Far/Very Far" with the phrase "within your Field". Spell effects occur only within your Field." (A) merge (recommended) (B) keep separate.
- WW2. Quantum Tunneling: cut the north/south example, keep the rule. After: "Mark 2 Stress to open a wormhole to a point within your Field. Creatures and objects passing through emerge on the other side retaining their facing, and onlookers can see through the Field in the same direction they are looking. The tunnel closes at the end of your next spotlight." (A) cut (recommended; 9 words) (B) keep.

## Batch 18: Mechanic
- MC1. Machine Whisperer shortened, same text for Mechanic and Technomancer (X1 A: shared shorter text). After: "**Machine Whisperer:** Your Sage domain cards apply to technological and urban systems instead of natural environments: tracking can work through computer systems, a familiar can be a small drone, and speaking with the natural world becomes conversing with turrets, ship AIs, and databases. Magic damage from these cards is instead Tech or physical damage, your choice." About 85 -> 55 words each. (A) shorten both (recommended) (B) keep as is.
- MC2. Trusty Sidekick reordered and trimmed. After: "You have an invention of circuits and parts, small enough to be carried as a backpack, that accompanies you. It has 4 Armor Slots plus 1 per Tier, has Evasion equal to yours, and moves with you to stay in Very Close range of you. It can be equipped with any secondary weapon, giving you that weapon's benefits as though you had it equipped. When its final Armor Slot is marked, it is destroyed." About 8 words. (A) apply (recommended) (B) keep.
- MC3. Mechsuit foundation: fold Targeting Systems into Armor Up (both are the Sidekick's weapon and mech-suit rules), keeping "each time you summon your Sidekick" so the primary-weapon pick still applies to every summon. Mechsuit 6 -> 5, Mechanic 15 -> 14. (A) merge (recommended) (B) keep two.

## Batch 19: Technomancer
- TC1. Machine Whisperer: same as MC1. (Answer MC1.)
- TC2. Versatile Caster: cut the flavor examples. After: "Mark a Stress or spend a Hope to alter the damage type and/or flavor of any spell. Damage types include magic, Tech, and physical. Flavor never changes damage dice, ranges, or durations." About 10 words. (A) cut (recommended) (B) keep.
- Note, no action: Tinker mastery (The Right Tool) is 12 words, core minimum 27. Prompt 6.

## Batch 20: Biohacker
- No proposals. 500 words is inside the budget; class level is 161 words / 4 features, a hair over the class-level budget (160 / 3.5). Candidates if prompt 6 wants fewer features are in the "not proposed" list.

## Batch 21: Aspis Sleeper
- AS1. Backstory: cut the example. After: "... you can spend a Hope to have them give you a perfect backstory." About 9 words. (A) cut (recommended) (B) keep.
- Note, no action: Infiltrator has 6 features (two per rank, all distinct).

## Batch 22: Variance allowance
- AL1. The owner may let up to two classes run to 630 words. After these cuts none needs it (Mechanic ~505, Biohacker 500, Solarian 499). (A) hold the allowance for prompts 6-8, where complexity or power fixes may add words (recommended) (B) name two classes now.

## Before and after if everything above is accepted (approximate; recounted next time)

| Class | Words / features before | After |
|---|---|---|
| Witchwarper | 453 / 16 | ~441 / 15 |
| Mechanic | 552 / 15 | ~505 / 14 |
| Technomancer | 416 / 13 | ~371 / 13 |
| Biohacker | 500 / 15 | 500 / 15 |
| Aspis Sleeper | 415 / 14 | ~406 / 14 |

## Not proposed (would change a mechanic)
- Witchwarper: Slowed Strikes (Neutronic) and Soothing Pulse overlap on Field support; Phenomenal Effect (6 loadout cards) is a build change, not a feature.
- Mechanic: Patch Up and the Hope Feature's Prepare option both summon the Sidekick; Follow-up (Drone Controller) could go.
- Biohacker: Tech Caster is one line and could fold into Minor Serums; Physiologist Ample Ampules overlaps Hope Feature refills.
- Aspis Sleeper: Quickdraw and Escape Route are both stealth-prep conveniences.

## Reply format
"WW1. A, WW2. A, MC1. A, MC2. A, MC3. A, TC2. A, AS1. A, AL1. A" or "all A". Answers are applied at the start of prompt 6 (complexity comparison), which creates `v2-reduced.md` part B entries by appending.
