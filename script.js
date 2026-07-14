/* ================================================================
   THE FIELD (front page).
   The image list lives in works.js — edit it there, not here.

   Layout + evolution: pieces migrate anywhere, on their own
   clocks, re-rolling size each time. Nested pairs travel together.

   Tuning:
     FADE              — dissolve length (ms), matches the CSS 3.4s
     9000 + ...*9000   — time between migrations per piece (ms)
     SIZE ranges       — in the place() function below
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
const mobile = window.matchMedia('(max-width: 640px)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* tighter vertical rhythm on mobile = denser, less dead space */
const stepVh = mobile ? 38 : 60;
const pieces = [];
const hosts = [];

let lastHost = null;

const bigCount = WORKS.length - Math.floor(WORKS.length / 3);
const fieldVh = bigCount * stepVh + 55;

function place(h, R){
  /* mobile pieces run bigger relative to the screen — small
     fragments that work on desktop just read as clutter on a phone */
  h.w = mobile ? 54 + R()*36 : 16 + R()*32;
  h.x = 2 + R()*Math.max(92 - h.w, 2);
  h.y = 6 + R()*(fieldVh - 50);
  h.z = Math.floor(R()*20);
  apply(h.fig, h);
  if(h.child){
    const c = h.child;
    c.w = mobile ? 20 + R()*12 : 8 + R()*10;
    c.x = h.x + R() * Math.max(h.w - c.w, 3);
    c.y = h.y + 8 + R()*14;
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
  const fig = document.createElement('figure');
  fig.className = 'piece';
  fig.tabIndex = 0;

  const num = String(WORKS.length - i).padStart(2,'0');
  fig.innerHTML = `
    <img src="${work.src}" alt="${work.title}" loading="lazy">
    <figcaption><b>${num}</b>${work.title} — ${work.year}</figcaption>`;

  fig.style.setProperty('--humDur', (4 + seeded()*5).toFixed(2) + 's');
  fig.style.setProperty('--humDelay', (-seeded()*8).toFixed(2) + 's');

  fig.addEventListener('click', () => openBox(i));
  fig.addEventListener('keydown', e => { if(e.key === 'Enter') openBox(i); });
  field.appendChild(fig);
  pieces.push(fig);

  const isSmall = (i % 3 === 2) && lastHost;
  if(isSmall){
    lastHost.child = { fig };
    fig.dataset.drift = lastHost.drift;
  } else {
    const h = {
      fig,
      drift: reduced ? 0 : (seeded()*0.14 - 0.04),
      child: null
    };
    fig.dataset.drift = h.drift;
    hosts.push(h);
    lastHost = h;
  }
});

hosts.forEach(h => place(h, seeded));

field.style.height = fieldVh + 'vh';

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

/* ---- lightbox ---- */
const box = document.getElementById('box');
const boxImg = document.getElementById('boxImg');
const boxCap = document.getElementById('boxCap');
let current = 0;

function openBox(i){
  current = i;
  const w = WORKS[i];
  boxImg.src = w.src;
  boxImg.alt = w.title;
  const num = String(WORKS.length - i).padStart(2,'0');
  boxCap.innerHTML = `<b>${num}</b>${w.title} — ${w.year}`;
  box.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeBox(){
  box.classList.remove('open');
  document.body.style.overflow = '';
}
function step(d){ openBox((current + d + WORKS.length) % WORKS.length); }

document.getElementById('close').addEventListener('click', closeBox);
document.getElementById('prev').addEventListener('click', () => step(-1));
document.getElementById('next').addEventListener('click', () => step(1));
box.addEventListener('click', e => { if(e.target === box) closeBox(); });
window.addEventListener('keydown', e => {
  if(!box.classList.contains('open')) return;
  if(e.key === 'Escape') closeBox();
  if(e.key === 'ArrowLeft') step(-1);
  if(e.key === 'ArrowRight') step(1);
});
