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
`references/dynamic-resume-navigation-section/resume-refernce.png`.

- `content.ts`: all resume text, and the place to edit it, filled from his own resume. A
  contact with an empty `text` shows as a grey line, and a link with an empty `href` shows
  as "not live yet". Sections come in four kinds: `groups` (chips), `timeline`, `cards`
  and `list`.
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
- `SkillRiver.tsx` + `skillRiver.css`: the Skills page as a cream mid-century poster, after
  his `skill-section/skill-section-tree-scroll-navigation-idea/Skills Journey Infographic.png`
  (`image.png` there is its line-art inspiration). Cream page (`#f1ece3` veil). SKILLS is the
  usual faint, centred page title behind the content, in warm grey `#6f6a5f` (the poster's
  top-right tagline was dropped at his request). Sections have no boxes: a number, a rule
  running to a sage dot (`#7a8575`) beside the lines, a title, outlined pill chips. The dot is a
  pie loader: an empty ring when the lines reach it, filling clockwise with the scroll as its
  rows come in, solid once they all have (`--fill` 0-1 from `render`, eased toward the scroll's value by a small rAF loop so it glides, drawn with a `conic-gradient` with a soft leading edge; pops once when full via `.is-full`); they
  alternate left and right in a grid (`1fr 192px 1fr`), each one `--step` below the last.
  Five thin black lines (~2px, 7px apart) run down the middle: straight past each dot
  (`SWAY` = 72px from the centre), a rounded S over to the other side between dots, then back
  to the centre and down to "KEEP EXPLORING". A big sage circle bleeds off the bottom-left.
  **The scroll plays the poster like a timeline** (the poster is *pinned*): `.journey` is a
  tall track pulled up to the very top of the page (`margin-top: -pin`, so the scroll
  position is the time), `.journey-stage` is sticky at `top: 0` and as tall as the screen, and
  `.journey-poster` slides up inside it (`translate3d`). The poster starts `--pin` down
  (the bar and the title's room) via **padding on `.journey-window`; a margin would collapse
  out and be lost once the stage sticks**. There is no clipping or fade: sections already
  reached stay visible as they scroll up and off the top, and only sections the lines haven't
  reached yet are hidden. For each section, the lines wait at its
  dot while its skills come in, **one row per `ROW_PX` (84px) of scrolling** (rows = how the
  chips wrap, grouped in `measure`), then travel on to the next dot over `TRAVEL` (0.5) of
  the distance between them. The lines' tip stays at one height in the window (`anchor`, as
  high as the tallest section below a dot allows); the section appears as the lines reach its
  dot, and everything reverses on scrolling up. `render` computes all of it from
  `scroller.scrollTop`: no timers and no scroll locking, so there is nothing to fight. The
  lines are hidden at the top (mask rect height 0). Positions come from layout offsets, not
  `getBoundingClientRect`; a ResizeObserver re-measures. Lenis smooth scroll. Phones: one
  column, a straight run of lines on the left. Reduced motion (`.is-static`): no pinning,
  everything shown.
- `scrollPush.ts`: **the whole site works by scrolling alone** (clicks still work). `useScrollPush`
  watches wheel and touch: once a page is already scrolled to its end, carrying on scrolling
  "pushes" toward the next place (300px of scrolling without stopping; a pause drains it, and a
  move is followed by a 1.3s rest). A small cue at the bottom of the screen (top when going up;
  `.push-cue` in `resume.css`) names where it goes and fills up. Used for: the paper (down opens
  Skills, `Resume.tsx`); every section page (down goes to the next section, up to the previous;
  past the last or first, back to the paper, `Detail.tsx`); a project's page (down goes to the
  next project, after the last back to the list; up goes back to the list, `Projects.tsx`). The
  pushes are ignored while a project page is open on top of a section (`.pj-page`).
- `src/ScrollToggle.tsx`: an **Auto-scroll On/Off switch fixed in the bottom-left corner of the
  whole site** (portalled into `<body>` so section pages never cover it; z-index 500; kept as quiet as possible at his request: a 28x16px outline switch in dark ink at 60% opacity with no box, and the words "Auto-scroll on/off" slide out only on hover or focus). The state
  lives in `scrollPush.ts` (`autoScroll`, `useAutoScroll`, saved in `localStorage` key
  `auto-scroll`, on by default). Off: no push to the next section and no project opening by
  itself; wheel scrolling still works normally, and clicks and arrows still work.
- Projects list: scrolling down brings each picture to the middle; the list pauses (Lenis
  `stop()` for 650ms) and the project opens by itself. A project re-arms when its picture moves
  more than 30% of the screen from the middle, and only scrolling *down* opens one.
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
- **Section colours:** each section has its own faint colour, set by `[data-tone='<id>']` in
  `resume.css`.
  - The heading text is 50% tinted toward it (`--tone-ink`). The icon circle gets a 16%
    wash, and the underline is at 90%.
  - The section page's giant title uses the same tint, so the FLIP keeps its colour.
  - The user first asked for "minimal, unseeable". The 30% version was too faint, and he
    asked for "a little more seeable". Keep it subtle.
- **Resume content:** the paper shows grey lines, and the real text lives on the section
  pages.
  - Everything comes from his resume PDF (October 2026), with typos and cut-off bullets
    cleaned up. He will update the resume later.
  - **Never show his phone number.** He asked for it to be left out.
  - Contacts, in the order shown on the paper: email, LinkedIn `darshan-stack`, GitHub `DarshanLevi`, then Cuddalore (last, at his request).
  - His resume has Languages (Tamil, English) and no Interests, so the Interests slot is
    now **Languages**.
  - Achievements holds one real result: about 80% fewer upload crashes in MYCARBOY.
  - Projects: MYCARBOY, schoolNest, VR De-Addiction Wellness (a proof of concept, not a
    clinical product), Marina FC Website (a one-day client POC, no link yet), and the personal projects Musica and Find-ISS (tagged
    "Personal project" in their meta line). Decimal-chess and Word-Builder were removed at his request. The
    HeyItsMe project isn't on his resume, so it was dropped. No project links yet.
  - Not used anywhere yet: his professional summary.
  - The avatar is pose 1, cropped in CSS.
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

- **Pushing to GitHub:** the repo is owned by `darshanscodesoftwares`. Git Credential
  Manager can hold a saved login for a different account (`DarshanLevi`), which has no
  write access. The push then fails with 403 and VS Code offers to "Create Fork". Never
  fork. Remove the `git:https://github.com` entry in Windows Credential Manager and push
  again, then sign in as `darshanscodesoftwares`. Commit authorship (`user.name`) is
  separate and doesn't affect push rights.

## Current state

_Last updated: 2026-10-23_

- Hero: first version done (2026-10-17).
- Resume section: done (2026-10-20) and reworked once from the user's feedback. It was
  checked at 1536×698 (the user's laptop), 1920×870, on a 390×844 phone and with reduced
  motion. Its content is filled in from his resume (2026-10-20). Certifications now hold
  three entries from his LinkedIn, each with a date and a "Show credential" link (2026-10-22).
- **Gotcha, Lenis:** any scrollable layer inside the Projects section needs its own Lenis
  (as the project page has) or `data-lenis-prevent`, and the list's Lenis `prevent` must
  skip it, or the wheel won't scroll it.
- **Open:** the hero's background treatment (open decision in HERO_PLAN.md).
- **Next ideas, not asked for yet:** a "Download PDF" button and a footer or contact
  section.
- No hosting or deploy is set up yet.
- `main` was reset to `b850214` to remove the later themed Projects and Skills work. The
  project and skill pages are back to the regular resume-section design.
- Keep `skill-section/skill-description-content/` intact. It contains the user's six
  project write-ups, now tracked in Git; do not remove them during cleanup.
- Commit `570704f` adds a compact detail-page layout for wide screens up to 800px tall,
  reorders the Skills groups (Full-stack and web before Databases and Languages), and
  restores the minimal section pager from commit `53c3b9d`.

## Session log (newest first)

### 2026-10-24

- The mouse wheel didn't scroll a project's own page: Lenis (smooth scroll on the Projects
  list) caught the wheel for the whole section, while the project page is a separate fixed
  layer with its own scroll. Fix: the page gets its **own Lenis** (`wrapper` and `content`
  both the `.pj-page` element, same `lerp 0.075`, so it glides like the list), and the
  list's Lenis ignores events from inside it (`prevent: node.closest('.pj-page')`). Checked
  in Chrome at 1366x768: the wheel scrolls the list, a project page glides (190 midway to
  360), the list behind doesn't move, no errors.
- Then he asked for the title, category and duration line at the top of a project's page to
  go away on the first or second scroll (it sat over the pictures). It now fades out over
  the first 160px of scrolling (`.pj-page-head` opacity set from the page's scroll in
  `Projects.tsx`) and returns at the top. Checked in Chrome: 1 at the top, 0.44 after one
  wheel notch, 0 after 400px. The "Back" button and the facts column stay.
- Then the project's name appears above "Overview" once the top title has faded: a
  `.pj-facts-title` element takes over from `.pj-page-head` (which fades with the page's
  scroll over 160px). The name waits until that is 80% gone, then eases in over 900ms after a
  250ms delay, and goes out in 250ms (`.is-shown`, `projects.css`); he asked for it later and slower. In the stacked phone/portrait layout there is no
  cross-fade: the heading stays and scrolls away with the page. Checked at 1366x651 and
  390x844.
- Rebuilt the Skills page as a "river" after his three reference images (see `SkillRiver.tsx`
  in How it works): cards left, right, left, right, joined by flowing parallel blue lines
  with a big dot at each card, drawing itself as the page scrolls smoothly. Other `groups`
  sections (Tools, Languages) keep the plain card grid. Checked in Chrome at 1366x768 and
  390x844: no errors, no sideways scroll, counter and reveal follow the scroll. The
  reference's display font for the titles wasn't added; titles use the site's sans.
- He liked the river and asked for the reference's exact line colours and count. Sampled
  the reference: five lines about 15px apart, each a different blue, white edges, a pale
  band between lines 3 and 4, a soft glow. The river now draws five true offset curves
  instead of concentric strokes (which could only make matching pairs), and the dots grew
  to 56px to match the wider ribbon. Checked at 1366x768 and 390x844.
- Then he asked for the reference's exact line length and bend between the cards. Traced the
  ribbon's centre row by row in the reference: it overshoots the next dot by about half the
  gap at a bend ~40% of the way down, then crosses the dot at a slant. `riverCurves` now
  builds that (before, it touched each dot at a bend's far point). Checked at 1366x768 and
  on a phone, where the river stays a straight line down the left.
- He then rejected the organic "river" bends as random and asked for a smooth, regular
  pattern in black/grey/beige with one dark blue line in the centre. Now the cards sit on an
  even step and the line is one regular wave (see How it works); the blue reference colours
  and the pale band are gone. Checked at 1366x768 and 390x844, no errors.
- He asked for the lines of his "Centered Skills Pipeline Portfolio UI" reference and
  thinner lines: now ~2px lines 6px apart (was 5px lines 12px apart), smaller dots (44px),
  and the first dot is left sideways. His screenshot still showed the older spiky shape, so
  he may need to refresh the page.
- Then: lines should go out to the side, bend, then go down, and be lighter, softer and
  glow a little. Rebuilt as a central spine with a branch from each dot (see How it works),
  lighter colours (slate, silver, blue, sand) and a faint glow; the middle gap widened so
  the branches run sideways first. Checked at 1366x768 and 390x844.
- After several rounds on the connecting lines (river, even wave, central spine with
  branches) he said to **scrap the lines** and keep the rest. All line code is gone; the
  zig-zag cards, dots, counter and smooth scroll stay. Don't bring the lines back unless he
  asks.
- He then had the Skills page redone after a new reference, "Skills Journey Infographic"
  (a cream poster with thin black stepped lines, sage dots and a sage circle). Rebuilt
  `SkillRiver.tsx`/`skillRiver.css` as that poster (see How it works); the earlier blue
  cards, counter and dot halos are gone. Checked at 1366x768 and 390x844, no errors, no
  sideways scroll.
- Then: SKILLS back to the old way (centred, faint, behind the page) and the tagline on the
  right removed; everything else about the poster he called perfect.
- At his request the lines don't show at all until scrolling starts; they draw from the
  scroll position (0 at the top, all drawn at the end).
- The lines snapped in at the first scroll (they started above the first dot and the mask
  added a fixed 80px). Now they start at the Frontend dot and the mask grows from 0 there,
  in proportion to the scroll, so they ease out of the dot.
- Then each section's title and chips appear only when the line reaches its dot (before, they
  faded in when scrolled into view). The first is always shown, since the lines start at
  its dot. They also leave again if scrolled back up. Checked at 1366x651, 1366x768 and
  390x844: every dot is well on screen when its section appears.
- Then, on the Skills poster: each section's skills appear row by row, and the line waits at
  its dot until they've all appeared before moving on to the next section. The first
  section's rows play on load (the lines themselves still start only on scrolling). I read
  "each line of skills" as each row of chips; if he meant one chip at a time, change the
  `data-row` grouping in `measure`. Checked at 1366x768 and 390x844: the line held at 202/404
  px while a section filled, then moved on; no errors.
- Then he could still scroll past a section while its skills were appearing above. Now the
  page is held at each section until its rows are done (slowed on the way in, stopped at the
  limit, released after); between sections it scrolls freely and fast. Checked flicking the
  wheel non-stop at 1366x768 and 1366x651: a 470px overshoot glides back to ~200 for Backend,
  and the whole poster completes with no errors. Keyboard and scrollbar dragging bypass Lenis,
  so they aren't held.
- He said the timed reveal plus scroll-hold felt abrupt and glitchy (it fought the scroll),
  and asked for each scroll to bring in one row. **Replaced both with a pinned, scroll-played
  timeline** (see How it works): the poster is pinned, each section's rows come in as you
  scroll (84px per row), the line travels between sections, nothing is stopped or timed. The
  old `tick`/`lenis.stop()` hold code is gone. Checked scrolling one wheel notch at a time at
  1366x768, 1366x651 and 390x844: rows, lines and sections follow the scroll, no errors, no
  sideways scroll. The circle now bleeds off the bottom instead of being cut flat.
- He noticed finished sections vanished under the SKILLS title (the pinned window clipped and
  faded everything above it) and wanted the old behaviour: only unreached sections hidden.
  Removed the window clipping: the stage now fills the screen from the top and the poster
  slides up through it, and the active section sits lower (about 290px down at 1366x651).
  A first attempt lost the poster's offset because its top margin collapsed through the
  stage; fixed with padding. Checked scrolling at 1366x768, 1366x651 and 390x844.
- Then each section's dot became a pie loader: empty when the lines reach it, filling
  clockwise in step with the scroll as its rows come in, solid sage once the last row has
  appeared. Checked fills while scrolling at 1366x768 (0.24, 0.68, 1.00 for Backend while
  the rest stayed 0).
- He asked for the pie to be "bubblier, smoother": the fill now eases toward the scroll-driven
  value (it glides over ~0.5s after each wheel notch instead of stepping), the leading edge is
  soft, and the circle pops (scale 1.22) once when it completes. Reduced motion: no ease or pop.
- The completion pop now starts earlier: when the eased fill reaches 90% (it used to wait for
  99.5%, which the ease reaches late), and resets once the fill falls below 75%.
- Gave each dot a cream gap around it (a 9px cream `box-shadow` ring on `.journey-dot`), so
  the lines and the rule stop short of it, as in his reference.
- He asked for the reference's bend and length (one continuous S from dot to dot) and then
  said "nope, revert". **The bend is as before** (straight past each dot, a short ~110px S
  halfway between dots); he called that one good. Don't change the bends unless he asks.
- He asked for a three-part resume header (photo centred, email and location left, LinkedIn
  and GitHub right), then said to **put them back in their original places** and make the four
  contacts more visible instead. So the header is as originally designed: photo and name on the
  left, a divider, the four contacts in a column on the right. The contacts are bigger and
  bolder (1.95cqw, weight 500, icons 2.5cqw in the accent blue; was 1.3cqw and 1.7cqw). Checked
  at 1536x698, 1366x651 and 390x844: nothing overflows and the sheet still fits. Don't centre
  the photo again unless he asks.
- The photo's face sat off-centre in the resume avatar circle. Measured the head on the pose
  image (640px wide: hair top y=53, chin y=425, face centred at x=340; the first guesses had the
  chin too high and cut it off) and re-cropped the circle in CSS (`top: -5.5%`, `left: -22.2%`,
  `width: 131%` on `.sheet-avatar img`; the first computed values looked low and right of
  centre in a capture, so they were nudged until the head's centre of mass measured 0.50
  across) so the whole head, hair to chin, sits centred in the circle.
- Gave the paper's contacts a hover/focus effect: a link contact (email, LinkedIn, GitHub; not
  the location, which has no link) gets a soft accent-blue highlight behind its text, the text
  turns blue, and a small ↗ arrow slides out to its right (`.sheet-contacts a[href]` in
  `resume.css`; the highlight uses negative margins so the rows don't move). Verified the
  email highlight in a capture and the LinkedIn arrow's opacity; rows stay put on hover.
- The hover arrow on the paper's section headings sat on top of the end of "TOOLS &
  TECHNOLOGIES" (that heading fills the left column's width). In the left column the arrow now
  sits out in the column's margin (`.sheet-side .sheet-open { right: -2.7cqw }`), about 12px
  clear of the text at 1536, 1366 and 390 wide; the right column's arrow is unchanged. It sits
  just outside the hover tile's edge, which is the price of not shrinking the heading (its type
  settings are shared with the section page's title for the camera move).
- He said the site is 90% scrolling and should work by scroll alone, with clicks still there.
  Added `scrollPush.ts` (see How it works): from the paper, scrolling on opens Skills; at the end
  of each section page, scrolling on moves to the next (up goes back; past the ends, back to the
  paper); the Projects list opens each project after a short pause on its picture, and a
  project's page, scrolled to its end, moves to the next project, then back to the list after the
  last. Tested end to end with only the wheel at 1366x768: paper > skills > tools > projects >
  all six projects in order > languages > achievements > experience > education >
  certifications > paper in about 37s; and upward from Education all the way back to the paper
  in about 10s; no errors. Not yet tried on a real touch device or a trackpad's momentum
  scrolling, or by eye in the cue's animation (only one capture of the cue).
- Added an Auto-scroll On/Off switch in the bottom-left corner, on every page, at his request
  ("full-web scrolling on/off"). Off turns off the scroll-pushes and the project auto-open; on
  by default and remembered. Tested: off stays on Education after pushing, on moves to
  Certifications; with it off a project doesn't open from the list, with it on it does; it is
  clickable over a section page (an earlier version inside `#root` was covered by the section
  overlay's hit area, so it is portalled to `<body>`); it stays off after a reload.
- He wanted the switch "less visible as possible": removed the dark pill and label; it is now a
  tiny outline switch at 28% opacity that brightens and shows its words on hover or focus. Still
  clickable over every page (checked on Skills, over the sage circle).
- Then it was too faint to find: enlarged to 28x16px and darkened (60% opacity, dark ink
  `#2f2f2c`). Checked on the Projects page (light) and over the Skills sage circle.

### 2026-10-23

- Rebuilt the Projects page after quangdinh.im/projects (his reference in
  `references/projects-section/`): `Projects.tsx` + `projects.css`. A centred column of
  5:4 thumbnails scrolls; the title (Instrument Serif italic) and category roll at the
  sides as each picture crosses the middle; a lime highlighter "Projects" sits behind;
  hover greys a picture and shows a "See detail" eye cursor; corners show Cuddalore's
  coordinates and his local time. Clicking opens the project's own page: the picture flies
  into the after-click poster, with header (difference blend), "← Back", a facts column
  (overview, duration, category, links) and his write-ups (`notes` in `content.ts`). Esc
  closes it before the section. Images come from `scripts/make_project_media.py`
  (→ `src/assets/projects/`). Added `@fontsource/instrument-serif`. Checked at 1536x698 and
  on a 390px phone.
- He then had the lime highlighter "Projects" removed; the faint giant PROJECTS title is
  back behind the column, like every other section page.
- Switched the Projects page to the site's own fonts (no serif, at his request): titles in
  the sans `--font`, small labels in the uppercase `--mono` style; removed
  `@fontsource/instrument-serif`.
- Pictures shrunk to `min(40vw, 70svh × 1.25)`; hover now adds a vignette and animated film
  grain (`.pj-thumb::before/::after`) instead of greyscale.
- On a project's page the list picture now comes first (top, where the click flies to,
  `.pj-lead`) and the square poster follows below it (`.pj-poster`), at his request.
- The open/close is a true FLIP of that same picture (no ghost copy): it glides from its
  list slot to the page and, on Back/Esc, glides back while the page empties; the list
  picture is hidden while away. The in-effect cancels earlier animations before measuring,
  because React dev mode runs it twice and the second pass measured mid-flight.
- "Next project" is smooth too: the page's contents fade out (the page itself stays, so the
  list never shows), the list scrolls the next picture to the centre behind it, and that
  picture glides up into place (`chained` skips the background fade).
- Removed the coordinates and the clock from the list's corners; two big "+" crosses sit
  there instead and turn with the scroll like a ship's wheel (0.15°/px, opposite
  directions, a 0.9s eased lag for weight).
- Smooth inertial scrolling on the Projects list with Lenis (new dependency `lenis`, as the
  reference site uses), scoped to the section's `[data-scroll]` container, `lerp 0.075`;
  off with reduced motion. Exception to the old "normal scrolling only" rule, at his request.
- Checked the Projects list and pages at 1366x768, 1024x700, 820x1180 and 390x844 (no
  sideways scroll). Portrait tablets now get the stacked phone layout
  (`max-width: 760px, or 1100px portrait`, like the hero).
- `references/projects-section/` is committed: the quangdinh.im screenshots, his thumbnails and
  the after-click posters that `scripts/make_project_media.py` reads (about 32 MB).
- Merged nothing: he confirmed he reverted the themed Projects and Skills designs himself, so
  this PC's `main` was reset to GitHub's. The notice board, lantern, constellation sky,
  skill icons, lens and GSAP camera only survive in the local branch
  `backup/themed-work-2026-10-23` (23 commits, never pushed). He said not to worry about
  them; delete the branch whenever he agrees. `.env.local` is gitignored again.
- Reset `main` to `b850214`, removing the later themed Projects and Skills changes. Kept
  `skill-section/skill-description-content/` exactly as it was.
- Added compact section-page spacing for 1366 × 768, reordered the Skills groups, and
  restored the minimal previous/next pager from `53c3b9d`. These follow-up changes are in
  `570704f`; no push was made.
- Committed the six preserved project write-ups under `skill-section/skill-description-content/`.

### 2026-10-27 (Windows PC)

- Added the Marina FC Website project, read from its public GitHub repo
  (`darshanscodesoftwares/Marina-FC_POC`). He asked for it to be labelled a proof of concept
  and to take one day. No GitHub link was added because he didn't say whether to show it.
  The stack tags come from the repo's package.json.

### 2026-10-26 (Windows PC)

- Added the VR De-Addiction Wellness project, compacted to one paragraph and ten tags from
  his longer write-up. It is labelled a proof of concept on purpose, since his notes say it
  is not a finished clinical product. The "locked 72 fps on device" figure comes from his notes.

### 2026-10-25 (Windows PC)

- Removed the Decimal-chess and Word-Builder project cards at his request. Musica and
  Find-ISS stay and are tagged "Personal project" in their meta line.

### 2026-10-24 (Windows PC)

- Replaced the short tag lists on MYCARBOY and schoolNest with their full tech stacks, as
  he wrote them. The project text itself is unchanged, so schoolNest's description still
  says "backend" although its stack now includes React, Next.js and Flutter.

### 2026-10-23 (Windows PC)

- Added the rest of his LinkedIn skills to the resume. Skills gained "Full-stack and web"
  and "Engineering practice" groups, and Databases gained DBMS and Database Development.
  Tools gained "Operating systems" (Linux, Mac) and Google Slides and Sheets under Design.
- Skills already on the resume were not duplicated (React.js, Node.js, Git, PM2 and so on).
  The paper preview shows only the first 8 skills, so its layout didn't change.

### 2026-10-22 (Windows PC)

- Push to GitHub was blocked and VS Code offered a fork. Cause: a saved `DarshanLevi`
  login in Git Credential Manager. He removed it, signed in as `darshanscodesoftwares`, and
  the push went through (see Gotchas).
- Ran `npm install` and the dev server for him. PowerShell blocks `npm.ps1` on this PC, so
  use `npm.cmd` or set the execution policy to RemoteSigned for the current user.
- Added his LinkedIn certifications to the resume: the Udemy full-stack bootcamp (Jan 2025),
  Google Digital Marketing and E-commerce (Apr 2025) and Google Data Analytics (Aug 2022),
  each linking to its credential. Credential IDs are in the URLs, not shown on screen.
- Only the Digital Marketing link was confirmed live. Udemy returned 403 and the Data
  Analytics page needs a login, so ask him to click both.

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
- Added a faint, distinct colour to each resume section's heading, at the user's request,
  then made it a step more visible: text from 30% to 50%, icon wash from 10% to 16%,
  underline from 70% to 90%.
- Filled the resume with his real details from his resume PDF.
  - Left out his phone number at his request.
  - Interests became Languages.
  - His one measurable result went under Achievements.
  - Certifications have no year, so the paper skips their date line.
  - He called the taste-skill revamp "complete shit": make only the design changes he asks
    for, one at a time.

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
