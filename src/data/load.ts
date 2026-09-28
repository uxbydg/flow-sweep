import type { Entry } from './types.ts'
import data from './history.sample.json'

/**
 * ⛑⛑⛑ ONE DATASET, EVERYWHERE. Changed 2026-09-28.
 *
 * This used to prefer a gitignored `history.private.json` when it was on disk and
 * fall back to the committed file otherwise, which meant **localhost and the
 * deployed site were different applications**. The deployed one showed 230 to
 * review against localhost's 199, and a video was recorded against numbers the
 * shared link did not have. Daniel: "I want it to be the only spot for the source
 * of truth for Sweep from now on."
 *
 * A `VITE_SAMPLE` flag existed to paper over this and did not work: `import.meta.glob`
 * with `eager: true` resolves at build time, so the private export was bundled into
 * every local build whether or not the flag was set. Measured 26 September: the
 * flagged build still contained real transcripts and weighed 3,126 kB against
 * 3,201 kB unflagged. It removed 75 kB, not 1.5 MB. That was the whole of
 * BUILD-HAZARD.md, and deleting the code path closes it: there is no longer any
 * way for a local build to carry private data, because nothing imports it.
 *
 * ⚑ `history.sample.json` carries the REAL STRUCTURE of the 1,470-entry export:
 * every count and every ratio is the real one, with all 1,212 long rows holding
 * generated text and every URL stripped. So the numbers are checkable and nothing
 * dictated in private is published. `scripts/verify.ts` re-derives them from this
 * same file, and the untouched original is kept locally and gitignored at
 * `history.private.FULL-BACKUP.json` for re-deriving from source.
 */
export const entries: Entry[] = (data as Entry[])
  .slice()
  .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
