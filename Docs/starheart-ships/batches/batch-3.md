# Batch 3: Science cards (Series 14, step 5)

Status: drafted 2026-11-07, waiting on owner. Nothing applied to `v1-working.md` yet. Source: `source-v0.md` Science section, minus Critical Point Tracking (moved to Weapons in Batch 1), plus Scanning Array (moved from Weapons, Batch 1 wording). 27 cards. The Science/Void "Energy Drain" is **Charge Extraction** (owner, review Q6).

## Wording rules (same as Batches 1-2, plus)
- "Reduce the damage by 1 threshold" is written as the SRD armor wording: "reduce the severity by one threshold".
- "Locking roll" / "acquire a Lock" -> "roll to Lock" / "Lock a ship".
- "Spellcasting trait" -> "Spellcast trait" (SRD term).
- "Even across impossible distances" -> "at any distance".
- "drone sized" -> "size 1".

## Power check
Science cards mostly Lock, heal and buff. Yardsticks:
- **Hope, Stress, HP:** about 1 for 1 (Batches 1-2).
- **A Weapons use:** 1.17 HP (Tier 1), 1.39 (Tier 2).
- **+1 Proficiency on an ally's attack:** about +0.45 HP at Tier 1 and +0.2 at Tier 2, across Pd6+4, Pd8 and Pd10+4 attacks. **+1d8 damage** is about the same, +0.5 / +0.2.
- **Defense:** +1 Evasion is worth about 0.5 HP per scene, and resistance to all damage about 1.3 (`reports/defense.md`).

| Card | What it's worth | Verdict |
| :-- | :-- | :-- |
| Gravitational Lens Drive | Free and always on while you have unmarked Stress: +1 Proficiency to every chosen attack passing near you. Three allies at half uptime is about +2.5 HP per scene; full uptime about +5. | **Too strong.** Costs a Stress, lasts until your next spotlight (about +1.3 HP per Stress with three allies lined up). |
| Electron Beam | 1 Stress and an action for a 65% chance that an ally clears 2 Stress (net +1 if you target yourself) | **Too weak.** No Stress cost. |
| Electrified Field | 1 Stress: +1d8 to attacks made from inside the Cloud (about +0.5 HP each), plus a Hope | Fine. Adversaries inside get it too (friendly fire, as in Batch 1). |
| Pulse Beacon | 1 HP: an area where adversaries you succeed against are Vulnerable, plus a Lock | Fine if the roll is made once (Q3). |
| Opportunistic Analysis | 1 Analysis Token: Vulnerable after any damage you deal | Fine; one of the best party buffs. |
| Advanced Targeting | Free re-Lock of your Studied Target every spotlight | Fine on its own. Joins the Batch 5 combo watch (with Critical Point Tracking and Dissection Ray). |
| Manual Inspection, Self Repair (Transport) | 1 Hope = 1 HP | Fine, and consistent with each other. |
| Synced Arcana | +Spellcast trait to both thresholds (about +2), Lock with Spellcast | Fine. Depends on the pilot, so the sheet shows it as a footnote, not a fixed number. |
| Warded Hull, Hull Cannibalization, Innervation, Charge Extraction, Oscillating Power Supply | Converters (tokens, HP, Hope, Stress) at about 1 for 1, or 2 for 1 | Fine. |
| Chaos Drive | 1 Stress for +Fear (about +3) on a non-Weapons roll | Fine. |
| Slighted Spite, Close Range Scanning Battery, Anticipatory Neurons, Detailed Systems Readout, Scanning Array | Ways to Lock, with small extras | Fine. |
| Diagnosis Scanner | Roll (18) with +tokens: about 50% with 3 tokens, for 1 HP + 3 Stress to an ally | Fine on power; see Q2 on who can roll it. |
| Optimized Routines, Matter Inversion, Phase Alignment, Sensor Mirage, Quantum Entanglement, Empathic Network, Electrified Hull | Situational | Fine. Electrified Hull is narrow (docking only). |

## Proposed text
Changes from the draft are listed under each card.

### Flesh
**Manual Inspection,** *Science, Flesh Domain.* **Spend a Hope** to let a willing ship within Melee range clear a Hull Point.
- Wording only.

**Innervation,** *Science, Flesh Domain.* Whenever you would gain Hope, you can clear that many Stress instead. **While Available:** You have an extra Stress slot.
- Wording only.

**Slighted Spite,** *Science, Flesh Domain.* When you or an ally within Close range takes damage from an adversary, you can **spend a Hope** to Lock that adversary.
- Wording only.

**Empathic Network,** *Science, Flesh Domain.* **Mark a Stress** to create a Cloud. When a ship in your Cloud would mark Hull Points, you can mark one of them instead. If that damage was Severe, gain a Hope.
- "If you reduce their damage from Severe to Major" -> "If that damage was Severe" (taking one HP always lowers Severe to Major).

**Anticipatory Neurons,** *Science, Flesh Domain.* You have advantage on rolls to Lock. When a roll to Lock gives you a Hope, one ally within Close range also gains a Hope. **While Available:** You have an extra Stress slot.
- Wording only.

### Mind
**Diagnosis Scanner,** *Science, Mind Domain.* Spend any number of Analysis Tokens to make a Spellcast Roll (18), adding the number spent to the roll. On a success, an ally within Very Close range clears a Hull Point and clears a Stress for each token spent.
- Wording only. See Q2.

**Optimized Routines,** *Science, Mind Domain.* Spend an Analysis Token and **spend a Hope** to gain advantage on a roll. When you roll with Hope, you can gain an Analysis Token instead of the Hope.
- Wording only.

**Warded Hull,** *Science, Mind Domain.* When you would mark Hull Points from damage, you can first spend 2 Analysis Tokens to reduce the severity by one threshold. **While Available:** You have an extra Stress slot.
- Wording only.

**Opportunistic Analysis,** *Science, Mind Domain.* When you deal damage to a ship, you can spend an Analysis Token to make it Vulnerable until the end of its next spotlight or yours, whichever comes first.
- "until the end of your or their next spotlight" made definite (Q4).

**Detailed Systems Readout,** *Science, Mind Domain.* When you Lock a ship with an action roll, gain an Analysis Token. If you start a scene with no Analysis Tokens, gain one.
- Missing word fixed ("acquire a Lock an Action roll").

**Synced Arcana,** *Science, Mind Domain.* If the pilot has a Spellcast trait, they can make a Spellcast Roll to Lock, and they add their Spellcast trait to your damage thresholds.
- "Spellcasting trait" -> "Spellcast trait".

### Void
**Charge Extraction,** *Science, Void Domain.* Once during your spotlight, when you make an adversary mark a Stress, you can **spend a Hope** to clear a Stress.
- Renamed from Energy Drain (owner). Wording only.

**Chaos Drive,** *Science, Void Domain.* **Mark a Stress** to add the GM's current Fear to a non-Weapons action roll.
- Wording only.

**Matter Inversion,** *Science, Void Domain.* When you make an action roll with Fear, put an Inversion Token on this card (up to 3). Spend an Inversion Token to choose the damage type of any damage dealt by or to a ship within Very Close range of you.
- "originates or terminates within Very Close range of you" -> "dealt by or to a ship within Very Close range of you".

### Energy
**Electrified Field,** *Science, Energy Domain.* **Mark a Stress** to create a Cloud. Attacks made from inside your Cloud deal an extra 1d8 damage on a success. The first time an attack from inside the Cloud hits an adversary, gain a Hope.
- Wording only.

**Electron Beam,** *Science, Energy Domain.* Make a Science Action Roll (13). On a success, a ship within Close range clears 2 Stress.
- Power: no Stress cost (was "Mark a Stress").

**Oscillating Power Supply,** *Science, Energy Domain.* Once per spotlight, you can **mark a Stress** to gain 2 Power Tokens, or spend 2 Power Tokens to clear a Stress. **While Available:** You have an extra Stress slot.
- Wording only.

**Electrified Hull,** *Science, Energy Domain.* Spend a Power Token to make a willing ship within Melee range *Electrified*. The next time it docks with another ship, that ship marks a Hull Point and a Stress, and Electrified ends.
- Wording only.

### Metal
**Close Range Scanning Battery,** *Science, Metal Domain.* **Mark a Stress** to make a Science Action Roll against a target within Close range. On a success, it is Locked and takes Pd4 physical damage.
- Wording only.

**Hull Cannibalization,** *Science, Metal Domain.* Once per Refuel, **mark a Hull Point** to clear 3 Stress. **While Available:** You have an extra Science Hull Point.
- Wording only.

**Pulse Beacon,** *Science, Metal Domain.* **Mark a Hull Point** to deploy a Pulse Beacon: a size 1 object with Evasion 15, your damage thresholds and 5 HP. You can move the Beacon to a point within Close range instead of moving your ship. When you deploy it, make a Science Action Roll against each ship within Close range of the Beacon. Ships you succeed against are Vulnerable while within Close range of it, and you can Lock one of them.
- The roll happens once, when you deploy it (Q3). "Lock any ship you succeeded against" -> "one of them" (one Lock at a time).

### Glass
**Advanced Targeting,** *Science, Glass Domain.* When you Lock a ship, you can **mark a Stress** to make it your Studied Target. At the start of your spotlight, you can Lock your Studied Target as a reaction.
- Wording only.

**Sensor Mirage,** *Science, Glass Domain.* When an ally within Close range becomes Locked, you can make a Science Action Roll against the highest Difficulty among adversaries. On a success, the Lock ends, and the roll counts as a success with Hope. On a failure, it counts as a failure with Fear.
- Wording only.

**Phase Alignment,** *Science, Glass Domain.* When your Studied Target deals tech damage to a ship, that ship can **spend a Hope** to reduce the severity by one threshold.
- Wording only.

**Gravitational Lens Drive,** *Science, Glass Domain.* Allies' attacks can pass through your ship. **Mark a Stress:** until the start of your next spotlight, physical and tech attacks you choose that pass within Very Close range of you add 1 to their Proficiency.
- Power: "While you have any unmarked Stress" (always on) -> mark a Stress, lasts until your next spotlight. "Lense" -> "Lens".

**Quantum Entanglement,** *Science, Glass Domain.* Your Studied Target doesn't end until you choose, even when the scene ends. You always know the direction of your Studied Target and how many unmarked Stress it has, at any distance.
- Wording only. This is the one exception to the scene-end rule.

**Scanning Array,** *Science, Glass Domain.* **Mark a Stress** to create a Cloud. At the start of their spotlights, allies can Lock any target in your Cloud as a reaction. When the Cloud dissipates, you can make any ship in it your Studied Target.
- Batch 1 wording; system changed to Science (owner, Batch 1 Q8).

## Questions
1. Power fixes: (A) approve both (Gravitational Lens Drive costs a Stress and lasts until your next spotlight; Electron Beam has no Stress cost), or (B) list the ones to keep as drafted?
2. Diagnosis Scanner only allows a Spellcast Roll, so a pilot without a Spellcast trait can't use it. (Breaching Curse and Eldritch Lance allow "Weapons Action Roll or Spellcast Roll".) (A) "Science Action Roll or Spellcast Roll (18)", or (B) keep it Spellcast only (Mind is the magic domain)?
3. Pulse Beacon: (A) the roll happens once, when you deploy it, or (B) you can repeat the roll as an action on later spotlights?
4. Opportunistic Analysis, "until the end of your or their next spotlight": (A) whichever comes first, or (B) whichever comes last?

## Owner answers (2026-11-07), applied to `v1-working.md`
1. B. Electron Beam: no Stress cost to roll; on a success you can spend a Power Token to let a ship within Close range clear 2 Stress; it ends with "Once per spotlight, you can **mark a Stress** to gain a Power Token." Gravitational Lens Drive stays always on while you have unmarked Stress: being within Very Close range of the attack path puts the ship near the enemy, which is its hidden cost.
2. No ship card calls for a Spellcast Roll; system rolls replace them. Applied: Breaching Curse and Eldritch Lance (Weapons Action Roll only), Diagnosis Scanner (Science Action Roll (18)). Synced Arcana: the "Lock with a Spellcast Roll" clause is removed (open item below). Batch 4 must do the same for Arcanic Connection and Eldritch Breeze.
3. Pulse Beacon: "When you deploy or move it, you can make a Science Action Roll against each ship within Close range of the Beacon."
4. A, whichever comes first: the GM can end it by giving that ship a spotlight, a little cheaper than clearing a temporary condition.

## Closed
- Synced Arcana (owner, 2026-11-07): "Add the trait you use for Science rolls to your damage thresholds." Works for every pilot. Batch 3 done.
