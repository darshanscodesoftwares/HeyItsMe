import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import Detail from './Detail'
import Paper from './Paper'
import { createCinema } from './cinema'
import { sections } from './content'
import { hrefFor, routeId } from './route'
import './resume.css'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The paper's parts arrive one row at a time, top to bottom across both columns:
// the header first, then each section's heading followed by its lines.
function bringIn(paper: HTMLElement) {
  if (prefersReducedMotion()) return
  const rise = (el: Element, delay: number) =>
    el.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], {
      duration: 600,
      delay,
      easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      fill: 'backwards',
    })
  paper.querySelectorAll('.sheet-header > *').forEach((el, i) => rise(el, 150 + i * 60))
  const rows = [...paper.querySelectorAll<HTMLElement>('.sheet-section')].sort((a, b) => a.offsetTop - b.offsetTop)
  rows.forEach((section, i) => {
    rise(section.querySelector('.sheet-heading')!, 350 + i * 70)
    rise(section.querySelector('.sheet-preview')!, 410 + i * 70)
  })
}

export default function Resume() {
  const sceneRef = useRef<HTMLElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<string | null>(null)
  // The paper stays hidden until the page is scrolled all the way down to it; opening
  // a section's address directly shows it at once.
  const [revealed, setRevealed] = useState(() => routeId() !== null)
  const [cinema] = useState(() =>
    createCinema({
      paper: () => paperRef.current!,
      detail: () => detailRef.current!,
      show: (id) => flushSync(() => setShown(id)),
    }),
  )
  // Set when the site was opened straight on a section's address, so "back" has no
  // earlier page in the history to return to.
  const landed = useRef(false)

  useEffect(() => {
    const onPopState = () => cinema.sync()
    const onResize = () => cinema.reframe()
    window.addEventListener('popstate', onPopState)
    window.addEventListener('resize', onResize)
    let timer = 0
    if (routeId()) {
      // Start on that section, without the camera move.
      landed.current = true
      sceneRef.current?.scrollIntoView()
      timer = window.setTimeout(() => cinema.sync(false))
    }
    return () => {
      clearTimeout(timer)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('resize', onResize)
    }
  }, [cinema])

  // Reveals the paper once the section fills the screen (scrolled to the very end), and
  // hides it again once it has mostly scrolled back out of view.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    let frame = 0
    const update = () => {
      frame = 0
      if (routeId()) return
      const { top, bottom } = scene.getBoundingClientRect()
      if (bottom <= window.innerHeight + 8) setRevealed(true)
      else if (top > window.innerHeight * 0.5) setRevealed(false)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const wasRevealed = useRef(revealed)
  useEffect(() => {
    if (revealed && !wasRevealed.current) bringIn(paperRef.current!)
    wasRevealed.current = revealed
  }, [revealed])

  const open =(event: MouseEvent<HTMLAnchorElement>, id: string) => {
    // Let the browser handle opening the section in a new tab or window.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    history.pushState(null, '', hrefFor(id))
    cinema.sync()
  }

  const back = useCallback(() => {
    if (!routeId()) return
    if (!landed.current) {
      history.back()
      return
    }
    landed.current = false
    history.replaceState(null, '', location.pathname + location.search)
    cinema.sync()
  }, [cinema])

  // Moving between sections replaces the address, so "back" still returns to the paper.
  const go = (id: string) => {
    if (!routeId()) return
    history.replaceState(null, '', hrefFor(id))
    cinema.sync()
  }

  useEffect(() => {
    if (!shown) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') back()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shown, back])

  const section = sections.find((s) => s.id === shown)

  return (
    <section
      ref={sceneRef}
      className={revealed ? 'resume is-revealed' : 'resume'}
      aria-labelledby="resume-title"
    >
      <h2 id="resume-title" className="sr-only">
        Resume
      </h2>
      {/* What shows while scrolling in: one huge, barely-there word. */}
      <p className="resume-teaser" aria-hidden="true">
        Resume
      </p>
      <Paper ref={paperRef} hidden={!revealed} onOpen={open} />

      {section &&
        createPortal(<Detail ref={detailRef} section={section} onBack={back} onGo={go} />, document.body)}
    </section>
  )
}
