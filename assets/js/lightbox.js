/* ================================================================
   SHARED — small helpers + the lightbox, used by both pages.
   Load order: works.js, images/thumbs/index.js, this, page script.
   ================================================================ */

/* escape free text before it lands in innerHTML or an attribute —
   titles are arbitrary ("<3" is a real title in the manifest) */
function esc(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* inline images use the generated thumbs (images/thumbs/index.js).
   No manifest entry — or no manifest at all — falls back to the
   original file, so a missing thumb can never break the site. */
function thumbFor(work){
  const t = window.THUMBS && window.THUMBS[work.src.split('/').pop()];
  return t ? 'images/thumbs/' + t : work.src;
}

/* build the standard <figure> for a work: thumb inline, escaped
   caption, and a silent fallback to the original if the thumb 404s */
function buildFigure(work, i, className){
  const fig = document.createElement('figure');
  fig.className = className;
  fig.tabIndex = 0;
  const num = String(WORKS.length - i).padStart(2, '0');
  fig.innerHTML = `
    <img src="${esc(thumbFor(work))}" alt="${esc(work.title)}" loading="lazy" decoding="async" draggable="false">
    <figcaption><b>${num}</b>${esc(work.title)} — ${esc(work.year)}</figcaption>`;
  const img = fig.querySelector('img');
  img.addEventListener('error', () => { img.src = work.src; }, { once:true });
  return fig;
}

const Lightbox = (() => {
  const box = document.getElementById('box');
  const img = document.getElementById('boxImg');
  const cap = document.getElementById('boxCap');
  const focusables = [
    document.getElementById('prev'),
    document.getElementById('next'),
    document.getElementById('close'),
  ];
  let current = 0, lastFocus = null;

  function open(i){
    current = (i + WORKS.length) % WORKS.length;
    const w = WORKS[current];
    img.src = w.src;                 /* the box always shows the full-res original */
    img.alt = w.title;
    const num = String(WORKS.length - current).padStart(2, '0');
    cap.innerHTML = `<b>${num}</b>${esc(w.title)} — ${esc(w.year)}`;
    if(!box.classList.contains('open')){
      lastFocus = document.activeElement;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      focusables[2].focus();
    }
  }
  function close(){
    box.classList.remove('open');
    document.body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  const step = d => open(current + d);
  const isOpen = () => box.classList.contains('open');

  focusables[2].addEventListener('click', close);
  focusables[0].addEventListener('click', () => step(-1));
  focusables[1].addEventListener('click', () => step(1));
  box.addEventListener('click', e => { if(e.target === box) close(); });

  window.addEventListener('keydown', e => {
    if(!isOpen()) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') step(-1);
    if(e.key === 'ArrowRight') step(1);
    if(e.key === 'Tab'){             /* keep focus inside the dialog */
      e.preventDefault();
      const idx = focusables.indexOf(document.activeElement);
      const next = e.shiftKey
        ? (idx <= 0 ? focusables.length - 1 : idx - 1)
        : (idx === -1 || idx === focusables.length - 1 ? 0 : idx + 1);
      focusables[next].focus();
    }
  });

  return { open, close, step, isOpen };
})();
