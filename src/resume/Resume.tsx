import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import Detail from './Detail'
import Paper from './Paper'
import { createCinema } from './cinema'
import { sections } from './content'
import { hrefFor, routeId } from './route'
import './resume.css'

export default function Resume() {
  const sceneRef = useRef<HTMLElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<string | null>(null)
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

  const open = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
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
    <section ref={sceneRef} className="resume" aria-labelledby="resume-title">
      <div className="resume-intro">
        <h2 id="resume-title" className="resume-title">
          Resume
        </h2>
        <p className="resume-lead">The whole story on one page.</p>
        <p className="resume-hint">Pick a section to zoom in</p>
      </div>

      <Paper ref={paperRef} onOpen={open} />

      {section &&
        createPortal(<Detail ref={detailRef} section={section} onBack={back} onGo={go} />, document.body)}
    </section>
  )
}
