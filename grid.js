/* builds the grid page from WORKS (in works.js), plus the same lightbox */

const grid = document.getElementById('grid');

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
  grid.appendChild(fig);
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
