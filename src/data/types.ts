export interface Entry {
  id: string
  timestamp: string
  app: string | null
  url: string | null
  status: string | null
  isArchived: number
  numWords: number | null
  duration: number | null
  speechDuration: number | null
  asrText: string | null
  formattedText: string | null
  editedText: string | null
  transcriptOrigin: string | null
  contentObservationEndReason: string | null
}

// 'reply' is shown in Review but never selected by default: short, and finished.
export type Reason = 'empty' | 'cutoff' | 'flagged' | 'reply'

export interface Candidate {
  entry: Entry
  reason: Reason
  confidence: number
  why: string
}

export interface Summary {
  total: number
  empty: number
  cutoff: number
  flagged: number
  reply: number
  candidates: number
  share: number
}
