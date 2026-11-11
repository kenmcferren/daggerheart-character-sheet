# Ship Advancement: owner rules (2026-11-09)

Source: owner message. Wording of the compartments is the owner's draft.

## Loadout and vault
- Ship loadout is limited to 7 cards.
- New cards go into the vault. Their "While Available" effects are always active.
- Vaulted cards can only be swapped out during a refit.

## Decisions (owner, 2026-11-09)
- Total domain cards = 7 + half the checked advancement boxes (rounded down). The loadout is always 7; the vault holds the rest, so vault capacity = half the checked boxes (owner correction, 2026-11-09).
- In-app Refit / Advance screen on the ship page; ship can open on its own (party ship).
- Any archetype can be any size; player ships are size 2 or 3 for now.
- Rounding is down.
- Changing frame (Bare/Standard/Plated/Bulky: Free HP, Stress, Evasion, thresholds; no card changes) keeps earned advancements, which stack on the new frame's base values. Treated like swapping armor on a character.
- Added compartments show their full text on the sheet.
- Stims roll is d30 over the Stims category (30 items) of the Starheart consumables printout.
- Suit Locker: sheet shows a spot for 2 spare suits, 12 light grey slots each (full armor potential) that the player darkens and marks by hand. Not tracked in the app.

## Advancement
- The GM sets the pace. Advancement can only happen during a refit.
- The player may choose a new frame. Without special permission they can't change the configuration or domains.
- Each advancement: pick one option below and check its box.

| Option | Boxes |
|---|---|
| Gain a Hull Point | 2 |
| Gain a Stress Slot or a Hull Point | 2 |
| Thresholds +1/+2 | 4 |
| Thresholds +1/+1 | 3 |
| +1 Evasion or a Hull Point | 1 |
| Add a compartment | ship size (solo flier 2, catamaran 3) |

- Threshold gains alternate between +1/+2 and +1/+1.

## Compartments
- **Personal Armory:** holds up to 4 weapons, conveniently placed.
- **Stim Lab:** each rest, roll 1d20 on the stims consumables list and gain that consumable.
- **Stasis Chamber:** resting in the ship and Tend Wounds always tends all wounds.
- **Meditation Room:** resting in the ship and Clear Stress always clears all stress.
- **Suit Locker:** keep up to 2 spare suits on board. Marked slots aren't cleared automatically; swap in a few minutes. Rest clears one suit, refit clears all.
- **War Room:** Prepare always gains 2 hope. Each other party member gains 1 hope each rest if they do not Prepare.
- **Gym:** resting in the ship gives +1 to a physical trait until the next rest.
- **Library:** resting in the ship gives +1 to a mental trait until the next rest.

## Engine assumptions (step 2, owner to confirm)
- Each box checked = one take of that option. Boxes per option: Hull 2, Stress/Hull 2, +1/+2 4, +1/+1 3, Evasion/Hull 1, compartments = ship size.
- A Hull Point goes to a system the player picks. HP-per-card applies to the loadout only; vault cards add only their While Available grants (Stress slot, Hull Point).
- Vault cards' Stress/Hull grants are always on, loadout or vault; a card is never in both.
- Ships saved before Series 16 have no `advancement` field and read as empty (no schema bump).
- New cards come from story beats (GM-driven) that coincide with a level-up refit, not from the option list (owner, 2026-11-09). Players add cards whenever the vault has room, so the Refit screen offers "Add card to vault" any time there is a free slot; the engine already allows this and the vault cap is the only limit.
