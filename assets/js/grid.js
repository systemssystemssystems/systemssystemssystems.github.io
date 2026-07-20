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
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let COLS = 4, GAP = 26;

let PW = 0, PH = 0;               /* the wrap periods (block + gap) */
const blocks = [];

function buildBlock(tabbable){
  const g = document.createElement('div');
  g.className = 'grid gridblock';
  if(!tabbable) g.setAttribute('aria-hidden', 'true');
  WORKS.forEach((work, i) => {
    const fig = buildFigure(work, i, 'tile');
    /* only the centre copy joins the tab order — nine identical
       copies would mean nine identical stops for every tile */
    if(!tabbable) fig.tabIndex = -1;
    fig.addEventListener('click', () => { if(dragDist < 10) Lightbox.open(i); });
    fig.addEventListener('keydown', e => { if(e.key === 'Enter') Lightbox.open(i); });
    if(tabbable) fig.addEventListener('focus', () => revealTile(fig));
    g.appendChild(fig);
  });
  return g;
}

/* nine identical copies in a 3x3 patchwork; centre one is tabbable */
for(let by = 0; by < 3; by++){
  for(let bx = 0; bx < 3; bx++){
    const b = buildBlock(bx === 1 && by === 1);
    b.dataset.bx = bx;
    b.dataset.by = by;
    blocks.push(b);
    supergrid.appendChild(b);
  }
}

/* keyboard pan: focusing a tile drives the camera to it (the browser's
   own reveal-scroll is undone first — it would desync the wrap math) */
function revealTile(fig){
  canvas.scrollLeft = 0; canvas.scrollTop = 0;
  const r = fig.getBoundingClientRect();
  const m = 60;
  if(r.left < m) camX -= m - r.left;
  else if(r.right > innerWidth - m) camX += r.right - (innerWidth - m);
  if(r.top < m) camY -= m - r.top;
  else if(r.bottom > innerHeight - m) camY += r.bottom - (innerHeight - m);
  velX = velY = 0;
  needsRender = true;
}

/* size the cells so one block spans exactly the viewport width,
   with uniform gaps everywhere — including across the wrap seam */
function layout(){
  COLS = innerWidth <= 640 ? 2 : (innerWidth <= 1100 ? 3 : 4);
  GAP = innerWidth <= 640 ? 14 : 26;
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
function endDrag(){
  dragging = false;
  canvas.classList.remove('dragging');
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
window.addEventListener('blur', endDrag);
window.addEventListener('wheel', e => {
  if(Lightbox.isOpen()) return;      /* don't pan behind the lightbox */
  e.preventDefault();
  camX += e.deltaX; camY += e.deltaY;
  needsRender = true;
  hideHint();
}, { passive:false });

window.addEventListener('resize', () => { layout(); needsRender = true; });
/* re-measure once everything has arrived — a late font swap changes
   caption height, and a stale PH would show at the wrap seam */
window.addEventListener('load', () => { layout(); needsRender = true; });
if(document.fonts && document.fonts.ready)
  document.fonts.ready.then(() => { layout(); needsRender = true; });

/* the lightbox itself lives in lightbox.js, shared with the field page */

/* go */
layout();
render();
loop();
