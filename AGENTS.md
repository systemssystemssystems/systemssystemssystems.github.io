# AGENTS.md

Art gallery site for **systemssystemssystems**, live at https://systemssystemssystems.faith/,
served by GitHub Pages straight from `main` of this repo (push = deploy, ~1 minute). Public-facing
docs are in `README.md`; this file is operating instructions.

## Hard rules

1. **`images/` originals are the artworks.** Never resize, recompress, re-encode, rename, or delete
   them. Derivatives belong in `images/thumbs/`, produced only by `tools/make-thumbs.sh`.
2. **No frameworks, no build step, no dependencies, ever.** Plain HTML/CSS/JS files served as-is is
   a deliberate property of this project, not an accident. Don't introduce npm, bundlers, or CDNs
   (the two Google Fonts links are the only external requests).
3. **Production paths are case-sensitive.** `images/z.PNG` ≠ `images/z.png` on GitHub Pages even
   though both work on a Mac. Always verify the manifest's `src` matches the filename byte-for-byte.
4. **Keep the voice.** Everything lowercase, palette from the `:root` variables in
   `assets/css/site.css` (`--ground`, `--smoke`, `--bone`, `--dim`, `--hot`), VT323 for display
   type, IBM Plex Mono for the rest, letterspaced 10–11px marks. New UI must look like it was
   always there.
5. **Respect `prefers-reduced-motion`** in anything animated you add, and never autoplay audio —
   the hum starts only from the user's click (browsers block it anyway).
6. **Don't commit or push unless asked.** A push publishes to the live site.

## Layout of things

Layout rule: HTML pages, `works.js`, `CNAME`, `.nojekyll`, and favicons stay at the root (Pages
and browser conventions require the pages/favicons there; `works.js` is content the artist edits).
All code lives under `assets/js/` and `assets/css/`. Generated files live under `images/thumbs/`.

- `works.js` (root) — the manifest; one `{ src, title, year }` per artwork, **newest first**. The
  visible numbering is derived (`WORKS.length - index`), so inserting at the top renumbers
  everything automatically. Titles are free text and get HTML-escaped by `esc()` at render time
  (`"<3"` is a real title — keep the escaping).
- `assets/js/lightbox.js` — shared helpers (`esc`, `thumbFor`, `buildFigure`) + the lightbox
  singleton. Loaded on both pages **after** `works.js` and `images/thumbs/index.js`, **before**
  the page script. Both page scripts depend on it.
- `assets/js/field.js` — the field. Initial placement is seeded (`mulberry32(20260713)`) so
  everyone's first paint matches; migrations after that use `Math.random`. **Density and sizing
  live in the `SIZES` table** (per-tier: phone ≤640, tablet ≤1024, desktop): sizes roll in vw,
  clamp in px; each host owns a vertical *band* of the field so density stays even — placement and
  every migration stay inside the band. Don't reintroduce uniform-random `y` (that's what caused
  the blank-void bug). Real width changes re-tier and re-place (debounced, height-only resizes
  ignored — that's a phone URL bar).
- `assets/js/scroll.js` — the weighted scroll (field page only): wheel/touch damped by `GAIN`s and
  speed-capped by `MAXV`, eased by `EASE`. Keyboard, scrollbar, and pinch-zoom stay native;
  reduced-motion disables the module entirely. Loaded after lightbox.js (it checks
  `Lightbox.isOpen()`).
- `assets/js/grid.js` — the infinite sheet: a 3×3 patchwork of identical blocks, camera wraps by
  one block period (`PW`/`PH`) invisibly. Only the center block's tiles are tabbable; focusing one
  pans the camera to it (`revealTile`). `layout()` must re-run whenever block height could change
  (resize, font swap) or the wrap seam shows.
- `assets/js/sound.js` — WebAudio drone, built lazily on first "sound on". Phones get a re-voiced
  harmonic recipe (see `mobileAudio`).
- `images/thumbs/` — generated. `index.js` maps `original filename → thumb filename`; an image
  missing from the map silently serves its original (that's the designed fallback, not a bug — but
  it means a forgotten `make-thumbs.sh` run costs megabytes, so check for unmapped images).
- Mobile styling lives in the `@media (max-width:640px)` block at the **bottom** of
  `assets/css/site.css` (ordering matters); the JS phone breakpoint is the same 640px.

## Workflows

**Add a work** — image into `images/`, entry at top of `works.js`, `./tools/make-thumbs.sh`, then
verify. The `/add-work` skill and the `curator` agent encode this.

**Verify any change** (the `site-qa` agent encodes this): serve the repo root — use the `site`
config in `.codex/launch.json` (`python3 -m http.server 4173`) — then on **both** pages check:
zero console errors; no 404s in the network log (thumbs actually served, not originals); lightbox
opens full-res, arrows/Escape work, focus returns on close; grid drags, flicks, wheels, wraps
seamlessly, Tab pans to tiles; field wheel-scroll is damped and speed-capped (scrollbar drag stays
native); no vertical voids taller than ~1.2 viewports in the field; sound toggles on and off
again; check 375 / 768 / 1280 / 1920px widths — piece sizes must respect the px clamps at all
four; `prefers-reduced-motion` leaves a static, readable, natively-scrolling page.

**Check manifest ↔ disk** after any works.js or images/ change:
every `src` exists (case-sensitive), no orphan files, no duplicate `src`, and every image ≥ ~200 KB
has a thumbs mapping.

## Gotchas learned the hard way

- sips "thumbs" can come out **larger** than the original (small or already-lean files) — the
  script deletes those and leaves the image unmapped on purpose; don't "fix" that.
- The grid page instantiates every artwork **nine times**; anything per-tile (listeners, decode
  cost) is ×9. Keep tiles cheap.
- `works.js` says "the only file you edit day-to-day" — keep it true. Don't move the manifest into
  JSON/fetch (breaks `file://` casual use) or generate it.
- The wheel handler on the grid page is `passive:false` and calls `preventDefault()` — required for
  pan-by-wheel; it early-returns while the lightbox is open so the sheet doesn't drift underneath.
- GitHub Pages "Enforce HTTPS" is a **repo setting**, not a file — plain `http://` currently serves
  200 instead of redirecting; only the repo owner can flip it (Settings → Pages).
