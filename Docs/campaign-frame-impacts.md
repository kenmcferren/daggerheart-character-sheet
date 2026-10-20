# Campaign frames and supplements: impact on character creation

Design note for Series 2 (pack JSON shape) and Series 3/4 (wizard, PDF). Source files: `Daggerheart SRD Files/Campaign Frames/`, `Daggerheart SRD Files/Supplemental Campaign Mechanics/`.

## Owner decisions

- **Combining:** one campaign frame plus any number of supplements; conflicts (two packs replacing the same pool) are flagged before the player starts.
- **Tracking scope:** the app does not track play state. It only puts tracking marks on the printed page.
  - HP, Armor Slots, Stress slots: empty **boxes**.
  - Domain-card and feature uses that scale with the Spellcast trait (set by the subclass): empty **circles**, printed with that card's rule text.
  - Frame trackables (tokens, scars, Ammo, Upgrade slots, currency): empty boxes or circles, placed with the rule text they belong to.
- **Print layout:**
  - *Front sheet:* weapon, class, subclass and domain card rules on one page, with every trackable next to the rule that uses it.
  - *Supplemental (back) sheet:* rests, Hope expenditures, using armor, loadout and vault limits, and any frame-specific mechanics. The front sheet references it.
- **Rules text only, no flavor:** printed sheets and pack rule fields carry mechanics, not descriptions. Not "Druids are masters of the wilds…" but "Druids have the Beastform feature: [SRD rules text]". Rule text stays as close to the SRD wording as possible (verbatim where practical). Class/ancestry/community/domain flavor paragraphs, background prose and campaign-frame pitch text are not part of the pack rules. Frame session-zero questions and background/connection questions are prompts, not flavor, and stay.
- Where frame notes on existing entries live (ancestry/community/class notes): default is `annotate` operations inside the frame pack, keyed by entry id. Not yet confirmed by the owner.

## Impact inventory

| # | Impact | Source | Pack operation |
|---|---|---|---|
| 1 | Notes and session-zero questions attached to existing entries; nothing removed | Witherwild classes, ancestries, communities | `annotate` (target id, text, questions) |
| 2 | Replace the weapon/armor pools | Everyday Hero (pp. 191–192) | `replace-pool` (equipment.weapons, equipment.armor) |
| 3 | Add items to the pools | Western (p. 197), Monster Hunting (p. 201) | `add-to-pool` |
| 4 | Items whose stats vary by tier (one row, four damage/threshold lines) | Western, Monster Hunting | item field `tiers: {1:{...},2:{...}}` |
| 5 | Build-from-scratch weapon: player picks trait, range, damage within limits, names it; two-handed, starts with Bonded; Upgrade slots (2 at Tier 1, +1 per tier) | Tech Iconic Weapon (pp. 195–196) | `replace-pool` (no standard weapons) + a `builder` choice + a tracker |
| 6 | Player creates an artifact (flight) | Floating Magic School (p. 199) | `insert-step` with a free-text/builder choice |
| 7 | Step before character creation (collaborative villain prompts) | Fairy Tale (p. 200) | `insert-step` (position: before creation) |
| 8 | Currency and starting resources change (5 Credits, Tech Link, Scrap) | Tech | `set-resource` + `grant` |
| 9 | Downtime moves removed or replaced | Feasts (p. 193) | `remove-move`, `add-move` (rule text on back sheet) |
| 10 | New tracked state on the sheet | Wither tokens and scars (Witherwild), scars (Grimdark), Ammo, Endurance countdowns, faction cards | `add-tracker` (kind: boxes or circles, count, label, placement) |
| 11 | Level-up changes | Colossal (p. 199), Tech Upgrade slots per tier | `add-levelup-option`, tracker growth by tier |
| 12 | Optional GM-granted features | Transformations (pp. 42–45) | core entry kind `transformations`, `grant` |
| 13 | Choices with their own constraints | Mixed Ancestry (first feature from one ancestry, second from another), Multiclass | core choice type `pick-one-each-from` |
| 14 | Frame-specific mechanic text needed at the table | all of the above | `back-sheet` text block (title, body) |

Adversary, environment and GM mechanics in these files (Colossal segments, hex crawl, faction cards) do not affect character creation; they stay out of the character pack.

## Draft JSON additions

Builds on the existing `source-pack.schema.json` (`extends`, `content`, `overrides`). Kind-specific fields are still open in the schema; these are the additions.

### Choice types (used by core steps and frames alike)

```json
{ "id": "iconic-weapon", "type": "builder", "fields": [
    { "key": "trait", "options": ["agility","strength","finesse","instinct","presence","knowledge"] },
    { "key": "range", "options": ["melee","very-close","close","far","very-far"] },
    { "key": "damage", "options": ["d6+0","d8+0","d10+0","d12+0"] },
    { "key": "name", "free": true }, { "key": "description", "free": true } ],
  "fixed": { "burden": "two-handed", "feature": "bonded" } }
```

Other types: `pick` (N from a pool, with optional `min`/`max`), `text`, `roll-table`, `pick-one-each-from` (a list of sources, one pick from each).

### Frame operations (ordered, applied in `extends` order)

```json
"creation": { "ops": [
  { "op": "replace-pool", "pool": "weapons", "with": "everyday-hero.weapons" },
  { "op": "insert-step", "before": "traits", "step": "flight-artifact", "choice": "flight-artifact" },
  { "op": "set-resource", "resource": "currency", "name": "Credits", "start": 5 },
  { "op": "annotate", "target": "communities.loreborne", "text": "…", "questions": ["…"] },
  { "op": "add-tracker", "id": "wither", "shape": "box", "count": 20, "label": "Wither tokens", "placement": "front" },
  { "op": "back-sheet", "title": "Make a Feast", "body": "…" } ] }
```

### Tracker (printed only, never stored)

```json
{ "id": "unleash-chaos-tokens", "shape": "circle", "count": { "fromSpellcast": true }, "attachTo": "domainCards.unleash-chaos" }
```

`shape` is `box` (HP, Armor, Stress, frame counters) or `circle` (uses tied to the Spellcast trait). `count` is a number, or derived from the character's Spellcast trait modifier.

## Rule text fields

Each entry has `features: [{ name, kind, rules }]` where `rules` is the SRD text for that feature (verbatim, minus flavor sentences that carry no mechanics). Entries have no printed `description`; any flavor stays only in the SRD Markdown files. `annotate` text follows the same rule: mechanics and questions only.

## Conflict rule

Two packs conflict when both `replace-pool` the same pool, both `set-resource` the same resource differently, or both `insert-step` at the same position with different steps. The wizard's start screen lists conflicts and asks the player to drop one pack; it does not guess.

## Open questions

- Domain cards with a use count equal to a trait (`Spellcast trait`, or Agility, etc.): needs a general `count` expression (`{trait: "agility"}`), not only Spellcast. Check while modelling the 210 cards.
- Print fit: one front sheet for weapon, class, subclass and domain rules may overflow for classes with long feature lists (Druid beastform, Ranger companions). Decide overflow behavior (smaller type vs continuation page) in Series 4.

## Weapons and armor packs

Weapons and armor are separate packs, split out of `srd-core` and `srd-frames`:

- `packs/core/srd-armaments.json` (extends `srd-core`): the 315 SRD weapons and 59 armors (`equipment` entries). `srd-core` keeps items and consumables.
- `packs/core/<frame>-armaments.json` (extends `srd-frames` and `srd-armaments`): one per frame that lists its own gear. It overrides that frame's `pools`, so it holds every pool the frame defines, including Western's one consumable. The frame's ops stay in `srd-frames`, and decide how the list combines with the core list:

| Frame | File | Effect on the core lists |
|---|---|---|
| Everyday Hero | `everyday-hero-armaments.json` (32 weapons, 4 armor) | **Replaces** both the weapon and armor lists (`replace-pool`) |
| Western | `western-armaments.json` (5 weapons, 1 consumable) | **Supplements** the weapon list (`add-to-pool`); the consumable is added as well |
| Monster Hunting | `monster-hunting-armaments.json` (6 weapons, 3 armor; tiered) | **Supplements** the weapon and armor lists (`add-to-pool`) |
| Starfinder | `starfinder-armaments.json` (29 armor; 91 weapons: 41 Starfinder + 50 SRD magic weapons, Tiers 1-2 only until Tier 3-4 are finished; wheelchair weapons not included) | **Replaces** both the weapon and armor lists (`replace-pool`). Own supplement in the Starheart group; sources `scripts/srd-convert/starfinder/armaments-armor.csv` and `Docs/armaments-weapons.csv` (raise `MAX_WEAPON_TIER` in the script for Tiers 3-4), built by `build-starfinder-armaments.mjs` (run after `build-starfinder-pack.mjs`) |
| Tech | none | Replaces the weapon list with a builder choice (Iconic Weapon); no listed gear |

Rules:

- A frame armaments pack must be loaded with its frame. Without it the frame's pool ops resolve to an empty list, so Everyday Hero would leave no weapons or armor at all.
- Build: `build-core-pack.mjs` writes `srd-core` and `srd-armaments`. After `build-frame-pack.mjs`, run `split-frame-armaments.mjs` to move each frame's `pools` into its armaments pack. `build-frame-pack.mjs` is already stale against the committed `srd-frames.json` (the Tech builder options differ), so do not regenerate frames from it without checking the diff.

Combining rule (owner, 2026-10-18): when frames both add to and replace the same pool, only the replacements apply and the adds are dropped. Several replacements of one pool all stay (they add to each other). Neither case is a start-screen conflict any more. Known gap: Western's Revolver Ammo tracker still prints when Western's adds are dropped by a replace.
