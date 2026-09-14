import { readFileSync } from 'node:fs'
import { detect, summarize, DEFAULT_THRESHOLD, textOf, appLabel } from '../src/sweep/detect.ts'
import type { Entry } from '../src/data/types.ts'
const entries: Entry[] = JSON.parse(readFileSync(new URL('../src/data/history.private.json', import.meta.url), 'utf8'))
const cands = detect(entries)
const s = summarize(entries, cands)
console.log(`total ${s.total}  empty ${s.empty}  cutoff ${s.cutoff}  reply ${s.reply}  flagged ${s.flagged}  candidates ${s.candidates}  share ${(s.share*100).toFixed(1)}%`)
const above = cands.filter(c => c.confidence >= DEFAULT_THRESHOLD).length
console.log(`preselected at ${DEFAULT_THRESHOLD}: ${above}   borderline: ${cands.length - above}`)
console.log('--- borderline rows (shown, not selected) ---')
for (const c of cands.filter(c => c.confidence < DEFAULT_THRESHOLD).slice(0, 12))
  console.log(`${c.confidence.toFixed(2)}  ${c.reason.padEnd(7)} ${appLabel(c.entry.app).padEnd(9)} "${textOf(c.entry).slice(0, 30)}"  (${c.why})`)
console.log('--- flagged rows ---')
for (const c of cands.filter(c => c.reason === 'flagged'))
  console.log(`${appLabel(c.entry.app).padEnd(9)} "${textOf(c.entry).slice(0, 60)}"`)
