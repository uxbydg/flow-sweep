import type { Candidate, Entry, Reason, Summary } from '../data/types.ts'

export const DEFAULT_THRESHOLD = 0.6

const FAILURE_STATUSES = new Set(['dismissed', 'no_audio', 'empty'])

const FLAG_PHRASES = [
  'clean up', 'cleanup', 'never mind', 'nevermind', 'scratch that',
  'not what i', 'ignore that', 'ignore this', 'delete that', 'delete this',
  'disregard', 'oops',
]

// Context decides what an accident is. A three-character entry into Messages is a text;
// into Terminal it is a slip.
const APP_WEIGHT: Record<string, number> = {
  'com.apple.Terminal': 1.0,
  'com.google.Chrome': 0.85,
  'com.electron.wispr-flow': 0.8,
  'com.apple.Notes': 0.7,
  'com.apple.MobileSMS': 0.5,
}
const UNKNOWN_APP_WEIGHT = 0.85

export function textOf(e: Entry): string {
  return (e.editedText || e.formattedText || e.asrText || '').trim()
}

export function appLabel(app: string | null): string {
  if (!app) return 'Unknown app'
  const map: Record<string, string> = {
    'com.apple.Terminal': 'Terminal',
    'com.apple.MobileSMS': 'Messages',
    'com.google.Chrome': 'Chrome',
    'com.electron.wispr-flow': 'Flow',
    'com.figma.Desktop': 'Figma',
    'com.anthropic.claudefordesktop': 'Claude',
    'com.apple.Notes': 'Notes',
    'com.apple.finder': 'Finder',
  }
  return map[app] ?? app.split('.').pop() ?? app
}

const PUNCT_ONLY = /^[\p{P}\p{S}\s]+$/u

export function classify(e: Entry): Candidate | null {
  const text = textOf(e)
  const app = e.app ?? ''
  const w = APP_WEIGHT[app] ?? UNKNOWN_APP_WEIGHT

  // Empty (incl. Flow's own failure statuses)
  if (text.length === 0 || FAILURE_STATUSES.has(e.status ?? '')) {
    const long = (e.duration ?? 0) > 30
    return {
      entry: e, reason: 'empty',
      confidence: long ? 0.9 : 0.98,
      why: long
        ? `${Math.round(e.duration ?? 0)} s recorded, no text came back`
        : e.status && FAILURE_STATUSES.has(e.status) ? `Flow marked it ${e.status.replace('_', ' ')}` : 'No text',
    }
  }

  // Flagged inside the dictation
  // A self-flag happens at the moment of realisation: the phrase opens the entry, or the
  // whole entry is short. A long dictation that merely contains "clean up" is real speech.
  const lower = text.toLowerCase()
  const hit = FLAG_PHRASES.find(p => lower.startsWith(p) || (text.length < 40 && lower.includes(p)))
  if (hit) {
    return { entry: e, reason: 'flagged', confidence: 0.7, why: `You said “${hit}”` }
  }

  // Short
  if (text.length < 20) {
    if (PUNCT_ONLY.test(text)) {
      return { entry: e, reason: 'short', confidence: 0.97, why: 'Punctuation only' }
    }
    const base = text.length <= 3 ? 0.9 : text.length <= 9 ? 0.75 : 0.55
    const conf = Math.round(base * w * 100) / 100
    const into = appLabel(e.app)
    return {
      entry: e, reason: 'short', confidence: conf,
      why: `${text.length} characters into ${into}`,
    }
  }
  return null
}

export function detect(entries: Entry[]): Candidate[] {
  return entries.map(classify).filter((c): c is Candidate => c !== null)
}

export function summarize(entries: Entry[], cands: Candidate[]): Summary {
  const count = (r: Reason) => cands.filter(c => c.reason === r).length
  return {
    total: entries.length,
    empty: count('empty'), short: count('short'), flagged: count('flagged'),
    candidates: cands.length,
    share: entries.length ? cands.length / entries.length : 0,
  }
}
