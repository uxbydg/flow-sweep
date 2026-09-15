import { motion } from 'motion/react'
import s from '../App.module.scss'
import { CircleAlert } from '../icons.ts'

// Flow's toast, as captured 14 Sep: dark pill, bottom right, red alert mark, one sentence.
export function Toast({ text }: { text: string }) {
  return (
    <motion.div className={s.toast} role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .2 }}>
      <CircleAlert size={15} className={s.toastMark} />{text}
    </motion.div>
  )
}
