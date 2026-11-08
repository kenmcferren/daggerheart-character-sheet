# Starheart ships: text work summary (Series 14, steps 1-7)

Closed 2026-11-07. Final text: `v-final.md` (rules plus all 108 ship cards). History: `batches/batch-0.md` to `batch-5b.md`, each with the owner's answers. Power data: `reports/power-weapons.md`, `reports/defense.md`, `reports/combos.md`.

## What the text now has
- **Rules:**
  - Ships, Systems, Creating a Ship (with creator-only domain descriptions) and Keywords.
  - Characters and Ships, Ranges and Moving, Resting (Refuel and Refit), Locks, Attacking and Damage.
  - Docking, Boarding, Undocking, Adversary Ships and Chases.
- **Cards:** 108 cards, 27 per system and 18 per domain, with 3 to 6 per domain in each system. Any domain pair can build any configuration.
- **Length:** 4,222 words in the draft became 3,971 words for the same cards, 6% shorter. Average 37.1 words a card; Graviton Mine (108) is the longest.

## One set of terms
- Hull Points (HP), tracked per system. A system with all its HP marked is **Breached**; a ship with every HP marked is **Disabled**.
- The other keywords:
  - **Pilot** (ships have no Hope);
  - **While Available**, **Lock** / **With Lock**, **Studied Target** and **Contact**;
  - **Analysis**, **Power** and **Reload Tokens**;
  - **Cloud**, **Pd damage** and **Size**;
  - **Forward** and **Aft Facing**, **Observing** and **Docked**.
- Wording follows the SRD:
  - system rolls are capitalized (Transport Action Roll), and a "Transport roll" means either an Action Roll or a Reaction Roll;
  - damage is physical, magic or tech, and halved damage is resistance;
  - turns are called spotlights.
- **No Spellcast Rolls** on ship cards (owner rule). Rules text only, no flavor; the domain descriptions are shown only in the creator.

## Owner decisions that shaped the cards
- **Moved:**
  - Tether to Energy and Warp Cascade to Void.
  - Scanning Array to Science.
  - Critical Point Tracking to Weapons.
- **Renamed:**
  - Charge Extraction, from the Science copy of Energy Drain.
  - Slipstream Transference, from Energy Transference.
  - Docking Winch, from Docking Wench.
- **Limited use:**
  - Once per spotlight: Desperate Charge and Corrosive Slime.
  - Once per scene: Sharp Edges and Defensive Sync.
  - Once per Refuel: Fleet Transponder.
- **Damage numbers changed:**
  - Plutonium Railgun is Pd10+4.
  - Gatling Autoturret is Pd4+6.
  - Blacklight Laser is Pd6+4.
  - Engulf ticks Pd6.
  - Breaching Curse deals 2d6 + 1d6 per Analysis Token.
  - Resonant Echo deals 2d8 + 1d8 per Stress, up to 3.
- **Kept against the yardstick on purpose:**
  - Entropic Beam, Tether and Dissection Ray: the owner reverted the Batch 1 power fixes.
  - Gravitational Lens Drive keeps its condition of any unmarked Stress.
  - Counterfire keeps its 1-die minimum, because adversaries are balanced for Tier 2 and 3.
- **Critical Point Tracking** adds 2d6 only on a successful Weapons Action Roll. On every damage instance, a damage-over-time card plus Critical Point Tracking reached about 4x the benchmark.

## Watch in playtest
- **Gravitational Lens Drive:** the strongest passive card at Tier 1, about 2.8 HP a scene when six ally attacks pass near you.
- **Dissection Ray** with a Lock and Critical Point Tracking: 2.6x the benchmark at Tier 1, 2.0x at Tier 2.
- **Resonant Echo** with 3 Stress, a Studied Target and a Lock: 3.1x for 3 Stress.
- **Ultraviolet Imaging:** one Hope makes a target Vulnerable for the whole scene, about 2 HP with three allies.
- **Size** (how many HP a hit marks) and **Forced Docking** odds: the owner may retune these after play.

## Deferred
- **Conditions keyword** (Vulnerable, Restrained, how a ship clears a temporary condition): wait for playtesting (Batch 5).
- **Transport and Weapons bonuses** for adversary ships: revisit after playtesting.
- In `long-term-to-do.md` (the playtest items above are there too):
  - ship advancement and leveling;
  - ship equipment and armor;
  - a cost for Refit work;
  - character domain cards in ship scenes.

## Next (Series 14, steps 8-12)
1. `ships.json` and the "Starheart Ships" supplement, with a schema.
2. Engine: a ship save type, a link between a character and a ship, and a ship that opens on its own (for the Hub Ship).
3. UI: "New ship", the ship wizard, and ships in the saved list.
4. PDF ship page: traits shown like "Transport (Agility): +2", an HP track per system, and token trackers.
5. Tests in `tests/starheart-ships.test.ts`, tagged `[s14]`.
