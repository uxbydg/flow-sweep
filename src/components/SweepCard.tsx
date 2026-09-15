import { useState } from 'react'
import s from '../App.module.scss'
import type { Candidate, Summary } from '../data/types.ts'
import { textOf, appLabel } from '../sweep/detect.ts'
import { toDate, shortDate, plural } from '../format.ts'
import { RefreshCw } from '../icons.ts'

interface Props {
  cands: Candidate[]
  sum: Summary
  selected: (c: Candidate) => boolean
  setMany: (ids: string[], on: boolean) => void
  onSweep: () => void
  onClose: () => void
}

// Flow decided the obvious ones. Below that line the machine is unsure, and a person can disagree.
export const SURE = 0.9

// The sweep is a card that unfolds above the list when the broom is pressed, and folds away after.
// Two tiers, read top to bottom: what Flow will do, then the one question it has.
export function SweepCard({ cands, sum, selected, setMany, onSweep, onClose }: Props) {
  const [showSure, setShowSure] = useState(false)
  const sure = cands.filter(c => c.reason === 'empty' || c.reason === 'flagged' || (c.reason === 'cutoff' && c.confidence >= SURE))
  const doubtful = cands.filter(c => c.reason === 'cutoff' && c.confidence < SURE).sort((a, b) => a.confidence - b.confidence)
  const sureCut = sure.filter(c => c.reason === 'cutoff').length
  const going = sure.length + doubtful.filter(selected).length

  return (
    <section className={`${s.sweepCard} ${s.enter}`} aria-labelledby="sweepTitle">
      <h3 id="sweepTitle" className={s.sweepTitle}>
        Flow will sweep <b>{plural(sure.length, 'transcript')}</b> that are certainly accidents.
      </h3>
      <p className={s.sweepLine}>
        {sum.empty} empty{sureCut > 0 && <>, {sureCut} cut off mid-word</>}{sum.flagged > 0 && <>, and {sum.flagged} you said to drop</>}.
        {' '}<button className={s.fold} aria-expanded={showSure} onClick={() => setShowSure(v => !v)}>{showSure ? 'Hide' : 'Show'}</button>
      </p>
      {showSure && (
        <ul className={s.sureList}>
          {sure.map(c => (
            <li key={c.entry.id}>
              <span className={textOf(c.entry) ? s.candText : s.candEmpty}>{textOf(c.entry) || 'No text'}</span>
              <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span>
            </li>
          ))}
        </ul>
      )}

      {doubtful.length > 0 && (
        <>
          <p className={s.sweepAsk}>Are these accidents too? <span>Filled ones go. Tap to keep or sweep.</span></p>
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
        {sum.retry > 0 && (
          <p>{plural(sum.retry, 'long recording')} came back empty and may still hold speech.
            <button className={s.chip} data-kind="ghost" disabled><RefreshCw size={12} />Retry {sum.retry}</button></p>
        )}
        {sum.reply > 0 && <p>{plural(sum.reply, 'short reply', 'short replies')} like “Do it.” stay.</p>}
      </div>

      <div className={s.sweepActions}>
        <p>Swept transcripts stay restorable for 7 days.</p>
        <button className={s.chip} onClick={onClose}>Not now</button>
        <button className={s.chip} data-kind="dark" disabled={!going} onClick={onSweep}>Sweep {going}</button>
      </div>
    </section>
  )
}
