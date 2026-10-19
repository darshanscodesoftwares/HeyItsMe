# HeyItsMe

Personal portfolio site for **Priyadarshan**, a Full-Stack (MERN) developer.
Repo: github.com/darshanscodesoftwares/HeyItsMe. So far only the hero is built: a
scroll-driven, video-game-style self-introduction. Everything after it is a placeholder.

> The user works on this repo from several PCs (Windows, and at least one other machine).
> Chat history stays on the machine where it happened, but this file travels with the repo.
> Start from **Current state** and **Session log** below and pick up where things were
> left, instead of re-analysing the project from scratch.

## Keep this file up to date (every session)

- When you finish a piece of work, update **Current state** and add or extend today's
  **Session log** entry *in the same commit* as the work.
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
- `src/App.tsx`: the Hero, then a placeholder `<main id="after-hero">`.
- `src/styles.css`: global tokens (`--bg --surface --ink --muted --line --font --mono`).

## Decisions

The original spec is HERO_PLAN.md (imported at the bottom of this file). Settled since then:

- **Style:** professional with a touch of game. A warm light background (`#f1efea`), white
  dialog card, black pill name tag, B&W photos, and a monochrome gradient on highlights
  (`#111111` to `#9A9A9A`, following the pointer).
- **Layout:** the dialog box sits low beside the character and tucks in behind them
  (`--overlap: 10svh`). On phones the character is on top and the box sits in front,
  covering the waist.
- The name tag is hidden on page 1, because that line already introduces Priyadarshan.
- A huge, faint "FULLSTACK DEVELOPER" title in Anton sits behind the character and is the
  page's `<h1>`. On phones it takes two lines.
- **Scrolling:** normal scrolling only, with no scroll-jacking and no snapping.
- **Accessibility:** the dialog is real text. Screen readers get each page whole through an
  `aria-live` `.sr-only` paragraph, and the visual copy is `aria-hidden`.

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

## Current state

_Last updated: 2026-10-19_

- First version of the hero is done (7 commits, 2026-10-17), committed and on `origin/main`.
- **Open:** the hero's background treatment (open decision in HERO_PLAN.md).
- **Not started:** the rest of the site (projects, experience, contact). `App.tsx` only
  has a placeholder.
- No hosting or deploy is set up yet.

## Session log (newest first)

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
- Attached the dialog box to the character: low beside them and tucked behind (`daf0e87`).
- Hid the name tag on page 1 (`835e5a7`).
- Added the faint "Fullstack Developer" title behind the character (`f7168c9`).

---

@HERO_PLAN.md
