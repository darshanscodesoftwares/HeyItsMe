import { sections } from './content'

// Each section's page has its own address, so links to it and the browser's back
// button work. A hash keeps it working on any static host.
const ROUTE = /^#\/resume\/([\w-]+)$/

export const hrefFor = (id: string) => `#/resume/${id}`

export function routeId(): string | null {
  const id = ROUTE.exec(location.hash)?.[1]
  return sections.find((section) => section.id === id)?.id ?? null
}
