// Level-up rules as pack data (Series 5, step 1).
// Rules text is verbatim from SRD "Leveling Up.md"; the slot counts per tier are NOT in the SRD text, they come from the
// printed level-up sheet the owner supplied (2026-09-20): see Docs/plan.md, Series 5, Q1.
export function buildLevelUpRules(rd) {
  const md = rd('Core Mechanics/Leveling Up.md')
  const section = (title) => md.split(/^## /m).find((s) => s.startsWith(title)) ?? ''
  const bullets = (s) => s.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim())
  const after = (b) => b.slice(b.indexOf(': ') + 2)
  const prose = (s) => s.split('\n').filter((l) => l.trim() && !l.startsWith('#')).join(' ')

  // ---- Tier achievements (Step One)
  const ach = bullets(section('Step One'))
  if (ach.length !== 3) throw new Error('tier achievements parse')
  const achievements = [2, 5, 8].map((level, i) => ({
    id: `tier-achievement-${level}`, name: `Level ${level} tier achievement`, kind: 'tier-achievement', level,
    newExperience: 2, proficiency: 1, clearTraitMarks: level > 2, rules: ach[i],
  }))

  // ---- Advancements (Step Two). Slots per tier: owner's level-up sheet.
  const adv = bullets(section('Step Two'))
  if (adv.length !== 9) throw new Error('advancement parse')
  const S = (t2, t3, t4) => Object.fromEntries([[2, t2], [3, t3], [4, t4]].filter(([, n]) => n > 0))
  const spec = [
    { id: 'traits', name: 'Increase two traits', effect: 'traits', slots: S(3, 3, 3), marksTraits: true },
    { id: 'hit-point', name: 'Add a Hit Point slot', effect: 'hit-point', slots: S(2, 2, 2) },
    { id: 'stress', name: 'Add a Stress slot', effect: 'stress', slots: S(2, 2, 2) },
    { id: 'experience', name: 'Increase two Experiences', effect: 'experience', slots: S(1, 1, 1) },
    { id: 'domain-card', name: 'Take an additional domain card', effect: 'domain-card', slots: S(1, 1, 1) },
    { id: 'evasion', name: 'Increase Evasion', effect: 'evasion', slots: S(1, 1, 1) },
    { id: 'subclass-upgrade', name: 'Take an upgraded subclass card', effect: 'subclass-upgrade', slots: S(0, 1, 1), minLevel: 5, crossesOut: [{ option: 'multiclass', scope: 'tier' }] },
    { id: 'proficiency', name: 'Increase Proficiency', effect: 'proficiency', slots: S(0, 2, 2), cost: 2, minLevel: 5 },
    { id: 'multiclass', name: 'Multiclass', effect: 'multiclass', slots: S(0, 2, 2), cost: 2, minLevel: 5, crossesOut: [{ option: 'subclass-upgrade', scope: 'one' }, { option: 'multiclass', scope: 'all' }] },
  ]
  const mcText = rd('Core Mechanics/Multiclassing.md').split('\n').filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>')).join('\n')
  const advancements = spec.map((o, i) => ({
    kind: 'advancement', cost: 1, ...o,
    rules: o.id === 'multiclass' ? `${after(adv[i])}\n${mcText}` : after(adv[i]),
  }))

  // ---- Fixed per-level steps (Steps Three and Four)
  const steps = [
    { id: 'damage-thresholds', name: 'Damage thresholds', kind: 'level-step', effect: 'thresholds', rules: prose(section('Step Three')) },
    { id: 'level-domain-card', name: 'New domain card', kind: 'level-step', effect: 'level-domain-card', rules: prose(section('Step Four')) },
  ]

  // ---- Class-specific level-up rules (SRD class text)
  const line = (f, start) => {
    const l = rd(`Classes/${f}`).split('\n').find((x) => x.startsWith(start))
    if (!l) throw new Error(`missing line ${start}`)
    return l
  }
  const classSpecific = [
    { id: 'brawler-combo-die', name: 'Increase Combo Die', kind: 'advancement', classId: 'brawler', effect: 'combo-die', slots: S(1, 1, 1), cost: 1,
      rules: line('Brawler Class.md', 'Your Combo Die starts as') },
    { id: 'brawler-stance', name: 'Choose an additional stance', kind: 'level-step', classId: 'brawler', effect: 'stance', count: 1,
      rules: line('Brawler Class.md', 'Take the Martial Stances sheet') },
    { id: 'ranger-companion-option', name: 'Choose a companion level-up option', kind: 'level-step', classId: 'ranger', effect: 'companion-option', count: 1,
      rules: line('Ranger Class.md', 'Take the Ranger Companion sheet') },
  ]
  return [...achievements, ...advancements, ...steps, ...classSpecific]
}
