import { readFileSync } from 'node:fs'
import { detect, DEFAULT_THRESHOLD } from '../src/sweep/detect.ts'
import { OPT_IN } from '../src/sweep/labels.ts'
import { startOfDay } from '../src/format.ts'
import type { Entry } from '../src/data/types.ts'
const DAY = 864e5, HOLD_DAYS = 7
const entries: Entry[] = JSON.parse(readFileSync(new URL('../src/data/history.sample.json', import.meta.url),'utf8'))
const clock = () => Date.now()
const leavesOn = (it:{sweptAt:number}) => startOfDay(it.sweptAt) + HOLD_DAYS*DAY

let items: {id:string;sweptAt:number}[] = []
const cands = detect(entries).filter(c => !OPT_IN.includes(c.reason) && c.confidence >= DEFAULT_THRESHOLD)
console.log('candidates above threshold:', cands.length)
const byReason: Record<string,number> = {}
for (const c of cands) byReason[c.reason] = (byReason[c.reason]??0)+1
console.log('by reason:', byReason)

const seedAt = clock() - HOLD_DAYS*DAY
for (const [r,n] of [['empty',8],['cutoff',3],['flagged',1]] as [string,number][]) {
  const fresh = cands.filter(c => c.reason===r).slice(0,n)
  console.log(`  want ${n} ${r}: found ${fresh.length}`)
  items = [...items, ...fresh.map(c=>({id:c.entry.id, sweptAt:seedAt}))]
}
console.log('seeded items:', items.length)
const today = startOfDay(clock())
const due = items.filter(it => leavesOn(it) === today)
console.log('startOfDay(now)      :', today, new Date(today).toString().slice(0,24))
console.log('leavesOn(seeded)     :', items[0] && leavesOn(items[0]), items[0] && new Date(leavesOn(items[0])).toString().slice(0,24))
console.log('DUE TODAY (drives the card):', due.length)
