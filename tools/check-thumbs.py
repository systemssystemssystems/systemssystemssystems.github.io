#!/usr/bin/env python3
"""Validate the generated thumbnail manifest without image dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
THUMBS = IMAGES / "thumbs"
MANIFEST = THUMBS / "index.js"
MAPPING_RE = re.compile(
    r'^\s*("(?:\\.|[^"\\])*"):\s*("(?:\\.|[^"\\])*")\s*,\s*$',
    re.MULTILINE,
)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


if not MANIFEST.is_file():
    fail("images/thumbs/index.js is missing")

pairs = [
    (json.loads(source), json.loads(thumb))
    for source, thumb in MAPPING_RE.findall(
        MANIFEST.read_text(encoding="utf-8-sig")
    )
]
if not pairs:
    fail("thumbnail manifest has no entries")

sources = [source for source, _ in pairs]
outputs = [thumb for _, thumb in pairs]
if len(sources) != len(set(sources)):
    fail("thumbnail manifest contains duplicate originals")
if len(outputs) != len(set(outputs)):
    fail("thumbnail manifest contains duplicate derivatives")

for source_name, thumb_name in pairs:
    source = IMAGES / source_name
    thumb = THUMBS / thumb_name
    if not source.is_file():
        fail(f"mapped original is missing: images/{source_name}")
    if not thumb.is_file():
        fail(f"mapped derivative is missing: images/thumbs/{thumb_name}")
    if thumb.stat().st_size >= source.stat().st_size:
        fail(f"derivative is not smaller than its original: {thumb_name}")

generated = {
    path.name
    for path in THUMBS.iterdir()
    if path.is_file() and path.name != MANIFEST.name
}
orphans = sorted(generated - set(outputs))
if orphans:
    fail("unmapped derivatives: " + ", ".join(orphans))

print(f"thumbnail manifest valid ({len(pairs)} entries)")
