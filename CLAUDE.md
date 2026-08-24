# CLAUDE.md

Art gallery site for **systemssystemssystems**, live at https://systemssystemssystems.faith/,
served by GitHub Pages straight from `main` of this repo (push = deploy, ~1 minute). Public-facing
docs are in `README.md`; this file is operating instructions.

## Hard rules

1. **`images/` originals are the artworks.** Never resize, recompress, re-encode, rename, or delete
   them. Derivatives belong in `images/thumbs/`, produced only by `tools/make-thumbs.sh` (macOS or
   Windows Git Bash) or `tools/make-thumbs.ps1` (Windows PowerShell).
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
All code lives under `assets/js/` and `assets/css/`. Generated files live under `images/thumbs/`
and `images/cutouts/`.

- `works.js` (root) — the manifest; one `{ src, title, year }` per artwork, **newest first**. The
  visible numbering is derived (`WORKS.length - index`), so inserting at the top renumbers
  everything automatically. Titles are free text and get HTML-escaped by `esc()` at render time
  (`"<3"` is a real title — keep the escaping). Optional `cutout:true` / `invert:true` flags mark a
  work for the cutouts page and are **ignored** by the field and grid.
- `assets/js/lightbox.js` — shared helpers (`esc`, `thumbFor`, `buildFigure`) + the lightbox
  singleton. Loaded on the **field and grid** pages **after** `works.js` and `images/thumbs/index.js`,
  **before** the page script. Both those page scripts depend on it (the cutouts page has no lightbox).
- `assets/js/field.js` — the field. Initial placement is seeded (`mulberry32(20260713)`) so
  everyone's first paint matches; migrations after that use `Math.random`. **Density and sizing
  live in the `SIZES` table** (per-tier: phone ≤640, tablet ≤1024, desktop): sizes roll in vw,
  clamp in px; each host owns a vertical *band* of the field so density stays even — placement and
  every migration stay inside the band. Don't reintroduce uniform-random `y` (that's what caused
  the blank-void bug). Real width changes re-tier and re-place (debounced, height-only resizes
  ignored — that's a phone URL bar).
- `assets/js/scroll.js` — the weighted scroll (field page only): wheel/touch damped by `GAIN`s and
  speed-capped by `MAXV`, eased by `EASE`. **Not loaded by any page** — tried, then reverted in
  favor of native scroll (see Design history below); kept in the tree in case it's revisited, but
  currently dead code.
- `assets/js/grid.js` — the infinite sheet: a 3×3 patchwork of identical blocks, camera wraps by
  one block period (`PW`/`PH`) invisibly. Only the center block's tiles are tabbable; focusing one
  pans the camera to it (`revealTile`). `layout()` must re-run whenever block height could change
  (resize, font swap) or the wrap seam shows.
- `assets/js/sound.js` — WebAudio drone, built lazily on first "sound on". Phones get a re-voiced
  harmonic recipe (see `mobileAudio`).
- `assets/js/transmissions.js` — field page only. Click-to-toggle fallback for the "other
  transmissions" reveal at the bottom of the field; CSS handles hover/focus-within, this covers
  touch browsers that don't reliably hover or focus a tapped `<button>`.
- `assets/js/cutouts.js` — the cutouts compositor / collage tool (`cutouts.html` only). Pool =
  `WORKS.filter(cutout)` **plus** `CUTOUTS_EXTRA`. Controls (bottom-left panel): blend (**`normal`
  default** — screen/difference wash the halftone cutouts out, normal layers them), scale range,
  motion (still/drift/jagged/float/spin), count (**default 5, range 0–30**), recompose, `save frame`
  (redraws to a canvas via `toDataURL` so blend + inversion + positions match — inverted look too),
  `invert` (page-level `filter:invert(1)`, with the controls/tray/bin double-inverted back + recoloured
  so they stay legible on the flipped ground). A small top-centre **clear** toggle (`body.clear`) hides
  all chrome (marks/panel/tray/bin) for a clean view; the toggle stays so you can come back. Right-edge
  **tray** lists every cutout: drag one onto
  the canvas (mouse or touch — `touch-action:pan-y`, so a vertical swipe scrolls the strip and a
  horizontal pull drags a cutout out) or tap to add at centre. Placed pieces are **unpinned** so the
  motion applies to them. Editing (active when a piece isn't being animated — motion `still`, or the
  piece is locked): **click a piece to select it** (bright halo + `size / rotate / motion lock / remove`
  rows appear in the panel, just above the actions row; `active` piece). The selected piece **drags from
  anywhere inside it, even a transparent area** (a trackpad misses opaque-only hit-tests too easily).
  Resize via the **size slider** (0.03×–18×, log) — the dependable path on a trackpad; wheel also resizes
  (desktop, proportional + locks onto the started piece) and two-finger **pinch** on mobile. **rotate
  slider** sets `p.rot` (0–360). **duplicate** copies the piece (same cutout/size/rotation/colour, offset
  a touch, then selected — each piece stores `p.cut`). **invert** (in the edit rows) flips just that piece's
  colour via `p.inv` / `p.baseFilter`, separate from the page-level invert. **motion lock** = pin (survives
  motion, frozen); **remove** or drag onto the top-centre **bin** deletes. The browser's own pinch-zoom / gesture
  nav is **blocked on this page** (a trackpad pinch would otherwise zoom the page / pop the tab overview
  — `ctrlKey` wheel + `gesturestart/change/end` preventDefault, and the canvas wheel always
  preventDefaults). Hit-testing is **alpha-accurate**. Primitives: `spawnPiece(z,opts)`, `pinPiece(p,on)`,
  `setActive(p)`, `applyFilter(p)`. Dev controls are intentionally still on the page while the look is decided.
- `assets/js/cutouts-extra.js` — `CUTOUTS_EXTRA`, the manifest of **cutout-only** works, loaded
  **only** by `cutouts.html`. Each `src` points straight at a committed derivative in
  `images/cutouts/`. Kept out of `works.js` so it can't affect field/grid numbering.
- `images/thumbs/` — generated. `index.js` maps `original filename → thumb filename`; an image
  missing from the map silently serves its original (that's the designed fallback, not a bug — but
  it means a forgotten `make-thumbs.sh` run costs megabytes, so check for unmapped images).
- `images/cutouts/` — generated alpha-preserving derivatives for the cutouts page (JPEG thumbs
  can't carry transparency, so cutouts need their own tier). `make-cutouts.sh` builds the ones for
  `cutout`-flagged `works.js` entries; the `x**` files for `cutouts-extra.js` are committed directly
  (their full-res source lives in the artist's archive, not the repo).
- `assets/css/site.css` — the cutouts-page styles are scoped under `.cutoutbody` in a block near the
  bottom (right above the mobile block), so they can't leak into the field or grid.
- Mobile styling lives in the `@media (max-width:640px)` block at the **bottom** of
  `assets/css/site.css` (ordering matters); the JS phone breakpoint is the same 640px.

## Workflows

**Add a work** — image into `images/`, entry at top of `works.js`, run `./tools/make-thumbs.sh`
(macOS or Windows Git Bash) or `.\tools\make-thumbs.ps1` (Windows PowerShell), then verify. The
`/add-work` skill and the `curator` agent encode this.

**Add a cutout** (a transparent-background piece for the cutouts page) — two routes:
- an existing gallery work: add `cutout:true` (and `invert:true` if it's dark ink) to its `works.js`
  line, then run `./tools/make-cutouts.sh` to build its `images/cutouts/` derivative;
- a cutout-only piece: drop a downscaled alpha PNG into `images/cutouts/` and add a line to
  `assets/js/cutouts-extra.js`.
Good candidates read as a clear shape with solid mass; faint low-alpha wash scans stay near-invisible
however the blend is set. Dark ink needs `invert`.

**Verify any change** (the `site-qa` agent encodes this): serve the repo root — use the `site`
config in `.claude/launch.json` (`python3 -m http.server 4173`) — then on **both** pages check:
zero console errors; no 404s in the network log (thumbs actually served, not originals); lightbox
opens full-res, arrows/Escape work, focus returns on close; grid drags, flicks, wheels, wraps
seamlessly, Tab pans to tiles; field wheel-scroll is damped and speed-capped (scrollbar drag stays
native); no vertical voids taller than ~1.2 viewports in the field; sound toggles on and off
again; check 375 / 768 / 1280 / 1920px widths — piece sizes must respect the px clamps at all
four; `prefers-reduced-motion` leaves a static, readable, natively-scrolling page. On **cutouts**:
zero console errors, no 404s (derivatives served); reload draws a new composition; each control
(blend / scale / motion / count / recompose / save frame / invert) works; tap-to-pin grabs a
visible piece; nothing overlaps at 375px and the corner links clear the sound toggle + panel.

**Check manifest ↔ disk** after any works.js or images/ change:
every `src` exists (case-sensitive), no orphan files, no duplicate `src`, and every image ≥ ~200 KB
has a thumbs mapping.

## Gotchas learned the hard way

- Generated "thumbs" can come out **larger** than the original (small or already-lean files) — the
  scripts delete those and leave the image unmapped on purpose; don't "fix" that.
- The grid page instantiates every artwork **nine times**; anything per-tile (listeners, decode
  cost) is ×9. Keep tiles cheap.
- `works.js` says "the only file you edit day-to-day" — keep it true. Don't move the manifest into
  JSON/fetch (breaks `file://` casual use) or generate it.
- The wheel handler on the grid page is `passive:false` and calls `preventDefault()` — required for
  pan-by-wheel; it early-returns while the lightbox is open so the sheet doesn't drift underneath.
- GitHub Pages "Enforce HTTPS" is a **repo setting**, not a file — plain `http://` currently serves
  200 instead of redirecting; only the repo owner can flip it (Settings → Pages).

## Design history & decisions

This section is the memory of the site's development (built conversationally with Claude in
mid-2026, then restructured by a collaborator's PR). These are settled judgement calls, not
accidents or oversights — don't "improve" them away without the artist asking.

### The two pages are deliberate opposites
The **field** (`index.html`) is chaos: scattered sizes, overlaps, pieces that migrate every
10–18s, out-of-phase opacity "humming". The **grid** (`grid.html`) is order: uniform tiles on
an infinite draggable 2D sheet. Same works, two infinities. Don't let features from one leak
into the other (e.g. the grid intentionally has no hum or migrations — it's the calm page).

### Things that were tried and rejected
- **Tilted/rotated pieces** on the field — rejected; everything sits square.
- **The field as an infinite draggable plane** — built, shipped, and reverted at the artist's
  request. The field scrolls; the *grid* is the infinite canvas. Don't re-propose.
- **Weighted/damped scrolling** on the field (`assets/js/scroll.js`, now unloaded) — tried at
  full strength, then softened, then removed as both laggy and not to taste. Native scroll won.
- **Migration protection** (pieces refusing to move while hovered) — removed on request.
  Nothing is safe; pieces may dissolve under the cursor. That's the point.

### Numbers that look arbitrary but aren't
- **Zoom barriers 0.6–1.6** (`assets/js/grid.js`): 0.6 is the geometric floor below which the
  3×3 block patchwork stops covering the viewport (you'd see the void); 1.6 is the sharpness
  ceiling for 640px thumbnails. Raising S_MAX requires bigger thumbs; lowering S_MIN requires
  a 5×5 patchwork (~2.8× the tiles — reconsider performance first).
- **Thumbnail cap 640px** (`tools/make-thumbs.*`): sized for tiles at max zoom. Was 1400px
  once; that made 500–900KB "thumbnails" and got cut down ~4×.
- **The seed `20260713`** (`assets/js/field.js`): makes every visit *open* with the same
  arrangement before diverging randomly. Changing it reshuffles the opening composition —
  a legitimate artistic act, but the artist's, not yours.
- **updateStatic reads-then-writes in two phases** (`assets/js/field.js`): interleaving rect
  reads with style writes forced ~one layout pass per piece per scroll frame and visibly
  lagged a Mac at 49 works. Keep the phases separate however the function evolves.

### Sound
- The hum is **synthesised live** (Web Audio, `assets/js/sound.js`), not a file — a compressed
  loop has an audible seam, and "the machine generates its own transmission" fits the site.
- **Two voicings**: desktop gets 50Hz mains + harmonics; phones (≤640px) get a 200–500Hz
  "transformer whine" with a detuned beating pair, because phone speakers physically can't
  reproduce 50Hz. Mobile audibility issues have a history: check the iOS mute switch and
  cached JS before suspecting code.
- **Lingering on a field piece excites the hum** via `window.__hum.excite()` — breathing rate,
  wobble depth and filter all ramp. It's a no-op when sound is off; keep it that way.
- **Long-term intent**: replace the synthesis with a real field recording of a substation,
  made by the artist, looped seamlessly. The synthesised hum is the placeholder.

### Miscellany worth knowing
- The `.faith` TLD is an artistic choice (pylons as objects of devotion). The github.io
  address still resolves and redirects.
- The 3-storey stacked SYSTEMS title was mobile-first, then promoted to all screens; each
  storey glitches on its own offset clock (the `animation-delay`s on the span pseudo-elements).
- Grid **padding tiles** (`.padtile`) repeat the newest works to keep the last row full at any
  column count — real, clickable, excluded from tab order. On a repeating sheet, repeats are
  native vocabulary, not a hack.
- Some originals have quirky names (`z.PNG` uppercase, `h.jpeg`/`i.jpeg`, dotted stems like
  `1.2.png`). They are what they are; the manifest matches them byte-for-byte (hard rule 3).
- The artist is a self-taught beginner who learned by building this. Explain changes in plain
  language, one concept at a time, and prefer small reviewable steps over sweeping refactors.

### Cutouts page — where we are (Aug 2026) & open threads
The cutouts page grew from a concept into a working collage tool over several sessions (all shipped;
see git log). Everything is in the repo — no separate handoff doc is needed; a fresh session should
read this file + skim `assets/js/cutouts.js`. Settled decisions and things still open:
- **Blend:** `normal` won as the default because the cutouts are mostly halftone/line art — `screen`
  and `difference` average or cancel them into faint grey. Don't "fix" the default back to screen.
- **The dev control panel is still visible on the live page** on purpose (the artist is deciding the
  feel). Once settled, the intent is to strip the panel and hard-code the chosen blend/scale/motion.
- **Motion vs placed pieces:** placed pieces are left unpinned so motion applies to them. Consequence
  the artist knows: arranging in `still` then switching motion on makes un-pinned pieces drift off —
  they pin (tap) the keepers first. Open question they were mulling: whether switching to a motion
  mode should leave already-placed pieces put unless explicitly unpinned. Not decided.
- **`spin`** breaks the site's "everything sits square" rule (deliberately kept on the field). It's
  offered on this page as an experiment; the artist may cut it.
- Possible next steps discussed, not built: auto-pin on edit; per-piece blend; undo; a seed/permalink
  or richer export; a `docs/cutouts.jpg` screenshot for the README (field/grid have thumbnails, cutouts
  doesn't yet). The artist drives; don't build these unprompted.
- The artist likes the **unpolished / overlapping / messy** aesthetic — don't over-polish or chase
  "clean". They've explicitly said not to fuss brightness/dimness.
