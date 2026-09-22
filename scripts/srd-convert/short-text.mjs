// Condensed ("short") wording for the printed sheet. The SRD wording stays in `rules`; each entry gets an optional `short`.
// One hand-edited JSON file per class in scripts/srd-convert/short/<classId>.json:
//   { "hope": "...", "features": [{ "name": "...", "short": "..." }], "subclasses": { "<subclassId>": [{ "name": "...", "short": "..." }] },
//     "stances": { "<stanceId>": "..." }, "companion": { "<optionId>": "..." } }
// Arrays line up with the pack's features by position; `name` is checked so an SRD re-conversion cannot shift text onto the wrong feature.
// A feature entry may also carry "cards": { "label": "Poison", "items": [{ "name": "...", "short": "..." }] }: items that print as their own
// blocks on the domain card sheet (e.g. poisons); each item name must appear in the feature's SRD text.
// A feature entry may also carry "table": { "title": "Elements", "rows": [{ "name": "Fire", "short": "..." }] }: one column of a table printed across the
// top of the domain card sheet (rows are shared by the features of one subclass, e.g. Druid elements); row names must appear in the SRD text.
// A short of "" means "print nothing": the text was folded into the previous feature.
import { existsSync, readFileSync } from 'node:fs'

export function applyShortText(classes, subclasses, dir = 'scripts/srd-convert/short') {
  let applied = 0
  for (const cls of classes) {
    const file = `${dir}/${cls.id}.json`
    if (!existsSync(file)) continue
    const src = JSON.parse(readFileSync(file, 'utf8'))
    const put = (target, s, where) => {
      if (typeof s.short !== 'string') throw new Error(`${where}: short must be a string`)
      if ((s.name ?? undefined) !== (target.name ?? undefined)) throw new Error(`${where}: name "${s.name}" does not match "${target.name}"`)
      target.short = s.short
      applied++
      if (s.table) {
        for (const r of s.table.rows) if (!target.rules.includes(r.name)) throw new Error(`${where}: row "${r.name}" is not in the SRD text`)
        target.sheetTable = s.table
        applied += s.table.rows.length
      }
      if (s.cards) {
        for (const it of s.cards.items) if (!target.rules.includes(it.name)) throw new Error(`${where}: card "${it.name}" is not in the SRD text`)
        target.sheetCards = s.cards
        applied += s.cards.items.length
      }
    }
    const list = (targets, shorts, where) => {
      if (!Array.isArray(shorts) || shorts.length !== targets.length) throw new Error(`${where}: expected ${targets.length} entries, got ${shorts?.length}`)
      targets.forEach((t, i) => put(t, shorts[i], `${where}[${i}]`))
    }
    if (src.hope !== undefined) { cls.hopeFeature.short = src.hope; applied++ }
    if (src.features) list(cls.features, src.features, `${cls.id}.features`)
    for (const [id, shorts] of Object.entries(src.subclasses ?? {})) {
      const sub = subclasses.find((s) => s.id === id)
      if (!sub || sub.class !== cls.id) throw new Error(`${cls.id}: unknown subclass ${id}`)
      list(sub.features, shorts, id)
    }
    for (const [id, short] of Object.entries(src.stances ?? {})) {
      const st = cls.stances?.find((x) => x.id === id)
      if (!st) throw new Error(`${cls.id}: unknown stance ${id}`)
      st.short = short; applied++
    }
    for (const [id, short] of Object.entries(src.companion ?? {})) {
      const o = cls.companion?.levelUpOptions.find((x) => x.id === id)
      if (!o) throw new Error(`${cls.id}: unknown companion option ${id}`)
      o.short = short; applied++
    }
  }
  return applied
}
