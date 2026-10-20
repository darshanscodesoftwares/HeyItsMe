import Hero from './hero/Hero'
import Resume from './resume/Resume'

export default function App() {
  return (
    <>
      <Hero />
      <main id="after-hero">
        <Resume />
      </main>
    </>
  )
}
