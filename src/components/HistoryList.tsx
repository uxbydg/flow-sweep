import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import s from '../App.module.scss'
import type { Entry } from '../data/types.ts'
import { textOf } from '../sweep/detect.ts'
import { toDate, dayKey, dayLabel, flowTime } from '../format.ts'
import { Play, Copy, Flag, EllipsisVertical } from '../icons.ts'

const PAGE = 120

interface Props { entries: Entry[]; now: number }

// Flow's history: a card per day, time on the left, empty transcripts as blank rows.
export function HistoryList({ entries, now }: Props) {
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
              <AnimatePresence initial={false}>
                {day.rows.map((e, i) => <Row key={e.id} e={e} i={i} />)}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
      <div ref={sentinel} className={s.more}>{limit < entries.length ? 'Loading older transcripts' : ''}</div>
    </>
  )
}

function Row({ e, i }: { e: Entry; i: number }) {
  const text = textOf(e)
  const t = toDate(e.timestamp).getTime()
  return (
    // Swept rows lift and close their gap; the stagger is capped so a big sweep still ends quickly.
    <motion.div className={s.row} layout="position"
      exit={{ opacity: 0, y: -6, height: 0, minHeight: 0, transition: { duration: .22, delay: Math.min(i, 12) * .018, ease: [.4, 0, .2, 1] } }}>
      <span className={s.time}>{flowTime(t)}</span>
      <span className={s.text}>{text}</span>
      <span className={s.actions} aria-hidden="true">
        <span className={s.icon} data-tip="Play"><Play size={14} /></span>
        <span className={s.icon} data-tip="Copy"><Copy size={14} /></span>
        <span className={s.icon} data-tip="Flag"><Flag size={14} /></span>
        <span className={s.icon} data-tip="More options"><EllipsisVertical size={14} /></span>
      </span>
    </motion.div>
  )
}
