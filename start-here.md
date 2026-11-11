# Start Here

Read this first every session. Keep it under 30 lines: finished items go to `Docs/archive/`, open ones to `long-term-to-do.md`, standing facts to `CLAUDE.md`.

## Project
Daggerheart guided character creation/level-up website. Output: printable PDF. Local saves. Source-pack architecture. Details: `Docs/plan.md`. Live: https://kenmcferren.github.io/daggerheart-character-sheet/ (push to `main` redeploys).

## Where things stand (2026-11-08)
- Series 1-5, 7-10, 12-15 done and archived (`Docs/archive/`; old step-by-step notes in `Docs/archive/start-here-history.md`). Series 6 is open but on the back burner.
- Series 14 (Starheart ships) is archived. After it: chase summary added to the ship sheet back page (new `Chase Summary` section in `ships.json`, printed before Resting; Chases starts column 2), and back-page text now renders `**bold**`/`*italic*` markup (`cardSegs` in `shipPage.ts`; Keywords are marked by `mark-ship-cards.mjs`). Owner approved the look. Uncommitted.
- Ship data: `scripts/srd-convert/starfinder/ships.json` (hand-edit; never rerun `make-ships-json.mjs --force`), then `node scripts/srd-convert/starfinder/mark-ship-cards.mjs` and `node scripts/srd-convert/build-starfinder-pack.mjs`.

## Very next action
- Series 15 (ship archetypes) and the "Ships section for every character" change are done, committed and live (2026-11-08, owner confirmed on an older character).
- Series 16 (ship advancement) is planned in `Docs/plan.md`; rules and owner decisions in `Docs/starheart-ships/advancement-design.md`. Step 1 (data) done: `advancement` block in `ships.json`, schema and build checks; Stims list is `consumables.json` type `stim` (30). Step 2 (model) done: `src/engine/ship.ts` (advancement on the Ship save, vault, bonuses, take/swap/frame functions) + `tests/ship-advancement.test.ts` (12 tests, green). Step 3 needed no code (saved ships, Hub Ship included, already open on their own from Start). Step 4 done: `src/ui/ShipRefit.tsx`, "Refit and advance" button on the ship Review; driven in the dev server by script (no screenshot, window was hidden). Step 5 done: refit page in `src/pdf/shipPage.ts` (printed only when a ship has advancements or vault cards); sample `TestArtifacts/ship-samples/kestrel-refit.pdf`, owner has not seen it yet. Next: step 6 (owner live check, then archive Series 16). Uncommitted.
- Starheart Experience grants done (2026-11-10, uncommitted): `experience` block on the feature in `classes.json`, `syncGrantedExperiences` in `levelup.ts`, Experience lines in `sheet.ts` grow past 6 and print Desperation as "Desperation (marked HP)"; granted Experiences stay at the bottom of the list. Samples in `TestArtifacts/sheet-samples/` (`starheart-aspis-sleeper-experiences.pdf`, `starheart-infiltrator-l8-experiences.pdf`); owner approved the look 2026-11-10. Aspis Sleeper characters saved before this have shifted Experience indexes.
