import { createPortal } from 'react-dom'
import { autoScroll, useAutoScroll } from './resume/scrollPush'

// Always in the bottom-left corner: turns on or off the scrolling that carries the visitor on
// by itself (see resume/scrollPush.ts).
export default function ScrollToggle() {
  const on = useAutoScroll()
  // In the body, after the section pages (which are portalled there too), so nothing covers it.
  return createPortal(
    <button
      type="button"
      className="scroll-toggle"
      role="switch"
      aria-checked={on}
      aria-label="Scroll through the whole site"
      title={on ? 'Auto-scroll is on: scrolling carries you on. Click to turn off.' : 'Auto-scroll is off. Click to turn on.'}
      onClick={() => autoScroll.set(!on)}
    >
      <span className="scroll-toggle-track" aria-hidden="true">
        <i />
      </span>
      <span className="scroll-toggle-text" aria-hidden="true">
        Auto-scroll {on ? 'on' : 'off'}
      </span>
    </button>,
    document.body,
  )
}
