// Generates src/data/history.sample.json: entries matching the REAL distribution of
// length, app and category, with invented text. Run: node scripts/make-sample.mjs
import { writeFileSync } from 'node:fs'
const rnd = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rnd(a.length)]
const APPS = [['com.apple.Terminal', 705], ['com.apple.MobileSMS', 52], [null, 50], ['com.google.Chrome', 20],
  ['com.electron.wispr-flow', 16], ['com.figma.Desktop', 10], ['com.anthropic.claudefordesktop', 6], ['com.apple.Notes', 5]]
const appPool = APPS.flatMap(([a, n]) => Array(n).fill(a))
const WORDS = 'the a to and of in that it is for on with as this be at by from or an are was but not have had were they you we can'.split(' ')
const OPENERS = ['Okay so', 'Let me think about', 'Can you', 'I want to', 'Actually', 'For the next step', 'Quick note:', 'Remember to', 'Also', 'One more thing,']
const TAILS = ['before we move on.', 'and then we can review it.', 'if that makes sense.', 'when you get a chance.', 'so it matches the rest.', 'and keep the same spacing.']
const SHORT = ['Hi.', 'Hi,', 'Oh.', 'You', 'We', '!!', '.', '?', 'Yes.', 'Okay', 'Thanks!', 'right now', 'hello.', 'Deal. Good night!', 'Just got it done!', 'On my way', 'Sounds good', 'One sec', 'Got it', 'Perfect.']
const FLAGS = ['Never mind, scratch that.', 'Oops, ignore that one.', 'Scratch that, wrong window.', 'Clean up, not what I meant.', 'Never mind.', 'Delete that, starting over.']
const sentence = (n) => { let s = pick(OPENERS); while (s.split(' ').length < n) s += ' ' + pick(WORDS); return s + ' ' + pick(TAILS) }
const out = []; const start = Date.UTC(2026, 7, 8, 1, 0, 0); const span = 35 * 864e5
for (let i = 0; i < 874; i++) {
  const t = new Date(start + Math.floor(i / 874 * span) + rnd(3600e3)).toISOString().replace('T', ' ').replace('Z', ' +00:00')
  const app = pick(appPool)
  let text = '', status = 'formatted', duration = 0
  const r = Math.random()
  if (r < 0.114) { text = ''; status = pick(['formatted', 'formatted', 'formatted', 'dismissed', 'no_audio']); duration = Math.random() < 0.7 ? +(Math.random() * 6).toFixed(2) : +(10 + Math.random() * 140).toFixed(2) }
  else if (r < 0.207) { text = pick(SHORT); duration = +(0.5 + Math.random() * 3).toFixed(2) }
  else if (r < 0.223) { text = pick(FLAGS); duration = +(1 + Math.random() * 3).toFixed(2) }
  else { const w = r < 0.38 ? 6 + rnd(9) : r < 0.62 ? 15 + rnd(30) : 45 + rnd(120); text = sentence(w); duration = +(w * 0.45 + Math.random() * 4).toFixed(2) }
  out.push({ id: crypto.randomUUID(), timestamp: t, app, url: null, status, isArchived: 0,
    numWords: text ? text.split(/\s+/).length : 0, duration, speechDuration: +(duration * 0.7).toFixed(2),
    asrText: text, formattedText: text, editedText: null, transcriptOrigin: 'internal', contentObservationEndReason: null })
}
writeFileSync(new URL('../src/data/history.sample.json', import.meta.url), JSON.stringify(out))
console.log('sample written', out.length)
