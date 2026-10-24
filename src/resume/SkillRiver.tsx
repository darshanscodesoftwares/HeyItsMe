import Lenis from 'lenis'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Group } from './content'
import './skillRiver.css'

const pad = (n: number) => String(n).padStart(2, '0')
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The skills poster, after his "Skills Journey Infographic" reference
// (skill-section/skill-section-tree-scroll-navigation-idea/): five thin black lines run
// down the middle, stepping from side to side in rounded S-bends, so they pass close by
// each section's dot.

// Half the distance between the lines' two runs. Phones keep a single straight run.
const SWAY = 72
const LINES = 5
// The poster is played by the scroll, like a timeline, while it stays pinned in view: for each
// section the lines wait at its dot while its skills come in, one row for every ROW_PX of
// scrolling; then they travel on to the next dot, over TRAVEL of the distance between the two.
const ROW_PX = 84
const TRAVEL = 0.5
const WHEEL = 0.9

interface Point {
  x: number
  y: number
}

type Cubic = [Point, Point, Point, Point]

const straight = (a: Point, b: Point): Cubic => [
  a,
  { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
  { x: a.x + ((b.x - a.x) * 2) / 3, y: a.y + ((b.y - a.y) * 2) / 3 },
  b,
]

// The middle line's path: straight down on the side of each dot, and between two dots a
// rounded S over to the other side, halfway between them. After the last dot it steps
// back to the middle and runs down to the end.
function middleLine(dots: { y: number; side: number }[], mid: number, sway: number, end: number): Cubic[] {
  if (!dots.length) return []
  const run = (side: number) => mid + side * sway
  const curves: Cubic[] = []
  // The lines come out of the first dot.
  let at: Point = { x: run(dots[0].side), y: dots[0].y }
  const bend = (to: number, centre: number, height: number) => {
    const start = { x: at.x, y: centre - height / 2 }
    const finish = { x: to, y: centre + height / 2 }
    if (start.y > at.y) curves.push(straight(at, start))
    curves.push([start, { x: start.x, y: centre }, { x: finish.x, y: centre }, finish])
    at = finish
  }
  dots.forEach((dot, i) => {
    const next = dots[i + 1]
    if (!next || next.side === dot.side || sway === 0) return
    const gap = next.y - dot.y
    bend(run(next.side), dot.y + gap / 2, Math.min(110, gap * 0.6))
  })
  const last = dots[dots.length - 1]
  const tail = end - last.y
  if (sway > 0) bend(mid, last.y + Math.min(160, tail * 0.45), Math.min(110, tail * 0.35))
  curves.push(straight(at, { x: at.x, y: end }))
  return curves
}

// The path moved sideways along its normal, as a polyline, so parallel lines stay evenly
// apart through every bend.
function offsetPath(curves: Cubic[], distance: number) {
  const points: string[] = []
  for (const [a, b, c, d] of curves) {
    const steps = Math.max(4, Math.ceil(Math.hypot(d.x - a.x, d.y - a.y) / 5))
    for (let s = points.length ? 1 : 0; s <= steps; s++) {
      const u = s / steps
      const v = 1 - u
      const x = v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * d.x
      const y = v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * d.y
      let dx = 3 * v * v * (b.x - a.x) + 6 * v * u * (c.x - b.x) + 3 * u * u * (d.x - c.x)
      let dy = 3 * v * v * (b.y - a.y) + 6 * v * u * (c.y - b.y) + 3 * u * u * (d.y - c.y)
      // At an end whose control point sits on it, take the direction from the chord.
      if (Math.hypot(dx, dy) < 1e-6) {
        dx = d.x - a.x
        dy = d.y - a.y
      }
      const length = Math.hypot(dx, dy) || 1
      points.push(`${(x + (dy / length) * distance).toFixed(1)} ${(y - (dx / length) * distance).toFixed(1)}`)
    }
  }
  return points.length ? `M ${points.join(' L ')}` : ''
}

export default function SkillRiver({ groups }: { groups: Group[] }) {
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const poster = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLElement | null)[]>([])
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const reveal = useRef<SVGRectElement>(null)
  const [lines, setLines] = useState({ paths: [] as string[], top: 0, width: 0, height: 0, weight: 2 })
  // How many sections the lines have reached; each one appears when they get to its dot.
  const [reached, setReached] = useState(1)
  const rowsShown = useRef<number[]>([])
  const rowCounts = useRef<number[]>([])
  // Everything the scroll needs to play the poster, measured from the layout.
  const timeline = useRef({ dots: [] as number[], end: 0, anchor: 0, window: 0, height: 0, length: 0 })
  const play = useRef<() => void>(() => {})

  const showRows = (i: number) => {
    items.current[i]?.querySelectorAll<HTMLElement>('.journey-chips li').forEach((chip) => {
      chip.classList.toggle('is-on', Number(chip.dataset.row) < (rowsShown.current[i] ?? 0))
    })
  }

  // Lay the sections on an even step, trace the lines past their dots, and work out how
  // much scrolling the whole poster takes; again whenever the layout moves.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    const board = poster.current
    if (!element || !scroller || !board) return
    const still = prefersReducedMotion()
    // Layout positions, not on-screen ones: sections may still be fading in (a transform).
    const yOf = (node: HTMLElement) => {
      let y = node.offsetTop + node.offsetHeight / 2
      for (let parent = node.offsetParent as HTMLElement | null; parent && parent !== board; parent = parent.offsetParent as HTMLElement | null) {
        y += parent.offsetTop
      }
      return y
    }
    const measure = () => {
      const phone = window.innerWidth <= 760
      element.classList.toggle('is-static', still)
      if (!phone) {
        // Each section starts one step below the last, on the other side; the step is the
        // smallest that keeps a section clear of the next one on its own side.
        const tallest = Math.max(...items.current.map((item) => item?.offsetHeight ?? 0))
        board.style.setProperty('--step', `${Math.ceil((tallest + 48) / 2)}px`)
      }
      // Group each section's skills into the rows they wrap onto at this width.
      items.current.forEach((item, i) => {
        let row = -1
        let top = -1
        item?.querySelectorAll<HTMLElement>('.journey-chips li').forEach((chip) => {
          if (chip.offsetTop !== top) {
            row++
            top = chip.offsetTop
          }
          chip.dataset.row = String(row)
        })
        rowCounts.current[i] = row + 1
      })
      const { offsetWidth: width, offsetHeight: height } = board
      // The dot is pulled up by half its height, so offsetTop plus half is its rule's line.
      const placed = dots.current.flatMap((dot, i) =>
        dot ? [{ y: yOf(dot) - dot.offsetHeight / 2, side: phone ? 0 : i % 2 ? 1 : -1 }] : [],
      )
      const mid = phone ? 22 : width / 2
      const pitch = phone ? 4.5 : 7
      const lineEnd = height - (phone ? 30 : 64)
      const curves = middleLine(placed, mid, phone ? 0 : SWAY, lineEnd)
      setLines({
        paths: Array.from({ length: LINES }, (_, i) => offsetPath(curves, (i - (LINES - 1) / 2) * pitch)),
        top: placed[0]?.y ?? 0,
        width,
        height,
        weight: phone ? 1.6 : 2.2,
      })

      // The poster stays pinned where the page's title ends, in a window down to the bottom
      // of the screen, and the scroll plays it through.
      const dotYs = placed.map((dot) => dot.y)
      // Where the poster starts on the page: below the bar and the title's room. Measured from
      // the body (not this track, which is pulled up to the top of the page below).
      const body = element.parentElement as HTMLElement
      const pin =
        body.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop + parseFloat(getComputedStyle(body).paddingTop)
      const windowH = Math.max(240, scroller.clientHeight - pin)
      // The lines' tip is held at one height in the window, as high as the tallest section
      // below its dot allows.
      const below = Math.max(...items.current.map((item, i) => (item ? item.offsetTop + item.offsetHeight - dotYs[i] : 0)))
      const anchor = clamp(windowH - below - 32, 36, windowH * 0.36)
      let length = 0
      dotYs.forEach((y, i) => {
        length += (rowCounts.current[i] ?? 1) * ROW_PX
        length += ((dotYs[i + 1] ?? lineEnd) - y) * TRAVEL
      })
      timeline.current = { dots: dotYs, end: lineEnd, anchor, window: windowH, height, length }
      if (still) {
        element.style.removeProperty('height')
        element.style.removeProperty('margin-top')
      } else {
        // The track starts at the very top of the page, so the scroll position is the time; the
        // pinned stage fills the screen, and the poster starts `pin` down it, where it sat before.
        element.style.setProperty('--pin', `${pin}px`)
        element.style.setProperty('--stage', `${scroller.clientHeight}px`)
        element.style.marginTop = `${-pin}px`
        element.style.height = `${length + scroller.clientHeight}px`
      }
      play.current()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  // Where the scroll is on the timeline decides everything: how far the lines are drawn, which
  // sections have appeared, how many rows of each are showing, and how far the poster has slid
  // up so that the lines' tip stays put in the window.
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('[data-scroll]')
    const board = poster.current
    if (!element || !scroller || !board) return
    const still = prefersReducedMotion()
    let frame = 0
    let count = -1
    const render = () => {
      frame = 0
      const { dots: ys, end, anchor, window: windowH, height, length } = timeline.current
      if (!ys.length) return
      const n = ys.length
      const p = still ? length : clamp(scroller.scrollTop, 0, length)
      const shown = new Array(n).fill(0)
      let tip = ys[0]
      let reachedNow = 1
      let cursor = 0
      for (let i = 0; i < n; i++) {
        const rows = rowCounts.current[i] ?? 1
        const hold = rows * ROW_PX
        if (p < cursor + hold) {
          // The lines wait at this dot while its skills come in, a row for every ROW_PX.
          tip = ys[i]
          reachedNow = i + 1
          shown[i] = Math.min(rows, Math.floor((p - cursor) / ROW_PX) + 1)
          break
        }
        shown[i] = rows
        cursor += hold
        const next = ys[i + 1] ?? end
        const travel = (next - ys[i]) * TRAVEL
        if (p < cursor + travel) {
          const u = (p - cursor) / travel
          tip = ys[i] + (next - ys[i]) * u
          // The next section appears as the lines come up to it.
          reachedNow = i + 1 + (ys[i + 1] !== undefined && u > 0.75 ? 1 : 0)
          break
        }
        cursor += travel
        tip = next
        reachedNow = i + 1
      }
      if (p >= length) {
        shown.fill(0).forEach((_, i) => (shown[i] = rowCounts.current[i] ?? 0))
        reachedNow = n
        tip = end
      }
      if (still) {
        shown.forEach((_, i) => (shown[i] = rowCounts.current[i] ?? 0))
        reachedNow = n
        tip = end
      }
      // Sections not yet reached have no skills showing.
      shown.forEach((_, i) => {
        if (i >= reachedNow) shown[i] = 0
        if (shown[i] !== rowsShown.current[i]) {
          rowsShown.current[i] = shown[i]
          showRows(i)
        }
      })
      if (reachedNow !== count) {
        count = reachedNow
        setReached(reachedNow)
      }
      reveal.current?.setAttribute('height', String(Math.max(0, tip - ys[0])))
      const slide = still ? 0 : clamp(tip - anchor, 0, Math.max(0, height - windowH))
      board.style.transform = `translate3d(0, ${-slide}px, 0)`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    play.current = schedule
    schedule()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      play.current = () => {}
    }
  }, [])

  // Smooth, gliding scroll, as on the Projects page.
  useEffect(() => {
    const scroller = root.current?.closest<HTMLElement>('[data-scroll]')
    if (!scroller || prefersReducedMotion()) return
    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.firstElementChild as HTMLElement,
      lerp: 0.075,
      wheelMultiplier: WHEEL,
      autoRaf: true,
    })
    return () => lenis.destroy()
  }, [])

  return (
    <div ref={root} className="journey" data-enter>
      <div ref={stage} className="journey-stage">
        <span className="journey-moon" aria-hidden="true" />
        <div className="journey-window">
          <div ref={poster} className="journey-poster">
            <svg className="journey-lines" width={lines.width} height={lines.height} aria-hidden="true">
              <defs>
                {/* Grows with the scroll; its last stretch fades, so the drawing end is soft. */}
                <linearGradient id="journey-tip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0.9" stopColor="#fff" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id="journey-drawn" maskUnits="userSpaceOnUse" x="0" y="0" width={lines.width} height={lines.height}>
                  <rect ref={reveal} x="-100" y={lines.top} width={lines.width + 200} height="0" fill="url(#journey-tip)" />
                </mask>
              </defs>
              <g mask="url(#journey-drawn)" strokeWidth={lines.weight}>
                {lines.paths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </svg>

            <ol className="journey-items">
              {groups.map((group, i) => (
                <li
                  key={group.name}
                  ref={(item) => {
                    items.current[i] = item
                  }}
                  style={{ '--row': i + 1 } as CSSProperties}
                  className={`journey-item ${i % 2 ? 'is-right' : 'is-left'}${i < reached ? ' is-in' : ''}`}
                >
                  <p className="journey-num">{pad(i + 1)}</p>
                  <div className="journey-rule">
                    <span
                      ref={(dot) => {
                        dots.current[i] = dot
                      }}
                      className="journey-dot"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="journey-title">{group.name}</h3>
                  <ul className="journey-chips">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            <p className="journey-end" aria-hidden="true">
              Keep
              <br />
              exploring
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
