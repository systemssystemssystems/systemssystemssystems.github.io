/* ================================================================
   THE GRID — an infinite sheet.
   The full set of tiles, in strict rows and columns, repeats
   endlessly in every direction. Drag, flick, or scroll-wheel to
   pan; space wraps on both axes.

   How: the grid block is rendered as a 3x3 patchwork of identical
   copies, and a camera slides the patchwork around. Whenever the
   camera crosses one block's width or height, it wraps by exactly
   that much — the copies are identical, so the wrap is invisible.

   Tuning:
     FRICTION — momentum decay after a flick
     GAP      — spacing (must stay matched to the CSS grid gap)
   ================================================================ */

const canvas = document.getElementById('gridcanvas');
const supergrid = document.getElementById('supergrid');
const mobile = window.matchMedia('(max-width: 640px)').matches;
const midsize = window.matchMedia('(max-width: 1100px)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLS = mobile ? 2 : (midsize ? 3 : 4);
const GAP = mobile ? 14 : 26;

let PW = 0, PH = 0;               /* the wrap periods (block + gap) */
const blocks = [];

function buildBlock(){
  const g = document.createElement('div');
  g.className = 'grid gridblock';
  WORKS.forEach((work, i) => {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.tabIndex = 0;
    const num = String(WORKS.length - i).padStart(2,'0');
    fig.innerHTML = `
      <img src="${work.src}" alt="${work.title}" loading="lazy" draggable="false">
      <figcaption><b>${num}</b>${work.title} — ${work.year}</figcaption>`;
    fig.addEventListener('click', () => { if(dragDist < 10) openBox(i); });
    fig.addEventListener('keydown', e => { if(e.key === 'Enter') openBox(i); });
    g.appendChild(fig);
  });
  return g;
}

/* nine identical copies in a 3x3 patchwork */
for(let by = 0; by < 3; by++){
  for(let bx = 0; bx < 3; bx++){
    const b = buildBlock();
    b.dataset.bx = bx;
    b.dataset.by = by;
    blocks.push(b);
    supergrid.appendChild(b);
  }
}

/* size the cells so one block spans exactly the viewport width,
   with uniform gaps everywhere — including across the wrap seam */
function layout(){
  const cell = (window.innerWidth - COLS * GAP) / COLS;
  blocks.forEach(b => {
    b.style.gridTemplateColumns = `repeat(${COLS}, ${cell}px)`;
    b.style.gap = GAP + 'px';
    b.style.position = 'absolute';
  });
  /* measure one block, derive the wrap periods, position the copies */
  const bw = blocks[0].offsetWidth;
  const bh = blocks[0].offsetHeight;
  PW = bw + GAP;
  PH = bh + GAP;
  blocks.forEach(b => {
    b.style.left = (b.dataset.bx * PW) + 'px';
    b.style.top  = (b.dataset.by * PH) + 'px';
  });
}

/* ---- camera ---- */
let camX = 0, camY = 0, velX = 0, velY = 0;
let dragging = false, lastX = 0, lastY = 0, dragDist = 0;
let needsRender = true;

function wrap(v, size){ return ((v % size) + size) % size; }

function render(){
  supergrid.style.transform =
    `translate3d(${-(PW + wrap(camX, PW))}px, ${-(PH + wrap(camY, PH))}px, 0)`;
}

const FRICTION = .94;
function loop(){
  if(!dragging && !reduced && (Math.abs(velX) > .05 || Math.abs(velY) > .05)){
    camX += velX; camY += velY;
    velX *= FRICTION; velY *= FRICTION;
    needsRender = true;
  }
  if(needsRender){ render(); needsRender = false; }
  requestAnimationFrame(loop);
}

/* ---- input: drag / flick / wheel ---- */
const hint = document.getElementById('hint');
function hideHint(){ if(hint) hint.classList.add('gone'); }

canvas.addEventListener('pointerdown', e => {
  dragging = true;
  canvas.classList.add('dragging');
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
  canvas.classList.remove('dragging');
});
window.addEventListener('wheel', e => {
  e.preventDefault();
  camX += e.deltaX; camY += e.deltaY;
  needsRender = true;
  hideHint();
}, { passive:false });

window.addEventListener('resize', () => { layout(); needsRender = true; });

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
layout();
render();
loop();
