/* ================================================================
   THE FIELD — an infinite draggable plane.

   The pieces (and the title) live at fixed spots on a virtual
   tile of size TW x TH. The tile repeats endlessly in every
   direction: drag, swipe, or scroll-wheel to drift across it,
   and space wraps around on both axes so there is no edge.

   Everything else survives: the hum, the migrations, the edge
   static, lingering, the lightbox.

   Tuning:
     TW / TH           — size of the repeating region (bigger =
                         sparser, more dark between encounters)
     FRICTION          — momentum decay after a flick (0.94)
     PARALLAX          — depth range; pieces drift at slightly
                         different rates for depth (set in build)
     FADE / migration timing — as before
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

const plane = document.getElementById('plane');
const mobile = window.matchMedia('(max-width: 640px)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointerFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

/* the repeating region — comfortably bigger than any viewport */
const TW = Math.max(window.innerWidth * 2.6, 2600);
const TH = Math.max(window.innerHeight * 2.8, 2200);

const pieces = [];   /* image figures, for static + linger */
const hosts = [];    /* placed items (each may carry a nested child) */

let lastHost = null;

/* fresh geometry for a host (and its nested child, which stores
   a RELATIVE offset so the pair can never be split by the wrap) */
function place(h, R){
  h.w = mobile ? 54 + R()*36 : 16 + R()*32;       /* width in vw */
  h.vx = R() * TW;
  h.vy = R() * TH;
  h.z = Math.floor(R()*20);
  h.fig.style.width = h.w + 'vw';
  h.fig.style.zIndex = h.z;
  if(h.child){
    const c = h.child;
    c.w = mobile ? 20 + R()*12 : 8 + R()*10;
    const hostPx = h.w / 100 * window.innerWidth;
    const childPx = c.w / 100 * window.innerWidth;
    c.dx = R() * Math.max(hostPx - childPx, 30);
    c.dy = 50 + R() * 110;
    c.fig.style.width = c.w + 'vw';
    c.fig.style.zIndex = h.z + 5;
  }
}

/* ---- build ---- */
WORKS.forEach((work, i) => {
  const fig = document.createElement('figure');
  fig.className = 'piece';
  fig.tabIndex = 0;

  const num = String(WORKS.length - i).padStart(2,'0');
  fig.innerHTML = `
    <img src="${work.src}" alt="${work.title}" loading="lazy" draggable="false">
    <figcaption><b>${num}</b>${work.title} — ${work.year}</figcaption>`;

  fig.style.setProperty('--humDur', (4 + seeded()*5).toFixed(2) + 's');
  fig.style.setProperty('--humDelay', (-seeded()*8).toFixed(2) + 's');

  fig.addEventListener('click', () => { if(dragDist < 10) openBox(i); });
  fig.addEventListener('keydown', e => { if(e.key === 'Enter') openBox(i); });
  plane.appendChild(fig);
  pieces.push(fig);

  const isSmall = (i % 3 === 2) && lastHost;
  if(isSmall){
    lastHost.child = { fig };
  } else {
    hosts.push({
      fig,
      par: .88 + seeded()*.24,   /* parallax depth: <1 far, >1 near */
      child: null
    });
    lastHost = hosts[hosts.length - 1];
  }
});

hosts.forEach(h => place(h, seeded));

/* the title lives on the plane too */
const titleItem = {
  fig: document.getElementById('planeTitle'),
  par: 1, vx: TW / 2, vy: TH / 2, child: null, isTitle: true
};

/* ---- the camera ---- */
let camX = TW / 2, camY = TH / 2;       /* start centred on the title */
let velX = 0, velY = 0;
let dragging = false, lastX = 0, lastY = 0, dragDist = 0;
let needsRender = true;

function wrapOffset(v, size){
  let o = ((v % size) + size) % size;
  if(o > size / 2) o -= size;
  return o;
}

function renderItem(item){
  const x = wrapOffset(item.vx - camX * item.par, TW) + window.innerWidth / 2;
  const y = wrapOffset(item.vy - camY * item.par, TH) + window.innerHeight / 2;
  if(item.isTitle){
    item.fig.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  } else {
    item.fig.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if(item.child){
      item.child.fig.style.transform =
        `translate3d(${x + item.child.dx}px, ${y + item.child.dy}px, 0)`;
    }
  }
}

function render(){
  renderItem(titleItem);
  for(const h of hosts) renderItem(h);
}

/* ---- main loop: momentum + rendering + static updates ---- */
const FRICTION = .94;
function loop(){
  if(!dragging && !reduced && (Math.abs(velX) > .05 || Math.abs(velY) > .05)){
    camX += velX; camY += velY;
    velX *= FRICTION; velY *= FRICTION;
    needsRender = true;
  }
  if(needsRender){
    render();
    if(pointerFine && !reduced) updateStatic();
    needsRender = false;
  }
  requestAnimationFrame(loop);
}

/* ---- input: drag / flick / wheel ---- */
const hint = document.getElementById('hint');
function hideHint(){ if(hint) hint.classList.add('gone'); }

plane.addEventListener('pointerdown', e => {
  dragging = true;
  plane.classList.add('dragging');
  lastX = e.clientX; lastY = e.clientY;
  velX = velY = 0; dragDist = 0;
  hideHint();
});
window.addEventListener('pointermove', e => {
  if(!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  camX -= dx; camY -= dy;
  dragDist += Math.abs(dx) + Math.abs(dy);
  velX = velX * .7 + (-dx) * .3;
  velY = velY * .7 + (-dy) * .3;
  needsRender = true;
});
window.addEventListener('pointerup', () => {
  dragging = false;
  plane.classList.remove('dragging');
});
window.addEventListener('wheel', e => {
  e.preventDefault();
  camX += e.deltaX; camY += e.deltaY;
  needsRender = true;
  hideHint();
}, { passive:false });

window.addEventListener('resize', () => { needsRender = true; });

/* ---- edge static (desktop pointers only) ---- */
const RANGE = 260, MAXSTATIC = .5;
let mx = -9e4, my = -9e4;
function updateStatic(){
  for(const p of pieces){
    const r = p.getBoundingClientRect();
    if(r.bottom < -100 || r.top > innerHeight + 100 || r.right < -100 || r.left > innerWidth + 100){
      p.style.setProperty('--staticAmt', 0);
      continue;
    }
    const dx = Math.max(r.left - mx, 0, mx - r.right);
    const dy = Math.max(r.top - my, 0, my - r.bottom);
    const amt = Math.max(0, 1 - Math.hypot(dx, dy) / RANGE) * MAXSTATIC;
    p.style.setProperty('--staticAmt', amt.toFixed(3));
  }
}
if(pointerFine && !reduced){
  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    needsRender = true;
  }, { passive:true });

  /* linger: hover half a second and the piece (and the hum) quicken */
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

/* ---- migrations: pieces still dissolve and re-materialise ---- */
function migrate(h){
  const wait = 9000 + Math.random()*9000;
  setTimeout(() => {
    h.fig.classList.add('moving');
    if(h.child) h.child.fig.classList.add('moving');
    setTimeout(() => {
      place(h, Math.random);
      needsRender = true;
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
}
function closeBox(){
  box.classList.remove('open');
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

/* go */
render();
loop();
