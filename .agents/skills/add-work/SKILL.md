---
name: add-work
description: Publish new artwork to the gallery — file the image, add its works.js entry, regenerate thumbnails, and verify the site still passes. Use when the user has one or more new pieces to add to systemssystemssystems.faith.
---

# add-work

Adding art to the gallery, end to end. The rules in AGENTS.md apply throughout (originals are
sacred, case-sensitive paths, lowercase voice).

## Inputs to establish
- Path(s) to the new image file(s) — if the user gave a location outside the repo, copy (don't
  move) into `images/`, preserving the extension. Next free short name in the existing series
  (`ar.png`, `as.png`, …) if the user has no preference.
- Title(s) — lowercase; the running series is "pylon <suffix>". Confirm invented titles with the
  user in the final report.
- Year — default to the current year.

## Steps
1. Place the image in `images/`. Record the exact filename.
2. Add `{ src:"images/<file>", title:"<title>", year:"<year>" },` at the **top** of `works.js`
   (newest first — numbering is derived from position, don't touch anything else).
3. `./tools/make-thumbs.sh` — expect a "made images/thumbs/…" line per new image, or a "skipped"
   line for small files (that's fine, they serve the original).
4. Integrity: every manifest `src` exists case-sensitively, no dupes, new thumb mapping present in
   `images/thumbs/index.js` (or legitimately skipped).
5. Verify in the browser (the `site-qa` agent, or at minimum: serve on :4173, both pages, console
   clean, new piece visible in field and grid, lightbox shows it full-res).

## Finish
Report the new entry (with its derived number, i.e. the new total count), the thumb result, and
verification evidence. Leave committing and pushing to the user unless they've asked — a push is
a deploy.
