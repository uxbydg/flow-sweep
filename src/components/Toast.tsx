import s from '../App.module.scss'
import { CircleAlert } from '../icons.ts'

// Flow's toast, as captured 14 Sep: dark pill, bottom right, red alert mark, one sentence.
export function Toast({ text }: { text: string }) {
  return (
    <div className={`${s.toast} ${s.enter}`} role="status">
      <CircleAlert size={15} className={s.toastMark} />{text}
    </div>
  )
}
