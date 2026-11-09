# Series 15 (archived)

## Series 15: Ship archetypes (built 2026-11-08, owner review of the sample PDFs pending)
A ship's two domains (6 domains, 15 pairs) give it an **archetype**: a name and one or two features, like a pseudo-class. Owner's source list: `Docs/starheart-ships/ship-archetypes-source.md`.
Owner answers (2026-11-08): automatic from the domain pair; prints beside the tracks where "Primary systems" is, with the Breached/Disabled notes moved to full-width lines below the boxes and above the token trackers; tech resistance = resistance to tech damage (SRD); character tier = the pilot's tier; spelling "Hydra"; Specter has one feature on purpose; Analysis/Power trackers also print when the archetype uses them.
1. [done] Wording in `ships.json` `archetypes` (made by `scripts/srd-convert/starfinder/add-archetypes.mjs`; hand-edit now). Wording changes to confirm: "reload one domain card" reads "refill one card's Reload Tokens" (the keyword's meaning); Wraith/Golem/Alchemist/Revenant say "you can" where the source implied a choice; Alchemist's "each can be chosen only once" reads "choose a different benefit for each token".
2. [done, tunings applied 2026-11-08 per the owner's rulings] Power check: `Docs/starheart-ships/reports/archetypes.md` (hand estimate with the Series 14 model; 3 strong, 4 weak or niche, rules gaps and suggested tunings listed).
3. [done] Schema `extend-schema-s15.cjs`, pack build, `archetypeOf` and archetype tokens in `src/engine/ship.ts`.
4. [done] Wizard Domains step shows the archetype; Review shows its name.
5. [done] PDF `src/pdf/shipPage.ts`: archetype at the largest size (8.5 down to 6.5 pt) that fits beside the tracks; all 15 print at 8 pt or more.
6. [done] Creation rule change (owner, 2026-11-08): frame Free HP down by 1 (Bare 1, Standard 2, Plated 3, Bulky 4) and 7 domain cards instead of 6 (`ships.json` `frames`, `build.cards`; `v-final.md` updated). Track columns on the ship front narrowed so every archetype prints at 8.5 pt.
7. [done] Tests in `tests/starheart-ships.test.ts` (`[s15]`, 3 tests, plus the archived `[s14]` ones re-run green). Samples `TestArtifacts/ship-samples/`. Archive after owner review.
