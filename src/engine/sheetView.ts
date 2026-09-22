import type { Character, Trait } from './character'
import type { CreationSetup } from './creation'
import { COMPANION_SUBCLASS, extrasOf, progressOf, SLOT_CAP, type Progress } from './levelup'
import { ancestryFeatures, deriveStats, type DerivedStats } from './rules'

type Any = any
/** `short` is the condensed sheet wording ('' = print nothing); the Creator always shows `rules`. */
export type SheetCards = { label: string; items: { name: string; short: string }[] }
export type SheetTable = { title: string; rows: { name: string; short: string }[] }
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

  const stats: DerivedStats = {
    ...base,
    evasion: base.evasion + progress.evasionBonus + statBonus.evasion,
    hitPoints: Math.min(SLOT_CAP, base.hitPoints + progress.hitPointSlots),
    stress: Math.min(SLOT_CAP, base.stress + progress.stressSlots),
    majorThreshold: base.majorThreshold + statBonus.majorThreshold,
    severeThreshold: base.severeThreshold + statBonus.severeThreshold,
    armorScore: Math.min(SLOT_CAP, base.armorScore + statBonus.armorScore),
    proficiency: progress.proficiency,
  }
  const traits: Partial<Record<Trait, number>> = { ...ch.traits }
  for (const [t, n] of Object.entries(progress.traitBonus)) traits[t as Trait] = (traits[t as Trait] ?? 0) + (n as number)

  const spellcastTraits = subclasses.map((s) => (reg.subclasses.get(s.id) as Any)?.spellcastTrait as string | undefined).filter((t): t is string => !!t)
  const hasCombo = [...reg.levelUpOptions.values()].some((o: Any) => o.effect === 'combo-die' && o.classId === ch.choices.classId)

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
  // plus held domain cards (loadout and vault) and equipped gear.
  const heldCards = progress.domainCardIds.map((id) => reg.domainCards.get(id) as Any).filter(Boolean)
  const equippedGear = ch.choices.equipmentIds.map((id) => reg.equipment.get(id) as Any).filter(Boolean)
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
  }
}
