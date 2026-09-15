import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import s from '../App.module.scss'
import { X } from '../icons.ts'

function Modal({ children, wide, labelledBy, onClose }: { children: ReactNode; wide?: boolean; labelledBy: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); prev?.focus() }
  }, [onClose])
  return (
    <motion.div className={s.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={`${s.dialog} ${wide ? s.dialogWide : ''}`}
        initial={{ opacity: 0, scale: .98, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98 }}
        transition={{ duration: .2, ease: [.2, .8, .2, 1] }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

// Flow's own confirm, reused for the one irreversible action in the concept.
export function Confirm({ title, body, action, onConfirm, onClose }: { title: string; body: string; action: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal labelledBy="confirmTitle" onClose={onClose}>
      <div className={s.dialogHead}>
        <h2 id="confirmTitle">{title}</h2>
        <button className={s.icon} aria-label="Close" onClick={onClose}><X size={15} /></button>
      </div>
      <p className={s.dialogSub}>{body}</p>
      <div className={s.dialogFoot}>
        <button className={s.chip} data-autofocus onClick={onClose}>Cancel</button>
        <button className={s.chip} data-kind="danger" onClick={onConfirm}>{action}</button>
      </div>
    </Modal>
  )
}
