# Batch 5: cross-system pass (Series 14, step 7)

Status: answered and applied to `v1-working.md` 2026-11-07. Second pass: `batch-5b.md`. Covers all 108 cards in `v1-working.md` plus the rules section. After the answers: apply them, write `v-final.md` and `reports/summary.md`.

Data: `reports/combos.md` (made by `node scripts/starheart-ship-combos.mjs`), `reports/power-weapons.md`, `reports/defense.md`.

## Domain balance
Every domain has 18 cards. Per system it ranges from 3 to 6:

| Domain | Transport | Weapons | Science | Engineering | Total |
| :-- | :-: | :-: | :-: | :-: | :-: |
| Flesh | 6 | 4 | 5 | 3 | 18 |
| Mind | 4 | 3 | 6 | 5 | 18 |
| Void | 4 | 6 | 3 | 5 | 18 |
| Energy | 3 | 6 | 4 | 5 | 18 |
| Metal | 5 | 4 | 3 | 6 | 18 |
| Glass | 5 | 4 | 6 | 3 | 18 |

- Every pair of domains offers at least 6 cards in every system, so any configuration can be built from any pair. No change needed.
- Each domain leans on its own resource, as the creator descriptions say:
  - **Flesh:** Hope (6 cards spend it) and extra Stress slots (4 of its 4 While Available cards).
  - **Mind:** Analysis Tokens (9 cards).
  - **Void:** Stress (11 cards cost one) and the GM's Fear (6 cards).
  - **Energy:** Power Tokens (12 cards).
  - **Metal:** Hull Points as a cost (5 cards), Reload Tokens (all 5) and extra HP (4 of its 4 While Available cards). It never spends Hope.
  - **Glass:** Studied Target (all 12 mentions), with one way to pick a Studied Target in each system.
- One cross-domain hook: Veil of Night (Void) can spend an Analysis Token (Mind). A Void ship without Mind just pays the Stress. Kept; it rewards the Mind/Void pair.
- Average length is 37.1 words a card (Flesh 30.8, Void 41.1). Graviton Mine (108) is the only card over 80.

## Combo watch
x = times the Weapons benchmark per use (Tier 1 / Tier 2).

| Combo | Tier 1 | Tier 2 | Verdict |
| :-- | :-: | :-: | :-- |
| Dissection Ray on a Studied Target | 2.05x | 1.56x | Owner's call in Batch 1. Needs setup, so kept. |
| Dissection Ray + Lock + Critical Point Tracking | 2.64x | 2.01x | Two cards plus a Lock plus a Studied Target. Fine. |
| Resonant Echo, 3 Stress, Studied + Lock | 3.14x | 2.30x | Costs 3 Stress. Fine. |
| **Engulf + Critical Point Tracking** (2 ticks) | **3.98x** | 3.05x | **Too strong.** Critical Point Tracking adds 2d6 to *every* damage instance, so it doubles damage-over-time: Engulf ticks, Seeking Missile ticks (3.56x), Gatling reactions, mine damage. Q1. |
| Four Vulnerable sources (Erratic Pulse, Opportunistic Analysis, Pulse Beacon, Ultraviolet Imaging) | | | Fine. Vulnerable gives advantage, and advantage doesn't stack, so they never combine; a smaller ship already has advantage against a larger one. Advantage is worth about +0.3 HP per ally attack, so Ultraviolet Imaging (1 Hope, one target, whole scene) comes to about 2 HP a scene with three allies. |
| Gravitational Lens Drive (+1 Proficiency to allies' attacks that pass near you) | +0.47 HP per attack | +0.26 | The strongest passive card at Tier 1: about 2.8 HP a scene if six ally attacks pass near you. The owner kept it in Batch 3 (being near the enemy is its cost). No change; **watch in playtest**. |
| Electrified Field (+1d8 to attacks from inside your Cloud) | +0.47 HP per attack | +0.26 | Fine: 1 Stress, lasts one round, and allies must be inside. |

## Proposed changes

### Power
**Critical Point Tracking,** *Weapons, Glass Domain.* **With Lock:** When you succeed on a Weapons Action Roll against your Studied Target, add 2d6 to the damage.
- Was "when you deal damage to your Studied Target", which also boosts every tick, reaction and mine (Q1).

### Rules section
- **Status line** (top of `v1-working.md`) still says the cards are as in `source-v0.md`. Replace with the batch summary.
- **Studied Target** keyword: say how you get one and when it ends. Proposed: "**Studied Target:** A ship a card has made your Studied Target. You can have one at a time; a new one replaces the old. It ends when the scene ends." (Quantum Entanglement already overrides the scene end.)
- **New keyword, Conditions** (Q2): "**Conditions:** *Vulnerable* (rolls against it have advantage) and *Restrained* (it can't move, but can still act) work as in the SRD. A **temporary** condition can be cleared by a move against it: a PC ship makes a fitting system Action Roll; an adversary ship uses its spotlight." Seven cards say "temporarily", and the SRD rule for clearing one is written for creatures.
- **New keyword, Contact** (Q3): "**Contact:** You make contact with a ship when you succeed on an attack against it, dock with it, or succeed on a Transport Action Roll against it." Your draft's word. It shortens Corrosive Slime and Selective Shedding by about 20 words each:
  - **Corrosive Slime:** Once per spotlight, when you make contact with a ship, you can **mark a Stress** to lower its Major threshold by 2 and its Severe threshold by 4 for the rest of the scene.
  - **Selective Shedding:** When you make contact with a ship, you can **spend a Hope** to slow it: until the end of its next spotlight, it can only move to a point within Very Close range. In a Chase, it moves back one band instead.

### Wording (no change in effect)
- System rolls are capitalized everywhere; a generic "action roll" (any system) stays lowercase, as in the SRD:
  - **Power Reroute:** "non-Transport action roll" -> "non-Transport Action Roll".
  - **Chaos Drive:** "non-Weapons action roll" -> "non-Weapons Action Roll".
  - **Cloaking Field:** "Weapons or Transport action roll" -> "Weapons or Transport Action Roll".
- **Ultraviolet Imaging:** "can't hide or cloak" -> "can't become Hidden or Cloaked".
- **Cloaked** is also an SRD term (the Rogue's: Hidden, plus unseen while stationary, ending when you attack). The ship version is close in spirit (can't be targeted, ends when you attack or make a Transport Action Roll), and character features don't apply in ship scenes, so the name stays.

### Theme
All 108 cards fit their domain's description. One name clashes:
- **Energy Transference** is a Void card, and its name points at the Energy domain (where Energy Drain lives). Q4.

## Questions
1. Critical Point Tracking: (A) only on a successful Weapons Action Roll against your Studied Target, as above, or (B) once per spotlight on any damage?
2. Add the Conditions keyword (Vulnerable, Restrained, how a ship clears a temporary condition): yes or no?
3. Add the Contact keyword and shorten Corrosive Slime and Selective Shedding: yes or no?
4. Energy Transference (Void): (A) rename it *Void Transference*, or (B) keep the name?
5. The six domain descriptions in creation step 4 (Living, Magical, Strange, Charged, Armored, Precise ships): (A) approve as written, or (B) list changes?
6. After these, should I (A) write `v-final.md` and the summary and close the text work, or (B) do another pass first?

## Owner answers (2026-11-07), applied to `v1-working.md`
1. A: Critical Point Tracking only on a successful Weapons Action Roll against your Studied Target.
2. Not yet: wait for playtesting. No Conditions keyword.
3. Yes: Contact keyword added; Corrosive Slime and Selective Shedding shortened. Also worked into **Sharp Edges**: "Once per scene, when you make contact with a ship within Melee range, you can **mark a Stress** to make it mark a Hull Point." (Melee kept, so the card still means its edges.)
4. Renamed **Slipstream Transference**.
5. A: domain descriptions approved.
6. B: another pass first (`batch-5b.md`).
- Also applied (proposed, no question): status line, Studied Target keyword, capitalized system rolls, "can't become Hidden or Cloaked".
