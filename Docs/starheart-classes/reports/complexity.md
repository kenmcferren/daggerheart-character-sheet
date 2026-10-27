# Complexity comparison (Series 12, prompt 6)

## Applied first
Batches 17-22 were answered "all A" (AS1 reworded: "... you can spend a Hope to have them accidentally give you a perfect backstory explaining your presence here."). Part B is appended to `v2-reduced.md`, so it now holds all ten classes. Counts after applying:

| Class | Words / features | | Class | Words / features |
|---|---|---|---|---|
| Envoy | 377 / 11 | | Witchwarper | 443 / 15 |
| Mystic | 402 / 13 | | Mechanic | **530** / 14 |
| Operative | 340 / 13 | | Technomancer | 391 / 13 |
| Solarian | 499 / 14 | | Biohacker | 500 / 15 |
| Soldier | 363 / 13 | | Aspis Sleeper | 412 / 14 |

Mean 425.7 words, 13.5 features per class (core mean 457.7 / 11.7). One miss: Mechanic is 530, five words over 525 (the estimate was 505; the Machine Whisperer and Sidekick cuts saved less than planned). CX4 below fixes it.

## How complexity is scored
`node scripts/starheart-complexity.mjs` counts the same six kinds of moving part in the rules text of the 13 core classes and the ten drafts, using keyword patterns, so it is a rough proxy, not a grade. Data: `reports/complexity-data.md`.
- resources: named Token / Pool / Points and token mentions
- states: invented conditions, modes, summoned things (Suppressed, Graviton, Photon, Sidekick, Quantum Field, Mote, Aura, ...)
- triggers: "when", "whenever", "at the start", "once per", "each rest/spotlight"
- editors: rules that edit other rules ("replace", "instead of", "as though", "now uses", ...)
- lists: option lists and tables ("(A)", "choose one", "following", d20 tables)
- reactions: things to remember out of turn ("as a reaction", "reaction roll", "when an ally ...")

Core: mean total 16.2, max 24 (Druid). Target: slightly above core, so about 1.1 to 1.4 times the core mean (18-23) and no class above the core max (24) by much.

## Scores

| Class | resources | states | triggers | editors | lists | reactions | total | x core mean | verdict |
|---|---|---|---|---|---|---|---|---|---|
| Envoy | 2 | 0 | 10 | 2 | 0 | 3 | 17 | 1.0 | at core |
| Mystic | 1 | 1 | 12 | 4 | 5 | 4 | 27 | 1.7 | **well above** |
| Operative | 1 | 0 | 9 | 4 | 0 | 0 | 14 | 0.9 | below |
| Solarian | 1 | 9 | 11 | 3 | 1 | 5 | 30 | 1.8 | **well above** |
| Soldier | 0 | 2 | 11 | 6 | 0 | 1 | 20 | 1.2 | on target |
| Witchwarper | 0 | 1 | 9 | 3 | 2 | 5 | 20 | 1.2 | on target |
| Mechanic | 0 | 2 | 14 | 5 | 7 | 3 | 31 | 1.9 | **well above** |
| Technomancer | 1 | 0 | 7 | 3 | 5 | 3 | 19 | 1.2 | on target |
| Biohacker | 3 | 1 | 8 | 5 | 3 | 2 | 22 | 1.4 | top of target |
| Aspis Sleeper | 1 | 2 | 12 | 0 | 0 | 2 | 17 | 1.0 | at core |
| **Mean** | 1.0 | 1.8 | 10.3 | 3.5 | 2.3 | 2.8 | 21.7 | 1.3 | on target overall |

The set as a whole is where the owner wants it (1.3x). Three classes carry the excess and three sit at or under core.

## Parts by class (what the numbers are made of)
- **Solarian (30).** The states count is the problem: two modes (Graviton, Photon) that switch each spotlight, three Solar Conjurations that take the mode, and nine features that branch by mode (Warpage, Slingshot, Alignment, Well, Expulse, Ejection, Supernova x2). Player must track mode, which conjurations exist, and two outcomes per feature.
- **Mystic (27).** One resource (VP) but five different ways to earn it (Arcane Font, Magical Refraction, Full Hearts, Empathic Bond, Wellspring), a Bond list of up to 10 creatures, an (A)/(B)/(C) option menu twice, a "pick 3 of those" step (Weaver), and four reactions or out-of-turn effects (Shared Trauma, Sacrificial Act, Vitality Network, Guiding Light merged into Full Hearts).
- **Mechanic (31).** The Sidekick is a second character: Armor Slots, Evasion, weapon, range, destroy and resummon rules, a Prepare option, and a mech-suit mode that rewrites its Armor Slots. On top: Machine Whisperer (rules edit), Configurable (7-option list), Transformer (3 options), More than Meets the Eye (3 options), Patch Up and Hope Feature both summoning it.
- **Biohacker (22).** Serum Pool + Serum Tokens + Creature Feature log slots, 12 serum effects across three lists, stacking rules (Chemical Cocktail vs "only the most recent serum"), GM-discretion negation. Heavy but fits.
- **Soldier (20).** Six rule edits (Hope substitution, Dread Abilities, Armor Master, Imposition, Quick Swap, Suppression ends) but few lists and few resources.
- **Operative (14).** Tech Savvy is the one rules edit; Called Shot is a single clear action. Weapons Specialist mastery is one 8-word feature.
- **Envoy, Aspis Sleeper (17).** Two tokens, a few triggers, almost no states or lists.

## Rules that edit other rules (manual pass, not just counts)
Operative Tech Savvy (swaps Spell/Magic/Grimoire words on every domain card); Soldier Dread Abilities (spells become abilities, damage stripped); Mechanic and Technomancer Machine Whisperer (Sage cards move to tech/urban, magic damage swapped); Technomancer Versatile Caster; Biohacker Tech Caster; Witchwarper Warp Casting (rewrites every spell's range text); Aspis Sleeper none. Core has a few (Seraph, Warlock, Brawler). Nine of ten drafts being the "swap damage type" family is deliberate for the Starfinder theme, so it is noted, not flagged.

## Flags and decisions
Well above: Solarian, Mystic, Mechanic. Below core: Operative. Each change would be applied at the start of prompt 7 to start `v3-tuned.md`.

- CX1. Solarian: drop Ejection (Coronal specialization). It is a third way to fire the Mote and carries two mode branches. Coronal 6 -> 5 features (this settles SO2), states count down by two branches. (A) drop it (recommended) (B) keep it and drop the Photon/Graviton split on it (one effect for both modes; you give the numbers) (C) leave.
- CX2. Mystic: five VP sources. (A) drop Magical Refraction (gain a VP on a Spellcast Roll with Hope); Spellweaver specialization becomes Crimson Rite alone (recommended) (B) drop Empathic Bond (Bondsmage) instead (C) leave.
- CX3. Mechanic: Configurable's 7-option list. (A) merge the three resistances into one option, "resistant to one damage type of your choice", leaving five options (recommended) (B) leave.
- CX4. Mechanic: Patch Up duplicates the Hope Feature's Prepare option (both bring the Sidekick back for free). (A) drop Patch Up: Mechsuit 5 -> 4 features, Mechanic about 506 words, which fixes the 530 (recommended) (B) keep it and use the 630-word allowance on Mechanic (C) keep it and cut another 5+ words yourself.
- CX5. Operative is the only class below core, and Weapons Specialist mastery is thin (Baba Yaga, 8 words). (A) leave it; prompt 7 power results decide whether it needs more (recommended) (B) you write a second mastery feature.

Not changed, for your information: Biohacker sits at 1.4x and Soldier at 1.2x; no action proposed.

## Reply format
"CX1. A, CX2. A, CX3. A, CX4. A, CX5. A" or "all A". Prompt 7 applies them to a new `v3-tuned.md` (all ten classes), then writes the power model.
