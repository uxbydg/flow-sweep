import type { Reason } from '../data/types.ts'

// Flow already has a Flag action on every row, so the self-flag section does not say "flagged".
// The person marked it in speech: never mind, scratch that, oops.
export const REASON_LABEL: Record<Reason, string> = {
  empty: 'Empty',
  retry: 'Retry first',
  cutoff: 'Cut off',
  flagged: 'Marked for removal',
  reply: 'Short replies',
}

export const REASON_NOTE: Partial<Record<Reason, string>> = {
  retry: 'Long recordings that came back empty. Retry transcript may recover them.',
  reply: 'Short, but finished thoughts. Kept unless you choose them.',
}

// Review order: the surest first, the ones to think about last.
export const ORDER: Reason[] = ['empty', 'cutoff', 'flagged', 'retry', 'reply']

// Selected by default only where the classifier is sure enough to act.
export const OPT_IN: Reason[] = ['retry', 'reply']
