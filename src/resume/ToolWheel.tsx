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
// (tools&technologies-section/): five numbered cards on a ring round a dark star. It is played
// by the scroll exactly like the Skills poster: five thin lines come down from the top (where
// the Skills page's lines end), wait at card 1 while it appears, then travel round the ring to
// each card in turn, a soft-tipped line drawn from the scroll position. A camera follows the
// tip, close on each card (his "Minimal Version Control UI Poster" reference) and back out to
// the whole ring when the lines close it.

// The ring is drawn in a SIZE × SIZE world that the camera moves and scales.
const SIZE = 1000
const C = SIZE / 2
const R = 330
const CARD_W = 264
const CARD_H = 280
const LINES = 5
// World units between the lines. They keep a fixed thickness on screen (see toolWheel.css), so
// this is what sets how far apart they look as the camera moves in and out.
const PITCH = 10
// How much scrolling each part takes: the lines coming down to card 1, each card held up close,
// each trip round the ring to the next card, and the ring closing.
const COME = 720
const MOVE = 720
const STAY = 500
const FINAL = 760
const CLOSE = 360
// The tip of the drawn line fades out over this much of its length, in this many steps.
const FADE = 72
const FADE_STEPS = 12
const BAND = 70

interface Point {
  x: number
  y: number
}

interface Shot {
  x: number
  y: number
  scale: number
}

interface Segment {
  len: number
  // How far along the drawn path the tip is at the start and end of this part.
  sFrom: number
  sTo: number
  from: Shot
  to: Shot
  fromCard: number
  toCard: number
  dip?: boolean
  // A card appears once the lines have come up to it.
  reveal?: { card: number; at: number }
  // Holding on a card (-1: the whole ring).
  hold?: number
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

// Everything that depends on the size of the screen: the camera's shots, where the drawn
// path starts, and the timeline of the scroll as a list of parts.
function plan(width: number, height: number, n: number) {
  // The whole ring fills the view: its cards at the top and bottom, plus a small margin.
  const ring: Shot = { x: C, y: C, scale: Math.min(width, height) / (2 * (R + CARD_H / 2) + 40) }
  // Up close, the card leaves room below it for the pager.
  const close = Math.max(Math.min((width * 0.8) / CARD_W, (height * 0.6) / CARD_H, 3.2), ring.scale * 1.6)
  const start: Shot = { x: C, y: -110, scale: Math.min(ring.scale * 2.3, close) }
  const points = Array.from({ length: n }, (_, i) => cardAt(i, n))
  const cards: Shot[] = points.map((p) => ({ x: p.x, y: p.y, scale: close }))
  // The drawn path starts just above the top of the first shot, so scrolling draws it into view.
  const y0 = Math.floor(start.y - height / 2 / start.scale) - 40
  const arc = (2 * Math.PI * R) / n
  const entry = points[0].y - y0
  const dot = points[0].y - CARD_H / 2 - y0
  const total = entry + 2 * Math.PI * R
  const at = (i: number) => entry + i * arc

  const segments: Segment[] = [
    { len: COME, sFrom: -FADE, sTo: dot, from: start, to: cards[0], fromCard: -1, toCard: 0, reveal: { card: 0, at: 0.7 } },
    { len: STAY, sFrom: dot, sTo: dot, from: cards[0], to: cards[0], fromCard: 0, toCard: 0, hold: 0 },
  ]
  for (let i = 1; i < n; i++) {
    segments.push(
      { len: MOVE, sFrom: at(i - 1), sTo: at(i), from: cards[i - 1], to: cards[i], fromCard: i - 1, toCard: i, dip: true, reveal: { card: i, at: 0.55 } },
      { len: STAY, sFrom: at(i), sTo: at(i), from: cards[i], to: cards[i], fromCard: i, toCard: i, hold: i },
    )
  }
  segments.push(
    { len: FINAL, sFrom: at(n - 1), sTo: total, from: cards[n - 1], to: ring, fromCard: n - 1, toCard: -1 },
    { len: CLOSE, sFrom: total, sTo: total, from: ring, to: ring, fromCard: -1, toCard: -1, hold: -1 },
  )
  const length = segments.reduce((sum, part) => sum + part.len, 0)

  // The centre line the drawing reveals: straight down to card 1, then clockwise round the ring.
  let path = `M ${C} ${y0} L ${C} ${points[0].y}`
  for (let k = 1; k <= n; k++) {
    const a = ((-90 + (360 / n) * k) * Math.PI) / 180
    path += ` A ${R} ${R} 0 0 1 ${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`
  }
  return { points, segments, length, total, path }
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z" />
    </svg>
  )
}

export default function ToolWheel({ groups }: { groups: Group[] }) {
  const root = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLLIElement | null)[]>([])
  const reveal = useRef<(SVGPathElement | null)[]>([])
  const lenis = useRef<Lenis | null>(null)
  const view = useRef({ width: 0, height: 0, length: 0, still: false })
  const play = useRef<() => void>(() => {})
  // The card the camera is on (-1 for the whole ring), for the pager.
  const [current, setCurrent] = useState(-1)
  const [size, setSize] = useState({ width: 1000, height: 700 })
  const n = groups.length
  const drawn = plan(size.width, size.height, n)
  const points = drawn.points
  const bundles = bundleRoutes(points).map((points) =>
    Array.from({ length: LINES }, (_, k) => offsetPath(route(points), (k - (LINES - 1) / 2) * PITCH)),
  )

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
      const { length } = plan(width, height, n)
      view.current = { width, height, length, still }
      setSize((before) => (before.width === width && before.height === height ? before : { width, height }))
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

  // The scroll is the timeline: it decides how far the lines are drawn, which cards have
  // appeared, and where the camera is. Like the Skills poster, nothing is timed or locked.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    const scene = world.current
    if (!element || !scroller || !scene) return
    let frame = 0
    let near = -2
    let reached = -1
    const render = () => {
      frame = 0
      const { width, height, length, still } = view.current
      if (!width) return
      const { segments, total } = plan(width, height, n)
      const p = still ? length : clamp(scroller.scrollTop, 0, length)
      let part = segments[segments.length - 1]
      let u = 1
      let cursor = 0
      // How many cards the lines have come up to by now.
      let appeared = 0
      for (const next of segments) {
        if (p < cursor + next.len || next === segments[segments.length - 1]) {
          part = next
          u = clamp((p - cursor) / next.len, 0, 1)
          break
        }
        if (next.reveal) appeared = Math.max(appeared, next.reveal.card + 1)
        cursor += next.len
      }
      if (part.reveal && u >= part.reveal.at) appeared = Math.max(appeared, part.reveal.card + 1)
      if (still) appeared = n

      // The camera: smooth between shots, pulling back a little between two cards.
      const e = smooth(u)
      const dip = part.dip ? 1 - 0.3 * Math.sin(Math.PI * e) : 1
      const scale = lerp(part.from.scale, part.to.scale, e) * dip
      const x = lerp(part.from.x, part.to.x, e)
      const y = lerp(part.from.y, part.to.y, e)
      scene.style.transform = `translate3d(${-(x - C) * scale}px, ${-(y - C) * scale}px, 0) scale(${scale})`

      // The drawn line: opaque up to the tip, fading out just ahead of it, like the Skills lines.
      const tip = still ? total : lerp(part.sFrom, part.sTo, u)
      const step = FADE / FADE_STEPS
      reveal.current[0]?.setAttribute('stroke-dasharray', `${Math.max(0, Math.min(tip, total))} ${total * 2}`)
      for (let j = 0; j < FADE_STEPS; j++) {
        const from = Math.max(0, tip + j * step)
        const to = Math.min(total, tip + (j + 1) * step)
        reveal.current[j + 1]?.setAttribute('stroke-dasharray', `0 ${from} ${Math.max(0, to - from)} ${total * 2}`)
      }

      // The pager follows the card the lines are coming up to (so it isn't shown before card 1
      // has appeared), and lets go of the last card halfway through the ring closing.
      const arrive = part.reveal ? part.reveal.at : 0.5
      const focus = part.hold !== undefined ? part.hold : u < arrive ? part.fromCard : part.toCard
      if (focus !== near) {
        near = focus
        element.classList.toggle('is-zoomed', focus >= 0)
        cardEls().forEach((card) => card.classList.toggle('is-active', Number(card.dataset.i) === focus))
        setCurrent(focus)
      }
      if (appeared !== reached) {
        reached = appeared
        element.classList.toggle('has-core', appeared > 0)
        element.querySelectorAll<HTMLElement | SVGElement>('[data-i]').forEach((el) => {
          el.classList.toggle('is-in', Number(el.dataset.i) < appeared)
        })
      }
    }
    const cardEls = () => element.querySelectorAll<HTMLElement>('.tw-card')
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

  // The pager scrolls to a card's hold; past the last card, to the whole ring again.
  const goTo = (card: number) => {
    const scroller = root.current?.closest<HTMLElement>('[data-scroll]')
    const { width, height } = view.current
    let cursor = 0
    let top = 0
    for (const part of plan(width, height, n).segments) {
      if (part.hold === (card >= n ? -1 : card)) {
        top = cursor + 40
        break
      }
      cursor += part.len
    }
    if (lenis.current) lenis.current.scrollTo(top, { duration: 1.4 })
    else scroller?.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div ref={root} className="tw" data-enter>
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
                  {/* The drawn part of the line: a wide stroke along the path, revealed by the
                      scroll, whose last stretch fades out (a few dashes of falling opacity). */}
                  <mask id="tw-drawn" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={7000} height={7000}>
                    {Array.from({ length: FADE_STEPS + 1 }, (_, j) => (
                      <path
                        key={j}
                        ref={(path) => {
                          reveal.current[j] = path
                        }}
                        d={drawn.path}
                        fill="none"
                        stroke="#fff"
                        strokeOpacity={j === 0 ? 1 : 1 - (j - 0.5) / FADE_STEPS}
                        strokeWidth={BAND}
                        strokeDasharray={`0 ${drawn.total * 2}`}
                      />
                    ))}
                    {/* The cards' shapes are cut out of the drawn line, so it ends at a card's edge
                        and carries on from the other side, and is never seen inside or behind
                        a card, even while the card is still fading in. */}
                    {points.map((p, i) => (
                      <rect
                        key={i}
                        x={p.x - CARD_W / 2 - 2}
                        y={p.y - CARD_H / 2 - 2}
                        width={CARD_W + 4}
                        height={CARD_H + 4}
                        rx={24}
                        fill="#000"
                      />
                    ))}
                  </mask>
                  {/* Everything except the cards' shapes, for the hairlines behind them. */}
                  <mask id="tw-cut" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={7000} height={7000}>
                    <rect x={-3000} y={-3000} width={7000} height={7000} fill="#fff" />
                    {points.map((p, i) => (
                      <rect key={i} x={p.x - CARD_W / 2 - 2} y={p.y - CARD_H / 2 - 2} width={CARD_W + 4} height={CARD_H + 4} rx={24} fill="#000" />
                    ))}
                  </mask>
                </defs>

                {/* The hairlines and the star's glow come in with the first card. */}
                <g className="tw-rest" mask="url(#tw-cut)">
                  <circle className="tw-hair" cx={C} cy={C} r={R + 96} />
                  <circle className="tw-hair" cx={C} cy={C} r={R * 0.57} />
                  <line className="tw-hair" x1={C} y1={C - R * 0.57} x2={C} y2={C + R * 0.57} />
                  <line className="tw-hair" x1={C - R * 0.57} y1={C} x2={C + R * 0.57} y2={C} />
                  <circle cx={C} cy={C} r={R * 0.27} fill="url(#tw-glow)" />
                  <circle className="tw-hair" cx={C} cy={C} r={R * 0.25} />
                </g>

                {/* The five lines from the top, down to card 1's dot, then round the ring. */}
                <g mask="url(#tw-drawn)">
                  {bundles[0]?.map((d, k) => (
                    <path key={k} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} d={d} />
                  ))}
                  <circle className="tw-dot" cx={points[0].x} cy={points[0].y - CARD_H / 2 - 7} r={7} />
                  {Array.from({ length: LINES }, (_, k) => (
                    <circle key={k} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} cx={C} cy={C} r={R + (k - (LINES - 1) / 2) * PITCH} />
                  ))}
                </g>

                {/* Each card's own bundle running off the poster appears with its card. */}
                {bundles.slice(1).map((lines, b) => (
                  <g key={b} className="tw-exit" data-i={b + 1}>
                    {lines.map((d, k) => (
                      <path key={k} className={k % 2 ? 'tw-ring is-green' : 'tw-ring'} d={d} />
                    ))}
                  </g>
                ))}
                {points.map((p, i) => {
                  const a = Math.atan2(p.y - C, p.x - C)
                  const r1 = R * 0.57
                  const r2 = R - CARD_H / 2 - 4
                  return (
                    <g key={i} className="tw-exit" data-i={i}>
                      <line className="tw-spoke" x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)} x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)} />
                      <circle className="tw-dot" cx={C + r1 * Math.cos(a)} cy={C + r1 * Math.sin(a)} r={3.5} />
                    </g>
                  )
                })}
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
                    data-i={i}
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
