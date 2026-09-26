import { motion } from 'motion/react'
import s from '../App.module.scss'
import { X } from '../icons.ts'
import type { Reason } from '../data/types.ts'
import { REASON_LABEL } from '../sweep/labels.ts'
import { plural } from '../format.ts'
import { usePageVisible } from '../usePageVisible.ts'

interface Props {
  counts: Partial<Record<Reason, number>>
  total: number
  onReview: () => void
  onKeep: () => void
  onDismiss: () => void
}

// Shows only on a day swept transcripts reach the end of their hold. Flow's own surface, not a red
// box: coral is reserved for the deadline, and nothing else in the card is coloured.
//
// ⚡ THE TIME IS IN THE CORAL SPAN ON PURPOSE. Daniel, 2026-09-25: "right now it just says
// 'tonight,' and that does not give them an exact time." Splitting it, <em>tonight</em> at 11:59 pm,
// would leave the precise half unemphasised, which is the half he added it for. The deadline is one
// phrase and it is coloured as one phrase.
//
// ⛑ 11:59 pm is not decorative and is not invented: isExpired() fires at the midnight AFTER the
// end of day 7, so 11:59 pm really is the last minute a swept row can be restored. If that rule ever
// changes, this string is wrong and must change with it.
export function Reminder({ counts, total, onReview, onKeep, onDismiss }: Props) {
  const visible = usePageVisible()
  return (
    <motion.section className={s.reminder} aria-labelledby="reminderTitle"
      initial={visible ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} exit={visible ? { opacity: 0, y: -4 } : undefined} transition={{ duration: .24, ease: [.2, .8, .2, 1] }}>
      <div className={s.reminderHead}>
        <h3 id="reminderTitle">{plural(total, 'swept transcript')} {total === 1 ? 'leaves' : 'leave'} for good <em>tonight at 11:59 pm</em></h3>
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
