# Batch 5b: second pass, rules against cards (Series 14, step 7)

Status: answered and applied 2026-11-07; text work closed (`v-final.md`, `reports/summary.md`). Read every card against the rules section, looking for terms the cards use that the rules never define, and rules the cards quietly break. Leftover old terms (Maelstrom, "turn", "fully marked", "magical", "you may", "speed"): none left.

## Findings

### 1. Ranges and moving aren't in the printed rules
Cards say "move to a point within Close range", "even if you've already moved this spotlight", and use Melee to Very Far everywhere. The rules only cover moving inside a Chase ("your normal move within Close range"), and the ranges are only in the unprinted design notes. Proposed new section after Characters and Ships, mirroring the SRD's Movement Under Pressure (Agility Roll -> Transport Action Roll):

> ## Ranges and Moving
> - Ship scenes use the usual ranges (Melee, Very Close, Close, Far, Very Far), scaled to space.
> - When you make an action roll, your ship can move to a point within Close range as part of it. To move farther, or to move without making an action roll, succeed on a Transport Action Roll.

### 2. Spore Cloud breaks your own party's Lock
"Locked ships in your Cloud lose the Locked condition." If the party's Locked adversary is in the Cloud, the party loses its Lock too. The card protects allies, so proposed:

> **Spore Cloud,** *Transport, Flesh Domain.* **Mark a Stress** to create a Cloud. Attacks against targets in your Cloud have disadvantage. Allies in your Cloud lose the Locked condition.

### 3. Reload Tokens on a new ship
A Refuel ends all tokens, and you pay a Hope or Stress to refill a Reload card (owner, Batch 0b). Nothing says whether a brand-new ship's Reload cards start full or empty. Proposed, added to creation step 5: "Cards that hold Reload Tokens start full."

### 4. Negative traits
Synced Arcana (Science trait to thresholds) and Engine Sync (Transport trait to Evasion) add a trait, and a trait can be 0 or -1. A player won't take Synced Arcana with a -1 Science trait, but on the Hub Ship a different pilot uses their own traits, so the card can turn into a penalty mid-campaign. Small, and fixable with "if it's positive". Recommendation: no change; the party picks the pilot.

## Checked and fine
- **Lock size limit** applies to every card that Locks, including the ones with no roll (Slighted Spite, Advanced Targeting, Scanning Array); the Locks section already says so.
- **Several Cloud cards on one ship:** one Stress creates one Cloud with all the Cloud features you choose (Cloud keyword), and Pulsar Mine can make it for free. This was decided in Batch 0b and works as a deliberate engine.
- **Arcanic Connection** is the explicit exception to "character features don't work in ship scenes".
- **Hope:** Phase Alignment, Calculations Confirmed and the rest spend or gain the pilot's Hope (Pilot keyword); adversary ships have none.
- **Studied Target** cards all agree with the new keyword (one at a time, ends with the scene unless Quantum Entanglement says otherwise).
- **Damage types:** physical, magic and tech, the same as Starheart characters (Series 12).

## Questions
1. Add the Ranges and Moving section as written: yes or no?
2. Spore Cloud: (A) only allies lose Locked, or (B) keep it as written, so any ship does?
3. Reload cards start full on a new ship: yes or no?
4. Synced Arcana and Engine Sync: (A) no change, or (B) add "if it's positive"?
5. After these, should I (A) write `v-final.md` and the summary and close the text work, or (B) do another pass?

## Owner answers (2026-11-07), applied to `v1-working.md` and `v-final.md`
1. Yes: Ranges and Moving section added before Resting.
2. B: Spore Cloud kept as written (any Locked ship in the Cloud loses Locked, including the party's target).
3. Yes: added to creation step 5.
4. B: Synced Arcana and Engine Sync add the trait "if it's positive".
5. A: `v-final.md` and `reports/summary.md` written; text work closed.
