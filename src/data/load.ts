import type { Entry } from './types.ts'
import sample from './history.sample.json'

// The real export is gitignored. If it is on disk, the local build uses it; the public build
// falls back to the synthetic sample that matches its distribution.
const privateMods = import.meta.glob('./history.private.json', { eager: true, import: 'default' }) as Record<string, Entry[]>
const privateData = Object.values(privateMods)[0]

// VITE_SAMPLE=1 forces the synthetic set even when the private export is on disk (to see the public build).
export const entries: Entry[] = ((import.meta.env.VITE_SAMPLE ? undefined : privateData) ?? (sample as Entry[]))
  .slice()
  .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
export const usingRealData = Boolean(privateData) && !import.meta.env.VITE_SAMPLE
