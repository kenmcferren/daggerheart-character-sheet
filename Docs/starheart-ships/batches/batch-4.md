# Batch 4: Engineering cards (Series 14, step 6)

Status: answered and applied to `v1-working.md` 2026-11-07. Source: `source-v0.md` Engineering section (27 cards). The Engineering/Energy card keeps the name **Energy Drain** (the Science one became Charge Extraction).

## Wording rules (same as Batches 1-3, plus)
- No Spellcast Rolls (owner, Batch 3): Eldritch Breeze and Arcanic Connection now use Engineering Action Rolls.
- Untyped damage gets a type: Overload Barrage -> tech (Energy, like Fire Gout); Shrapnel Mine -> physical (Metal; Graviton Mine already said physical).
- "Fully marked HP" -> **Breached**; "unmarked Engineering HP" -> "your Engineering system isn't Breached".
- "Halved" -> SRD **resistance** (Void Attuned).
- "turn" -> spotlight (Pulsar Mine); "range band" -> "range" (Projection Field; "band" is kept for Chases).
- Graviton Mine trimmed from 116 to 108 words without changing what it does (the longest ship card; most of its length is rules it needs).
- The size list in Scrap Hound is dropped; sizes are in the rules.

## Power check
Yardsticks: a Hope, Stress or HP is worth about 1; a Weapons use is 1.17 HP (Tier 1); +1 Evasion against everything is about 0.5 HP per scene (`reports/defense.md`).

| Card | What it's worth | Verdict |
| :-- | :-- | :-- |
| Counterfire | Each Reload Token removes a damage die, down to 1 die. Every Tier 1 SRD attack rolls one die (56 of 58), so it does nothing at Tier 1. Tier 2 attacks roll 2 dice, so it removes one. | **Broken at Tier 1.** No minimum: each token removes one die, and an attack with no dice left deals only its flat damage. That's about 0.5 HP saved per token. |
| Corrosive Slime | 1 Stress: -2/-4 thresholds with no end and no stacking limit. At Tier 1 (6/12 -> 4/8) every later hit on that ship marks about +0.4 to 0.7 HP. A party focusing it gets 3-5 HP per scene. | **Too strong.** Lasts until the end of the target's next spotlight, and doesn't stack. |
| Ultraviolet Imaging | 1 Hope: one ship Vulnerable for the scene (advantage for every ally attacking it), about +2 HP per scene with three allies | Strong but single-target. Kept; on the Batch 5 combo watch (with Opportunistic Analysis and Pulse Beacon, the third Vulnerable source). |
| Cloaking Field | 1 Stress: untargetable until you attack or move with a roll; the GM spends Fear and you spend Hope to keep it | Fine. |
| Graviton Mine, Pulsar Mine, Shrapnel Mine | Roll (15), then a Stress and an HP for area damage and control | Fine. Shrapnel Mine's token timing: Q4. |
| Veil of Night | Roll (13): a wall against tech/magic damage and sensing; 1 Stress or token per HP when ships cross | Fine. It blocks allies too (friendly fire, as in Batch 1). |
| Void Attuned | Resistance to magic plus a Stress back, with 4+ Void cards | Fine (pairs with Void Cohesion). |
| Undercoat, Lightweight Frame | Get stronger as you take damage | Fine. |
| Orbiting Plate | 1 HP for a chance to stop a hit (about 1.2 HP) or get the HP back | Fine. |
| Parallax Protocol | 1 Stress: +3 Evasion against one attack (about 0.15 HP), free against your Studied Target | Weak unless the attacker is your Studied Target. Kept. |
| Position Scrambler | 1 Stress: 3 attacks with disadvantage (about 0.8 HP) | Fine. |
| Rift Generator, Pocket Dimension, Boarding Glyph, Arcanic Connection, Eldritch Breeze, Docking Winch, Projection Field | Movement and utility | Fine. |
| Neural Interface, Siphon Array, Energy Drain, Scrap Hound, Overload Barrage, Selective Shedding | Small converters and debuffs | Fine. |

## Proposed text
Changes from the draft are listed under each card.

### Flesh
**Neural Interface,** *Engineering, Flesh Domain.* When you have no Hope and gain any Hope, clear a Stress. **While Available:** You have an extra Stress slot.
- Wording only.

**Corrosive Slime,** *Engineering, Flesh Domain.* When you succeed on an attack against a ship, dock with it, or succeed on a Transport Action Roll against it, you can **mark a Stress** to lower its Major threshold by 2 and its Severe threshold by 4 until the end of its next spotlight. This doesn't stack.
- Power: duration and no stacking added (Q1). "Make contact with a ship by way of attack, docking, or Transport Action roll" written out.

**Selective Shedding,** *Engineering, Flesh Domain.* When you succeed on an attack against a ship, dock with it, or succeed on a Transport Action Roll against it, you can **spend a Hope** to slow it: until the end of its next spotlight, it can only move to a point within Very Close range. In a Chase, it moves back one band instead.
- "Reduce that ship's speed by half" -> Very Close movement instead of Close (Q5). Daggerheart has no speed stat.

### Mind
**Arcanic Connection,** *Engineering, Mind Domain.* Once per Refuel, the pilot can cast one of their spells through your ship. Make an Engineering Action Roll in place of the Spellcast Roll. The spell can affect ships your size or smaller as it would affect adversaries, at ship ranges.
- Spellcast Roll -> Engineering Action Roll (owner rule). Garbled first sentence rewritten (Q6).

**Eldritch Breeze,** *Engineering, Mind Domain.* Make an Engineering Action Roll against a target within Far range. On a success, it is temporarily caught in *Unfair Winds*. When it moves, you can **spend a Hope** or an Analysis Token to push it to a point within Very Close range of where it stopped. If you don't, Unfair Winds ends.
- Spellcast Action roll -> Engineering Action Roll.

**Rift Generator,** *Engineering, Mind Domain.* **Mark a Stress** to make an Engineering Action Roll (13). On a success, teleport to a point within Very Far range. For each ally within Very Close range you bring with you, mark another Stress or 2 Hull Points.
- The draft had no Difficulty; (13) proposed (Q3).

**Pocket Dimension,** *Engineering, Mind Domain.* **Mark a Stress** to make an Engineering Action Roll (16). On a success, you open a pocket dimension holding an abandoned space station. It lasts long enough for one Refuel, and a Refuel there clears half as much (round down). Characters can rest there undisturbed. Messages can pass in or out only if you allow it.
- "The station's origins are unknown" dropped (flavor). "half the normal benefits" made definite (Q7).

**Boarding Glyph,** *Engineering, Mind Domain.* **Mark a Stress** to make an Engineering Action Roll against a ship within Very Close range (12 if it is willing). On a success, mark it with a Boarding Glyph and choose a place on your ship. Creatures you allow can travel between that place and a matching place on the marked ship (bridge to bridge, cargo bay to cargo bay). When a creature you forbid tries, make an Engineering Reaction Roll against it; on a success, it takes Pd8 magic damage and doesn't cross. The Glyph lasts while your ship has a pilot, your Engineering system isn't Breached, and the marked ship is within Far range.
- "and doesn't cross" added (the draft only gave the damage). "magical" -> magic.

### Void
**Cloaking Field,** *Engineering, Void Domain.* **Mark a Stress** to become *Cloaked* until you make a Weapons or Transport action roll. While Cloaked, adversaries can't target you, and your first attack has advantage. Once per adversary spotlight, the GM can spend a Fear to reveal you; you can **spend a Hope** to stay Cloaked.
- "Hidden" -> "Cloaked" (Q2): the SRD Hidden condition works differently (rolls against you have disadvantage).

**Graviton Mine,** *Engineering, Void Domain.* Make an Engineering Action Roll (15). On a success, you can **mark a Stress** and **mark a Hull Point** to place a Graviton Mine at a point within Close range. Other ships within Close range of the Mine are temporarily *Restrained*. Each of them that starts its spotlight within Close range of the Mine makes a Transport Reaction Roll (10 + the GM's current Fear): on a failure, it is pulled to the Mine; on a success, it is no longer Restrained. At the start of your next spotlight, every ship at the Mine takes Pd10+4 physical damage, ignoring size, and the Mine and its Restrained condition end.
- Trimmed; same effect.

**Void Attuned,** *Engineering, Void Domain.* While you have 4 or more Void cards in your loadout, you have resistance to magic damage, and you clear a Stress whenever you take magic damage.
- "halved" -> resistance.

**Scrap Hound,** *Engineering, Void Domain.* Once per Refuel, when an adversary ship is destroyed, you can clear Hull Points equal to 1d4 + its size.
- Size list dropped (it's in the rules).

**Veil of Night,** *Engineering, Void Domain.* Make an Engineering Action Roll (13) to create a *Veil of Night*: a flat plane through the battlefield, reaching Very Far range in every direction. When a ship passes through it, you can **mark a Stress** or spend an Analysis Token to make that ship mark a Hull Point. Communications, light, sensing, tech damage and magic damage can't pass through the Veil. You can dismiss it at the end of any spotlight; it ends with the scene.
- "scans" -> sensing (the Sense keyword).

### Energy
**Siphon Array,** *Engineering, Energy Domain.* When a ship within Very Close range marks a Stress, you can **spend a Hope** to gain 2 Power Tokens. If you start a scene with no Power Tokens, gain 2.
- Wording only.

**Position Scrambler,** *Engineering, Energy Domain.* **Mark a Stress** to put 3 Scrambler Tokens on this card. When an adversary attacks you, you can spend a Scrambler Token or a Power Token to give the attack disadvantage.
- Wording only.

**Pulsar Mine,** *Engineering, Energy Domain.* Make an Engineering Action Roll (15). On a success, you can **mark a Stress** and **mark a Hull Point** to place a Pulsar Mine at a point within Close range. Other ships within Close range of it take Pd6 tech damage. The Mine is removed at the start of your next spotlight. If you have a card that creates a Cloud, you can create that Cloud at the Mine's location without paying its cost.
- "next turn" -> next spotlight. The damage happens when the Mine is placed.

**Energy Drain,** *Engineering, Energy Domain.* Make an Engineering Action Roll against a ship within Very Close range. On a success, it marks a Stress and you clear a Stress.
- Wording only.

**Overload Barrage,** *Engineering, Energy Domain.* **Mark a Stress** to make an Engineering Action Roll against a ship within Close range. On a success, it is *Overloaded* until it next attacks or the scene ends. When an Overloaded ship attacks, the attack has disadvantage and the ship takes Pd6 tech damage.
- Damage type added; "using your proficiency" dropped (that's what Pd means).

### Metal
**Shrapnel Mine,** *Engineering, Metal Domain.* Make an Engineering Action Roll (15). On a success, you can **mark a Stress** and **mark a Hull Point** to put a Shrapnel Mine Token on this card. When an adversary within Close range of you moves, you can spend the token to deal Pd12+5 physical damage to it. At the start of any later spotlight, you can discard the token to clear a Stress and a Hull Point.
- Damage type added. Token timing: Q4.

**Docking Winch,** *Engineering, Metal Domain.* You have advantage on rolls to dock. You can give rolls to undock from your ship disadvantage.
- "Wench" -> Winch.

**Counterfire,** *Engineering, Metal Domain.* This card holds 2 Reload Tokens. When an adversary attacks you, before damage is rolled, you can spend any number of Reload Tokens as a reaction. Each token removes one damage die from the attack.
- Power: "to a minimum of 1 die" removed (Q1).

**Undercoat,** *Engineering, Metal Domain.* At the start of your spotlight, add the number of your marked Hull Points to your damage thresholds until your next spotlight.
- Wording only.

**Lightweight Frame,** *Engineering, Metal Domain.* You have +2 Evasion for each of your Breached systems.
- "At the start of your spotlight ... fully marked HP" -> always on, using Breached.

**Orbiting Plate,** *Engineering, Metal Domain.* **Mark a Hull Point** to create an Orbiting Plate. When an attack roll beats your Evasion by less than 5, you can destroy the Plate to take no damage from it. During your spotlight, you can destroy the Plate to clear a Hull Point instead.
- Wording only.

### Glass
**Projection Field,** *Engineering, Glass Domain.* When you or allies you choose make an action roll against your Studied Target, treat it as one range closer.
- Wording only.

**Parallax Protocol,** *Engineering, Glass Domain.* When an adversary attacks you, you can **mark a Stress** to gain +3 Evasion against that attack. If the attacker is your Studied Target, you can then clear a Stress.
- Wording only.

**Ultraviolet Imaging,** *Engineering, Glass Domain.* **Spend a Hope** to make an Engineering Action Roll against a target within Very Far range. On a success, it is *Highlighted* until it leaves Very Far range or you use this card on another target. A Highlighted ship is Vulnerable and can't hide or cloak unless something physically blocks it. If you rolled with Hope, you can also make it your Studied Target.
- Wording only.

## Questions
1. Power fixes: (A) approve both (Corrosive Slime lasts until the end of the target's next spotlight and doesn't stack; Counterfire has no 1-die minimum), or (B) list the ones to keep as drafted?
2. Cloaking Field: (A) rename the ship condition *Cloaked*, since SRD Hidden works differently, or (B) keep "Hidden" and let the card define it?
3. Rift Generator had no Difficulty: (A) 13, or (B) another number?
4. Shrapnel Mine Token: (A) it's a token, so it lasts until spent or the next Refuel (you can arm it before a fight), or (B) it ends with the scene, like other mines?
5. Selective Shedding, "reduce that ship's speed by half": (A) until the end of its next spotlight it can only move within Very Close range (in a Chase it moves back one band), or (B) other?
6. Arcanic Connection: (A) the rewrite above (the pilot's spell, with an Engineering Action Roll instead of a Spellcast Roll, at ship ranges, against ships your size or smaller), or (B) other?
7. Pocket Dimension, "half the normal benefits": (A) a Refuel there clears half as much (round down), or (B) other?

## Owner answers (2026-11-07), applied to `v1-working.md`
1. B: both kept as drafted.
   - Counterfire keeps "to a minimum of 1 die". Owner: adversaries will be balanced for Tier 2 or 3 damage, almost never Tier 1, so the minimum doesn't make the card dead in play.
   - Corrosive Slime keeps no end and stacking, but is now once per spotlight. Applied text adds "for the rest of the scene" so the reduction ends with the scene, like ship conditions and tokens.
2. A: *Cloaked*.
3. A: 13.
4. A: token lasts until spent or the next Refuel.
5. A.
6. A.
7. A.
- Batch 4 done.
