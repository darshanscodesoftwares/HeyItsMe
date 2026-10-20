import { sections } from './content'
import { routeId } from './route'

// The resume's camera. The paper stays where it is on screen: moving the camera
// means transforming the paper (from its top-left corner) until a section fills the
// screen. The section page's huge title is that section's heading, lifted off the
// paper and grown while the camera moves in.
//
// Each move puts things in their final place first and then animates them from
// where they were, so the end state never depends on an animation finishing.

const EASE_CAMERA = 'cubic-bezier(0.65, 0, 0.2, 1)'
const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

interface Shot {
  x: number
  y: number
  scale: number
}

export interface Stage {
  paper: () => HTMLElement
  detail: () => HTMLElement
  // Renders the page for `id`, or removes it, before returning.
  show: (id: string | null) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const transformOf = ({ x, y, scale }: Shot) => `translate(${x}px, ${y}px) scale(${scale})`

const sectionIn = (paper: HTMLElement, id: string) => paper.querySelector<HTMLElement>(`[data-section="${id}"]`)!
const headingIn = (section: HTMLElement) => section.querySelector<HTMLElement>('[data-heading]')!
const titleIn = (detail: HTMLElement) => detail.querySelector<HTMLElement>('[data-title]')!
const titleTextIn = (detail: HTMLElement) => titleIn(detail).firstElementChild as HTMLElement
const partsIn = (root: Element) => [...root.querySelectorAll<HTMLElement>('[data-enter]')]

// Measures with the camera at rest, so the numbers describe the paper as laid out.
function atRest<T>(paper: HTMLElement, measure: () => T): T {
  const transform = paper.style.transform
  paper.style.transform = ''
  try {
    return measure()
  } finally {
    paper.style.transform = transform
  }
}

// Frames a section: close enough that it nearly fills the screen, centered where it
// can be, but never so far out that the paper's edges come into view.
function frame(paper: HTMLElement, section: HTMLElement): Shot {
  const p = paper.getBoundingClientRect()
  const s = section.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const fit = clamp(Math.min((width * 0.8) / s.width, (height * 0.8) / s.height), 1.2, 3)
  const scale = Math.max(fit, width / p.width, height / p.height)
  const x = width / 2 - p.left - scale * (s.left + s.width / 2 - p.left)
  const y = height / 2 - p.top - scale * (s.top + s.height / 2 - p.top)
  return {
    x: clamp(x, width - p.left - scale * p.width, -p.left),
    y: clamp(y, height - p.top - scale * p.height, -p.top),
    scale,
  }
}

// The transform that lays `el`, from where it sits now, over `rect`.
function over(el: HTMLElement, rect: DOMRect) {
  const now = el.getBoundingClientRect()
  return `translate(${rect.left - now.left}px, ${rect.top - now.top}px) scale(${rect.width / now.width})`
}

// Sizes the title to span the screen, but no taller than about a quarter of it.
function fitTitle(detail: HTMLElement) {
  const title = titleIn(detail)
  title.style.fontSize = '100px'
  const size = Math.min((title.clientWidth / titleTextIn(detail).offsetWidth) * 100, window.innerHeight * 0.26)
  title.style.fontSize = `${size}px`
  detail.style.setProperty('--title-size', `${size}px`)
}

// Pins the paper to the screen right over its slot in the page (see .is-pinned).
function pin(paper: HTMLElement) {
  const slot = paper.parentElement!.getBoundingClientRect()
  paper.style.setProperty('--pin-top', `${slot.top}px`)
  paper.style.setProperty('--pin-left', `${slot.left}px`)
  paper.style.setProperty('--pin-width', `${slot.width}px`)
  paper.classList.add('is-pinned')
}

// Keeps the page behind still, and out of reach, while a section is open.
function lockPage(locked: boolean) {
  const root = document.documentElement
  root.style.paddingRight = locked ? `${window.innerWidth - root.clientWidth}px` : ''
  root.style.overflow = locked ? 'hidden' : ''
  document.getElementById('root')!.inert = locked
}

// The page's parts come forward one after another.
function rise(parts: HTMLElement[], delay: number) {
  return Promise.all(
    parts.map(
      (part, i) =>
        part.animate([{ opacity: 0, transform: 'translateY(32px) scale(0.97)' }, { opacity: 1, transform: 'none' }], {
          duration: 650,
          delay: delay + Math.min(i, 8) * 70,
          easing: EASE_OUT,
          fill: 'backwards',
        }).finished,
    ),
  )
}

// ...and drop away a little faster than they came.
function sink(parts: HTMLElement[]) {
  return Promise.all(
    parts.map(
      (part) =>
        part.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(0.98)' }], {
          duration: 260,
          easing: 'ease-in',
          fill: 'forwards',
        }).finished,
    ),
  )
}

export function createCinema(stage: Stage) {
  let shown: string | null = null
  let busy = false

  async function open(id: string, animate: boolean) {
    const paper = stage.paper()
    const section = sectionIn(paper, id)
    // Stop any smooth scroll still running, so the paper holds still under the camera.
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
    lockPage(true)
    pin(paper)
    const shot = frame(paper, section)
    const heading = headingIn(section).getBoundingClientRect()

    shown = id
    stage.show(id)
    const detail = stage.detail()
    fitTitle(detail)
    paper.classList.add('is-focusing')
    section.classList.add('is-focused', 'is-lifted')
    paper.style.transform = transformOf(shot)
    titleIn(detail).focus({ preventScroll: true })

    if (!animate) {
      await detail.animate({ opacity: [0, 1] }, { duration: 200, easing: 'ease' }).finished
      return
    }
    const title = titleTextIn(detail)
    await Promise.all([
      paper.animate([{ transform: 'none' }, { transform: transformOf(shot) }], { duration: 1000, easing: EASE_CAMERA })
        .finished,
      // Starts as the heading on the paper, then grows and fades into the background.
      title.animate([{ transform: over(title, heading), opacity: 1, '--title-solid': '100%' }, { transform: 'none' }], {
        duration: 1050,
        delay: 60,
        easing: EASE_CAMERA,
        fill: 'backwards',
      }).finished,
      detail
        .querySelector<HTMLElement>('[data-veil]')!
        .animate({ opacity: [0, 1] }, { duration: 600, delay: 420, easing: 'ease', fill: 'backwards' }).finished,
      rise(partsIn(detail), 650),
    ])
  }

  async function close(id: string, animate: boolean) {
    const paper = stage.paper()
    const detail = stage.detail()
    const section = sectionIn(paper, id)
    const heading = atRest(paper, () => headingIn(section).getBoundingClientRect())
    const shot = paper.style.transform
    paper.style.transform = ''
    paper.classList.remove('is-focusing')

    if (animate) {
      const title = titleTextIn(detail)
      await Promise.all([
        paper.animate([{ transform: shot }, { transform: 'none' }], {
          duration: 950,
          delay: 120,
          easing: EASE_CAMERA,
          fill: 'backwards',
        }).finished,
        // Shrinks back into the heading on the paper.
        title.animate([{ transform: 'none' }, { transform: over(title, heading), opacity: 1, '--title-solid': '100%' }], {
          duration: 950,
          delay: 120,
          easing: EASE_CAMERA,
          fill: 'forwards',
        }).finished,
        detail
          .querySelector<HTMLElement>('[data-veil]')!
          .animate({ opacity: [1, 0] }, { duration: 500, delay: 300, easing: 'ease', fill: 'forwards' }).finished,
        sink(partsIn(detail)),
      ])
    } else {
      await detail.animate({ opacity: [1, 0] }, { duration: 200, easing: 'ease', fill: 'forwards' }).finished
    }

    section.classList.remove('is-focused', 'is-lifted')
    paper.classList.remove('is-pinned')
    shown = null
    stage.show(null)
    lockPage(false)
    section.focus({ preventScroll: true })
  }

  // Pans across the paper to another section while the page swaps its content.
  async function cut(from: string, to: string, animate: boolean) {
    const paper = stage.paper()
    const detail = stage.detail()
    const before = sectionIn(paper, from)
    const after = sectionIn(paper, to)
    const start = paper.style.transform
    const shot = transformOf(atRest(paper, () => frame(paper, after)))
    paper.style.transform = shot
    before.classList.remove('is-focused', 'is-lifted')
    after.classList.add('is-focused', 'is-lifted')

    const title = titleTextIn(detail)
    const body = detail.querySelector<HTMLElement>('[data-body]')!
    // Going forward pushes the old title out to the left; going back, to the right.
    const step = sections.findIndex((s) => s.id === to) - sections.findIndex((s) => s.id === from)
    const direction = Math.abs(step) === sections.length - 1 ? -Math.sign(step) : Math.sign(step)
    const pan = animate
      ? paper.animate([{ transform: start }, { transform: shot }], { duration: 1000, easing: EASE_CAMERA }).finished
      : null

    if (animate) {
      await Promise.all([
        title.animate([{ transform: 'none' }, { opacity: 0, transform: `translateX(${-direction * 8}vw)` }], {
          duration: 320,
          easing: 'ease-in',
          fill: 'forwards',
        }).finished,
        sink(partsIn(body)),
      ])
    }

    shown = to
    stage.show(to)
    detail.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    detail.querySelector<HTMLElement>('[data-scroll]')!.scrollTop = 0
    fitTitle(detail)

    if (animate) {
      await Promise.all([
        pan,
        title.animate([{ opacity: 0, transform: `translateX(${direction * 8}vw)` }, { transform: 'none' }], {
          duration: 700,
          easing: EASE_OUT,
          fill: 'backwards',
        }).finished,
        rise(partsIn(body), 0),
      ])
    }
  }

  // Brings the screen in line with the address: opens, closes or moves between sections.
  async function sync(animate = !prefersReducedMotion()) {
    const target = routeId()
    const current = shown
    if (busy || target === current) return
    busy = true
    try {
      if (current === null) await open(target!, animate)
      else if (target === null) await close(current, animate)
      else await cut(current, target, animate)
    } finally {
      busy = false
    }
    // The address may have changed again while the camera was moving.
    sync()
  }

  // Keeps the shot framed when the window changes size.
  function reframe() {
    if (busy || shown === null) return
    const paper = stage.paper()
    const section = sectionIn(paper, shown)
    pin(paper)
    paper.style.transform = transformOf(atRest(paper, () => frame(paper, section)))
    fitTitle(stage.detail())
  }

  return { sync, reframe }
}
