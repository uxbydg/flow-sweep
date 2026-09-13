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

export type Reason = 'empty' | 'short' | 'flagged'

export interface Candidate {
  entry: Entry
  reason: Reason
  confidence: number
  why: string
}

export interface Summary {
  total: number
  empty: number
  short: number
  flagged: number
  candidates: number
  share: number
}
