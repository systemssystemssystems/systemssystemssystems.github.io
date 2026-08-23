#!/usr/bin/env bash
# ==================================================================
# make-cutouts.sh — generate images/cutouts/ from the originals.
#
# The cutouts page (cutouts.html) layers transparent-background works
# on top of each other. Those need a PNG derivative tier that KEEPS
# the alpha channel — the JPEG thumbs from make-thumbs.sh can't carry
# transparency, so cutouts get their own folder and their own script.
#
# Which works are cutouts is declared in works.js with `cutout:true`.
# This reads that flag, then writes a downscaled (max 1200px long
# side) alpha-preserving PNG copy into images/cutouts/. Originals in
# images/ are the artworks and are never touched.
#
# If a cutout has no derivative here, cutouts.js falls back to the
# full-size original automatically, so forgetting to run this never
# breaks the page — it just costs bandwidth.
#
# macOS only (uses the built-in `sips`). A Windows sibling can mirror
# make-thumbs.ps1 if needed.
#   ./tools/make-cutouts.sh
# ==================================================================
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$script_dir/.." && pwd)
cd "$root"

max=1200
out="images/cutouts"
mkdir -p "$out"

# pull the cutout filenames out of works.js (lines flagged cutout:true)
cutouts=$(grep 'cutout:true' works.js | sed -n 's/.*src:"images\/\([^"]*\)".*/\1/p')

if [ -z "$cutouts" ]; then
  echo "no works flagged cutout:true in works.js — nothing to do"
  exit 0
fi

made=0
for f in $cutouts; do
  src="images/$f"
  if [ ! -f "$src" ]; then
    echo "  ! missing original: $src (skipped)"
    continue
  fi
  # sips resamples to fit `max` on the long side and preserves the PNG alpha
  sips -Z "$max" "$src" --out "$out/$f" >/dev/null 2>&1
  sz=$(du -h "$out/$f" | cut -f1 | tr -d ' ')
  echo "  made $out/$f ($sz)"
  made=$((made+1))
done

echo "done — $made cutout derivative(s) in $out/"
