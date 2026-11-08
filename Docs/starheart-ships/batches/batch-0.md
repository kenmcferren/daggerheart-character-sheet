# Batch 0: creation rules and keywords (Series 14, step 2)

Status: drafted 2026-11-07; owner answered 2026-11-07 and sent the larger ship rules (`source-rules-v0.md`). This text will be merged with those rules into one rewritten rules section (Batch 0b) after the term table in `batch-0-terms.md` is settled. Nothing applied yet. Source: `source-v0.md` lines 1-69. When approved, this text opens `v1-working.md`.

## What changed
- Your answers 1-4 are written into the steps: Solo Flier, primary and secondary systems and traits, pilot's Hope, and the same steps for the party ship.
- **Hull Points (HP)** is defined once. Cards will say "Hull Point" (Batches 1-4) so ship HP is never confused with character HP.
- Roll names follow one pattern: "[System] Action Roll" and "[System] Reaction Roll" (the draft also had "Science check", "Weapons Attack" and "Weapons roll").
- Added keyword entries the cards already rely on: Pilot, Primary/Secondary Systems, Hull Points, Analysis Tokens, Power Tokens, Reload Tokens, Studied Target. Wording marked **[Q#]** depends on your answer to that question.
- Fixes: Cloud radius said "Tier" but listed sizes; the Docking definition was circular; "proceeding" -> "following"; the empty bullet under Sizes is gone; the "larger ships can't lock smaller ships" rule now sits under Lock instead of in two places.
- Domain table: the Theme column and the system tag lines ("Dodge, haul, escape") moved to a "Design notes" block that is not printed (rules text only on the sheet). The "Special rules" column now names the keyword each domain uses.

## Proposed text

### Creating a Ship
A ship is defined by its size, configuration, traits, frame and domains. The **pilot** is the character flying it.

1. **Size.** Each starting character has a size 2 Solo Flier. The party shares a size 3 Catamaran. Build both with these steps.

| Size | Name |
| :-: | :-- |
| 1 | Drone |
| 2 | Solo Flier (Flier) |
| 3 | Catamaran |
| 4 | Cruiser |
| 5 | Dreadnought |

2. **Configuration.** Choose a configuration. It sets the most domain cards each system can hold. The two systems with a maximum of 4 are your **primary systems**; the other two are your **secondary systems**.

| Configuration | Transport | Weapons | Science | Engineering |
| :-- | :-: | :-: | :-: | :-: |
| Interceptor | 4 | 4 | 2 | 2 |
| Scout | 4 | 2 | 4 | 2 |
| Sapper | 4 | 2 | 2 | 4 |
| Surgeon | 2 | 4 | 4 | 2 |
| Bandit | 2 | 4 | 2 | 4 |
| Warden | 2 | 2 | 4 | 4 |

3. **Traits.** Choose one character trait (Agility, Strength, Finesse, Instinct, Presence or Knowledge) as your **Primary Trait** and a different one as your **Secondary Trait**. Action and Reaction Rolls in a primary system use the pilot's Primary Trait; rolls in a secondary system use the pilot's Secondary Trait. **[Q1]**

4. **Frame.** Choose a frame. It sets your Free HP, Stress slots, Evasion and damage thresholds.

| Frame | Free HP | Stress | Evasion | Thresholds |
| :-- | :-: | :-: | :-: | :-: |
| Bare | 2 | 8 | 15 | 7/16 |
| Standard | 3 | 7 | 13 | 9/20 |
| Plated | 4 | 6 | 11 | 11/24 |
| Bulky | 5 | 5 | 9 | 13/28 |

5. **Domains.** Choose two domains.

| Domain | Uses |
| :-- | :-- |
| Flesh | Hope |
| Mind | Analysis Tokens, magic damage |
| Void | Fear |
| Energy | Power Tokens |
| Metal | Hull Points |
| Glass | Studied Target |

6. **Domain cards.** Choose 6 domain cards from your two domains. Each card belongs to one system. No system can hold more cards than your configuration allows. All 6 cards are in your loadout.

7. **Hull Points.** Each system starts with 1 HP. Add 1 HP to a system for each of its cards, plus any HP a card grants. Then place your Free HP in any systems. No system can have more than 7 HP.

8. **Name and describe your ship.** How did you come by it?

> **Design notes (not printed).** Systems: Transport (dodge, haul, escape), Weapons (hurt, inhibit), Science (sense, lock, buff, heal), Engineering (debuff, utility). Domain themes: Flesh (regen, care, fluid), Mind (think, create, utilize), Void (sap, freeze, warp), Energy (zap, electrify, burn), Metal (strengthen, push, protect), Glass (study, cut, reflect). Before card HP grants a ship has 12-15 HP.

### Keywords
- **Pilot:** The character flying the ship. Ships have no Hope: features that spend or gain Hope use the pilot's Hope.
- **Hull Points (HP):** A ship's Hit Points, tracked per system (Transport, Weapons, Science, Engineering). When the ship marks HP, **[Q3]**. A system with all its HP marked **[Q4]**.
- **Refuel / Refit:** A ship's rests. **[Q2]**
- **While Available:** If this card is in your ship's loadout or vault, you gain its passive benefit.
- **Lock / Locked:** Make a Science Action Roll against a ship your size or larger to give it the Locked condition **[Q5]**. Ships cannot normally lock onto smaller ships. Only one adversary and one PC ship can be Locked at a time. Features marked "**With Lock:**" use the Locked ship as their target.
- **Studied Target:** One ship you have designated. **[Q8]**
- **Analysis Tokens, Power Tokens:** Domain tokens that cards grant and spend. **[Q9]**
- **Reload Tokens:** Some cards hold Reload Tokens, up to the number they list. Spend them as the card says.
- **Forward Facing:** In a Chase, Forward Facing features can only affect ships ahead of your ship's current band. In a Maelstrom, they can affect any ship.
- **Aft Facing:** In a Chase, Aft Facing features can only affect ships behind your ship's current band. In a Maelstrom, they can affect any ship.
- **Observing:** A ship that has left an ongoing Chase is Observing. Ships in the Chase can't target it. On its spotlight, it can rejoin the Chase at any band.
- **Docked:** Two ships physically joined to each other are Docked. **[Q7]**
  - When a Docked ship marks HP from Major or Severe damage, it can pass 1 of those HP to the ship it is docked to.
  - A Docked ship can't make Transport Action Rolls while docked to a ship of its size or larger.
- **Cloud:** An area of space with an effect inside it. Unless a feature says otherwise:
  - A Cloud is centered on your position when you create it.
  - Its radius depends on your ship's size: Melee (size 1), Very Close (size 2), Close (sizes 3 and 4), Far (size 5).
  - In a Maelstrom a Cloud is stationary. In a Chase it keeps its band until it dissipates.
  - It dissipates at the start of your next spotlight.
  - It has no effect until a feature adds one. Choose which of your features are active when you create it; they don't change until you create a new Cloud.
- **Pd damage:** "Pd8+4" means roll d8s equal to the pilot's Proficiency, then add 4.
- **Size:** When ships of different sizes interact:
  - The larger ship has disadvantage on attacks against the smaller ship; the smaller ship has advantage on attacks against the larger ship.
  - When a ship marks HP from another ship's damage, it marks 1 fewer HP for each size it is larger than that ship, and 1 more for each size it is smaller. **[Q6]**

## Questions
1. Traits: does a ship roll add (A) the pilot's own value in the chosen trait (a pilot with Agility +2 adds +2 to Transport if Agility is its Primary Trait), or (B) something else (please describe)?
2. Refuel and Refit (used by many cards): (A) Refuel = short rest, Refit = long rest, defined in the keywords, or (B) other (please describe)?
3. When a ship marks HP, which system marks them: (A) the pilot chooses each time, (B) it depends on the attack (please describe), or (C) you will write the rule?
4. A system with all its HP marked: (A) its cards can't be used until it clears an HP, (B) nothing happens until every system is full, or (C) you will write the rule? (Lightweight Frame already rewards fully marked systems.)
5. The Lock roll: (A) a Science Action Roll against the target's Difficulty (adversary) or Evasion (PC ship), and any ally can use "With Lock" on the one Locked ship, or (B) each lock belongs to the ship that made it?
6. Size and damage: (A) the HP change is measured against the attacking ship, and damage with no attacking ship (environment, mines that say so) ignores size, or (B) other?
7. Forced Docking (Writhe, Cold Steel, Sharp Edges, Docking Winch): (A) a Transport Action Roll against a ship in Melee range; on a success both ships are Docked; the target breaks free with a Transport Action Roll on its spotlight, or (B) you will write the rule?
8. Studied Target: (A) one at a time; it ends when you pick a new one or the scene ends (Quantum Entanglement removes the scene limit), or (B) other?
9. Analysis and Power Tokens: (A) no cap; they last until spent; the sheet prints a write-in count, or (B) cap at a number you pick (the sheet then prints that many boxes)?
10. Chases, bands and Maelstroms are GM-side encounter rules the cards only refer to. (A) Leave the terms as they are and add "write Chase and Maelstrom rules" to `long-term-to-do.md`, or (B) you have rules to add now?

## Owner answers (2026-11-07)
1. A. The ship sheet prints each system with its trait and the pilot's value, e.g. "Transport (Agility): +2". A different pilot uses their own value.
2. B. Refuel and Refit are rests on a larger timescale, defined in `source-rules-v0.md` (Resting).
3. The pilot chooses the system, unless an adversary feature says otherwise.
4. Every action using a system whose HP are all marked has disadvantage, for domain card and non-card actions alike.
5. See `source-rules-v0.md` (Attacking: Locked).
6. Damage from any source is handled the same way; the size difference between attacker and defender(s) changes the HP marked.
7. See `source-rules-v0.md` (Docking, Undocking).
8. One Studied Target at a time. General rule: tokens and conditions a ship creates end when the scene ends.
9. Analysis Tokens and Power Tokens cap at 12 each.
10. Chase and Maelstrom rules are in `source-rules-v0.md` (owner's first draft); chase band distances in `chase-bands.png`.
