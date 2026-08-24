# systemssystemssystems

**live at [systemssystemssystems.faith](https://systemssystemssystems.faith/)**

a gallery of generated structures — pylons, lattices, blooms — with a CRT-photocopy soul.
plain HTML, CSS, and JavaScript. no framework, no build step, no dependencies.

| | |
|---|---|
| ![the field](docs/field.jpg) | ![the grid](docs/grid.jpg) |
| **the field** — scattered pieces that migrate | **the grid** — an endless drag-to-drift sheet |

## the three rooms

- **the field** (`index.html`) — every piece scattered across a long, slow scroll. Each one
  dissolves and reappears somewhere new on its own clock, hums between opacities, and fizzes with
  static as the cursor approaches. Scroll parallax drifts them at different speeds — and scrolling
  itself is deliberately heavier than a normal page: wheel and touch are damped and speed-capped so
  the works drift past rather than fly (keyboard and scrollbar stay native; `prefers-reduced-motion`
  gets an ordinary page). Click any piece for the full-resolution lightbox.
- **the grid** (`grid.html`) — the full set in strict rows and columns, repeating endlessly in every
  direction. Drag, flick, or scroll-wheel to pan; space wraps invisibly on both axes (the sheet is a
  3×3 patchwork of identical copies and the camera teleports by exactly one copy whenever it crosses
  one). On a keyboard, `Tab` walks the tiles and the sheet pans to follow.
- **the cutouts** (`cutouts.html`) — a compositor, not a gallery. It samples a handful of the
  transparent-background works and layers them over the dark ground at a violent range of scales;
  every reload deals a new composition, so it reads the same with 30 cutouts as with 300. Controls
  (bottom-left) set the blend mode, the scale range, the motion (`still / drift / jagged / float /
  spin`), and how many pieces are drawn. Tap a piece to **pin** it — freezing it and bringing it to
  front; in low-count mode a pin also drops in a fresh candidate, so you can build a collage by hand.
  **save frame** exports the current composition as a PNG, and **invert** flips the whole page to a
  negative. (Which works are cutouts is declared in `works.js`; see [cutouts](#cutouts) below.)
- **the hum** (field + grid, bottom corner) — an optional synthesized mains drone: 50 Hz and harmonics
  over a dark noise bed, breathing slowly. Phones get the same soul re-voiced up an octave or two,
  since phone speakers can't say 50 Hz. Lingering on a piece quickens it. Off until asked for.

Motion, static, and migration all stand down when the visitor has `prefers-reduced-motion` set.

## repo map

| file | what it is |
|---|---|
| `works.js` | **the manifest — the only file that changes day-to-day.** One entry per artwork, newest at the top. Kept at the root on purpose: it's content, not code. Optional `cutout` / `invert` flags mark a work for the cutouts page. |
| `index.html`, `grid.html`, `cutouts.html`, `404.html` | the pages (Pages requires these at the root) |
| `assets/js/field.js` | the field: banded placement, responsive sizing, migration, parallax, cursor static |
| `assets/js/grid.js` | the grid: the 3×3 wrap trick, drag/flick/wheel camera, keyboard pan |
| `assets/js/cutouts.js` | the cutouts compositor: sampling, blend/scale/motion, pin, PNG export, page invert |
| `assets/js/cutouts-extra.js` | manifest of cutout-only works — loaded only by the cutouts page (see below) |
| `assets/js/scroll.js` | the weighted scroll: damped, speed-capped wheel/touch on the field |
| `assets/js/lightbox.js` | shared by field + grid: the lightbox, HTML-escaping, thumb resolution |
| `assets/js/sound.js` | the hum, synthesized live with WebAudio |
| `assets/css/site.css` | all styling; palette variables at the top, then the cutouts + mobile blocks at the bottom |
| `images/` | **the originals. these are the artworks — never resized, recompressed, or renamed.** |
| `images/thumbs/` | generated inline derivatives + `index.js` manifest (see below) |
| `images/cutouts/` | generated alpha-preserving derivatives for the cutouts page (see below) |
| `tools/make-thumbs.sh`, `tools/make-thumbs.ps1` | regenerate `images/thumbs/` with native macOS or Windows tooling |
| `tools/make-cutouts.sh` | regenerate `images/cutouts/` (alpha-safe) for the `cutout`-flagged works |
| `.github/workflows/thumbnails.yml` | tests a clean thumbnail generation on both macOS and Windows |
| `docs/` | README screenshots |
| `CNAME`, `.nojekyll`, favicons | GitHub Pages plumbing (root by convention) |

## adding a work

1. Drop the image into `images/` (any name; `.png` / `.jpeg`; the exact filename including case is
   what the site will request — GitHub Pages is case-sensitive).
2. Add one line at the **top** of `works.js`:
   ```js
   { src:"images/ar.png", title:"pylon ar", year:"2026" },
   ```
   Numbering is derived automatically (newest = highest number), so nothing else needs renumbering.
3. Regenerate thumbnails with the native script for your platform:

   macOS, or Windows from Git Bash:

   ```sh
   ./tools/make-thumbs.sh
   ```

   Windows PowerShell:

   ```powershell
   .\tools\make-thumbs.ps1
   ```
4. Check it locally (below), then commit and push `main`. GitHub Pages deploys in about a minute.

Skipping step 3 never breaks the site — a work without a thumb simply serves its original file,
full weight, until the script next runs.

## thumbnails

The originals total tens of megabytes, and the grid page renders the whole set nine times over, so
the pages display generated derivatives (max 1400 px, opaque images as JPEG, transparent ones as
PNG) and save the originals for the lightbox. `images/thumbs/index.js` maps original → thumb; a
thumb only earns a manifest entry by being genuinely smaller than its original. Everything under
`images/thumbs/` is disposable output — regenerate it, never hand-edit it.

Neither generator installs dependencies: macOS uses `sips`, while Windows uses `System.Drawing`.
GitHub Actions deletes the checked-in derivatives, regenerates them independently on both operating
systems, confirms the originals stayed untouched, and validates every generated mapping.

## cutouts

The cutouts page draws from a pool of transparent-background works. There are two sources, and both
are single-source data — no page logic changes to add or remove one:

- **works already in the gallery.** Add `cutout:true` to that work's line in `works.js`; add
  `invert:true` too if it's dark ink that needs flipping to read on the dark ground:
  ```js
  { src:"images/k.png", title:"pylon k", year:"2026", cutout:true },
  { src:"images/j.png", title:"pylon j", year:"2026", cutout:true, invert:true },
  ```
  The field and grid ignore these extra fields entirely. Then regenerate the alpha-preserving
  derivatives (a separate tier from the thumbnails, because JPEG can't carry transparency):
  ```sh
  ./tools/make-cutouts.sh
  ```
- **cutout-only pieces** that shouldn't appear in the field or grid live in
  `assets/js/cutouts-extra.js`, which only `cutouts.html` loads. Each entry points straight at a
  committed derivative in `images/cutouts/` (the full-res source stays in the artist's archive):
  ```js
  { src:"images/cutouts/x18.png", invert:true },
  ```
  Keeping them out of `works.js` means they never touch the field/grid numbering.

Everything under `images/cutouts/` is disposable output for the `works.js` cutouts; hand-placed
`x**` derivatives for the extras are the exception and are committed directly.

## running locally

Any static server from the repo root:

```sh
python3 -m http.server 4173
# → http://localhost:4173
```

(Opening `index.html` as a `file://` URL mostly works but serves no thumbs manifest cleanly and
skews font/audio behavior — use a server.)

## hosting

GitHub Pages, from the `main` branch of
[`systemssystemssystems/systemssystemssystems.github.io`](https://github.com/systemssystemssystems/systemssystemssystems.github.io),
on the custom domain in `CNAME` (`systemssystemssystems.faith`, apex A-records + `www` CNAME →
redirect). `.nojekyll` tells Pages to serve the files as-is. Pushing to `main` **is** deploying.

## design notes

- palette lives in `:root` in `assets/css/site.css` — `--ground` near-black, `--bone` off-white,
  `--dim` gray, `--hot` white. Everything lowercase; VT323 for the title tower, IBM Plex Mono for
  everything else.
- layout of the field is seeded (`mulberry32(20260713)`) so first paint is identical for everyone;
  the *migrations* afterward are truly random. Every host piece owns one vertical band of the
  field, so density stays even — no voids, no pile-ups — and sizes are rolled in `vw` but clamped
  in `px` per device tier (phone / tablet / desktop), so the work reads properly from a phone to an
  ultrawide. Width changes re-place the field after a short debounce so breakpoint changes take
  effect without a reload.
- all text is decoration-light: corner marks, tiny letterspaced captions, no chrome.

## images

All artwork © systemssystemssystems. The code is trivial; the images are not — please don't reuse
them without permission.
