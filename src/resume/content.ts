// Everything the resume shows. On the paper each entry is drawn as a grey line, like a
// resume seen from across the room; the full text is on each section's own page.
// Text in [square brackets] is a placeholder waiting for the real thing. A link with
// an empty href shows as "not live yet".
import type { IconName } from './Icon'

export interface Link {
  label: string
  href: string
}

export interface Contact {
  icon: IconName
  label: string
  // Leave text empty to show a placeholder line on the paper.
  text: string
  href: string
}

export interface Group {
  name: string
  items: string[]
}

export interface Entry {
  title: string
  place: string
  period: string
  points: string[]
}

export interface Card {
  title: string
  meta?: string
  text?: string
  tags?: string[]
  links?: Link[]
}

export interface Item {
  title: string
  meta: string
  period: string
  link?: Link
}

interface SectionBase {
  id: string
  title: string
  icon: IconName
}

export type Section = SectionBase &
  (
    | { kind: 'groups'; groups: Group[] }
    | { kind: 'timeline'; entries: Entry[] }
    | { kind: 'cards'; cards: Card[] }
    | { kind: 'list'; items: Item[] }
  )

export const profile: { name: string; role: string; contacts: Contact[] } = {
  name: 'Priyadarshan S',
  role: 'Full Stack Developer',
  contacts: [
    { icon: 'mail', label: 'Email', text: '', href: '' },
    { icon: 'phone', label: 'Phone', text: '', href: '' },
    { icon: 'pin', label: 'Location', text: '', href: '' },
    { icon: 'linkedin', label: 'LinkedIn', text: '', href: '' },
    { icon: 'github', label: 'GitHub', text: '', href: '' },
  ],
}

const projectLinks = (): Link[] => [
  { label: 'Live', href: '' },
  { label: 'Code', href: '' },
]

// The shaded left column of the paper, top to bottom.
export const sideSections: Section[] = [
  {
    id: 'skills',
    title: 'Skills',
    icon: 'code',
    kind: 'groups',
    groups: [
      { name: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React'] },
      { name: 'Backend', items: ['Node.js', 'Express', 'REST APIs'] },
      { name: 'Data', items: ['MongoDB', 'Data modelling'] },
      { name: 'Deployment', items: ['PaaS', 'VPS'] },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Technologies',
    icon: 'gear',
    kind: 'groups',
    groups: [
      { name: '[Category]', items: ['[Tool]', '[Tool]', '[Tool]', '[Tool]'] },
      { name: '[Category]', items: ['[Tool]', '[Tool]', '[Tool]', '[Tool]'] },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'folder',
    kind: 'cards',
    cards: [
      {
        title: 'HeyItsMe',
        meta: 'Personal portfolio',
        text: 'This site: a scroll-driven, game-style introduction and an interactive resume.',
        tags: ['React', 'TypeScript', 'Vite'],
        links: projectLinks(),
      },
      {
        title: '[Project name]',
        meta: '[Year · your role]',
        text: '[What it does, what you built, and how it turned out.]',
        tags: ['[Tech]', '[Tech]', '[Tech]'],
        links: projectLinks(),
      },
      {
        title: '[Project name]',
        meta: '[Year · your role]',
        text: '[What it does, what you built, and how it turned out.]',
        tags: ['[Tech]', '[Tech]'],
        links: projectLinks(),
      },
      {
        title: '[Project name]',
        meta: '[Year · your role]',
        text: '[What it does, what you built, and how it turned out.]',
        tags: ['[Tech]', '[Tech]'],
        links: projectLinks(),
      },
    ],
  },
  {
    id: 'interests',
    title: 'Interests',
    icon: 'gamepad',
    kind: 'cards',
    cards: [
      { title: '[Interest]', text: '[A line about what you enjoy in it.]' },
      { title: '[Interest]', text: '[A line about what you enjoy in it.]' },
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements',
    icon: 'trophy',
    kind: 'cards',
    cards: [
      { title: '[Achievement]', meta: '[Year]', text: '[What happened, and why it mattered.]' },
      { title: '[Achievement]', meta: '[Year]', text: '[What happened, and why it mattered.]' },
    ],
  },
]

// The right column of the paper, top to bottom.
export const mainSections: Section[] = [
  {
    id: 'experience',
    title: 'Work Experience',
    icon: 'briefcase',
    kind: 'timeline',
    entries: [
      {
        title: 'Full-Stack Developer (MERN)',
        place: '[Company] · [City]',
        period: '[20XX] – Present',
        points: [
          '[What you build and own day to day.]',
          '[A result you are proud of, with a number if you have one.]',
          '[A tool or practice you brought to the team.]',
        ],
      },
      {
        title: 'Full-Stack Developer Intern',
        place: '[Startup] · [City]',
        period: '[20XX] – [20XX]',
        points: ['[What you worked on.]', '[What you shipped or learned.]'],
      },
    ],
  },
  {
    id: 'education',
    title: 'Education',
    icon: 'cap',
    kind: 'timeline',
    entries: [
      {
        title: 'Bachelor of Commerce (B.Com)',
        place: '[College or university] · [City]',
        period: '[20XX] – [20XX]',
        points: ['[Anything worth mentioning: focus, projects, results.]'],
      },
    ],
  },
  {
    id: 'certifications',
    title: 'Certifications',
    icon: 'award',
    kind: 'list',
    items: [
      { title: '[Certificate name]', meta: '[Issuer]', period: '[Year]', link: { label: 'Credential', href: '' } },
      { title: '[Certificate name]', meta: '[Issuer]', period: '[Year]', link: { label: 'Credential', href: '' } },
      { title: '[Certificate name]', meta: '[Issuer]', period: '[Year]', link: { label: 'Credential', href: '' } },
      { title: '[Certificate name]', meta: '[Issuer]', period: '[Year]', link: { label: 'Credential', href: '' } },
    ],
  },
]

// The order the section pages step through with "previous" and "next".
export const sections = [...sideSections, ...mainSections]
