import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import s from '../App.module.scss'
import type { Entry } from '../data/types.ts'
import { textOf } from '../sweep/detect.ts'
import { toDate, dayKey, dayLabel, flowTime, mmss } from '../format.ts'
import { usePageVisible } from '../usePageVisible.ts'
import { Play, Copy, Flag, EllipsisVertical, Undo2, RotateCw, Broom, Trash, FileMusic } from '../icons.ts'

const PAGE = 120

interface Props { entries: Entry[]; now: number; onSweepOne: (id: string) => void; onRetry: (id: string) => void; retrying: Set<string> }

// Flow's history: a card per day, time on the left, empty transcripts as blank rows.
export function HistoryList({ entries, now, onSweepOne, onRetry, retrying }: Props) {
  const visible = usePageVisible()
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([hit]) => { if (hit.isIntersecting) setLimit(l => l + PAGE) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const days = useMemo(() => {
    const out: { key: string; t: number; rows: Entry[] }[] = []
    for (const e of entries.slice(0, limit)) {
      const t = toDate(e.timestamp).getTime()
      const key = dayKey(t)
      const last = out[out.length - 1]
      if (last?.key === key) last.rows.push(e)
      else out.push({ key, t, rows: [e] })
    }
    return out
  }, [entries, limit])

  return (
    <>
      <AnimatePresence initial={false}>
        {days.map(day => (
          <motion.section key={day.key} aria-label={dayLabel(day.t, now)}
            exit={visible ? { opacity: 0, transition: { duration: .2 } } : undefined}>
            {day !== days[0] && <h3 className={`${s.label} ${s.dayLabel}`}>{dayLabel(day.t, now)}</h3>}
            <div className={s.day} role="list">
              <AnimatePresence initial={false} mode="popLayout">
                {day.rows.map((e, i) => <Row key={e.id} e={e} i={i} onSweep={() => onSweepOne(e.id)} onRetry={() => onRetry(e.id)} retrying={retrying.has(e.id)} animate={visible} />)}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
      <div ref={sentinel} className={s.more}>{limit < entries.length ? 'Loading older transcripts' : ''}</div>
    </>
  )
}

function Row({ e, i, onSweep, onRetry, retrying, animate }: { e: Entry; i: number; onSweep: () => void; onRetry: () => void; retrying: boolean; animate: boolean }) {
  const text = textOf(e)
  const t = toDate(e.timestamp).getTime()
  const [menu, setMenu] = useState(false)
  const row = useRef<HTMLDivElement>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const menuEl = useRef<HTMLDivElement>(null)

  // One tab stop per row. Enter opens the menu with focus on its first live item; arrows walk
  // the rows; Escape hands focus back to the row. The three-dot stays for the mouse.
  useEffect(() => {
    if (!menu) return
    menuEl.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus()
    const onDown = (ev: MouseEvent) => { if (!anchor.current?.contains(ev.target as Node)) setMenu(false) }
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.stopPropagation(); setMenu(false); row.current?.focus() } }
    document.addEventListener('mousedown', onDown); window.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey, true) }
  }, [menu])

  const step = (from: HTMLElement | null, dir: 1 | -1) => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'))
    const next = rows[rows.indexOf(from as HTMLElement) + dir]
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }) }
  }
  const onRowKey = (ev: ReactKeyboardEvent<HTMLDivElement>) => {
    if (ev.target !== row.current) return
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setMenu(true) }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); step(row.current, 1) }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); step(row.current, -1) }
  }
  const onMenuKey = (ev: ReactKeyboardEvent<HTMLDivElement>) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    ev.preventDefault()
    const items = Array.from(menuEl.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    items[(at + (ev.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus()
  }
  // A swept row leaves; hand focus to its neighbour first so the keyboard is not dropped on body.
  const sweep = () => { setMenu(false); const r = row.current; const n = (r?.nextElementSibling ?? r?.previousElementSibling) as HTMLElement | null; n?.focus(); onSweep() }
  const retry = () => { setMenu(false); row.current?.focus(); onRetry() }

  return (
    // Swept rows lift out; popLayout lets the kept rows reflow underneath them. The stagger is
    // capped so a big sweep still ends quickly.
    <motion.div ref={row} className={s.row} layout="position" data-menu={menu} data-row tabIndex={0} role="listitem" onKeyDown={onRowKey}
      exit={animate ? { opacity: 0, y: -6, transition: { duration: .22, delay: Math.min(i, 12) * .018, ease: [.4, 0, .2, 1] } } : undefined}>
      <span className={s.time}>{flowTime(t)}</span>
      <span className={s.text}>
        {retrying ? <span className={s.skeleton} aria-label="Retrying" /> : text ? <>{text}{e.transcriptOrigin === 'staged' && <span className={s.staged}>Staged for this concept: there is no audio to transcribe, so this one recovery is scripted.</span>}</> : (
          // Flow's own desktop row copy, captured 14 Sep: a dismissed transcription offers Recover;
          // a long recording that came back blank reads "Retry your 0:05 transcription".
          e.status === 'dismissed' ? <span className={s.rowNote}>This transcription was dismissed. <button className={s.textLink} disabled>Recover</button></span>
          : (e.duration ?? 0) > 30 ? <span className={s.rowNote}><button className={s.textLink} onClick={onRetry}>Retry</button> your {mmss(e.duration)} transcription</span>
          : null
        )}
      </span>
      <span className={s.actions}>
        <span className={s.icon} data-tip="Play" data-ghost aria-hidden="true"><Play size={14} /></span>
        <span className={s.icon} data-tip="Copy" data-ghost aria-hidden="true"><Copy size={14} /></span>
        <span className={s.icon} data-tip="Flag" data-ghost aria-hidden="true"><Flag size={14} /></span>
        <span ref={anchor} className={s.menuAnchor}>
          <button className={s.icon} data-tip="More options" aria-label="More options" aria-haspopup="menu" aria-expanded={menu} tabIndex={-1}
            onClick={() => setMenu(m => !m)}>
            <EllipsisVertical size={14} />
          </button>
          {menu && (
            // Flow's own menu, with one line added. Sweep sits above Delete: the reversible
            // option before the irreversible one. Only Sweep is live in this concept.
            <div ref={menuEl} className={s.menu} role="menu" onKeyDown={onMenuKey}
              onBlur={ev => { if (ev.relatedTarget && !anchor.current?.contains(ev.relatedTarget as Node)) setMenu(false) }}>
              <button className={s.menuItem} role="menuitem" disabled><Undo2 size={14} />Undo AI edit</button>
              <button className={s.menuItem} role="menuitem" onClick={retry}><RotateCw size={14} />Retry transcript</button>
              <button className={s.menuItem} role="menuitem" onClick={sweep}><Broom size={14} />Sweep transcript</button>
              <button className={s.menuItem} role="menuitem" data-kind="danger" disabled><Trash size={14} fill="currentColor" />Delete transcript</button>
              <button className={s.menuItem} role="menuitem" disabled><FileMusic size={14} />Extract audio</button>
            </div>
          )}
        </span>
      </span>
    </motion.div>
  )
}
