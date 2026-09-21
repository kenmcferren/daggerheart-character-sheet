# Deferred / Placeholder Queue

Add a row whenever something ships as a placeholder. Move to Done with the final path when the real thing lands.

## Open
| What | Where used | Current placeholder | Format notes |
|------|------------|---------------------|--------------|
| Real primary-book packs | Loader, UI | Core pack done: `packs/core/srd-core.json` (SRD). Second book (campaign frames) pending, step 3 | Series 2 step 3; keep sample packs as loader fixtures |
| Rest rules as pack data | PDF page 2 (`src/pdf/restRules.ts`) | Hard-coded verbatim SRD p.52 text in a TS constant, each downtime bullet tagged with a move id | Move into `srd-core` as a `rules` entry and load from the pack |
| Trait descriptions, example Experiences | Traits step, Experiences step | Not shown (trait names only; two free-text Experience boxes) | Text lives in `Daggerheart SRD Files/Traits.md` and `Experiences.md`; add behind a details expander |

## Done
| What | Final path | Date |
|------|------------|------|
