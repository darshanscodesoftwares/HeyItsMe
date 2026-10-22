// Everything the resume shows, taken from Priyadarshan's resume (October 2026). On the
// paper each entry is drawn as a grey line, like a resume seen from across the room;
// the full text is on each section's own page. A link with an empty href shows as
// "not live yet".
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

// No phone number, on purpose.
export const profile: { name: string; role: string; contacts: Contact[] } = {
  name: 'Priyadarshan S',
  role: 'Full Stack Developer',
  contacts: [
    { icon: 'mail', label: 'Email', text: 's2darshan2@gmail.com', href: 'mailto:s2darshan2@gmail.com' },
    { icon: 'pin', label: 'Location', text: 'Cuddalore, India', href: '' },
    {
      icon: 'linkedin',
      label: 'LinkedIn',
      text: 'darshan-stack',
      href: 'https://www.linkedin.com/in/darshan-stack',
    },
    { icon: 'github', label: 'GitHub', text: 'DarshanLevi', href: 'https://github.com/DarshanLevi' },
  ],
}

// The shaded left column of the paper, top to bottom.
export const sideSections: Section[] = [
  {
    id: 'skills',
    title: 'Skills',
    icon: 'code',
    kind: 'groups',
    groups: [
      { name: 'Frontend', items: ['React.js', 'Vite', 'CSS Modules', 'HTML5', 'Responsive Design', 'Framer Motion'] },
      {
        name: 'Backend',
        items: [
          'Node.js',
          'Express.js',
          'REST API Design',
          'JWT Authentication',
          'Role-Based Access Control',
          'Microservices Architecture',
          'Web Scraping (Puppeteer, Cheerio)',
          'Razorpay Webhooks and Integration',
        ],
      },
      { name: 'Languages', items: ['JavaScript', 'SQL'] },
      { name: 'Databases', items: ['MongoDB', 'PostgreSQL'] },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Technologies',
    icon: 'gear',
    kind: 'groups',
    groups: [
      { name: 'Version control', items: ['Git', 'GitHub'] },
      { name: 'APIs and databases', items: ['Postman', 'pgAdmin'] },
      { name: 'Deployment', items: ['PM2', 'Ubuntu VPS'] },
      { name: 'Design', items: ['Figma'] },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'folder',
    kind: 'cards',
    cards: [
      {
        title: 'MYCARBOY',
        meta: '5 months',
        text: 'A vehicle inspection platform: REST APIs with state-driven booking lifecycles, Razorpay payments with secure webhook verification, dynamic vehicle pricing, job assignment and inspection report pipelines. Deployed on an Ubuntu VPS with PM2.',
        tags: ['React', 'Node.js', 'Express', 'MongoDB'],
      },
      {
        title: 'Decimal-chess',
        meta: '3 months',
        text: 'A chess tournament results system. It scrapes tournament keys, player lists and round pairings with Puppeteer and Cheerio, lets arbiters submit board results through secure shareable links, and generates Swiss-Manager XML to update Chess-Results automatically.',
        tags: ['React (Vite)', 'Node.js', 'Express', 'MongoDB'],
      },
      {
        title: 'schoolNest',
        meta: '4 months',
        text: 'A multi-tenant school SaaS backend: Controller → Service → Repository REST APIs with JWT, bcrypt and role-based access for admins, teachers and parents, a database per service, and tenant isolation by school.',
        tags: ['Node.js', 'Express', 'PostgreSQL'],
      },
      {
        title: 'Word-Builder',
        meta: '1 month',
        text: 'An ATS resume builder: a multi-step form with a live preview, automatic section structuring, bullet enhancement, resume scoring with keyword checks, and one-click A4 PDF export with Puppeteer.',
        tags: ['React (Vite)', 'Node.js', 'Express', 'Puppeteer', 'CSS Modules'],
      },
      {
        title: 'Musica',
        meta: '2.5 months',
        text: 'A responsive concert booking landing page.',
        tags: ['React', 'CSS Modules', 'Framer Motion'],
      },
      {
        title: 'Find-ISS',
        meta: '2.5 months',
        text: 'A real-time web app that tracks the International Space Station on Google Maps from live coordinates.',
        tags: ['Node.js', 'Express.js', 'EJS', 'External APIs'],
      },
    ],
  },
  {
    id: 'languages',
    title: 'Languages',
    icon: 'languages',
    kind: 'groups',
    groups: [{ name: 'Spoken', items: ['Tamil', 'English'] }],
  },
  {
    id: 'achievements',
    title: 'Achievements',
    icon: 'trophy',
    kind: 'cards',
    cards: [
      {
        title: 'About 80% fewer upload crashes',
        meta: 'MYCARBOY',
        text: 'Compressed chunk uploads for media and report files cut upload-related crashes by about 80% and made uploads consistent in production.',
      },
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
        title: 'Full-Stack Developer',
        place: 'Scode Software Solutions',
        period: 'Aug 2025 – Feb 2026',
        points: [
          'Built production features across tournament management, school SaaS and vehicle inspection platforms: secure APIs, role-based workflows and scalable backend services.',
          'Delivered key modules for Decimal-chess and schoolNest, including automated data scraping, XML export workflows and a multi-tenant backend.',
          'In MYCARBOY, added compressed chunk uploads for media and report files, cutting upload-related crashes by about 80%.',
          'Developed responsive web interfaces and maintained backend services with reliable API integrations.',
        ],
      },
      {
        title: 'Full-Stack Intern',
        place: 'Go Prime Technologies',
        period: 'Apr 2023 – Apr 2024',
        points: [
          'Built foundational JavaScript skills by solving game-based problems.',
          'Developed responsive web interfaces and improved the user experience across devices.',
          'Built and maintained backend services with reliable API integrations and clean architecture.',
          "Contributed to Onbo's transportation management system.",
          'Designed and optimised database queries for faster, more reliable data access.',
        ],
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
        title: 'Bachelor of Commerce in Bank Management',
        place: 'St. Joseph College of Arts and Science',
        period: '2019 – 2022',
        points: [],
      },
    ],
  },
  {
    id: 'certifications',
    title: 'Certifications',
    icon: 'award',
    kind: 'list',
    items: [
      {
        title: 'The Complete Full-Stack Web Development Bootcamp',
        meta: 'Udemy',
        period: 'Jan 2025',
        link: {
          label: 'Show credential',
          href: 'https://www.udemy.com/certificate/UC-81553b9d-0e49-4db6-9daf-ff8443cda1ca/',
        },
      },
      {
        title: 'Foundations of Digital Marketing and E-commerce',
        meta: 'Google · Coursera',
        period: 'Apr 2025',
        link: {
          label: 'Show credential',
          href: 'https://www.coursera.org/account/accomplishments/verify/97A01J2JXM1N',
        },
      },
      {
        title: 'Google Data Analytics Specialization',
        meta: 'Google · Coursera',
        period: 'Aug 2022',
        link: {
          label: 'Show credential',
          href: 'https://www.coursera.org/account/accomplishments/specialization/PKS3PKNE569D',
        },
      },
    ],
  },
]

// The order the section pages step through with "previous" and "next".
export const sections = [...sideSections, ...mainSections]
