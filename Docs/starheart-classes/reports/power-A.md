# Power results, first five classes (Series 12, prompt 7)

Classes: Envoy, Mystic, Operative, Solarian, Soldier, from `v3-tuned.md` (complexity decisions CX1-CX5 applied: Ejection, Magical Refraction and Patch Up removed, Configurable resistances merged). Model and assumptions: `power-model.md`. Data: `power-data.csv`.

## Applied first
CX1-CX5 all A. `v3-tuned.md` holds all ten classes. Counts now (words / features): Envoy 377 / 11, Mystic 393 / 12, Operative 340 / 13, Solarian 468 / 13, Soldier 363 / 13, Witchwarper 443 / 15, Mechanic **513** / 13, Technomancer 391 / 13, Biohacker 500 / 15, Aspis Sleeper 412 / 14. Every class is now at or under 525 words (Mechanic's 530 is fixed); mean 420 words, 13.2 features.

## Results (x core damage per round)

| Class | Subclass | Tier 1 total | Tier 2 total | Notes |
|---|---|---|---|---|
| Core baseline | | 10.17 DPR | 23.81 DPR | weapon + typical feature |
| Envoy | Commander / Spymaster | 1.40 (self 0.73) | 1.48 (self 0.79) | **over 1.3, just under 1.5** |
| Mystic | Spellweaver | 0.78 | **1.34** | over 1.3 at Tier 2 |
| Mystic | Bondsmage | 0.73 | 0.79 | support |
| Operative | Weapons Specialist | 1.10 | **1.34** | over 1.3 at Tier 2 |
| Operative | Technologist | 0.73 | 0.79 | utility |
| Solarian | Sidereal | 1.02 | 0.92 | control |
| Solarian | Coronal | 1.02 | 1.20 | on target |
| Soldier | Tactician | 0.73 | 0.90 | control |
| Soldier | Armor Storm | 0.73 | 0.94 | defense |

Nothing reaches 1.5. Three results sit over the 1.3 flag line.

## What drives the flags
- **Envoy, 1.40 / 1.48.** Own attack is weak (0.73-0.79x, a weapon with no feature); the total is mostly Squad Goals, an extra full ally attack for 1 Stress, plus the Hope Feature bonus. Squad Goals alone is about two-thirds of Envoy's party contribution. Highest-risk class for the 1.5 ceiling: at uptime 1.0 it is 1.63x / 1.71x.
- **Mystic Spellweaver, Tier 2, 1.34.** Crimson Rite's second target (2 VP, every round) doubles the spell. It depends on a second adversary being in range (0.7 uptime) and on spending all VP on damage. Without the second target the Tier 2 total is about 1.1.
- **Operative Weapons Specialist, Tier 2, 1.34.** Called Shot every round Stress allows, with Precision 2 (Pd6, Pd8 with an Experience). The Hope Feature (advantage plus an Experience) is paid by Pride in Your Work's extra Hope. At Tier 1 it is a modest 1.10.
- **Solarian.** Solar Weapon d10+2 plus Tier and Spellcast Trait lands near core at Tier 1 (1.02); Coronal's Gleaming Blade and Radiant Aura bring it to 1.20 at Tier 2. Mote +1d6 counted at half uptime (ranged attacks only). Sidereal falls to 0.92 and is a control subclass.
- **Soldier.** 0.73-0.94x on damage by design: Suppression, Primary Target and Armor Storm are defensive/control. Armor Storm's Heavyweight gives +5 per hit at Tier 2 (0.94x).

## Qualitative output (not converted to damage)
- Envoy: Evasion or roll bonus to allies; Tag Team Rolls (Get 'Em); ally Stress clearing; Lie Detector, In Plain Sight.
- Mystic: Vitality Network healing (Stress or Hit Point), Mystic Bond; Bondsmage: cheaper VP healing, Shared Trauma damage reduction.
- Operative Technologist: Gadgets and Ordnance, Tinker, Extra Juice Stress marks.
- Solarian: Aura damage reduction, Warpage pushes/pulls, Lensing +2 Evasion, Expulse (1 Hit Point or Stress), Retrograde and Well at Tier 3.
- Soldier: Suppression (disadvantage, spotlight ends), Dread abilities, spend Hope instead of Armor Slots, Quick Stitch Armor Slot sharing.

## Tuning candidates (for prompt 8; nothing applied)
- Envoy: limit Squad Goals (Stress cost 2, or once per spotlight, or the ally attack gets no Hope/crit effects) to bring Tier 2 from 1.48 to about 1.25.
- Mystic Spellweaver: Crimson Rite option (B) second target costs 3 VP instead of 2 (Tier 2 about 1.2).
- Operative: Precision 2 keeps d6 and loses the d8 Experience bump, or Called Shot costs Hope instead of Stress at Tier 2 (about 1.2).
- Leave Solarian, Soldier as they are; Soldier and Technologist/Bondsmage are support classes below 1.0 on damage.

## Decision list
- PW1. Are the model assumptions in `power-model.md` (A1-A4) acceptable? (A) yes, proceed (recommended) (B) change one (name it).
- PW2. Prompt 8 will apply tuning to the three flagged cases. (A) wait for prompt 8 so all ten classes are tuned together (recommended) (B) apply the three candidates above now.

## Reply format
"PW1. A, PW2. A". Prompt 8 runs the other five classes (Witchwarper, Mechanic, Technomancer, Biohacker, Aspis Sleeper) through the model and proposes the tuning.

## Sensitivity: weapons that use a Trait as Proficiency (added after the first run)
The Starfinder armaments pack has three: Dueling Sword (T1, d8+3, Presence), Hammer (T1, d12+3, Strength) and Phase Cutlass (T2, d8+8, Presence). `node scripts/starheart-power.mjs --tprof` re-runs the model with every weapon user holding one (Hammer at Tier 1, Phase Cutlass at Tier 2, trait +2 at Tier 1 and +3 at Tier 2); spellcasting (Mystic) and the Solar Weapon keep plain Proficiency; Operative Called Shot dice follow the weapon's Proficiency. Data: `power-data-traitprof.csv`.

| Result (x core, total) | Standard T1 / T2 | Trait-as-Proficiency T1 / T2 |
|---|---|---|
| Core baseline DPR | 10.17 / 23.81 | 17.17 / 22.58 |
| Envoy | 1.40 / 1.48 | **1.51** / 1.47 |
| Mystic Spellweaver | 0.78 / 1.34 | 0.46 / 1.41 |
| Operative Weapons Specialist | 1.10 / 1.34 | 1.26 / 1.35 |
| Solarian Coronal | 1.02 / 1.20 | 0.60 / 1.27 |
| Soldier Tactician | 0.73 / 0.90 | 0.84 / 0.89 |

- Tier 2 barely moves: Proficiency 3 and a trait of +3 give the same dice, so a Trait-as-Proficiency weapon only helps while the trait beats Proficiency, which is Tier 1 (trait 2 vs Proficiency 1).
- At Tier 1 the Hammer is the outlier: 2d12+3 (16) against 1d10+3 (8.5), so the core baseline itself rises 69%. That is a property of the weapon, separate from the class tuning.
- Ally-buff classes track the weapon: Envoy's extra ally attack and roll bonus scale with ally damage, so Tier 1 rises from 1.40 to 1.51 (over the ceiling) if the allies carry these weapons.
- Casters and the Solar Weapon fall behind the new baseline at Tier 1 (Mystic 0.46, Solarian 0.60) only because they are assumed not to switch to a weapon.
- Trait boosts: the first five classes do not raise Strength or Presence. Biohacker does (Self Help +1 trait each long rest, Minor Serums +1 trait on a PC): +1 die on a Hammer is 6.5 per hit at Tier 1 (+40%). Prompt 8 will include that for Biohacker.
