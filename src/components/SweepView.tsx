import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import s from '../App.module.scss'
import type { Candidate, Reason, Summary } from '../data/types.ts'
import { textOf, appLabel } from '../sweep/detect.ts'
import { ORDER, REASON_LABEL, REASON_NOTE } from '../sweep/labels.ts'
import { toDate, shortDate, pct } from '../format.ts'

interface Props {
  cands: Candidate[]
  sum: Summary
  selected: (c: Candidate) => boolean
  setMany: (ids: string[], on: boolean) => void
  onSweep: () => void
  onClose: () => void
}

// Sweep lives inside History, like the holding cell: the summary in one sentence, then Flow's own
// tab strip with one section showing at a time. Nothing leaves until the one button at the bottom.
export function SweepView({ cands, sum, selected, setMany, onSweep, onClose }: Props) {
  const present = ORDER.filter(r => cands.some(c => c.reason === r))
  const [tab, setTab] = useState<Reason>(present[0] ?? 'empty')
  const group = cands.filter(c => c.reason === tab).sort((a, b) => b.confidence - a.confidence)
  const on = group.filter(selected).length
  const chosen = cands.filter(selected)
  const oneIn = Math.max(2, Math.round(1 / Math.max(sum.share, 0.01)))

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2, ease: [.2, .8, .2, 1] }}>
      <p className={s.lead}>
        You have <Count n={sum.empty} i={0} /> empty transcripts, <Count n={sum.cutoff} i={1} /> that cut off
        mid-thought, and <Count n={sum.flagged} i={2} /> you said to drop. That's about <b>1 in every {oneIn}</b>.
      </p>
      <p className={s.leadSub}>
        {sum.retry > 0 && <>{sum.retry} long recordings came back empty and may be worth a retry. </>}
        Short replies like “Do it.” stay unless you choose them.
      </p>

      <div className={s.tabs} role="tablist" aria-label="Sections">
        {present.map(r => {
          const n = cands.filter(c => c.reason === r).length
          return (
            <button key={r} role="tab" className={s.tab} aria-selected={tab === r} aria-controls="sweepList" onClick={() => setTab(r)}>
              {REASON_LABEL[r]}<small>{n}</small>
            </button>
          )
        })}
      </div>
      <div className={s.selectRow}>
        <SectionCheck all={on === group.length} some={on > 0 && on < group.length}
          label={`Select all ${REASON_LABEL[tab]}`} onChange={v => setMany(group.map(c => c.entry.id), v)} />
        <span>{on} of {group.length} selected</span>
        {REASON_NOTE[tab] && <span className={s.selectNote}>{REASON_NOTE[tab]}</span>}
      </div>

      <div id="sweepList" role="tabpanel" className={s.day}>
        {group.map(c => {
          const text = textOf(c.entry)
          return (
            <label key={c.entry.id} className={`${s.row} ${s.candRow}`}>
              <input type="checkbox" className={s.check} checked={selected(c)} onChange={e => setMany([c.entry.id], e.target.checked)}
                aria-label={`Sweep: ${text || 'empty transcript'}`} />
              <span className={s.text}>
                {text ? <span className={s.candText}>{text}</span> : <span className={s.candEmpty}>No text</span>}
                <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span>
              </span>
              <span className={s.conf} title="How sure the sweep is">{pct(c.confidence)}</span>
            </label>
          )
        })}
      </div>

      <div className={s.sweepFoot}>
        <p>Swept transcripts stay restorable for 7 days, then leave for good.</p>
        <button className={s.chip} onClick={onClose}>Not now</button>
        <button className={s.chip} data-kind="dark" disabled={!chosen.length} onClick={onSweep}>Sweep {chosen.length}</button>
      </div>
    </motion.div>
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
