// A project's pictures: src/assets/projects/<name>-thumb.webp (the list) and
// <name>-poster.webp (its own page), where the name is the title in lowercase with
// dashes (MYCARBOY -> mycarboy). Made by scripts/make_project_media.py.
const files = import.meta.glob<string>('../assets/projects/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

const byName = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  const name = path.match(/([^/]+)\.webp$/)?.[1]
  if (name) byName.set(name, url)
}

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function mediaFor(title: string) {
  const name = slug(title)
  return { thumb: byName.get(`${name}-thumb`), poster: byName.get(`${name}-poster`) }
}
