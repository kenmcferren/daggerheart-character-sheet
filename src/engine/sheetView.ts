import type { Character, Trait } from './character'
import type { CreationSetup } from './creation'
import { COMPANION_SUBCLASS, extrasOf, progressOf, SLOT_CAP, type Progress } from './levelup'
import { ancestryFeatures, deriveStats, type DerivedStats } from './rules'

type Any = any
/** `short` is the condensed sheet wording ('' = print nothing); the Creator always shows `rules`. */
export type SheetCards = { label: string; items: { name: string; short: string }[] }
export type SheetTable = { title: string; rows: { name: string; short: string }[] }
/** Bare Bones base damage thresholds by tier (SRD). */
const BARE_BONES_THRESHOLDS: [number, number][] = [[9, 19], [11, 24], [13, 31], [15, 38]]

export type StatBonus = { evasion?: number; majorThreshold?: number; severeThreshold?: number; armorScore?: number }
/** A footnote on a stat: 'build' = depends on gear/loadout (knowable from the sheet, not baked into the number); 'situational' = depends on what happens at the table. */
export type StatNote = { kind: 'build' | 'situational'; stats: string[]; text: string }
export type Feature = { name?: string; rules: string; short?: string; sheetCards?: SheetCards; sheetTable?: SheetTable; level?: string; trackers?: { id: string; label: string; count: number | { trait: string } }[]; statBonus?: StatBonus; statNote?: StatNote }

/** Everything the printable sheet shows for a character at its current level: level 1 choices plus the replayed level-up history. */
export interface SheetView {
  progress: Progress
  stats: DerivedStats
  /** Base traits plus trait advancements. */
  traits: Partial<Record<Trait, number>>
  experiences: { text: string; bonus: number }[]
  /** All domain cards held (loadout and vault). */
  domainCardIds: string[]
  /** Main subclass then the multiclass subclass: the cards taken so far, foundation first. */
  subclasses: { id: string; name: string; features: Feature[]; multiclass: boolean }[]
  /** The multiclass module: the added class's features, or null. */
  multiclass: { className: string; domainId: string; features: Feature[] } | null
  spellcastTraits: string[]
  stanceIds: string[]
  /** Stance definitions known (from the class that holds Martial Artist, main or multiclass). */
  stances: Any[]
  companionOptions: { id: string; name: string; rules: string; short?: string }[]
  /** Items from held features that print as blocks on the domain card sheet (Assassin poisons). */
  sheetCards: { label: string; name: string; short: string }[]
  /** A table across the top of the domain card sheet (Druid elements x subclass features): one column per held feature. */
  sheetTable: { title: string; rows: string[]; columns: { title: string; cells: string[] }[] } | null
  /** Resource counters from held features (Favor, tokens): a row of boxes each, with an upper limit. */
  resourceTrackers: { label: string; count: number }[]
  /** Ranger companion stat block (Beastbound), derived from the companion options taken; null for other characters. */
  companion: CompanionView | null
  /** Extra Hope slots on the character sheet (Ranger: Light in the Dark). */
  extraHope: number
  /** Brawler Combo Die, e.g. "d6"; null for other classes. */
  comboDie: string | null
  /** Footnotes on Evasion/thresholds/Armor Score/Proficiency from held class/subclass/ancestry features, held domain cards and equipped gear. */
  statNotes: { name: string; kind: StatNote['kind']; stats: string[]; text: string }[]
  /** Druid (main class) Beastforms of the character's tier or lower, with stats worked out against this sheet (Series 8 step 1). Empty for other characters. */
  beastforms: BeastformView[]
}

export type BeastformView = {
  id: string
  name: string
  tier: number
  examples?: string
  /** Undefined for the two "upgrade template" forms (Legendary Beast, Mythic Beast), which modify a form chosen in play rather than having fixed stats. */
  traitLabel?: string
  traitTotal?: number
  evasion?: number
  attackRange?: string
  attackTrait?: string
  damage?: string
  damageType?: string
  majorThreshold?: number
  severeThreshold?: number
  advantages?: string[]
  features: { name?: string; rules: string }[]
}

export interface CompanionView {
  name: string
  evasion: number
  stress: number
  /** Attack bonus (the subclass Spellcast trait) and its trait name. */
  attackBonus: number | null
  attackTrait: string | null
  attack: string
  damageType: string | null
  /** Damage: Proficiency dice of `die`, at `range`; Vicious has raised the die or the range one step (the player's choice). */
  die: string
  range: string
  experiences: { text: string; bonus: number }[]
  /** Options that print as text: Creature Comfort, Armored, Bonded. */
  features: { name: string; text: string }[]
}

const COMPANION_STRESS = 3
const RANGES = ['Melee', 'Very Close', 'Close', 'Far', 'Very Far']
const RANKS = ['foundation', 'specialization', 'mastery']
const DICE = ['d4', 'd6', 'd8', 'd10', 'd12']

export function sheetView(ch: Character, setup: CreationSetup): SheetView {
  const reg: Any = setup.registry
  const progress = progressOf(ch, setup.registry)
  const base = deriveStats(ch, setup)

  const cls: Any = reg.classes.get(ch.choices.classId ?? '')
  const subclasses = Object.entries(progress.subclassRanks).map(([id, rank]) => {
    const sc = reg.subclasses.get(id) as Any
    return {
      id, name: sc?.name ?? id, multiclass: id !== ch.choices.subclassId,
      features: ((sc?.features ?? []) as Feature[]).filter((f) => RANKS.indexOf(f.level ?? '') < rank),
    }
  }).sort((a, b) => Number(a.multiclass) - Number(b.multiclass))
  const mc = progress.multiclass
  const mcClass: Any = mc ? reg.classes.get(mc.classId) : undefined

  // Permanent, unconditional stat bonuses (owner-approved list, Series 7 step 1: SRD "permanent +N" features
  // with no condition to track). Guardian's Unwavering/Unrelenting/Undaunted stack as the subclass ranks up
  // (owner confirmed). Bonuses that depend on gear or loadout instead get a footnote (statNote), not baked in.
  const bonusSources: Feature[] = [
    ...((cls?.features ?? []) as Feature[]),
    ...subclasses.flatMap((s) => s.features),
    ...(mc && mcClass ? ((mcClass.features ?? []) as Feature[]) : []),
    ...ancestryFeatures(ch, setup),
  ]
  const statBonus = bonusSources.reduce((acc, f) => {
    const b = f.statBonus
    if (!b) return acc
    return { evasion: acc.evasion + (b.evasion ?? 0), majorThreshold: acc.majorThreshold + (b.majorThreshold ?? 0), severeThreshold: acc.severeThreshold + (b.severeThreshold ?? 0), armorScore: acc.armorScore + (b.armorScore ?? 0) }
  }, { evasion: 0, majorThreshold: 0, severeThreshold: 0, armorScore: 0 })

  const traits: Partial<Record<Trait, number>> = { ...ch.traits }
  for (const [t, n] of Object.entries(progress.traitBonus)) traits[t as Trait] = (traits[t as Trait] ?? 0) + (n as number)

  const spellcastTraits = subclasses.map((s) => (reg.subclasses.get(s.id) as Any)?.spellcastTrait as string | undefined).filter((t): t is string => !!t)
  const higherSpellcastTrait = spellcastTraits.length ? [...new Set(spellcastTraits)].sort((x, y) => (traits[y as Trait] ?? 0) - (traits[x as Trait] ?? 0))[0] : null

  // Gear-conditional bonuses (owner, 2026-09-23): the sheet's displayed weapons/armor are assumed equipped, so
  // "while wearing armor" and "equal to [trait]" bonuses from held domain cards and equipped armor are computed
  // straight into the printed numbers, not left as a footnote — unlike loadout-vs-vault (never modelled).
  const heldCards = progress.domainCardIds.map((id) => reg.domainCards.get(id) as Any).filter(Boolean)
  const equippedGear = ch.choices.equipmentIds.map((id) => reg.equipment.get(id) as Any).filter(Boolean)
  const wornArmor = equippedGear.find((e) => e.category === 'armor')
  const hasCard = (id: string) => progress.domainCardIds.includes(id)
  const gearBonus = { majorThreshold: 0, severeThreshold: 0, armorScore: 0 }
  if (wornArmor && hasCard('armorer')) gearBonus.armorScore += 1
  if (wornArmor && hasCard('fortified-armor')) { gearBonus.majorThreshold += 2; gearBonus.severeThreshold += 2 }
  if (wornArmor?.id && ['armor.mage-robes', 'armor.improved-mage-robes', 'armor.advanced-mage-robes', 'armor.legendary-mage-robes'].includes(wornArmor.id) && higherSpellcastTrait) {
    const t = traits[higherSpellcastTrait as Trait] ?? 0
    gearBonus.majorThreshold += t; gearBonus.severeThreshold += t
  }
  // Bare Bones (Valor): with no armor equipped, base Armor Score 3 + Strength and tier-based base thresholds.
  if (!wornArmor && hasCard('bare-bones')) {
    const [maj, sev] = BARE_BONES_THRESHOLDS[base.tier - 1] ?? [0, 0]
    gearBonus.majorThreshold += maj; gearBonus.severeThreshold += sev
    gearBonus.armorScore += Math.max(0, 3 + (traits.strength ?? 0))
  } else if (!wornArmor) {
    // Unarmored without Bare Bones: stand-in base thresholds (owner) so threshold math still has something to work on.
    gearBonus.majorThreshold += 1; gearBonus.severeThreshold += 2
  }
  if (wornArmor?.id === 'armor.granminsters-finery') gearBonus.armorScore += traits.presence ?? 0

  const stats: DerivedStats = {
    ...base,
    evasion: base.evasion + progress.evasionBonus + statBonus.evasion,
    hitPoints: Math.min(SLOT_CAP, base.hitPoints + progress.hitPointSlots),
    stress: Math.min(SLOT_CAP, base.stress + progress.stressSlots),
    majorThreshold: base.majorThreshold + statBonus.majorThreshold + gearBonus.majorThreshold + (progress.vitalityThresholds ? 2 : 0),
    severeThreshold: base.severeThreshold + statBonus.severeThreshold + gearBonus.severeThreshold + (progress.vitalityThresholds ? 2 : 0),
    armorScore: Math.min(SLOT_CAP, base.armorScore + statBonus.armorScore + gearBonus.armorScore),
    proficiency: progress.proficiency,
  }
  const hasCombo = [...reg.levelUpOptions.values()].some((o: Any) => o.effect === 'combo-die' && o.classId === ch.choices.classId)

  // Druid forms page (Series 8 step 1, main class only): a form of the character's tier or lower "or lower" per the
  // Beastform feature text, with the trait/Evasion/threshold numbers worked out against this sheet (owner: derived
  // stats, not just the raw SRD text). Legendary Beast / Mythic Beast are upgrade templates with no fixed stats of
  // their own (they buff a form chosen in play), so they print as text only.
  const beastforms: BeastformView[] = cls?.id === 'druid'
    ? ((cls.beastforms ?? []) as Any[]).filter((b) => b.tier <= stats.tier).map((b): BeastformView => ({
        id: b.id, name: b.name, tier: b.tier, examples: b.examples,
        traitLabel: b.traitBonus?.trait, traitTotal: b.traitBonus ? (traits[b.traitBonus.trait as Trait] ?? 0) + b.traitBonus.bonus : undefined,
        evasion: b.evasionBonus !== undefined ? stats.evasion + b.evasionBonus : undefined,
        attackRange: b.attack?.range, attackTrait: b.attack?.trait, damage: b.attack?.damage, damageType: b.attack?.damageType,
        majorThreshold: b.attack ? stats.majorThreshold + (b.thresholdBonus ?? 0) : undefined,
        severeThreshold: b.attack ? stats.severeThreshold + (b.thresholdBonus ?? 0) : undefined,
        advantages: b.advantages, features: (b.features as Any[]).map((f) => ({ name: f.name, rules: f.short ?? f.rules })),
      }))
    : []

  const tableFeatures = subclasses.flatMap((sc) => sc.features.filter((f) => f.sheetTable))
  const sheetTable = tableFeatures.length
    ? {
        title: tableFeatures[0].sheetTable!.title,
        rows: tableFeatures[0].sheetTable!.rows.map((r) => r.name),
        columns: tableFeatures.map((f) => ({ title: f.name ?? '', cells: tableFeatures[0].sheetTable!.rows.map((r) => f.sheetTable!.rows.find((x) => x.name === r.name)?.short ?? '') })),
      }
    : null

  const { stanceClass, companionClass } = extrasOf(progress.subclassRanks, reg)
  const cc: Any = companionClass?.companion, comp = progress.companion
  const has = (id: string) => progress.companionOptionIds.includes(id)
  const stepUp = (list: string[], v: string) => list[Math.min(list.length - 1, Math.max(0, list.findIndex((x) => x.toLowerCase() === v.toLowerCase())) + 1)]
  const attackTrait = ((reg.subclasses.get(COMPANION_SUBCLASS) as Any)?.spellcastTrait as string | undefined) ?? spellcastTraits[0] ?? null
  const companion: CompanionView | null = comp && cc
    ? {
        name: comp.name, evasion: (cc.startingEvasion ?? 10) + (has('aware') ? 2 : 0), stress: COMPANION_STRESS + (has('resilient') ? 1 : 0),
        attackBonus: attackTrait ? traits[attackTrait as Trait] ?? 0 : null, attackTrait,
        attack: comp.attack, damageType: comp.damageType,
        die: progress.companionVicious === 'die' ? stepUp(DICE, cc.startingDamageDie ?? 'd6') : cc.startingDamageDie ?? 'd6',
        range: progress.companionVicious === 'range' ? stepUp(RANGES, String(cc.startingRange ?? 'melee')) : RANGES.find((r) => r.toLowerCase() === String(cc.startingRange ?? 'melee').toLowerCase()) ?? 'Melee',
        experiences: comp.experiences.filter((e) => e.trim()).map((text, i) => ({ text, bonus: (cc.experiences?.bonus ?? 2) + (progress.companionExperienceBonus[i] ?? 0) })),
        features: (cc.levelUpOptions as Any[]).filter((o) => ['creature-comfort', 'armored', 'bonded'].includes(o.id) && has(o.id)).map((o) => ({ name: o.name, text: o.short ?? o.rules })),
      }
    : null

  // Resource trackers: class features, held subclass features and the multiclass module. A Spellcast count uses that feature's own subclass trait.
  const spellOf = (scId: string | undefined) => (scId ? ((reg.subclasses.get(scId) as Any)?.spellcastTrait as string | undefined) : undefined)
  const mainSub = subclasses.find((s) => !s.multiclass)?.id, multiSub = subclasses.find((s) => s.multiclass)?.id
  const resourceTrackers: { label: string; count: number }[] = []
  const collect = (features: Feature[], scId: string | undefined) => {
    for (const f of features) for (const t of f.trackers ?? []) {
      const trait = typeof t.count === 'number' ? null : t.count.trait === 'spellcast' ? spellOf(scId) : t.count.trait
      resourceTrackers.push({ label: t.label, count: typeof t.count === 'number' ? t.count : Math.max(1, (trait ? traits[trait as Trait] : 1) ?? 1) })
    }
  }
  collect((cls?.features ?? []) as Feature[], mainSub)
  if (mc && mcClass) collect(mcClass.features ?? [], multiSub)
  for (const sc of subclasses) collect(sc.features, sc.id)
  if (stanceClass?.focusMax) resourceTrackers.push({ label: 'Focus', count: stanceClass.focusMax })

  // Stat footnotes (Series 7 step 1): from the same held class/subclass/ancestry features as statBonus above,
  // plus held domain cards (loadout and vault) and equipped gear. Gear-conditional bonuses that are actually
  // computed above (Armorer, Fortified Armor, Mage Robes, Granminster's Finery) no longer carry a statNote in
  // the pack data, so they don't double up as a footnote here.
  const noteSources: { name?: string; statNote?: StatNote }[] = [...bonusSources, ...heldCards, ...equippedGear]
  const statNotes = noteSources.filter((f) => f.statNote).map((f) => ({ name: f.name ?? '', kind: f.statNote!.kind, stats: f.statNote!.stats, text: f.statNote!.text }))

  return {
    progress, stats, traits,
    experiences: progress.experiences,
    domainCardIds: progress.domainCardIds,
    subclasses,
    multiclass: mc && mcClass ? { className: mcClass.name, domainId: mc.domainId, features: mcClass.features ?? [] } : null,
    spellcastTraits: [...new Set(spellcastTraits)],
    stanceIds: progress.stanceIds,
    stances: ((stanceClass?.stances ?? []) as Any[]).filter((x) => progress.stanceIds.includes(x.id)),
    companionOptions: (companionClass?.companion?.levelUpOptions ?? []).filter((o: Any) => progress.companionOptionIds.includes(o.id)),
    sheetCards: subclasses.flatMap((sc) => sc.features.flatMap((f) => (f.sheetCards ? f.sheetCards.items.map((i) => ({ label: f.sheetCards!.label, ...i })) : []))),
    sheetTable,
    resourceTrackers,
    companion,
    extraHope: has('light-in-the-dark') ? 1 : 0,
    comboDie: hasCombo ? DICE[Math.min(progress.comboDieSteps, DICE.length - 1)] : null,
    statNotes,
    beastforms,
  }
}
