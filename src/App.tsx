import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character, Creation } from './engine/character'
import type { CreationSetup } from './engine/creation'
import { Start } from './ui/Start'
import { Wizard } from './ui/Wizard'
import { CharacterView } from './ui/CharacterView'
import { LevelUp } from './ui/LevelUp'
import { normalize, setupOf, startCharacter, store } from './ui/data'
import './ui/ui.css'

type Screen = { kind: 'start' } | { kind: 'wizard'; opened: boolean } | { kind: 'view'; c: Character } | { kind: 'levelup'; from: Character }

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

  if (screen.kind === 'view') {
    return <CharacterView key={screen.c.id} ch={screen.c} onLevelUp={(c) => setScreen({ kind: 'levelup', from: c })} onOpen={(c) => (c.level > 1 ? setScreen({ kind: 'view', c }) : open(c, true))} onHome={() => setScreen({ kind: 'start' })} />
  }
  if (screen.kind === 'levelup') {
    return <LevelUp key={screen.from.id} from={screen.from} onDone={(c) => setScreen({ kind: 'view', c })} onCancel={() => setScreen(screen.from.level > 1 ? { kind: 'view', c: screen.from } : { kind: 'start' })} />
  }
  if (screen.kind === 'start' || !ch || !setup) {
    return <Start onStart={(s) => { const c = startCharacter(s); dirty.current = true; setCh(normalize(c)); setSetup(setupOf(c)); setStatus(''); setScreen({ kind: 'wizard', opened: false }) }} onOpen={(c) => (c.level > 1 ? setScreen({ kind: 'view', c }) : open(c, true))} onLevelUp={(c) => setScreen({ kind: 'levelup', from: c })} />
  }
  return <Wizard key={ch.id} ch={ch} setup={setup} update={update} saveStatus={status} onHome={home} opened={screen.opened} />
}
