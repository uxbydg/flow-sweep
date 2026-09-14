import s from '../App.module.scss'
import {
  Mic, CircleDot, ChartColumn, BookText, Scissors, Type, WandSparkles, NotebookPen,
  Users, Gift, Settings, CircleHelp, Bell, CircleUserRound, PanelLeft, AudioLines,
} from '../icons.ts'

// Flow's frame, redrawn so the concept sits where it would ship. Nothing here is interactive.
const NAV = [
  [Mic, 'Dictation'], [CircleDot, 'Notetaker'], [ChartColumn, 'Insights'], [BookText, 'Dictionary'],
  [Scissors, 'Snippets'], [Type, 'Style'], [WandSparkles, 'Transforms'], [NotebookPen, 'Scratchpad'],
] as const
const FOOT = [[Users, 'Invite your team'], [Gift, 'Refer a friend'], [Settings, 'Settings'], [CircleHelp, 'Help']] as const

export function Titlebar() {
  return (
    <div className={s.titlebar} aria-hidden="true">
      <span className={s.lights}><i /><i /><i /></span>
      <PanelLeft size={16} />
      <span className={s.titleSpacer} />
      <Bell size={16} />
      <CircleUserRound size={16} />
    </div>
  )
}

export function Sidebar() {
  return (
    <nav className={s.sidebar} aria-label="Flow">
      <div className={s.brand}><AudioLines size={18} /> Flow <em>Pro</em></div>
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

export function Stats({ words }: { words: number }) {
  return (
    <div className={s.stats}>
      <div className={s.statsTop}>
        <div><b>{(words / 1000).toFixed(1)}K</b> total words</div>
        <div><b>121</b> wpm</div>
        <div><b>22</b> day streak</div>
      </div>
      <div className={s.voice}>
        <h3>Your Voice Profile</h3>
        <p>Keep using Flow for new insights</p>
        <span className={s.voiceBar}><i />Updates in 16K words</span>
      </div>
    </div>
  )
}
