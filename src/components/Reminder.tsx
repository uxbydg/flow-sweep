import { motion } from 'motion/react'
import s from '../App.module.scss'
import { X } from '../icons.ts'
import type { Reason } from '../data/types.ts'
import { REASON_LABEL } from '../sweep/labels.ts'

interface Props {
  counts: Partial<Record<Reason, number>>
  total: number
  onReview: () => void
  onKeep: () => void
  onDismiss: () => void
}

// Reads top to bottom on its own: what is happening, how many, made of what, then the consequence
// and the two choices. The parts are the stats card's (serif figure, label, hairline, titled block).
export function Reminder({ counts, total, onReview, onKeep, onDismiss }: Props) {
  return (
    <motion.section className={`${s.stats} ${s.reminder}`} aria-labelledby="reminderTitle"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .24, ease: [.2, .8, .2, 1] }}>
      <div className={s.reminderTop}>
        <h3 id="reminderTitle">Leaving for good <em>tonight</em></h3>
        <button className={`${s.icon} ${s.reminderClose}`} aria-label="Dismiss until tomorrow" onClick={onDismiss}><X size={14} /></button>
        <div className={s.reminderStat}><b>{total}</b> swept {total === 1 ? 'transcript' : 'transcripts'}</div>
        <p className={s.reminderMeta}>
          {(Object.entries(counts) as [Reason, number][]).map(([r, n], i) => (
            <span key={r}>{i > 0 && ' · '}{REASON_LABEL[r]} {n}</span>
          ))}
        </p>
      </div>
      <div className={s.voice}>
        <p>Swept 7 days ago. Anything you don't restore is deleted at midnight.</p>
        <div className={s.reminderActions}>
          <button className={s.chip} data-kind="dark" onClick={onReview}>Review</button>
          <button className={s.chip} onClick={onKeep}>Keep them</button>
        </div>
      </div>
    </motion.section>
  )
}
