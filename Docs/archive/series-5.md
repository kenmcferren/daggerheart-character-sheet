## Series 5: Level-up
Status: done (archived 2026-09-22)
Scope: levels 2-10 for the SRD classes. New equipment is NOT in this series (its own series later). Rules math (armor bonuses etc.) stays Series 7.

Rules being modelled (SRD `Leveling Up.md`, `Multiclassing.md`): tier achievements (levels 2, 5, 8: new Experience at +2, Proficiency +1, clear marked traits at 5 and 8); two advancements per level from your tier or below, each with limited slots; damage thresholds +1 (automatic); one new domain card at or below level (or swap one old card). Preclusions to enforce: traits marked until next tier; Proficiency and Multiclass each cost both advancements; multiclass only once, needs level 5+, crosses out that tier's upgraded-subclass option (and vice versa); upgraded subclass goes foundation -> specialization -> mastery; multiclass domain cards limited to half level rounded up.

Design decisions (proposed):
- **History is the source of truth.** `Character.history` is an ordered list of level records, one per level gained: level, tier-achievement results (new Experience text), the two advancements with their details (which traits, which two Experiences, which card, which subclass card, which multiclass class/domain/subclass), the new domain card, and an optional swap (card out, card in). Everything else (level, traits, HP/Stress slots, Evasion, Proficiency, Experience modifiers, subclass cards held, multiclass, domain cards) is derived by replaying the log with one engine function, so a saved character can always answer "what was chosen, and when".
- Schema version 2 with a migration from v1 (v1 characters = level 1, empty history; any old `levelUpChoices` is mapped or dropped).
- **Snapshots per level, with branches (owner Q3).** Finishing a level saves a full snapshot of the character (its history log included). Each snapshot has an id, a parent snapshot id, and its level. Rules:
  - Edits made within a level (new gear, notes, etc.) overwrite that level's current snapshot.
  - Loading an earlier snapshot and leveling again never overwrites existing snapshots: it creates new snapshots (a branch). Example: a level 5 warrior reopened at level 3 and leveled to 5 again keeps both level 4 and level 5 versions.
  - The app lists a character's snapshots as a tree (level, parent, saved time) and opens any of them; that is the undo. No "edit an earlier record" feature.
  - Saved list shows one entry per character (its newest snapshot) with a "versions" view; delete works per snapshot or for the whole character.
  - Snapshots are stored in IndexedDB and included in JSON export (whole family in one file; a single version can also be exported).
- The engine validates each record against the replayed state up to that point and returns human reasons ("Multiclass is already taken", "Traits marked until level 5") so the UI can disable options with a reason.
- Level-up rules are pack data (`levelUpOptions` per tier: id, slots per tier, cost, exclusions, effect kind) so packs can add or replace options later. The engine handles a fixed set of effect kinds.

Steps:
1. [x] Level-up rules as data: tier achievements + advancement options with slots per tier, cost, and exclusion groups, in the core pack (generated from the SRD by script); schema + pack tests. Includes the class-specific options already parsed (Multiclass, Ranger companion upgrades, Brawler combo die).
2. [x] History model and snapshot store: schema v2 + migration, snapshot tree (save per level, branch on re-level), `applyLevelUp` / `validateLevelUp` / `replay` in `src/engine`, derived stats read from replay (`deriveStats` at any level). Tests for every preclusion.
3. [x] Guided level-up flow (UI): "Level up" on a saved character; steps = achievements, two advancements (unavailable ones shown with the reason), domain card / swap, review; history view and version tree on the character (open any version = undo); autosave.
4. [x] Sheet at level N: subclass specialization/mastery, multiclass module (class feature, borrowed domain, foundation card), proficiency circles, Experience modifiers, extra HP/Stress slots, card list, class-specific upgrades; PDF regenerated from replay.
5. [x] Leveling-pattern space audit: automated matrix of legal paths x classes rendered and checked with the existing print checks (margins, grayscale, page count budget); decide overflow policy from the results.
6. [x] Owner review of sample sheets at levels 3, 5, 8, 10; class extras placement (multiclass stances/companion, tracker row, header wording); level-up UI click-through; fixes; archive.

Leveling-pattern test matrix (step 5). Named patterns, run for all 13 classes: (a) all-subclass (foundation + specialization + mastery, the longest class-feature column); (b) multiclass at 5 then max out (two class modules + three subclass cards); (c) max HP/Stress slots; (d) traits-heavy (marks cleared each tier); (e) Experience-heavy (many notes) ; (f) proficiency-first; (g) card-swap-heavy (long domain card lists to 10 + extra card advancements); (h) each class's own extras (Beastbound companion upgrades, Martial Artist combo die, wizard-length text). Plus seeded random legal paths (reproducible, seed logged with `run.json`). Asserts: every path validates, replay is deterministic, sheet stays in margins and grayscale, page count within budget. Known space risks: class-features column (three subclass cards + multiclass), 6 Experience lines, HP/Stress row caps (12), domain card pages.

Open questions (owner):
1. ANSWERED (owner supplied the level-up sheet image). Slots per tier: traits x3 (mark, +1 to two traits each), HP x2, Stress x2, Experience +1 to two x1, extra domain card x1 (tier 2: up to level 4; tier 3: up to 7; tier 4: any), Evasion x1. Tiers 3 and 4 add: upgraded subclass card x1, Proficiency +1 x2 (costs both advancements), Multiclass x2 (costs both advancements). Tier 2 has no subclass, Proficiency or Multiclass option. Earlier-tier slots stay open in later tiers (printed sheet wording; owner confirmed in Q5, overriding an earlier clarification). The Multiclass box crosses out one unused upgraded-subclass option and the other multiclass option.
2. ANSWERED: A. Only current state prints; the log stays in the app.
3. ANSWERED: snapshot per level with branching (see design above).
4. ANSWERED: A. One level at a time, repeatable.
5. ANSWERED: B. Follow the sheet; unmarked slots from earlier tiers stay available (an option is any tier at or below the current one, and its slots are counted per tier).

