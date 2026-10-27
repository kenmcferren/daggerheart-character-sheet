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
| Starheart class items and questions | `scripts/srd-convert/starfinder/classes.json` (all ten classes) | `classItems` = "Placeholder item"; three `backgroundQuestions` and three `connections`, each "Placeholder question" (owner, 2026-10-26) | Owner to supply; edit `classes.json`, rebuild with `node scripts/srd-convert/build-starfinder-pack.mjs`. A class item string with " or " reads as two options on the Equipment step hint |
| Starheart class effects printed as text only | Sheet, level-up | Buried Protocols (Aspis Sleeper), Creature Feature "Form of ___" and Desperation are new Experiences but do not print on the Experience lines; Electronic Phenomenal Effect (6-card loadout) and Cataloger log are not modelled (loadout is never modelled); Solarian mode and conjurations have no tracker; Witchwarper "Spell cards only" is not applied to a multiclass domain; card word swaps follow the main class only | Experience grants would need a feature field like `experienceGrant` read by `sheetView` |
| Consumables as loot/roll tables or print lists | Nothing yet | Inventory picker is done (Equipment step, `consumables` op); each item carries its roll number (`number`) within its type for future classes/roll tables | Roll-table use waits on the classes that need it |

## Done
| What | Final path | Date |
|------|------------|------|
