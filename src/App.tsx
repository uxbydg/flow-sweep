import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import s from './App.module.scss'
import { entries as allEntries, usingRealData } from './data/load.ts'
import { detect, summarize, appLabel, textOf, DEFAULT_THRESHOLD } from './sweep/detect.ts'
import type { Candidate, Reason } from './data/types.ts'
import { when, secs, pct } from './format.ts'
import { Search, Check, Undo2, X, RotateCcw, Broom } from './icons.ts'

type View = 'history' | 'summary' | 'review'
const REASON_LABEL: Record<Reason, string> = { empty: 'Empty', short: 'Under 20 characters', flagged: 'Flagged by you' }
const ORDER: Reason[] = ['empty', 'short', 'flagged']

export default function App() {
  const [view, setView] = useState<View>('history')
  const [q, setQ] = useState('')
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [kept, setKept] = useState<Set<string>>(new Set())
  const [swept, setSwept] = useState<string[]>([])
  const [sweptOpen, setSweptOpen] = useState(false)

  const live = useMemo(() => allEntries.filter(e => !swept.includes(e.id)), [swept])
  const cands = useMemo(() => detect(live), [live])
  const sum = useMemo(() => summarize(live, cands), [live, cands])
  const selected = (c: Candidate) => c.confidence >= threshold && !kept.has(c.entry.id)
  const toSweep = cands.filter(selected)
  const visible = live.filter(e => !q || textOf(e).toLowerCase().includes(q.toLowerCase()) || appLabel(e.app).toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { if (view !== 'history') setView('history'); else setSweptOpen(false) } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view])

  const toggleKeep = (id: string) => setKept(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const sweep = () => { setSwept(prev => [...toSweep.map(c => c.entry.id), ...prev]); setView('history'); setSweptOpen(true) }
  const restore = (id: string) => setSwept(prev => prev.filter(x => x !== id))
  const restoreAll = () => { setSwept([]); setSweptOpen(false) }
  const sweptEntries = swept.map(id => allEntries.find(e => e.id === id)!).filter(Boolean)

  return (
    <div className={s.shell}>
      <header className={s.top}>
        <h1 className={s.title}>History</h1>
        <label className={s.search}><Search size={16} /><input placeholder="Search transcripts" value={q} onChange={e => setQ(e.target.value)} aria-label="Search transcripts" /></label>
        <button className={s.iconBtn} data-active={view !== 'history'} aria-label={`Sweep, ${sum.candidates} candidates`} title="Sweep" onClick={() => setView('summary')}>
          <Broom size={18} />
          {sum.candidates > 0 && <span className={s.badge}>{sum.candidates}</span>}
        </button>
        {swept.length > 0 && (
          <button className={s.iconBtn} aria-label={`Swept, ${swept.length}`} title="Swept" onClick={() => setSweptOpen(o => !o)} data-active={sweptOpen}>
            <Undo2 size={18} /><span className={s.badge}>{swept.length}</span>
          </button>
        )}
      </header>

      <motion.ul className={s.list} layout style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <AnimatePresence initial={false}>
          {visible.slice(0, 80).map(e => {
            const t = textOf(e)
            return (
              <motion.li key={e.id} className={s.row} layout
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: .18 } }}
                transition={{ duration: .22, ease: [.2, .8, .2, 1] }}>
                <span className={s.app}>{appLabel(e.app)}</span>
                <span className={t ? s.text : s.empty}>{t || 'Empty'}</span>
                <span className={s.meta}>{when(e.timestamp)}{e.duration != null ? ` · ${secs(e.duration)}` : ''}</span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </motion.ul>
      <p className={s.foot}><span>{live.length} transcripts</span><span>{usingRealData ? 'Real history, local only' : 'Sample data'}</span></p>

      <AnimatePresence>
        {view !== 'history' && (
          <>
            <motion.div key="scrim" className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView('history')} />
            <motion.section key="sheet" className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="sheetTitle"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: .26, ease: [.2, .8, .2, 1] }}>
              <div className={s.sheetHead}>
                <h2 id="sheetTitle" className={s.sheetTitle}>{view === 'summary' ? 'Sweep' : `Review ${sum.candidates}`}</h2>
                <button className={s.iconBtn} aria-label="Close" onClick={() => setView('history')}><X size={16} /></button>
              </div>

              {view === 'summary' && (
                <>
                  <div className={s.sheetBody}>
                    <p className={s.lead}>
                      You have <Count n={sum.empty} i={0} /> empty transcripts, <Count n={sum.short} i={1} /> under 20 characters,
                      and <Count n={sum.flagged} i={2} /> you flagged yourself. That's about <b>1 in every {Math.max(2, Math.round(1 / Math.max(sum.share, 0.01)))}</b>.
                    </p>
                    <p className={s.hint}>Nothing is removed until you've looked. Anything swept can be restored.</p>
                  </div>
                  <div className={s.sheetFoot}>
                    <span className={s.spacer} />
                    <button className={s.btn} onClick={() => setView('history')}>Not now</button>
                    <button className={s.btn} data-primary="true" onClick={() => setView('review')}>Review</button>
                  </div>
                </>
              )}

              {view === 'review' && (
                <>
                  <div className={s.sheetBody}>
                    {ORDER.map(r => {
                      const group = cands.filter(c => c.reason === r).sort((a, b) => b.confidence - a.confidence)
                      if (!group.length) return null
                      return (
                        <div key={r}>
                          <div className={s.group}><h3>{REASON_LABEL[r]}</h3><span>{group.length}</span></div>
                          {group.map(c => (
                            <label key={c.entry.id} className={s.cand} data-borderline={c.confidence < threshold}>
                              <input type="checkbox" checked={selected(c)} onChange={() => toggleKeep(c.entry.id)} aria-label={`Sweep: ${textOf(c.entry) || 'empty transcript'}`} />
                              <span>
                                <span className={textOf(c.entry) ? s.candText : s.empty} style={{ display: 'block' }}>{textOf(c.entry) || 'Empty'}</span>
                                <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {when(c.entry.timestamp)}</span>
                              </span>
                              <span className={s.conf}><span>{pct(c.confidence)}</span><span className={s.bar}><i style={{ width: pct(c.confidence) }} /></span></span>
                            </label>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div className={s.sheetFoot}>
                    <label className={s.thresh}>Confidence at least {pct(threshold)}
                      <input type="range" min={0.3} max={0.95} step={0.05} value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
                    </label>
                    <span className={s.spacer} />
                    <button className={s.btn} onClick={() => setView('history')}>Cancel</button>
                    <button className={s.btn} data-primary="true" disabled={!toSweep.length} onClick={sweep}>Sweep {toSweep.length}</button>
                  </div>
                </>
              )}
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sweptOpen && swept.length > 0 && (
          <motion.aside key="swept" className={s.swept} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: .22 }} aria-label="Swept transcripts">
            <div className={s.sweptHead}>
              <Check size={16} /><h3>Swept {swept.length}</h3>
              <button className={s.link} onClick={restoreAll}><RotateCcw size={14} />Restore all</button>
              <button className={s.iconBtn} aria-label="Close" onClick={() => setSweptOpen(false)}><X size={14} /></button>
            </div>
            <div className={s.sweptList}>
              <AnimatePresence initial={false}>
                {sweptEntries.map(e => (
                  <motion.div key={e.id} className={s.sweptRow} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 8 }}>
                    <span className={textOf(e) ? s.candText : s.empty}>{textOf(e) || 'Empty'} <span className={s.why} style={{ display: 'inline' }}>· {appLabel(e.app)}</span></span>
                    <button className={s.link} onClick={() => restore(e.id)}><Undo2 size={14} />Restore</button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

// counts settle in sequence, not at once
function Count({ n, i }: { n: number; i: number }) {
  return <motion.b initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 + i * .14, duration: .3 }}>{n}</motion.b>
}
