import GradientText from '../components/GradientText'

interface Highlight {
  phrase: string
  // Words of the phrase that get the gradient; the text between them keeps the normal style.
  words?: string[]
}

// Shown with the animated gradient wherever they appear in the dialog. All the
// words of a phrase share one gradient, so the shine travels across them together.
const HIGHLIGHTS: Highlight[] = [
  { phrase: 'Priyadarshan' },
  { phrase: 'exciting, chaotic, and eye-opening', words: ['exciting', 'chaotic', 'eye-opening'] },
  { phrase: 'building, learning, and working', words: ['building', 'learning', 'working'] },
]

const GRADIENT = {
  colors: ['#111111', '#9A9A9A'],
  animationSpeed: 3,
  variant: 'linear',
  followPointer: true,
} as const

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Splitting on a capturing group keeps the matches at the odd indexes.
const anyOf = (parts: string[]) => new RegExp(`(${parts.map(escape).join('|')})`)
const pattern = anyOf(HIGHLIGHTS.map((h) => h.phrase))

// Shows the characters of `text` that fall within the first `count` characters of
// the page (`text` starts at `start`). The rest stay in place but invisible so
// words don't jump between lines while typing.
function Typed({ text, start, count }: { text: string; start: number; count: number }) {
  const shown = Math.min(text.length, Math.max(0, count - start))
  return (
    <>
      {text.slice(0, shown)}
      {shown < text.length && <span className="dialog-unrevealed">{text.slice(shown)}</span>}
    </>
  )
}

function HighlightRun({ highlight, start, count }: { highlight: Highlight; start: number; count: number }) {
  // A phrase has to wrap like normal text, which the glow layer can't follow.
  const isPhrase = highlight.phrase.includes(' ')
  let offset = start
  const parts = highlight.phrase.split(anyOf(highlight.words ?? [highlight.phrase])).map((part, i) => {
    const typed = <Typed text={part} start={offset} count={count} />
    offset += part.length
    if (!part) return null
    return i % 2 === 1 ? (
      <span key={i}>{typed}</span>
    ) : (
      <span key={i} className="dialog-plain">
        {typed}
      </span>
    )
  })
  return (
    <GradientText
      {...GRADIENT}
      colors={[...GRADIENT.colors]}
      className={isPhrase ? 'dialog-highlight dialog-highlight--phrase' : 'dialog-highlight'}
      glow={isPhrase ? 0 : 0.4}
    >
      {parts}
    </GradientText>
  )
}

export default function DialogText({ text, count }: { text: string; count: number }) {
  let offset = 0
  return text.split(pattern).map((run, i) => {
    const start = offset
    offset += run.length
    const highlight = i % 2 === 1 ? HIGHLIGHTS.find((h) => h.phrase === run) : undefined
    return highlight ? (
      <HighlightRun key={i} highlight={highlight} start={start} count={count} />
    ) : (
      <Typed key={i} text={run} start={start} count={count} />
    )
  })
}
