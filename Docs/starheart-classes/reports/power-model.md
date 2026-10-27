# Power model (Series 12, prompt 7)

Script: `node scripts/starheart-power.mjs [--uf1 N --uf2 N --uptime N --csv path]`. Output: `reports/power-data.csv`. Ceiling: below 1.5x core damage per round; flag anything over about 1.3x.

## What it computes
Expected damage per round (DPR) of one character making one attack per round in a 4-round fight against one adversary of the Tier's typical Difficulty. Starheart features are added on top of the same weapon attack. Ally buffs and extra ally attacks are counted as party damage and added to the buffer's total ("total"); the CSV also keeps the self-only ratio.

## Baseline (a core class)
- Attack roll: 2d12 + trait modifier against Difficulty. A critical (both dice equal) always succeeds and adds the maximum weapon dice to the damage. Hope on a Hope-die win or a critical.
- Tier 1 = a level 1 character: Proficiency 1, trait modifier +2, Difficulty 12 (average of the SRD Tier 1 adversaries is 11.7), weapon d10+3 (common two-handed Tier 1 weapon in the pack).
- Tier 2 = a level 5 character with the specialization feature: Proficiency 3, modifier +3, Difficulty 14 (SRD Tier 2 average 14.3), weapon d10+6.
- Damage per hit = Proficiency dice of the weapon die + flat bonus.
- A typical core damage feature: +1d6 per hit at Tier 1 and +2d6 at Tier 2, no resource cost. This is a judgment (contested, see A1): Warrior Slayer dice, Assassin Marked for Death, Ranger focus and Rogue Sneak Attack all land in that range.
- Baseline DPR: Tier 1 10.17, Tier 2 23.81 (weapon only: 8.2 and 19.5 approximately).

## Resources
- Hope budget: start with 2, plus the Hope-die win rate per attack across 4 rounds, spread evenly (about 1.0 Hope/round at Tier 1). Operative Pride in Your Work adds its extra Hope.
- Stress budget: 0.75 Stress per round spent on damage features (a share of the 6 Stress is kept for taking damage).
- VP (Mystic): one VP per spell cast, starting full (Spellcast Trait + Tier), all spent on damage (an upper bound; Bondsmage and healing compete for it).
- Fight length 4 rounds; one attack per spotlight; no Fear effects.

## Conditional and party effects
- Uptime 0.7 for anything that needs positioning (ally in Very Close range, a second target, Primary Target Suppressed, Alignment 0.3, Mote 0.5). Sensitivity at 0.5 and 1.0 is in the results.
- Three allies, each doing the baseline DPR.
- Ally attack-roll bonus: change in the ally's DPR with the bonus applied (Envoy Hope Feature +2 plus Hope spent on one ally per round, 90% uptime).
- Envoy Squad Goals: one extra ally attack per Stress spent (0.75 per round), at 0.7 uptime.
- Advantage = +d6 on the roll (the Daggerheart rule).
- Non-damage output (healing, control, Evasion, conditions such as Restrained or Vulnerable, mark Hit Point or Stress effects, gadgets) is listed qualitatively and never converted to damage.

## Assumptions the owner may want to contest
- A1. Typical core damage feature: +1d6 (Tier 1), +2d6 (Tier 2), free. A lower value makes every Starheart class look stronger (at 0, Envoy is 1.67x, Mystic Spellweaver 1.70x at Tier 2); a higher value weakens them (at +5/+10, Envoy 1.33x/1.42x).
- A2. Uptime 0.7 for conditional effects. At 0.5 Envoy is 1.25x/1.33x; at 1.0 it is 1.63x/1.71x.
- A3. Squad Goals counted as a full extra ally attack each round it is paid for.
- A4. Mystic spends all VP on damage; Called Shot happens whenever Stress allows (no movement problem).
Proceeding on these unless you say otherwise; nothing in them blocks the first results.
