# Batch 1: Weapons cards (Series 14, step 3)

Status: drafted 2026-11-07, waiting on owner. Nothing applied to `v1-working.md` yet. Source: `source-v0.md` Weapons section (27 cards). Power data: `reports/power-weapons.md`, made by `node scripts/starheart-ship-power.mjs > Docs/starheart-ships/reports/power-weapons.md`.

## Wording rules applied to every card
- Rolls: "Weapons Action Roll", "Spellcast Roll", "Weapons Reaction Roll" (the draft also had "Weapons Attack", "Weapons roll", "Weapons or Spellcast roll").
- Ranges: "within Far range" (SRD wording).
- Results: "On a success" (the draft also had "On a hit").
- Costs are bold at the start: **Mark a Stress**, **Spend a Hope**, **Mark a Hull Point**. Hull Point is written out on cards; HP is used in the rules text.
- Damage types: "magic" (not "magical"), "tech", "physical".
- Targets are ships (Null Sphere said "creatures").
- New conditions are written the same way: "temporarily *Engulfed*: [effect]".
- "Disables" is capitalized, as the Disabled keyword.
- The Reload refill line ("**While Available:** You can spend a Hope or mark a Stress to refill any card's Reload Tokens") moves from four cards into the Reload Tokens keyword. See Q1.

## Power check
Model: expected Hull Points marked per use, against SRD adversary averages. Tier 1: pilot Proficiency 1, trait +2, Difficulty 12, thresholds 6/12. Tier 2: Proficiency 3, trait +3, Difficulty 14, thresholds 11/22. Same-size target; Fear pool 3, 3 tokens, 2 targets for area cards, damage-over-time counted for 2 ticks.

**Benchmark:** the median of the free, single-target Pd cards is **1.17 HP per use at Tier 1 and 1.39 at Tier 2**. Read the "x" column as a multiple of that. A card that costs one Hope or Stress can sit near 2x; once per Refuel can go higher.

| Card | Cost | Draft (T1 x) | Proposed (T1 x) | Why |
| :-- | :-- | :-: | :-: | :-- |
| Fire Gout | 1 Hull Point | 6.53 | 2.57 | No roll, hit every ship in Melee, and Burning marked an HP every spotlight. Now it rolls, and Burning marks Stress. |
| Engulf | 1 Hope | 2.43 | 1.55 | Damage every spotlight plus hard control. Tick Pd6+4 -> Pd6. |
| Dissection Ray | needs Studied Target | 2.04 | 1.40 | Free, and the flat +6 plus "+1 HP on 2 or more" often makes 3 HP. Pd4+6 -> Pd4+3 (With Lock Pd8+6 -> Pd8+3). |
| Resonant Echo | Stress | 2.30 at 2 Stress, no cap | 2.12 at 2 Stress, cap 3 | 2d8 per Stress with no cap: 5 Stress made 10d8. Now Pd8 + 1d8 per Stress, up to 3. |
| Breaching Curse | needs Lock | 1.84 at 3 tokens, no cap | same at 3 spent | +1d6 per token *held*, losing only one; at 12 tokens it was +12d6. Now +1d6 per token *spent*. |
| Eldritch Lance (With Lock) | free | 2.22 HP | 1.51 HP | With Lock +10 tripled the free option. +10 -> +4. |
| Blacklight Laser | free | 1.50 | 1.29 | Free Pd6+6 at Far beat Tracer Fire, which also gives a token. Pd6+6 -> Pd6+4. |
| Entropic Beam | free | 1.51 | 1.40 | Free Pd10+4 matched the Railgun, which spends Reload Tokens. Pd10+4 -> Pd8+4. |
| Tether | free | 0.72 | 1.07 | Weakest card. Pd4 -> Pd6+2. |
| Plasma Caster (Power) | 1 Power | 2.49 | (Q4) | 1d6+10 to every ship on the line, hit or miss, with only the target counted. |

- Within range, no change: Spearhead Charge 1.00, Flechette Spines 1.33 (+Stress), Leeching Strike 1.03, Tracer Fire 1.29, Eldritch Lance (Stress) 1.69, Spacetime Chasm 2.33 (once per Refuel), Null Sphere 1.96 (two targets), Annihilation Beam 1.79 (once per Refuel), Volley Fire 2.50 (two targets), Erratic Pulse 1.40, Jamming Blast 0.84 (+Jammed), Warp Cascade 1.51 (+teleport, Restrained), Plutonium Railgun 1.51, Gatling Autoturret 1.38 (an extra attack outside your spotlight), Seeking Missile 2.40 (all 3 tokens and a Lock), Ramming Cap 1.00, Destructive Scan 0.84 (+Lock option), Scanning Array (no damage).
- **Note for later batches:** any damage marks at least 1 Hull Point. Damage over time and "every ship takes 1 damage" effects are worth more than their dice suggest.
- **Note on fixed dice:** cards without Pd lose ground as Proficiency rises. Volley Fire goes from 2.50x to 1.26x, and Annihilation Beam from 1.79x to 1.00x at Tier 2. They stay as written, per your Q8 answer.

## Proposed text
Changes from the draft are listed under each card.

### Flesh
**Spearhead Charge,** *Weapons, Flesh Domain.* **Forward Facing.** Make a Weapons Action Roll against an unobstructed target within Far range. On a success, move into Melee range of it and deal Pd8 physical damage. **With Lock:** Roll with advantage.
- Wording only.

**Flechette Spines,** *Weapons, Flesh Domain.* **Spend a Hope** to make a Weapons Action Roll against all targets within Close range. Targets you succeed against take 1 physical damage and mark a Stress. If this Disables any ships, gain a Hope.
- Wording only.

**Leeching Strike,** *Weapons, Flesh Domain.* Make a Weapons Action Roll against a target within Melee range. On a success, deal Pd4+3 physical damage. If it marks any Hull Points, clear a Stress.
- Wording only.

**Engulf,** *Weapons, Flesh Domain.* **Spend a Hope** to make a Weapons Action Roll against a target your size or smaller within Close range. On a success, it is temporarily *Engulfed*: it can't make Transport Action Rolls and must target you with all other actions. At the start of each of your spotlights, the Engulfed ship takes Pd6 physical damage.
- Power: Pd6+4 -> Pd6.

### Mind
**Tracer Fire,** *Weapons, Mind Domain.* **Forward Facing.** Make a Weapons Action Roll against a target within Far range. On a success, deal Pd6+4 tech damage, and either spend an Analysis Token to Lock the target or gain an Analysis Token.
- Wording only.

**Breaching Curse,** *Weapons, Mind Domain.* **With Lock:** Make a Weapons Action Roll or Spellcast Roll against the Locked target within Close range. On a success, deal Pd6 magic damage. Spend any number of Analysis Tokens to add a d6 for each one spent.
- Power: +1d6 per token held (losing one) -> +1d6 per token spent.

**Eldritch Lance,** *Weapons, Mind Domain.* **Forward Facing.** Make a Weapons Action Roll or Spellcast Roll against a target within Far range. On a success, choose one: deal Pd6 magic or physical damage, or **mark a Stress** to deal Pd10+6 magic damage. **With Lock:** +4 damage.
- Power: With Lock +10 -> +4.

### Void
**Spacetime Chasm,** *Weapons, Void Domain.* Once per Refuel, make a Weapons Action Roll against a target within Far range. On a success, the GM gains a Fear, and you draw a line from the target to a point within Far range of you and the target. Every ship touching the line takes Pd8+2 magic damage and marks a Stress.
- "Once per refuel" moved to the front, so it's clear the whole card is once per Refuel. Range added (Q6). Allies on the line (Q5).

**Entropic Beam,** *Weapons, Void Domain.* **Forward Facing.** Make a Weapons Action Roll against a target within Close range. On a success, deal Pd8+4 tech damage. You can also **mark a Stress** to make the target mark a Stress and lower its Difficulty by 1 until the end of the scene.
- Power: Pd10+4 -> Pd8+4.

**Tether,** *Weapons, Void Domain.* Make a Weapons Action Roll against a target within Melee range. On a success, deal Pd6+2 tech damage. If it marks any Hull Points, it also marks a Stress and you clear a Stress. **With Lock:** Roll with advantage.
- Power: Pd4 -> Pd6+2.

**Null Sphere,** *Weapons, Void Domain.* **Mark a Stress** and choose a point within Far range. Make a Weapons Action Roll (15). On a success, every ship within Very Close range of that point takes Pd6+4 magic damage. Each ship that marks 2 or more Hull Points is also temporarily *Restrained*.
- "creatures" -> ships; "more than 1 HP" -> "2 or more Hull Points". Allies in the area (Q5).

**Blacklight Laser,** *Weapons, Void Domain.* Make a Weapons Action Roll against a target within Far range. On a success, deal Pd6+4 tech damage. On a roll with Fear, hit or miss, you can **mark a Stress** to Lock the target. **With Lock:** On a success, add the GM's current Fear to the damage.
- Power: Pd6+6 -> Pd6+4.

**Annihilation Beam,** *Weapons, Void Domain.* **Forward Facing.** Once per Refuel, **spend a Hope** to make a Weapons Action Roll against a target within Very Far range. On a success, deal magic damage: a d8 for each Fear the GM has. **With Lock:** If the target is larger than you, it marks Hull Points as if it were your size.
- Wording only.

### Energy
**Plasma Caster,** *Weapons, Energy Domain.* Make a Weapons Action Roll with disadvantage against a target within Far range. Every ship touching the straight line of your shot marks a Stress; you can spend a Power Token to also deal 1d6+10 tech damage to each of them. On a success, the target takes an extra Pd6 tech damage as part of the same attack. **With Lock:** Roll without disadvantage.
- Wording only, pending Q4 and Q5.

**Volley Fire,** *Weapons, Energy Domain.* **Forward Facing.** **Mark a Stress** or spend a Power Token to make a Weapons Action Roll against all targets within Close range. Targets you succeed against take 2d6 tech damage.
- Range added to the roll (the draft put Close range on the damage only).

**Erratic Pulse,** *Weapons, Energy Domain.* Make a Weapons Action Roll against a target within Close range. On a success, deal Pd8+4 tech damage, and you can spend a Power Token to make the target temporarily *Vulnerable*. **With Lock:** You don't need to spend the Power Token.
- Wording only.

**Jamming Blast,** *Weapons, Energy Domain.* Make a Weapons Action Roll against a target within Far range. On a success, the target is temporarily *Jammed*: it has disadvantage on attack rolls. You can also spend a Power Token to deal Pd6 tech damage to it. **With Lock:** Roll with advantage.
- Wording only.

**Fire Gout,** *Weapons, Energy Domain.* **Mark a Hull Point** to make a Weapons Action Roll against all targets within Melee range. Targets you succeed against take Pd6+4 tech damage and are *Burning* until they use an action to put it out. A Burning ship marks a Stress at the end of each of its spotlights. If this Disables or destroys any ship, gain a Power Token.
- Power: now rolls to hit; Burning marks a Stress instead of dealing Pd4 at the end of *every* spotlight. Damage type added (Q7).

**Warp Cascade,** *Weapons, Energy Domain.* **Mark a Stress** to move to a point within Far range. Then you can make a Weapons Action Roll against a target within Very Close range. On a success, deal Pd10+4 tech damage, and the target is *Restrained* until the end of its next spotlight.
- Wording only. Theme (Q8).

### Metal
**Plutonium Railgun,** *Weapons, Metal Domain.* **Forward Facing.** This card holds 3 Reload Tokens. Spend 2 Reload Tokens to make a Weapons Action Roll against a target within Far range. On a success, deal Pd10+4 physical damage. **With Lock:** Roll with advantage.
- Your change: d10+4 -> Pd10+4. Refill line moved to the keyword (Q1).

**Gatling Autoturret,** *Weapons, Metal Domain.* This card holds 4 Reload Tokens. When an adversary ship enters Very Close range of you, you can spend a Reload Token to make a Weapons Reaction Roll against it. On a success, deal Pd4+6 physical damage.
- Your change: d4+6 -> Pd4+6. "a ship" -> "an adversary ship". Refill line moved (Q1).

**Seeking Missile,** *Weapons, Metal Domain.* This card holds 3 Reload Tokens. **With Lock:** Spend 3 Reload Tokens to make the target temporarily *Sought*. At the start of each of its spotlights while it is Sought, make a Weapons Reaction Roll against it. On a success, deal Pd12 physical damage. Sought doesn't end when the Lock does.
- The draft said "While Sought you make a Weapons Reaction roll at the start of their spotlight". Now it's clear the attacker rolls. Refill line moved (Q1).

**Ramming Cap,** *Weapons, Metal Domain.* **Forward Facing.** Move into Melee range of a target within Close range and make a Weapons Action Roll against it. On a success, deal Pd8 physical damage. You can then **mark a Hull Point** to make the target mark a Hull Point. **While Available:** You have an extra Weapons Hull Point.
- Wording only.

### Glass
**Destructive Scan,** *Weapons, Glass Domain.* Make a Weapons Action Roll against a target within Very Far range. On a success, deal Pd6 tech damage, and you can **mark a Stress** to Lock the target. **With Lock:** On a success, it also becomes your Studied Target.
- Wording only.

**Dissection Ray,** *Weapons, Glass Domain.* **Forward Facing.** Make a Weapons Action Roll against your Studied Target. On a success, deal Pd4+3 tech damage. If it marks 2 or more Hull Points, it marks 1 more. **With Lock:** Deal Pd8+3 instead.
- Power: Pd4+6 -> Pd4+3, With Lock Pd8+6 -> Pd8+3.

**Resonant Echo,** *Weapons, Glass Domain.* Make a Weapons Action Roll against a target within Close range, with advantage if it is your Studied Target. On a success, you can **mark up to 3 Stress**. Deal Pd8 physical damage, plus 1d8 for each Stress marked. Then you can spend Hope to clear Stress, one for one. **With Lock:** The target marks Hull Points as if your ship were one size larger.
- Power: 2d8 per Stress with no cap -> Pd8 + 1d8 per Stress, up to 3.

**Scanning Array,** *Weapons, Glass Domain.* **Mark a Stress** to create a Cloud. At the start of their spotlights, allies can Lock any target in your Cloud as a reaction. When the Cloud dissipates, you can make any ship in it your Studied Target.
- Wording only. Theme (Q8).

## Proposed keyword change
- **Reload Tokens:** Some cards hold Reload Tokens, up to the number they list. While a card with Reload Tokens is available, you can spend a Hope or mark a Stress to refill one card's Reload Tokens.

## Questions
1. Reload refill: (A) move it into the Reload Tokens keyword, where one Hope or Stress refills one card to full (the text above), or (B) keep the line on each card?
2. Ships have no weapons outside domain cards, so a ship with no Weapons cards can't attack. A Scout or Warden can take 0 Weapons cards. (A) That's intended, or (B) every ship gets a basic attack printed on the sheet (I'd draft one at about 1x the benchmark, e.g. Close range, Pd6 physical)?
3. Power fixes: (A) approve all nine in the table, or (B) list the ones you want to keep as drafted?
4. Plasma Caster's Power option: 1d6+10 to every ship on the line, hit or miss, makes it about 2.5x the benchmark with one extra ship on the line. (A) The Power damage only lands on a success, with 1d6+10 kept as you asked, or (B) leave it as is?
5. Area and line effects (Spacetime Chasm, Plasma Caster, Null Sphere) say "every ship", which includes allies. (A) Keep it; friendly fire is part of the risk, or (B) change to "every adversary ship"?
6. Spacetime Chasm had no range for the first target. (A) Far, or (B) other?
7. Fire Gout had no damage type. (A) tech, like the other Energy cards, (B) physical, or (C) magic?
8. Theme: Warp Cascade's teleport fits Void ("warp") better than Energy, and Scanning Array deals no damage (Lock and Studied Target are Science jobs). (A) Leave both where they are; the domain and system counts stay even, or (B) move them (please say where)?

## Owner answers (2026-11-07), applied to `v1-working.md`
1. A: Reload refill is in the Reload Tokens keyword.
2. A: a ship with no Weapons cards has no attack (intended).
3. Power fixes: Engulf and Blacklight Laser as proposed. Breaching Curse: 2d6 magic + 1d6 per Analysis Token spent. Eldritch Lance: With Lock +4 (Stress option Pd10+10); owner floated "With Lock: deal Pd10+12" as an alternative (open, below). Entropic Beam stays Pd10+4 (Forward Facing is a real cost about a third of the time). Tether stays Pd4 (clearing Stress is worth it). Fire Gout: rolls to hit, Burning marks Stress, "gain a Power Token" moved into the cost line, last sentence removed. Dissection Ray back to the draft (Pd4+6, With Lock Pd8+6). Resonant Echo: 2d8 + 1d8 per Stress, up to 3.
4. A, and the line uses "each adversary you succeed against": the roll is made against the target and every adversary on the line; Power damage only lands on those you succeed against.
5. A: area and line effects hit allies.
6. A: Far. Spacetime Chasm keeps its draft order: you can roll as often as you like, but only one success per Refuel takes effect.
7. Tech.
8. Moves: Tether -> Energy, Warp Cascade -> Void, Scanning Array -> Science (Glass), Critical Point Tracking (Science) -> Weapons (Glass). Counts per system and domain are unchanged.

## After the answers (T1 x benchmark)
- Engulf 1.55, Breaching Curse 1.95 (3 tokens spent; 2d6 doesn't scale with Proficiency, 1.15 at T2), Eldritch Lance Stress With Lock 2.26 HP (Pd10+12: 2.33), Blacklight Laser 1.29, Plasma Caster with Power 1.38 (2.33 HP With Lock), Fire Gout 2.57 (Hull Point cost, gives a Power Token), Resonant Echo 2.30 at 2 Stress (capped at 3).
- Critical Point Tracking adds about +0.9 HP per hit at Tier 1 (+0.4 at Tier 2). Combo to watch in Batch 5: Dissection Ray + Lock + Critical Point Tracking (Pd8+6+2d6 against Tier 1 thresholds is nearly always Severe, then +1) marks about 3.3 HP per use, about 2.8x, at no cost once Lock and Studied Target are set.

## Closed
- Eldritch Lance With Lock: owner kept "+4 damage" (2026-11-07). Batch 1 done.
