import type { Note } from './types'

/**
 * The design notes, per ~/job-search/spearfish/design-notes-spec.md.
 *
 * Five fields in fixed order: the problem with its source, the decision and
 * what it rejected, Whose (both lines, always), the business case as a
 * mechanism rather than a forecast, and the evidence.
 *
 * ⚑⚑⚑ THE HONESTY PROBLEM THIS FILE HAS AND THE ATHLETIC'S DOES NOT.
 *
 * Every Athletic note opens on a real App Store review. **Not one note here
 * can.** 254 Wispr Flow reviews were read by hand on 21 September and none is
 * about History, deletion, or losing a transcript. The Mac app has no store
 * reviews at all. Reddit is closed to scripts.
 *
 * The tempting move is to paraphrase a complaint into quotation marks and let
 * it look like a quote. What is done instead: every problem here names what it
 * actually rests on, and the drawer prints that source where the stars would
 * be. Two kinds of evidence carry this file:
 *
 *   1. **Flow's own documentation**, quoted exactly: "deleted transcripts
 *      cannot be recovered."
 *   2. **Daniel's own exported history**, 1,470 entries, stated as his own and
 *      never dressed up as research. He is one user. That is said out loud.
 *
 * ⚑ Where a customer quote is genuinely missing, the note says so rather than
 * skipping the field. A visible gap is worth more than a filled one that
 * cannot be checked.
 *
 * ⚑⚑ Counts are the **23 September re-export**, renumbered 25 September before
 * recording and read off the running app rather than computed by hand:
 * 1,470 entries, 145 empty, 48 cut off, 1 flagged, 64 short replies, 4 to
 * retry, 174 preselected, 194 candidates, about 1 in 8.
 */

/** Sweep's states, as far as the notes layer is concerned. */
export type SweepMode = 'history' | 'sweep' | 'cell'

export const NOTES: Note<SweepMode>[] = [
  {
    id: 1,
    mode: 'history',
    target: 'broom',
    title: 'A broom, not a banner',
    problem: {
      kind: 'sourced',
      text: 'Deleted transcripts cannot be recovered.',
      source: 'Wispr Flow documentation',
      note: 'Read 21 September 2026. The product deletes one row at a time and says this about it.',
    },
    decision:
      'Put the entry point where Flow already puts list operations, beside search, as one more bare glyph in a bar of bare glyphs. Rejected: a permanent card above the list announcing how many accidents you have. It was built, and it was killed, because a panel that is always there is a product telling you every morning that your history is a mess.',
    mine: 'Killing the permanent card after seeing it in place, and the rule that the sweep must be something you go and get rather than something that greets you.',
    claude: 'The bar, the glyph, the dot that appears only when there is something to review, and the unfold.',
    impact:
      'A cleanup surface that nags is a cleanup surface people learn to dismiss, and once dismissed it is dead weight in the bar forever. Asking to be found costs nothing and keeps the affordance alive.',
    evidence: { label: 'SPEC.md, "The sweep is a card the broom unfolds", decided 14 September' },
  },
  {
    id: 2,
    mode: 'sweep',
    target: 'count',
    title: 'The number on the button is the number in the sentence',
    problem: {
      kind: 'sourced',
      text: '1,470 entries, and about one in eight is a dictation I never meant to keep.',
      source: 'Daniel’s own exported history',
      note: '⚑ One user, and it is stated as one user. 145 empty, 48 cut off, 1 flagged by him, on the 23 September export.',
    },
    decision:
      'Say the count in words before anything happens, and put the same number on the button that performs it. Rejected: a summary that counts everything found while the button acts on a smaller set, which is the ordinary way this goes wrong and which makes the headline a number nobody can reconcile.',
    mine: 'The rule that the two numbers must be the same number, and that the sentence comes before the review rather than after it.',
    claude: 'The classifier, the counts, and the live binding so the sentence and the button cannot drift apart.',
    impact:
      'A bulk action people do not fully understand is one they either refuse or regret, and both outcomes cost support. Matching the sentence to the button is the cheapest possible way to make a destructive-looking action legible before it runs.',
    evidence: { label: 'SPEC.md, "The four sections, from the data"' },
  },
  {
    id: 3,
    mode: 'sweep',
    target: 'strip',
    title: 'What is deliberately not in the strip',
    problem: {
      kind: 'sourced',
      text: '64 of the 1,470 are short replies: finished thoughts, under twenty characters, that a length rule would have swept.',
      source: 'Daniel’s own exported history',
    },
    decision:
      'Three reasons get a tab: Empty, Cut off, Marked for removal. Short replies are in the data, are never selected, and are listed last and collapsed. Rejected: giving them a tab of their own, which would put a category that should never be swept at the same level as three that should.',
    mine: 'The ruling that a category can exist in the data and still not earn a tab. Visibility and endorsement are different things and the strip is the place that confuses them.',
    claude: 'The grouping, the collapse, and the rule that keeps the short set out of every default selection.',
    impact:
      'One wrongly deleted real transcript costs more trust than a hundred correctly swept blanks earn. The asymmetry is the whole design, and the strip is where it is most visible.',
    evidence: { label: 'SPEC.md, the Short replies row: "never; listed last, collapsed"' },
  },
  {
    /**
     * ⚑⚑⚑ THE BEST NOTE IN THE FILE, because it is the one where the data said
     * the design was wrong and the design changed.
     */
    id: 4,
    mode: 'sweep',
    target: 'ask',
    title: 'The rule I got backwards, and the data that caught it',
    problem: {
      kind: 'sourced',
      text: '"Do it." appears thirteen times and "Run it." five, every one of them dictated into the terminal where Claude Code runs, and they are the most deliberate entries in the whole history.',
      source: 'Daniel’s own exported history',
      note: 'Flow’s own Insights names his catchphrase as "Can we run the agent?", from the same data.',
    },
    decision:
      'Ask about the doubtful rather than deciding for them: a row of chips, filled means it goes, and the polarity is stated in words above them. \u26a1 The heading asks \u201cShould these go too?\u201d rather than \u201cAre these accidents too?\u201d: 145 of the 194 are empties, which is Flow\u2019s transcription returning nothing rather than anybody\u2019s slip, so diagnosing them as accidents was both inaccurate and quietly rude about the product. ⚡ And the classifier underneath changed. The first version weighted confidence by target app and treated Terminal as the most accident-prone place a person could dictate into. His real history inverted it. Whether the thought FINISHED separates an accident from an instruction; length and app do not. The app survives as one small adjustment, cut-off confidence times 0.9 in Messages, where people really do text in fragments.',
    mine: 'Running the rule against my own 1,470 instead of shipping it because it sounded right, and then accepting the answer when it came back inverted.',
    claude: 'Both classifiers, the confidence model, and the re-run that produced the corrected counts.',
    impact:
      'A classifier that is confidently wrong about a power user is worse than one that asks, because the power user is the person whose history is large enough for this feature to matter and the person most likely to tell other people it deleted their work.',
    evidence: { label: 'SPEC.md, "Completeness decides, not the app", revised 14 September' },
  },
  {
    id: 5,
    mode: 'sweep',
    target: 'restore',
    title: 'Undo is a place, not a toast',
    problem: {
      kind: 'sourced',
      text: 'Deleted transcripts cannot be recovered.',
      source: 'Wispr Flow documentation',
      note: 'The same line as note 1, and this is the note that answers it.',
    },
    decision:
      'Swept rows leave History at once, stay restorable for seven days, and then go. The promise is printed on the card that performs the action, not discovered afterwards. Rejected: a toast with an Undo, which expires in seconds and asks somebody to make a decision about twelve rows in the time it takes to read one.',
    mine: 'The seven-day hold as a place you can walk back into, and Empty Now for people who want them gone today, behind Flow’s own confirm rather than a new one.',
    claude: 'The holding cell, the expiry, the grouping by leave day, and the reminder on the day a batch is due to go.',
    impact:
      'It converts the riskiest action in the product into a reversible one, which is what lets it be offered in bulk at all. Without the hold this feature cannot ship past a legal review, let alone a user.',
    evidence: { label: 'SPEC.md, "Decided 14 September (Daniel)"' },
  },
  {
    id: 6,
    mode: 'cell',
    target: 'cell',
    title: 'Nobody reads "No text" a hundred times',
    problem: {
      kind: 'sourced',
      text: '145 of the swept rows are empty, and an empty row has nothing to recognise it by.',
      source: 'Daniel’s own exported history',
    },
    decision:
      'Blank rows fold into one line per day, "N empty transcripts. Show them", with their own Restore. The rows that have words are what the cell shows. Rejected: listing every blank row for completeness, which fills the one screen where somebody is trying to find a specific thing with ninety-seven identical ones.',
    mine: 'The judgement that the cell is a place for finding something, not a receipt for what happened.',
    claude: 'The per-day fold, the restore that works at either level, and keeping the grouping by leave day so the seven-day promise stays legible.',
    impact:
      'The holding cell only works if it can actually be used under pressure, which is the moment somebody realises they swept something they wanted. A screen of identical rows fails exactly then, which is the only time it matters.',
    evidence: { label: 'SPEC.md, "Blank rows fold into one line per day", 15 September' },
  },
  {
    id: 7,
    mode: 'history',
    /* ⚑ Short, and it reads as him. The limits half is what keeps the first
       half from being a brag. */
    title: 'The case for me, and its limits',
    closing: {
      /* ⚑ A standfirst on the last page has one job: say what is on the page
         and in what order. The old one counted things and stopped. */
      lede:
        'Six decisions, one running concept, one real history of 1,470 transcripts. Below: what the role asks for and which part of this answers it, then what this does not show.',
      mapped: [
        {
          asks: 'Design and build, rather than hand off.',
          shows:
            'This is a running React application against a real data export, not a set of frames. The classifier is code you can read and disagree with, and the counts in these notes come out of it rather than out of a slide.',
        },
        {
          asks: 'Work from evidence.',
          shows:
            'The rule that decides what gets swept was rewritten because the data contradicted it. Note 4 is that, in full, including what the first version got wrong.',
        },
        {
          asks: 'Use AI as part of the craft.',
          shows:
            'Every note says which decisions were mine and what Claude Code produced. The split is stated rather than implied, on each note, so it can be argued with.',
        },
        {
          asks: 'Care about the edges.',
          shows:
            'Reduced motion is honoured, animations are skipped while the tab is hidden because a paused exit leaves a row behind, one tab stop per row with arrow keys inside it, and the whole thing works at 390 pixels.',
        },
      ],
      notShown: [
        'It cannot read Flow\u2019s auto-delete setting, so the seven-day hold does not defer to it. The spec names that rather than hiding it.',
        'Nothing is really deleted from Flow. The holding cell is local to the concept.',
        'The retry cannot truly transcribe, because the concept holds no audio. It fails the way Flow\u2019s own retry failed on 14 September, with one recovered row so the success state can be seen at all.',
        'It cannot show working inside your constraints, your telemetry, and your roadmap.',
      ],
      provenance: [
        'The counts throughout come from one real Wispr Flow export of 1,470 entries, 8 August to 24 September 2026, Daniel\u2019s own, held locally and gitignored, with no audio.',
        'The public build reads a generated sample matched to the real distribution of length, app, and category, with no real text in it, so nothing dictated in private is published.',
        'And the honest limit: one user is not research. These numbers describe one history well and nobody else\u2019s at all, which is why every rule here is offered as something to test rather than something settled.',
      ],
      sign: 'Daniel Glaze',
    },
  },
]
