export function when(ts: string): string {
  const d = new Date(ts.replace(' ', 'T').replace(' +00:00', 'Z'))
  const now = new Date(); const day = 864e5
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const t = d.getTime()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (t >= startToday) return `Today ${time}`
  if (t >= startToday - day) return `Yesterday ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`
}
export function secs(s: number | null): string {
  if (s == null) return ''
  return s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}
export function pct(n: number): string { return `${Math.round(n * 100)}%` }
