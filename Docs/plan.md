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
Status: in progress
Decisions (owner): rules text behind a "details" expander; SRD step order with free jumping back; frame notes and questions shown in the wizard, trackers printed only; structured class extras modelled in this series.
1. [ ] Creation engine (`src/engine`, no UI): merge enabled packs + one frame + supplements into available options; detect conflicts (same pool replaced twice, etc.); derive the ordered step list from data
2. [ ] Character rules and validation: traits (+2, +1, +0, +0, -1, -1), starting Evasion/HP/Stress 6/Hope 2, thresholds and Armor Score, starting kit, 2 Experiences, 2 domain cards from the class's domains, Mixed Ancestry (`pick-one-each-from`), frame cases (Iconic Weapon builder, Feasts moves, tiered items)
3. [ ] Structured class extras in the core pack (currently raw `supplements` text): Druid beastforms, Ranger companion, Brawler stances, other class extras, Multiclassing data; domain-card use counts and trackers (`uses`, `trackers`); regenerate pack, extend schema and tests
4. [ ] App shell and start screen: choose frame and supplements, show conflicts before starting, list saved characters
5. [ ] Wizard part 1: class, subclass, ancestry, community, traits
6. [ ] Wizard part 2: equipment, background, Experiences, domain cards, connections, frame-inserted steps (flight artifact, villain prompts)
7. [ ] Navigation and autosave: back/forward, free jump to earlier steps, progress bar, per-step validation, IndexedDB autosave, JSON export/import
8. [ ] Review screen: summary, jump back to any step, hand-off to Series 4

## Series 4: PDF output
Status: in progress
1. [ ] Sheet layout design (owner approves)
2. [ ] `pdf-lib` renderer, fonts, page layout
3. [ ] Print checks (margins, grayscale, long text overflow)

## Series 5: Level-up
Status: in progress
1. [ ] Level-up rules as data (per-tier options)
2. [ ] Guided level-up flow, saved history per character
3. [ ] Regenerate PDF at new level

## Series 6: Custom sources
Status: in progress
Owner (with Claude) writes the third-party ports; no external authors. Packs live in `packs/` and load at build time.
1. [ ] Port third-party packs (campaign frames etc.) using the existing schema
2. [ ] Enable/disable packs per character, conflict handling
3. [ ] Short internal pack-format note in `Docs/`
4. [ ] Optional: runtime pack upload UI (only if wanted)
