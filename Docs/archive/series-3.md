## Series 3: Guided creation wizard
Status: done (all 8 steps; not committed)
Decisions (owner): rules text behind a "details" expander; SRD step order with free jumping back; frame notes and questions shown in the wizard, trackers printed only; structured class extras modelled in this series.
1. [x] Creation engine (`src/engine`, no UI): merge enabled packs + one frame + supplements into available options; detect conflicts (same pool replaced twice, etc.); derive the ordered step list from data
2. [x] Character rules and validation: traits (+2, +1, +1, +0, +0, -1 per the SRD), starting Evasion/HP/Stress 6/Hope 2, thresholds and Armor Score, starting kit, 2 Experiences, 2 domain cards from the class's domains, Mixed Ancestry (`pick-one-each-from`), frame cases (Iconic Weapon builder, Feasts moves, tiered items)
3. [x] Structured class extras in the core pack (currently raw `supplements` text): Druid beastforms, Ranger companion, Brawler stances, other class extras, Multiclassing data; domain-card use counts and trackers (`uses`, `trackers`); regenerate pack, extend schema and tests
4. [x] App shell and start screen: choose frame and supplements, show conflicts before starting, list saved characters
5. [x] Wizard part 1: class, subclass, ancestry, community, traits
6. [x] Wizard part 2: equipment, background, Experiences, domain cards, connections, frame-inserted steps (flight artifact, villain prompts)
7. [x] Navigation and autosave: back/forward, free jump to earlier steps, progress bar, per-step validation, IndexedDB autosave, JSON export/import
8. [x] Review screen: summary, jump back to any step, hand-off to Series 4
