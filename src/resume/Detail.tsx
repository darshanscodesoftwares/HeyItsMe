import type { Ref } from 'react'
import Icon from './Icon'
import { sections, type Card, type Entry, type Group, type Item, type Link, type Section } from './content'

const pad = (n: number) => String(n).padStart(2, '0')

// A link that isn't live yet shows its label, greyed out.
function LinkOut({ link }: { link: Link }) {
  return link.href ? (
    <a className="detail-link" href={link.href} target="_blank" rel="noreferrer">
      {link.label}
      <Icon name="arrowUpRight" />
    </a>
  ) : (
    <span className="detail-link is-pending">{link.label}</span>
  )
}

function Groups({ groups }: { groups: Group[] }) {
  return (
    <div className="detail-grid">
      {groups.map((group, i) => (
        <article key={i} className="detail-card" data-enter>
          <h3 className="detail-label">{group.name}</h3>
          <ul className="detail-chips">
            {group.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}

function Timeline({ entries }: { entries: Entry[] }) {
  return (
    <ol className="detail-timeline">
      {entries.map((entry, i) => (
        <li key={i} className="detail-card detail-entry" data-enter>
          <div className="detail-entry-head">
            <h3>{entry.title}</h3>
            <span className="detail-period">{entry.period}</span>
          </div>
          <p className="detail-meta">{entry.place}</p>
          {entry.points.length > 0 && (
            <ul className="detail-points">
              {entry.points.map((point, j) => (
                <li key={j}>{point}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}

function Cards({ cards }: { cards: Card[] }) {
  return (
    <div className="detail-grid">
      {cards.map((card, i) => (
        <article key={i} className="detail-card" data-enter>
          <h3>{card.title}</h3>
          {card.meta && <p className="detail-meta">{card.meta}</p>}
          {card.text && <p className="detail-text">{card.text}</p>}
          {card.tags && (
            <ul className="detail-chips detail-chips--small">
              {card.tags.map((tag, j) => (
                <li key={j}>{tag}</li>
              ))}
            </ul>
          )}
          {card.links && (
            <div className="detail-links">
              {card.links.map((link) => (
                <LinkOut key={link.label} link={link} />
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function List({ items }: { items: Item[] }) {
  return (
    <ul className="detail-list">
      {items.map((item, i) => (
        <li key={i} className="detail-card detail-row" data-enter>
          <span className="detail-dot" />
          <div>
            <h3>{item.title}</h3>
            <p className="detail-meta">{item.meta}</p>
          </div>
          <div className="detail-row-end">
            <span className="detail-period">{item.period}</span>
            {item.link && <LinkOut link={item.link} />}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Body({ section }: { section: Section }) {
  switch (section.kind) {
    case 'groups':
      return <Groups groups={section.groups} />
    case 'timeline':
      return <Timeline entries={section.entries} />
    case 'cards':
      return <Cards cards={section.cards} />
    case 'list':
      return <List items={section.items} />
  }
}

interface DetailProps {
  ref: Ref<HTMLDivElement>
  section: Section
  onBack: () => void
  onGo: (id: string) => void
}

// A section's own page. It sits over the zoomed-in, blurred paper; cinema.ts moves
// everything in and out.
export default function Detail({ ref, section, onBack, onGo }: DetailProps) {
  const index = sections.indexOf(section)
  const previous = sections[(index + sections.length - 1) % sections.length]
  const next = sections[(index + 1) % sections.length]

  return (
    <div ref={ref} className="resume-detail" role="dialog" aria-modal="true" aria-labelledby="resume-detail-title">
      <div className="resume-detail-veil" data-veil />
      {/* The section's heading from the paper, grown huge and pushed back behind the page. */}
      <h2 id="resume-detail-title" className="resume-detail-title" tabIndex={-1} data-title>
        <span>{section.title}</span>
      </h2>
      <p className="sr-only" aria-live="polite">
        {`${section.title}, ${index + 1} of ${sections.length}`}
      </p>

      <div className="resume-detail-scroll" data-scroll>
        <div className="resume-detail-bar">
          <button type="button" className="detail-pill" onClick={onBack} data-enter>
            <Icon name="arrowLeft" />
            Back to resume
          </button>
          <div className="detail-steps" data-enter>
            <button
              type="button"
              className="detail-pill detail-pill--icon"
              aria-label={`Previous: ${previous.title}`}
              onClick={() => onGo(previous.id)}
            >
              <Icon name="arrowLeft" />
            </button>
            <span className="detail-count">
              {pad(index + 1)} / {pad(sections.length)}
            </span>
            <button
              type="button"
              className="detail-pill detail-pill--icon"
              aria-label={`Next: ${next.title}`}
              onClick={() => onGo(next.id)}
            >
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>

        <div className="resume-detail-body" data-body>
          <Body key={section.id} section={section} />
          <nav className="detail-pager" aria-label="Other sections" data-enter>
            <button type="button" onClick={() => onGo(previous.id)}>
              <span>Previous</span>
              <strong>{previous.title}</strong>
            </button>
            <button type="button" onClick={() => onGo(next.id)}>
              <span>Next</span>
              <strong>{next.title}</strong>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
