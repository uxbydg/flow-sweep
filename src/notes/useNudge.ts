import { useEffect, useState } from 'react'

/**
 * ⚑⚑ THE NUDGE, and the whole design is in when it STOPS.
 *
 * Daniel, 2026-09-23: "Is there any kind of nudging animation that could make
 * the tab of the design notes move or boop-boop, like 'Hey, I'm here'?"
 *
 * The idea is right and the danger is obvious: an attention animation that
 * repeats forever is a nag, and a nag is worse than the quiet tab it replaced,
 * because a reader learns to filter it and then never sees it again. So this
 * one is deliberately finite and deliberately late:
 *
 *   - It is finite: three firings, then silence. The exact cadence and the
 *     reasoning behind each interval are on FIRE_AT below.
 *   - It stops the moment the notes are opened, and does not come back in that
 *     session. A nudge toward something you have already found is noise.
 *   - It never runs under prefers-reduced-motion. An attention-getter is
 *     exactly the kind of motion that setting exists to refuse, and it is the
 *     one place where honouring it costs nothing at all.
 */

/**
 * ⚑⚑ THE CADENCE, revised 2026-09-23. Daniel: "Can we have the animation do the
 * boo-boo as soon as it loads? What is a decent amount of time to do it one or
 * two more times, not annoying, but just to remind them to look at it?"
 *
 * Three firings, front-loaded, then silence:
 *
 *   0.8s   Immediately, but AFTER the page has painted. Firing during the load
 *          wastes it: nobody has looked at the screen yet, and an animation
 *          nobody sees is the same as no animation.
 *   14s    The first real reminder. Long enough that they have looked around
 *          the prototype, short enough that they have not decided it is all
 *          there is.
 *   38s    The last one. By here they have either engaged with the prototype
 *          or they have not, and a fourth attempt stops being a reminder and
 *          starts being a demand.
 *
 * ⚑ The intervals widen (13s, then 24s) rather than repeating on a beat. A
 * regular pulse reads as a machine looping; a decaying one reads as somebody
 * asking twice and then letting it go.
 */
const FIRE_AT = [800, 14000, 38000]
const BOOP_MS = 1800

export function useNudge(enabled: boolean) {
  const [nudging, setNudging] = useState(false)
  /** Once the notes have been opened, this session is done nudging. */
  const [spent, setSpent] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setSpent(true)
      setNudging(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || spent) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const timers: number[] = []
    const boop = () => {
      setNudging(true)
      timers.push(window.setTimeout(() => setNudging(false), BOOP_MS))
    }
    for (const at of FIRE_AT) timers.push(window.setTimeout(boop, at))
    return () => timers.forEach(window.clearTimeout)
  }, [enabled, spent])

  return nudging
}
