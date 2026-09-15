---
target: the unfolded sweep card
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-15T06-06-39Z
slug: src-components-sweepcard-tsx
---
# Critique: the unfolded sweep card (src/components/SweepCard.tsx)

Method: dual-agent. Design review ran in a fresh tab against the live page; detector ran on src + index.html and in-page.

## Design health: 26/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Title and button move together; tab strip shows no open state at rest |
| 2 | Match system / real world | 3 | "Restorable", "Marked for removal" are system words |
| 3 | User control and freedom | 3 | Keeping a whole decided tier requires opening its tab |
| 4 | Consistency and standards | 2 | Three number formats; two selection idioms; transcript vs transcription |
| 5 | Error prevention | 3 | Select all on the question sweeps 16 catchphrases in one click |
| 6 | Recognition over recall | 2 | Chips carry no reason; duplicates ("You" x3) told apart only by hover |
| 7 | Flexibility and efficiency | 3 | No "never an accident" memory |
| 8 | Aesthetic and minimalist | 2 | 13 numerals, 34 controls in 343px; "0/43" inert; teal disc ornament |
| 9 | Error recovery | 3 | 7-day line is the smallest, greyest text, far from Sweep |
| 10 | Help and documentation | 2 | Nothing says filled = goes |

## Design specificity
Authored for Flow with one imported idiom: the teal broom disc (no Flow precedent) and the chip cloud (reads as Material filter chips; form is right, meaning untaught).
Detector: components clean; whole-src 1 layout-transition (card margin); in-page 10 findings: 6 low-contrast (day labels #AFAFAD 2.1:1, list footer #939390 3.0:1, all outside the card, same tokens), 2 tiny-text (Voice Profile 11px/9px, Flow imitation), 2 layout-transition (one false positive on body).

## Priority issues
- [P0] Chip polarity unlabelled: teal fill can read as "safe". Fix: "11 of 27 will go"; rename Select all to "Sweep all".
- [P1] Tab counts and row meta (.why) at --mut 11px measure 2.8:1 on the card surface. Fix: --ink-2; partial state by weight.
- [P1] "Short replies 0/43" contradicts "Flow will sweep". Fix: demote to a one-line "43 short replies stay. Show them" beside the blank-recordings line; or open the first tab by default.
- [P2] Chips without reasons; duplicates. Fix: muted date inside repeated chips or "You x3"; reason for the 0.50 set.
- [P2] Footer voice/placement: "You can restore anything for 7 days." beside the buttons; settle transcript vs transcription.
- [P3] Drop the teal disc; bare glyph inline or nothing.
- [P3] Outlined chip border 1.4:1; raise toward 3:1.

## Persona red flags
Power user (Terminal, catchphrases): the same question weekly; Select all sweeps 16 catchphrases; Empty tab is 89 "No text" rows, so tabs stop being opened.
First-timer: doesn't know filled = goes; strip doesn't look openable; "Cut off 10/10" reads as a score; "Sweep" sounds like delete; single-letter chips look like a bug.

## Minor observations
Tablist ARIA is really a disclosure; "89 of 89 selected" vs "89/89"; chip targets ~28px; blank-recordings line belongs with the breakdown.

## Questions
Why show 89 "No text" rows at all? Should the question cover only the 0.60-0.90 band? Does the card need to duplicate rows the list already shows?
