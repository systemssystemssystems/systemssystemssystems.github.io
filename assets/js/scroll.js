/* ================================================================
   THE WEIGHT — scrolling the field is deliberately slower than a
   normal page: wheel and touch input is damped and the descent
   speed is capped, so the pieces drift past rather than fly.

   Wheel and touch are intercepted and eased toward a target; the
   keyboard, scrollbar, and pinch-zoom stay native (they're also
   the accessible paths). With prefers-reduced-motion the whole
   module stands down and scrolling is entirely the browser's.

   Tuning:
     GAIN / TOUCH_GAIN — fraction of the native scroll distance
     MAXV              — speed cap, px per frame (60fps ≈ MAXV*60 px/s)
     EASE              — how eagerly the page approaches the target
   ================================================================ */
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const GAIN = 0.7;
  const TOUCH_GAIN = 0.8;
  const MAXV = 60;
  const EASE = 0.17;

  let target = window.scrollY, cur = window.scrollY, raf = null;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function tick(){
    const d = target - cur;
    if(Math.abs(d) < .6){
      cur = target;
      raf = null;
    } else {
      cur += Math.max(-MAXV, Math.min(MAXV, d * EASE));
      raf = requestAnimationFrame(tick);
    }
    window.scrollTo(0, Math.round(cur));
  }

  function nudge(px){
    cur = window.scrollY;
    target = Math.max(0, Math.min(target + px, maxScroll()));
    if(!raf) raf = requestAnimationFrame(tick);
  }

  function reanchor(){
    if(raf) cancelAnimationFrame(raf);
    raf = null;
    target = cur = window.scrollY;
  }

  function wheelPixels(e){
    if(e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 16;
    if(e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * innerHeight;
    return e.deltaY;
  }

  window.addEventListener('wheel', e => {
    if(e.ctrlKey) return;                          /* pinch-zoom stays native */
    if(Lightbox.isOpen()) return;                  /* loaded after lightbox.js */
    e.preventDefault();
    nudge(wheelPixels(e) * GAIN);
  }, { passive:false });

  /* touch: same weight. Velocity is tracked for a short, damped
     glide on release — far tamer than native flick momentum. */
  let touchY = null, vel = 0;
  window.addEventListener('touchstart', e => {
    if(e.touches.length !== 1 || Lightbox.isOpen()){
      touchY = null;
      return;
    }
    touchY = e.touches[0].clientY;
    vel = 0;
    target = cur = window.scrollY;                 /* grab the page mid-glide */
  }, { passive:true });
  window.addEventListener('touchmove', e => {
    if(e.touches.length !== 1){
      touchY = null;                              /* a second finger means pinch-zoom */
      return;
    }
    if(touchY === null) return;
    if(Lightbox.isOpen()) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    vel = vel * .7 + dy * .3;
    nudge(dy * TOUCH_GAIN);
  }, { passive:false });
  window.addEventListener('touchend', () => {
    if(touchY === null) return;
    touchY = null;
    nudge(Math.max(-700, Math.min(700, vel * 12)));
    vel = 0;
  });
  window.addEventListener('touchcancel', () => { touchY = null; vel = 0; });

  /* Native inputs should take over immediately, even mid-ease. */
  window.addEventListener('keydown', reanchor, { passive:true });
  window.addEventListener('pointerdown', reanchor, { passive:true });

  /* anything native (keys, scrollbar, anchors) re-anchors the easing */
  window.addEventListener('scroll', () => {
    if(!raf) cur = target = window.scrollY;
  }, { passive:true });
})();
