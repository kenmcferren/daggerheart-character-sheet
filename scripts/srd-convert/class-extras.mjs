// Structured class extras (Series 3, step 3). Called by build-core-pack.mjs after classes are built.
// Parses the raw `supplements` text into beastforms, companion, stances; removes what it structured.
const TRAITS = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge']
const RANGES = { melee: 'melee', 'very close': 'very-close', close: 'close', far: 'far', 'very far': 'very-far' }
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// "Name: rules" lines start a feature; other lines continue the previous one.
function nameRules(lines) {
  const out = []
  for (const l of lines) {
    const m = l.match(/^([A-Z][^:]{1,40}): (.*)$/)
    if (m && !l.startsWith('- ')) out.push({ name: m[1], rules: m[2] })
    else if (out.length) out[out.length - 1].rules += '\n' + l
    else throw new Error(`orphan line: ${l}`)
  }
  return out
}

function beastform(s, tier) {
  const lines = s.rules.split('\n')
  const bf = { id: slug(s.title), name: s.title, tier }
  let i = 0
  if (lines[0].startsWith('(')) { bf.examples = lines[0].slice(1, -1); i = 1 }
  const stat = lines[i]?.match(/^(\w+) \+(\d) \| Evasion \+(\d) (.+) (d\d+(?:\+\d+)?) (phy|mag)$/)
  if (stat) {
    i++
    const mid = stat[4].toLowerCase().split(' ')
    const trait = mid.find((w) => TRAITS.includes(w))
    const range = RANGES[mid.filter((w) => w !== trait).join(' ')]
    if (!trait || !range) throw new Error(`beastform stat line: ${lines[i - 1]}`)
    Object.assign(bf, {
      traitBonus: { trait: stat[1].toLowerCase(), bonus: Number(stat[2]) }, evasionBonus: Number(stat[3]),
      attack: { range, trait, damage: stat[5], damageType: stat[6] === 'phy' ? 'physical' : 'magic' },
    })
  }
  const adv = lines[i]?.match(/^Gain advantage on: (.*)$/)
  if (adv) { bf.advantages = adv[1].split(',').map((x) => x.trim()); i++ }
  bf.features = nameRules(lines.slice(i))
  // Some features change damage thresholds outright (Thick Hide, Hollow Bones, Physical Defense); pull the number
  // out of the rules text into a structured field so the sheet can print the modified threshold, not just the text.
  for (const f of bf.features) {
    const tm = f.rules.match(/(\d+) (bonus|penalty) to (?:all )?(?:your )?damage thresholds/i)
    if (tm) bf.thresholdBonus = tm[2].toLowerCase() === 'penalty' ? -Number(tm[1]) : Number(tm[1])
  }
  return bf
}

export function structureClassExtras(classes) {
  const get = (id) => classes.find((c) => c.id === id)

  const druid = get('druid')
  const beasts = druid.supplements.filter((s) => s.title !== 'Beastform Options')
  if (beasts.length !== 24) throw new Error(`expected 24 beastforms, got ${beasts.length}`)
  druid.beastforms = beasts.map((s, n) => beastform(s, Math.floor(n / 6) + 1))
  druid.supplements = druid.supplements.filter((s) => s.title === 'Beastform Options')

  const ranger = get('ranger')
  const sup = (t) => ranger.supplements.find((s) => s.title === t)
  const bul = (r) => r.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  const lvl = sup('Leveling Up Your Companion').rules
  const ex = sup('Step 3: Choose Their Companion Experience').rules.split('\n').find((l) => !/^(Create|Start|Example)/.test(l))
  ranger.companion = {
    startingEvasion: Number(sup('Step 2: Write Their Evasion').rules.match(/starts at (\d+)/)[1]),
    experiences: { count: 2, bonus: 2 },
    startingDamageDie: 'd6',
    startingRange: 'melee',
    damageTypes: ['physical', 'magic'],
    exampleExperiences: ex.split(',').map((x) => x.trim()),
    levelUpOptions: bul(lvl).map((l) => { const [n, ...r] = l.split(': '); return { id: slug(n), name: n, rules: r.join(': ') } }),
  }
  if (ranger.companion.levelUpOptions.length !== 8 || ranger.companion.exampleExperiences.length !== 20) throw new Error('companion parse')

  const brawler = get('brawler')
  const tiers = brawler.supplements.filter((s) => /^Tier \d$/.test(s.title))
  brawler.stances = tiers.flatMap((t) => nameRules(t.rules.split('\n')).map((f) => ({ id: slug(f.name), name: f.name, tier: Number(t.title.slice(5)), rules: f.rules })))
  brawler.focusMax = 6
  brawler.knownStancesAtCreation = 2
  brawler.supplements = brawler.supplements.filter((s) => !/^Tier \d$/.test(s.title))
}

const PER = { 'short rest': 'short-rest', 'long rest': 'long-rest', rest: 'rest', scene: 'scene', session: 'session' }
/** "Once per <period>" in rules text becomes uses:1 + usesPer, and (cards only) a one-circle tracker. */
export function addUses(obj, withTracker) {
  const m = (obj.rules || '').match(/once per (short rest|long rest|rest|scene|session)/i)
  if (!m) return false
  obj.uses = 1
  obj.usesPer = PER[m[1].toLowerCase()]
  if (withTracker) obj.trackers = [{ id: `${obj.id}-use`, shape: 'circle', count: 1, label: `Once per ${m[1].toLowerCase()}`, placement: 'front' }]
  return true
}
