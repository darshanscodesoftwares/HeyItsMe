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

export interface Note {
  heading: string
  // A point may start with "Label: ", shown as a small heading for the rest.
  points: string[]
}

export interface Card {
  title: string
  meta?: string
  text?: string
  tags?: string[]
  links?: Link[]
  // Used by the Projects page only (Projects.tsx).
  category?: string
  type?: string
  overview?: string
  notes?: Note[]
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
    {
      icon: 'linkedin',
      label: 'LinkedIn',
      text: 'darshan-stack',
      href: 'https://www.linkedin.com/in/darshan-stack',
    },
    { icon: 'github', label: 'GitHub', text: 'DarshanLevi', href: 'https://github.com/DarshanLevi' },
    { icon: 'pin', label: 'Location', text: 'Cuddalore, India', href: '' },
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
      {
        name: 'Full-stack and web',
        items: [
          'Full-Stack Development',
          'MERN Stack',
          'Front-End Development',
          'Back-End Web Development',
          'Web Development',
          'Web Technologies',
          'Web Design',
          'Website Building',
        ],
      },
      {
        name: 'Databases',
        items: ['MongoDB', 'PostgreSQL', 'Database Management Systems (DBMS)', 'Database Development'],
      },
      { name: 'Languages', items: ['JavaScript', 'SQL'] },
      {
        name: 'Engineering practice',
        items: ['Software Infrastructure', 'Internet Software', 'Performance Tuning', 'Debugging', 'Analytical Skills'],
      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Technologies',
    icon: 'gear',
    kind: 'groups',
    groups: [
      { name: 'Version control and OS', items: ['Git', 'GitHub', 'Linux', 'Mac', 'Windows'] },
      { name: 'APIs and databases', items: ['Postman', 'Swagger', 'PostgreSQL', 'MongoDB', 'pgAdmin', 'RDS (AWS)'] },
      { name: 'Deployment', items: ['PM2', 'Ubuntu VPS', 'Nginx', 'SSH', 'Certbot', 'AWS EC2', 'Render', 'Vercel'] },
      {
        name: 'Design and office',
        items: ['Google Sheets', 'Google Meet', 'Google Slides', 'Google Docs', 'Figma', 'Excel', 'Trello'],
      },
      { name: 'AI tools', items: ['Claude', 'Claude Code', 'ChatGPT', 'Codex'] },
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
        category: 'Automotive',
        type: 'Full-stack web application',
        overview:
          'A multi-service car inspection platform that runs the whole inspection lifecycle: customer bookings and online payments, expert assignment, vehicle inspections, admin review and report delivery.',
        notes: [
          {
            heading: 'Key implementations',
            points: [
              'Customer app: booking for Pre-Delivery, Used Car and Vehicle Service History inspections, with scheduling, payments and status tracking.',
              'Admin dashboard: bookings and leads, expert assignment and reassignment, rescheduling, cancellations, refunds, permissions, coupons and analytics.',
              'Inspection expert app: mobile-friendly checklists, image, video and document uploads, attendance and leave, and report submission.',
              'Automated reports: PDFs with inspection checkpoints, condition summaries, expert remarks, OBD scans and history checks.',
              'Notifications: email and WhatsApp messages for booking, assignment and report events.',
            ],
          },
          {
            heading: 'Standout engineering',
            points: [
              'Multi-app integration: connected the customer, admin and expert apps through REST APIs and shared booking data.',
              'Payment reliability: Razorpay payments and webhooks, guarded against duplicate events, with refunds and booking confirmation.',
              'Scheduling: availability checks by expert skills, district, leave and booked slots, revalidated on the server to prevent double-booking.',
              'Data consistency: found and fixed live issues with mismatched databases, booking references, status sync, cancellations and assignments.',
              'Production: deployed and debugged on a Linux VPS with Nginx, PM2, SSH-based Git deploys and CORS setup.',
            ],
          },
          {
            heading: 'Why it matters',
            points: [
              'The challenge was not building three interfaces. It was keeping bookings, payments, scheduling, inspections and reports consistent across them, while fixing issues in a live production system.',
            ],
          },
        ],
        text: 'A vehicle inspection platform: REST APIs with state-driven booking lifecycles, Razorpay payments with secure webhook verification, dynamic vehicle pricing, job assignment and inspection report pipelines. Deployed on an Ubuntu VPS with PM2.',
        tags: [
          'React',
          'Vite',
          'Redux',
          'CSS/SCSS',
          'Node.js',
          'Express.js',
          'REST APIs',
          'MongoDB',
          'Mongoose',
          'Razorpay',
          'Webhooks',
          'Nodemailer',
          'Zoho SMTP',
          'Twilio/WhatsApp',
          'Google Maps',
          'Google Analytics 4',
          'PDF generation',
          'Image/video/document uploads',
          'Postman',
          'Swagger',
          'Linux VPS',
          'Nginx',
          'PM2',
          'SSH',
          'Git',
        ],
      },
      {
        title: 'schoolNest',
        meta: '4 months',
        category: 'Education',
        type: 'Multi-tenant school platform',
        overview:
          'A school management platform that serves many schools in one system. It connects academics, admissions, attendance, fees, communication and school transport across web and mobile apps for admins, teachers, parents and transport staff.',
        notes: [
          {
            heading: 'Key implementations',
            points: [
              'Multi-tenant architecture: school-aware data, role-based access, JWT claims and per-school configuration.',
              'Academics: classes, sections, teacher assignments, timetables, homework, exams, results, attendance and leave.',
              'Admissions: approval workflows connected to student creation, parent sign-in and class assignment.',
              'Parents and teachers: OTP login, attendance, fees and payment history, homework, announcements and timetables.',
              'Notifications: Firebase Cloud Messaging with device tokens, in-app messages and unread counts.',
              'Transport: the driver ride lifecycle, a live bus map over REST snapshots and Server-Sent Events, and geofenced teacher check-in.',
            ],
          },
          {
            heading: 'Standout engineering',
            points: [
              'Services: worked across auth, academic, notification and transport services, each with its own PostgreSQL database.',
              'Security: role-aware JWT auth, OTP flows, token blacklisting, multi-school parent selection and child-ownership checks.',
              'Messaging: a transactional outbox with background relays, retries and cleanup.',
              'Cloud: migrated the backend from Render to AWS EC2 and RDS, with HTTPS, domains, environment, migrations and processes.',
              'Data integrity: tracked down cross-database links, UUID mismatches, duplicates, timetable mappings and stale FCM tokens.',
            ],
          },
        ],
        text: 'A multi-tenant school SaaS backend: Controller → Service → Repository REST APIs with JWT, bcrypt and role-based access for admins, teachers and parents, a database per service, and tenant isolation by school.',
        tags: [
          'React',
          'Next.js',
          'Redux',
          'Flutter',
          'Bootstrap',
          'CSS/SCSS',
          'Node.js',
          'REST APIs',
          'Service-based architecture',
          'PostgreSQL',
          'Redis',
          'JWT',
          'OTP',
          'Firebase Cloud Messaging',
          'Transactional outbox',
          'GPS/geofencing',
          'Leaflet',
          'OpenStreetMap',
          'SSE',
          'AWS EC2',
          'AWS RDS',
          'Render',
          'Git',
          'Postman',
          'Swagger',
          'PM2',
          'Nginx',
        ],
      },
      {
        title: 'VR De-Addiction Wellness',
        meta: 'Proof of concept · Aug–Oct 2025',
        category: 'Wellness',
        type: 'Standalone VR prototype',
        overview:
          'A proof of concept for a VR de-addiction and wellness experience, starting with an Indian bar. It explores how immersive scenes, tracked interactions and session data could support future therapy and rehabilitation work. A prototype, not a finished clinical product.',
        notes: [
          {
            heading: 'Key implementations',
            points: [
              'Standalone VR: Unity 6 with OpenXR, XR Interaction Toolkit and XR Hands, built for Meta Quest 3S.',
              'The scene: a procedurally built Indian bar with seating, counter, signage, lighting, textures and props.',
              'Interaction: hand tracking, grab and throw physics, object placement, arm-swing locomotion, turning and a safety exit.',
              'Asset pipeline: Blender to Unity through Python scripts for models, FBX export, optimisation and scene regeneration.',
              'Atmosphere: footsteps, glass clinks, a sign that flickers with the audio, and moody lighting.',
            ],
          },
          {
            heading: 'Standout engineering',
            points: [
              'Builds: Quest settings applied by editor scripts that also run headless, after diagnosing silent build failures.',
              'Performance: GPU instancing, material reuse, lighting and shadow budgets, culling and decimation, to a locked 72 fps on device.',
              'Architecture: a Unity REST client planned against a NestJS and PostgreSQL backend, with OpenXR as the common layer across headsets.',
            ],
          },
        ],
        text: 'A standalone VR prototype for de-addiction and wellness, set in a procedurally built Indian bar. It has hand tracking, grab/throw physics and arm-swing locomotion, a Blender-to-Unity asset pipeline scripted in Python, and a planned NestJS and PostgreSQL backend for session data. Optimized to a locked 72 fps on Quest 3S.',
        tags: [
          'Unity 6',
          'C#',
          'OpenXR',
          'XR Interaction Toolkit',
          'XR Hands',
          'Meta Quest 3S',
          'Blender',
          'Python',
          'NestJS',
          'PostgreSQL',
        ],
      },
      {
        title: 'Marina FC Website',
        meta: 'Proof of concept · 1 day',
        category: 'Sport',
        type: 'Client demo website',
        text: 'A client demo site for a Chennai football club: a hero video scrubbed by scroll, a 3D football that follows the cursor, a photo gallery and a coaches section, with Node and Python scripts that build the media.',
        tags: [
          'React',
          'TypeScript',
          'Vite',
          'Three.js',
          'GSAP',
          'Anime.js',
          'Motion',
          'Lenis',
          'Node.js',
          'Python',
          'FFmpeg',
        ],
      },
      {
        title: 'Musica',
        meta: 'Personal project · 2.5 months',
        category: 'Music',
        type: 'Landing page',
        text: 'A responsive concert booking landing page.',
        tags: ['React', 'CSS Modules', 'Framer Motion'],
      },
      {
        title: 'Find-ISS',
        meta: 'Personal project · 2.5 months',
        category: 'Space',
        type: 'Real-time web app',
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
        title: "Cut the client's AWS SNS and SQS cost to zero",
        meta: 'SchoolNest · architecture',
        text: 'Replaced AWS SNS and SQS with self-hosted equivalents, so the client pays nothing for messaging until the platform is big enough to need managed services (planned at 100+ schools). Business code talks to small interfaces (an event publisher and a location store), and one environment switch picks the implementation: self-hosted Postgres and HTTP today, Redis and SNS/SQS on AWS later, with no controller changes. Only the self-hosted side is live; the AWS side is already designed in behind the same switch.',
      },
      {
        title: 'Built a durable event outbox in place of paid AWS queues',
        meta: 'SchoolNest · reliability · built and tested locally',
        text: "Built a transactional outbox that does the job of SNS-to-SQS delivery on the client's own database, so no paid queue is needed yet. Events are saved in the same transaction as the change, and a background relay delivers them with retries that back off (5s to 40s) and a Postgres LISTEN/NOTIFY wake-up: 0.74s delivery instead of waiting for a 15s poll. The receiving service ignores repeats, so redelivery never double-sends. Tested: events survive the receiver being down and arrive when it returns, with no duplicates. It carries the load until the project outgrows it, and moves to managed AWS then.",
      },
      // Left out for now, at his request. To show them again, remove the comment markers.
      /*
      {
        title: 'Three-flow API architecture',
        meta: 'SchoolNest · design',
        text: 'Sorted every API across four services into three flows (direct now, self-hosted, AWS-managed) behind one switch, with two rules: side effects decouple, reads stay direct. Audited the services and found only two real breaks of service independence, both cross-database reads, and chose the outbox as the fix.',
      },
      {
        title: 'Live bus tracking on the same seam',
        meta: 'SchoolNest · transport',
        text: 'Drivers start a ride and send GPS fixes; the admin map updates live over server-sent events, keeping only the latest fix, ordered by the server clock so a wrong phone clock cannot freeze the map. Verified on production: a driver login, a ride, thirty GPS fixes and a moving marker on the admin map.',
      },
      */
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
        period: 'Aug 2025 – Present',
        points: [
          'Worked across the whole stack on two client products, a school ERP and a vehicle inspection platform, from database design to React screens.',
          'Took the school platform from local machines to AWS: its four services run on EC2 under PM2 and Nginx, with local and cloud databases kept in step through migrations.',
          'Added real-time bus tracking for school transport, from the driver starting a ride to a live map for admins, and checked it on production.',
          'Tightened security: moved secrets out of the code, and fixed an endpoint that could show a parent any child in the school.',
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
