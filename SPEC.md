# Transcript Sweep — spec (one page)

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
Daniel's real Short list proved it inverted: "Do it." ×13 and "Run it." ×7 into Claude Code are the
most deliberate entries in the history (Flow's own Insights names his catchphrase as "Can we run
the agent?"), while "Watch the", "Don't d" and "The About Me pa" are the hotkey released mid-sentence.
**Whether the thought finished separates them; length and app do not.** The app survives as one small
adjustment: cut-off confidence × 0.9 in Messages, where people text in fragments.

Confidence: Empty 0.98 (0.90 if over 30 s recorded). Punctuation only 0.97. Mid-word 0.90–0.92,
dangling word 0.90, trailing comma 0.85, single fragment ≤3 chars 0.85. No ending but nothing visibly
broken ("Excel", "Run it", "right now") 0.50: shown, not selected. Flagged 0.70. Short reply 0.20.
Result: 141 candidates, **125 selected, about 1 in 6** (was 145 selected, 1 in 5, before the revision).

## The four states

1. **History.** Flow-style list: app, time, first line, duration. Search. A **Sweep** affordance
   (broom) beside search. Nothing else changes.
2. **Summary.** One sentence in counts before anything happens: "You have 100 empty transcripts,
   40 that cut off mid-thought, and 1 you flagged yourself. That's about 1 in every 6." Two
   actions: Review, Not now.
3. **Review.** Candidates grouped by reason. Each row: reason chip, confidence, app, time, the text.
   Everything above threshold is selected. One tap to keep. Nothing leaves on detection.
   Primary action names the count: "Sweep 187".
4. **Swept.** A place, not a toast. The swept rows live here with a Restore per row and Restore all.
   Nothing is permanently deleted in this concept. (Flow's docs: "deleted transcripts cannot be
   recovered." This is the answer to that.)

## Motion carries the meaning

- Summary sheet rises; counts settle in sequence, not at once.
- Review: keeping a row settles it (scale 1.0 → 1.0, opacity to full, chip fades); sweeping lifts
  the selected rows out (y −8, opacity 0, 180 ms, staggered 20 ms) while kept rows reflow with a
  layout animation.
- Swept bucket: restore is the reverse, so the two motions are a pair.
- Reduced motion: opacity only.

## Keyboard and size

Tab through rows, Space toggles keep, Enter sweeps from the button, Escape closes the sheet. Works
at 390 px wide. Focus is visible everywhere.

## Data

Local dev reads `src/data/history.private.json` (gitignored, the real export, no audio). The public
build reads `src/data/history.sample.json`: entries generated to match the real distribution of
length, app, and category, no real text. Counts in this spec are from the real data.

## What the write-up says that the UI cannot

Empty entries average 8.5 s of recording (max 152 s). They are not brief hotkey taps; they are
recordings that returned no text. The taps are the under-20 set (2.6 s recorded, 1.6 s of speech).
Two failures, two upstream causes. The sweep treats the symptom; the store does not say why the
text did not come back.

## Cut list, in order
1. Threshold control → fixed at 0.60. 2. Motion → CSS transitions. 3. Flag phrases → static list.
Never cut: review before sweep, the Swept place with restore, real data locally.

## Decided 14 September (Daniel)

**Swept is a 7-day holding cell, not a delete.**
- Swept rows leave History at once, stay restorable for 7 days, then are permanently deleted.
- **Empty now** in the holding cell, for anyone who wants them gone today.
- **Respects Flow's auto-delete setting.** If transcripts auto-delete sooner, swept rows go on that
  schedule. The sweep never keeps words longer than the person already told Flow to.
- **Section-level select** on every Review header (take or leave a whole section). Short replies still
  start unselected.

**A "leaving today" reminder on the home screen** (Daniel's idea, placement from his screenshot
`ref/daniel-reminder-placement.png`): right column, directly under the stats / Voice Profile card.
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
