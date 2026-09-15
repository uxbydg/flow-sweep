import { useSyncExternalStore } from 'react'

// Browsers stop the animation clock in a hidden tab, and Motion runs on that clock, so an exit
// animation started while hidden never finishes and its row never leaves. While the tab is hidden,
// the list skips its animations instead.
const subscribe = (cb: () => void) => { document.addEventListener('visibilitychange', cb); return () => document.removeEventListener('visibilitychange', cb) }
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribe, () => document.visibilityState === 'visible', () => true)
}
