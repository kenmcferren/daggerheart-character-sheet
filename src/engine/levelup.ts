import { TRAITS, creationOf, type AdvancementRecord, type Character, type Creation, type LevelRecord, type Trait } from './character'
import type { Registry } from './packs'
import { STARTING_PROFICIENCY, STARTING_STRESS, tierOf } from './rules'

/** Everything gained after level 1, derived by replaying a character's history against the level-up rules in the packs. */
export interface Progress {
  level: number
  proficiency: number
  evasionBonus: number
  hitPointSlots: number
  stressSlots: number
  /** How many more Hit Point / Stress slots can be added before the sheet's cap of 12. */
  room: { hitPoint: number; stress: number }
  /** +1 per trait advancement; add to the base traits. */
  traitBonus: Partial<Record<Trait, number>>
  markedTraits: Trait[]
  /** Base Experiences (+2 each) followed by tier-achievement Experiences, with advancement bonuses added. */
  experiences: { text: string; bonus: number }[]
  /** Every domain card held (loadout and vault), after swaps. */
  domainCardIds: string[]
  /** 1 = foundation, 2 = specialization, 3 = mastery. */
  subclassRanks: Record<string, number>
  multiclass: { classId: string; domainId: string; subclassId: string } | null
  /** Advancement slots marked, keyed `${option}@${tier}`. */
  used: Record<string, number>
  /** Slots crossed out: `${option}@${tier}` (that tier) or `${option}@*` (every tier). */
  crossed: string[]
  comboDieSteps: number
  stanceIds: string[]
  /** The companion sheet (name, Experiences, attack): from creation (Beastbound) or from the multiclass level record. */
  companion: Creation['companion']
  companionOptionIds: string[]
  /** Permanent bonus per companion Experience (Intelligent), by index. */
  companionExperienceBonus: number[]
  /** What Vicious raised; null if not taken (or no companion to choose for). */
  companionVicious: 'die' | 'range' | null
  /** Vitality's one-time permanent choice: which 2 of {hitPoint, stress, thresholds} were picked when the card was taken. hitPoint/stress add to hitPointSlots/stressSlots directly; thresholds adds +2 to both damage thresholds. */
  vitalityThresholds: boolean
}

export class LevelUpError extends Error {
  errors: string[]
  constructor(errors: string[]) {
    super(`Invalid level-up: ${errors.join('; ')}`)
    this.errors = errors
  }
}

export const MAX_LEVEL = 10
export const ADVANCEMENTS_PER_LEVEL = 2
/** Hit Points, Stress and Armor Slots never go above 12. */
export const SLOT_CAP = 12
const slotKey = (option: string, tier: number | '*') => `${option}@${tier}`
const RANKS = ['foundation', 'specialization', 'mastery']

/** Stances and the companion belong to a subclass foundation, so they follow the subclass whether it is the main one or the multiclass one. */
export const STANCE_SUBCLASS = 'brawler.martial-artist'
export const COMPANION_SUBCLASS = 'ranger.beastbound'
export function extrasOf(ranks: Record<string, number>, reg: Registry): { stanceClass: any | null; companionClass: any | null } {
  const of = (sid: string) => (sid in ranks ? reg.classes.get((reg.subclasses.get(sid) as any)?.class ?? '') ?? null : null)
  return { stanceClass: of(STANCE_SUBCLASS), companionClass: of(COMPANION_SUBCLASS) }
}

export function initialProgress(ch: Character, reg: Registry): Progress {
  const cr = creationOf(ch)
  const cls: any = reg.classes.get(ch.choices.classId ?? '')
  return {
    level: 1,
    proficiency: STARTING_PROFICIENCY,
    evasionBonus: 0, hitPointSlots: 0, stressSlots: 0,
    room: { hitPoint: Math.max(0, SLOT_CAP - (cls?.startingHitPoints ?? 0)), stress: Math.max(0, SLOT_CAP - STARTING_STRESS) },
    traitBonus: {}, markedTraits: [],
    experiences: cr.experiences.filter((e) => e.trim()).map((text) => ({ text, bonus: 2 })),
    domainCardIds: [...ch.choices.domainCardIds],
    subclassRanks: ch.choices.subclassId ? { [ch.choices.subclassId]: 1 } : {},
    multiclass: null,
    used: {}, crossed: [],
    comboDieSteps: 0,
    stanceIds: [...cr.stanceIds],
    companion: ch.choices.subclassId === COMPANION_SUBCLASS ? structuredClone(cr.companion) : null,
    companionOptionIds: [],
    companionExperienceBonus: [],
    companionVicious: null,
    vitalityThresholds: false,
  }
}

/** Unmarked slots left for an option in one tier's boxes (0 if crossed out or the option has none there). */
export function slotsLeft(p: Progress, opt: any, tier: number): number {
  const total = opt?.slots?.[tier] ?? 0
  if (!total || p.crossed.includes(slotKey(opt.id, '*')) || p.crossed.includes(slotKey(opt.id, tier))) return 0
  return Math.max(0, total - (p.used[slotKey(opt.id, tier)] ?? 0))
}

const options = (reg: Registry) => [...reg.levelUpOptions.values()] as any[]

/** Why a domain card cannot be taken at this level (null = allowed). `cap` limits the card's level (never above `level`). */
export function domainCardProblem(st: Progress, level: number, cls: any, reg: Registry, cardId: string, cap: number, owned: string[] = st.domainCardIds): string | null {
  const card: any = reg.domainCards.get(cardId)
  if (!card) return `unknown domain card ${cardId}`
  if (owned.includes(cardId)) return `${card.name} is already held`
  const capped = Math.min(cap, level)
  if (cls?.domains?.includes(card.domain) && card.level <= capped) return null
  const mc = st.multiclass
  if (mc && card.domain === mc.domainId) return card.level <= Math.min(capped, Math.ceil(level / 2)) ? null : `${card.name} is above half your level (multiclass domain)`
  return cls?.domains?.includes(card.domain) ? `${card.name} is above level ${capped}` : `${card.name} is not from a domain you have`
}

/** Companion options to choose at a level: one, plus extras from Expert Training (+1) and Advanced Training (+2) on the level they are taken; never more than the options not yet taken (the class list has 8, each once). */
export function companionOptionCount(before: Progress, after: Progress, reg: Registry, cls?: any): number {
  const featuresAt = (ranks: Record<string, number>) => Object.entries(ranks).flatMap(([sid, rank]) =>
    ((reg.subclasses.get(sid) as any)?.features ?? []).filter((f: any) => RANKS.indexOf(f.level) < rank))
  const had = new Set(featuresAt(before.subclassRanks).map((f: any) => f.name))
  const gained = featuresAt(after.subclassRanks).filter((f: any) => !had.has(f.name)).map((f: any) => f.name)
  const want = 1 + (gained.includes('Expert Training') ? 1 : 0) + (gained.includes('Advanced Training') ? 2 : 0)
  const left = cls ? (cls.companion?.levelUpOptions?.length ?? 0) - after.companionOptionIds.length : want
  return Math.max(0, Math.min(want, left))
}

/** Applies one level record to a progress state. Returns the new state and any rule violations (state is only trustworthy when there are none). */
export type Stage = 'general' | 'achievement' | 'advancements' | 'cards' | 'class'

export function applyRecord(prev: Progress, rec: LevelRecord, ch: Character, reg: Registry): { progress: Progress; errors: string[]; stages: Record<Stage, string[]> } {
  const st: Progress = structuredClone(prev)
  const errors: string[] = []
  const stages: Record<Stage, string[]> = { general: [], achievement: [], advancements: [], cards: [], class: [] }
  const err = (m: string, stage: Stage = 'general') => { errors.push(`Level ${rec.level}: ${m}`); stages[stage].push(m) }
  const classId = ch.choices.classId ?? ''
  const cls: any = reg.classes.get(classId)
  const level = rec.level
  const tier = tierOf(level)

  if (level !== prev.level + 1) err(`expected level ${prev.level + 1}`)
  if (level > MAX_LEVEL) err(`level cannot pass ${MAX_LEVEL}`)
  st.level = level

  // Step one: tier achievement
  const ach = options(reg).find((o) => o.kind === 'tier-achievement' && o.level === level)
  if (ach) {
    if (!rec.newExperience?.trim()) err('write the new Experience', 'achievement')
    st.proficiency += ach.proficiency ?? 0
    if (ach.clearTraitMarks) st.markedTraits = []
    st.experiences.push({ text: rec.newExperience?.trim() ?? '', bonus: ach.newExperience ?? 0 })
  } else if (rec.newExperience?.trim()) err('there is no new Experience at this level', 'achievement')

  // Domain-card rule shared by the extra-card advancement, the level card, and swaps.
  const cardProblem = (cardId: string, cap: number, owned: string[]) => domainCardProblem(st, level, cls, reg, cardId, cap, owned)

  // Step two: advancements
  const spent = rec.advancements.reduce((n, a) => n + ((reg.levelUpOptions.get(a.option) as any)?.cost ?? 1), 0)
  if (spent !== ADVANCEMENTS_PER_LEVEL) err(`choose advancements worth exactly ${ADVANCEMENTS_PER_LEVEL} (chosen ${spent})`, 'advancements')
  for (const a of rec.advancements) {
    const problem = takeAdvancement(st, a)
    if (problem) err(`${(reg.levelUpOptions.get(a.option) as any)?.name ?? a.option}: ${problem}`, 'advancements')
  }

  function takeAdvancement(s: Progress, a: AdvancementRecord): string | null {
    const opt: any = reg.levelUpOptions.get(a.option)
    if (!opt || opt.kind !== 'advancement') return `unknown advancement ${a.option}`
    if (opt.classId && opt.classId !== classId) return 'not available to this class'
    if (level < (opt.minLevel ?? 1)) return `needs level ${opt.minLevel}`
    const t = a.fromTier
    if (!Number.isInteger(t) || t > tier || !opt.slots?.[t]) return `no slots in tier ${t}`
    const cost = opt.cost ?? 1
    if (slotsLeft(s, opt, t) < cost) return `no unmarked slots left in tier ${t}`
    // Cross-outs: 'tier' = that option's box in this tier is crossed out (harmless if already used); 'one' = one unused box, this tier's or the next tier's, chosen by crossOutTier (default: this tier's if unused).
    const oneOut: { option: string; tier: number }[] = []
    for (const c of opt.crossesOut ?? []) {
      const target: any = reg.levelUpOptions.get(c.option)
      const name = target?.name ?? c.option
      if (c.scope === 'one') {
        const open = [t, t + 1].filter((x) => slotsLeft(s, target, x) > 0)
        if (!open.length) return `no unused ${name} option in tier ${t} or ${t + 1} to cross out`
        const pick = a.crossOutTier ?? open[0]
        if (!open.includes(pick)) return `${name} in tier ${pick} cannot be crossed out`
        oneOut.push({ option: c.option, tier: pick })
      }
    }
    switch (opt.effect) {
      case 'traits': {
        const ts = a.traits ?? []
        if (ts.length !== 2 || ts[0] === ts[1] || ts.some((x) => !TRAITS.includes(x))) return 'choose two different traits'
        const marked = ts.find((x) => s.markedTraits.includes(x))
        if (marked) return `${marked} is marked (cleared at the next tier achievement)`
        for (const x of ts) s.traitBonus[x] = (s.traitBonus[x] ?? 0) + 1
        s.markedTraits.push(...ts)
        break
      }
      case 'hit-point':
        if (s.hitPointSlots >= s.room.hitPoint) return `Hit Points are already at ${SLOT_CAP}`
        s.hitPointSlots += 1
        break
      case 'stress':
        if (s.stressSlots >= s.room.stress) return `Stress is already at ${SLOT_CAP}`
        s.stressSlots += 1
        break
      case 'evasion': s.evasionBonus += 1; break
      case 'proficiency': s.proficiency += 1; break
      case 'combo-die': s.comboDieSteps += 1; break
      case 'experience': {
        const ix = a.experienceIndexes ?? []
        if (ix.length !== 2 || ix[0] === ix[1] || ix.some((i) => !Number.isInteger(i) || i < 0 || i >= s.experiences.length)) return 'choose two different Experiences'
        for (const i of ix) s.experiences[i].bonus += 1
        break
      }
      case 'domain-card': {
        if (!a.cardId) return 'choose a domain card'
        const p = cardProblem(a.cardId, MAX_LEVEL, s.domainCardIds)
        if (p) return p
        s.domainCardIds.push(a.cardId)
        break
      }
      case 'subclass-upgrade': {
        const sid = a.subclassId ?? ch.choices.subclassId ?? ''
        if (!(sid in s.subclassRanks)) return 'choose one of your subclasses'
        if (s.subclassRanks[sid] >= RANKS.length) return `${sid} already has its mastery card`
        s.subclassRanks[sid] += 1
        break
      }
      case 'multiclass': {
        const m = a.multiclass
        const other: any = m && reg.classes.get(m.classId)
        if (!m || !other) return 'choose a class'
        if (m.classId === classId) return 'choose a different class'
        if (!other.domains.includes(m.domainId)) return `${m.domainId} is not a domain of ${other.name}`
        const sub: any = reg.subclasses.get(m.subclassId)
        if (!sub || sub.class !== m.classId) return `choose a subclass of ${other.name}`
        s.multiclass = m
        s.subclassRanks[m.subclassId] = 1
        break
      }
      default: return `unsupported effect ${String(opt.effect)}`
    }
    s.used[slotKey(opt.id, t)] = (s.used[slotKey(opt.id, t)] ?? 0) + cost
    for (const c of opt.crossesOut ?? []) if (c.scope !== 'one') s.crossed.push(slotKey(c.option, c.scope === 'all' ? '*' : t))
    for (const o of oneOut) s.crossed.push(slotKey(o.option, o.tier))
    return null
  }

  // Step four: the level's new domain card, and an optional swap
  const before = [...st.domainCardIds]
  const p = cardProblem(rec.newCardId, level, st.domainCardIds)
  if (p) err(`new domain card: ${p}`, 'cards')
  else st.domainCardIds.push(rec.newCardId)
  if (rec.swap) {
    const out: any = reg.domainCards.get(rec.swap.out)
    if (rec.swap.in === rec.swap.out) err('swap: choose a different card', 'cards')
    else if (!out || !before.includes(rec.swap.out)) err('swap: choose a card you held before this level', 'cards')
    else {
      const owned = st.domainCardIds.filter((c) => c !== rec.swap!.out)
      const q = cardProblem(rec.swap.in, out.level, owned)
      if (q) err(`swap: ${q}`, 'cards')
      else st.domainCardIds = [...owned, rec.swap.in]
    }
  }

  // Vitality (Blade domain card): a one-time permanent choice of 2 of 3 benefits, made the level the card is taken.
  // Cannot be changed later (the choice lives only on this level record).
  if (st.domainCardIds.includes('vitality') && !prev.domainCardIds.includes('vitality')) {
    const choice = rec.vitalityChoice ?? []
    const valid: NonNullable<typeof rec.vitalityChoice> = ['hitPoint', 'stress', 'thresholds']
    if (choice.length !== 2 || new Set(choice).size !== 2 || choice.some((c) => !valid.includes(c))) {
      err('Vitality: choose 2 of Stress slot / Hit Point slot / +2 damage thresholds', 'cards')
    } else {
      for (const c of choice) {
        if (c === 'hitPoint') {
          if (st.hitPointSlots >= st.room.hitPoint) err(`Vitality: Hit Points are already at ${SLOT_CAP}`, 'cards')
          else st.hitPointSlots += 1
        } else if (c === 'stress') {
          if (st.stressSlots >= st.room.stress) err(`Vitality: Stress is already at ${SLOT_CAP}`, 'cards')
          else st.stressSlots += 1
        } else st.vitalityThresholds = true
      }
    }
  } else if (rec.vitalityChoice?.length) {
    err('Vitality choice given but Vitality was not taken this level', 'cards')
  }

  // Class extras follow the subclass that holds them (main or multiclass). The turn a multiclass takes the subclass, the foundation's starting choices replace that level's per-level pick.
  const { stanceClass, companionClass } = extrasOf(st.subclassRanks, reg)
  const gainedNow = (sid: string) => sid in st.subclassRanks && !(sid in prev.subclassRanks)
  if (stanceClass) {
    const known = (id: string | undefined) => (stanceClass.stances ?? []).find((x: any) => x.id === id)
    if (gainedNow(STANCE_SUBCLASS)) {
      const ids = rec.startStanceIds ?? []
      const want = stanceClass.knownStancesAtCreation ?? 2
      if (ids.length !== want || new Set(ids).size !== ids.length || ids.some((id) => known(id)?.tier !== 1)) err(`choose ${want} different Tier 1 stances`, 'class')
      else st.stanceIds.push(...ids.filter((id) => !st.stanceIds.includes(id)))
    } else {
      const s: any = known(rec.stanceId)
      if (!s) err('choose a stance', 'class')
      else if (s.tier > tier) err(`${s.name} is above your tier`, 'class')
      else if (st.stanceIds.includes(s.id)) err(`${s.name} is already known`, 'class')
      else st.stanceIds.push(s.id)
    }
  }
  if (companionClass) {
    const cls2 = companionClass
    if (gainedNow(COMPANION_SUBCLASS)) {
      const c = rec.newCompanion, need = cls2.companion?.experiences?.count ?? 2
      const ok = (t: string | undefined) => !!t?.trim()
      if (!c || !ok(c.name) || !ok(c.attack) || !c.damageType || c.experiences.filter(ok).length !== need) err('name the companion, give it its Experiences, and describe its attack and damage type', 'class')
      else st.companion = structuredClone(c)
    } else {
      const ids = rec.companionOptionIds ?? []
      const need = companionOptionCount(prev, st, reg, cls2)
      if (ids.length !== need) err(`choose ${need} companion option(s)`, 'class')
      for (const id of ids) {
        if (!cls2.companion?.levelUpOptions?.some((x: any) => x.id === id)) err(`unknown companion option ${id}`, 'class')
        else if (st.companionOptionIds.includes(id)) err(`companion option ${id} is already taken`, 'class')
        else st.companionOptionIds.push(id)
      }
      const n = st.companion?.experiences.length ?? 0, i = rec.companionExperience
      if (ids.includes('vicious') && n > 0) {
        if (rec.viciousChoice !== 'die' && rec.viciousChoice !== 'range') err('choose whether Vicious raises the damage die or the range', 'class')
        else st.companionVicious = rec.viciousChoice
      }
      if (ids.includes('intelligent') && n > 0) {
        if (i === undefined || !Number.isInteger(i) || i < 0 || i >= n) err('choose the Companion Experience for Intelligent', 'class')
        else { st.companionExperienceBonus = [...st.companionExperienceBonus]; st.companionExperienceBonus[i] = (st.companionExperienceBonus[i] ?? 0) + 1 }
      }
    }
  }
  return { progress: st, errors, stages }
}

/** Replays the character's history. `errors` is empty for any character built through applyLevelUp. */
export function replay(ch: Character, reg: Registry): { progress: Progress; errors: string[] } {
  let progress = initialProgress(ch, reg)
  const errors: string[] = []
  for (const rec of ch.history) {
    const r = applyRecord(progress, rec, ch, reg)
    progress = r.progress
    errors.push(...r.errors)
  }
  if (progress.level !== ch.level) errors.push(`history reaches level ${progress.level} but the character is level ${ch.level}`)
  return { progress, errors }
}

export const progressOf = (ch: Character, reg: Registry): Progress => replay(ch, reg).progress

/** Rule violations the record would cause (empty = legal). */
export function validateLevelUp(ch: Character, rec: LevelRecord, reg: Registry): string[] {
  const base = replay(ch, reg)
  return [...base.errors, ...applyRecord(base.progress, rec, ch, reg).errors]
}

/**
 * Levels a character up. Returns a NEW version (new id, same lineage, parent = the version passed in); the version passed in
 * is never modified, so a saved earlier level stays available and re-leveling it makes a branch.
 */
export function applyLevelUp(ch: Character, rec: LevelRecord, reg: Registry, newId: string, now = new Date().toISOString()): Character {
  const errors = validateLevelUp(ch, rec, reg)
  if (errors.length) throw new LevelUpError(errors)
  return {
    ...structuredClone(ch),
    id: newId,
    parentId: ch.id,
    level: rec.level,
    history: [...structuredClone(ch.history), structuredClone(rec)],
    createdAt: now,
    updatedAt: now,
  }
}

/** Which tiers' boxes an advancement can be taken from right now, or why it cannot be taken. `budgetLeft` = advancements still to spend this level. */
export function optionAvailability(st: Progress, level: number, opt: any, reg: Registry, budgetLeft: number): { tiers: number[]; reason: string | null } {
  const none = (reason: string) => ({ tiers: [], reason })
  const cost = opt.cost ?? 1
  if (level < (opt.minLevel ?? 1)) return none(`Needs level ${opt.minLevel}`)
  if (cost > budgetLeft) return none(cost > 1 && budgetLeft > 0 ? 'Costs both advancements: remove your other choice first' : 'Both advancements are chosen')
  let tiers = [2, 3, 4].filter((t) => t <= tierOf(level) && slotsLeft(st, opt, t) >= cost)
  if (!tiers.length) return none('No unmarked slots left')
  for (const c of opt.crossesOut ?? []) {
    if (c.scope !== 'one') continue
    const target: any = reg.levelUpOptions.get(c.option)
    tiers = tiers.filter((t) => [t, t + 1].some((x) => slotsLeft(st, target, x) > 0))
    if (!tiers.length) return none(`No unused ${target?.name ?? c.option} option to cross out`)
  }
  if (opt.effect === 'hit-point' && st.hitPointSlots >= st.room.hitPoint) return none(`Hit Points are already at ${SLOT_CAP}`)
  if (opt.effect === 'stress' && st.stressSlots >= st.room.stress) return none(`Stress is already at ${SLOT_CAP}`)
  if (opt.effect === 'traits' && TRAITS.filter((x) => !st.markedTraits.includes(x)).length < 2) return none('Fewer than two unmarked traits')
  if (opt.effect === 'subclass-upgrade' && !Object.values(st.subclassRanks).some((r) => r < RANKS.length)) return none('All your subclass cards are taken')
  return { tiers, reason: null }
}

/** State after the tier achievement and the given advancements of the level being built (for choosing cards and the like). */
export function afterAdvancements(prev: Progress, level: number, drafts: AdvancementRecord[], ch: Character, reg: Registry): Progress {
  return applyRecord(prev, { level, newExperience: 'x', advancements: drafts, newCardId: '' }, ch, reg).progress
}

/** Rule problems in a level being built, grouped by the wizard step they belong to. */
export function levelUpStages(ch: Character, rec: LevelRecord, reg: Registry): Record<Stage, string[]> {
  return applyRecord(progressOf(ch, reg), rec, ch, reg).stages
}
