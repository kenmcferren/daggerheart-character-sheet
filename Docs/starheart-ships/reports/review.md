# Starheart ships: review of `source-v0.md` (2026-11-07)

Source: `Docs/starheart-ships/source-v0.md` (owner draft, left untouched). Series 14, step 1.

## What the draft contains
- Creation: size, configuration (6), frame (4), two of six domains, 6 domain cards, Hull Points (HP) per system, name/description question.
- 108 domain cards: 27 per system (Transport, Weapons, Science, Engineering), 18 per domain (Flesh, Mind, Void, Energy, Metal, Glass). Per system/domain cell: 3 to 6 cards.
- Keywords: While Available, Lock, Forward/Aft Facing, Observing, Docking, Cloud Effects, Pdx damage, Sizes.

| System | Flesh | Mind | Void | Energy | Metal | Glass |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: |
| Transport | 6 | 4 | 4 | 3 | 5 | 5 |
| Weapons | 4 | 3 | 6 | 6 | 4 | 4 |
| Science | 5 | 6 | 3 | 4 | 3 | 6 |
| Engineering | 3 | 5 | 5 | 5 | 6 | 3 |

- No build is blocked: any two domains give at least 6 cards in every system, more than any configuration cap (4).

## What the ship sheet has to show
- Size, configuration, frame, two domains, name, description.
- Evasion, thresholds (from frame), Stress slots (frame + cards).
- HP track per system: 1 base + 1 per card in that system + card grants + Free HP placed by the player; max 7 per system.
- System card caps (from configuration), so the player can see what is left.
- The 6 cards in full text, grouped by system.
- Token trackers:
  - Domain tokens: Analysis (Mind), Power (Energy), Studied Target (Glass) write-in.
  - Card tokens: Reload (Cold Steel 2, Counterfire 2, Plutonium Railgun 3, Seeking Missile 3, Gatling Autoturret 4), Inversion (Matter Inversion 3), Scrambler (Position Scrambler 3), Shrapnel Mine (1).
- Build-time bonuses the app can apply automatically:
  - +1 Stress slot: Prey Drive, Innervation, Anticipatory Neurons, Warded Hull, Oscillating Power Supply, Neural Interface.
  - +1 system HP: Energy Transference, Punch Through, Dense Frame, Reflective Hull (Transport); Ramming Cap (Weapons); Hull Cannibalization (Science).
  - Conditional (footnote, like the character sheet's ‡): Void Cohesion (+2 Evasion with 4+ Void cards), Synced Arcana (thresholds + pilot Spellcast).

## Gaps the app needs answered (see Questions)
- **No roll modifier for ship actions.** Cards say "Transport Action roll", "Weapons Action roll", etc., and Engine Sync says "your Transport trait", but no rule gives a ship trait or says which pilot trait to use.
- **Whose Hope.** Ship cards spend and gain Hope ("When you have no Hope", Neural Interface). No ship Hope track is defined.
- **Size names conflict.** Step 1 says size 2 is "Fighter"; Scrap Hound lists sizes 1-5 as drone, flier, catamaran, cruiser, dreadnought.
- **Party ship.** Step 1 gives each PC a size 2 ship plus a shared size 3 ship. Nothing says whether size changes creation (HP, cards, Free HP) or who builds the shared ship.
- **Advancement.** No rules for ships gaining cards or tiers. "While Available" mentions the vault, but all 6 cards start in the loadout.
- **Duplicate card name.** Energy Drain is both a Science/Void card and an Engineering/Energy card with different text. The app needs unique names.
- **Fixed-dice damage.** Most damage uses Pd (pilot's Proficiency), but Plutonium Railgun (d10+4), Gatling Autoturret (d4+6), Volley Fire (2d6) and Plasma Caster's line damage (1d6+10) do not.

## Gaps in the play rules (no app impact; for your later pass)
- Not defined: which system marks HP when a ship takes damage; Forced Docking (used by Writhe, Cold Steel, Sharp Edges); Chases, bands and Maelstroms (used by the Facing and Observing keywords); Restrained, Vulnerable and Hidden for ships (core conditions, presumably as in the SRD).
- Who rolls the "Weapons Reaction roll" on Gatling Autoturret and Seeking Missile? In the SRD a reaction roll is made by the target, but here the attacker seems to roll.
- Spacetime Chasm's first target has no range.
- Untyped damage: Fire Gout, Overload Barrage, Shrapnel Mine, Graviton Mine (the mine says "physical").
- Pulsar Mine says "next turn"; Daggerheart has spotlights, not turns.
- "Refuel" and "Refit" are used as rests, as in the Hubborne community (already accepted as written).

## Clear typos and grammar (fix list for Question 7 A)
- Keywords, Lock: "allowing proceeding features" -> "following".
- Keywords, Docking: definition is circular ("touching and docked are docked to each other").
- Keywords, Cloud radius: "depends on the Tier of the ship" but the list is by Size.
- Keywords, Sizes: empty last bullet.
- Science heading "Sense, Lock, Buff, Heal" vs configuration table "Sense, Lock, Buff". Only Transport has a "#### Flesh" subheading.
- Engine Sync: "equal to your half your Transport trait".
- Detailed Systems Readout: "When you acquire a Lock an Action roll" (missing "with").
- Arcanic Connection: "amplify a spell with a Spellcast roll your character knows" (word order).
- Graviton Mine: "In a failure" -> "On a failure"; stray bold on "**P**d10".
- Shrapnel Mine: stray bold on "**P**d12".
- Counterfire: "Spend any number Reload Tokens" (missing "of").
- Docking Wench -> Docking Winch. Gravitational Lense Drive -> Lens.
- Synced Arcana: "Spellcasting trait" -> "Spellcast trait" (SRD term).
- Null Sphere, Mirage Cloud: "creatures" where other cards say "ships".
- Roll names mixed: "Weapons Attack" (Plasma Caster), "Weapons Attack roll" (Ramming Cap), "Weapons roll" (Entropic Beam) vs "Weapons Action roll"; "Science check" (Lock keyword) vs "Science Action roll".
- "HP" and "Hull Point" are used for the same thing; pick one for the sheet.

## Questions
1. Ship action rolls: should a ship (A) get four ship traits set at creation (you supply the spread and rule, e.g. +2/+1/0/-1 across Transport/Weapons/Science/Engineering), or (B) use the pilot's character traits, one mapped to each system (you supply the mapping)?
2. Hope on ship cards: (A) it is the pilot's Hope, so the ship sheet has no Hope track, or (B) the ship has its own Hope track (you supply its size)?
3. Size 2 name: (A) Fighter (change Scrap Hound's "flier"), or (B) Flier (change step 1)?
4. The size 3 party ship: (A) built with the same steps and numbers as a fighter (size only matters in play), or (B) you will write size rules first?
5. Advancement: (A) starting ships only for now, ship advancement goes to `long-term-to-do.md`, or (B) you will write advancement before the build?
6. Energy Drain: rename (A) the Engineering/Energy one or (B) the Science/Void one (you pick the new name)?
7. Text: should I (A) fix only the clear typos and grammar listed above and keep everything else word for word, or (B) run the full Series 12 treatment (consistency, word count, power model)?
8. Fixed-dice damage cards (Plutonium Railgun, Gatling Autoturret, Volley Fire, Plasma Caster's line damage): (A) intentional, leave as is, or (B) change to Pd?
9. Ships and characters: (A) a ship is its own save; a character can link to one and its PDF then adds the ship page; pilot Proficiency prints as a write-in box (recommended), or (B) the ship is stored inside the character?

## Owner answers (2026-11-07)
1. After the configuration is picked, the two systems with the highest max (4) are the primary systems, the other two the secondary systems. The player picks one character trait as the Primary trait and a different one as the Secondary trait.
2. Ships have no Hope. The pilot's (character's) Hope is spent and gained during ship activities.
3. Size 2 is "Solo Flier" ("Flier" for short).
4. A: the size 3 party ship is built with the same steps and numbers.
5. Ship advancement goes to `long-term-to-do.md`.
6. The Science/Void Energy Drain is renamed **Charge Extraction**.
7. Full treatment. Changes go to the owner first, in batches (Claude's choice: per system; see `Docs/plan.md` Series 14).
8. Plutonium Railgun -> Pd10+4; Gatling Autoturret -> Pd4+6; Volley Fire and Plasma Caster stay as written.
9. A. A ship is its own save; a character can link to one. A ship must also open on its own for creation and review (and later, advancement), for the party ship.
