import { useEffect, useRef, useSyncExternalStore } from 'react'

// The switch at the bottom-left of the site. Off, scrolling never moves on by itself (no push
// to the next section, no project opening on its own); clicks and arrows still work. Kept in
// localStorage so it stays as he left it.
const KEY = 'auto-scroll'
const listeners = new Set<() => void>()
let auto = true
try {
  auto = localStorage.getItem(KEY) !== 'off'
} catch {
  // Storage blocked: just keep it in memory.
}

export const autoScroll = {
  get: () => auto,
  set(value: boolean) {
    auto = value
    try {
      localStorage.setItem(KEY, value ? 'on' : 'off')
    } catch {
      // Not saved, still applies for this visit.
    }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export const useAutoScroll = () => useSyncExternalStore(autoScroll.subscribe, autoScroll.get)

// Moving on by scrolling alone: once a page is scrolled to its end, carrying on scrolling
// "pushes" toward the next place, and a small cue at the bottom of the screen fills up and
// names it. Only a deliberate push (PUSH of scrolling, without stopping) moves on, so a
// page that merely glides to its end never jumps by itself. Clicks still work as before.

const PUSH = 300
// Stopping for this long lets the push drain away.
const LAPSE = 380
// After a move, scrolling that is still going doesn't push straight on again.
const REST = 1300

// A wheel or trackpad keeps sending scroll input for a moment after you stop. If a push has just
// moved you to a new page, that leftover input would scroll the new page (the Projects list
// flew to its last project) or push straight on to the next section. So after a push the
// input still coming in is swallowed, until it has been quiet for SETTLE (or CAP has passed,
// so someone scrolling non-stop is not locked out).
const SETTLE = 280
const CAP = 2200
let swallowFrom = 0
let lastInput = 0
let swallowing = false

function swallow(event: Event) {
  if (!swallowFrom) return
  const now = performance.now()
  if (now - lastInput > SETTLE || now - swallowFrom > CAP) {
    swallowFrom = 0
    return
  }
  lastInput = now
  event.preventDefault()
  event.stopImmediatePropagation()
}

function swallowMomentum() {
  if (!swallowing) {
    swallowing = true
    // In the capture phase on the window, so it runs before the page's own scrolling.
    window.addEventListener('wheel', swallow, { capture: true, passive: false })
    window.addEventListener('touchmove', swallow, { capture: true, passive: false })
  }
  swallowFrom = lastInput = performance.now()
}

interface Way {
  label: string
  go: () => void
}

export interface PushOptions {
  // What scrolls: an element, or the page itself.
  scroller: () => HTMLElement | Window | null
  enabled: () => boolean
  down?: () => Way | null
  up?: () => Way | null
}

let restUntil = 0
let cue: HTMLDivElement | null = null

function showCue(way: Way | null, direction: 1 | -1, amount: number) {
  if (!cue) {
    cue = document.createElement('div')
    cue.className = 'push-cue'
    cue.setAttribute('aria-hidden', 'true')
    cue.innerHTML = '<span class="push-cue-label"></span><span class="push-cue-bar"><i></i></span>'
    document.body.append(cue)
  }
  if (!way || amount <= 0.04) {
    cue.classList.remove('is-on')
    return
  }
  cue.dataset.direction = direction > 0 ? 'down' : 'up'
  cue.querySelector('.push-cue-label')!.textContent = `${direction > 0 ? '↓' : '↑'}  ${way.label}`
  cue.style.setProperty('--push', String(Math.min(1, amount)))
  cue.classList.add('is-on')
}

const atEnd = (scroller: HTMLElement | Window, direction: 1 | -1) => {
  const top = scroller instanceof Window ? window.scrollY : scroller.scrollTop
  const max =
    scroller instanceof Window
      ? document.documentElement.scrollHeight - window.innerHeight
      : scroller.scrollHeight - scroller.clientHeight
  return direction > 0 ? top >= max - 2 : top <= 2
}

export function useScrollPush(options: PushOptions) {
  const latest = useRef(options)
  latest.current = options

  useEffect(() => {
    let amount = 0
    let direction: 1 | -1 = 1
    let last = 0
    let touchY: number | null = null
    let lapse = 0

    const reset = () => {
      amount = 0
      showCue(null, direction, 0)
    }

    const push = (delta: number, target: EventTarget | null) => {
      const { scroller: get, enabled, down, up } = latest.current
      const scroller = get()
      const now = performance.now()
      if (!scroller || !autoScroll.get() || !enabled() || now < restUntil) return
      if (!(scroller instanceof Window) && target instanceof Node && !scroller.contains(target)) return
      const dir: 1 | -1 = delta > 0 ? 1 : -1
      const way = (dir > 0 ? down : up)?.() ?? null
      if (!way || !atEnd(scroller, dir)) {
        if (amount) reset()
        return
      }
      if (dir !== direction || now - last > LAPSE) amount = 0
      direction = dir
      last = now
      amount += Math.abs(delta) / PUSH
      showCue(way, dir, amount)
      clearTimeout(lapse)
      lapse = window.setTimeout(reset, LAPSE)
      if (amount >= 1) {
        restUntil = now + REST
        reset()
        swallowMomentum()
        way.go()
      }
    }

    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY
      if (delta) push(delta, event.target)
    }
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null
    }
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (touchY === null || y === undefined) return
      push((touchY - y) * 1.5, event.target)
      touchY = y
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      clearTimeout(lapse)
      reset()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])
}

// Keeps the end-of-page push from firing right after a move that something else started
// (such as a project opening by itself).
export const rest = (ms = REST) => {
  restUntil = performance.now() + ms
}
