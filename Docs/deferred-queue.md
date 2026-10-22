# Deferred / Placeholder Queue

Add a row whenever something ships as a placeholder. Move to Done with the final path when the real thing lands.

## Open
| What | Where used | Current placeholder | Format notes |
|------|------------|---------------------|--------------|
| Real primary-book packs | Loader, UI | Core pack done: `packs/core/srd-core.json` (SRD). Second book (campaign frames) pending, step 3 | Series 2 step 3; keep sample packs as loader fixtures |
| Rest rules as pack data | PDF page 2 (`src/pdf/restRules.ts`) | Hard-coded verbatim SRD p.52 text in a TS constant, each downtime bullet tagged with a move id | Move into `srd-core` as a `rules` entry and load from the pack |
| Trait descriptions, example Experiences | Traits step, Experiences step | Not shown (trait names only; two free-text Experience boxes) | Text lives in `Daggerheart SRD Files/Traits.md` and `Experiences.md`; add behind a details expander |

| Starfinder community rules questions (owner) | `scripts/srd-convert/starfinder/communities.json` | Wording used as written: (1) Hubborne uses "refuel"/"refit" (only "rest" exists in the SRD); (2) Scrapborn Upcycling refers to a "scrap roll" and "consumable table" (SRD Tech scrap table is Shards/Metals/Components; no consumable table); (3) Asanan Learner "any non-violent trait" read as "any action roll that is not an attack"; (4) Cloudborn Weather Vein "mental condition" is not an SRD condition; (5) Domeborn "tech weapon" is not an SRD term (Tech frame has Iconic Weapon); (6) Wary "first attack of a scene is made" (by or against whom?) | Owner to decide; edit `communities.json` `rules`/`short`, rebuild with `node scripts/srd-convert/build-starfinder-pack.mjs` |
| Starfinder community sheet effects not built | Asanan Learner, Hubborne | Text only on the sheet | Asanan Learner is a depleting extra Experience (would need an Experience line with a counter); Hubborne tokens depend on player count |
| Consumables beyond the starting stim | Nothing yet | `scripts/srd-convert/starfinder/consumables.json` holds all 120 (Cypher, Gadget, Ordnance, Stim) | Needs a use: loot/roll tables, an inventory picker, or print lists; owner to decide |

## Done
| What | Final path | Date |
|------|------------|------|
