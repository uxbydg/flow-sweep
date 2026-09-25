# Transcript Sweep — spec

> **Read the dated sections at the bottom first.** They supersede the top: the four-state flow with a
> Summary sheet became one card the broom unfolds above the list (14 September), and the numbers were
> re-run against the code on 15 September. Current counts on the real 874: 97 empty, 40 cut off (12 sure,
> 28 asked about), 1 marked for removal, 43 short replies, 3 to retry; 122 preselected, 138 candidates,
> about 1 in 6.

A concept for Wispr Flow's history view: find the entries that are almost certainly accidents,
show them in one place with the reason and the confidence, sweep them in one motion, and keep
them somewhere you can get them back from. Built against one real user's 874 entries.

## The four sections, from the data

| Section | Rule | Real history (874) | Selected by default |
|---|---|---|---|
| **Empty** | no text after trim, or Flow's own status is `dismissed` / `no_audio` / `empty` | 100 | yes |
| **Cut off** | under 20 characters and the thought did not finish: punctuation only, stops on a comma, on a dangling word ("the", "to", "is"), or mid-word ("pa", "re-b") | 40 (24 selected, 16 shown as borderline) | when confidence ≥ 0.60 |
| **Flagged by you** | the entry names its own fate ("never mind", "scratch that", "oops"...) at its start, or anywhere in an entry under 40 chars | 1 | yes |
| **Short replies** | under 20 characters and finished: ends in . ! or ? and not on a dangling word | 43 | **never**; listed last, collapsed |

Dropped: near-duplicate retries (1 case in 874). Not built: "not words" (none found).

## Completeness decides, not the app (revised 14 September)

The first version weighted confidence by target app and treated Terminal as the most accident-prone.
Daniel's real Short list proved it inverted: "Do it." ×9 and "Run it." ×5 into the terminal are the
most deliberate entries in the history (Flow's own Insights names his catchphrase as "Can we run
the agent?"), while "Watch the", "Don't d" and "The About Me pa" are the hotkey released mid-sentence.
**Whether the thought finished separates them; length and app do not.** The app survives as one small
adjustment: cut-off confidence × 0.9 in Messages, where people text in fragments.

Confidence: Empty 0.98 (0.90 if over 30 s recorded). Punctuation only 0.97. Mid-word 0.90–0.92,
dangling word 0.90, trailing comma 0.85, single fragment ≤3 chars 0.85. No ending but nothing visibly
broken ("Excel", "Run it", "right now") 0.50: shown, not selected. Flagged 0.70. Short reply 0.20.
Result: **138 candidates, 122 selected, about 1 in 6** (was 145 selected, 1 in 5, before the revision).
⚑ Verified against the running app on 25 September: the card says "Flow will sweep 122 transcripts",
the broom says 138 to review, and the strip reads Empty 97, Cut off 12, Marked for removal 1. An
earlier draft of this line said 141 and 125, which were the counts before the 15 September re-run.

## The four states

1. **History.** Flow-style list: app, time, first line, duration. Search. A **Sweep** affordance
   (broom) beside search. Nothing else changes.
2. **Summary.** One sentence in counts before anything happens: "You have 100 empty transcripts,
   40 that cut off mid-thought, and 1 you flagged yourself. That's about 1 in every 6." Two
   actions: Review, Not now.
3. **Review.** Candidates grouped by reason. Each row: reason chip, confidence, app, time, the text.
   Everything above threshold is selected. One tap to keep. Nothing leaves on detection.
   Primary action names the count: "Sweep 122".
4. **Swept.** A place, not a toast. The swept rows live here with a Restore per row and Restore all.
   Nothing is permanently deleted in this concept. (Flow's docs: "deleted transcripts cannot be
   recovered." This is the answer to that.)

## Motion carries the meaning (as built, 15 September)

- The card unfolds above the list on a height transition (330 ms, one easing) so the rows slide with
  it instead of jumping; the fold closes first on Sweep, then the swept rows lift out (y −6, opacity 0,
  220 ms, staggered 18 ms, capped at 12 rows) while the kept rows reflow.
- Restore lifts a row out of the holding cell sideways (x +12); it is not yet the exact mirror of sweep.
- Reduced motion: Motion honours the OS setting (MotionConfig reducedMotion="user") and the CSS
  transitions are cancelled by the global rule.
- While the tab is hidden the list skips its animations, because browsers pause the animation clock
  there and an exit that never finishes would leave a row behind.

## Keyboard and size

One tab stop per History row (15 September). Up and Down walk the rows, Enter or Space opens the
row menu with focus on its first live item, Up and Down move through the items, Escape hands focus
back to the row. A swept row hands focus to its neighbour before it leaves. The three-dot stays for
the mouse. On the card: Tab, Space, Enter, Escape. Works at 390 px wide: the tab strip and the ask
row wrap, the restore line sits above the buttons, the cell's date column widens and Restore is
always shown, the three ghost icons go and the three-dot stays. Focus is visible everywhere.

## Data

Local dev reads `src/data/history.private.json` (gitignored, the real export, no audio). The public
build reads `src/data/history.sample.json`: entries generated to match the real distribution of
length, app, and category, no real text. Counts in this spec are from the real data.

## What the write-up says that the UI cannot

Empty entries average 5.6 s of recording (max 152 s). They are not brief hotkey taps; they are
recordings that returned no text. The taps are the under-20 set (2.6 s recorded, 1.6 s of speech).
Two failures, two upstream causes. The sweep treats the symptom; the store does not say why the
text did not come back.

## Cut list, in order
1. Threshold control → fixed at 0.60. 2. Motion → CSS transitions. 3. Flag phrases → static list.
Never cut: review before sweep, the Swept place with restore, real data locally.

## Decided 14 September (Daniel)

**Swept is a 7-day holding cell, not a delete.**
- Swept rows leave History at once, stay restorable for 7 days, then leave for good (in the concept:
  a local "gone" list; nothing is deleted from Flow).
- **Empty now** in the holding cell, for anyone who wants them gone today, behind Flow's own confirm.
- **Blank rows fold into one line per day (15 September).** "N empty transcripts. Show them" with its
  own Restore N; Show them unfolds that day's blanks under the line. Nobody reads "No text" a hundred
  times to decide what to get back, so the rows with words are what the cell shows. The grouping by
  leave day stays: that is what makes the 7-day promise legible.
- **Should respect Flow's auto-delete setting** (not built: the concept cannot read Flow's settings).
  If transcripts auto-delete sooner, swept rows would go on that schedule.
- **Section-level select** on every Review header (take or leave a whole section). Short replies still
  start unselected.

**A "leaving today" reminder on the home screen** (Daniel's idea; he marked the spot on a
screenshot, file not kept): right column, directly under the stats / Voice Profile card.
- Shows ONLY on a day when swept rows reach day 7. Never otherwise; a permanent card is noise.
- Names the sections and counts: "12 swept transcripts leave for good tonight: 8 Empty, 3 Cut off,
  1 you said to drop." Grouped by the day they were swept if more than one batch expires.
- Two actions: **Review** (opens the holding cell) and **Keep them** (restores all of today's batch).
  Dismissable for the day.
- Styling: Flow's own card (same surface, radius and type as the stats card). **Not a red box.** Flow
  spends its coral only on destructive actions ("Delete transcript", "Yes, delete it"); a red card on
  the home screen every week would read as an error. The coral goes on the one thing that is
  destructive: the "tonight" deadline text or a small dot.

**Also from the Flow captures:** rename "Flagged by you" (Flow already has a Flag action); long empty
recordings (>30 s) get a **Retry first** section using Flow's existing "Retry transcript".

**Where the holding cell lives (decided 14 September):** inside History, not the sidebar.
- Entry points: a **"Swept · N"** control in the sticky History header beside search and the broom (only
  when N > 0), and the reminder card's **Review**.
- It replaces the History list in place, like a filter. Day groups by the day rows LEAVE, not the day
  they were dictated: "LEAVES FOR GOOD TONIGHT", "LEAVES SEPTEMBER 20". Same header + white card as History.
- Rows match History; hover shows **Restore** instead of copy / flag.
- Top: back to History, **Restore all**, **Empty now** (coral, the only destructive control).
- Empty state: one line, "Nothing swept. Anything you sweep stays here for 7 days."
- Why not the sidebar: the sidebar lists features, the holding cell is a temporary state of History,
  and restoring feels safe when the rows sit beside where they came from.

## From the Scratchpad captures (14 September, evening)

- **The bar is bare glyphs.** Flow's Recents row is search, plus, and refresh as 16 px gray icons,
  tightly spaced, no field and no box; the search field only appears on demand. Ours now matches:
  search collapses to its icon, the broom sits beside it as the same bare glyph.
- **The focus ring is amber** (#DA9A35, 2 px, small radius), not teal. Adopted site-wide.
- **Scratchpad opens a second floating window.** Considered for Review and not adopted: the sweep
  is a review before a destructive action, and Flow's own idiom for that is the modal confirm
  ("Are you sure you want to delete this transcript?"). Scratchpad is a workspace you keep open
  beside other apps; Review is a decision you finish and close. If Review ever grows past one
  sitting (a threshold slider, per-row audio), the floating panel is the Flow-native answer.

**Row menu (14 September, evening, Daniel's ask):** the three-dot ("More options") opens Flow's own
menu with one line added, **Sweep transcript**, placed above Delete transcript: the reversible option
before the irreversible one. It is the manual path for a row the classifier missed, and it goes to the
same holding cell. Only that line is live in the concept; Undo AI edit, Retry, Delete, Extract audio are
drawn, not wired. Tooltips and the menu hang past the card edge, so nothing in the list clips.

**Review is not a modal (decided 14 September, late, Daniel):** Flow's tab strip is how every page
segments a list (Insights, Dictionary, Snippets, Style), and Flow's only modal is the delete confirm.
So Sweep is a view inside History, like the holding cell: the summary sentence, then the tab strip
(Empty · Cut off · Marked for removal · Retry first · Short replies, each with its count), one section
visible at a time, select-all for the section, and a sticky footer with the only two actions:
**Not now** and **Sweep N**. The two-step Summary → Review is gone. The modal survives only for
Empty now.

## The sweep is a card the broom unfolds (decided 14 September, late, after the debate)

Daniel's question: does sweep deserve real estate? Debated card vs icon. Verdict: **the icon** beside
search is the resting state (Flow puts list operations there: search, sort, refresh, plus), with the
dot as the only standing signal. Flow's banners teach features; none does maintenance, and a permanent
chore card above the person's own words is noise. The card is what the broom OPENS: it unfolds in
place above the day list, and folds away on Sweep or Not now. No pane, no modal.

Two tiers, readable in 30 seconds:
1. **What Flow decided.** "Flow will sweep 106 transcripts that are certainly accidents." Empty,
   cut off at ≥ 0.90 (punctuation only, mid-word), and the ones the person flagged. Counted, not
   listed; a "Show" for the sceptic.
2. **The one question.** "Are these accidents too?" The cut-offs under 0.90 as toggle chips, least
   sure first. They are all under 20 characters, so chips scan where rows do not. Filled teal = goes,
   outline = stays; the classifier's default fills the ones at 0.60 and above.
Then one line for Retry (long empties) and one for short replies, and two buttons: Not now, Sweep N.
The rows lift out of the list beneath the card. The tab-strip view and the modal are both gone.

**Retry, as Flow does it (14 September, late, from Daniel's captures):** "Retry your 0:05 transcription" (Flow desktop, the link is Retry and the length is the recording's) → the row's text becomes a pulsing grey bar → on failure a dark toast bottom
right, red alert mark, "Retry failed. Please try again." The concept holds no audio, so a retry cannot
transcribe anything: one recovery (the longest blank recording) is staged with invented words so the
success state can be seen, and says so on the row; the rest fail the way Flow's did that night. Live from the card
line, from a row's Retry, and from the row menu's Retry transcript. The card's mark is the broom, not a
check. A dismissed transcription reads "This transcription was dismissed. Recover" (Flow's desktop copy).

---

## The design notes layer (ported 23 September 2026)

Built first on `~/athletic-feed` because that was the live build, then brought here, per
`~/job-search/spearfish/design-notes-spec.md`. Seven notes: six on regions, one closing.

**The pattern, unchanged from the ruling of 22 September.** Numbered markers sit on the regions
they belong to and are the only thing visible at rest. Clicking one opens a right-edge drawer
carrying that note in the quote-first layout. The drawer pages in marker order, and `?notes=1`
opens straight into it with note 1 selected.

### ⚑⚑ What had to change to make it portable, and it was only two things
1. **`mode` is a type parameter now**, not the literal `'today' | 'proposed'`. Sweep's states are a
   view plus a card that may or may not be unfolded, so `applyNoteMode` in `App.tsx` translates a
   note's mode into both. Opening a note about the ask row unfolds the card; opening note 6 walks
   over to the holding cell. ⚑ That behaviour is the reason this layer is worth porting at all:
   the drawer never discusses a region the reader cannot currently see.
2. **A problem no longer has to be a review.** The Athletic version drew stars and an App Store
   date because every note there had one. **This file has none.** 254 Wispr Flow reviews were read
   on 21 September and not one is about History or deletion, the Mac app has no store reviews, and
   Reddit is closed to scripts. So a problem is now a review OR a sourced observation, and the
   second kind must name its source, which the drawer prints where the stars would be. The
   alternative was inventing a rating, and a prototype whose whole claim is traceability cannot
   have a field that rewards that.

### ⛑⛑⛑ CORRECTED 23 September, same day: the first re-theme was only a recolour
Daniel, looking at the ported drawer: *"The design notes drawer for Sweep keeps a 'The Athletic'
design holdover: the gutters. That's not in the Wispr Flow design language."*

He was right. Every colour had been mapped and the **structure had not**. `border-top: 8px solid`
is The Athletic's grammar whatever colour it is painted, and the drawer ground was still set to the
separator colour, which is the trick that makes gutters show between panels. The result was banded
cream on cream: correct palette, wrong product.

Fixed: one continuous sheet of `--page` with a 1px left border, sections separated by a hairline and
26px of air, section labels moved from The Athletic's 19px bold serif to Flow's own 11px / 500 /
.08em in `--label`, and the note title moved to Flow's banner heading (400 22px serif). The stale
comments went with it: four of them still described The Athletic's feed by name.

⚑⚑ **The general rule and the six-axis audit that came out of this now live in
`~/job-search/spearfish/design-notes-port.md`.** Read it before the next port. One line summary:
*a component carries its old design language in its structure, not just its colours.*

### ⚑ What the re-theme was, since it is most of the work
The Athletic's app is dark and separates blocks with pure black gutters; Flow's desktop app is
light only. Carried over unchanged, the drawer would have been a black slab bolted to a cream app,
reading as a tool inspecting the product rather than as part of it. Structure is identical, every
colour is Flow's, and the mapping is written at the top of `NotesDrawer.module.scss`. Markers are
teal, which is what the sweep card already uses for selection, so a marked region reads as selected
rather than flagged. **Coral never appears**: Flow spends it only on destructive actions.

⚑ And the window gives up width rather than sliding. A transform on an ancestor makes
`position: fixed` resolve against it instead of the viewport, which is the bug that pushed the
Athletic's drawer off screen, and a desktop window sliding sideways breaks the illusion the whole
prototype rests on. Below 1200px the drawer overlays instead, because a squeezed reproduction
misrepresents the product where a partly covered one only hides it.

### It is a copy, not a package
Two repos, no shared workspace, and the Athletic build is frozen for recording. If a third
prototype needs this, extract it then. The Athletic's copy keeps the concrete types; it is a
finished artifact, not a library consumer.

### Anchors
`broom` and `cell` in `App.tsx`; `count`, `strip`, `ask`, and `restore` in `SweepCard.tsx`.
