# Start Here

Read this first every session. Update as steps finish.

## Project
Daggerheart guided character creation/level-up website. Output: printable PDF. Local saves. Source-pack architecture so third-party sources load the same way as the two primary books. Details: `Docs/plan.md`.

## Current series
- Series 1 archived. Series 2: Primary book data (in progress).

## Current step
- Series 2, step 1 (SRD text and conversion workflow): SRD converted to Markdown in `Daggerheart SRD Files/`; owner review pending. Next is step 2 (core rulebook pack).

## Done
- Series 2, step 1: `Daggerheart SRD.pdf` split into 469 cross-linked Markdown files in `Daggerheart SRD Files/` (entry point `SRD Index.md`; provenance and SRD oddities in `Conversion Notes.md`). Conversion scripts in `scripts/srd-convert/` (README there). Not committed.
- Step 6: invented placeholder packs `packs/sample/sample-core.json` + `sample-extension.json` (extends + override); `tests/sample-packs.test.ts` loads them and resolves a character's ids against the registry. Logged in `Docs/deferred-queue.md`.
- Step 5: `src/engine/character.ts` (model, validator, JSON export/import), `saves.ts` (`CharacterStore` over a `KeyValueStore`), `idbStore.ts` (idb-keyval adapter). 12 tests in `tests/character.test.ts` tagged `[s1]`. Characters store only pack entry ids. Schema version 1; no migrations yet.
- Step 4: `schema/source-pack.schema.json` (ajv-validated), `src/engine/packs.ts` (`validatePack`, `loadPacks`: extends ordering, duplicate-id errors, id-preserving overrides), 13 tests in `tests/packs.test.ts` tagged `[s1]`. Per-kind entry fields (beyond id/name/description) are deliberately open until the SRD shape is known in Series 2.
- Step 3: harness. `Run-All-Tests.bat` (or `node scripts/run-all-tests.mjs`) syncs `TestPolicy/test-master-list.csv`, runs vitest, writes `TestArtifacts/<run-id>/report.html`. Governance = top-level `describe` name must start with `[evergreen]` or `[sN]`; sync fails otherwise. Flags applied by `tests/setup.ts` (0 = skip). `npm test` also honors the list.
- Step 2: Vite/React/TS scaffold, vitest (`npm test`), oxlint (`npm run lint`), folders `src/engine`, `src/ui`, `schema`, `packs`, `tests`. Build, smoke test, lint pass.
- Collaboration scaffolding (CLAUDE.md, backlog, plan, deferred queue, .gitignore, TestPolicy list, memory).
- Series 1-6 drafted in `Docs/plan.md`.

## Unverified
- `idbStore.ts` (real IndexedDB) untested until a UI exists.
- Harness verified from the CLI (run, skip, ungoverned failure); browser auto-open fixed (path escape bug) and confirmed by owner opening the report.
- SRD Markdown files: checked by counts and link checks, not read line by line. Pages checked against images: 101, 102 (hand-transcribed), 193, 194, 196. Details in `Daggerheart SRD Files/Conversion Notes.md`.

## Very next action
- Owner reviews `Daggerheart SRD Files/` (start at `SRD Index.md`), then step 2: design the pack JSON shape from those files and build the core rulebook pack (classes, subclasses, domains + 210 cards, ancestries, communities, equipment).
