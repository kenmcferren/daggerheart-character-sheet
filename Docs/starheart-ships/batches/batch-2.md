# Batch 2: Transport cards (Series 14, step 4)

Status: drafted 2026-11-07, waiting on owner. Nothing applied to `v1-working.md` yet. Source: `source-v0.md` Transport section (27 cards). Defense data: `reports/defense.md`, made by `node scripts/starheart-ship-defense.mjs > Docs/starheart-ships/reports/defense.md`.

## Wording rules (same as Batch 1, plus)
- Movement: "move to a point within Close range" (SRD wording; the draft had "move a Close distance").
- "in their loadout or vault" is written as "available" (the While Available keyword).
- "Environmental effect" is written as "environment", the SRD term for a hazard's stat block.
- Halved damage is written as SRD **resistance** (Faraday Cage).
- Proposed keyword addition: "**Transport roll** (or Weapons roll, and so on) means an Action Roll or a Reaction Roll for that system." Several cards say "Transport roll" and mean both.

## Power check
Transport cards mostly protect and move, so the damage model doesn't fit them. The new defense yardstick works out how much protection is worth, in Hull Points not marked per scene. It assumes a Standard frame (Evasion 13, thresholds 9/20) and every SRD adversary's standard attack, with 8 incoming attacks per scene (4 rounds, 2 attacks a round).

- **Incoming:** about 0.64 HP per attack at Tier 1 (5.2 per scene) and 0.96 at Tier 2 (7.7 per scene).
- **+1 Evasion against everything** saves about 0.5 HP per scene at Tier 1; **+2** saves about 1.05. **Resistance to all damage** saves about 1.3.
- **Exchange rate used:** one Weapons benchmark use (1.17 HP) is worth about one action. A Hope or a Stress is worth about 1 HP (Batch 1 costed cards sat near 2x the benchmark for one Hope or Stress).

| Card | What it's worth | Verdict |
| :-- | :-- | :-- |
| Desperate Charge | No limit: every Stress clears a Transport HP, any number of times a spotlight | **Too strong.** Once per spotlight. |
| Sharp Edges | 1 Stress = 1 HP to a Melee target, no roll, every spotlight (about 3 HP a scene on top of your attacks) | **Too strong.** Once per scene. |
| Fleet Transponder | Once per Refit (a week) | **Too weak** to use. Once per Refuel. |
| Defensive Sync | +1 Evasion against one ship (about 0.15 HP per scene), but you can only pick the target once per Refuel, and Studied Target ends with the scene | **Too weak.** Once per scene. |
| Fluid Motion | 1 Hope for +2 Evasion until your next spotlight, about 0.25 HP | **Too weak** for its cost. Drop the Hope cost. |
| Engine Sync | Half a trait (+1) against one Locked ship, about 0.1 to 0.2 HP per scene | **Too weak.** Full trait (about +2). |
| Void Cohesion | +2 Evasion, always on (about 1.05 HP per scene), needs 4 Void cards | Fine. |
| Faraday Cage | Resistance to tech while Transport HP are unmarked (about 0.6 HP per scene if half the incoming damage is tech) | Fine. |
| Blindspot | 1 Stress: one ship can't target you while you stay close (about 2 HP against a solo that targets you) | Fine; best against solos. |
| Warp Draw | 1 Stress: each chosen ship that starts in your Cloud marks 1 HP if it moves | Fine (about a costed Weapons card), and it pins ships in place. |
| Warpfield Strain, Spore Cloud, Mirage Cloud | 1 Stress for area Stress, disadvantage or untargetable at range | Fine. |
| Self Repair | Up to 3 Hope for 3 HP, once per Refuel | Fine (1 for 1). |
| Calculations Confirmed | About 1 Hope per scene | Fine. |
| Energy Transference, Punch Through, Dense Frame, Reflective Hull, Prey Drive | Each grants +1 Transport HP or +1 Stress slot, plus a small effect | Fine. Punch Through is the strongest (advantage on every Transport Reaction Roll). |
| Writhe, Cold Steel | Only matter around Forced Docking | Narrow. Writhe mostly cancels the disadvantage on making or breaking a Forced Docking (advantage doesn't stack, and resisting already has advantage). Kept as is. |
| Pod Travel, Churn Rider, Predictive Pathways, Overdrive, Power Reroute | Movement and tokens | Fine. |

## Proposed text
Changes from the draft are listed under each card.

### Flesh
**Prey Drive,** *Transport, Flesh Domain.* **Mark a Stress** to add the number of your marked Transport Hull Points to your next Transport Action Roll this spotlight. **While Available:** You have an extra Stress slot.
- Wording only.

**Writhe,** *Transport, Flesh Domain.* While you have any Hope, you have advantage on rolls to make, resist or break free of a Forced Docking.
- "all rolls involving Forced Docking" written out.

**Self Repair,** *Transport, Flesh Domain.* Once per Refuel, spend up to 3 Hope to clear that many Hull Points from one system.
- Wording only.

**Fluid Motion,** *Transport, Flesh Domain.* When you make a Transport Action Roll with Hope, you gain +2 Evasion until the start of your next spotlight.
- Power: no Hope cost (was "spend a Hope").

**Pod Travel,** *Transport, Flesh Domain.* When you move, you can make a Transport Action Roll against the highest Difficulty among adversaries within Close range. On a success, you, every ally with Pod Travel available, and one other ally can each move to a point within Close range. On a failure, you move alone.
- The first sentence ("You can take a willing ship with you when you move") is dropped, since the rest of the card says who comes. See Q2.

**Spore Cloud,** *Transport, Flesh Domain.* **Mark a Stress** to create a Cloud. Attacks against targets in your Cloud have disadvantage. Locked ships in your Cloud lose the Locked condition.
- "lose that condition when they enter" -> any Locked ship in the Cloud, including when you create it. See Q4.

### Mind
**Predictive Pathways,** *Transport, Mind Domain.* When you Refuel or Refit, gain 3 Analysis Tokens. When another ship moves into Close range of you, you can spend an Analysis Token to move up to Close range away from it as a reaction.
- Wording only.

**Blindspot,** *Transport, Mind Domain.* **Mark a Stress** to slip into the blindspot of a ship within Very Close range. That ship can't target you while you're in its blindspot. This ends when you choose, when either ship starts a spotlight farther than Very Close from the other, or when you use this card on another ship.
- Wording only.

**Engine Sync,** *Transport, Mind Domain.* **With Lock:** Add the trait you use for Transport rolls to your Evasion against the Locked target's attacks.
- Power: half the trait -> the full trait.

**Calculations Confirmed,** *Transport, Mind Domain.* Once per scene, when an attack misses you, gain a Hope.
- No change.

### Void
**Energy Transference,** *Transport, Void Domain.* When you mark any Hull Points, you can **spend a Hope** to clear a Stress as a reaction. **While Available:** You have an extra Transport Hull Point.
- Wording only.

**Warpfield Strain,** *Transport, Void Domain.* **Mark a Stress.** Until the end of this spotlight, each adversary with an unmarked Stress that you fly within Very Close range of marks a Stress.
- Wording only.

**Void Cohesion,** *Transport, Void Domain.* While you have 4 or more Void cards in your loadout, you have +2 Evasion.
- Wording only.

**Warp Draw,** *Transport, Void Domain.* **Mark a Stress** to create a Cloud. Ships you choose that start their spotlight in your Cloud mark a Hull Point if they move.
- Wording only.

### Energy
**Overdrive,** *Transport, Energy Domain.* When you succeed on a roll with Hope, you can **mark a Stress** or spend a Power Token to move to a point within Close range, even if you've already moved this spotlight.
- Wording only.

**Desperate Charge,** *Transport, Energy Domain.* Once per spotlight, **mark a Stress** to clear a Transport Hull Point. For the rest of this spotlight, add the number of your marked Stress to your Transport rolls.
- Power: once per spotlight.

**Power Reroute,** *Transport, Energy Domain.* When you make a non-Transport action roll with Hope, you can gain a Power Token. Spend a Power Token to gain advantage on a Transport roll.
- Wording only.

### Metal
**Fleet Transponder,** *Transport, Metal Domain.* Once per Refuel, when an ally within Close range fails a Transport roll with Hope, you can **mark a Stress** to make it a success with Fear instead.
- Power: once per Refit -> once per Refuel.

**Cold Steel,** *Transport, Metal Domain.* This card holds 2 Reload Tokens. When you succeed on a Forced Docking, or a ship fails a Forced Docking against you, that ship marks a Stress, and you can spend a Reload Token to make it mark a Hull Point.
- Wording only. The refill line is now in the Reload Tokens keyword.

**Punch Through,** *Transport, Metal Domain.* You have advantage on Transport Reaction Rolls. When an environment makes you mark Hull Points, mark 1 fewer. **While Available:** You have an extra Transport Hull Point.
- Wording only.

**Faraday Cage,** *Transport, Metal Domain.* While any of your Transport Hull Points are unmarked, you have resistance to tech damage.
- "all Tech damage dealt to you is halved" -> SRD resistance (halves the damage).

**Dense Frame,** *Transport, Metal Domain.* Rolls to move your ship against your will have disadvantage, and you have advantage on rolls to resist them. While you are docked only to ships your size, you can make Transport Action Rolls with disadvantage. **While Available:** You have an extra Transport Hull Point.
- Wording only.

### Glass
**Sharp Edges,** *Transport, Glass Domain.* When you break free of a Forced Docking, the ship you were docked to marks a Hull Point. Once per scene, you can **mark a Stress** to make a ship within Melee range mark a Hull Point.
- Power: once per spotlight -> once per scene.

**Churn Rider,** *Transport, Glass Domain.* When a larger ship within Very Close range moves, you can **spend a Hope** to move with it as a reaction, to a point within Close range of where you started.
- Wording only.

**Mirage Cloud,** *Transport, Glass Domain.* **Mark a Stress** to create a Cloud. Ships in your Cloud can't be targeted by ships at Far range or farther from them. At the end of each of your later spotlights, you can **spend a Hope** to create your most recent Cloud again at your position.
- "Creatures" -> ships. "each subsequent spotlight" read as your own spotlights (Q3).

**Defensive Sync,** *Transport, Glass Domain.* Once per scene, you can make a ship within Far range your Studied Target. You have +1 Evasion against your Studied Target's attacks. When its attack misses you by 1, gain a Hope.
- Power: once per Refuel -> once per scene. The +1 Evasion and Hope now apply to any Studied Target, however you picked it.

**Reflective Hull,** *Transport, Glass Domain.* When you mark a Transport Hull Point while none are marked, you can make a ship within Very Close range mark a Hull Point. **While Available:** You have an extra Transport Hull Point.
- "your first Transport HP" written so it can trigger again after repairs (Q5).

## Questions
1. Power fixes: (A) approve all six (Desperate Charge, Sharp Edges, Fleet Transponder, Defensive Sync, Fluid Motion, Engine Sync), or (B) list the ones you want kept as drafted?
2. Pod Travel: (A) drop the "take a willing ship with you" sentence, as above, or (B) keep it as a separate effect (please say what it adds)?
3. Mirage Cloud, "at the end of each subsequent spotlight": (A) your own later spotlights, or (B) any spotlight, yours or anyone's?
4. Spore Cloud: (A) every Locked ship in the Cloud loses Locked, including when you create it, or (B) only ships that enter it?
5. Reflective Hull, "your first Transport Hull Point": (A) any time you mark one while none are marked (it can trigger again after repairs), or (B) once per scene?
6. Keyword: (A) add "a Transport roll means an Action Roll or a Reaction Roll for that system", or (B) write it out on each card?

## Owner answers (2026-11-07), applied to `v1-working.md`
1. A: all six usage changes.
2. A.
3. A, at the start of your spotlight. Owner intent: Mirage Cloud keeps a Cloud from vanishing; it must not bring back a Cloud from an earlier scene. New wording: "At the start of your spotlight, you can **spend a Hope** to move your active Cloud to your position and keep it from dissipating." (The Cloud keyword already implies one Cloud at a time: creating a new one replaces the old.)
4. A.
5. A.
6. "Transport roll" means either an Action Roll or a Reaction Roll; cards name one only when it matters. Added to the Systems section, not as a separate keyword.
- Batch 2 done.
