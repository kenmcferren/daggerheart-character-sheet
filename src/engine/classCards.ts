// Class-level domain card rules from pack data (Starheart classes, Series 13): which classes are offered, which
// domains and card types a character may take, how many level 1 cards, and the word swaps printed on cards.
import type { Registry } from './packs'
import type { CreationSetup } from './creation'

type Any = any
export interface CardWord { from: string; to: string; domains?: string[] }

/** Classes offered: core classes plus those whose `onlyWith` supplement is selected, by name. */
export function classList(setup: CreationSetup): Any[] {
  const active = new Set([setup.frame?.id, ...setup.supplements.map((s) => s.id)])
  return ([...setup.registry.classes.values()] as Any[]).filter((c) => !c.onlyWith || active.has(c.onlyWith))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

/** The class's domains plus any domain its held subclasses add (Witchwarper Ties that Bind / Destructive Nature). */
export function classDomains(cls: Any, subclassIds: string[], reg: Registry): string[] {
  const extra = subclassIds.map((id) => (reg.subclasses.get(id) as Any)?.extraDomain).filter(Boolean) as string[]
  return [...new Set([...(cls?.domains ?? []), ...extra])]
}

/** Level 1 domain cards at creation: the class's count (default 2), plus one from a subclass's extra domain. */
export function startingCardRule(cls: Any, sub: Any): { count: number; extraDomain?: string } {
  const extraDomain = sub?.extraDomain as string | undefined
  return { count: (cls?.startingDomainCards ?? 2) + (extraDomain ? 1 : 0), extraDomain }
}

/** Why a card's type is barred for this class (null = allowed). */
export function cardTypeProblem(cls: Any, card: Any): string | null {
  const ok = cls?.allowedCardTypes as string[] | undefined
  return ok && !ok.includes(card.type) ? `${cls.name} can only take ${ok.join(' or ')} cards` : null
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const plural = (s: string) => (/[^aeiou]y$/i.test(s) ? s.slice(0, -1) + 'ies' : s + 's')

/** Applies whole-word swaps, keeping plurals and a leading capital ("Spells" -> "Techs", "Book of Ava" -> "Program of Ava"). */
export function swapWords(text: string, words: CardWord[]): string {
  let out = text
  for (const w of words) {
    const re = new RegExp(`\\b(${esc(w.from).replace(/ /g, '\\s+')})(s?)\\b`, 'gi')
    out = out.replace(re, (_m, base: string, s: string) => {
      const to = s ? plural(w.to) : w.to
      return /^[A-Z]/.test(base) || /^[A-Z]/.test(w.to) ? to[0].toUpperCase() + to.slice(1) : to
    })
  }
  return out
}

/** A domain card as this class prints it: swapped name and text, and `typeLabel` for a relabelled type. */
export function classCard<T extends object>(card: T, cls: Any): T & { typeLabel?: string } {
  const c = card as Any
  const words = ((cls?.cardWords ?? []) as CardWord[]).filter((w) => !w.domains || w.domains.includes(c.domain))
  const typeDomains = cls?.cardTypeDomains as string[] | undefined
  const typeLabel = (!typeDomains || typeDomains.includes(c.domain)) ? cls?.cardTypes?.[c.type] as string | undefined : undefined
  if (!words.length && !typeLabel) return card as T & { typeLabel?: string }
  const sw = (t: unknown) => (typeof t === 'string' ? swapWords(t, words) : t)
  return { ...c, name: sw(c.name), rules: sw(c.rules), short: sw(c.short), ...(typeLabel ? { typeLabel } : {}) }
}
