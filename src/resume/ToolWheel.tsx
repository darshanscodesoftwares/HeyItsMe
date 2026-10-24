import Lenis from 'lenis'
import { useEffect, useRef, useState } from 'react'
import type { Group } from './content'
import { offsetPath, type Cubic } from './SkillRiver'
import './toolWheel.css'

const pad = (n: number) => String(n).padStart(2, '0')
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const smooth = (u: number) => u * u * (3 - 2 * u)
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The tools poster, after his "Circular Workflow Infographic with Five UI Cards" reference
// (tools&technologies-section/): five numbered cards on a ring round a dark star, with thin
// bundles of lines running round the ring and off to the edges. The scroll plays it like a
// camera: the whole ring, then each card up close in turn (his "Minimal Version Control UI
// Poster" reference), then the whole ring again.

// The ring is drawn in a SIZE × SIZE world that the camera moves and scales.
const SIZE = 1000
const C = SIZE / 2
const R = 330
const CARD_W = 236
const CARD_H = 214
const LINES = 5
const PITCH = 7
// How much scrolling each part takes: the whole ring at the start, each move of the camera,
// each card held up close, and the whole ring again at the end.
const INTRO = 8
const OPEN = 260
const MOVE = 760
const STAY = 520
const CLOSE = 360

interface Point {
  x: number
  y: number
}

const cardAt = (i: number, n: number): Point => {
  const a = ((-90 + (360 / n) * i) * Math.PI) / 180
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }
}

// An orthogonal route with rounded corners, as curves the parallel lines can follow.
function route(points: Point[], radius = 46): Cubic[] {
  const k = 0.5523
  const curves: Cubic[] = []
  let at = points[0]
  for (let i = 1; i < points.length; i++) {
    const to = points[i]
    const next = points[i + 1]
    const len = Math.hypot(to.x - at.x, to.y - at.y) || 1
    const dir = { x: (to.x - at.x) / len, y: (to.y - at.y) / len }
    if (!next) {
      curves.push([at, at, to, to])
      break
    }
    const len2 = Math.hypot(next.x - to.x, next.y - to.y) || 1
    const dir2 = { x: (next.x - to.x) / len2, y: (next.y - to.y) / len2 }
    const r = Math.min(radius, len / 2, len2 / 2)
    const enter = { x: to.x - dir.x * r, y: to.y - dir.y * r }
    const leave = { x: to.x + dir2.x * r, y: to.y + dir2.y * r }
    curves.push([at, at, enter, enter])
    curves.push([enter, { x: enter.x + dir.x * r * k, y: enter.y + dir.y * r * k }, { x: leave.x - dir2.x * r * k, y: leave.y - dir2.y * r * k }, leave])
    at = leave
  }
  return curves
}

// Where the bundles leave each card and how they run off the poster, like the reference:
// straight up from the top card (where the Skills page's lines end, at the centre, so they
// seem to carry on into this page), straight out to the right, down and away from the two
// bottom cards, and out to the left from the last one.
function bundleRoutes(cards: Point[]): Point[][] {
  const [top, right, lowRight, lowLeft, left] = cards
  const h = CARD_H / 2
  const w = CARD_W / 2
  const far = 1900
  return [
    [{ x: top.x, y: top.y - h }, { x: top.x, y: -far }],
    [{ x: right.x + w, y: right.y }, { x: far, y: right.y }],
    [{ x: lowRight.x, y: lowRight.y + h }, { x: lowRight.x, y: lowRight.y + h + 80 }, { x: lowRight.x + 300, y: lowRight.y + h + 80 }, { x: lowRight.x + 300, y: far }],
    [{ x: lowLeft.x, y: lowLeft.y + h }, { x: lowLeft.x, y: lowLeft.y + h + 70 }, { x: -far, y: lowLeft.y + h + 70 }],
    [{ x: left.x - w, y: left.y }, { x: left.x - w - 70, y: left.y }, { x: left.x - w - 70, y: left.y + 330 }, { x: -far, y: left.y + 330 }],
  ].slice(0, cards.length)
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z" />
    </svg>
  )
}

interface Shot {
  x: number
  y: number
  scale: number
  card: number
}

export default function ToolWheel({ groups }: { groups: Group[] }) {
  const root = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLLIElement | null)[]>([])
  const lenis = useRef<Lenis | null>(null)
  const view = useRef({ width: 0, height: 0, length: 0, still: false })
  const play = useRef<() => void>(() => {})
  // The card the camera is on (-1 for the whole ring), for the pager.
  const [current, setCurrent] = useState(-1)
  const n = groups.length
  const points = groups.map((_, i) => cardAt(i, n))
  const bundles = bundleRoutes(points).map((points) =>
    Array.from({ length: LINES }, (_, k) => offsetPath(route(points), (k - (LINES - 1) / 2) * PITCH)),
  )

  // The camera's shots, in order: the ring, each card, the ring again.
  const shots = (): Shot[] => {
    const { width, height } = view.current
    const ring = { x: C, y: C, scale: (Math.min(width, height) / SIZE) * 0.94, card: -1 }
    // Up close, the card leaves room below it for the pager.
    const close = Math.min((width * 0.8) / CARD_W, (height * 0.6) / CARD_H, 3.2)
    return [ring, ...points.map((p, i) => ({ x: p.x, y: p.y, scale: Math.max(close, ring.scale * 1.6), card: i })), ring]
  }

  // Where each shot's hold starts on the timeline (the scroll position).
  const holdAt = (shot: number) => (shot === 0 ? 0 : OPEN + shot * MOVE + (shot - 1) * STAY)

  // Size the scene to the screen, and make the page as long as the whole timeline.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    if (!element || !scroller) return
    const measure = () => {
      const still = prefersReducedMotion()
      const body = element.parentElement as HTMLElement
      const pin =
        body.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop + parseFloat(getComputedStyle(body).paddingTop)
      // The scene runs the full width of the screen, past the page's column. Measured from the
      // column, not the scene: the scene is already widened by this, so measuring it would
      // give 0 on the next pass and snap it back to the column's width.
      element.style.setProperty('--bleed', `${(scroller.clientWidth - body.clientWidth) / 2}px`)
      const width = scroller.clientWidth
      const height = still ? Math.min(width, 720) : Math.max(320, scroller.clientHeight - pin)
      const length = OPEN + (n + 1) * MOVE + n * STAY + CLOSE
      view.current = { width, height, length, still }
      element.classList.toggle('is-static', still)
      if (still) {
        element.style.removeProperty('margin-top')
        element.style.height = `${height}px`
      } else {
        // As on the Skills page: the track starts at the very top of the page, so the scroll
        // position is the time, and the pinned stage keeps the scene where it sat.
        element.style.setProperty('--pin', `${pin}px`)
        element.style.setProperty('--stage', `${scroller.clientHeight}px`)
        element.style.marginTop = `${-pin}px`
        element.style.height = `${length + scroller.clientHeight}px`
      }
      play.current()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [n])

  // The scroll decides the shot: hold on one, or move between two, the camera pulling back a
  // little as it passes from one card to the next.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    const scene = world.current
    if (!element || !scroller || !scene) return
    let frame = 0
    let shown = -2
    const render = () => {
      frame = 0
      const { length, still } = view.current
      const list = shots()
      const p = still ? 0 : clamp(scroller.scrollTop, 0, length)
      let shot = list[0]
      let near = -1
      let cursor = OPEN
      if (p >= OPEN) {
        shot = list[list.length - 1]
        for (let i = 1; i < list.length; i++) {
          const from = list[i - 1]
          const to = list[i]
          if (p < cursor + MOVE) {
            const u = smooth((p - cursor) / MOVE)
            const dip = from.card >= 0 && to.card >= 0 ? 1 - 0.3 * Math.sin(Math.PI * u) : 1
            shot = { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u), scale: lerp(from.scale, to.scale, u) * dip, card: -1 }
            near = u < 0.5 ? from.card : to.card
            break
          }
          cursor += MOVE
          const stay = i === list.length - 1 ? CLOSE : STAY
          if (p < cursor + stay || i === list.length - 1) {
            shot = to
            near = to.card
            break
          }
          cursor += stay
        }
      }
      // At the very top only the incoming lines show; the first scroll brings the rest in.
      element.classList.toggle('is-intro', !still && scroller.scrollTop <= INTRO)
      scene.style.transform = `translate3d(${-(shot.x - C) * shot.scale}px, ${-(shot.y - C) * shot.scale}px, 0) scale(${shot.scale})`
      if (near !== shown) {
        shown = near
        element.classList.toggle('is-zoomed', near >= 0)
        cards.current.forEach((card, i) => card?.classList.toggle('is-active', i === near))
        setCurrent(near)
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    play.current = schedule
    schedule()
    scroller.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      play.current = () => {}
    }
    // shots() reads only refs and the groups' count.
  }, [n])

  // Smooth, gliding scroll, as on the Skills and Projects pages.
  useEffect(() => {
    const scroller = root.current?.closest<HTMLElement>('[data-scroll]')
    if (!scroller || prefersReducedMotion()) return
    const glide = new Lenis({
      wrapper: scroller,
      content: scroller.firstElementChild as HTMLElement,
      lerp: 0.075,
      wheelMultiplier: 0.9,
      autoRaf: true,
    })
    lenis.current = glide
    return () => {
      glide.destroy()
      lenis.current = null
    }
  }, [])

  // The pager scrolls to a card's hold, or past the last one back to the whole ring.
  const goTo = (card: number) => {
    const scroller = root.current?.closest<HTMLElement>('[data-scroll]')
    const top = holdAt(card + 1) + 40
    if (lenis.current) lenis.current.scrollTo(top, { duration: 1.4 })
    else scroller?.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div ref={root} className="tw is-intro" data-enter>
      <div className="tw-stage">
        <div className="tw-window">
          <div className="tw-view">
            <div ref={world} className="tw-world">
              <svg className="tw-lines" viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true">
                <defs>
                  <radialGradient id="tw-glow">
                    <stop offset="0" stopColor="#fbf8f2" />
                    <stop offset="1" stopColor="#fbf8f2" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* On arrival only this shows: the lines coming down from the Skills page, ending
                    in a dot where the first card will be. The first scroll fades the rest in. */}
                <g className="tw-entry">
                  {bundles[0]?.map((d, k) => (
                    <path key={k} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} d={d} />
                  ))}
                  <circle className="tw-dot" cx={points[0].x} cy={points[0].y - CARD_H / 2} r={7} />
                </g>
                <g className="tw-rest">
                  <circle className="tw-hair" cx={C} cy={C} r={R + 96} />
                  <circle className="tw-hair" cx={C} cy={C} r={R * 0.57} />
                  <line className="tw-hair" x1={C} y1={C - R * 0.57} x2={C} y2={C + R * 0.57} />
                  <line className="tw-hair" x1={C - R * 0.57} y1={C} x2={C + R * 0.57} y2={C} />
                  <circle cx={C} cy={C} r={R * 0.27} fill="url(#tw-glow)" />
                  <circle className="tw-hair" cx={C} cy={C} r={R * 0.25} />
                  {Array.from({ length: LINES }, (_, k) => (
                    <circle key={k} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} cx={C} cy={C} r={R + (k - (LINES - 1) / 2) * PITCH} />
                  ))}
                  {bundles.slice(1).map((lines, b) =>
                    lines.map((d, k) => <path key={`${b}-${k}`} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} d={d} />),
                  )}
                  {points.map((p, i) => {
                    const a = Math.atan2(p.y - C, p.x - C)
                    const r1 = R * 0.57
                    const r2 = R - CARD_H / 2 - 4
                    return (
                      <g key={i}>
                        <line className="tw-spoke" x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)} x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)} />
                        <circle className="tw-dot" cx={C + r1 * Math.cos(a)} cy={C + r1 * Math.sin(a)} r={3.5} />
                      </g>
                    )
                  })}
                </g>
              </svg>
              <Star className="tw-core" />

              <ol className="tw-cards">
                {groups.map((group, i) => (
                  <li
                    key={group.name}
                    ref={(card) => {
                      cards.current[i] = card
                    }}
                    className="tw-card"
                    style={{ left: points[i].x, top: points[i].y }}
                  >
                    <p className="tw-num">
                      {i + 1}
                      <Star className="tw-spark" />
                    </p>
                    <h3 className="tw-title">{group.name}</h3>
                    <ul className="tw-chips">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Shows while the camera is on a card, as in his "01 / 05" reference. */}
          <div className="tw-pager" aria-hidden={current < 0}>
            <div className="tw-pips">
              {groups.map((group, i) => (
                <button
                  key={group.name}
                  type="button"
                  className={i === current ? 'is-on' : undefined}
                  aria-label={group.name}
                  tabIndex={current < 0 ? -1 : 0}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <span className="tw-count">
              {pad(Math.max(0, current) + 1)} / {pad(n)}
            </span>
            <button
              type="button"
              className="tw-next"
              aria-label={current === n - 1 ? 'Back to all tools' : 'Next tool'}
              tabIndex={current < 0 ? -1 : 0}
              onClick={() => goTo(current + 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
