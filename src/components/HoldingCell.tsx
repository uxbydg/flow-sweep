import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import s from '../App.module.scss'
import type { Entry, Reason, SweptItem } from '../data/types.ts'
import { textOf } from '../sweep/detect.ts'
import { leavesOn, leaveLabel } from '../sweep/holding.ts'
import { REASON_LABEL } from '../sweep/labels.ts'
import { toDate, flowTime, shortDate } from '../format.ts'
import { RotateCcw } from '../icons.ts'
import { usePageVisible } from '../usePageVisible.ts'

interface Props {
  items: SweptItem[]
  byId: Map<string, Entry>
  reasons: Map<string, Reason>
  now: number
  onRestore: (id: string) => void
}

// Grouped by the day rows LEAVE, not the day they were said: the question here is "how long do I have".
export function HoldingCell({ items, byId, reasons, now, onRestore }: Props) {
  const visible = usePageVisible()
  const groups = useMemo(() => {
    const m = new Map<number, SweptItem[]>()
    for (const it of items) {
      const d = leavesOn(it)
      m.set(d, [...(m.get(d) ?? []), it])
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [items])

  if (!items.length) return <p className={s.cellEmpty}>Nothing swept. Anything you sweep stays here for 7 days.</p>

  return (
    <AnimatePresence initial={false}>
      {groups.map(([day, rows]) => (
        <motion.section key={day} aria-label={leaveLabel(day, now)} exit={visible ? { opacity: 0 } : undefined}>
          <h3 className={`${s.label} ${s.dayLabel}`}>{leaveLabel(day, now)} · {rows.length}</h3>
          <div className={s.day}>
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map(it => {
                const e = byId.get(it.id)
                if (!e) return null
                const t = toDate(e.timestamp).getTime()
                const r = reasons.get(it.id)
                return (
                  <motion.div key={it.id} className={s.row} data-cell layout="position"
                    initial={visible ? { opacity: 0 } : false} animate={{ opacity: 1 }}
                    exit={visible ? { opacity: 0, x: 12, transition: { duration: .2 } } : undefined}>
                    <span className={s.time}>{shortDate(t)}, {flowTime(t)}</span>
                    <span className={s.text}>
                      {textOf(e) || <span style={{ color: 'var(--label)' }}>No text</span>}
                      {r && <span className={s.reason}>{REASON_LABEL[r]}</span>}
                    </span>
                    <button className={`${s.chip} ${s.restore}`} data-kind="ghost" onClick={() => onRestore(it.id)}
                      aria-label={`Restore: ${textOf(e) || 'empty transcript'}`}>
                      <RotateCcw size={13} />Restore
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.section>
      ))}
    </AnimatePresence>
  )
}
