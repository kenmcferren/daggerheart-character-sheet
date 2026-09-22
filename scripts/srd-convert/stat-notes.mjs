// Series 7, step 1: number-changing features (owner review 2026-09-22).
//
// STAT_BONUSES: permanent, unconditional "+N" features — nothing to track at the table — get baked
// straight into the sheet's Evasion/thresholds/Armor Score. Guardian's Stalwart ranks stack (owner
// confirmed): a mastery Stalwart carries all three of Unwavering/Unrelenting/Undaunted.
//
// STAT_NOTES: everything else that changes a headline stat but can't be baked in, because the app is
// a static sheet printer and these depend on something that changes in play. Gets a footnote symbol
// next to the stat and next to the feature/card/item name instead (owner's design, from the Armorer
// example): † (build) = depends on the character's own gear or loadout; ‡ (situational) = depends on
// what happens at the table. This first batch is one representative example of each kind and source
// (class/subclass feature, domain card, equipment) to confirm the design; the rest of the two
// candidate sweeps (TestArtifacts/rules-math/candidates.md, trait-candidates.md) still need doing.
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
    { name: 'Armorer', note: { kind: 'build', stats: ['armorScore'], text: '+1 Armor Score while wearing armor.' } },
    { name: 'Fortified Armor', note: { kind: 'build', stats: ['majorThreshold', 'severeThreshold'], text: '+2 damage thresholds while wearing armor.' } },
    { name: 'Shadowhunter', note: { kind: 'situational', stats: ['evasion'], text: '+1 Evasion while shrouded in low light or darkness.' } },
  ],
  equipment: [
    { name: 'Mage Robes', note: { kind: 'build', stats: ['majorThreshold', 'severeThreshold'], text: 'Damage thresholds bonus equal to Spellcast trait (Enchanted).' } },
    { name: 'Improved Mage Robes', note: { kind: 'build', stats: ['majorThreshold', 'severeThreshold'], text: 'Damage thresholds bonus equal to Spellcast trait (Enchanted).' } },
    { name: 'Advanced Mage Robes', note: { kind: 'build', stats: ['majorThreshold', 'severeThreshold'], text: 'Damage thresholds bonus equal to Spellcast trait (Enchanted).' } },
    { name: 'Legendary Mage Robes', note: { kind: 'build', stats: ['majorThreshold', 'severeThreshold'], text: 'Damage thresholds bonus equal to Spellcast trait (Enchanted).' } },
    { name: 'Granminster’s Finery', note: { kind: 'build', stats: ['armorScore'], text: 'Armor Score bonus equal to Presence (Magnificent).' } },
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
