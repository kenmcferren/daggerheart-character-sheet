# Long-Term To-Do

Out-of-scope ideas and deferred work. Nothing here is in the current step.

- [ ] Attribution: content is from the Daggerheart SRD (owner: royalty/license free, non-monetized). The SRD says it is Public Game Content under the Darrington Press Community Gaming License, © 2026 Critical Role LLC (see `Daggerheart SRD Files/About This SRD.md`). Before publishing, confirm the license's required credit/notice wording and add it to the site footer and PDF.
- [x] `git init` when the owner wants version control
- [ ] Optional: shareable character link / cloud sync (not needed for v1)
- [ ] Optional: dark mode and print-friendly ink-saver sheet variant
- [ ] Optional: PWA/offline install

- (Moved into Series 3 step 3: structured class extras, Multiclassing data, card uses/trackers.) Transformations still to model.

- [ ] Unique iconography for Gold: separate fill-in-bubble shapes for handfuls, bags and chest (currently plain circles).
- [x] Rules math pass: armor/weapon/card features that change numbers (e.g. Mage Robes: bonus to damage thresholds equal to Spellcast trait; "+1 to Evasion" style features) are printed as text only and not applied to Evasion, thresholds, Armor Score. Owner wants a sweep of these "gotchas" after the layout is settled. (Done: Series 7 step 1, owner-reviewed 2026-09-23.)

- [ ] Render markdown tables in campaign rules on the sheet (Tech Scrap table etc. currently print as raw pipe text).

- [ ] Saved versions list (Start screen and character screen) needs a visual touch-up: layout, tree indentation, and how the branch differences (Subclass, Domain cards, Experiences, Multiclass) are shown. Owner to specify.

- [ ] Condense class, subclass, ancestry/community and campaign rules text (pithier wording, fewer line breaks in domain cards) so level 10 sheets fit in 4 pages; do alongside the Series 7 rules math pass. Current level 10 audit: max 6 pages, 63 of 208 paths at 4, 39 at 5, 7 at 6.

- [x] Druid forms special page: print the Beastform definitions (the Druid sheet now says "see SRD for the forms"; the 24 beastforms are not printed anywhere). Owner (2026-09-22): each form should show its own derived stats (Evasion, thresholds, etc.), computed from the character's own sheet plus that form's modifications, not just the raw SRD form text. (Done: Series 8 step 1, 2026-09-23, pending owner review of the sample PDF.)

- [ ] Wizard/character-screen UI touch-up pass (owner, 2026-09-23):
  - [ ] Trait selection layout: 3 per row (physical then mental), or all 6 together. No other row split (currently 5, 1).
  - [ ] Trait value dropdowns: options repeat (—, +2, +1, +1, +0, +0, -1); picking a value in one dropdown removes it from the others' options, except "—" (no selection); picking "—" puts the value back in the others.
  - [ ] Weapons: one per row, format `*Name* · one-handed · Strength Melee · d8+1 phy`, with details on a second row inside the same button, always visible (no show/hide).
  - [ ] Weapon block shouldn't repeat "Primary"/"Secondary" text — already a section header; center that header with rule lines on either side.
  - [ ] Wheelchair becomes its own category (currently folded into Secondary or similar).
  - [ ] Armor: same one-per-row-with-visible-details treatment as weapons.
  - [ ] Equipment categories (Primary, Secondary, Wheelchair, Armor, Potion) should be collapsible sections.
  - [ ] Add a "Save Locally" button next to "Export JSON" and "Make PDF" that returns to the characters screen (data is already autosaved; this is for the "I'm done" feeling of going back).
  - [ ] Tier-achievement Experience bug: when the new Experience is later chosen via the "increase two Experiences" advancement, it lists as literal "x" instead of the Experience text.
  - [ ] Proficiency display: show as dots ("Proficiency ● ● ●") instead of "Proficiency 3", matching the original character sheet's look.
