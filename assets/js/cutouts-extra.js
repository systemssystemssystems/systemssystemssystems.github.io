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
  { src:"images/cutouts/x23.png" },  // MetalOrnament.png
  { src:"images/cutouts/x24.png" },  // metalStar.png
  { src:"images/cutouts/x25.png", invert:true },  // throwie_20260825_224826.png
  { src:"images/cutouts/x26.png" },  // throwie_20260825_224848.png
  { src:"images/cutouts/x27.png" },  // throwie_20260825_225044.png
  { src:"images/cutouts/x28.png", invert:true },  // throwie_20260825_225742.png
  { src:"images/cutouts/x29.png", invert:true },  // throwie_20260825_225832.png
  { src:"images/cutouts/x30.png", invert:true },  // throwie_20260825_230516.png
  { src:"images/cutouts/x31.png", invert:true },  // throwie_20260825_230632.png
  { src:"images/cutouts/x32.png", invert:true },  // throwie_20260825_230839.png
  { src:"images/cutouts/x33.png", invert:true },  // throwie_20260825_231045.png
  { src:"images/cutouts/x34.png", invert:true },  // throwie_20260826_200425.png
  { src:"images/cutouts/x35.png" },  // throwie_20260826_200535.png
  { src:"images/cutouts/x36.png" },  // throwie_20260826_200603.png
  { src:"images/cutouts/x37.png" },  // throwie_20260826_200634.png
  { src:"images/cutouts/x38.png" },  // throwie_20260826_200730.png
  { src:"images/cutouts/x39.png" },  // throwie_20260826_200858.png
  { src:"images/cutouts/x40.png" },  // throwie_20260826_201130.png
  { src:"images/cutouts/x41.png", invert:true },  // throwie_20260826_201515.png
  { src:"images/cutouts/x42.png" },  // throwie_20260826_201547.png
  { src:"images/cutouts/x43.png", invert:true },  // throwie_20260826_201626.png
  { src:"images/cutouts/x44.png", invert:true },  // throwie_20260826_201813.png
  { src:"images/cutouts/x45.png" },  // throwie_20260826_201923.png
  { src:"images/cutouts/x46.png", invert:true },  // throwie_20260826_202016.png
  { src:"images/cutouts/x47.png", invert:true },  // throwie_20260826_202126.png
  { src:"images/cutouts/x48.png", invert:true },  // throwie_20260826_202304.png
  { src:"images/cutouts/x49.png", invert:true },  // throwie_20260826_210350.png
  { src:"images/cutouts/x50.png", invert:true },  // throwie_20260830_203655.png
  { src:"images/cutouts/x51.png", invert:true },  // throwie_20260830_203714.png
  { src:"images/cutouts/x52.png", invert:true },  // throwie_20260830_203929.png
  { src:"images/cutouts/x53.png", invert:true },  // throwie_20260830_203959.png
  { src:"images/cutouts/x54.png", invert:true },  // throwie_20260830_204249.png
  { src:"images/cutouts/x55.png", invert:true },  // throwie_20260830_204338.png
  { src:"images/cutouts/x56.png", invert:true },  // throwie_20260830_204403.png
  { src:"images/cutouts/x57.png", invert:true },  // throwie_20260830_204439.png
  { src:"images/cutouts/x58.png", invert:true },  // throwie_20260830_204515.png
  { src:"images/cutouts/x59.png", invert:true },  // throwie_20260830_204552.png
  { src:"images/cutouts/x60.png", invert:true },  // throwie_20260830_204609.png
  { src:"images/cutouts/x61.png", invert:true },  // throwie_20260830_204638.png
  { src:"images/cutouts/x62.png", invert:true },  // throwie_20260830_204718.png
  { src:"images/cutouts/x63.png", invert:true },  // throwie_20260830_204739.png
  { src:"images/cutouts/x64.png", invert:true },  // throwie_20260830_204748.png
  { src:"images/cutouts/x65.png", invert:true },  // throwie_20260830_204813.png
  { src:"images/cutouts/x66.png", invert:true },  // throwie_20260830_204826.png
  { src:"images/cutouts/x67.png", invert:true },  // throwie_20260830_204903.png
  { src:"images/cutouts/x68.png", invert:true },  // throwie_20260830_204922.png
  { src:"images/cutouts/x69.png", invert:true },  // throwie_20260830_205103.png
  { src:"images/cutouts/x70.png", invert:true },  // throwie_20260830_205114.png
  { src:"images/cutouts/x71.png", invert:true },  // throwie_20260830_205136.png
  { src:"images/cutouts/x72.png", invert:true },  // throwie_20260830_211135.png
];
