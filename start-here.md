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
- Next item from `long-term-to-do.md`: ship advancement (gaining cards, tiers; party ship opened on its own) is the natural follow-on.
