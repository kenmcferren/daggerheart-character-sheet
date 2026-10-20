# Armaments CSV templates

One row per weapon or armor **per tier**. Repeat the name on each tier row (leave tiers out if the item is only available at some tiers). Delete the EXAMPLE rows. Leave `feature` blank when there is none. Rules text only, no flavor.

## Weapons (`armaments-weapons-template.csv`)

| Column | Allowed values |
|---|---|
| name | Display name. The id is made from it. |
| weaponSlot | `primary`, `secondary` (`wheelchair` only for wheelchair weapons) |
| tier | 1 to 4 |
| trait | `agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge` |
| range | `melee`, `very-close`, `close`, `far`, `very-far` |
| damage | Dice plus flat bonus, e.g. `d8+3` |
| damageType | `physical` or `magic` |
| burden | `one-handed` or `two-handed` |
| feature | `Name: rule text`, as the SRD writes it |

## Armor (`armaments-armor-template.csv`)

| Column | Allowed values |
|---|---|
| name | Display name |
| tier | 1 to 4 |
| majorThreshold, severeThreshold | Base damage thresholds (numbers) |
| armorScore | Base armor score (number) |
| feature | `Name: rule text`, or blank |
