import { useState } from 'react'
import s from '../App.module.scss'
import type { Candidate, Reason, Summary } from '../data/types.ts'
import { textOf, appLabel } from '../sweep/detect.ts'
import { ORDER, REASON_LABEL } from '../sweep/labels.ts'
import { toDate, shortDate } from '../format.ts'
import { Broom } from '../icons.ts'

interface Props {
  cands: Candidate[]
  sum: Summary
  selected: (c: Candidate) => boolean
  setMany: (ids: string[], on: boolean) => void
  onSweep: () => void
  onClose: () => void
  onShowBlank: () => void
}

// Flow decided the obvious ones. Below this line the machine is unsure and a person can disagree.
export const SURE = 0.9

// The sweep is a card that unfolds above the list when the broom is pressed, and folds away after.
// Read top to bottom: what Flow will do, made of what, what stays, then the one question it has.
export function SweepCard({ cands, sum, selected, setMany, onSweep, onClose, onShowBlank }: Props) {
  const [open, setOpen] = useState<Reason | null>(null)
  const sweepable = cands.filter(c => c.reason !== 'retry')
  const doubtful = sweepable.filter(c => c.reason === 'cutoff' && c.confidence < SURE).sort((a, b) => a.confidence - b.confidence)
  const decided = sweepable.filter(c => !doubtful.includes(c))
  const replies = decided.filter(c => c.reason === 'reply')
  const going = decided.filter(selected).length + doubtful.filter(selected).length
  // the strip holds only what goes; short replies stay, and get a line of their own
  const sections = ORDER.filter(r => r !== 'retry' && r !== 'reply').map(r => ({ r, rows: decided.filter(c => c.reason === r).sort((a, b) => b.confidence - a.confidence) })).filter(g => g.rows.length)
  const panel = open ? { r: open, rows: open === 'reply' ? replies : (sections.find(g => g.r === open)?.rows ?? []) } : null
  const panelOn = panel ? panel.rows.filter(selected).length : 0
  const repliesOn = replies.filter(selected).length
  // exact repeats ("You" x3) become one chip that toggles all of them
  const chips = doubtful.reduce<{ text: string; cands: Candidate[] }[]>((acc, c) => {
    const t = textOf(c.entry); const hit = acc.find(g => g.text === t)
    if (hit) hit.cands.push(c); else acc.push({ text: t, cands: [c] }); return acc
  }, [])
  const doubtOn = doubtful.filter(selected).length

  const rows = (list: Candidate[], label: string) => (
    <div id="sweepRows" role="region" aria-label={label} className={s.allList}>
      <div className={s.allHead}>
        <input type="checkbox" className={s.check} checked={panelOn === list.length} aria-label={`Select all ${label}`}
          onChange={e => setMany(list.map(c => c.entry.id), e.target.checked)} />
        <span className={s.sectionCount}>{panelOn} of {list.length} selected</span>
      </div>
      {list.map(c => (
        <label key={c.entry.id} className={s.allRow}>
          <input type="checkbox" className={s.check} checked={selected(c)} onChange={e => setMany([c.entry.id], e.target.checked)} />
          <span>{textOf(c.entry) ? <span className={s.candText}>{textOf(c.entry)}</span> : <span className={s.candEmpty}>No text</span>}
            <span className={s.why}>{c.why} · {appLabel(c.entry.app)} · {shortDate(toDate(c.entry.timestamp).getTime())}</span></span>
        </label>
      ))}
    </div>
  )

  return (
    <section className={s.sweepCard} aria-labelledby="sweepTitle">
      {/* one live number, the same one the button carries; the strip and the question show how it is made */}
      <h3 id="sweepTitle" className={s.sweepTitle}><Broom size={16} className={s.sweepGlyph} /><span>Flow will sweep <b>{going}</b> transcripts.</span></h3>

      {/* Flow's tab strip: only what goes; each tab opens its own rows so every one can be seen and kept */}
      <div className={`${s.tabs} ${s.cardTabs}`}>
        {sections.map(({ r, rows: list }) => {
          const on = list.filter(selected).length
          return (
            <button key={r} className={s.tab} aria-expanded={open === r} aria-controls="sweepRows" onClick={() => setOpen(o => o === r ? null : r)}>
              {REASON_LABEL[r]}<small data-partial={on !== list.length}>{on}/{list.length}</small>
            </button>
          )
        })}
      </div>
      {panel && panel.r !== 'reply' && rows(panel.rows, REASON_LABEL[panel.r])}

      {/* what stays, and what can still be recovered, next to the breakdown they belong to */}
      <div className={s.sweepLines}>
        {replies.length > 0 && (
          <p>{repliesOn > 0 ? `${repliesOn} of ${replies.length}` : replies.length} short replies like “Do it.” {repliesOn > 0 ? 'go' : 'stay'}.{' '}
            <button className={s.textLink} aria-expanded={open === 'reply'} aria-controls="sweepRows" onClick={() => setOpen(o => o === 'reply' ? null : 'reply')}>{open === 'reply' ? 'Hide' : 'Show them'}</button></p>
        )}
        {panel && panel.r === 'reply' && rows(panel.rows, REASON_LABEL.reply)}
        {sum.retry > 0 && (
          // Retrying from here would happen off screen. The link filters History to those rows first.
          <p>{sum.retry} transcripts came back blank. <button className={s.textLink} onClick={onShowBlank}>Show them</button></p>
        )}
      </div>

      {doubtful.length > 0 && (
        <>
          <div className={s.sweepAsk}>
            {/* polarity in words: filled chips are the ones that go */}
            <h4>Are these accidents too? <small>{doubtOn} of {doubtful.length} will go</small></h4>
            <label className={s.selectAll}>
              <input type="checkbox" className={s.check} checked={doubtOn === doubtful.length} aria-label="Sweep all of these"
                ref={el => { if (el) el.indeterminate = doubtOn > 0 && doubtOn < doubtful.length }}
                onChange={e => setMany(doubtful.map(c => c.entry.id), e.target.checked)} />Sweep all
            </label>
          </div>
          <div className={s.chips} role="group" aria-label="Transcripts Flow is unsure about. Filled ones will be swept.">
            {chips.map(g => {
              const on = g.cands.every(selected)
              const c = g.cands[0]
              return (
                <button key={g.text} className={s.tag} aria-pressed={on} onClick={() => setMany(g.cands.map(x => x.entry.id), !on)}
                  data-tip={`${c.why} · ${appLabel(c.entry.app)} · ${shortDate(toDate(c.entry.timestamp).getTime())}`}>
                  {g.text}{g.cands.length > 1 && <small> ×{g.cands.length}</small>}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className={s.sweepActions}>
        <p>You can restore anything for 7 days.</p>
        <button className={s.chip} onClick={onClose}>Not now</button>
        <button className={s.chip} data-kind="dark" disabled={!going} onClick={onSweep}>Sweep {going}</button>
      </div>
    </section>
  )
}
