import type { SweptItem } from '../data/types.ts'
import { startOfDay } from '../format.ts'

const DAY = 864e5
export const HOLD_DAYS = 7
const KEY = 'flow-sweep:swept'

// The concept's clock. `?day=N` moves it N days forward so the 7-day hold can be shown without
// waiting a week; `?demo=reminder` seeds a batch that leaves tonight.
const params = new URLSearchParams(window.location.search)
const offset = Number(params.get('day') ?? 0) * DAY
export const now = () => Date.now() + offset
export const demoReminder = params.get('demo') === 'reminder'

// Swept on day 0, restorable through the end of day 7, gone at the midnight after.
export function leavesOn(item: SweptItem): number {
  return startOfDay(item.sweptAt) + HOLD_DAYS * DAY
}

export function isExpired(item: SweptItem, t: number): boolean {
  return t >= leavesOn(item) + DAY
}

export function leaveLabel(day: number, t: number): string {
  const diff = Math.round((day - startOfDay(t)) / DAY)
  if (diff <= 0) return 'Leaves for good tonight'
  if (diff === 1) return 'Leaves tomorrow night'
  return `Leaves ${new Date(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

export function loadSwept(): SweptItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SweptItem[]) : []
  } catch { return [] }
}

export function saveSwept(items: SweptItem[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* private mode: state lives for the session */ }
}

// Rows that left the holding cell for good: expired, or emptied by hand. They never return.
const GONE = 'flow-sweep:gone'
export function loadGone(): string[] {
  try {
    const raw = localStorage.getItem(GONE)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch { return [] }
}
export function saveGone(ids: string[]): void {
  try { localStorage.setItem(GONE, JSON.stringify(ids)) } catch { /* private mode */ }
}

// The reminder is dismissable for the day, not forever.
const DISMISS = 'flow-sweep:reminder-dismissed'
export function loadDismissed(): string | null {
  try { return localStorage.getItem(DISMISS) } catch { return null }
}
export function saveDismissed(dayKey: string): void {
  try { localStorage.setItem(DISMISS, dayKey) } catch { /* private mode */ }
}
