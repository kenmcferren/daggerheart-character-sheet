import type { PDFPage } from 'pdf-lib'
import type { Trait } from '../engine/character'
import {
  SYSTEMS, advancementOf, advancementOption, archetypeOf, boxesChecked, compartmentsOf, optionBoxes, primarySystems, shipConfiguration, shipFrame, shipStats, systemRollLines,
  totalChecked, vaultCapacity, type Ship, type ShipCard, type ShipRules,
} from '../engine/ship'
import { CREDIT, INKS, PAGE, Sheet, wrapLines, type Item, type SheetFonts } from './sheet'

// Starheart ship sheet (Series 14): one double-sided sheet per ship.
// Front: name, role and build; Evasion / thresholds stacked beside Hope, system HP and Stress rows; token trackers; then a box per system holding its cards.
// Back: the ship keywords and Refuel / Refit, as printed rules text (plus the licence notice when the ship prints on its own).
// Refit page (Series 16, only for a ship with advancements or vault cards): advancement boxes, vault cards, compartments and Suit Locker spare suits.
const { M, TOP, BOTTOM, W, CARD } = PAGE
const { INK, RULE, FAINT, SHADE, WHITE } = INKS
const title = (s: string) => s.replace(/^\w/, (c) => c.toUpperCase())
const sysName = (r: ShipRules, y: string) => r.systems.find((s) => s.id === y)?.name ?? title(y)
const roleName = (s: Ship) => (s.role === 'hub' ? 'Hub Ship' : 'Solo Flier')

/** The pilot: traits for the roll lines, Proficiency for "Pd" damage (printed as dice, bold blue, like the character sheet). */
export interface ShipPilot { name: string; traits: Partial<Record<Trait, number>>; proficiency?: number }

const SUB = '§' // the sheet's marker: a word holding it prints bold blue
type Kind = '' | 'b' | 'i'
/**
 * Card markup (**bold**, *italic*) as runs for Sheet.runs. Style is chosen per word (a word touching bold is bold), since the
 * sheet sets whole words; "Pd8+4" becomes "3d8+4" in bold blue when the pilot's Proficiency is known.
 */
export function cardSegs(markup: string, proficiency?: number): { t: string; f?: 'bold' | 'italic' }[] {
  let plain = '', i = 0
  const kinds: Kind[] = []
  while (i < markup.length) {
    if (markup.startsWith('**', i)) { const j = markup.indexOf('**', i + 2); for (const ch of markup.slice(i + 2, j)) { plain += ch; kinds.push('b') } i = j + 2 }
    else if (markup[i] === '*') { const j = markup.indexOf('*', i + 1); for (const ch of markup.slice(i + 1, j)) { plain += ch; kinds.push('i') } i = j + 1 }
    else { plain += markup[i]; kinds.push(''); i++ }
  }
  const segs: { t: string; f?: 'bold' | 'italic' }[] = []
  for (const m of plain.matchAll(/\S+/g)) {
    const ks = kinds.slice(m.index, m.index + m[0].length)
    const k: Kind = ks.includes('b') ? 'b' : ks.includes('i') ? 'i' : ''
    let word = m[0]
    if (proficiency) word = word.replace(/^Pd(\d+)/, (_x, d) => `${SUB}${proficiency}d${d}`)
    const f = k === 'b' ? 'bold' : k === 'i' ? 'italic' : undefined
    const last = segs[segs.length - 1]
    if (last && last.f === f && !word.includes(SUB) && !last.t.includes(SUB)) last.t += ' ' + word
    else segs.push({ t: word, f })
  }
  return segs
}

/** A row of empty boxes (squares) or circles; returns the height used. */
function boxes(p: PDFPage, n: number, x: number, top: number, w: number, shape: 'square' | 'circle', d = 11): number {
  const pitch = d + 3, perRow = Math.max(1, Math.floor((w + 3) / pitch)), rows = Math.max(1, Math.ceil(n / perRow))
  for (let i = 0; i < n; i++) {
    const cx = x + (i % perRow) * pitch, cy = top - Math.floor(i / perRow) * (d + 3) - d
    if (shape === 'circle') p.drawCircle({ x: cx + d / 2, y: cy + d / 2, size: d / 2, borderWidth: 0.9, borderColor: INK, color: WHITE })
    else p.drawRectangle({ x: cx, y: cy, width: d, height: d, borderWidth: 0.9, borderColor: INK, color: WHITE })
  }
  return rows * (d + 3)
}

/** One card: name and domain, its own trackers, then the rules text (keywords and costs bold). Odd cards are shaded. */
function cardBlock(s: Sheet, r: ShipRules, c: ShipCard, w: number, shade: boolean, proficiency?: number): Item {
  const pad = 4, bw = w - 2 * pad
  const meta = r.domains.find((d) => d.id === c.domain)?.name ?? title(c.domain)
  const trackers: { label: string; n: number }[] = [
    ...(c.reloadTokens ? [{ label: 'Reload Tokens', n: c.reloadTokens }] : []),
    ...(c.cardTokens ? [{ label: `${c.cardTokens.name} Token${c.cardTokens.max > 1 ? 's' : ''}`, n: c.cardTokens.max }] : []),
    ...(c.usesPer ? [{ label: `Used (once per ${c.usesPer === 'refuel' ? 'Refuel' : 'scene'})`, n: 1 }] : []),
  ]
  const body = s.runs(cardSegs(c.rules, proficiency), bw, { size: CARD })
  const h = 15 + trackers.length * 13 + body.reduce((n, i) => n + i.h, 0) + 2 * pad
  return { h, draw: (p, x, top) => {
    if (shade) p.drawRectangle({ x, y: top - h, width: w, height: h, color: SHADE, borderWidth: 0 })
    let y = top - pad
    s.text(p, c.name, x + pad, y, s.f.bold, 10.5)
    s.text(p, meta, x + w - pad - s.f.body.widthOfTextAtSize(meta, 8.5), y - 1.5, s.f.body, 8.5)
    y -= 15
    for (const tr of trackers) {
      s.text(p, tr.label, x + pad, y, s.f.body, 8.5)
      boxes(p, tr.n, x + pad + s.f.body.widthOfTextAtSize(tr.label, 8.5) + 6, y + 1, bw, 'circle', 9)
      y -= 13
    }
    for (const it of body) { it.draw(p, x + pad, y); y -= it.h }
  } }
}

/** One outlined box per system: its name in the display face (Audiowide) across the top, then that system's cards. */
function systemBox(s: Sheet, r: ShipRules, sys: string, cards: ShipCard[], w: number, proficiency?: number): Item[] {
  const pad = 5, HEAD = 22
  const font = s.f.display ?? s.f.head
  const items = cards.map((c, i) => cardBlock(s, r, c, w - 2 * pad, i % 2 === 1, proficiency))
  const h = HEAD + items.reduce((n, it) => n + it.h, 0) + pad
  return [{ h: h + 10, draw: (p, x, top) => {
    p.drawRectangle({ x, y: top - h, width: w, height: h, borderWidth: 1.2, borderColor: INK })
    s.text(p, sysName(r, sys).toUpperCase(), x + pad + 1, top - 5, font, 13)
    p.drawLine({ start: { x: x + pad, y: top - HEAD + 2 }, end: { x: x + w - pad, y: top - HEAD + 2 }, thickness: 0.6, color: RULE })
    let y = top - HEAD
    for (const it of items) { it.draw(p, x + pad, y); y -= it.h }
  } }]
}

/** True when the ship has earned an advancement or holds a vault card: then it prints a refit page after its back. */
export const hasRefitPage = (ship: Ship) => { const a = advancementOf(ship); return a.taken.length > 0 || a.vaultCardIds.length > 0 }

/** A row of boxes with a light grey outline (slots the player darkens by hand). */
function greyBoxes(n: number, d = 11): Item {
  return { h: d + 4, draw: (p, x, top) => {
    for (let i = 0; i < n; i++) p.drawRectangle({ x: x + i * (d + 3), y: top - d - 1, width: d, height: d, borderWidth: 0.9, borderColor: FAINT, color: WHITE })
  } }
}

/** The refit page: where advancements, the vault and compartments are tracked. Column width is half the page. */
function addRefitPage(s: Sheet, r: ShipRules, ship: Ship, pilot: ShipPilot | null) {
  s.newPage()
  const adv = r.advancement
  if (!adv) return
  const a = advancementOf(ship)
  const cg = 14, cw = (W - cg) / 2
  s.fitText(s.page, `${ship.name || 'Unnamed ship'}: refit and advancement`, M, TOP, s.f.head, 16, W, 10)
  s.rule(TOP - 22, 1)
  const para = (markup: string, size = 8.5, after = 3): Item[] => s.runs(cardSegs(markup), cw, { size, after })
  const items: Item[] = []

  items.push(s.heading('Advancement', 10))
  items.push(...para('Advancing happens only during a refit, at the pace your GM sets. Each advancement, choose one option and check one of its boxes. The loadout holds 7 cards. Every 2 boxes checked add 1 more card, which goes in the vault.'))
  const takesText = (id: string) => a.taken.filter((t) => t.optionId === id).map((t) => {
    const o = advancementOption(r, id)
    const g = o?.gains?.[t.gain ?? 0]
    const sys = t.system ? sysName(r, t.system) : ''
    if (t.compartmentId) return adv.compartments.find((c) => c.id === t.compartmentId)?.name ?? t.compartmentId
    if (g?.hp) return `Hull Point (${sys})`
    if (g?.stress) return 'Stress slot'
    if (g?.evasion) return '+1 Evasion'
    if (g?.thresholds) return `+${g.thresholds[0]}/+${g.thresholds[1]}`
    return ''
  }).filter(Boolean).join(', ')
  for (const o of adv.options) {
    const n = optionBoxes(ship, o), used = boxesChecked(ship, o.id)
    const note = takesText(o.id)
    const name = o.name
    items.push({ h: 15, draw: (p, x, top) => {
      s.text(p, name, x, top - 2, s.f.bold, 8.5)
      let bx = x + s.f.bold.widthOfTextAtSize(name, 8.5) + 8
      const d = 10
      for (let i = 0; i < n; i++) {
        p.drawRectangle({ x: bx, y: top - d - 1, width: d, height: d, borderWidth: 0.9, borderColor: INK, color: i < used ? INK : WHITE })
        bx += d + 3
      }
    } })
    if (note) items.push(...s.runs([{ t: note, f: 'italic' }], cw, { size: 8, after: 2 }))
  }
  items.push(...para(`Boxes checked: ${totalChecked(ship)}`, 8.5, 6))

  items.push(s.space(4), s.heading(`Vault (${a.vaultCardIds.length} of ${vaultCapacity(r, ship)})`, 10))
  items.push(...para('New cards go to the vault. While Available effects of vaulted cards are always active. Cards swap with the loadout only during a refit.'))
  const vault = a.vaultCardIds.map((id) => r.cards.find((c) => c.id === id)).filter((c): c is ShipCard => !!c)
  if (!vault.length) items.push(...para('No vault cards.'))
  vault.forEach((c, i) => items.push(cardBlock(s, r, c, cw, i % 2 === 1, pilot?.proficiency)))

  const comps = compartmentsOf(r, ship)
  if (comps.length) {
    items.push(s.space(6), s.heading('Compartments', 10))
    for (const c of comps) {
      items.push(...s.runs([{ t: `${c.name}.`, f: 'bold' }, ...cardSegs(' ' + c.rules)], cw, { size: 8.5, after: 3 }))
      if (c.spareSuits) {
        for (let i = 1; i <= c.spareSuits.count; i++) {
          items.push({ h: 11, draw: (p, x, top) => s.text(p, `Spare suit ${i}: name and marked armor slots`, x, top, s.f.body, 8) })
          items.push(greyBoxes(c.spareSuits.slots))
        }
        items.push(s.space(4))
      }
    }
  }
  s.pour(items, [M, M + cw + cg], TOP - 30)
}

/** Adds the ship's two pages to the sheet. Starts on a fresh sheet of paper (adds a blank page if the page count is odd), unless it is the document's first page. */
export function addShipPages(s: Sheet, r: ShipRules, ship: Ship, pilot: ShipPilot | null, opts: { notices?: string[]; firstPage?: boolean } = {}) {
  if (!opts.firstPage) {
    if (s.doc.getPageCount() % 2 === 1) s.newPage()
    s.newPage()
  }
  const p = s.page
  const st = shipStats(r, ship)
  const cfg = shipConfiguration(r, ship), fr = shipFrame(r, ship)
  const prim = primarySystems(r, ship)
  const lines = systemRollLines(r, ship, pilot?.traits)

  // -- name line --
  s.fitText(p, ship.name || 'Unnamed ship', M, TOP, s.f.head, 24, W, 12)
  s.rule(TOP - 31, 1.2)
  const pilotText = `Pilot: ${pilot ? pilot.name || 'Unnamed character' : '____________________'}`
  const pw = s.f.body.widthOfTextAtSize(pilotText, 9)
  s.text(p, pilotText, M + W - pw, TOP - 36, s.f.body, 9)
  const build = [`${roleName(ship)} (size ${ship.size}${st.sizeName !== roleName(ship) ? `, ${st.sizeName}` : ''})`, cfg?.name, fr && `${fr.name} frame`, ship.choices.domainIds.map((d) => r.domains.find((x) => x.id === d)?.name ?? d).join(' & ')].filter(Boolean).join(' · ')
  s.fitText(p, build, M, TOP - 36, s.f.head, 9.5, W - pw - 12)

  // -- top band, laid out like the character sheet (owner, 2026-11-07) --
  // Left: Evasion, Major, Severe stacked (name above a box). Beside them, one row of boxes per track, dark for earned slots and
  // faint up to the cap, with the name after the boxes; system rows also give the pilot trait and its value.
  let y = TOP - 50
  const stats: [string, string][] = [['Evasion', String(st.evasion ?? '')], ['Major', String(st.thresholds?.[0] ?? '')], ['Severe', String(st.thresholds?.[1] ?? '')]]
  stats.forEach(([name, val], i) => {
    const top = y - i * 36, cx = M + 34
    s.text(p, name, cx - s.f.body.widthOfTextAtSize(name, 11) / 2, top, s.f.body, 11)
    p.drawRectangle({ x: cx - 31, y: top - 32, width: 62, height: 18, borderWidth: 1, borderColor: INK })
    s.text(p, val, cx - s.f.bold.widthOfTextAtSize(val, 12) / 2, top - 15.5, s.f.bold, 12)
  })
  const mx = M + 80, BOX = 12, PITCH = 13, PER_ROW = 7
  const labelX = mx + PER_ROW * PITCH + 8, traitX = labelX + 64, valueX = traitX + 46
  let top = y - 2
  const row = (name: string, count: number, earned: number, shaded: boolean, trait?: { name: string; value: string }) => {
    const perRow = Math.min(count, name === 'Stress' ? 6 : PER_ROW), rows = Math.ceil(count / perRow), h = rows * PITCH
    if (shaded) p.drawRectangle({ x: mx - 5, y: top - h - 3, width: valueX + 20 - mx + 5, height: h + 5, color: SHADE, borderWidth: 0 })
    for (let i = 0; i < count; i++) {
      const cx = mx + (i % perRow) * PITCH, cy = top - Math.floor(i / perRow) * PITCH - BOX
      p.drawRectangle({ x: cx, y: cy, width: BOX, height: BOX, borderWidth: i < earned ? 1.1 : 0.6, borderColor: i < earned ? INK : FAINT, color: WHITE })
    }
    s.text(p, name, labelX, top - 1.5, s.f.body, 10)
    if (trait) {
      s.text(p, trait.name, traitX, top - 1.5, s.f.body, 10)
      s.text(p, trait.value, valueX, top - 1.5, s.f.bold, 10)
    }
    top -= h + 5
  }
  row('Hope', 6, 6, false)
  SYSTEMS.forEach((sys, i) => {
    const ln = lines[i]
    const value = ln.value === null ? '___' : `${ln.value >= 0 ? '+' : ''}${ln.value}`
    row(sysName(r, sys), r.build.maxHpPerSystem, st.hp[sys], i % 2 === 0, ln.trait ? { name: title(ln.trait), value } : undefined)
  })
  row('Stress', 12, st.stress, false)
  // Right of the tracks: which systems are primary, then the ship's archetype (name and features) at the largest size that fits
  // beside the tracks (Series 15, owner 2026-11-08). Breached and Disabled go on full-width lines below the boxes.
  const nx = valueX + 26, nw = M + W - nx
  let ny = y - 2
  if (cfg) {
    for (const l of wrapLines(`Primary systems: ${prim.map((x) => sysName(r, x)).join(' and ')}.`, s.f.body, 8.5, nw)) { s.text(p, l, nx, ny, s.f.body, 8.5, RULE); ny -= 10.5 }
    ny -= 3
  }
  const arch = archetypeOf(r, ship)
  if (arch) {
    const build = (size: number) => [
      ...s.runs([{ t: `Archetype: ${arch.name}`, f: 'bold' }], nw, { size: size + 1, after: 2 }),
      ...arch.features.flatMap((f) => s.runs(cardSegs(f), nw, { size, after: 2 })),
    ]
    const room = ny - Math.min(y - 3 * 36, top)
    let size = 8.5, items = build(size)
    while (size > 6.5 && items.reduce((n, it) => n + it.h, 0) > room) { size -= 0.25; items = build(size) }
    for (const it of items) { it.draw(p, nx, ny); ny -= it.h }
  }
  y = Math.min(y - 3 * 36, top, ny) - 4
  for (const note of ['A system with every HP marked is **Breached**: actions using it have disadvantage.', 'A ship with every HP marked is **Disabled**.']) {
    for (const it of s.runs(cardSegs(note), W, { size: 8.5 })) { it.draw(p, M, y); y -= it.h }
  }
  y -= 2

  // -- token trackers (Analysis, Power) --
  if (st.tokenTrackers.length) {
    s.rule(y, 0.8)
    y -= 6
    const gap = 10, half = (W - gap) / 2
    st.tokenTrackers.forEach((t, i) => {
      const x = M + i * (half + gap), label = `${title(t.token)} Tokens (up to ${t.max})`
      s.text(p, label, x, y, s.f.bold, 8.5)
      boxes(p, t.max, x + s.f.bold.widthOfTextAtSize(label, 8.5) + 8, y + 1, half, 'circle', 10)
    })
    y -= 18
  }
  s.rule(y, 0.8)
  y -= 8

  // -- the cards: one box per system that has cards, the boxes in two balanced columns (owner, 2026-11-07) --
  const cg = 14, cw2 = (W - cg) / 2
  const cardsOf = (sys: string) => ship.choices.cardIds.map((id) => r.cards.find((c) => c.id === id)).filter((c): c is ShipCard => !!c && c.system === sys)
  const blocks = SYSTEMS.filter((sys) => cardsOf(sys).length).map((sys) => systemBox(s, r, sys, cardsOf(sys), cw2, pilot?.proficiency))
  const hs = blocks.map((b) => b.reduce((n, it) => n + it.h, 0))
  // Split the list where the taller column is shortest; fall back to pouring when they don't fit.
  let best = 0, bestH = Infinity
  for (let k = 0; k <= blocks.length; k++) {
    const t = Math.max(hs.slice(0, k).reduce((a, b) => a + b, 0), hs.slice(k).reduce((a, b) => a + b, 0))
    if (t < bestH) { bestH = t; best = k }
  }
  if (bestH <= y - BOTTOM) {
    ;[blocks.slice(0, best), blocks.slice(best)].forEach((col, ci) => {
      let cy = y
      for (const it of col.flat()) { it.draw(p, M + ci * (cw2 + cg), cy); cy -= it.h }
    })
  } else s.pourBlocks(blocks, [M, M + cw2 + cg], y)

  // -- back: keywords and resting --
  if (s.doc.getPageCount() % 2 === 1) s.newPage()
  const back = s.page
  s.fitText(back, `${ship.name || 'Unnamed ship'}: ship rules`, M, TOP, s.f.head, 16, W, 10)
  s.rule(TOP - 22, 1)
  const items: Item[] = []
  const kw = r.keywords ?? []
  items.push(s.heading('Keywords', 10))
  // Back-page text carries the same **bold** / *italic* markup as the cards; a "**Lead**" at the start of a line is the bold lead-in.
  const rules = (lead: string | undefined, markup: string): Item[] => {
    const lines = markup.split('\n').filter((l) => l.trim())
    return lines.flatMap((l, i) => s.runs([...(i === 0 && lead ? [{ t: lead, f: 'bold' as const }] : []), ...cardSegs(l)], cw2, { size: 8.5, after: i === lines.length - 1 ? 3 : undefined }))
  }
  for (const k of kw) items.push(...rules(`${k.name}:`, k.rules.split('\n').map((l) => l.replace(/^- /, '• ')).join('\n')))
  // The notice (standalone ship sheets only) sits at the foot of the back page.
  const NOTICE = 7.5, LEAD = 9
  const paras = (opts.notices ?? []).map((t) => wrapLines(t, s.f.body, NOTICE, W))
  const noticeH = paras.length ? 14 + paras.reduce((n, q) => n + q.length * LEAD, 0) + (paras.length - 1) * 4 : 0
  // Printed rules blocks, in order: the chase summary (starts column 2, owner 2026-11-08), then resting.
  // The column break is a spacer that fills what is left of column 1.
  const col1Room = TOP - 30 - (BOTTOM + noticeH) - items.reduce((n, it) => n + it.h, 0) - 0.5
  if (col1Room > 0) items.push(s.space(col1Room))
  for (const [key, head] of [['Chase Summary', 'Chases'], ['Resting', 'Resting']] as const) {
    const sec = r.rulesSections?.find((x) => x.title === key)
    if (!sec) continue
    items.push(s.space(4), s.heading(head, 10))
    for (const l of sec.text.split('\n').filter((l) => l.trim())) {
      items.push(...rules(undefined, l.replace(/^- /, '')))
    }
  }
  const backNo = s.doc.getPageCount() - 1
  s.pour(items, [M, M + cw2 + cg], TOP - 30, (_c, pageNo) => (pageNo === 0 ? BOTTOM + noticeH : BOTTOM))
  if (paras.length) {
    const np = s.doc.getPage(backNo)
    let ny = M + noticeH
    np.drawLine({ start: { x: M, y: ny }, end: { x: M + W, y: ny }, thickness: 0.6, color: RULE })
    s.text(np, 'Notices', M, ny - 3, s.f.bold, 8.5)
    ny -= 14
    for (const para of paras) {
      for (const l of para) { s.text(np, l, M, ny, s.f.body, NOTICE, RULE); ny -= LEAD }
      ny -= 4
    }
  }
  if (hasRefitPage(ship)) addRefitPage(s, r, ship, pilot)
}

/** A ship on its own: its two pages plus the licence notice. */
export async function renderShipSheet(ship: Ship, rules: ShipRules, fonts: SheetFonts, pilot: ShipPilot | null): Promise<Uint8Array> {
  const s = await Sheet.create(fonts, ship.name || 'Ship Sheet')
  addShipPages(s, rules, ship, pilot, { notices: CREDIT, firstPage: true })
  return s.doc.save()
}
