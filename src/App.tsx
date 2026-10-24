import Hero from './hero/Hero'
import Resume from './resume/Resume'
import ScrollToggle from './ScrollToggle'

export default function App() {
  return (
    <>
      <ScrollToggle />
      <Hero />
      <main id="after-hero">
        <Resume />
      </main>
    </>
  )
}
