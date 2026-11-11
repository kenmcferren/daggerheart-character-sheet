# Start Here

Read this first every session. Keep it under 30 lines: finished items go to `Docs/archive/`, open ones to `long-term-to-do.md`, standing facts to `CLAUDE.md`.

## Project
Daggerheart guided character creation/level-up website. Output: printable PDF. Local saves. Source-pack architecture. Details: `Docs/plan.md`. Live: https://kenmcferren.github.io/daggerheart-character-sheet/ (push to `main` redeploys).

## Where things stand (2026-11-10)
- Series 1-5, 7-10, 12-16 done and archived (`Docs/archive/`; old step-by-step notes in `Docs/archive/start-here-history.md`). Series 6 is open but on the back burner.
- Series 14 (Starheart ships) is archived. After it: chase summary added to the ship sheet back page (new `Chase Summary` section in `ships.json`, printed before Resting; Chases starts column 2), and back-page text now renders `**bold**`/`*italic*` markup (`cardSegs` in `shipPage.ts`; Keywords are marked by `mark-ship-cards.mjs`). Owner approved the look. Uncommitted.
- Ship data: `scripts/srd-convert/starfinder/ships.json` (hand-edit; never rerun `make-ships-json.mjs --force`), then `node scripts/srd-convert/starfinder/mark-ship-cards.mjs` and `node scripts/srd-convert/build-starfinder-pack.mjs`.

## Very next action
- Series 16 (ship advancement, with refit) done, archived (`Docs/archive/series-16.md`), committed and live; owner live check passed 2026-11-10. Its `[s16]` tests are set to skip.
- No series is open. Pick the next item from `long-term-to-do.md`.
- Starheart Experience grants done (2026-11-10, committed and live): `experience` block on the feature in `classes.json`, `syncGrantedExperiences` in `levelup.ts`, Experience lines in `sheet.ts` grow past 6 and print Desperation as "Desperation (marked HP)"; granted Experiences stay at the bottom of the list. Samples in `TestArtifacts/sheet-samples/` (`starheart-aspis-sleeper-experiences.pdf`, `starheart-infiltrator-l8-experiences.pdf`); owner approved the look 2026-11-10. Aspis Sleeper characters saved before this have shifted Experience indexes.
- Uncommitted (2026-11-11): sheet-gap pass. Multiclass Druid Beastforms print; flat weapon attack bonuses (Reliable, Tracer Fire, Tech Converge/Target) fold into the attack modifier; loadout/vault now self-policed on the sheets (see `Docs/archive/long-term-done.md`). Samples regenerated in `TestArtifacts/`; owner has not looked at them. `Run-All-Tests.bat` needs a run to resync the master list (one ship test renamed).
