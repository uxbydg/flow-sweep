import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import s from './App.module.scss'
import { entries as allEntries, usingRealData } from './data/load.ts'
import { detect, summarize, appLabel, textOf, DEFAULT_THRESHOLD } from './sweep/detect.ts'
import type { Candidate, Entry, Reason, SweptItem } from './data/types.ts'
import { OPT_IN } from './sweep/labels.ts'
import {
  now as clock, demoReminder, HOLD_DAYS, leavesOn, isExpired,
  loadSwept, saveSwept, loadGone, saveGone, loadDismissed, saveDismissed,
} from './sweep/holding.ts'
import { toDate, dayKey, dayLabel, startOfDay } from './format.ts'
import { Titlebar, Sidebar, Banner, Stats } from './components/Chrome.tsx'
import { HistoryList } from './components/HistoryList.tsx'
import { HoldingCell } from './components/HoldingCell.tsx'
import { Reminder } from './components/Reminder.tsx'
import { SweepDialog, Confirm } from './components/Dialogs.tsx'
import { Search, Broom, ArrowLeft, RotateCcw } from './icons.ts'

const DAY = 864e5
const byId = new Map<string, Entry>(allEntries.map(e => [e.id, e]))
// Reason at classification time, so the holding cell can say why a row was swept.
const reasonOf = new Map<string, Reason>(detect(allEntries).map(c => [c.entry.id, c.reason]))
const totalWords = allEntries.reduce((n, e) => n + (textOf(e).match(/\S+/g)?.length ?? 0), 0)

export default function App() {
  // The concept's clock: ?day=N moves it forward so the 7-day hold can be seen without waiting.
  const [t] = useState(() => clock())
  const today = dayKey(t)

  const [gone, setGone] = useState<string[]>(loadGone)
  const [swept, setSwept] = useState<SweptItem[]>(() => {
    let items = loadSwept()
    // Expired rows leave for good on load.
    const expired = items.filter(it => isExpired(it, clock()))
    if (expired.length) {
      items = items.filter(it => !isExpired(it, clock()))
      saveGone([...loadGone(), ...expired.map(it => it.id)])
    }
    // ?demo=reminder seeds a batch that leaves tonight.
    if (demoReminder && !items.length) {
      const cands = detect(allEntries).filter(c => !OPT_IN.includes(c.reason) && c.confidence >= DEFAULT_THRESHOLD)
      const take = (r: Reason, n: number) => cands.filter(c => c.reason === r).slice(0, n)
      items = [...take('empty', 8), ...take('cutoff', 3), ...take('flagged', 1)]
        .map(c => ({ id: c.entry.id, sweptAt: clock() - HOLD_DAYS * DAY }))
    }
    return items
  })
  const [view, setView] = useState<'history' | 'cell'>('history')
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sweepOpen, setSweepOpen] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [choices, setChoices] = useState<Map<string, boolean>>(new Map())
  const [dismissed, setDismissed] = useState<string | null>(loadDismissed)

  useEffect(() => { saveSwept(swept) }, [swept])
  useEffect(() => { saveGone(gone) }, [gone])

  const sweptIds = useMemo(() => new Set(swept.map(it => it.id)), [swept])
  const goneIds = useMemo(() => new Set(gone), [gone])
  const live = useMemo(() => allEntries.filter(e => !sweptIds.has(e.id) && !goneIds.has(e.id)), [sweptIds, goneIds])
  const cands = useMemo(() => detect(live), [live])
  const sum = useMemo(() => summarize(live, cands), [live, cands])
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return live
    return live.filter(e => textOf(e).toLowerCase().includes(needle) || appLabel(e.app).toLowerCase().includes(needle))
  }, [live, q])

  // Selected = the classifier's default unless the person said otherwise.
  const selected = useCallback((c: Candidate) => {
    const own = choices.get(c.entry.id)
    if (own !== undefined) return own
    return !OPT_IN.includes(c.reason) && c.confidence >= DEFAULT_THRESHOLD
  }, [choices])
  const setMany = useCallback((ids: string[], on: boolean) => {
    setChoices(prev => { const n = new Map(prev); for (const id of ids) n.set(id, on); return n })
  }, [])

  const sweep = () => {
    const chosen = cands.filter(selected).map(c => ({ id: c.entry.id, sweptAt: t }))
    setSwept(prev => [...chosen, ...prev])
    setChoices(new Map())
    setSweepOpen(false)
  }
  const restore = (id: string) => setSwept(prev => prev.filter(it => it.id !== id))
  const restoreAll = () => { setSwept([]); setView('history') }
  const emptyNow = () => {
    setGone(prev => [...prev, ...swept.map(it => it.id)])
    setSwept([])
    setConfirmEmpty(false)
    setView('history')
  }

  // The reminder shows only on a day a batch reaches the end of its hold.
  const leavingToday = useMemo(() => swept.filter(it => leavesOn(it) === startOfDay(t)), [swept, t])
  const showReminder = leavingToday.length > 0 && dismissed !== today && view === 'history'
  const leavingCounts = useMemo(() => {
    const out: Partial<Record<Reason, number>> = {}
    for (const it of leavingToday) { const r = reasonOf.get(it.id) ?? 'empty'; out[r] = (out[r] ?? 0) + 1 }
    return out
  }, [leavingToday])
  const keepLeaving = () => {
    const ids = new Set(leavingToday.map(it => it.id))
    setSwept(prev => prev.filter(it => !ids.has(it.id)))
  }
  const dismiss = () => { setDismissed(today); saveDismissed(today) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && view === 'cell' && !sweepOpen && !confirmEmpty) setView('history') }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view, sweepOpen, confirmEmpty])

  const firstDay = visible[0] ? dayLabel(toDate(visible[0].timestamp).getTime(), t) : 'Today'

  return (
    <div className={s.window}>
      <Titlebar />
      <Sidebar />
      <div className={s.panel}>
        <div className={s.content}>
          <h1 className={s.welcome}>Welcome back, Daniel</h1>

          <div className={s.main}>
            <Banner />

            <div className={s.bar}>
              {view === 'cell' ? (
                <>
                  <button className={s.cellBack} onClick={() => setView('history')}><ArrowLeft size={15} />History</button>
                  <h2 className={s.cellTitle}>Swept · {swept.length}</h2>
                  <span className={s.barSpacer} />
                  {swept.length > 0 && (
                    <>
                      <button className={s.chip} data-kind="ghost" onClick={restoreAll}><RotateCcw size={13} />Restore all</button>
                      <button className={s.chip} data-kind="dangerText" onClick={() => setConfirmEmpty(true)}>Empty now</button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h3 className={s.label}>{firstDay}</h3>
                  <span className={s.barSpacer} />
                  {swept.length > 0 && (
                    <button className={s.sweptLink} onClick={() => setView('cell')} aria-label={`Swept, ${swept.length}, open the holding cell`}>
                      Swept · {swept.length}
                    </button>
                  )}
                  {searchOpen ? (
                    <label className={s.searchBox}>
                      <Search size={16} />
                      <input autoFocus placeholder="Search" value={q} onChange={e => setQ(e.target.value)} aria-label="Search transcripts"
                        onBlur={() => { if (!q) setSearchOpen(false) }}
                        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setQ(''); setSearchOpen(false) } }} />
                    </label>
                  ) : (
                    // Flow's bar is bare glyphs: the field appears only once search is asked for.
                    <button className={s.icon} data-tip="Search" aria-label="Search transcripts" onClick={() => setSearchOpen(true)}><Search size={16} /></button>
                  )}
                  <button className={s.icon} data-tip="Sweep" data-on={sweepOpen} aria-label={`Sweep, ${sum.candidates} to review`} onClick={() => setSweepOpen(true)}>
                    <Broom size={16} />
                    {sum.candidates > 0 && <i className={s.dot} />}
                  </button>
                </>
              )}
            </div>

            {view === 'cell'
              ? <HoldingCell items={swept} byId={byId} reasons={reasonOf} now={t} onRestore={restore} />
              : <HistoryList entries={visible} now={t} />}
            {view === 'history' && (
              <p className={s.more}>{live.length} transcripts · {usingRealData ? 'real history, local only' : 'sample data'}</p>
            )}
          </div>

          <div className={s.aside}>
            <Stats words={totalWords} />
            <AnimatePresence>
              {showReminder && (
                <Reminder key="reminder" counts={leavingCounts} total={leavingToday.length}
                  onReview={() => setView('cell')} onKeep={keepLeaving} onDismiss={dismiss} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sweepOpen && (
          <SweepDialog key="sweep" cands={cands} sum={sum} selected={selected} setMany={setMany}
            onSweep={sweep} onClose={() => setSweepOpen(false)} />
        )}
        {confirmEmpty && (
          <Confirm key="confirm" title="Empty the holding cell?" body={`${swept.length} swept transcripts will be deleted for good. This cannot be undone.`}
            action="Yes, delete them" onConfirm={emptyNow} onClose={() => setConfirmEmpty(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
