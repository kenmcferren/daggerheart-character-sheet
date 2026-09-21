/**
 * Pruned rest rules for the sheet (owner-written summary of Daggerheart SRD 2.0 p.52).
 * `move` ties a line to a downtime move id so frame remove-move ops can drop it.
 * TODO: move into the core pack as data (see Docs/deferred-queue.md).
 */
export interface RestPara { text: string; lead?: string; move?: string; indent?: boolean }

export const REST_RULES: RestPara[] = [
  { text: 'On a Short / Long rest, choose two. Swap loadout and vault cards for free.' },
  { lead: 'Tend to Wounds:', text: 'Clear [1d4+Tier / All] Hit Points on yourself or an ally.', move: 'tend-to-wounds', indent: true },
  { lead: 'Clear Stress:', text: 'Clear [1d4+Tier / All] Stress.', move: 'clear-stress', indent: true },
  { lead: 'Repair Armor:', text: 'Clear [1d4+Tier / All] Armor Slots on yourself or an ally.', move: 'repair-armor', indent: true },
  { lead: 'Prepare:', text: 'Gain 1 Hope. If two or more of you Prepare together, each gains 2 Hope.', move: 'prepare', indent: true },
  { lead: 'Work on a Project:', text: 'As described. Long rest only.', move: 'work-on-project', indent: true },
  { text: 'The GM then gains [1d4 / 1d4 + player count] Fear.' },
]
