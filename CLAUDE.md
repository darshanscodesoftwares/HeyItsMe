# HeyItsMe

Personal portfolio site for **Priyadarshan** (he/him; he is the user), a Full-Stack (MERN)
developer.
Repo: github.com/darshanscodesoftwares/HeyItsMe. Two sections so far: the hero (a
scroll-driven, video-game-style self-introduction) and an interactive resume, where
clicking a section on a paper resume zooms a "camera" into it and opens its own page.

> The user works on this repo from several PCs (Windows, and at least one other machine).
> Chat history stays on the machine where it happened, but this file travels with the repo.
> Start from **Current state** and **Session log** below and pick up where things were
> left, instead of re-analysing the project from scratch.

## Keep this file up to date (every session)

- **Always** keep this file current. The user asked for this explicitly. Every change,
  even a small one, updates **Current state** and today's **Session log** entry *in the
  same commit* as the work, or in a CLAUDE.md commit right after it. Never end a session
  with this file stale.
- When the user says "save", "wrap up", "log this", or is about to switch machines: update
  both sections, commit, and offer to push (push only once they agree).
- Log what a future session needs, not a transcript: what changed and why, decisions,
  things the user liked or rejected, anything half-finished, and next steps. 2-6 bullets.
- Move decisions that will last into the sections they belong in (Decisions, Conventions,
  Gotchas). Don't leave them only in the log.
- Use absolute dates (YYYY-MM-DD). Once the log passes ~15 entries, fold the oldest into a
  short "Earlier" paragraph so this file stays small.

## Commands

```sh
npm install      # first time on a machine (node_modules isn't committed)
npm run dev      # Vite dev server
npm run build    # tsc --noEmit + vite build -> dist/
npm run preview  # serve the build
```

There are no tests or linter. `npm run build` is the check to run before committing.

**Pose images** only need regenerating when a PNG in `scroll-images(by-order)/` is added
or changed. Setup is in the header of `scripts/make_cutouts.py` (written for macOS/Linux
paths). On Windows:

```powershell
py -m venv .venv
.venv\Scripts\pip install "rembg[cpu]==2.0.61" pymatting pillow
.venv\Scripts\python scripts\make_cutouts.py          # all poses
.venv\Scripts\python scripts\make_cutouts.py 8_D6     # only the poses named
```

`.venv/` and `dist/` are not in `.gitignore` yet, so don't commit them.

## Stack

Vite 8, React 19, TypeScript 7 (strict, `noUnusedLocals`/`noUnusedParameters`). Plain
CSS: no Tailwind and no animation library. The only runtime dependencies are `react`,
`react-dom` and `@fontsource/anton`.

## How it works

**Content pipeline.** The content folders are the place to edit text and poses.

- `scroll-dialog(by-order)/N-dialog.txt`: the 6 dialog texts. Change copy here, not in code.
- `scroll-images(by-order)/I_DN.png`: the 8 source poses. `I` is the image order and `DN`
  is the dialog it belongs to (`4_D3` = 4th image, dialog 3). The site doesn't use these
  directly.
- `scripts/make_cutouts.py` turns them into `src/assets/poses/I_DN-{1024,640}.webp` with
  real transparency.
- `src/hero/pages.ts` globs both folders at build time (`import.meta.glob`) and makes one
  page per pose. A dialog with several poses is split into balanced pages at sentence
  boundaries, or at blank lines if the text file has them. Adding or removing a pose or
  dialog needs no code change.

**Hero** (`src/hero/`)

- `Hero.tsx`: a tall `<section class="hero">` track (pages × 70svh + 100svh) holding a
  sticky `.hero-stage`. How far the track has scrolled picks the active page. Clicking the
  box, or the ▼ button, first finishes the typing and then moves to the next page by
  scrolling to it. Also holds "Skip intro" (scrolls to `#after-hero`), the progress bars,
  and the `01 / 08` counter. Scrolling back shows each page's text in full, without retyping.
- `useTypewriter.ts`: a fixed 6 ms per character on every page.
- `DialogText.tsx`: renders the typed text. Characters not typed yet stay in place with
  `visibility: hidden`, so lines don't reflow. Phrases in `HIGHLIGHTS` get `GradientText`.
- `hero.css`: all hero styles, including the mobile layout
  (`max-width: 760px`, or portrait up to 1100px) and reduced motion.
- `src/components/GradientText.{tsx,css}`: from React Bits. The animation code is
  unchanged and its Tailwind classes are rewritten as plain CSS. It's vendored, so it keeps
  its own code style (semicolons).
- `src/App.tsx`: the Hero, then `<main id="after-hero">` holding the Resume.
- `src/styles.css`: global tokens (`--bg --surface --ink --muted --line --font --mono`).

**Resume** (`src/resume/`). The design reference is
`dynamic-resume-navigation-section/resume-refernce.png`.

- `content.ts`: all resume text, and the place to edit it. Text in `[square brackets]` is a
  placeholder. Contacts and links with an empty `text`/`href` show as placeholders.
  Sections come in four kinds: `groups` (chips), `timeline`, `cards` and `list`.
- `Paper.tsx`: the "paper" overview, which follows the reference's layout on a compact
  4:5 sheet. Each entry is drawn as a grey line, like a resume seen from far away. Each section is an
  `<a href="#/resume/<id>">`. Everything on the sheet is sized in `cqw`, so it scales as
  one piece.
- `Detail.tsx`: a section's own page. It's a fixed overlay rendered into `document.body`,
  with Back, previous/next and a giant faint title.
- `cinema.ts`: the camera choreography, using the Web Animations API with no library.
  - **Open:** the paper is pinned to the screen and transformed (origin top-left) to fill
    the screen with the section. The heading lifts off and grows into the giant title
    (FLIP). A blur veil fades in and the cards rise.
  - **Close:** the reverse.
  - **Previous/next:** pans the camera across the paper.
  - **Reduced motion:** a 200ms fade instead.
- `route.ts`: hash routes (`#/resume/skills`). Opening a section pushes a history entry,
  so browser Back returns to the paper. Previous/next replace it. A deep link opens
  straight on the section, without the camera move.
- `Resume.tsx`: React wiring. It handles popstate, resize, Escape, and the "landed on a
  deep link" back behaviour.
- `Icon.tsx`: inline Lucide icon paths.

## Decisions

The original spec is HERO_PLAN.md (imported at the bottom of this file). Settled since then:

- **Style:** professional with a touch of game. A warm light background (`#f1efea`), white
  dialog card, black pill name tag, B&W photos, and a monochrome gradient on highlights
  (`#111111` to `#9A9A9A`, following the pointer).
- **Layout:** the dialog box sits low beside the character and tucks in behind him
  (`--overlap: 10svh`). On phones the character is on top and the box sits in front,
  covering the waist.
- The name tag is hidden on page 1, because that line already introduces Priyadarshan.
- A huge, faint "FULLSTACK DEVELOPER" title in Anton sits behind the character and is the
  page's `<h1>`. On phones it takes two lines.
- **Scrolling:** normal scrolling only, with no scroll-jacking and no snapping.
- **Accessibility:** the dialog is real text. Screen readers get each page whole through an
  `aria-live` `.sr-only` paragraph, and the visual copy is `aria-hidden`.
- **Resume overview:** just the paper, centered, with no text beside it. The user had a
  "RESUME" heading on the left removed.
  - It's a compact 4:5 sheet sized by screen height (`width: min(100%, 72svh)`), so the
    whole resume fits in one view.
  - The user's laptop runs at 125% scaling, so its browser view is only about 1536×698
    CSS px. Check that size.
  - The avatar and name were shrunk at the user's request.
  - While scrolling in, the paper is hidden (`inert`). Only a huge, nearly invisible
    "RESUME" (Anton, 6% opacity) shows. Once the page is scrolled all the way down, the
    word sinks away and the paper rises in, row by row (`bringIn` in `Resume.tsx`).
    Scrolling back up hides the paper again. A deep link shows it immediately.
  - The paper keeps the reference's blue accents (`--sheet-*` tokens in `resume.css`),
    even though the rest of the site is monochrome.
- **Resume content:** the paper shows only grey lines, and the real text lives on the
  section pages. Seeded from the intro dialog: Skills, the two Experience roles,
  Education (B.Com) and the HeyItsMe project. Everything else is a placeholder. The
  avatar is pose 1, cropped in CSS.
- **Resume section pages:** a "camera" dives in. The section heading becomes a huge faint
  title behind the content, and the zoomed paper stays blurred behind everything.
  Previous/next wrap around, in the order of `sections` in `content.ts`.

## Conventions

- **Commits:** one change per commit. The subject is imperative and describes what a visitor
  sees ("Attach the dialog box to the character"). The body explains what and why in plain
  words. Commit messages end with the Co-Authored-By line.
- **Code:** no semicolons, single quotes, 2-space indent. Comments are short and say *why*.
  Match the existing density.
- **CSS:** sections are marked `/* ---------- Name ---------- */`.
- When an open decision in HERO_PLAN.md is settled, tick it off there too.

## Gotchas

- Most source PNGs have a **fake checkerboard** painted into the pixels, with no alpha
  channel. `8_D6.png` has real alpha, and the script detects that and keeps it.
- rembg must use `CPUExecutionProvider`, because CoreML hangs while compiling BiRefNet.
- The CSS minifier drops `translate` when it sits next to the `transform` used for the
  pose transition. That's why `.hero-pose` is centered with auto margins.
- Pose transition timings (opacity 450ms, transform 650ms) are tuned so two poses never
  show at once as a "double exposure", since the head sits in a different spot in each pose.
- The folder names contain parentheses, so quote them in shells (PowerShell: `-LiteralPath`).
- Windows PowerShell 5.1 `Get-Content` shows the dialog's curly quotes as `â€™`. The files
  are fine UTF-8, so don't "fix" them. Use the Read tool or `Get-Content -Encoding utf8`.
- **The resume paper must be pinned** (`.is-pinned`, `position: fixed` over its
  `.resume-slot`) while zoomed. A transformed paper left in the page overflows it, and
  phones then zoom the whole page out, which breaks the layout.
- The detail title and `.sheet-heading-text` must keep identical type settings (size
  ratio, weight, `letter-spacing: 0.09em`, `line-height: 1`). Otherwise the FLIP from
  heading to title jumps.
- **Checking the resume visually:** no browser tool is set up here. Drive the installed
  Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) with `puppeteer-core`
  from a scratch folder. To film transitions, slow them down with DevTools
  `Animation.setPlaybackRate`. Don't pause and seek with the Web Animations API: an
  animation seeked past its end drops out of `document.getAnimations()`, so it never
  resumes and the cinema stays "busy".

## Current state

_Last updated: 2026-10-20_

- Hero: first version done (2026-10-17).
- Resume section: done (2026-10-20) and reworked once from the user's feedback. It was
  checked at 1536×698 (the user's laptop), 1920×870, on a 390×844 phone and with reduced
  motion. All the content apart from the seeded facts is still a placeholder, waiting
  for real text in `src/resume/content.ts`.
- **Open:** the hero's background treatment (open decision in HERO_PLAN.md).
- **Next ideas, not asked for yet:** a "Download PDF" button and a footer or contact
  section.
- No hosting or deploy is set up yet.

## Session log (newest first)

### 2026-10-20 (Windows PC)

- Built the interactive resume section from the user's reference image.
- The user's brief: click a section → cinematic zoom → the section's heading becomes
  huge and stays faint in the back → its details in front, as a separate page. Coming
  back returns to the paper.
- On phones the zoomed paper made the page zoom out, so the fix was to pin the paper to
  the screen while the camera is on it.
- The user's feedback after seeing it:
  - center the paper and remove the left-side "RESUME / The whole story on one page" text;
  - fit the whole resume in one view;
  - make the photo and name smaller.

  That gave the compact 4:5 sheet sized by screen height.
- The user then asked not to see the resume while scrolling into it, only once at the
  very bottom. That gave the faint "RESUME" teaser and the reveal.
- The user asked to install and use `npx skills add Leonxlnx/taste-skill` (the
  `design-taste-frontend` skill). The installer was blocked by Claude Code's safety
  check, so its motion rules were applied by hand to the reveal: a stagger of 60–90ms,
  a 16–32px rise, transform and opacity only, and a reduced-motion fallback.
  - Its other rules clash with decisions already made: no grey-bar placeholders, no
    monospace labels, no shadows at rest, no pill buttons, no 01/08 numbering.
  - Not applied yet. Ask the user before restyling for them.
- The content still needs to be filled in.
- **Later that day: the taste skill was tried and then fully reverted at the user's
  request.**
  - He installed it, and a strict restyle was built on a branch: Archivo, the name as a
    monument, a black resume field, real text on the paper.
  - He rejected it and asked for a strict revert to before the skill. `main` was reset to
    `7099182`, the restyle branch deleted, and the skill and all its files removed.
  - Don't reinstall the taste skill or restyle by its rules unless he asks.
  - The site is exactly as it was before the skill. The only things kept from that
    stretch: the he/him doc fix and the "always update CLAUDE.md" rule.
- The user is Priyadarshan himself and uses he/him.

### 2026-10-19 (Windows PC)

- Tried to teleport the Remote Control session "Portfolio hero scroll dialogs" onto this
  freshly cloned PC. It failed because chat history stays on the machine that started it.
- Added this CLAUDE.md so project context travels with the repo. When the same chat is
  needed on several machines, use cloud sessions at claude.ai/code.

### 2026-10-17 (first build session, on another machine)

- Wrote HERO_PLAN.md and built the scroll-driven dialog hero, fixing missing punctuation in
  dialogs 2-4 (`42a7f60`).
- Replaced pose 8 with a PNG that has real alpha. `make_cutouts.py` now keeps an existing
  alpha channel and takes pose names as arguments (`8d582fe`).
- Set one typing speed for every page, 6 ms per character (`a9b7722`).
- Added the animated gradient on the name and two phrases with React Bits GradientText
  (`2a1a3c9`).
- Attached the dialog box to the character: low beside him and tucked behind (`daf0e87`).
- Hid the name tag on page 1 (`835e5a7`).
- Added the faint "Fullstack Developer" title behind the character (`f7168c9`).

---

@HERO_PLAN.md
