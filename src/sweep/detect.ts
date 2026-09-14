import type { Candidate, Entry, Reason, Summary } from '../data/types.ts'

export const DEFAULT_THRESHOLD = 0.6

const FAILURE_STATUSES = new Set(['dismissed', 'no_audio', 'empty'])

const FLAG_PHRASES = [
  'clean up', 'cleanup', 'never mind', 'nevermind', 'scratch that',
  'not what i', 'ignore that', 'ignore this', 'delete that', 'delete this',
  'disregard', 'oops',
]

// Length does not decide what an accident is; whether the thought finished does.
// In the real history, "Do it." and "Run it." into Claude Code are the most deliberate entries
// there are, while "Watch the" and "Don't d" are the same hotkey released mid-sentence.
const SHORT = 20

// A sentence that stops on one of these did not finish.
const DANGLING = new Set([
  'the', 'a', 'an', 'to', 'of', 'and', 'but', 'or', 'if', 'for', 'with', 'in', 'at', 'by',
  'from', 'my', 'your', 'our', 'we', "i'm", 'is', 'are', 'was', 'be', 'because', 'than',
])

// Short words that stand on their own, so a two-letter ending is not automatically broken.
const WHOLE_SHORT = new Set(['it', 'go', 'no', 'ok', 'me', 'up', 'on', 'do', 'hi', 'yes', 'now', 'so', 'yo', 'ya', 'oh'])

// People text in fragments; a missing full stop in Messages is weaker evidence.
const LOOSE_APPS = new Set(['com.apple.MobileSMS'])

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
const ENDS_FINISHED = /[.!?]["”’')\]]*$/u

export function classify(e: Entry): Candidate | null {
  const text = textOf(e)

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

  if (text.length >= SHORT) return null

  if (PUNCT_ONLY.test(text)) {
    return { entry: e, reason: 'cutoff', confidence: 0.97, why: 'Punctuation only' }
  }

  const words = lower.replace(/[^\p{L}\p{N}'\s-]/gu, ' ').split(/\s+/).filter(Boolean)
  const last = words[words.length - 1] ?? ''
  const finished = ENDS_FINISHED.test(text)

  // Ends like a sentence and not on a dangling word: a short reply, left alone by default.
  if (finished && !DANGLING.has(last)) {
    return { entry: e, reason: 'reply', confidence: 0.2, why: 'Short, but a finished thought' }
  }

  const loose = LOOSE_APPS.has(e.app ?? '') ? 0.9 : 1
  const cut = (confidence: number, why: string): Candidate =>
    ({ entry: e, reason: 'cutoff', confidence: Math.round(confidence * loose * 100) / 100, why })

  if (/-\p{L}?$/u.test(last)) return cut(0.92, 'Stops mid-word')
  if (text.endsWith(',')) return cut(0.85, 'Stops on a comma')
  if (DANGLING.has(last)) return cut(0.9, `Stops on “${last}”`)
  if (words.length > 1 && last.length <= 2 && !WHOLE_SHORT.has(last) && !/\d/.test(last)) return cut(0.9, 'Stops mid-word')
  if (words.length === 1 && last.length <= 3 && !WHOLE_SHORT.has(last)) return cut(0.85, 'One fragment')
  // No ending, but nothing visibly broken ("Excel", "Run it", "right now"): shown, not selected.
  return cut(0.5, 'No ending, may be complete')
}

export function detect(entries: Entry[]): Candidate[] {
  return entries.map(classify).filter((c): c is Candidate => c !== null)
}

export function summarize(entries: Entry[], cands: Candidate[]): Summary {
  const count = (r: Reason) => cands.filter(c => c.reason === r).length
  const sweepable = cands.filter(c => c.reason !== 'reply')
  return {
    total: entries.length,
    empty: count('empty'), cutoff: count('cutoff'), flagged: count('flagged'), reply: count('reply'),
    candidates: sweepable.length,
    share: entries.length ? sweepable.length / entries.length : 0,
  }
}
