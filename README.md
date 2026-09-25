# Transcript Sweep

A concept for Wispr Flow's History view. Not affiliated with Wispr. Flow's chrome, its mark included,
is redrawn by hand for fidelity; no file of Flow's (logo, font, Lottie) ships in this repo.

One screen, one action: find the dictations you never meant to keep, show them with the
reason, sweep them in one motion, and keep them somewhere they can come back from. Built against my
own 1,470 real Flow entries, and published on a synthetic set that matches their distribution.

**Stack:** React 19, TypeScript, Vite, Motion, Lucide, SCSS modules. Flow's own stack, on purpose.

## Try it

**Live: [flow-sweep.vercel.app](https://flow-sweep.vercel.app)**

1. Press the broom beside search. A card unfolds: what Flow will sweep, and the one question it has.
2. Press **Sweep**. The rows lift out of the list.
3. **Swept · N** appears in the bar. Open it: that is the holding cell, where anything can be restored
   for seven days.
4. Add `?demo=reminder` to the URL to see day seven: the reminder card under the stats, listing what
   leaves tonight. `?day=N` moves the concept's clock forward N days.

## What the data said

Flow keeps every dictation, including the ones that went nowhere. In my 1,470 entries from 8 August to
24 September 2026:

- **145 were empty**, 48 were **cut off mid-thought**, 1 was **marked for removal** in the dictation
  itself ("never mind"), and 64 were **short replies** like "Do it." that are finished thoughts.
- **About 1 in 8 entries is one you never meant to keep.** 194 candidates; 174 preselected at the default threshold.
- **Empties are not brief hotkey taps.** They average 5.9 seconds of recording, up to 152 seconds:
  recordings that returned no text. The taps are the under-20-character set, 2.7 seconds recorded.
  Two failures, two upstream causes. The store does not say why the text did not come back.
- **The retry pattern occurs once.** Dropped.
- **Storage is not the value.** All audio is 597 MB; the under-20 set carries 16 MB. The sweep buys a
  legible history, not disk.
- **Prior art:** Flow deletes one transcript at a time from a three-dot menu, offers auto-delete after
  24 hours, and its docs say "deleted transcripts cannot be recovered." No bulk review, no undo. The
  holding cell is the answer to that sentence.

## The two decisions the data made

**Whether the thought finished decides, not where it went.** The first classifier weighted
confidence by the target app and treated Terminal as the most accident-prone place. My own Short
list proved it inverted: "Do it." thirteen times and "Run it." five times into the terminal are the
most deliberate entries in the history, while "Watch the", "Don't d", and "The About Me pa" are the
hotkey released mid-sentence. Length and app do not separate them; completeness does. The app
survives as one small adjustment: cut-off confidence is nudged down in Messages, where people text
in fragments.

**A holding cell, not a delete.** Nothing leaves on detection. Swept rows leave History at once, stay
restorable for seven days, per row or all at once, and then leave for good. The one destructive
control, Empty now, sits behind Flow's own confirm, and Flow's coral is spent only there.

## What is built

- The card: one live count, Flow's tab strip for the sure sections (each opens its rows with
  checkboxes), the doubtful cut-offs as chips with filled meaning "goes", short replies and blank
  recordings as lines, Not now and Sweep.
- The holding cell inside History, grouped by the day rows leave, with Restore, Restore all, and
  Empty now. Each day's blank rows fold into one line ("101 empty transcripts. Show them", Restore
  101), so the cell is a list of things worth a second look, not a wall of "No text".
- The reminder card on day seven, dismissable for the day, with Review and Keep them.
- The row menu with Sweep transcript added above Delete transcript: the reversible option before
  the irreversible one.
- Retry, as Flow does it: the row pulses, then the toast. The concept has no audio, so one recovery
  (the longest blank recording) is staged with invented words so the success state can be seen, and
  the row says so. The rest fail.
- Flow's frame redrawn by hand, including four sidebar glyphs with no Lucide twin, drawn on Lucide's
  grid so they sit in the same family.
- Keyboard: one tab stop per History row, arrows between rows, Enter opens the row menu with focus
  inside it, Escape hands focus back; Tab, Space, Enter, and Escape on the card and the dialogs; a
  visible amber focus ring, Flow's own. Reduced motion honoured by both the CSS and Motion.
- Phone width (390 px): the card, the cell, the menu, and search all fit with no sideways scroll.

## What is not built

The sidebar, the banner, the stats card, Play, Copy, Flag, Undo AI edit, Delete transcript, and
Extract audio are drawn, not wired (the stats card's three numbers are counted from the loaded
history, so they describe the list beneath them; nothing on it is typed in). There is no Storybook and no Lottie; nothing in the concept called for a baked animation.
Flow's auto-delete setting is respected in the spec, not in the code, because the concept cannot
read Flow's settings. Light only, because Flow's desktop app is.

## How it was built

The idea came from using Flow. I downloaded it on 8 August and have barely put it down since; I
dictate everywhere, all day. Scrolling my own History I kept seeing empty transcripts, ones cut off
mid-word, and ones I plainly did not need, and I wanted a way to clean them up. I would guess I am
not the only one.

This is my first React and TypeScript build, paired with Claude Code, across four working sessions
between 12 and 15 September 2026. I came up with the idea, laid out the conditions and the rules for
what counts as an accident, and decided how the sweep looks and moves. I never opened Figma. I took
screenshots of Flow and we matched the build against them on proof sheets, then kept iterating
until it felt like part of Flow's own design language. The model wrote most of the code and
drafted most of the prose; every product call in the spec is mine, and dated.

A lot got killed: countless states for adding and removing rows from the sweep, and layouts along
the way. The one that mattered was the review itself. Early on it listed every transcript that was
about to go, and it read like a giant checklist. What replaced it is two tiers. What Flow is sure
about is counted, not listed: the empty ones, the cut-offs it is certain of, and the ones you
marked yourself. The only things put in front of you are the ones it is not sure about, as chips
you can flip. Sweep transcript also went into the row's own menu, so a single row can go on your
say-so rather than the classifier's.

What I was going for: a flow that fits inside Flow's language rather than beside it, that could
genuinely ship, and that was built with care.

## Data and privacy

- `src/data/history.private.json` is my real dictation history. It is gitignored and never enters
  a public repo, a deploy, or a screenshot that leaves my machine. Discovery used Flow's own backup
  copy, read-only; Flow's live database was never opened.
- `src/data/history.sample.json` is what the public build runs on: 1,470 invented entries generated
  to the real distribution of length, app, and category, with no real sentences.
- A production build made on my machine would embed the private file. Deploys build from the repo.

## Run it locally

```bash
npm install
npm run dev            # http://localhost:5173, uses the private export if present, else the sample
VITE_SAMPLE=1 npm run dev   # force the public sample
node scripts/verify.ts      # classifier counts against the export
```

Swept state lives in localStorage under `flow-sweep:*`; clear it to reset.

## Where things are

```
SPEC.md                      the spec, with the dated decisions at the bottom
src/sweep/detect.ts          the classifier: empty / retry / cut off / marked for removal / short reply
src/sweep/holding.ts         the 7-day hold: clock, expiry, persistence
src/components/              SweepCard, HistoryList, HoldingCell, Reminder, Dialogs, Chrome, Toast
src/App.tsx                  state and wiring
src/styles/tokens.scss       tokens sampled from Flow's desktop app
scripts/make-sample.mjs      generates the public dataset
```
