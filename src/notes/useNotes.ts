import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note } from './types'

/**
 * Notes state, including the URL bit.
 *
 * ⚑ `?notes=1` opens straight into the layer with the first note selected, so a
 * link in the video or the outreach note lands on the argument rather than on
 * the prototype with the argument hidden behind a control.
 *
 * ⚑⚑ PORTED CHANGE: the notes array and the mode type are arguments now rather
 * than a module import and a hardcoded union. The Athletic version reached into
 * `./notes` directly, which is fine for one app and wrong for a module meant to
 * travel. Everything else here is unchanged, including the two behaviours that
 * were learned the hard way and are the reason this is worth porting at all:
 * opening a note switches to the state its region lives in, and it scrolls that
 * region into view.
 */
export function useNotes<M extends string>(
  notes: Note<M>[],
  onModeChange: (mode: M) => void,
) {
  /**
   * ⚑⚑⚑ THE URL CONTRACT, rewritten 2026-09-23 on Daniel's call:
   * "Do we want it to open on the design notes? I feel like we should want
   * them to use it first, then worry about the design notes."
   *
   * He is right, and it overturns the original reasoning. `?notes=1` used to
   * slam the drawer open on note 1 so a link "lands on the argument rather
   * than on the prototype". That made sense when the toggle was a grey pill
   * nobody could find. Now the handle is a filled tab on the edge of the
   * window, so the argument is one obvious click away and there is no reason
   * to take the prototype away from somebody before they have touched it.
   *
   * The person this is sent to asked to see it. Let them drive.
   *
   *   (no param)  the prototype, clean, with the tab inviting
   *   ?notes      the marker layer on, drawer CLOSED, so the regions announce
   *               themselves and the reader picks one
   *   ?note=4     opens note 4 directly, for a deep link or a video cut
   */
  const params = new URLSearchParams(location.search)
  const deepLink = Number(params.get('note'))
  const [on, setOn] = useState(() => params.has('notes') || deepLink > 0)
  const [activeId, setActiveId] = useState<number | null>(null)
  /** A deep link fires once; reopening it after a close would trap the reader. */
  const opened = useRef(false)

  // Opening a note switches to the state that note belongs to, so paging through
  // the drawer walks the whole argument without the reader hunting for it.
  const open = useCallback(
    (id: number) => {
      const note = notes.find((n) => n.id === id)
      if (!note) return
      onModeChange(note.mode)
      setActiveId(id)

      /**
       * ⚑ Bring the note's region into view.
       *
       * Without this the drawer happily discusses a region that is scrolled off
       * screen: the marker, the outline, and the thing being argued about are
       * all somewhere else, and the panel talks about nothing the reader can
       * see. It would have shown up on camera.
       *
       */
      /**
       * ⚑⚑ Instant, and attempted synchronously.
       *
       * Smooth scrolling runs on animation frames, which a browser freezes in a
       * hidden or backgrounded tab: the scroll silently never happens and the
       * drawer names a region with nothing highlighted beside it. Instant also
       * reads better, because a reader clicking a note wants the region to BE
       * there rather than to watch the app travel to it.
       *
       * The retry covers the one legitimate miss: a note that changes state
       * renders its region on the next commit, so the first attempt finds
       * nothing.
       */
      if (!note.target) return
      const bring = () => {
        const el = document.querySelector<HTMLElement>(`[data-note="${note.target}"]`)
        if (!el) return false
        el.scrollIntoView({ block: 'center' })
        return true
      }
      if (!bring()) window.setTimeout(bring, 60)
    },
    [notes, onModeChange],
  )

  /**
   * ⚑⚑⚑ CLOSE MEANS CLOSE. It turns the whole layer off, not just the panel.
   *
   * It used to only clear the active note, which did nothing a reader could
   * see: the effect below immediately noticed "layer on, nothing open" and
   * reopened note 1. So the ✕ closed and reinstated the drawer in the same
   * frame, and Daniel found it straight away: "the X on the notes should
   * absolutely close the design notes. It does not currently do that."
   *
   * ⚑ There is no state worth preserving between "no note open" and "notes
   * off", which is why the intermediate state was only ever a bug. Escape does
   * the same thing, because a reader pressing Escape means the same thing as a
   * reader clicking the ✕.
   */
  /**
   * ⚑⚑⚑ THE HANDLE OPENS THE DRAWER. Daniel: "when you click on Design Notes,
   * the drawer does not open."
   *
   * Removing the auto-open last pass went one step too far and took the click
   * with it. The two cases are not the same act and should not behave the same:
   *
   *   A LINK arriving is not a request to read the notes. The person opened a
   *   prototype; markers appear, the drawer stays shut, they drive.
   *
   *   A CLICK on a tab labelled "Design notes" is an explicit request to read
   *   the design notes. Showing markers and making them hunt for a second click
   *   is answering a question with a riddle.
   */
  const toggle = useCallback(() => {
    if (on) {
      setOn(false)
      setActiveId(null)
      return
    }
    setOn(true)
    open(notes[0].id)
  }, [on, open])

  const close = useCallback(() => {
    setOn(false)
    setActiveId(null)
  }, [])

  const step = useCallback(
    (delta: number) => {
      if (activeId === null) return
      const i = notes.findIndex((n) => n.id === activeId)
      const next = notes[i + delta]
      if (next) open(next.id)
    },
    [notes, activeId, open],
  )

  useEffect(() => {
    /* ⚑ Deliberately NOT opening a note here. Turning the layer on reveals the
       markers and stops: the reader chooses which decision to read, or ignores
       them and keeps using the prototype. Only an explicit ?note=N opens one,
       and only once. */
    if (on && deepLink > 0 && activeId === null && !opened.current) {
      opened.current = true
      open(deepLink)
    }
    if (!on) setActiveId(null)
  }, [on, activeId, open, deepLink, notes])

  // Escape closes the note; the toggle still owns whether the layer is on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (!on) return
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [on, close, step])

  return { on, setOn, toggle, activeId, open, close, step }
}
