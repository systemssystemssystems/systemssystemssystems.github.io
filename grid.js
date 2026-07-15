/* ================================================================
   THE GRID — endless.
   The full set of tiles is rendered three times, stacked. You
   start on the middle copy. Whenever you scroll more than half a
   copy away from it, the page silently teleports you back by
   exactly one copy's height — the copies are identical, so the
   jump is invisible. Scroll down forever, scroll up forever.
   ================================================================ */

const COPIES = 3;
const gridpage = document.getElementById('gridpage');
const copies = [];

function buildCopy(){
  const g = document.createElement('div');
  g.className = 'grid gridcopy';
  WORKS.forEach((work, i) => {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.tabIndex = 0;
    const num = String(WORKS.length - i).padStart(2,'0');
    fig.innerHTML = `
      <img src="${work.src}" alt="${work.title}" loading="lazy">
      <figcaption><b>${num}</b>${work.title} — ${work.year}</figcaption>`;
    fig.addEventListener('click', () => openBox(i));
    fig.addEventListener('keydown', e => { if(e.key === 'Enter') openBox(i); });
    g.appendChild(fig);
  });
  return g;
}

for(let c = 0; c < COPIES; c++){
  const copy = buildCopy();
  copies.push(copy);
  gridpage.appendChild(copy);
}

/* the loop period = exact distance between two copies */
let period = 0;
function measure(){
  period = copies[1].offsetTop - copies[0].offsetTop;
}

/* start on the middle copy, then keep the visitor near it forever */
measure();
window.scrollTo(0, period);

window.addEventListener('scroll', () => {
  if(!period) return;
  const y = window.scrollY;
  if(y < period * 0.5)      window.scrollTo(0, y + period);
  else if(y > period * 1.5) window.scrollTo(0, y - period);
}, { passive:true });

window.addEventListener('resize', () => {
  const ratio = period ? (window.scrollY / period) : 1;
  measure();
  window.scrollTo(0, ratio * period);
});

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
