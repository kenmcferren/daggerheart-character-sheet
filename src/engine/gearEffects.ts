// Permanent stat effects written in an armor's or weapon's feature text ("Flexible: +1 to Evasion", "Very Heavy: -2 to
// Evasion; -1 to Agility", "Protective: +1 to Armor Score", "Add your Strength Trait to your armor score"). The sheet
// assumes displayed gear is equipped (owner, 2026-09-23), so these go straight into the printed numbers. Anything with
// a cost, a trigger or a roll ("mark a Stress", "when you are attacked", "+1 to attack rolls") is left as plain text.

export type TraitName = 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge'
export const TRAIT_NAMES: TraitName[] = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge']

export interface GearEffect {
  evasion: number
  armorScore: number
  majorThreshold: number
  severeThreshold: number
  traits: Partial<Record<TraitName, number>>
  /** Trait whose total is added to Armor Score / Evasion (Veskarium Imperial Plate, Second Skin). */
  armorScoreTrait?: TraitName
  evasionTrait?: TraitName
}

const num = (s: string) => Number(s.replace('−', '-').replace('+', ''))
const SIGNED = '([+−-]\\d+)'
const TRAIT_RE = TRAIT_NAMES.join('|')

export function gearEffect(feature: string | undefined): GearEffect {
  const fx: GearEffect = { evasion: 0, armorScore: 0, majorThreshold: 0, severeThreshold: 0, traits: {} }
  if (!feature) return fx
  const text = feature.replace(/^[^:]+:\s*/, '')
  for (const clause of text.split(/;|\. /)) {
    let m: RegExpMatchArray | null
    if ((m = clause.match(new RegExp(`${SIGNED} to all (?:your )?character traits and Evasion`, 'i')))) {
      fx.evasion += num(m[1])
      for (const t of TRAIT_NAMES) fx.traits[t] = (fx.traits[t] ?? 0) + num(m[1])
      continue
    }
    if ((m = clause.match(new RegExp(`^\\s*${SIGNED} (?:to (?:your )?)?Evasion`, 'i')))) fx.evasion += num(m[1])
    else if ((m = clause.match(new RegExp(`^\\s*${SIGNED} to (?:your )?Armor Score`, 'i')))) fx.armorScore += num(m[1])
    else if ((m = clause.match(new RegExp(`^\\s*${SIGNED} to (?:your )?damage thresholds`, 'i')))) { fx.majorThreshold += num(m[1]); fx.severeThreshold += num(m[1]) }
    else if ((m = clause.match(new RegExp(`^\\s*${SIGNED} to (?:your )?Major damage threshold`, 'i')))) fx.majorThreshold += num(m[1])
    else if ((m = clause.match(new RegExp(`^\\s*${SIGNED} to (?:your )?Severe damage threshold`, 'i')))) fx.severeThreshold += num(m[1])
    else if ((m = clause.match(new RegExp(`^\\s*${SIGNED} to (${TRAIT_RE})\\b`, 'i')))) fx.traits[m[2].toLowerCase() as TraitName] = (fx.traits[m[2].toLowerCase() as TraitName] ?? 0) + num(m[1])
    else if ((m = clause.match(new RegExp(`^\\s*Add your (${TRAIT_RE})(?: Trait)? to your armor score`, 'i')))) fx.armorScoreTrait = m[1].toLowerCase() as TraitName
    else if ((m = clause.match(new RegExp(`^\\s*Add your (${TRAIT_RE})(?: Trait)? to your evasion`, 'i')))) fx.evasionTrait = m[1].toLowerCase() as TraitName
  }
  return fx
}

/** "Use your Presence as your proficiency with this weapon" (Flashy, Impactful, Deadly Accuracy, Exacting). */
export function proficiencyTrait(feature: string | undefined): TraitName | undefined {
  const m = (feature ?? '').match(new RegExp(`(?:Use|uses) your (${TRAIT_RE})(?: as)? (?:its |your |the )?proficiency`, 'i'))
  return m ? (m[1].toLowerCase() as TraitName) : undefined
}
