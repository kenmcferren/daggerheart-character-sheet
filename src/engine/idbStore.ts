import { get, set, del, keys } from 'idb-keyval'
import type { KeyValueStore } from './saves'

/** Browser IndexedDB adapter (not unit-tested in node; verify live in the browser). */
export const idbStore: KeyValueStore = {
  get: (k) => get(k),
  set: (k, v) => set(k, v),
  del: (k) => del(k),
  keys: async () => (await keys()).map(String),
}
