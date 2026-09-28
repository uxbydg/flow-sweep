/**
 * Stage the opening shot.
 *
 * Daniel, 2026-09-26, on the 9:55 row being a four-paragraph wall:
 *   "the 955 is way too long. You can fit 5 or 4 smaller ones in there... let's do it in
 *    the middle. Let's do the second-to-the-top one blank. The first and fourth ones are
 *    texts that will be removed by one of the filters."
 *
 * So that one tall row becomes FOUR short rows: filter-caught, blank, ordinary,
 * filter-caught. Denser top, and more visibly leaves when Sweep runs.
 *
 * ⚑ Rows are RELOCATED by timestamp, never created, and long replacement text is capped
 * near the top so no row becomes a wall again. Creating rows moves the denominator and
 * breaks "one in eight"; moving them cannot change any count.
 */
import { readFileSync, writeFileSync } from 'node:fs'
const P = new URL('../src/data/history.private.json', import.meta.url)
const S = new URL('../src/data/history.sample.json', import.meta.url)
const d = JSON.parse(readFileSync(P,'utf8'))
const sample = JSON.parse(readFileSync(S,'utf8'))
const txt = e => (e.editedText||e.formattedText||e.asrText||'').trim()
const SHORT=20, ENDS=/[.!?]["”’')\]]*$/u
const DANGLING=new Set(['the','a','an','to','of','and','but','or','if','for','with','in','at','by','from','my','your','our','we',"i'm",'is','are','was','be','because','than'])
const WHOLE=new Set(['it','go','no','ok','me','up','on','do','hi','yes','now','so','yo','ya','oh'])
function shape(e){
  const t=txt(e)
  if(!t.length) return (e.duration??0)>30 && e.status!=='dismissed' ? 'retry':'empty'
  if(t.length>=SHORT) return 'long'
  const w=t.toLowerCase().replace(/[^\p{L}\p{N}'\s-]/gu,' ').split(/\s+/).filter(Boolean)
  const last=w[w.length-1]??''
  if(ENDS.test(t)&&!DANGLING.has(last)) return 'reply'
  if(/-\p{L}?$/u.test(last)||t.endsWith(',')||DANGLING.has(last)) return 'sure-cutoff'
  if(w.length>1&&last.length<=2&&!WHOLE.has(last)&&!/\d/.test(last)) return 'sure-cutoff'
  if(w.length===1&&last.length<=3&&!WHOLE.has(last)) return 'sure-cutoff'
  return 'borderline'
}
d.sort((a,b)=> a.timestamp<b.timestamp?1:-1)

// ⚑ No walls near the top: one paragraph, comfortably under three lines.
const tidy = sample.map(txt).filter(t=>t.length>=SHORT && t.length<=105 && !t.includes('\n'))

// THE LAYOUT. goes = swept by default · asks = only if you tick a pill · '' = ordinary
const LAYOUT = [
  'long',                                   //  0
  'goes-empty',                             //  1
  'goes-cut', 'goes-empty', 'long', 'goes-cut',   // 2-5  the four that replace the 9:55 wall
  'asks',                                   //  6
  'long',                                   //  7
  'goes-empty',                             //  8
  'asks',                                   //  9
  'long',                                   // 10
  'asks',                                   // 11
  'long',                                   // 12
  'goes-cut',                               // 13
  'long',                                   // 14
]
const pick = {}
const take = s => { pick[s] = pick[s] ?? d.filter(e=>shape(e)===s); return pick[s].shift() }
const slot = k => k==='goes-empty' ? take('empty') : k==='goes-cut' ? take('sure-cutoff')
              : k==='asks' ? take('borderline') : take('long')

const stamps = d.slice(0, LAYOUT.length).map(e=>e.timestamp)
const chosen = LAYOUT.map(slot)
if (chosen.some(x=>!x)) { console.error('ran out of a shape'); process.exit(1) }
// ⚡ Unique text per visible row. An index-modulo pick repeated the same sentence at
// rows 4 and 14, which reads as a glitch in a list that is supposed to look like real use.
const seen = new Set()
const freshLong = () => { for (const t of tidy) if (!seen.has(t)) { seen.add(t); return t } return tidy[0] }
chosen.forEach((e,i)=>{
  e.timestamp = stamps[i]
  if (shape(e)==='long') {                                  // cap the walls
    const rep = freshLong()
    if (e.editedText) e.editedText = rep
    if (e.formattedText) e.formattedText = rep
    if (e.asrText) e.asrText = rep
  }
})
writeFileSync(P, JSON.stringify(d))
d.sort((a,b)=> a.timestamp<b.timestamp?1:-1)
console.log('--- top 15 ---')
d.slice(0,15).forEach((e,i)=>{
  const s=shape(e)
  const m = s==='empty'||s==='sure-cutoff' ? 'GOES' : s==='borderline' ? 'ASKS' : '    '
  console.log(`${String(i).padStart(2)} ${m}  ${JSON.stringify(txt(e).slice(0,52))}`)
})
const t15=d.slice(0,15).map(shape)
console.log(`\ngoes ${t15.filter(s=>s==='empty'||s==='sure-cutoff').length}   asks ${t15.filter(s=>s==='borderline').length}`)
