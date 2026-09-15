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

// Built on the stats card directly above it: serif number left, label right, one row per section,
// a hairline, then a titled block with the sentence and the controls. Coral only on "tonight".
export function Reminder({ counts, total, onReview, onKeep, onDismiss }: Props) {
  return (
    <motion.section className={`${s.stats} ${s.reminder}`} aria-labelledby="reminderTitle"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .24, ease: [.2, .8, .2, 1] }}>
      <button className={`${s.icon} ${s.reminderClose}`} aria-label="Dismiss until tomorrow" onClick={onDismiss}><X size={14} /></button>
      <div className={s.statsTop}>
        {(Object.entries(counts) as [Reason, number][]).map(([r, n]) => (
          <div key={r}><b>{n}</b> {REASON_LABEL[r].toLowerCase()}</div>
        ))}
      </div>
      <div className={s.voice}>
        <h3 id="reminderTitle">Leaving for good <em>tonight</em></h3>
        <p>{total} swept {total === 1 ? 'transcript reaches' : 'transcripts reach'} 7 days.</p>
        <div className={s.reminderActions}>
          <button className={s.chip} data-kind="dark" onClick={onReview}>Review</button>
          <button className={s.chip} onClick={onKeep}>Keep them</button>
        </div>
      </div>
    </motion.section>
  )
}
