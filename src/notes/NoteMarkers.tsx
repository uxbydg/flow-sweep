import { useEffect, useState } from 'react'
import { NOTES } from './notes'
import type { SweepMode } from './notes'
import s from './NoteMarkers.module.scss'

interface Box {
  id: number
  top: number
  left: number
  width: number
  height: number
  /** How many earlier markers already sit at this exact spot. */
  repeat: number
}

/**
 * Numbered markers over the prototype.
 *
 * ⚑ Positions are MEASURED from the live DOM rather than hardcoded, because the
 * regions move: the list scrolls, the sweep card unfolds and pushes everything
 * below it down, rows lift out when a sweep runs, and the holding cell replaces
 * the list entirely. A marker that does not track its region would point at the
 * wrong thing the moment anyone used the prototype, which is the one thing this
 * layer cannot afford to do.
 */
export function NoteMarkers({
  frame,
  mode,
  activeId,
  onOpen,
}: {
  frame: HTMLElement | null
  mode: SweepMode
  activeId: number | null
  onOpen: (id: number) => void
}) {
  const [boxes, setBoxes] = useState<Box[]>([])
  /** The frame's own width, so a marker knows whether it has room to sit
      outside its region or has to tuck back inside. */
  const [frameW, setFrameW] = useState(0)
  const [frameH, setFrameH] = useState(0)

  useEffect(() => {
    if (!frame) return

    const measure = () => {
      const base = frame.getBoundingClientRect()
      setFrameW(base.width)
      setFrameH(base.height)
      const next: Box[] = []
      for (const note of NOTES) {
        if (note.mode !== mode) continue
        const el = frame.querySelector<HTMLElement>(`[data-note="${note.target}"]`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        // Skip a region scrolled out of the frame: a marker floating over
        // unrelated content is worse than no marker.
        if (r.bottom < base.top + 4 || r.top > base.bottom - 4) continue
        next.push({
          id: note.id,
          top: Math.max(r.top - base.top, 2),
          left: r.left - base.left,
          width: r.width,
          height: Math.min(r.height, base.bottom - r.top),
          /* ⚑ Two notes can share a region, and after notes 8 and 9 were added
             two pairs did. Stacked at the same coordinates, the second disc
             hides the first completely, so a reviewer clicking through the
             markers would never reach half the argument. Each repeat steps
             down by one disc, which reads as a small stack rather than a bug. */
          repeat: next.filter((b) => b.top === Math.max(r.top - base.top, 2) &&
                                     b.left === r.left - base.left).length,
        })
      }
      setBoxes(next)
    }

    /**
     * ⚑ Observers, not a timer.
     *
     * An earlier version re-measured every 400ms. It worked, but polling a
     * layout four times a second to catch changes the browser can report
     * directly is the kind of thing that is invisible until somebody opens the
     * source, and then it is the only thing they remember.
     *
     * Three signals cover every case: scroll, resize, and mutations, which is
     * what fires when the card unfolds or a sweep lifts rows out of the list.
     * The mutation pass is queued on an animation frame so a burst of React
     * updates costs one measure rather than twenty.
     */
    let queued = false
    const schedule = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        measure()
      })
    }

    measure()
    const ro = new ResizeObserver(schedule)
    ro.observe(frame)
    const mo = new MutationObserver(schedule)
    mo.observe(frame, { childList: true, subtree: true, attributes: true })
    /* ⚑ Capture phase, on window. The Athletic had one named scroll container
       and this app does not: the list, the panel and the document can all move.
       Capturing catches a scroll on any of them without naming any of them. */
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [frame, mode, activeId])

  /**
   * ⚑⚑⚑ THE CORRELATION, AND IT WAS BROKEN UNTIL DANIEL LOOKED AT IT.
   *
   * Every marker used to render identically: same teal disc, same size, with
   * the active one differing by a faint outline ring nobody could see. So note
   * 7 could be open in the drawer while marker 1 sat lit on screen, and a
   * reader had no way to tell which region the panel was talking about. The
   * whole point of the layer is that correlation, and it was the one thing it
   * did not deliver.
   *
   * Three rules now, and they are absolute:
   *   1. EXACTLY ONE region is framed at a time, the open note's.
   *   2. The active marker is a filled disc carrying the note's number, and the
   *      drawer header carries the SAME disc with the SAME number. One object,
   *      shown twice, which is what makes the link readable without a caption.
   *   3. A note with no region, the closing note, frames nothing and lights
   *      nothing, rather than leaving a stale marker lit somewhere.
   */
  const activeHasRegion = boxes.some((b) => b.id === activeId)

  return (
    <div className={s.layer}>
      {boxes.map((b) => {
        const on = activeId === b.id
        /* ⚑ The disc sits just OUTSIDE the region's top-right so it never
           covers a control, and tucks back inside only when there is no room
           for it, which is what happens to a region that runs to the edge. */
        const outside = b.left + b.width + 30 < frameW
        return (
          <div key={b.id}>
            {on && (() => {
              /* ⚑⚑ The frame is drawn 4px outside its region, and CLAMPED to the
                 prototype's own bounds. Without the clamp a region that runs to
                 the bottom of the viewport pushes the frame past the device
                 edge, so the highlight bleeds over the chrome and stops being
                 an accurate description of anything. Measured at 4px of spill
                 before this, which is small and is exactly the kind of small
                 that reads as sloppy on a paused frame of video. */
              const top = Math.max(b.top - 4, 2)
              const bottom = Math.min(b.top + b.height + 4, frameH - 2)
              const left = Math.max(b.left - 4, 2)
              const right = Math.min(b.left + b.width + 4, frameW - 2)
              return (
                <div
                  className={s.outline}
                  style={{ top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) }}
                />
              )
            })()}
            <button
              className={`${s.marker} ${on ? s.markerOn : ''}`}
              style={{
                top: b.top - 11 + (on ? 0 : b.repeat * 24),
                left: outside ? b.left + b.width + 6 : b.left + b.width - 26,
              }}
              onClick={() => onOpen(b.id)}
              aria-label={`Design note ${b.id}`}
              aria-current={on ? 'true' : undefined}
            >
              {b.id}
            </button>
          </div>
        )
      })}
      {/* ⚑ Nothing is framed for a note that describes no region. Silence is
          correct here; a lit marker pointing at an unrelated region is not. */}
      {activeId !== null && !activeHasRegion && null}
    </div>
  )
}
