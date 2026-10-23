import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import type { Card, Link } from './content'
import { mediaFor } from './projectMedia'
import './projects.css'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const pad = (n: number) => String(n).padStart(2, '0')

// How much of the scroll between two pictures the title roll takes, around the moment
// the gap between them crosses the middle of the screen.
const ROLL = 0.35

function Eye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function LinkOut({ link }: { link: Link }) {
  return link.href ? (
    <a className="pj-link" href={link.href} target="_blank" rel="noreferrer">
      {link.label}
    </a>
  ) : (
    <span className="pj-link is-pending">{link.label}</span>
  )
}

// "Label: rest" becomes a small heading and its text.
function Point({ text }: { text: string }) {
  const at = text.indexOf(': ')
  if (at < 0 || at > 40) return <li>{text}</li>
  return (
    <li>
      <strong>{text.slice(0, at)}</strong>
      {text.slice(at + 2)}
    </li>
  )
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const PAGE_BG = 'rgb(247, 246, 242)'
const CLEAR = 'rgba(247, 246, 242, 0)'

// The transform that lays an element sitting at `to` over the rectangle `from`.
const over = (from: DOMRect, to: DOMRect) =>
  `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`

interface ProjectProps {
  card: Card
  next: Card
  // The list picture this page grows out of and shrinks back into.
  origin: HTMLImageElement | null
  // Fly from the origin on the way in.
  flyIn: boolean
  // Arriving from another project's page: the page is already there, only fill it in.
  chained: boolean
  // Set to this page's animated exit, so Back, Escape and the list all leave the same way.
  leave: { current: (() => void) | null }
  onClosed: () => void
  onNext: () => void
}

// One project's own page: the picture from the list, the poster, and the write-up, with
// the facts in a column on the right.
function Project({ card, next, origin, flyIn, chained, leave, onClosed, onNext }: ProjectProps) {
  const { thumb, poster } = mediaFor(card.title)
  const root = useRef<HTMLDivElement>(null)
  const lead = useRef<HTMLImageElement>(null)
  const back = useRef<HTMLButtonElement>(null)

  // Everything on the page except the travelling picture, which fades around it.
  const rest = () => [...root.current!.querySelectorAll<HTMLElement>('.pj-page-front, .pj-poster, .pj-notes')]

  // In: the list picture itself glides to its place at the top while the page fills in
  // around it. Nothing appears at the destination before it lands.
  useLayoutEffect(() => {
    const page = root.current!
    page.scrollTo(0, 0)
    back.current?.focus({ preventScroll: true })
    if (prefersReducedMotion()) return
    const picture = lead.current
    // Measure at rest: drop anything a previous run started (React runs this twice in dev).
    for (const element of [page, picture, ...rest()]) element?.getAnimations().forEach((animation) => animation.cancel())
    if (flyIn && origin && picture) {
      picture.animate([{ transform: over(origin.getBoundingClientRect(), picture.getBoundingClientRect()) }, { transform: 'none' }], {
        duration: 950,
        easing: EASE,
      })
      if (!chained) page.animate([{ backgroundColor: CLEAR }, { backgroundColor: PAGE_BG }], { duration: 600, easing: 'ease' })
      for (const part of rest()) {
        part.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 550, easing: 'ease', fill: 'backwards' })
      }
    } else {
      page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease' })
    }
  }, [card, chained, flyIn, origin])

  // Next project: this page empties out the way it filled in, then the next project's
  // picture glides up from the list just like a click on it would.
  const goNext = () => {
    const page = root.current!
    if (prefersReducedMotion()) return onNext()
    page.style.overflow = 'hidden'
    for (const part of [lead.current, ...rest()]) {
      part?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease', fill: 'forwards' })
    }
    // The page itself stays, so the list never shows through while it moves on.
    window.setTimeout(onNext, 380)
  }

  // Out: the reverse. The page empties, and the picture glides back into its place in
  // the list, which is shown again only once it has landed.
  useEffect(() => {
    let leaving = false
    leave.current = () => {
      if (leaving) return
      leaving = true
      const page = root.current!
      const picture = lead.current
      const target = origin?.getBoundingClientRect()
      const onScreen = target && target.bottom > 0 && target.top < window.innerHeight
      if (prefersReducedMotion() || !picture || !target || !onScreen) {
        page.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).finished.then(onClosed, onClosed)
        return
      }
      page.style.overflow = 'hidden'
      for (const part of rest()) part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease', fill: 'forwards' })
      page.animate([{ backgroundColor: PAGE_BG }, { backgroundColor: CLEAR }], { duration: 600, delay: 250, easing: 'ease', fill: 'forwards' })
      picture
        .animate([{ transform: 'none' }, { transform: over(target, picture.getBoundingClientRect()) }], {
          duration: 950,
          easing: EASE,
          fill: 'forwards',
        })
        .finished.then(onClosed, onClosed)
    }
    return () => {
      leave.current = null
    }
  }, [leave, onClosed, origin])

  return (
    <div ref={root} className="pj-page" role="dialog" aria-modal="true" aria-label={card.title}>
      {/* Over the pictures, in difference blend, so it stays readable on any of them. */}
      <div className="pj-page-front">
        <header className="pj-page-head">
          <h3>{card.title}</h3>
          <p>{card.type}</p>
          <p>{card.meta}</p>
        </header>
        <button ref={back} type="button" className="pj-back" onClick={() => leave.current?.()}>
          <span aria-hidden="true" />
          Back
        </button>
        <dl className="pj-facts">
          {card.overview || card.text ? (
            <div>
              <dt>Overview</dt>
              <dd>{card.overview ?? card.text}</dd>
            </div>
          ) : null}
          {card.meta && (
            <div>
              <dt>Duration</dt>
              <dd>{card.meta}</dd>
            </div>
          )}
          {card.category && (
            <div>
              <dt>Category</dt>
              <dd>{card.category}</dd>
            </div>
          )}
          <div>
            <dt>Visit project</dt>
            <dd>{card.links?.length ? card.links.map((link) => <LinkOut key={link.label} link={link} />) : 'Not live yet'}</dd>
          </div>
        </dl>
      </div>

      <div className="pj-page-flow">
        {/* The list's picture stays on top, where it flies to; the poster follows. */}
        {thumb && <img ref={lead} className="pj-lead" src={thumb} alt="" />}
        {poster && <img className="pj-poster" src={poster} alt={`${card.title} poster`} />}

        <div className="pj-notes">
          {card.notes?.map((note) => (
            <section key={note.heading}>
              <h4>{note.heading}</h4>
              <ul>
                {note.points.map((point) => (
                  <Point key={point} text={point} />
                ))}
              </ul>
            </section>
          ))}
          {card.tags && (
            <section>
              <h4>Stack</h4>
              <p className="pj-stack">{card.tags.join(', ')}</p>
            </section>
          )}
          <button type="button" className="pj-next" onClick={goNext}>
            <span>Next project</span>
            <em>{next.title}</em>
          </button>
        </div>
      </div>
    </div>
  )
}

// The Projects page, after quangdinh.im/projects: one column of pictures scrolls through
// the middle, the title and category of the one at the centre roll by at the sides, and
// the section's giant title stays faint behind. A picture opens its project's page.
export default function Projects({ cards }: { cards: Card[] }) {
  const root = useRef<HTMLDivElement>(null)
  const titles = useRef<(HTMLElement | null)[]>([])
  const categories = useRef<(HTMLElement | null)[]>([])
  const cursor = useRef<HTMLDivElement>(null)
  const crosses = useRef<(HTMLElement | null)[]>([])
  const [open, setOpen] = useState<{ index: number; flyIn: boolean; chained?: boolean } | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const leave = useRef<(() => void) | null>(null)

  // Rolls the side labels with the scroll: each picture's label sits in place while it's
  // at the centre, and slides out as the gap to the next one crosses the middle.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    if (!element || !scroller) return
    let frame = 0
    const update = () => {
      frame = 0
      // A quarter turn for every picture scrolled past, in opposite directions.
      const turn = scroller.scrollTop * 0.15
      crosses.current.forEach((cross, k) => {
        if (cross) cross.style.transform = `rotate(${(k ? turn : -turn).toFixed(1)}deg)`
      })
      const items = [...element.querySelectorAll<HTMLElement>('.pj-item')]
      const box = scroller.getBoundingClientRect()
      const middle = box.top + box.height / 2
      const centres = items.map((item) => {
        const r = item.getBoundingClientRect()
        return r.top + r.height / 2
      })
      let at = 0
      if (middle >= centres[centres.length - 1]) at = centres.length - 1
      else if (middle > centres[0]) {
        const i = centres.findIndex((c) => c > middle) - 1
        at = i + (middle - centres[i]) / (centres[i + 1] - centres[i])
      }
      items.forEach((_, j) => {
        // How far the roll from label j-1 to j has gone (0 to 1), and from j to j+1.
        const into = clamp((at - (j - 0.5)) / ROLL + 0.5, 0, 1)
        const out = clamp((at - (j + 0.5)) / ROLL + 0.5, 0, 1)
        const offset = at < j ? 1 - into : -out
        for (const label of [titles.current[j], categories.current[j]]) {
          if (label) label.style.transform = `translateY(${(offset * 100).toFixed(2)}%)`
        }
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // Escape leaves a project before it would close the whole section.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  const thumbAt = (index: number) => root.current?.querySelectorAll<HTMLButtonElement>('.pj-thumb')[index] ?? null

  // While a project is open its list picture is away on the project's page.
  const hide = (button: HTMLButtonElement | null, hidden: boolean) => {
    const picture = button?.querySelector('img')
    if (picture) picture.style.visibility = hidden ? 'hidden' : ''
  }

  const show = (index: number, button: HTMLButtonElement | null) => {
    hideCursor()
    opener.current = button
    hide(button, true)
    setOpen({ index, flyIn: true })
  }

  const close = () => leave.current?.()

  const closed = useCallback(() => {
    hide(opener.current, false)
    setOpen(null)
    opener.current?.focus({ preventScroll: true })
  }, [])

  // "Next project": the list quietly scrolls to that project behind the page, so Back
  // returns into it.
  const showNext = (index: number) => {
    hide(opener.current, false)
    const button = thumbAt(index)
    button?.scrollIntoView({ block: 'center' })
    opener.current = button
    hide(button, true)
    setOpen({ index, flyIn: !prefersReducedMotion(), chained: true })
  }

  // The "See detail" cursor follows the pointer over the pictures.
  const moveCursor = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !cursor.current) return
    cursor.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
    cursor.current.classList.add('is-on')
  }
  const hideCursor = () => cursor.current?.classList.remove('is-on')

  return (
    <div ref={root} className="pj">
      <div className="pj-stage" aria-hidden="true">
        <div className="pj-roll pj-roll--title">
          {cards.map((card, i) => (
            <p
              key={card.title}
              ref={(element) => {
                titles.current[i] = element
              }}
            >
              {card.title}
            </p>
          ))}
        </div>
        <div className="pj-roll pj-roll--category">
          {cards.map((card, i) => (
            <p
              key={card.title}
              ref={(element) => {
                categories.current[i] = element
              }}
            >
              {card.category}
            </p>
          ))}
        </div>
        {/* Two big crosses that turn with the scroll, like a ship's wheel. */}
        <span
          ref={(element) => {
            crosses.current[0] = element
          }}
          className="pj-cross pj-cross--left"
        />
        <span
          ref={(element) => {
            crosses.current[1] = element
          }}
          className="pj-cross pj-cross--right"
        />
      </div>

      <ol className="pj-column" data-enter>
        {cards.map((card, i) => {
          const { thumb } = mediaFor(card.title)
          return (
            <li key={card.title} className="pj-item">
              <button
                type="button"
                className="pj-thumb"
                aria-label={`${card.title}, ${card.category ?? card.meta}. See details`}
                onClick={(event) => show(i, event.currentTarget)}
                onPointerMove={moveCursor}
                onPointerLeave={hideCursor}
              >
                {thumb ? <img src={thumb} alt="" loading={i < 2 ? 'eager' : 'lazy'} /> : <span>{card.title}</span>}
              </button>
              {/* On phones, where the side labels don't fit. */}
              <p className="pj-caption" aria-hidden="true">
                <em>{card.title}</em>
                <span>{card.category}</span>
              </p>
            </li>
          )
        })}
      </ol>

      <div ref={cursor} className="pj-cursor" aria-hidden="true">
        <span className="pj-cursor-eye">
          <Eye />
        </span>
        See detail
      </div>

      {open && (
        <Project
          key={open.index}
          card={cards[open.index]}
          next={cards[(open.index + 1) % cards.length]}
          origin={opener.current?.querySelector('img') ?? null}
          flyIn={open.flyIn}
          chained={open.chained ?? false}
          leave={leave}
          onClosed={closed}
          onNext={() => showNext((open.index + 1) % cards.length)}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {open ? `${cards[open.index].title}, ${pad(open.index + 1)} of ${pad(cards.length)}` : ''}
      </p>
    </div>
  )
}
