import s from '../App.module.scss'
import type { SVGProps } from 'react'
import {
  Mic, ChartColumnBig, Scissors, WandSparkles,
  Users, Gift, Settings, CircleHelp, Bell, CircleUserRound, PanelLeft,
} from '../icons.ts'

// Four of Flow's sidebar glyphs have no Lucide twin (checked against every candidate on a proof
// sheet, 14 Sep). They are redrawn here on Lucide's 24-unit grid with Lucide's stroke, so they sit
// in the same optical family as the rest. Nothing of Flow's is copied in.
type IconProps = SVGProps<SVGSVGElement> & { size?: number }
function Glyph({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
  )
}
// a ring with a solid centre, larger than Lucide's circle-dot
const Notetaker = (p: IconProps) => <Glyph {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></Glyph>
// a page with a paperclip
const Dictionary = (p: IconProps) => <Glyph {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M15 9.5v6a3 3 0 0 1-6 0V9a2 2 0 0 1 4 0v6" /></Glyph>
// a large T and a small one
const Style = (p: IconProps) => <Glyph {...p}><path d="M3 5h10M8 5v14" /><path d="M14 11h7M17.5 11v8" /></Glyph>
// Flow's mark: five rounded bars, tall, short, middle, short, tall; the 2nd and 4th sit lower.
// Measured from Daniel's capture (ref/flow-history-home.png) on 15 Sep, not eyeballed: the first
// drawing was a symmetric sound wave and read wrong beside the real one on a proof sheet.
const FlowMark = (p: IconProps) => <Glyph strokeWidth={2.75} {...p}><path d="M3.3 3.4v17.2M7.6 12.4v5.7M12 6.9v9.7M16.4 12.9v5.2M20.7 3.4v17.2" /></Glyph>
// a note with two lines and a folded bottom-right corner
const Scratchpad = (p: IconProps) => <Glyph {...p}><path d="M5 3h14a2 2 0 0 1 2 2v9l-7 7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M21 14h-5a2 2 0 0 0-2 2v5" /><path d="M8 9h8M8 13h5" /></Glyph>

// Flow's frame, redrawn so the concept sits where it would ship. Nothing here is interactive.
const NAV = [
  [Mic, 'Dictation'], [Notetaker, 'Notetaker'], [ChartColumnBig, 'Insights'], [Dictionary, 'Dictionary'],
  [Scissors, 'Snippets'], [Style, 'Style'], [WandSparkles, 'Transforms'], [Scratchpad, 'Scratchpad'],
] as const
const FOOT = [[Users, 'Invite your team'], [Gift, 'Refer a friend'], [Settings, 'Settings'], [CircleHelp, 'Help']] as const

export function Titlebar() {
  return (
    <div className={s.titlebar} aria-hidden="true">
      <span className={s.lights}><i /><i /><i /></span>
      <PanelLeft size={16} />
      <span className={s.titleSpacer}>A concept for Wispr Flow's History view. Not affiliated with Wispr. Flow's chrome is reproduced for fidelity.</span>
      <Bell size={16} />
      <CircleUserRound size={16} />
    </div>
  )
}

export function Sidebar() {
  return (
    <nav className={s.sidebar} aria-label="Flow">
      <div className={s.brand}><FlowMark size={18} /> Flow <em>Pro</em></div>
      {NAV.map(([Icon, label]) => (
        <span key={label} className={s.nav} aria-current={label === 'Dictation' ? 'page' : undefined}><Icon size={15} />{label}</span>
      ))}
      <div className={s.navFoot}>
        {FOOT.map(([Icon, label]) => <span key={label} className={s.nav}><Icon size={15} />{label}</span>)}
      </div>
    </nav>
  )
}

export function Banner() {
  return (
    <div className={s.banner} aria-hidden="true">
      <h2>Hold down <b>^ Ctrl+⌥ Opt</b> to dictate</h2>
      <p>Flow works in all your apps. Try it in <b>email, messages, docs</b> or anywhere else.</p>
      <span>See how it works</span>
    </div>
  )
}

export function Stats({ words, wpm, streak }: { words: number; wpm: number; streak: number }) {
  return (
    <div className={s.stats}>
      <div className={s.statsTop}>
        <div><b>{(words / 1000).toFixed(1)}K</b> total words</div>
        <div><b>{wpm}</b> wpm</div>
        <div><b>{streak}</b> day streak</div>
      </div>
      <div className={s.voice}>
        <h3>Your Voice Profile</h3>
        <p>Keep using Flow for new insights</p>
        <span className={s.voiceBar}><i />Updates in 16K words</span>
      </div>
    </div>
  )
}
