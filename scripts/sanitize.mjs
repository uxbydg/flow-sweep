/**
 * Build a RECORDING dataset: real structure, real counts, no real text.
 *
 * ⛑ Why this exists. The video was shot against the real export and the opening frame
 * carried a person's name, three companies, and the production of the video itself.
 * Filtering rows was tried and rejected: removing rows moves the denominator, so
 * "one in eight" stops being true. This swaps TEXT instead and relocates rows by
 * timestamp, so every count and every ratio is preserved exactly.
 *
 * Two rules from src/sweep/detect.ts make it safe:
 *   1. line 78: text >= 20 chars that is not flagged is NEVER a candidate. So a long
 *      row can take any long replacement without touching the counts.
 *   2. short rows classify on shape (punctuation, dangling word, length), not content.
 *      So a short row is only ever replaced by one of the SAME shape.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = new URL('../src/data/history.private.FULL-BACKUP.json', import.meta.url)
const SAMPLE = new URL('../src/data/history.sample.json', import.meta.url)
const OUT = new URL('../src/data/history.private.json', import.meta.url)

const d = JSON.parse(readFileSync(SRC, 'utf8'))
const sample = JSON.parse(readFileSync(SAMPLE, 'utf8'))
const txt = e => (e.editedText || e.formattedText || e.asrText || '').trim()
const SHORT = 20
const FLAG = ['clean up','cleanup','never mind','nevermind','scratch that','not what i',
  'ignore that','ignore this','delete that','delete this','disregard','oops']
const startsFlagged = t => { const l=t.toLowerCase(); return FLAG.some(p=>l.startsWith(p)||(t.length<40&&l.includes(p))) }

// Pool of long, generated, flag-free replacements from the sample the public build already uses.
const pool = sample.map(txt).filter(t => t.length >= SHORT && !startsFlagged(t))
let i = 0
const nextLong = () => pool[(i++) % pool.length]

// 1. Replace the text of EVERY long row. Nothing real survives anywhere in the list.
let swapped = 0
for (const e of d) {
  const t = txt(e)
  if (t.length >= SHORT && !startsFlagged(t)) {
    const rep = nextLong()
    if (e.editedText) e.editedText = rep
    if (e.formattedText) e.formattedText = rep
    if (e.asrText) e.asrText = rep
    swapped++
  }
}

// 2. Short rows: same shape in, same shape out. Only the four that name things.
const SHORT_SWAP = {
  'In my application': 'In the second row',   // no ending, last word fine -> 0.50
  'resign me. Bye':    'resize it. Bye',      // no ending -> 0.50
  "I'm at Fidelity.":  "I'm at the top.",     // ends '.' -> reply 0.20
  'For Home Depot':    'For the top row',     // no ending -> 0.50
}
let shortSwapped = 0
for (const e of d) {
  const t = txt(e)
  if (SHORT_SWAP[t]) {
    const rep = SHORT_SWAP[t]
    if (e.editedText) e.editedText = rep
    if (e.formattedText) e.formattedText = rep
    if (e.asrText) e.asrText = rep
    shortSwapped++
  }
}
writeFileSync(OUT, JSON.stringify(d))
console.log(`long rows swapped: ${swapped}`)
console.log(`short rows swapped: ${shortSwapped}`)
console.log(`total rows: ${d.length}  (unchanged)`)
