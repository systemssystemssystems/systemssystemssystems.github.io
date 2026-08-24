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

  // phones get fewer, smaller pieces — a packed 20 at desktop scale is too
  // heavy on a narrow screen.
  var isMobile = innerWidth <= 640;
  var DEFAULTS = { blend: 'normal', scaleMode: 'violent', motion: 'still', count: isMobile ? 10 : 20 };
  var BASE = isMobile ? 300 : 460; // px width at scale 1
  // jagged motion is livelier on desktop (more room + power) than on phones
  var JAG_SPEED = isMobile ? 0.9 : 1.8;
  var JAG_JITTER = isMobile ? 2.6 : 5.5;
  var state = {
    blend: DEFAULTS.blend, scaleMode: DEFAULTS.scaleMode,
    motion: DEFAULTS.motion, count: Math.min(DEFAULTS.count, POOL.length + 4)
  };
  var pieces = [];

  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function scaleFor() {
    // skewed large so pieces cover the ground and overlap (that's what fills the
    // screen and, under screen-blend, brightens); still a wide range for drama.
    return state.scaleMode === 'violent'
      ? 0.5 * Math.pow(6, Math.random())     // 0.5x - 3x, median ~1.2x
      : 0.8 + Math.random() * 0.4;           // 0.8x - 1.2x, the "messy grid"
  }
  function place(p) {
    var t = 'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-50%)';
    if (p.rot) t += ' rotate(' + p.rot + 'deg)';
    p.el.style.transform = t;
  }

  // opts (all optional): cutout (specific pool item), x, y (place here), scale
  function spawnPiece(z, opts) {
    opts = opts || {};
    var c = opts.cutout || pick(POOL);
    var el = document.createElement('div');
    el.className = 'cutout';
    var img = document.createElement('img');
    img.decoding = 'async';
    img.alt = '';
    img.src = c.thumb;
    (function (img, full) {                     // fall back to the original if no derivative
      img.onerror = function () { img.onerror = null; img.src = full; };
    })(img, c.full);
    // dark-ink pieces get inverted so they read light; a touch of contrast
    // firms them up. The blend mode does the rest.
    var filt = c.invert ? 'invert(1) contrast(1.2)' : 'contrast(1.2)';
    img.style.filter = filt;
    var s = opts.scale || scaleFor();
    el.style.width = (BASE * s) + 'px';
    el.style.mixBlendMode = state.blend;
    el.appendChild(img);
    var p = {
      el: el,
      x: opts.x != null ? opts.x : (Math.random() * 1.2 - 0.1) * innerWidth,
      y: opts.y != null ? opts.y : (Math.random() * 1.2 - 0.1) * innerHeight,
      s: s,
      vx: (Math.random() * 2 - 1),
      vy: (Math.random() * 2 - 1),
      phase: Math.random() * Math.PI * 2,       // float sway offset
      spin: (Math.random() * 2 - 1) * 0.25,     // spin speed, deg/frame
      rot: 0,
      z: z,                                      // paint order; raised when pinned
      pinned: false,
      baseFilter: filt
    };
    place(p);
    stage.appendChild(el);
    pieces.push(p);
    return p;
  }
  function recompose() {
    stage.innerHTML = '';
    pieces = [];
    for (var i = 0; i < state.count; i++) spawnPiece(i);
  }

  // motion loop.
  //   drift  — slow, smooth, rate tied to scale = free parallax
  //   jagged — nervous + random: abrupt direction changes and per-frame jitter
  //   float  — gentle organic sway, each piece on its own phase
  //   spin   — slow drift plus rotation (the field stays square; this page is
  //            the place to break that rule if you want it)
  var raf = null, frame = 0;
  function tick() {
    frame++;
    var m = state.motion;
    var pad = Math.max(innerWidth, innerHeight) * 0.7;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (p.pinned) continue;          // pinned pieces are frozen in place
      if (m === 'jagged') {
        if (Math.random() < 0.14) { p.vx = Math.random() * 2 - 1; p.vy = Math.random() * 2 - 1; }
        p.x += p.vx * p.s * JAG_SPEED + (Math.random() - 0.5) * JAG_JITTER;
        p.y += p.vy * p.s * JAG_SPEED + (Math.random() - 0.5) * JAG_JITTER;
      } else if (m === 'float') {
        p.x += Math.sin(frame * 0.013 + p.phase) * 0.7 * p.s;
        p.y += Math.cos(frame * 0.011 + p.phase * 1.3) * 0.7 * p.s;
      } else if (m === 'spin') {
        p.x += p.vx * p.s * 0.2;
        p.y += p.vy * p.s * 0.2;
        p.rot += p.spin;
      } else { // drift
        p.x += p.vx * p.s * 0.35;
        p.y += p.vy * p.s * 0.35;
      }
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
    if (m !== 'still' && !reduce) { if (!raf) raf = requestAnimationFrame(tick); }
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
    syncButtons();
  }

  // ---- pin a cutout: tap/click freezes it and brings it to front ----
  // Cutouts are mostly transparent, so a bounding-box click would almost always
  // grab a big piece's empty area. We sample each image's alpha at the tap point
  // and pin the topmost piece that's actually opaque there.
  var alphaCache = {}, zTop = 1000;
  function alphaMap(img) {
    var key = img.currentSrc || img.src;
    if (alphaCache[key]) return alphaCache[key];
    if (!(img.complete && img.naturalWidth)) return null;
    var mw = 64, mh = Math.max(1, Math.round(64 * img.naturalHeight / img.naturalWidth));
    var cv = document.createElement('canvas'); cv.width = mw; cv.height = mh;
    var ctx = cv.getContext('2d'), d;
    try { ctx.drawImage(img, 0, 0, mw, mh); d = ctx.getImageData(0, 0, mw, mh).data; }
    catch (e) { return null; }
    var a = new Uint8Array(mw * mh);
    for (var i = 0; i < mw * mh; i++) a[i] = d[i * 4 + 3];
    return (alphaCache[key] = { w: mw, h: mh, a: a });
  }
  function hitPiece(cx, cy) {
    var order = pieces.slice().sort(function (a, b) { return b.z - a.z; }); // topmost first
    for (var i = 0; i < order.length; i++) {
      var p = order[i], img = p.el.firstChild, m = alphaMap(img);
      if (!m) continue;
      var W = parseFloat(p.el.style.width), H = W * (m.h / m.w);
      var dx = cx - p.x, dy = cy - p.y;
      if (p.rot) { var r = -p.rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), nx = dx * co - dy * si; dy = dx * si + dy * co; dx = nx; }
      var u = dx / W + 0.5, v = dy / H + 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      var ai = Math.min(m.h - 1, (v * m.h) | 0) * m.w + Math.min(m.w - 1, (u * m.w) | 0);
      if (m.a[ai] > 40) return p;
    }
    return null;
  }
  function pinPiece(p, on) {
    p.pinned = on;
    var img = p.el.firstChild;
    if (on) {
      p.z = ++zTop; p.el.style.zIndex = zTop;
      img.style.filter = p.baseFilter + ' drop-shadow(0 0 7px rgba(228,226,221,.6))';
    } else {
      img.style.filter = p.baseFilter;
    }
  }
  function togglePin(p) {
    pinPiece(p, !p.pinned);
    // low-count "build a collage" mode: pinning one you like drops in a fresh
    // candidate, so the composition grows piece by piece.
    if (p.pinned && state.count < 5 && pieces.length < 40) spawnPiece(pieces.length);
  }
  stage.addEventListener('click', function (e) {
    var p = hitPiece(e.clientX, e.clientY);
    if (p) togglePin(p);
  });

  // ---- capture the current frame as a PNG (redrawn to canvas so the blend,
  // inversion and positions are reproduced exactly) ----
  var BLEND_MAP = { normal: 'source-over', screen: 'screen', lighten: 'lighten', difference: 'difference', exclusion: 'exclusion', multiply: 'multiply' };
  function exportImage() {
    var k = Math.max(1.3, Math.min(2, window.devicePixelRatio || 1));
    var cv = document.createElement('canvas');
    cv.width = Math.round(innerWidth * k); cv.height = Math.round(innerHeight * k);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#08080a'; ctx.fillRect(0, 0, cv.width, cv.height);
    var order = pieces.slice().sort(function (a, b) { return a.z - b.z; }); // bottom-up
    for (var i = 0; i < order.length; i++) {
      var p = order[i], img = p.el.firstChild;
      if (!(img.complete && img.naturalWidth)) continue;
      var w = parseFloat(p.el.style.width) * k, h = w * (img.naturalHeight / img.naturalWidth);
      ctx.save();
      ctx.globalCompositeOperation = BLEND_MAP[state.blend] || 'source-over';
      try { ctx.filter = img.style.filter || 'none'; } catch (e) {}
      ctx.translate(p.x * k, p.y * k);
      if (p.rot) ctx.rotate(p.rot * Math.PI / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    // if the page is in its inverted (negative) look, match it in the export
    if (document.body.classList.contains('page-inverted')) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
    var url;
    try { url = cv.toDataURL('image/png'); } catch (e) { return; }  // synchronous + reliable
    var a = document.createElement('a');
    a.href = url;
    a.download = 'systemssystemssystems-cutouts-' + Date.now() + '.png';
    a.target = '_blank';                   // iOS ignores download: opens the image to long-press-save
    document.body.appendChild(a); a.click(); a.remove();
  }
  var saveBtn = document.getElementById('cutsave');
  if (saveBtn) saveBtn.addEventListener('click', exportImage);

  // ---- invert the whole page (negative look) ----
  var invertBtn = document.getElementById('cutinvert');
  if (invertBtn) invertBtn.addEventListener('click', function () {
    var on = document.body.classList.toggle('page-inverted');
    invertBtn.classList.toggle('on', on);
    invertBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  // ---- cutout palette (right-edge tray): drag a specific cutout onto the
  // canvas to place it, or (mobile) tap one to drop it in. Placed pieces land
  // pinned so they stay where you put them. ----
  var tray = document.getElementById('cuttray');
  var trayItems = document.getElementById('trayItems');
  var trayHandle = document.getElementById('trayHandle');

  function dropCutout(cutout, x, y) {
    var s = 0.9 + Math.random() * 0.5;
    var p = spawnPiece(pieces.length, { cutout: cutout, x: x, y: y, scale: s });
    pinPiece(p, true);                      // placed pieces stay put (frozen + front)
  }
  function centreDrop(cutout) {
    dropCutout(cutout, innerWidth / 2 + (Math.random() * 90 - 45), innerHeight * 0.42 + (Math.random() * 90 - 45));
  }

  if (tray && trayItems) {
    POOL.forEach(function (c) {
      var it = document.createElement('div');
      it.className = 'tray-item';
      var im = document.createElement('img');
      im.src = c.thumb; im.alt = ''; im.draggable = false;
      im.style.filter = c.invert ? 'invert(1)' : 'none';
      (function (im, full) { im.onerror = function () { im.onerror = null; im.src = full; }; })(im, c.full);
      it.appendChild(im);
      if (isMobile) {
        // tap to add; the strip scrolls natively on swipe
        it.addEventListener('click', function () {
          centreDrop(c);
          it.classList.add('added'); setTimeout(function () { it.classList.remove('added'); }, 220);
        });
      } else {
        it.addEventListener('pointerdown', function (e) { startDrag(e, c, im); });
      }
      trayItems.appendChild(it);
    });
    if (trayHandle) trayHandle.addEventListener('click', function () {
      var open = tray.classList.toggle('open');
      trayHandle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // pointer drag (desktop): ghost follows the cursor; drop on the canvas places
  var drag = null;
  function startDrag(e, cutout, srcImg) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    if (tray) tray.classList.add('open');
    var ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    var g = document.createElement('img'); g.src = srcImg.src; g.style.filter = srcImg.style.filter;
    ghost.appendChild(g);
    document.body.appendChild(ghost);
    drag = { cutout: cutout, ghost: ghost, x0: e.clientX, y0: e.clientY, moved: false };
    moveGhost(e.clientX, e.clientY);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
    window.addEventListener('pointercancel', onDragUp);
  }
  function moveGhost(x, y) { if (drag) { drag.ghost.style.left = x + 'px'; drag.ghost.style.top = y + 'px'; } }
  function onDragMove(e) {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) > 6 || Math.abs(e.clientY - drag.y0) > 6) { drag.moved = true; drag.ghost.classList.add('show'); }
    moveGhost(e.clientX, e.clientY);
  }
  function onDragUp(e) {
    if (!drag) return;
    var overTray = tray && inRect(e.clientX, e.clientY, tray.getBoundingClientRect());
    if (drag.moved && !overTray) dropCutout(drag.cutout, e.clientX, e.clientY);
    else if (!drag.moved) centreDrop(drag.cutout);   // a click, not a drag → add at centre
    if (drag.ghost) drag.ghost.remove();
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    window.removeEventListener('pointercancel', onDragUp);
    drag = null;
  }
  function inRect(x, y, r) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

  // ---- controls ----
  var BLENDS = ['normal', 'screen', 'lighten', 'difference', 'exclusion', 'multiply'];
  var SCALES = ['tame', 'violent'];
  var MOTIONS = ['still', 'drift', 'jagged', 'float', 'spin'];

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
      if (b.dataset.v !== 'still') b.disabled = reduce;
    });
    document.getElementById('cutcount').textContent = state.count;
  }

  build('cutblend', BLENDS, function (v) { state.blend = v; pieces.forEach(function (p) { p.el.style.mixBlendMode = v; }); syncButtons(); });
  build('cutscale', SCALES, function (v) { state.scaleMode = v; recompose(); syncButtons(); });
  build('cutmotion', MOTIONS, setMotion);

  document.getElementById('cutmore').addEventListener('click', function () { state.count = Math.min(30, state.count + 1); recompose(); syncButtons(); });
  document.getElementById('cutless').addEventListener('click', function () { state.count = Math.max(1, state.count - 1); recompose(); syncButtons(); });
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
