import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import type { Card, Link } from './content'
import { mediaFor } from './projectMedia'
import './projects.css'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const pad = (n: number) => String(n).padStart(2, '0')

// How much of the scroll between two pictures the title roll takes, around the moment
// the gap between them crosses the middle of the screen.
const ROLL = 0.35

// Cuddalore, where he's based, and his local time.
const COORDS = '11.7480°N 79.7714°E'
const ZONE = 'Asia/Kolkata'

function Clock() {
  const format = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONE })
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => part.value)
  const [time, setTime] = useState(format)
  useEffect(() => {
    const timer = window.setInterval(() => setTime(format()), 10_000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <span className="pj-clock" aria-label={`${time[0]}:${time[1]} in India`}>
      {time[0]}
      <span aria-hidden="true">:</span>
      {time[1]}
    </span>
  )
}

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

interface ProjectProps {
  card: Card
  next: Card
  // The list picture that was clicked, to fly from; null when there's nothing to fly from.
  from: DOMRect | null
  onBack: () => void
  onNext: () => void
}

// One project's own page: the poster, the picture from the list, and the write-up, with
// the facts in a column on the right.
function Project({ card, next, from, onBack, onNext }: ProjectProps) {
  const { thumb, poster } = mediaFor(card.title)
  const root = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const back = useRef<HTMLButtonElement>(null)

  // The clicked picture flies into the poster's place and fades into it.
  useLayoutEffect(() => {
    back.current?.focus({ preventScroll: true })
    root.current?.scrollTo(0, 0)
    const target = posterRef.current
    if (!from || !target || !thumb || prefersReducedMotion()) return
    const to = target.getBoundingClientRect()
    const ghost = document.createElement('img')
    ghost.src = thumb
    ghost.className = 'pj-ghost'
    Object.assign(ghost.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` })
    root.current!.append(ghost)
    const shift = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
    const easing = 'cubic-bezier(0.7, 0, 0.2, 1)'
    ghost.animate([{ transform: shift }, { transform: 'none' }], { duration: 900, easing })
    ghost.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1150, fill: 'forwards' }).finished.then(
      () => ghost.remove(),
      () => ghost.remove(),
    )
    target.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: 1150, easing: 'ease' })
  }, [card, from, thumb])

  return (
    <div ref={root} className="pj-page" role="dialog" aria-modal="true" aria-label={card.title}>
      {/* Over the pictures, in difference blend, so it stays readable on any of them. */}
      <div className="pj-page-front">
        <header className="pj-page-head">
          <h3>{card.title}</h3>
          <p>{card.type}</p>
          <p>{card.meta}</p>
        </header>
        <button ref={back} type="button" className="pj-back" onClick={onBack}>
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
        {poster && <img ref={posterRef} className="pj-poster" src={poster} alt={`${card.title} poster`} />}
        {thumb && <img className="pj-still" src={thumb} alt="" />}

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
          <button type="button" className="pj-next" onClick={onNext}>
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
  const [open, setOpen] = useState<{ index: number; from: DOMRect | null } | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)

  // Rolls the side labels with the scroll: each picture's label sits in place while it's
  // at the centre, and slides out as the gap to the next one crosses the middle.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    if (!element || !scroller) return
    let frame = 0
    const update = () => {
      frame = 0
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

  const show = (index: number, button: HTMLButtonElement | null) => {
    opener.current = button
    const picture = button?.querySelector('img')
    setOpen({ index, from: picture ? picture.getBoundingClientRect() : null })
  }

  const close = () => {
    setOpen(null)
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }))
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
        <p className="pj-corner pj-corner--left">{COORDS}</p>
        <p className="pj-corner pj-corner--right">
          <Clock />
        </p>
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
          from={open.from}
          onBack={close}
          onNext={() => {
            opener.current = root.current?.querySelectorAll<HTMLButtonElement>('.pj-thumb')[(open.index + 1) % cards.length] ?? null
            setOpen({ index: (open.index + 1) % cards.length, from: null })
          }}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {open ? `${cards[open.index].title}, ${pad(open.index + 1)} of ${pad(cards.length)}` : ''}
      </p>
    </div>
  )
}
