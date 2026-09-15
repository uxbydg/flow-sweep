import { useState } from 'react'
import s from '../App.module.scss'
import type { Candidate, Reason, Summary } from '../data/types.ts'
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
  const [open, setOpen] = useState<Reason | null>(null)
  const sweepable = cands.filter(c => !OPT_IN.includes(c.reason))
  const sure = sweepable.filter(c => c.reason !== 'cutoff' || c.confidence >= SURE)
  const doubtful = sweepable.filter(c => c.reason === 'cutoff' && c.confidence < SURE).sort((a, b) => a.confidence - b.confidence)
  const sureOn = sure.filter(selected).length
  const doubtOn = doubtful.filter(selected).length
  const going = sureOn + doubtOn
  const sections = ORDER.filter(r => !OPT_IN.includes(r)).map(r => ({ r, rows: sure.filter(c => c.reason === r).sort((a, b) => b.confidence - a.confidence) })).filter(g => g.rows.length)
  const shown = sections.find(g => g.r === open)
  const shownOn = shown ? shown.rows.filter(selected).length : 0

  return (
    <section className={`${s.sweepCard} ${s.enter}`} aria-labelledby="sweepTitle">
      <div className={s.sweepHead}>
        <span className={s.sweepMark}><Check size={13} strokeWidth={2.5} /></span>
        <h3 id="sweepTitle" className={s.sweepTitle}>Flow will sweep <b>{sureOn}</b> transcripts.</h3>
      </div>

      {/* Flow's tab strip: the breakdown, and each tab opens its own rows so every one can be seen and kept */}
      <div className={`${s.tabs} ${s.cardTabs}`} role="tablist" aria-label="What Flow will sweep">
        {sections.map(({ r, rows }) => (
          <button key={r} role="tab" className={s.tab} aria-selected={open === r} aria-controls="sweepRows" onClick={() => setOpen(o => o === r ? null : r)}>
            {REASON_LABEL[r]}<small>{rows.length}</small>
          </button>
        ))}
      </div>
      {shown && (
        <div id="sweepRows" role="tabpanel" className={s.allList}>
          <div className={s.allHead}>
            <span className={s.sectionCount}>{shownOn} of {shown.rows.length} selected</span>
            <label className={s.selectAll}>
              <input type="checkbox" className={s.check} checked={shownOn === shown.rows.length} aria-label={`Select all ${REASON_LABEL[shown.r]}`}
                onChange={e => setMany(shown.rows.map(c => c.entry.id), e.target.checked)} />Select all
            </label>
          </div>
          {shown.rows.map(c => (
            <label key={c.entry.id} className={s.allRow}>
              <input type="checkbox" className={s.check} checked={selected(c)} onChange={e => setMany([c.entry.id], e.target.checked)} />
              <span>{textOf(c.entry) ? <span className={s.candText}>{textOf(c.entry)}</span> : <span className={s.candEmpty}>No text</span>}
                <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span></span>
              <span className={s.conf}>{pct(c.confidence)}</span>
            </label>
          ))}
        </div>
      )}

      {doubtful.length > 0 && (
        <>
          <div className={s.sweepAsk}>
            <h4>Are these accidents too?</h4>
            <label className={s.selectAll}>
              <input type="checkbox" className={s.check} checked={doubtOn === doubtful.length} aria-label="Select all"
                onChange={e => setMany(doubtful.map(c => c.entry.id), e.target.checked)} />Select all
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
        {sum.retry > 0 && <p>{sum.retry} recordings over 30 s came back blank. Retry them before sweeping.<button className={s.chip} data-kind="ghost" disabled><RefreshCw size={12} />Retry</button></p>}
        {sum.reply > 0 && <p>{sum.reply} short replies like “Do it.” stay.</p>}
      </div>

      <div className={s.sweepActions}>
        <p>Restorable for 7 days.</p>
        <button className={s.chip} onClick={onClose}>Not now</button>
        <button className={s.chip} data-kind="dark" disabled={!going} onClick={onSweep}>Sweep {going}</button>
      </div>
    </section>
  )
}
