# Transcript Sweep — spec (one page)

A concept for Wispr Flow's history view: find the entries that are almost certainly accidents,
show them in one place with the reason and the confidence, sweep them in one motion, and keep
them somewhere you can get them back from. Built against one real user's 874 entries.

## The three categories, from the data

| Reason | Rule | In the real history |
|---|---|---|
| **Empty** | no text after trim, or Flow's own status is `dismissed` / `no_audio` / `empty` | 100 of 874 |
| **Short** | under 20 characters | 81 |
| **Flagged** | the entry names its own fate ("clean up", "never mind", "scratch that", "not what I", "ignore that", "delete that", "oops") | ~15 |

Dropped: near-duplicate retries (1 case in 874). Not built: "not words" (none found).

## Confidence is app-weighted

Length alone cannot decide. `Hi.` into Messages is a real text; `Hi.` into Terminal is not.
Each candidate carries a confidence 0–1:

- Empty: 0.98. If the recording ran over 30 s with no text, 0.90 (something else happened; still
  sweepable, but say so).
- Punctuation-only (`.` `?` `!!`): 0.97 in any app.
- Short: base 0.90 for 1–3 chars, 0.75 for 4–9, 0.55 for 10–19, then multiplied by an app weight:
  Terminal 1.0, Chrome 0.85, unknown 0.85, Flow itself 0.8, Notes 0.7, Messages 0.5.
- Flagged: 0.80.

One reason per row (priority Empty, Flagged, Short); confidence is the highest that applies.
**Default threshold 0.60.** Rows at or above it are preselected. Rows below it are shown, marked
borderline, and NOT selected. The threshold is a control if time allows.

## The four states

1. **History.** Flow-style list: app, time, first line, duration. Search. A **Sweep** affordance
   (broom) beside search. Nothing else changes.
2. **Summary.** One sentence in counts before anything happens: "You have 100 empty transcripts,
   81 under 20 characters, and about a dozen you flagged yourself. That's about 1 in 5." Two
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
