# Hero Section Plan: Scroll-Driven Self-Intro Dialog

## Concept

The hero works like a dialog scene in a video game. Priyadarshan introduces himself
one line at a time, and each line comes with a different pose or gesture.

Here it's driven by scroll instead of a "next" button:

- Each scroll step moves to the next line of dialog.
- When the line changes, the character image changes to the pose that fits it.
- The image swap and the dialog text transition smoothly together, so it reads as one
  character talking, not a slideshow.

## Layout (decided)

- From the viewer's side: **character image on the left, dialog box on the right.**
- The two sit together in the middle of the screen and fill the whole hero (full
  viewport height). The character is large and uses the full height; the dialog box sits
  vertically centered beside it.
- Phones are too narrow to fit a long page next to the image, so the layout adapts there
  (likely image on top, dialog below). The exact breakpoint comes from the design spec.

## Content

The source material lives in two folders. The site reads from them, so they remain the
place to edit.

- `scroll-dialog(by-order)/N-dialog.txt`: 6 dialogs, in order.
- `scroll-images(by-order)/I_DN.png`: 8 poses. `I` is the image's order, `DN` is the
  dialog it belongs to (e.g. `4_D3` = 4th image, dialog 3).

When a dialog has more than one image, it is split into pages at sentence boundaries, one
page per image, balancing the page lengths. That gives 8 pages, one per pose:

| Page | Pose   | Dialog   | Starts with                                   |
|------|--------|----------|-----------------------------------------------|
| 1    | `1_D1` | 1        | "I'm Priyadarshan, and if I had to describe…" |
| 2    | `2_D2` | 2        | "I started with a B.Com and…"                 |
| 3    | `3_D3` | 3 (1/2)  | "I began with HTML and CSS…"                  |
| 4    | `4_D3` | 3 (2/2)  | "I explored JavaScript…"                      |
| 5    | `5_D4` | 4 (1/2)  | "Today, I'm a Full-Stack (MERN) Developer…"   |
| 6    | `6_D4` | 4 (2/2)  | "I design workflows, APIs, and data models…"  |
| 7    | `7_D5` | 5        | "I've also gained hands-on experience…"       |
| 8    | `8_D6` | 6        | "I enjoy structuring data well…"              |

## Assets: fake transparency

The pose PNGs are **not actually transparent**. The checkerboard is painted into the
pixels: white and light-grey squares about 12px wide, and the files have no alpha channel.
Each image needs real background removal before the site can use it.

`scripts/make_cutouts.py` handles this with the BiRefNet portrait model. It outputs WebP
files with real transparency to `src/assets/poses/` in two sizes (1024 and 640 px wide).
Re-run it when images change or new ones are added (setup steps are at the top of the script).

## Visual Style

**Direction: professional, with a touch of game.** The first image (comic bubble, orange
highlights) was only a reference for the concept, not the final style.

- **Professional base:** clean modern layout, restrained palette, strong typography,
  plenty of whitespace. The B&W photos already suit this.
- **Game touches, kept subtle:**
  - A dialog box with a small name tag ("Priyadarshan"), like an RPG speaker label
  - Text that types out line by line
  - A small "continue" prompt when a line finishes
  - A progress indicator showing which page you're on
- The game feel comes from how it behaves (pacing, the prompt, the pose changes), not
  from loud cartoon styling.

## Behaviour

- **Pinned scene:** the hero stays fixed (sticky) while the page scrolls past it. It
  takes about 70% of a screen height of scrolling per page. It uses normal scrolling:
  no scroll-jacking and no scroll snapping.
- **Pose transition:** a short transition between poses, tuned so two poses never show
  at once as a "double exposure" (the head sits in a slightly different spot in each pose).
- **Text:** each page types out when you reach it. Clicking the dialog box (or pressing
  Enter) finishes the line; clicking again moves to the next page, like in a game.
- **Reversible:** scrolling up goes back through the pages, with the text shown in full.
- **Skip intro:** a control that jumps straight past the hero.
- **Exit:** after the last page, the hero releases and the next section scrolls in.

## Technical Notes

- Stack: **Vite + React + TypeScript**, plain CSS, no animation library.
- Load the first pose right away and the rest in the background, so pose swaps never flash.
- Serve WebP in several sizes so phones download small files.
- Respect `prefers-reduced-motion`: no typing effect, no idle motion, near-instant swaps.
- Accessibility: all dialog text is real text on the page (not baked into images), and
  screen readers get each page as a whole, not letter by letter.

## Open Decisions

- [x] First version built: warm light background, white dialog card with a black name tag,
      typing text, ▼ continue prompt, `01 / 08` counter and progress bars.
- [x] Copy edits: added the missing punctuation in dialogs 2, 3 and 4.
- [ ] Background treatment of the hero.
