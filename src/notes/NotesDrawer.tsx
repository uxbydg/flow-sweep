import { NOTES } from './notes'
import type { Problem } from './types'
import s from './NotesDrawer.module.scss'

/**
 * ⚑ Labels are Title Case, never all caps. Daniel's standing rule, and an
 * earlier pass defaulted straight past it.
 */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <h3 className={s.label}>{label}</h3>
      {children}
    </section>
  )
}

/**
 * ⚑⚑ The quote is drawn as an APP STORE REVIEW, not as a generic tinted aside.
 * The earlier version had no quotation marks, no stars, and no visible rating,
 * so nothing on screen said where the words came from or how angry the person
 * was. A reader had to take it on trust. Now the rating leads, the date sits
 * beside it, and the words are in quotation marks.
 */
/**
 * ⚑⚑ PORTED CHANGE, AND IT IS THE HONEST ONE.
 *
 * The Athletic version drew stars and an App Store date, because every note
 * there carried a real review. Sweep has none: 254 Wispr Flow reviews were read
 * on 21 September and not one is about History or deletion, the Mac app has no
 * store reviews, and Reddit is closed to scripts.
 *
 * So a sourced problem renders in the same frame with the source where the
 * stars would be, saying plainly what it rests on instead of a customer quote.
 * The alternative was inventing a rating, and a prototype whose whole claim is
 * traceability cannot have a field that rewards that.
 */
function ProblemBlock({ problem }: { problem: Problem }) {
  return (
    <figure className={s.review}>
      <div className={s.reviewHead}>
        {problem.kind === 'review' ? (
          <>
            <span className={s.stars} aria-label={`${problem.stars} out of 5 stars`}>
              {'★'.repeat(problem.stars)}
              <span className={s.starsOff}>{'★'.repeat(5 - problem.stars)}</span>
            </span>
            <span className={s.reviewMeta}>
              {problem.stars} of 5 &middot; App Store &middot; {problem.date}
            </span>
          </>
        ) : (
          <span className={s.sourceTag}>{problem.source}</span>
        )}
      </div>
      <blockquote className={s.reviewText}>
        <span className={s.mark}>&ldquo;</span>
        {problem.text}
        <span className={s.mark}>&rdquo;</span>
      </blockquote>
      {problem.note && <figcaption className={s.reviewNote}>{problem.note}</figcaption>}
    </figure>
  )
}

export function NotesDrawer({
  activeId,
  onStep,
  onClose,
}: {
  activeId: number
  onStep: (delta: number) => void
  onClose: () => void
}) {
  const i = NOTES.findIndex((n) => n.id === activeId)
  const note = NOTES[i]
  if (!note) return null

  return (
    <aside className={s.drawer} aria-label="Design notes">
      <div className={s.head}>
        {/* ⚑⚑⚑ THE OTHER HALF OF THE CORRELATION.
            The same filled teal disc carrying the same number sits on the
            region being discussed. One object shown twice is what links the
            panel to the prototype without a caption explaining that it does.
            ⚑ The closing note has no region, so it gets no disc: there would
            be nothing on screen for it to match. */}
        {note.target ? (
          <span className={s.marker} aria-hidden>
            {note.id}
          </span>
        ) : null}
        <span className={s.count}>
          Note {i + 1} of {NOTES.length}
        </span>
        <span className={s.nav}>
          <button className={s.navBtn} onClick={() => onStep(-1)} disabled={i === 0} aria-label="Previous note">
            ‹
          </button>
          <button
            className={s.navBtn}
            onClick={() => onStep(1)}
            disabled={i === NOTES.length - 1}
            aria-label="Next note"
          >
            ›
          </button>
          <button className={s.navBtn} onClick={onClose} aria-label="Close note">
            ✕
          </button>
        </span>
      </div>

      {/* ⚑⚑ THE CLOSING NOTE IS DRAWN DIFFERENTLY ON PURPOSE. The other notes
          are panels split by rules, because they argue about the product. This
          one is a letter: one continuous surface, serif throughout, a wider
          measure, signed. The change in form is the signal that the subject
          changed. */}
      {note.closing ? (
        <div className={s.closing}>
          {/* ⚑⚑ THE TITLE WAS NEVER RENDERED HERE. The closing branch went
              straight to the lede, so the standfirst was doing a heading's job
              and doing it badly: Daniel read it as the header and said "that's
              a really long header... is there a way we can get a little bit
              more to the point?"

              It is a long header because it was never a header. Now the note
              has its own title, short and pointed, and the lede goes back to
              being what a standfirst is: the map of the page under it. */}
          <h2 className={s.closingTitle}>{note.title}</h2>
          <p className={s.closingLede}>{note.closing.lede}</p>

          {/* ⚑⚑⚑ REBUILT 2026-09-23. Daniel: "the last page of the drawer is
              essentially 'here's the work that I did, and here's how it applies
              to the job'... there needs to be much more of a hierarchy
              understanding when it comes to that part."

              He is right, and this was the worst offender in the whole drawer.
              Six pairs of definition list at 14px and 13.5px, in two greys four
              steps apart, separated by hairlines. Nothing on screen said which
              half was THEIR words and which half was the work, so it read as
              twelve paragraphs of the same thing.

              The fix is not smaller type or more rules, it is making the two
              halves different KINDS of thing:
                asks   their words, so they are set as a quotation, in the
                       serif, muted, with the marks visible
                shows  the work, so it is the sans, brighter, and it carries
                       the weight
              And each pair is numbered, because six of anything needs a way to
              be counted. */}
          <h3 className={s.label}>What the Posting Asks For</h3>
          <ol className={s.mapped}>
            {note.closing.mapped.map((m, i) => (
              <li key={m.asks} className={s.mappedRow}>
                <span className={s.mappedNum} aria-hidden>
                  {i + 1}
                </span>
                <div className={s.mappedBody}>
                  <p className={s.asks}>
                    <span className={s.mark}>&ldquo;</span>
                    {m.asks}
                    <span className={s.mark}>&rdquo;</span>
                  </p>
                  <p className={s.shows}>{m.shows}</p>
                </div>
              </li>
            ))}
          </ol>

          <h3 className={s.label}>What This Does Not Show</h3>
          <ul className={s.limits}>
            {note.closing.notShown.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {/* ⚑ The artwork statement sits last and quietest, set apart from
              the argument above it. It is not a claim being made, it is the
              basis the work stands on, and a reader should be able to find it
              without it interrupting anything. */}
          <h3 className={s.labelQuiet}>On the Artwork</h3>
          <div className={s.provenance}>
            {note.closing.provenance.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          {/* ⚑ The signature is the logo plus the name, not the name alone.
              The mark carries over to the portfolio, so a reader who sees it
              here recognises it when they land there. */}
          <div className={s.signBlock}>
            {/* ⚑ Flow's desktop app is light only, so the light mark is the
                right one here. The Athletic build uses the dark variant for
                exactly the same reason, in the other direction. */}
            <img src="/brand/dg-logo.svg" alt="" aria-hidden className={s.signMark}
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <p className={s.sign}>{note.closing.sign}</p>
          </div>
          <p className={s.closingFooter}>
            Designed and built by Daniel Glaze. See the rest of the work at{' '}
            <a href="https://danielglaze.com">danielglaze.com</a>.
          </p>
        </div>
      ) : (
        <>
      <div className={s.titleBlock}>
        <h2 className={s.title}>{note.title}</h2>
      </div>

      <Section label="The Problem">
        <ProblemBlock problem={note.problem!} />
      </Section>

      {/* ⚑ The emphasis treatment moved here from the quote. The decision is
          what a reviewer came for; it should be the thing the eye lands on. */}
      <Section label="The Decision">
        <p className={s.decision}>{note.decision}</p>
      </Section>

      <Section label="The Business Case">
        <p className={s.body}>{note.impact}</p>
      </Section>

      <Section label="Who Did What">
        {/* ⚑ Flow's own chip shape, reused. In the product it carries a reason
            and a confidence; here it carries which hand a decision came from.
            Borrowing the host's component for the notes layer is what keeps the
            drawer reading as part of the same piece of software. */}
        <p className={s.whose}>
          <span className={s.pill}>Mine</span>
          {note.mine}
        </p>
        <p className={s.whose}>
          <span className={s.pill}>Claude Code</span>
          {note.claude}
        </p>
      </Section>

      {/* ⚑ Renamed. "What the posting asks for" read as a riddle. This says
          plainly where the words come from and lets the sentence beneath do
          the connecting. */}
      <p className={s.evidence}>
        <strong>Evidence.</strong> {note.evidence?.label}
      </p>

      <p className={s.footer}>
        Designed and built by Daniel Glaze. See the rest of the work at{' '}
        <a href="https://danielglaze.com">danielglaze.com</a>.
      </p>
        </>
      )}
    </aside>
  )
}
