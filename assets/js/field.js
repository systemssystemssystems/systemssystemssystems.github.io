/* ================================================================
   THE FIELD (front page).
   The image list lives in works.js — edit it there, not here.

   Layout: every host piece owns one vertical band of the field
   (newest work = top band), and placement — including every later
   migration — jitters inside that band. Even density by
   construction: no voids, no pile-ups. Nested pairs travel
   together. Sizes are rolled in vw but clamped in px per device
   tier, so pieces never collapse on small windows or balloon on
   ultrawides; width changes re-tier and re-place the field after a
   short debounce.

   Tuning:
     FADE              — dissolve length (ms), matches the CSS 3.4s
     9000 + ...*9000   — time between migrations per piece (ms)
     SIZES             — per-tier size/density table below
   ================================================================ */

const FADE = 3400;

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const seeded = mulberry32(20260713);

const field = document.getElementById('field');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- responsive sizing ----
   host/child are [base, spread] in vw; the px pairs are hard
   floors/ceilings after conversion. step is the vertical rhythm
   (vh of field per host) — smaller = denser. */
const SIZES = [
  { max:  640, host:[58, 34], hostPx:[150, 900], child:[22, 12], childPx:[ 80, 420], step: 30 },  /* phones */
  { max: 1024, host:[36, 28], hostPx:[240, 720], child:[13, 11], childPx:[140, 400], step: 33 },  /* tablets */
  { max: 1e9,  host:[24, 30], hostPx:[300, 960], child:[ 9, 10], childPx:[170, 440], step: 36 },  /* desktop+ */
];
let T = SIZES.find(t => innerWidth <= t.max);

const pieces = [];
const hosts = [];

let lastHost = null;

const hostCount = WORKS.length - Math.floor(WORKS.length / 3);
let fieldVh = 0;
function sizeField(){
  T = SIZES.find(t => innerWidth <= t.max);
  fieldVh = hostCount * T.step + 45;
  field.style.height = fieldVh + 'vh';
}

/* roll a vw size, then clamp it in px against the live viewport */
function rollVw([base, spread], [minPx, maxPx], R){
  const vw = base + R() * spread;
  return Math.max(minPx / innerWidth * 100, Math.min(vw, maxPx / innerWidth * 100));
}

function place(h, R){
  h.w = rollVw(T.host, T.hostPx, R);
  /* the host's band: its slice of the field, with enough jitter to
     blur the seams but never enough to open a void */
  const band = (fieldVh - 60) / hosts.length;
  h.y = 8 + (h.band + 0.5) * band + (R() - 0.5) * band * .9;
  h.x = 2 + R() * Math.max(92 - h.w, 2);
  h.z = Math.floor(R() * 20);
  apply(h.fig, h);
  if(h.child){
    const c = h.child;
    c.w = rollVw(T.child, T.childPx, R);
    c.x = h.x + R() * Math.max(h.w - c.w, 3);
    c.y = h.y + 8 + R() * 14;
    c.z = h.z + 5;
    apply(c.fig, c);
  }
}
function apply(fig, o){
  fig.style.width = o.w + 'vw';
  fig.style.left  = o.x + 'vw';
  fig.style.top   = o.y + 'vh';
  fig.style.zIndex = o.z;
}

WORKS.forEach((work, i) => {
  const fig = buildFigure(work, i, 'piece');

  fig.style.setProperty('--humDur', (4 + seeded()*5).toFixed(2) + 's');
  fig.style.setProperty('--humDelay', (-seeded()*8).toFixed(2) + 's');

  fig.addEventListener('click', () => Lightbox.open(i));
  fig.addEventListener('keydown', e => { if(e.key === 'Enter') Lightbox.open(i); });
  field.appendChild(fig);
  pieces.push(fig);

  const isSmall = (i % 3 === 2) && lastHost;
  if(isSmall){
    lastHost.child = { fig };
    fig.dataset.drift = lastHost.drift;
  } else {
    const h = {
      fig,
      band: hosts.length,          /* fixed slice of the field, newest at the top */
      drift: reduced ? 0 : (seeded()*0.14 - 0.04),
      child: null
    };
    fig.dataset.drift = h.drift;
    hosts.push(h);
    lastHost = h;
  }
});

sizeField();
hosts.forEach(h => place(h, seeded));

/* real resizes re-tier and re-place everything (debounced); pure
   height changes are ignored — that's just a phone's browser bar */
let lastW = innerWidth, resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if(innerWidth === lastW) return;
    lastW = innerWidth;
    sizeField();
    hosts.forEach(h => place(h, Math.random));
  }, 350);
});

function drift(){
  const sy = window.scrollY;
  for(const p of pieces){
    p.style.transform = `translateY(${-sy * p.dataset.drift}px)`;
  }
}
drift();
if(!reduced) window.addEventListener('scroll', () => requestAnimationFrame(drift), { passive:true });

function migrate(h){
  const wait = 9000 + Math.random()*9000;
  setTimeout(() => {
    h.fig.classList.add('moving');
    if(h.child) h.child.fig.classList.add('moving');
    setTimeout(() => {
      place(h, Math.random);
      h.fig.classList.remove('moving');
      if(h.child) h.child.fig.classList.remove('moving');
      migrate(h);
    }, FADE + 150);
  }, wait);
}
if(!reduced) hosts.forEach(migrate);

/* ================================================================
   REACTIVITY (desktop pointers only; skipped on touch screens and
   for reduced motion, so nothing breaks elsewhere)

   1. Edge static: each piece's --staticAmt rises as the cursor
      nears it, fizzing its edges with noise.
   2. Linger: hover a piece for half a second and it's marked
      .linger (faster flutter) and, if the sound is on, the hum
      itself quickens via window.__hum.
   ================================================================ */
const pointerFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

if(pointerFine && !reduced){
  /* --- 1. edge static, driven by cursor proximity --- */
  const RANGE = 260;      /* px — how far the fizz reaches */
  const MAXSTATIC = .5;   /* peak overlay opacity at touch */
  let mx = -9e4, my = -9e4, queued = false;

  function updateStatic(){
    queued = false;
    /* phase 1: read every rect first; phase 2: write every style.
       Interleaving reads and writes forces the browser to re-run
       layout once per piece per frame — batched, it runs once. */
    const vh = innerHeight;
    const amts = new Array(pieces.length);
    for(let i = 0; i < pieces.length; i++){
      const r = pieces[i].getBoundingClientRect();
      if(r.bottom < -100 || r.top > vh + 100){
        amts[i] = '0';
        continue;
      }
      const dx = Math.max(r.left - mx, 0, mx - r.right);
      const dy = Math.max(r.top - my, 0, my - r.bottom);
      const amt = Math.max(0, 1 - Math.hypot(dx, dy) / RANGE) * MAXSTATIC;
      amts[i] = amt.toFixed(3);
    }
    for(let i = 0; i < pieces.length; i++){
      const p = pieces[i];
      if(p.dataset.amt !== amts[i]){           /* skip unchanged writes */
        p.dataset.amt = amts[i];
        p.style.setProperty('--staticAmt', amts[i]);
      }
    }
  }
  function queue(){ if(!queued){ queued = true; requestAnimationFrame(updateStatic); } }
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; queue(); }, { passive:true });
  window.addEventListener('scroll', queue, { passive:true });

  /* --- 2. linger detection --- */
  pieces.forEach(fig => {
    let timer;
    fig.addEventListener('mouseenter', () => {
      timer = setTimeout(() => {
        fig.classList.add('linger');
        if(window.__hum) window.__hum.excite(true);
      }, 500);
    });
    fig.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      fig.classList.remove('linger');
      if(window.__hum) window.__hum.excite(false);
    });
  });
}

/* the lightbox itself lives in lightbox.js, shared with the grid page */
