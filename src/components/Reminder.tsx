import { motion } from 'motion/react'
import s from '../App.module.scss'
import { X } from '../icons.ts'
import type { Reason } from '../data/types.ts'
import { REASON_LABEL } from '../sweep/labels.ts'
import { plural } from '../format.ts'

interface Props {
  counts: Partial<Record<Reason, number>>
  total: number
  onReview: () => void
  onKeep: () => void
  onDismiss: () => void
}

// Shows only on a day swept transcripts reach the end of their hold. Flow's own surface, not a red
// box: coral is reserved for the one destructive word, "tonight".
export function Reminder({ counts, total, onReview, onKeep, onDismiss }: Props) {
  return (
    <motion.section className={s.reminder} aria-labelledby="reminderTitle"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .24, ease: [.2, .8, .2, 1] }}>
      <div className={s.reminderHead}>
        <h3 id="reminderTitle">{plural(total, 'swept transcript')} {total === 1 ? 'leaves' : 'leave'} for good <em>tonight</em></h3>
        <button className={s.icon} style={{ margin: '-5px -6px 0 0' }} aria-label="Dismiss until tomorrow" data-tip="Dismiss" onClick={onDismiss}><X size={14} /></button>
      </div>
      <ul className={s.reminderList}>
        {(Object.entries(counts) as [Reason, number][]).map(([r, n]) => (
          <li key={r}><span>{REASON_LABEL[r]}</span><b>{n}</b></li>
        ))}
      </ul>
      <div className={s.reminderActions}>
        <button className={s.chip} data-kind="dark" onClick={onReview}>Review</button>
        <button className={s.chip} onClick={onKeep}>Keep them</button>
      </div>
    </motion.section>
  )
}
