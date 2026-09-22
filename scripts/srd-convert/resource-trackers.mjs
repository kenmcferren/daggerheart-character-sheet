// Resource counters (tokens, Favor, ...) with an upper limit and no die on the sheet. Each becomes a row of boxes under the Hope / Hit Points / Stress / Armor bands.
// `count: { trait: 'spellcast' }` = the subclass's Spellcast trait. Applied by build-core-pack.mjs to the named feature of a class or subclass.
export const RESOURCE_TRACKERS = [
  { scope: 'class', owner: 'warlock', feature: 'Favor', tracker: { id: 'favor', label: 'Favor (max 6)', count: 6 } },
  { scope: 'class', owner: 'witch', feature: 'Hex', tracker: { id: 'hexed', label: 'Hexed (max Spellcast)', count: { trait: 'spellcast' } } },
  { scope: 'subclass', owner: 'assassin.poisoners-guild', feature: 'Toxic Concoctions', tracker: { id: 'toxic-tokens', label: 'Toxic tokens (max 5)', count: 5 } },
  { scope: 'subclass', owner: 'witch.hedge', feature: 'Enchanted Talisman', tracker: { id: 'talisman-tokens', label: 'Talisman tokens (max Hope)', count: 6 } },
  { scope: 'subclass', owner: 'witch.hedge', feature: 'Walk Between Worlds', tracker: { id: 'walk-tokens', label: 'Walk tokens (max Spellcast)', count: { trait: 'spellcast' } } },
  { scope: 'subclass', owner: 'witch.hedge', feature: 'Circle of Power', tracker: { id: 'circle-tokens', label: 'Circle tokens (max Spellcast)', count: { trait: 'spellcast' } } },
]

export function applyResourceTrackers(classes, subclasses) {
  let n = 0
  for (const r of RESOURCE_TRACKERS) {
    const owner = (r.scope === 'class' ? classes : subclasses).find((x) => x.id === r.owner)
    const f = owner?.features.find((x) => x.name === r.feature)
    if (!f) throw new Error(`resource tracker: ${r.owner} has no feature "${r.feature}"`)
    f.trackers = [{ ...r.tracker, shape: 'box', placement: 'front' }]
    n++
  }
  return n
}
