import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const MS_PER_CHAR = 6

// Reveals `text` at the same steady speed on every page.
// When `animate` is false the text is shown at once.
export function useTypewriter(text: string, animate: boolean) {
  const [count, setCount] = useState(animate ? 0 : text.length)
  const frame = useRef(0)

  // Layout effect so a new page never paints with the previous page's progress.
  useLayoutEffect(() => {
    if (!animate) {
      setCount(text.length)
      return
    }
    setCount(0)
    const duration = text.length * MS_PER_CHAR
    let start = 0
    const tick = (now: number) => {
      start ||= now
      const next = Math.min(text.length, Math.ceil(((now - start) / duration) * text.length))
      setCount(next)
      if (next < text.length) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [text, animate])

  const finish = useCallback(() => {
    cancelAnimationFrame(frame.current)
    setCount(text.length)
  }, [text])

  return { count, done: count >= text.length, finish }
}
