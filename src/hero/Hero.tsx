import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import DialogText from './DialogText'
import { pages } from './pages'
import { useTypewriter } from './useTypewriter'
import './hero.css'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad = (n: number) => String(n).padStart(2, '0')

export default function Hero() {
  const trackRef = useRef<HTMLElement>(null)
  const indexRef = useRef(0)
  const [active, setActive] = useState(() => ({ index: 0, animate: !prefersReducedMotion() }))
  const [hasScrolled, setHasScrolled] = useState(false)
  const page = pages[active.index]
  const typing = useTypewriter(page.text, active.animate)
  const isLast = active.index === pages.length - 1

  // The hero is a tall track with a sticky stage inside. How far the track has
  // been scrolled decides which page is showing.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    let first = true
    const update = () => {
      frame = 0
      const scrollable = track.offsetHeight - window.innerHeight
      const progress = scrollable > 0 ? -track.getBoundingClientRect().top / scrollable : 0
      const index = Math.min(pages.length - 1, Math.max(0, Math.floor(progress * pages.length)))
      const previous = indexRef.current
      if (index !== previous) {
        indexRef.current = index
        // Type the text when moving forward; going back (or reloading mid-way) shows it whole.
        setActive({ index, animate: !first && index > previous && !prefersReducedMotion() })
      }
      first = false
      if (window.scrollY > 0) setHasScrolled(true)
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

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
    if (index >= pages.length) {
      document.getElementById('after-hero')?.scrollIntoView({ behavior })
      return
    }
    const pageScroll = (track.offsetHeight - window.innerHeight) / pages.length
    const top = track.getBoundingClientRect().top + window.scrollY + (index + 0.05) * pageScroll
    window.scrollTo({ top, behavior })
  }, [])

  // Like a game dialog: the first press finishes the line, the next one moves on.
  const advance = () => (typing.done ? goTo(active.index + 1) : typing.finish())

  return (
    <section
      ref={trackRef}
      className="hero"
      style={{ '--pages': pages.length } as CSSProperties}
      aria-label="Introduction"
    >
      <div className="hero-stage">
        <h1 className="hero-backdrop">
          <span>Fullstack</span> <span>Developer</span>
        </h1>

        <button type="button" className="hero-skip" onClick={() => goTo(pages.length)}>
          Skip intro
        </button>

        <div className="hero-figure" aria-hidden="true">
          {pages.map((p, i) => (
            <img
              key={p.pose}
              className={i === active.index ? 'hero-pose is-active' : 'hero-pose'}
              src={p.src}
              srcSet={p.srcSet}
              sizes="(max-width: 760px) 92vw, 64svh"
              alt=""
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          ))}
        </div>

        <div className="hero-dialog">
          <div className="dialog-box" onClick={advance}>
            {/* Hidden on the first page, where the dialog itself introduces Priyadarshan. */}
            <span
              className={active.index === 0 ? 'dialog-name is-hidden' : 'dialog-name'}
              aria-hidden={active.index === 0 || undefined}
            >
              Priyadarshan
            </span>
            <div className="dialog-text" aria-hidden="true">
              {/* Every page sits in the same grid cell so the box keeps the height of the longest one. */}
              {pages.map((p, i) => (
                <p key={p.pose} className={i === active.index ? 'dialog-page is-active' : 'dialog-page'}>
                  {i === active.index ? <DialogText text={p.text} count={typing.count} /> : p.text}
                </p>
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              {page.text}
            </p>
            <button
              type="button"
              className="dialog-next"
              data-ready={typing.done}
              aria-label={isLast ? 'Continue to the rest of the page' : 'Next'}
              onClick={(event) => {
                event.stopPropagation()
                advance()
              }}
            >
              <span aria-hidden="true">▼</span>
            </button>
          </div>

          <div className="dialog-meta">
            <ol className="dialog-progress" aria-label="Introduction progress">
              {pages.map((p, i) => (
                <li key={p.pose}>
                  <button
                    type="button"
                    aria-label={`Part ${i + 1} of ${pages.length}`}
                    aria-current={i === active.index ? 'step' : undefined}
                    onClick={() => goTo(i)}
                  />
                </li>
              ))}
            </ol>
            <span className="dialog-count">
              {pad(active.index + 1)} / {pad(pages.length)}
            </span>
          </div>

          <p className={hasScrolled ? 'hero-hint is-hidden' : 'hero-hint'} aria-hidden="true">
            Scroll to continue
          </p>
        </div>
      </div>
    </section>
  )
}
