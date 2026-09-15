import { useEffect, useRef, useState } from 'react'
import s from '../App.module.scss'
import type { Candidate, Summary } from '../data/types.ts'
import { textOf, appLabel } from '../sweep/detect.ts'
import { ORDER, REASON_LABEL, OPT_IN } from '../sweep/labels.ts'
import { toDate, shortDate, pct } from '../format.ts'
import { RefreshCw, Check } from '../icons.ts'

interface Props {
  cands: Candidate[]
  sum: Summary
  selected: (c: Candidate) => boolean
  setMany: (ids: string[], on: boolean) => void
  onSweep: () => void
  onClose: () => void
}

// Flow decided the obvious ones. Below this line the machine is unsure and a person can disagree.
export const SURE = 0.9

// The sweep is a card that unfolds above the list when the broom is pressed, and folds away after.
// Two tiers, read top to bottom: what Flow decided, then the one question it has.
export function SweepCard({ cands, sum, selected, setMany, onSweep, onClose }: Props) {
  const [all, setAll] = useState(false)
  const sweepable = cands.filter(c => !OPT_IN.includes(c.reason))
  const sure = sweepable.filter(c => c.reason !== 'cutoff' || c.confidence >= SURE)
  const doubtful = sweepable.filter(c => c.reason === 'cutoff' && c.confidence < SURE).sort((a, b) => a.confidence - b.confidence)
  const sureCut = sure.filter(c => c.reason === 'cutoff').length
  const sureOn = sure.filter(selected).length
  const doubtOn = doubtful.filter(selected).length
  const going = sureOn + doubtOn

  return (
    <section className={`${s.sweepCard} ${s.enter}`} aria-labelledby="sweepTitle">
      <div className={s.sweepHead}>
        <span className={s.sweepMark}><Check size={13} strokeWidth={2.5} /></span>
        <h3 id="sweepTitle" className={s.sweepTitle}>Flow will sweep <b>{sureOn}</b> transcripts.</h3>
      </div>
      <p className={s.sweepLine}>
        <span>{sum.empty} empty</span>{sureCut > 0 && <span>{sureCut} cut off mid-word</span>}{sum.flagged > 0 && <span>{sum.flagged} you flagged</span>}
        <button className={s.fold} aria-expanded={all} aria-controls="sweepAll" onClick={() => setAll(v => !v)}>{all ? 'Hide' : `See all ${sweepable.length}`}</button>
      </p>

      {all && (
        <div id="sweepAll" className={s.allList}>
          {ORDER.filter(r => !OPT_IN.includes(r)).map(r => {
            const group = sweepable.filter(c => c.reason === r).sort((a, b) => b.confidence - a.confidence)
            if (!group.length) return null
            const on = group.filter(selected).length
            return (
              <div key={r}>
                <div className={s.allHead}>
                  <Tri all={on === group.length} some={on > 0 && on < group.length} label={`Select all ${REASON_LABEL[r]}`} onChange={v => setMany(group.map(c => c.entry.id), v)} />
                  <span className={s.label}>{REASON_LABEL[r]}</span><span className={s.sectionCount}>{on} of {group.length}</span>
                </div>
                {group.map(c => (
                  <label key={c.entry.id} className={s.allRow}>
                    <input type="checkbox" className={s.check} checked={selected(c)} onChange={e => setMany([c.entry.id], e.target.checked)} />
                    <span>{textOf(c.entry) ? <span className={s.candText}>{textOf(c.entry)}</span> : <span className={s.candEmpty}>No text</span>}
                      <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span></span>
                    <span className={s.conf}>{pct(c.confidence)}</span>
                  </label>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {doubtful.length > 0 && (
        <>
          <div className={s.sweepAsk}>
            <h4>Are these accidents too?</h4>
            <label className={s.selectAll}>
              <Tri all={doubtOn === doubtful.length} some={doubtOn > 0 && doubtOn < doubtful.length} label="Select all" onChange={v => setMany(doubtful.map(c => c.entry.id), v)} />
              Select all
            </label>
          </div>
          <div className={s.chips} role="group" aria-label="Transcripts Flow is unsure about">
            {doubtful.map(c => {
              const on = selected(c)
              return (
                <button key={c.entry.id} className={s.tag} aria-pressed={on} onClick={() => setMany([c.entry.id], !on)}
                  data-tip={`${c.why} · ${appLabel(c.entry.app)} · ${shortDate(toDate(c.entry.timestamp).getTime())}`}>
                  {textOf(c.entry)}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className={s.sweepNotes}>
        {sum.retry > 0 && <p>{sum.retry} long empties may hold speech.<button className={s.chip} data-kind="ghost" disabled><RefreshCw size={12} />Retry</button></p>}
        {sum.reply > 0 && <p>{sum.reply} short replies stay.</p>}
      </div>

      <div className={s.sweepActions}>
        <p>Restorable for 7 days.</p>
        <button className={s.chip} onClick={onClose}>Not now</button>
        <button className={s.chip} data-kind="dark" disabled={!going} onClick={onSweep}>Sweep {going}</button>
      </div>
    </section>
  )
}

function Tri({ all, some, label, onChange }: { all: boolean; some: boolean; label: string; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = some }, [some])
  return <input ref={ref} type="checkbox" className={s.check} style={{ marginTop: 0 }} checked={all} aria-label={label} onChange={e => onChange(e.target.checked)} />
}
