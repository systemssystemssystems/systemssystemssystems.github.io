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
const S_MIN = 0.6, S_MAX = 1.6;   /* zoom barriers: 0.6 keeps the 3x3
   patchwork covering the screen; 1.6 keeps thumbnails sharp */

supergrid.style.transformOrigin = '0 0';

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
  if(r.left < m) camX -= (m - r.left) / s;
  else if(r.right > innerWidth - m) camX += (r.right - (innerWidth - m)) / s;
  if(r.top < m) camY -= (m - r.top) / s;
  else if(r.bottom > innerHeight - m) camY += (r.bottom - (innerHeight - m)) / s;
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
let camX = 0, camY = 0, velX = 0, velY = 0, s = 1;
let dragging = false, lastX = 0, lastY = 0, dragDist = 0;
let needsRender = true;

function wrap(v, size){ return ((v % size) + size) % size; }

const clampS = v => Math.min(S_MAX, Math.max(S_MIN, v));

/* zoom towards a screen point: that point stays pinned under the
   fingers/cursor while the scale changes around it */
function zoomAt(px, py, s2){
  s2 = clampS(s2);
  camX += (px - innerWidth / 2) * (1 / s - 1 / s2);
  camY += (py - innerHeight / 2) * (1 / s - 1 / s2);
  s = s2;
  needsRender = true;
}

function render(){
  supergrid.style.transform =
    `translate3d(${innerWidth / 2 - s * (PW + wrap(camX, PW))}px, ` +
    `${innerHeight / 2 - s * (PH + wrap(camY, PH))}px, 0) scale(${s})`;
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

const pointers = new Map();
let prevMid = null, prevDist = 0;

canvas.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  hideHint();
  if(pointers.size === 1){
    dragging = true;
    canvas.classList.add('dragging');
    lastX = e.clientX; lastY = e.clientY;
    velX = velY = 0; dragDist = 0;
  } else if(pointers.size === 2){
    dragging = false;                        /* two fingers = pinch */
    const [a, b] = [...pointers.values()];
    prevMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    prevDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
window.addEventListener('pointermove', e => {
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if(prevDist > 0) zoomAt(mid.x, mid.y, s * (dist / prevDist));
    camX -= (mid.x - prevMid.x) / s;         /* two-finger pan too */
    camY -= (mid.y - prevMid.y) / s;
    dragDist += Math.abs(mid.x - prevMid.x) + Math.abs(mid.y - prevMid.y)
              + Math.abs(dist - prevDist);
    prevMid = mid; prevDist = dist;
    needsRender = true;
  } else if(dragging){
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    camX -= dx / s; camY -= dy / s;
    dragDist += Math.abs(dx) + Math.abs(dy);
    velX = velX * .7 + (-dx / s) * .3;
    velY = velY * .7 + (-dy / s) * .3;
    needsRender = true;
  }
});
function releasePointer(e){
  pointers.delete(e.pointerId);
  if(pointers.size === 1){
    /* pinch ended with one finger down: hand back to dragging */
    const p = [...pointers.values()][0];
    dragging = true;
    lastX = p.x; lastY = p.y;
    velX = velY = 0;
  } else if(pointers.size === 0){
    dragging = false;
    canvas.classList.remove('dragging');
  }
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
window.addEventListener('blur', () => {
  pointers.clear(); dragging = false; canvas.classList.remove('dragging');
});
window.addEventListener('wheel', e => {
  if(Lightbox.isOpen()) return;      /* don't pan or zoom behind the lightbox */
  e.preventDefault();
  hideHint();
  if(e.ctrlKey){                     /* trackpad pinch / ctrl+scroll = zoom */
    zoomAt(e.clientX, e.clientY, s * Math.exp(-e.deltaY * .0022));
  } else {
    camX += e.deltaX / s;
    camY += e.deltaY / s;
    needsRender = true;
  }
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
