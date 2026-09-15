// Generates src/data/history.sample.json: entries matching the REAL distribution of
// length, app and category, with invented text. Run: node scripts/make-sample.mjs
import { writeFileSync } from 'node:fs'
const rnd = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rnd(a.length)]
const APPS = [['com.apple.Terminal', 705], ['com.apple.MobileSMS', 52], [null, 50], ['com.google.Chrome', 20],
  ['com.electron.wispr-flow', 16], ['com.figma.Desktop', 10], ['com.anthropic.claudefordesktop', 6], ['com.apple.Notes', 5]]
const appPool = APPS.flatMap(([a, n]) => Array(n).fill(a))
// Readable, invented dictation: nothing here is a real entry. Sentences are composed from a bank so
// long rows read like someone talking to a coding agent, a colleague, or a friend, not word salad.
const SENTENCES = [
  'Can you take a look at the header spacing on the about page and bring it in line with the home page?',
  'I think the second card is the strongest one, so let us lead with that and move the other two below it.',
  'Before we push anything, run the checks again and tell me what changed since this morning.',
  'The footer feels heavy. Try a thinner rule and a little more air above the links.',
  'Let us keep the copy as it is for now and come back to it once the layout settles.',
  'Remind me to send the invoice on Friday and to follow up on the contract the week after.',
  'For the next step, take the three items at the top of the list and do them in order.',
  'I am not sure the animation needs to be that fast. Slow it down a touch and show me again.',
  'Yes, that is the one. Use the same treatment on the other pages so they match.',
  'Can we make the empty state say something useful instead of just leaving the box blank?',
  'Okay, go back to the plan and pull out anything that is still waiting on me.',
  'That looks right. Commit it with a clear message and leave the rest for tomorrow.',
  'Hey, are you free for lunch on Thursday? Somewhere near the office would be easiest.',
  'Running about ten minutes late, start without me and I will catch up.',
  'Thanks for sending that over. I will read it tonight and get you notes in the morning.',
  'Let me think about the naming for a second. The current label reads more like a setting than an action.',
  'One more thing: the search icon should sit flush with the edge of the card, not float inside it.',
  'Actually, scrap the gradient. A flat surface reads cleaner and it matches the rest of the app.',
  'Take a screenshot of the current state before you change anything so we can compare.',
  'The numbers in the summary and the numbers on the button have to agree. Right now they do not.',
  'Quick note for later: the reminder only shows on the day something expires, never before.',
  'Can you list what is still open, what is done, and what is blocked, in that order?',
  'I like where this is going. Tighten the spacing under the title and we are close.',
  'Do not delete anything yet. Move it somewhere it can come back from and we will review it later.',
]
const SHORT = ['Hey.', 'Yep.', 'Sure.', 'Okay!', 'Thanks so much.', 'On it.', 'Sounds good to me.', 'Talk soon.', 'Got it, thanks.', 'Perfect, do that.', 'Nope.', 'See you then.']
// unfinished fragments, the way a hotkey released early leaves them
const CUT = ['Can we', 'I think the', 'So the', 'Let me', 'and then', 'Make sure to', 'Okay, so', 'Take the', 'Th', 'Ac', 'to', 'the', ',', '...', 'Bu']
const FLAGS = ['Never mind, scratch that.', 'Oops, ignore that one.', 'Scratch that, wrong window.', 'Clean up, not what I meant.', 'Never mind.', 'Delete that, starting over.']
const sentence = (n) => { let s = pick(SENTENCES); while (s.split(' ').length < n) s += (Math.random() < 0.3 ? '\n\n' : ' ') + pick(SENTENCES); return s }
const out = []; const start = Date.UTC(2026, 7, 8, 1, 0, 0); const span = 35 * 864e5
for (let i = 0; i < 874; i++) {
  const t = new Date(start + Math.floor(i / 874 * span) + rnd(3600e3)).toISOString().replace('T', ' ').replace('Z', ' +00:00')
  const app = pick(appPool)
  let text = '', status = 'formatted', duration = 0
  const r = Math.random()
  if (r < 0.114) { text = ''; status = pick(['formatted', 'formatted', 'formatted', 'dismissed', 'no_audio']); duration = Math.random() < 0.96 ? +(Math.random() * 6).toFixed(2) : +(35 + Math.random() * 120).toFixed(2) }
  else if (r < 0.16) { text = pick(CUT); duration = +(0.5 + Math.random() * 2).toFixed(2) }
  else if (r < 0.207) { text = pick(SHORT); duration = +(0.5 + Math.random() * 3).toFixed(2) }
  else if (r < 0.21) { text = pick(FLAGS); duration = +(1 + Math.random() * 3).toFixed(2) }
  else { const w = r < 0.38 ? 6 + rnd(9) : r < 0.62 ? 15 + rnd(30) : 45 + rnd(120); text = sentence(w); duration = +(w * 0.45 + Math.random() * 4).toFixed(2) }
  out.push({ id: crypto.randomUUID(), timestamp: t, app, url: null, status, isArchived: 0,
    numWords: text ? text.split(/\s+/).length : 0, duration, speechDuration: +(duration * 0.7).toFixed(2),
    asrText: text, formattedText: text, editedText: null, transcriptOrigin: 'internal', contentObservationEndReason: null })
}
writeFileSync(new URL('../src/data/history.sample.json', import.meta.url), JSON.stringify(out))
console.log('sample written', out.length)
