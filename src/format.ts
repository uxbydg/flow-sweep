const DAY = 864e5

export function toDate(ts: string): Date {
  return new Date(ts.replace(' ', 'T').replace(' +00:00', 'Z'))
}

export function startOfDay(t: number): number {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function dayKey(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Flow writes times lower-case: "4:02 pm"
export function flowTime(t: number): string {
  return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

export function dayLabel(t: number, now: number): string {
  const diff = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function shortDate(t: number): string {
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function pct(n: number): string { return `${Math.round(n * 100)}%` }

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
