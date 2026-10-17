// Builds the hero's dialog pages from the content folders:
//   scroll-dialog(by-order)/N-dialog.txt   the text of dialog N
//   src/assets/poses/I_DN-<width>.webp     pose I, which belongs to dialog N
//                                          (made from scroll-images(by-order) by scripts/make_cutouts.py)
// Each pose is one page. A dialog with several poses is split into that many
// pages at sentence boundaries, or at blank lines if the text file has them.

export interface Page {
  pose: string
  text: string
  src: string
  srcSet: string
}

const dialogFiles = import.meta.glob<string>('/scroll-dialog*/*-dialog.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const poseFiles = import.meta.glob<string>('/src/assets/poses/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

// A sentence ends at . ! or ? (optionally followed by a closing quote or bracket)
// and the next one starts with a capital letter, so "B.Com" stays in one piece.
const SENTENCE_BREAK = /(?<=[.!?][”"’)]?)\s+(?=[“"‘(]?[A-Z])/

export function splitIntoPages(text: string, count: number): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (paragraphs.length === count) return paragraphs

  const sentences = paragraphs.join(' ').split(SENTENCE_BREAK)
  if (sentences.length < count) {
    throw new Error(`Dialog has ${sentences.length} sentence(s) but ${count} images`)
  }

  // Try every way to cut the sentences into `count` consecutive groups and
  // keep the one whose longest page is shortest.
  let best: string[] = []
  let bestLongest = Infinity
  const search = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const split = [...acc, sentences.slice(start).join(' ')]
      const longest = Math.max(...split.map((p) => p.length))
      if (longest < bestLongest) {
        best = split
        bestLongest = longest
      }
      return
    }
    for (let end = start + 1; end <= sentences.length - left + 1; end++) {
      search(end, left - 1, [...acc, sentences.slice(start, end).join(' ')])
    }
  }
  search(0, count, [])
  return best
}

function buildPages(): Page[] {
  const dialogs = new Map<number, string>()
  for (const [path, text] of Object.entries(dialogFiles)) {
    const match = path.match(/(\d+)-dialog\.txt$/)
    if (match) dialogs.set(Number(match[1]), text)
  }

  const poses = new Map<string, { order: number; dialog: number; sizes: { width: number; url: string }[] }>()
  for (const [path, url] of Object.entries(poseFiles)) {
    const match = path.match(/((\d+)_D(\d+))-(\d+)\.webp$/)
    if (!match) continue
    const [, name, order, dialog, width] = match
    const pose = poses.get(name) ?? { order: Number(order), dialog: Number(dialog), sizes: [] }
    pose.sizes.push({ width: Number(width), url })
    poses.set(name, pose)
  }

  const ordered = [...poses.entries()].sort((a, b) => a[1].order - b[1].order)
  const dialogOrder = [...new Set(ordered.map(([, pose]) => pose.dialog))]

  return dialogOrder.flatMap((dialog) => {
    const text = dialogs.get(dialog)
    if (!text) throw new Error(`Missing scroll-dialog(by-order)/${dialog}-dialog.txt`)
    const group = ordered.filter(([, pose]) => pose.dialog === dialog)
    return splitIntoPages(text, group.length).map((part, i) => {
      const [name, pose] = group[i]
      const sizes = [...pose.sizes].sort((a, b) => a.width - b.width)
      return {
        pose: name,
        text: part,
        src: sizes[sizes.length - 1].url,
        srcSet: sizes.map((s) => `${s.url} ${s.width}w`).join(', '),
      }
    })
  })
}

export const pages = buildPages()
