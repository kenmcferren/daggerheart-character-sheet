// Series 7, step 1: number-changing features (owner review 2026-09-22).
//
// STAT_BONUSES: permanent, unconditional "+N" features — nothing to track at the table — get baked
// straight into the sheet's Evasion/thresholds/Armor Score. Guardian's Stalwart ranks stack (owner
// confirmed): a mastery Stalwart carries all three of Unwavering/Unrelenting/Undaunted.
//
// STAT_NOTES: everything else that changes a headline stat but can't be baked in at build time, because
// it depends on something that isn't fixed per-character-build — usually something that happens at the
// table (‡ situational: a Marked-for-Death target, low light, current Stress marked) or a loadout split
// the app deliberately never tracks († build, but loadout-vs-vault: Blade-/Splendor-/Valor-Touched — the
// owner decided vault tracking will never be modelled, 2026-09-22). Gets a footnote symbol next to the
// stat and next to the feature/card/item name instead, with `text` in the page's legend.
//
// Owner-confirmed scope (2026-09-22): only always-on conditional bonuses get a footnote (no per-use
// cost); costed/consumable abilities (mark a Stress, spend Hope, drink a potion) stay plain text, the
// card/feature already says the whole effect.
//
// A bonus that's conditional on the character's OWN gear (not loadout composition) is fully knowable
// from the sheet's own equipment choices, so it's no longer a footnote (owner, 2026-09-23: "assume our
// displayed armor and weapons are equipped") — it's computed straight into the printed number in
// sheetView.ts instead: Armorer, Fortified Armor (+N while wearing armor), Mage Robes tiers (threshold
// bonus = Spellcast trait), Granminster's Finery (Armor Score bonus = Presence). Those don't appear
// below any more.
//
// Vitality (Blade domain card) is NOT a stat note either: it's a one-time permanent choice (2 of 3
// benefits) made the level the card is taken, then fixed forever — a mini level-up, not a footnote.
// Modelled in src/engine/levelup.ts (LevelRecord.vitalityChoice, Progress.vitalityThresholds).
export const STAT_BONUSES = [
  { scope: 'subclass', owner: 'brawler.juggernaut', feature: 'Rugged', bonus: { severeThreshold: 3 } },
  { scope: 'subclass', owner: 'guardian.stalwart', feature: 'Unwavering', bonus: { majorThreshold: 1, severeThreshold: 1 } },
  { scope: 'subclass', owner: 'guardian.stalwart', feature: 'Unrelenting', bonus: { majorThreshold: 2, severeThreshold: 2 } },
  { scope: 'subclass', owner: 'guardian.stalwart', feature: 'Undaunted', bonus: { majorThreshold: 3, severeThreshold: 3 } },
  { scope: 'subclass', owner: 'rogue.nightwalker', feature: 'Fleeting Shadow', bonus: { evasion: 1 } },
  { scope: 'subclass', owner: 'seraph.winged-sentinel', feature: 'Ascendant', bonus: { severeThreshold: 4 } },
  { scope: 'ancestry', owner: 'earthkin', feature: 'Stoneskin', bonus: { armorScore: 1, majorThreshold: 1, severeThreshold: 1 } },
  { scope: 'ancestry', owner: 'simiah', feature: 'Nimble', bonus: { evasion: 1 } },
]

export const STAT_NOTES = {
  subclass: [
    { owner: 'assassin.executioners-guild', feature: 'Scorpion’s Poise', note: { kind: 'situational', stats: ['evasion'], text: '+2 Evasion against a creature you’ve Marked for Death.' } },
    { owner: 'ranger.beastbound', feature: 'Battle-Bonded', note: { kind: 'situational', stats: ['evasion'], text: '+2 Evasion against an attack from within your companion’s Melee range.' } },
    { owner: 'ranger.wayfinder', feature: 'Elusive Predator', note: { kind: 'situational', stats: ['evasion'], text: '+2 Evasion against an attack from your Focus target.' } },
  ],
  domainCard: [
    { name: 'Shadowhunter', note: { kind: 'situational', stats: ['evasion'], text: '+1 Evasion while shrouded in low light or darkness.' } },
    { name: 'Eldritch Flesh', note: { kind: 'situational', stats: ['majorThreshold', 'severeThreshold'], text: '+1 damage thresholds for each Stress you have marked.' } },
    { name: 'Blade-Touched', note: { kind: 'build', stats: ['severeThreshold'], text: '+2 attack rolls, +4 Severe threshold when 4+ loadout cards are from the Blade domain.' } },
    { name: 'Splendor-Touched', note: { kind: 'build', stats: ['severeThreshold'], text: '+3 Severe threshold when 4+ loadout cards are from the Splendor domain.' } },
    { name: 'Valor-Touched', note: { kind: 'build', stats: ['armorScore'], text: '+1 Armor Score when 4+ loadout cards are from the Valor domain.' } },
  ],
  equipment: [
    { name: 'Vial of Darksmoke', note: { kind: 'situational', stats: ['evasion'], text: 'Roll d6s equal to Agility; add the highest to Evasion against one attack.' } },
  ],
}

export function applyStatBonuses(classes, subclasses, ancestries) {
  let n = 0
  for (const b of STAT_BONUSES) {
    const list = b.scope === 'class' ? classes : b.scope === 'subclass' ? subclasses : ancestries
    const owner = list.find((x) => x.id === b.owner)
    const f = owner?.features.find((x) => x.name === b.feature)
    if (!f) throw new Error(`stat bonus: ${b.owner} has no feature "${b.feature}"`)
    f.statBonus = b.bonus
    n++
  }
  return n
}

export function applyStatNotes(subclasses, domainCards, equipment) {
  let n = 0
  for (const e of STAT_NOTES.subclass) {
    const owner = subclasses.find((x) => x.id === e.owner)
    const f = owner?.features.find((x) => x.name === e.feature)
    if (!f) throw new Error(`stat note: ${e.owner} has no feature "${e.feature}"`)
    f.statNote = e.note
    n++
  }
  for (const e of STAT_NOTES.domainCard) {
    const card = domainCards.find((x) => x.name === e.name)
    if (!card) throw new Error(`stat note: no domain card named "${e.name}"`)
    card.statNote = e.note
    n++
  }
  for (const e of STAT_NOTES.equipment) {
    const item = equipment.find((x) => x.name === e.name)
    if (!item) throw new Error(`stat note: no equipment named "${e.name}"`)
    item.statNote = e.note
    n++
  }
  return n
}
