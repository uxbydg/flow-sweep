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
import { SweepCard } from './components/SweepCard.tsx'
import { Confirm } from './components/Dialogs.tsx'
import { Toast } from './components/Toast.tsx'
import { Search, Broom, ArrowLeft, RotateCcw, X } from './icons.ts'

const DAY = 864e5
const RECOVERED_TEXT = 'Okay, go back to the punch list and take the top three in order. Start with the header, then the card art, then the footer. Show me each one in the browser before you move on to the next.'
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
  const [sweepOpen, setSweepOpen] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [blankIds, setBlankIds] = useState<Set<string> | null>(null)
  const filterBlank = blankIds !== null
  const [searching, setSearching] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [choices, setChoices] = useState<Map<string, boolean>>(new Map())
  const [dismissed, setDismissed] = useState<string | null>(loadDismissed)
  const [retrying, setRetrying] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [recovered, setRecovered] = useState<Map<string, string>>(new Map())

  useEffect(() => { saveSwept(swept) }, [swept])
  useEffect(() => { saveGone(gone) }, [gone])

  const sweptIds = useMemo(() => new Set(swept.map(it => it.id)), [swept])
  const goneIds = useMemo(() => new Set(gone), [gone])
  const live = useMemo(() => allEntries
    .filter(e => !sweptIds.has(e.id) && !goneIds.has(e.id))
    .map(e => recovered.has(e.id) ? { ...e, formattedText: recovered.get(e.id)! } : e), [sweptIds, goneIds, recovered])
  const cands = useMemo(() => detect(live), [live])
  const sum = useMemo(() => summarize(live, cands), [live, cands])
  const retryIds = useMemo(() => new Set(cands.filter(c => c.reason === 'retry').map(c => c.entry.id)), [cands])
  const visible = useMemo(() => {
    if (blankIds) return live.filter(e => blankIds.has(e.id))
    const needle = q.trim().toLowerCase()
    if (!needle) return live
    return live.filter(e => textOf(e).toLowerCase().includes(needle) || appLabel(e.app).toLowerCase().includes(needle))
  }, [live, q, blankIds])

  // Flow's search spins for a moment after every keystroke, then the list is just the matches.
  useEffect(() => {
    if (!q) return
    setSearching(true)
    const id = window.setTimeout(() => setSearching(false), 450)
    return () => window.clearTimeout(id)
  }, [q])
  // Flow's search matches text only, so this set is a view like the holding cell, not a search token.
  // It snapshots its rows on entry so a transcript that comes back stays in view, with its words.
  const showBlank = () => { setSweepOpen(false); setQ(''); setSearchOpen(false); setBlankIds(new Set(retryIds)); window.scrollTo({ top: 0 }) }
  const clearSearch = () => { setQ(''); setBlankIds(null); setSearchOpen(false) }
  // still blank: a recovered row stays in the view with its words but leaves the count
  const blankLeft = useMemo(() => visible.filter(e => retryIds.has(e.id)), [visible, retryIds])

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
    setChoices(new Map())
    setSweepOpen(false)
    // The card folds first, then the rows lift out of the list beneath where it was.
    window.setTimeout(() => setSwept(prev => [...chosen, ...prev]), 80)
  }
  // Flow's retry, as captured: the row pulses while it works, then a toast reports the result.
  // The concept holds no audio, so every retry ends the way Flow's did on 14 Sep: it fails.
  // The concept holds no audio, so a retry cannot really transcribe. The longest blank recording
  // comes back with words (invented, so the success state can be seen); the rest fail as Flow's did.
  const retry = (ids: string[]) => {
    if (!ids.length) return
    setRetrying(prev => new Set([...prev, ...ids]))
    const longest = [...ids].sort((a, b) => (byId.get(b)?.duration ?? 0) - (byId.get(a)?.duration ?? 0))[0]
    const wins = ids.includes(longest) && (byId.get(longest)?.duration ?? 0) >= 60 ? longest : null
    ids.forEach((id, i) => window.setTimeout(() => {
      setRetrying(prev => { const n = new Set(prev); n.delete(id); return n })
      if (id === wins) setRecovered(prev => new Map(prev).set(id, RECOVERED_TEXT))
      if (i === ids.length - 1 && ids.some(x => x !== wins)) { setToast('Retry failed. Please try again.'); window.setTimeout(() => setToast(null), 4000) }
    }, 1600 + i * 350))
  }
  const sweepOne = (id: string) => setSwept(prev => [{ id, sweptAt: t }, ...prev])
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirmEmpty) return
      if (sweepOpen) setSweepOpen(false); else if (filterBlank) setBlankIds(null); else if (view !== 'history') setView('history')
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view, sweepOpen, filterBlank, confirmEmpty])

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
              {filterBlank ? (
                <>
                  <button className={s.cellBack} onClick={clearSearch}><ArrowLeft size={15} />History</button>
                  <h2 className={s.cellTitle}>Came back blank · {blankLeft.length}</h2>
                </>
              ) : view === 'cell' ? (
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
                      {searching ? <i className={s.spinner} aria-label="Searching" /> : <Search size={16} />}
                      <input autoFocus placeholder="Search" value={q} onChange={e => setQ(e.target.value)} aria-label="Search transcripts"
                        onBlur={() => { if (!q) setSearchOpen(false) }}
                        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); clearSearch() } }} />
                      {q && <button className={s.clear} aria-label="Clear" onMouseDown={e => e.preventDefault()} onClick={clearSearch}><X size={12} /></button>}
                    </label>
                  ) : (
                    // Flow's bar is bare glyphs: the field appears only once search is asked for.
                    <button className={s.icon} aria-label="Search transcripts" onClick={() => setSearchOpen(true)}><Search size={16} /></button>
                  )}
                  <button className={s.icon} data-tip="Sweep" data-on={sweepOpen} aria-expanded={sweepOpen} aria-controls="sweepCard" aria-label={`Sweep, ${sum.candidates} to review`} onClick={() => setSweepOpen(o => !o)}>
                    <Broom size={16} />
                    {sum.candidates > 0 && <i className={s.dot} />}
                  </button>
                </>
              )}
            </div>

            {view === 'history' && filterBlank && blankLeft.length > 0 && (
              <p className={s.filterNote}>
                {blankLeft.length} {blankLeft.length === 1 ? 'transcription' : 'transcriptions'} came back blank.{' '}
                <button className={s.textLink} disabled={blankLeft.some(e => retrying.has(e.id))} onClick={() => retry(blankLeft.map(e => e.id))}>
                  {blankLeft.some(e => retrying.has(e.id)) ? 'Retrying…' : `Retry your ${blankLeft.length} ${blankLeft.length === 1 ? 'transcription' : 'transcriptions'}`}
                </button>
              </p>
            )}
            {view === 'history' && sweepOpen && (
              <SweepCard cands={cands} sum={sum} selected={selected} setMany={setMany} onSweep={sweep} onClose={() => setSweepOpen(false)}
                onShowBlank={showBlank} />
            )}
            {view === 'cell'
              ? <HoldingCell items={swept} byId={byId} reasons={reasonOf} now={t} onRestore={restore} />
              : <HistoryList key={filterBlank ? 'blank' : 'all'} entries={visible} now={t} onSweepOne={sweepOne} onRetry={id => retry([id])} retrying={retrying} />}
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

      {toast && <Toast text={toast} />}
      <AnimatePresence>
        {confirmEmpty && (
          <Confirm key="confirm" title="Empty the holding cell?" body={`${swept.length} swept transcripts will be deleted for good. This cannot be undone.`}
            action="Yes, delete them" onConfirm={emptyNow} onClose={() => setConfirmEmpty(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
