# Plan

Finished series move to `Docs/archive/`.

## Product
Guided Daggerheart character creation + level-up website. Output is a printable PDF sheet, not a live sheet. Priorities: easy navigation, local saves, clean PDF.

## Stack (recommended, pending owner OK)
- Vite + React + TypeScript (types catch source-pack data errors), plain CSS modules.
- Static site, no backend; deploy anywhere static (GitHub Pages / Netlify).
- Saves: IndexedDB (via `idb-keyval`) plus JSON export/import of a character file.
- PDF: `pdf-lib`, drawing onto a designed sheet template in code (deterministic, works offline in browser).
- Tests: Vitest; master-list harness per CLAUDE.md section 3 (runtime = `src/engine`, UI separate).

## Core architecture: source packs
- Every rule/content source (the two primary books AND future third-party material) is a **source pack**: a JSON file validated against one schema (`schema/source-pack.schema.json`).
- Primary books load through exactly the same loader as custom packs. No hardcoded book content in the engine.
- A pack declares: id, name, version, publisher, and content lists (classes, subclasses, ancestries, communities, domains, domain cards, equipment, campaign frames, level-up options, etc.), plus optional `extends`/`overrides` by id.
- Engine is data-driven: creation and level-up steps are derived from the active packs.
- The user picks campaign frame + enabled sources first; the choice is stored on the character.
- Custom pack import (Series 4) = file upload into IndexedDB, validated, listed alongside primary packs.

## Series 1: Foundation and data model
Archived: `Docs/archive/series-1.md`.

## Series 2: Primary book data
Archived: `Docs/archive/series-2.md`.

## Series 3: Guided creation wizard
Archived: `Docs/archive/series-3.md`.

## Series 4: PDF output
Archived: `Docs/archive/series-4.md`.

## Series 5: Level-up
Archived: `Docs/archive/series-5.md`.

## Series 6: Custom sources
Status: in progress
Owner (with Claude) writes the third-party ports; no external authors. Packs live in `packs/` and load at build time.
1. [ ] Port third-party packs (campaign frames etc.) using the existing schema
2. [ ] Enable/disable packs per character, conflict handling
3. [ ] Short internal pack-format note in `Docs/`
4. [ ] Optional: runtime pack upload UI (only if wanted)

## Series 7: Rules math pass
Status: step 1 done, owner-reviewed 2026-09-23. Step 2 (condense text for the 4-page level 10 target): 2a-2d done, owner "checks out at first glance" 2026-09-23 (Cruel Precision prints the higher of Finesse/Agility, approved). Every non-Druid level 10 path is 3-4 pages; Druid paths are 6 (Beastform page). Bare Bones armor math left as text (Series 7 math, not scheduled).
Apply number-changing features to the sheet (e.g. Mage Robes: bonus to damage thresholds equal to Spellcast trait; "+1 Evasion" style features). Start by listing every armor, weapon, card and class feature that changes a number; owner approves the list before code.

Step 2: condense text for the 4-page level 10 target (owner, 2026-09-23). Same procedure as the class shorts (hand-edited `short` wording, draft, owner approves each step). Look for chances to present material as tables. Each step gets its own owner review before the next.
- [x] 2a. All ancestries (`scripts/srd-convert/short-heritage/ancestries.json`)
- [x] 2b. All communities (`short-heritage/communities.json`)
- [x] 2c. All campaign rules (owner decision: Witherwild class/ancestry/community notes are creator-only, not printed)
- [x] 2d. Domain cards, one domain per step, alphabetical, all 10 drafted (owner reviews at the end; review files `TestArtifacts/short-review/domain-<id>.md`) (Arcana, Blade, Bone, Codex, Dread, Grace, Midnight, Sage, Splendor, Valor) via `short-heritage/domains/<domain>.json`, each its own owner review

## Series 8: Druid forms page
Status: step 1 done, pending owner review.
1. [x] Print all 24 Beastforms (Tier <= character's tier) as their own page after the domain cards, Druid main class only. Derived stats per form (trait total, Evasion, thresholds, Proficiency dice for damage) computed against the character's own sheet, not raw SRD text. Legendary Beast / Mythic Beast (upgrade templates, no fixed stats) print as text only.
