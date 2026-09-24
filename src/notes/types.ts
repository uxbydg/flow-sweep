/**
 * The design notes layer, ported from `athletic-feed` on 2026-09-23.
 *
 * ⚑⚑ WHAT CHANGED IN THE PORT, AND WHY IT IS A COPY RATHER THAN A PACKAGE.
 *
 * Two repos, no shared workspace, and the Athletic build is frozen for
 * recording. Extracting a package to serve one finished artifact and one live
 * one would be ceremony. If a third prototype needs this, extract it then.
 *
 * Two couplings were genuinely Athletic-specific and are now generic:
 *
 *   1. `mode` was the literal union 'today' | 'proposed'. It is now a type
 *      parameter, because the host app decides what states it has. Sweep has
 *      three that matter and none of them is called "proposed".
 *
 *   2. `problem` assumed an App Store review, with a star rating and a date.
 *      ⚑ Sweep has no such thing: 254 Wispr Flow reviews were read on
 *      21 September and NOT ONE is about History or deletion, the Mac app has
 *      no store reviews at all, and Reddit is closed to scripts. Forcing a
 *      star rating here would have meant inventing one. So a problem is now
 *      either a review or a sourced observation, and the second kind has to
 *      name where it came from. An artifact whose whole claim is traceability
 *      cannot have a field that quietly rewards making things up.
 */

/** A real review, with its rating and date. */
export interface ReviewProblem {
  kind: 'review'
  text: string
  /** 1 to 5, rendered as filled and empty stars. */
  stars: number
  date: string
  /** Optional context, such as how many reviews shared the theme. */
  note?: string
}

/**
 * ⚑ A problem with no customer quote behind it, which must say so.
 *
 * `source` is where it actually comes from: the product's own documentation,
 * the person's own exported data stated as their own, a support page. It is
 * rendered in place of the stars, so a reader can see at a glance which notes
 * rest on somebody else's words and which rest on evidence of another kind.
 */
export interface SourcedProblem {
  kind: 'sourced'
  text: string
  source: string
  note?: string
}

export type Problem = ReviewProblem | SourcedProblem

export interface Note<Mode extends string = string> {
  id: number
  /** The app state this note's region lives in. The host decides what that
      means and applies it through the callback given to useNotes. */
  mode: Mode
  /** data-note value on the region this marker sits against. A closing note
      has no region and takes no marker. */
  target?: string
  title: string
  problem?: Problem
  decision?: string
  /** Whose: both lines, always. Per the claims ledger, a claim with nothing
      behind it does not ship. */
  mine?: string
  claude?: string
  /**
   * ⚑ THE BUSINESS CASE, stated as a mechanism and never as a forecast. Not
   * "this will lift retention by 4%", but what the company actually avoids or
   * gains and by what route: a cost not incurred, a channel not burned, a
   * churn complaint not fed. A number only if it is sourced.
   */
  impact?: string
  /** A closing statement rather than a note on a region. Rendered differently
      on purpose: see NotesDrawer. */
  closing?: {
    lede: string
    mapped: { asks: string; shows: string }[]
    /** ⚑ A LIST, not a paragraph. Rendered as one block of prose these ran to
        seventeen lines and were the last wall of text in the drawer. Each entry
        is one limit, and a reader can count them. */
    notShown: string[]
    /** What was used and on what basis. Not an argument, a statement. */
    provenance: string[]
    sign: string
  }
  evidence?: { label: string; url?: string }
}
