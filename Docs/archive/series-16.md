# Series 16 (archived)

## Series 16: Ship advancement (built 2026-11-09, committed 2026-11-10, owner live check passed 2026-11-10)
Rules and owner decisions: `Docs/starheart-ships/advancement-design.md`.
1. (DONE 2026-11-09) Data: advancement options and the 8 compartments in `ships.json` (plus build script); locate the Stims list in the consumables pack.
2. (DONE 2026-11-09) Model: ship saves gain loadout (7), vault (floor(checked boxes / 2); total cards = 7 + that), checked advancement boxes, compartments, frame; stacking rules for thresholds (alternating +1/+2, +1/+1), Evasion, HP, Stress.
3. (DONE 2026-11-09, already worked: Start > Saved ships opens any ship, Hub Ship included, on Review; the Refit button goes on Review in step 4) Ship opens on its own (party ship) from the start screen / saved list.
4. (DONE 2026-11-09, checked in the browser by script, not by eye) Refit / Advance screen: check boxes, pick options, swap loadout/vault, change frame, add compartments.
5. (DONE 2026-11-09, owner to judge the look) Ship sheet: advancement track, compartments with full text, Suit Locker spare-suit spots (2 x 12 light grey slots), Stims d30 roll.
6. (DONE 2026-11-10) Tests in `tests/ship-advancement.test.ts` (`[s16]`); owner checked refit live, working.
