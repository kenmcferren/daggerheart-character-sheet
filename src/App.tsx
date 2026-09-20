import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character, Creation } from './engine/character'
import type { CreationSetup } from './engine/creation'
import { Start } from './ui/Start'
import { Wizard } from './ui/Wizard'
import { normalize, setupOf, startCharacter, store } from './ui/data'
import './ui/ui.css'

type Screen = { kind: 'start' } | { kind: 'wizard'; opened: boolean }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'start' })
  const [ch, setCh] = useState<Character | null>(null)
  const [status, setStatus] = useState('')
  const dirty = useRef(false)
  const [setup, setSetup] = useState<CreationSetup | null>(null)

  const update = useCallback((fn: (c: Character, cr: Creation) => void) => {
    setCh((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next, next.creation!)
      dirty.current = true
      return next
    })
  }, [])

  // Autosave shortly after each change.
  useEffect(() => {
    if (!ch || !dirty.current) return
    setStatus('Saving…')
    const t = setTimeout(() => {
      store.save(ch).then(() => { dirty.current = false; setStatus('Saved') }).catch((e) => setStatus(`Not saved: ${String(e)}`))
    }, 400)
    return () => clearTimeout(t)
  }, [ch])

  const open = (c: Character, opened: boolean) => { dirty.current = false; setStatus(opened ? 'Saved' : ''); setCh(normalize(c)); setSetup(setupOf(c)); setScreen({ kind: 'wizard', opened }) }
  const home = async () => { if (ch && dirty.current) await store.save(ch).catch(() => {}); dirty.current = false; setCh(null); setScreen({ kind: 'start' }) }

  if (screen.kind === 'start' || !ch || !setup) {
    return <Start onStart={(f, s) => { const c = startCharacter(f, s); dirty.current = true; setCh(normalize(c)); setSetup(setupOf(c)); setStatus(''); setScreen({ kind: 'wizard', opened: false }) }} onOpen={(c) => open(c, true)} />
  }
  return <Wizard key={ch.id} ch={ch} setup={setup} update={update} saveStatus={status} onHome={home} opened={screen.opened} />
}
