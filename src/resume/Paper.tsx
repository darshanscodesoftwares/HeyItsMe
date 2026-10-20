import { Fragment, type MouseEvent, type Ref } from 'react'
import avatar from '../assets/poses/1_D1-640.webp'
import Icon from './Icon'
import { mainSections, profile, sideSections, type Section } from './content'
import { hrefFor } from './route'

type OpenHandler = (event: MouseEvent<HTMLAnchorElement>, id: string) => void

// A grey line's length on the paper. It's picked from the text the line stands for,
// so the lines vary like real text but stay the same from one render to the next.
const lineWidth = (text: string, i: number, min: number, max: number) =>
  `${min + ((text.length * 7 + i * 11) % (max - min + 1))}%`

function Line({ width, strong }: { width?: string; strong?: boolean }) {
  return (
    <span className={strong ? 'sheet-line sheet-line--strong' : 'sheet-line'} style={width ? { width } : undefined} />
  )
}

// A section seen from a distance: one grey line per entry.
function Preview({ section }: { section: Section }) {
  switch (section.kind) {
    case 'groups':
      return (
        <div className="sheet-lines sheet-lines--pairs">
          {section.groups
            .flatMap((group) => group.items)
            .slice(0, 8)
            .map((item, i) => (
              <Line key={i} width={lineWidth(item, i, 70, 100)} />
            ))}
        </div>
      )
    case 'cards':
      return (
        <div className="sheet-lines">
          {section.cards.slice(0, 4).map((card, i) => (
            <Line key={i} width={lineWidth(card.title + (card.text ?? ''), i, 84, 100)} />
          ))}
        </div>
      )
    case 'timeline':
      return (
        <ol className="sheet-timeline">
          {section.entries.slice(0, 2).map((entry, i) => (
            <li key={i}>
              <Line strong width={lineWidth(entry.title, i, 48, 64)} />
              <Line />
              {[entry.place, ...entry.points].slice(0, 3).map((text, j) => (
                <Line key={j} width={lineWidth(text, j, 70, 94)} />
              ))}
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="sheet-list">
          {section.items.slice(0, 5).map((item, i) => (
            <li key={i}>
              <span className="sheet-dot" />
              <Line width={lineWidth(item.title, i, 64, 84)} />
              <Line />
            </li>
          ))}
        </ul>
      )
  }
}

function Column({ className, sections, onOpen }: { className: string; sections: Section[]; onOpen: OpenHandler }) {
  return (
    <div className={className}>
      {sections.map((section, i) => (
        <Fragment key={section.id}>
          {i > 0 && <hr className="sheet-rule" />}
          <a
            className="sheet-section"
            href={hrefFor(section.id)}
            data-section={section.id}
            onClick={(event) => onOpen(event, section.id)}
          >
            <span className="sheet-heading">
              <span className="sheet-icon">
                <Icon name={section.icon} />
              </span>
              <span className="sheet-heading-text" data-heading>
                {section.title}
              </span>
              <span className="sheet-heading-rule" />
              <Icon name="arrowUpRight" className="sheet-open" />
            </span>
            <span className="sheet-preview" aria-hidden="true">
              <Preview section={section} />
            </span>
          </a>
        </Fragment>
      ))}
    </div>
  )
}

interface PaperProps {
  ref: Ref<HTMLDivElement>
  // Not revealed yet: invisible (see resume.css) and out of reach of keyboard and mouse.
  hidden: boolean
  onOpen: OpenHandler
}

export default function Paper({ ref, hidden, onOpen }: PaperProps) {
  return (
    // The slot keeps the paper's place in the page while the camera pins it to the screen.
    <div className="resume-slot" inert={hidden}>
      <div ref={ref} className="resume-paper">
        <article className="sheet" aria-label={`Resume of ${profile.name}`}>
          <header className="sheet-header">
            <div className="sheet-avatar">
              <img src={avatar} alt="" />
            </div>
            <div>
              <p className="sheet-name">{profile.name}</p>
              <p className="sheet-role">{profile.role}</p>
            </div>
            <span className="sheet-divider" />
            <ul className="sheet-contacts">
              {profile.contacts.map((contact) => (
                <li key={contact.label} aria-hidden={!contact.text || undefined}>
                  <Icon name={contact.icon} />
                  {contact.text ? (
                    <a href={contact.href || undefined}>
                      <span className="sr-only">{contact.label}: </span>
                      {contact.text}
                    </a>
                  ) : (
                    <Line />
                  )}
                </li>
              ))}
            </ul>
          </header>
          <div className="sheet-body">
            <Column className="sheet-side" sections={sideSections} onOpen={onOpen} />
            <Column className="sheet-main" sections={mainSections} onOpen={onOpen} />
          </div>
        </article>
      </div>
    </div>
  )
}
