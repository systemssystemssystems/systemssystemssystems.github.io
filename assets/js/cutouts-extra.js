/* CUTOUTS-EXTRA — cutout-only works for cutouts.html.
   Loaded ONLY by cutouts.html, never by the field or grid, so these
   enrich the compositor without touching works.js numbering. Each asset
   is a downscaled alpha PNG committed directly in images/cutouts/ (the
   full-res source lives in the artist's Exportcutouts archive).
     invert:true — dark-ink cutout, flipped to light on the dark ground

   Curated to the cutouts that actually READ on the dark ground: faint,
   low-alpha wash scans were dropped (they stayed near-invisible however
   much brightness was pushed). Re-add one by re-exporting it bolder. */
const CUTOUTS_EXTRA = [
  { src:"images/cutouts/x08.png" },  // [t×6s] 20-44-19
  { src:"images/cutouts/x09.png" },  // [t×6s] 20-42-57
  { src:"images/cutouts/x10.png", invert:true },  // [t×6s] 2026-01-27
  { src:"images/cutouts/x11.png", invert:true },  // [t×6s] 20-41-13
  { src:"images/cutouts/x12.png" },  // [t×6s] 20-42-09
  { src:"images/cutouts/x13.png", invert:true },  // back.png
  { src:"images/cutouts/x15.png", invert:true },  // flower.png
  { src:"images/cutouts/x16.png", invert:true },  // horses.png
  { src:"images/cutouts/x17.png", invert:true },  // noback1.png
  { src:"images/cutouts/x18.png", invert:true },  // noback4.1.png
  { src:"images/cutouts/x19.png", invert:true },  // noback4.png
  { src:"images/cutouts/x21.png", invert:true },  // v212 black-dots dog
  { src:"images/cutouts/x22.png" },  // v212 white-dots dog
];
