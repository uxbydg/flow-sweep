import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import s from '../App.module.scss'
import type { Candidate, Reason, Summary } from '../data/types.ts'
import { textOf, appLabel } from '../sweep/detect.ts'
import { ORDER, REASON_LABEL, REASON_NOTE, OPT_IN } from '../sweep/labels.ts'
import { toDate, shortDate, pct } from '../format.ts'
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

interface SweepProps {
  cands: Candidate[]
  sum: Summary
  selected: (c: Candidate) => boolean
  setMany: (ids: string[], on: boolean) => void
  onSweep: () => void
  onClose: () => void
}

export function SweepDialog({ cands, sum, selected, setMany, onSweep, onClose }: SweepProps) {
  const [step, setStep] = useState<'summary' | 'review'>('summary')
  const [open, setOpen] = useState<Set<Reason>>(new Set(ORDER.filter(r => !OPT_IN.includes(r))))
  const chosen = cands.filter(selected)
  const oneIn = Math.max(2, Math.round(1 / Math.max(sum.share, 0.01)))

  return (
    <Modal wide labelledBy="sweepTitle" onClose={onClose}>
      <div className={`${s.dialogHead} ${s.wideHead}`}>
        <h2 id="sweepTitle">{step === 'summary' ? 'Sweep your history' : 'Review before sweeping'}</h2>
        <button className={s.icon} aria-label="Close" onClick={onClose}><X size={15} /></button>
      </div>

      {step === 'summary' ? (
        <>
          <div className={s.wideBody}>
            <p className={s.lead}>
              You have <Count n={sum.empty} i={0} /> empty transcripts, <Count n={sum.cutoff} i={1} /> that cut off
              mid-thought, and <Count n={sum.flagged} i={2} /> you said to drop. That's about <b>1 in every {oneIn}</b>.
            </p>
            <p className={s.dialogSub} style={{ margin: 0 }}>
              {sum.retry > 0 && <>{sum.retry} long recordings came back empty and may be worth a retry. </>}
              Short replies like “Do it.” stay.
            </p>
          </div>
          <div className={s.wideFoot}>
            <p>Swept transcripts stay restorable for 7 days.</p>
            <button className={s.chip} onClick={onClose}>Not now</button>
            <button className={s.chip} data-kind="dark" data-autofocus onClick={() => setStep('review')}>Review</button>
          </div>
        </>
      ) : (
        <>
          <div className={s.wideBody}>
            {ORDER.map(r => {
              const group = cands.filter(c => c.reason === r).sort((a, b) => b.confidence - a.confidence)
              if (!group.length) return null
              const on = group.filter(selected).length
              const isOpen = open.has(r)
              return (
                <section key={r} className={s.section} aria-labelledby={`sec-${r}`}>
                  <div className={s.sectionHead}>
                    <SectionCheck all={on === group.length} some={on > 0 && on < group.length}
                      label={`Sweep all ${REASON_LABEL[r]}`} onChange={v => setMany(group.map(c => c.entry.id), v)} />
                    <h3 id={`sec-${r}`} className={s.label}>{REASON_LABEL[r]}</h3>
                    <span className={s.sectionCount}>{on} of {group.length}</span>
                    <button className={s.fold} aria-expanded={isOpen} aria-controls={`list-${r}`}
                      onClick={() => setOpen(prev => { const n = new Set(prev); if (n.has(r)) n.delete(r); else n.add(r); return n })}>
                      {isOpen ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {REASON_NOTE[r] && <p className={s.sectionNote}>{REASON_NOTE[r]}</p>}
                  {isOpen && (
                    <div id={`list-${r}`}>
                      {group.map(c => {
                        const text = textOf(c.entry)
                        return (
                          <label key={c.entry.id} className={s.cand}>
                            <input type="checkbox" className={s.check} checked={selected(c)}
                              onChange={e => setMany([c.entry.id], e.target.checked)} />
                            <span style={{ minWidth: 0 }}>
                              {text ? <span className={s.candText}>{text}</span> : <span className={s.candEmpty}>No text</span>}
                              <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span>
                            </span>
                            <span className={s.conf} title="How sure the sweep is">{pct(c.confidence)}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
          <div className={s.wideFoot}>
            <p>Restorable for 7 days, then gone for good.</p>
            <button className={s.chip} onClick={() => setStep('summary')}>Back</button>
            <button className={s.chip} data-kind="dark" data-autofocus disabled={!chosen.length} onClick={onSweep}>
              Sweep {chosen.length}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function SectionCheck({ all, some, label, onChange }: { all: boolean; some: boolean; label: string; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = some }, [some])
  return <input ref={ref} type="checkbox" className={s.check} style={{ marginTop: 0 }} checked={all} aria-label={label} onChange={e => onChange(e.target.checked)} />
}

// counts settle in sequence, not at once
function Count({ n, i }: { n: number; i: number }) {
  return <motion.b initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 + i * .14, duration: .3 }}>{n}</motion.b>
}
