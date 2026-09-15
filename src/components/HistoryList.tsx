import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import s from '../App.module.scss'
import type { Entry } from '../data/types.ts'
import { textOf } from '../sweep/detect.ts'
import { toDate, dayKey, dayLabel, flowTime } from '../format.ts'
import { Play, Copy, Flag, EllipsisVertical, Undo2, RefreshCw, Broom, Trash2, FileAudio } from '../icons.ts'

const PAGE = 120

interface Props { entries: Entry[]; now: number; onSweepOne: (id: string) => void }

// Flow's history: a card per day, time on the left, empty transcripts as blank rows.
export function HistoryList({ entries, now, onSweepOne }: Props) {
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([hit]) => { if (hit.isIntersecting) setLimit(l => l + PAGE) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const days = useMemo(() => {
    const out: { key: string; t: number; rows: Entry[] }[] = []
    for (const e of entries.slice(0, limit)) {
      const t = toDate(e.timestamp).getTime()
      const key = dayKey(t)
      const last = out[out.length - 1]
      if (last?.key === key) last.rows.push(e)
      else out.push({ key, t, rows: [e] })
    }
    return out
  }, [entries, limit])

  return (
    <>
      <AnimatePresence initial={false}>
        {days.map(day => (
          <motion.section key={day.key} aria-label={dayLabel(day.t, now)}
            exit={{ opacity: 0, transition: { duration: .2 } }}>
            {day !== days[0] && <h3 className={`${s.label} ${s.dayLabel}`}>{dayLabel(day.t, now)}</h3>}
            <div className={s.day}>
              <AnimatePresence initial={false} mode="popLayout">
                {day.rows.map((e, i) => <Row key={e.id} e={e} i={i} onSweep={() => onSweepOne(e.id)} />)}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
      <div ref={sentinel} className={s.more}>{limit < entries.length ? 'Loading older transcripts' : ''}</div>
    </>
  )
}

function Row({ e, i, onSweep }: { e: Entry; i: number; onSweep: () => void }) {
  const text = textOf(e)
  const t = toDate(e.timestamp).getTime()
  const [menu, setMenu] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!menu) return
    const onDown = (ev: MouseEvent) => { if (!anchor.current?.contains(ev.target as Node)) setMenu(false) }
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.stopPropagation(); setMenu(false) } }
    document.addEventListener('mousedown', onDown); window.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey, true) }
  }, [menu])

  return (
    // Swept rows lift out; popLayout lets the kept rows reflow underneath them. The stagger is
    // capped so a big sweep still ends quickly.
    <motion.div className={s.row} layout="position" data-menu={menu}
      exit={{ opacity: 0, y: -6, transition: { duration: .22, delay: Math.min(i, 12) * .018, ease: [.4, 0, .2, 1] } }}>
      <span className={s.time}>{flowTime(t)}</span>
      <span className={s.text}>
        {text || (
          // Flow's own row copy: a dismissed transcription offers Recover; a long recording that
          // came back blank offers Retry (Flow's mobile wording, applied to the desktop row).
          e.status === 'dismissed' ? <span className={s.rowNote}>This transcription was dismissed. <button className={s.textLink} disabled>Recover</button></span>
          : (e.duration ?? 0) > 30 ? <span className={s.rowNote}>Retry your transcript. <button className={s.textLink} disabled>Retry</button></span>
          : null
        )}
      </span>
      <span className={s.actions}>
        <span className={s.icon} data-tip="Play" aria-hidden="true"><Play size={14} /></span>
        <span className={s.icon} data-tip="Copy" aria-hidden="true"><Copy size={14} /></span>
        <span className={s.icon} data-tip="Flag" aria-hidden="true"><Flag size={14} /></span>
        <span ref={anchor} className={s.menuAnchor}>
          <button className={s.icon} data-tip="More options" aria-label="More options" aria-haspopup="menu" aria-expanded={menu}
            onClick={() => setMenu(m => !m)}>
            <EllipsisVertical size={14} />
          </button>
          {menu && (
            // Flow's own menu, with one line added. Sweep sits above Delete: the reversible
            // option before the irreversible one. Only Sweep is live in this concept.
            <div className={s.menu} role="menu">
              <button className={s.menuItem} role="menuitem" disabled><Undo2 size={13} />Undo AI edit</button>
              <button className={s.menuItem} role="menuitem" disabled><RefreshCw size={13} />Retry transcript</button>
              <button className={s.menuItem} role="menuitem" onClick={() => { setMenu(false); onSweep() }}><Broom size={13} />Sweep transcript</button>
              <button className={s.menuItem} role="menuitem" data-kind="danger" disabled><Trash2 size={13} />Delete transcript</button>
              <button className={s.menuItem} role="menuitem" disabled><FileAudio size={13} />Extract audio</button>
            </div>
          )}
        </span>
      </span>
    </motion.div>
  )
}
