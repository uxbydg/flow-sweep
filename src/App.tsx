import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { NOTES } from './notes/notes.ts'
import type { SweepMode } from './notes/notes.ts'
import { NoteMarkers } from './notes/NoteMarkers.tsx'
import { NotesDrawer } from './notes/NotesDrawer.tsx'
import { useNotes } from './notes/useNotes.ts'
import { useNudge } from './notes/useNudge.ts'

const DAY = 864e5
const RECOVERED_TEXT = 'Okay, go back to the punch list and take the top three in order. Start with the header, then the card art, then the footer. Show me each one in the browser before you move on to the next.'
const byId = new Map<string, Entry>(allEntries.map(e => [e.id, e]))
// Reason at classification time, so the holding cell can say why a row was swept.
const reasonOf = new Map<string, Reason>(detect(allEntries).map(c => [c.entry.id, c.reason]))
// The stats card describes the loaded history, whichever one it is: words counted, words per minute
// over rows that have both words and a recording length, the streak as the run of days ending at
// the newest row. Nothing on the card is typed in.
const wordsOf = (e: Entry) => textOf(e).match(/\S+/g)?.length ?? 0
const totalWords = allEntries.reduce((n, e) => n + wordsOf(e), 0)
const timed = allEntries.filter(e => wordsOf(e) > 0 && (e.duration ?? 0) > 0)
const wpm = Math.round(timed.reduce((n, e) => n + wordsOf(e), 0) / (timed.reduce((n, e) => n + (e.duration ?? 0), 0) / 60))
const streak = (() => {
  const days = [...new Set(allEntries.map(e => Math.floor(toDate(e.timestamp).getTime() / DAY)))].sort((a, b) => b - a)
  let n = 0
  for (let i = 0; i < days.length && days[i] === days[0] - i; i++) n++
  return n
})()

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
    // ?demo=reminder seeds a batch that leaves tonight, on top of anything already swept.
    if (demoReminder && !items.some(it => leavesOn(it) === startOfDay(clock()))) {
      const cands = detect(allEntries).filter(c => !OPT_IN.includes(c.reason) && c.confidence >= DEFAULT_THRESHOLD)
      // Works from any state: unswept rows first; if a reason runs short (after a full sweep, say),
      // rows already in the cell are back-dated instead, so the demo never comes up empty.
      const have = new Set(items.map(it => it.id))
      const reasonOfId = new Map(cands.map(c => [c.entry.id, c.reason]))
      const seedAt = clock() - HOLD_DAYS * DAY
      for (const [r, n] of [['empty', 8], ['cutoff', 3], ['flagged', 1]] as [Reason, number][]) {
        const fresh = cands.filter(c => c.reason === r && !have.has(c.entry.id)).slice(0, n)
        items = [...items, ...fresh.map(c => ({ id: c.entry.id, sweptAt: seedAt }))]
        let short = n - fresh.length
        items = items.map(it => short > 0 && reasonOfId.get(it.id) === r && it.sweptAt !== seedAt ? (short--, { ...it, sweptAt: seedAt }) : it)
      }
    }
    return items
  })
  const [view, setView] = useState<'history' | 'cell'>('history')
  const [sweepOpen, setSweepOpen] = useState(false)
  /**
   * ⚑⚑ STATE, not a ref, and the difference is load-bearing.
   *
   * A ref does not trigger a render when it is populated, so the markers layer
   * mounted with `frame={null}`, its effect returned early, and nothing ever
   * re-ran it. It happened to work only because the layer used to auto-open a
   * note on mount, and that second render handed it a populated ref. Removing
   * the auto-open removed the accident holding it up: `?notes` turned the layer
   * on and drew no markers at all.
   *
   * A callback ref stored in state renders when the node attaches, which is
   * what the measurement actually depends on.
   */
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null)

  /**
   * ⚑⚑ THE PORT'S ONE REAL ADAPTATION.
   *
   * The Athletic has two modes and a note names one of them. Sweep's states are
   * a view AND a card that may or may not be unfolded, so a note's mode is
   * applied here rather than stored as a single flag. Opening a note about the
   * ask row unfolds the card; opening one about the holding cell walks over to
   * it. That is the behaviour worth porting: the drawer never discusses a
   * region the reader cannot currently see.
   */
  const applyNoteMode = useCallback((m: SweepMode) => {
    setView(m === 'cell' ? 'cell' : 'history')
    setSweepOpen(m === 'sweep')
    if (m !== 'history') setBlankIds(null)
  }, [])
  const notes = useNotes<SweepMode>(NOTES as never, applyNoteMode)
  /* ⚑ Nudges only while the notes have never been opened. */
  const nudging = useNudge(!notes.on)
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

  /**
   * ⚑⚑⚑ THE SEEDED SWEEP IS NOT PERSISTED, and this was a real flaw.
   *
   * Opening note 6 sweeps 60 rows so the holding cell has something to point
   * at. That write went to localStorage like any other, so a reader who paged
   * through the notes got a permanently altered prototype: reload it the next
   * day and 60 of your transcripts are still in the cell, swept by a note you
   * read rather than by anything you did.
   *
   * Daniel caught it on his own machine: "when I open up Sweep, it has 60
   * already swept. Is that just because that's where it was cached for me?"
   * It was, and the next person to open the link would have inherited the same
   * thing from their own reading.
   *
   * ⚑ The moment the reader touches it for real, by sweeping more or restoring
   * any of it, the set stops matching the seed and it saves normally. A demo
   * state does not survive a reload; a decision does.
   */
  const seeded = useRef<Set<string> | null>(null)
  useEffect(() => {
    const seed = seeded.current
    if (seed && swept.length === seed.size && swept.every(it => seed.has(it.id))) return
    saveSwept(swept)
  }, [swept])
  useEffect(() => { saveGone(gone) }, [gone])

  const sweptIds = useMemo(() => new Set(swept.map(it => it.id)), [swept])
  const goneIds = useMemo(() => new Set(gone), [gone])
  const live = useMemo(() => allEntries
    .filter(e => !sweptIds.has(e.id) && !goneIds.has(e.id))
    .map(e => recovered.has(e.id) ? { ...e, formattedText: recovered.get(e.id)!, transcriptOrigin: 'staged' } : e), [sweptIds, goneIds, recovered])
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
  const showBlank = () => { setQ(''); setSearchOpen(false); setBlankIds(new Set(retryIds)); window.scrollTo({ top: 0 }) }
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
    window.setTimeout(() => setSwept(prev => [...chosen, ...prev]), 285)
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
  /**
   * ⚑⚑⚑ THE NOTE MUST HAVE SOMETHING TO POINT AT.
   *
   * Note 6 argues about how the holding cell folds a hundred blank rows into
   * one line per day. Opening it walked to the cell and framed it, and the cell
   * said "Nothing swept." The drawer was discussing a state the reader had not
   * reached, with a frame drawn neatly around the absence of it.
   *
   * Daniel's requirement, 23 September: the note and the region it explains have
   * to be readable at the same time, in the same window. An empty region is the
   * same failure as an off-screen one.
   *
   * So opening a cell note seeds the cell, once, with what the sweep button
   * would have swept. Nothing invented: the classifier's own default selection,
   * run for real, so Restore all gives the history back.
   *
   * ⚑⚑⚑ AND IT SEEDS ONLY PART OF IT, which the first version got wrong and
   * Daniel's own check caught. Sweeping every candidate populated the cell and
   * then emptied the history the OTHER notes stand on: paging back to note 2
   * read "Flow will sweep 0 transcripts" under a note arguing that the number
   * in the sentence matches the number on the button, note 3 framed an empty
   * tab strip, and note 4 said "0 of 16 will go". One note's region was fixed
   * by breaking three others.
   *
   * Seeding the OLDEST portion is also the more honest state: a holding cell
   * holds what you swept days ago, and the card offers what is sweepable now.
   * Those are different sets in real use, and now they are here too.
   */
  const SEED_N = 60
  useEffect(() => {
    if (!notes.on || view !== 'cell' || swept.length > 0) return
    const chosen = detect(allEntries)
      .filter(c => !OPT_IN.includes(c.reason) && c.confidence >= DEFAULT_THRESHOLD)
      .sort((a, b) => toDate(a.entry.timestamp).getTime() - toDate(b.entry.timestamp).getTime())
      .slice(0, SEED_N)
    if (!chosen.length) return
    seeded.current = new Set(chosen.map(c => c.entry.id))
    setSwept(chosen.map(c => ({ id: c.entry.id, sweptAt: t - HOLD_DAYS * DAY / 2 })))
  }, [notes.on, view, swept.length, t])

  const sweepOne = (id: string) => setSwept(prev => [{ id, sweptAt: t }, ...prev])
  const restore = (id: string) => setSwept(prev => prev.filter(it => it.id !== id))
  const restoreMany = (ids: string[]) => { const gone = new Set(ids); setSwept(prev => prev.filter(it => !gone.has(it.id))) }
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
    <div className={s.window} ref={setFrameEl} data-drawer={notes.on && notes.activeId !== null}>
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
                  <button className={s.icon} data-note="broom" data-tip="Sweep" data-on={sweepOpen} aria-expanded={sweepOpen} aria-controls="sweepCard" aria-label={`Sweep, ${sum.candidates} to review`} onClick={() => setSweepOpen(o => !o)}>
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
            {view === 'history' && !filterBlank && (
              // always mounted: opening and closing animate the card's height, so the rows below
              // slide with it instead of jumping
              <div className={s.reveal} data-open={sweepOpen} inert={!sweepOpen}>
                <div className={s.revealInner}>
                  <SweepCard cands={cands} sum={sum} selected={selected} setMany={setMany} onSweep={sweep} onClose={() => { setSweepOpen(false); setChoices(new Map()) }}
                    onShowBlank={showBlank} />
                </div>
              </div>
            )}
            {view === 'cell'
              ? <div data-note="cell"><HoldingCell items={swept} byId={byId} reasons={reasonOf} now={t} onRestore={restore} onRestoreMany={restoreMany} /></div>
              : <HistoryList key={filterBlank ? 'blank' : 'all'} entries={visible} now={t} onSweepOne={sweepOne} onRetry={id => retry([id])} retrying={retrying} />}
            {view === 'history' && (
              <p className={s.more}>{live.length} transcripts · {usingRealData ? 'real history, local only' : 'sample data'}</p>
            )}
          </div>

          <div className={s.aside}>
            <Stats words={totalWords} wpm={wpm} streak={streak} />
            <AnimatePresence>
              {showReminder && (
                <Reminder key="reminder" counts={leavingCounts} total={leavingToday.length}
                  onReview={() => setView('cell')} onKeep={keepLeaving} onDismiss={dismiss} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {notes.on && (
        <NoteMarkers
          frame={frameEl}
          mode={view === 'cell' ? 'cell' : sweepOpen ? 'sweep' : 'history'}
          activeId={notes.activeId}
          onOpen={notes.open}
        />
      )}

      {/* ⚑ Outside the app chrome and deliberately plain: it is the one control
          on screen that is not Flow's. */}
      <button className={`${s.notesToggle} ${nudging ? s.notesNudge : ''}`} data-on={notes.on}
        data-shift={notes.on && notes.activeId !== null}
        onClick={notes.toggle}>
        Design notes
      </button>

      {notes.on && notes.activeId !== null && (
        <NotesDrawer activeId={notes.activeId} onStep={notes.step} onClose={notes.close} />
      )}

      {toast && <Toast text={toast} />}
      <AnimatePresence>
        {confirmEmpty && (
          <Confirm key="confirm" title={`Are you sure you want to delete ${swept.length === 1 ? 'this transcript' : `these ${swept.length} transcripts`}?`}
            body="Once deleted they cannot be recovered." action="Yes, delete them" onConfirm={emptyNow} onClose={() => setConfirmEmpty(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
