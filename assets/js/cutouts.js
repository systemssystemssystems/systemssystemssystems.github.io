/* ==================================================================
   CUTOUTS — a compositor page.
   Draws a handful of transparent-background works from the manifest,
   layered and occluding at a wild scale range on the dark ground.
   A reload deals a new hand; nothing is a browse-index here.

   Reads WORKS (works.js) for entries flagged `cutout:true`. Uses the
   alpha-preserving derivative in images/cutouts/ when present and
   falls back to the full original otherwise (see make-cutouts.sh).
   `invert:true` lifts a dark-ink cutout to light so it reads on the
   ground. Loaded after works.js.

   NOTE: the on-screen controls (blend / scale / motion / count) are a
   deciding tool. Once the look is settled they can be removed and the
   chosen values hard-coded in DEFAULTS below.
   ================================================================== */
(function () {
  "use strict";

  var stage = document.getElementById('cutstage');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // build the pool from the manifest. works.js declares `const WORKS`, a
  // global lexical binding (not a property of window), same as field/grid read.
  var ALL = (typeof WORKS !== 'undefined' && WORKS) ? WORKS : [];
  var POOL = ALL.filter(function (w) { return w.cutout; }).map(function (w) {
    return {
      thumb: w.src.replace('images/', 'images/cutouts/'), // derivative tier
      full:  w.src,                                        // fallback original
      invert: !!w.invert
    };
  });

  // cutout-only extras (cutouts-extra.js) — present only on this page. Their
  // src already points at the committed derivative in images/cutouts/.
  var EXTRA = (typeof CUTOUTS_EXTRA !== 'undefined' && CUTOUTS_EXTRA) ? CUTOUTS_EXTRA : [];
  EXTRA.forEach(function (c) {
    POOL.push({ thumb: c.src, full: c.src, invert: !!c.invert });
  });

  if (!POOL.length) {
    stage.innerHTML = '<p style="position:fixed;inset:0;display:flex;align-items:center;' +
      'justify-content:center;color:var(--dim);letter-spacing:.2em">no cutouts yet</p>';
    return;
  }

  var DEFAULTS = { blend: 'screen', scaleMode: 'violent', motion: 'still', count: 6 };
  var BASE = 340; // px width at scale 1
  var state = {
    blend: DEFAULTS.blend, scaleMode: DEFAULTS.scaleMode,
    motion: DEFAULTS.motion, count: Math.min(DEFAULTS.count, POOL.length + 4)
  };
  var pieces = [];

  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function scaleFor() {
    return state.scaleMode === 'violent'
      ? 0.15 * Math.pow(20, Math.random())   // 0.15x - 3x, exponential
      : 0.8 + Math.random() * 0.4;           // 0.8x - 1.2x, the "messy grid"
  }
  function place(p) {
    p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-50%)';
  }

  function recompose() {
    stage.innerHTML = '';
    pieces = [];
    for (var i = 0; i < state.count; i++) {
      var c = pick(POOL);
      var el = document.createElement('div');
      el.className = 'cutout';
      var img = document.createElement('img');
      img.decoding = 'async';
      img.alt = '';
      img.src = c.thumb;
      (function (img, full) {                 // fall back to the original if no derivative
        img.onerror = function () { img.onerror = null; img.src = full; };
      })(img, c.full);
      // lift the delicate, often semi-transparent cutouts so they read on the
      // dark ground; invert first for dark-ink pieces so they come up light.
      img.style.filter = c.invert
        ? 'invert(1) brightness(1.7) contrast(1.2)'
        : 'brightness(1.9) contrast(1.25)';
      var s = scaleFor();
      el.style.width = (BASE * s) + 'px';
      el.style.mixBlendMode = state.blend;
      el.appendChild(img);
      var p = {
        el: el,
        x: (Math.random() * 1.2 - 0.1) * innerWidth,
        y: (Math.random() * 1.2 - 0.1) * innerHeight,
        s: s,
        vx: (Math.random() * 2 - 1),
        vy: (Math.random() * 2 - 1)
      };
      place(p);
      stage.appendChild(el);
      pieces.push(p);
    }
  }

  // slow drift, rate tied to scale = free parallax
  var raf = null;
  function tick() {
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      p.x += p.vx * p.s * 0.25 * 1.4;
      p.y += p.vy * p.s * 0.25 * 1.4;
      var pad = Math.max(innerWidth, innerHeight) * 0.7;
      if (p.x < -pad) p.x = innerWidth + pad;
      if (p.x > innerWidth + pad) p.x = -pad;
      if (p.y < -pad) p.y = innerHeight + pad;
      if (p.y > innerHeight + pad) p.y = -pad;
      place(p);
    }
    raf = requestAnimationFrame(tick);
  }
  function setMotion(m) {
    state.motion = m;
    if (m === 'drift' && !reduce) { if (!raf) raf = requestAnimationFrame(tick); }
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
    syncButtons();
  }

  // ---- controls ----
  var BLENDS = ['screen', 'lighten', 'difference', 'exclusion', 'multiply'];
  var SCALES = ['tame', 'violent'];
  var MOTIONS = ['still', 'drift'];

  function build(id, values, onset) {
    var box = document.getElementById(id);
    box.innerHTML = '';
    values.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = v;
      b.dataset.v = v;
      b.addEventListener('click', function () { onset(v); });
      box.appendChild(b);
    });
  }
  function syncButtons() {
    document.querySelectorAll('#cutblend button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === state.blend); });
    document.querySelectorAll('#cutscale button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === state.scaleMode); });
    document.querySelectorAll('#cutmotion button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.v === state.motion);
      if (b.dataset.v === 'drift') b.disabled = reduce;
    });
    document.getElementById('cutcount').textContent = state.count;
  }

  build('cutblend', BLENDS, function (v) { state.blend = v; pieces.forEach(function (p) { p.el.style.mixBlendMode = v; }); syncButtons(); });
  build('cutscale', SCALES, function (v) { state.scaleMode = v; recompose(); syncButtons(); });
  build('cutmotion', MOTIONS, setMotion);

  document.getElementById('cutmore').addEventListener('click', function () { state.count = Math.min(14, state.count + 1); recompose(); syncButtons(); });
  document.getElementById('cutless').addEventListener('click', function () { state.count = Math.max(3, state.count - 1); recompose(); syncButtons(); });
  document.getElementById('cutrecompose').addEventListener('click', recompose);

  var rz;
  addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { if (state.motion !== 'drift') recompose(); }, 200);
  });

  if (reduce) state.motion = 'still';
  recompose();
  syncButtons();
})();
