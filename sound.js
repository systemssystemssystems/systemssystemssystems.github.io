/* ================================================================
   THE HUM — a quiet, endless mains drone, synthesised live.
   50Hz fundamental + harmonics over a dark noise bed, breathing
   slowly. Starts only when the visitor asks (the "sound on" mark).

   Tuning:
     VOLUME    — overall loudness (0.16 is deliberately quiet)
     HARMONICS — the frequency recipe of the hum
     900       — the lowpass cutoff; lower = darker, muffled
   ================================================================ */

(function(){
  const VOLUME = 0.16;
  const HARMONICS = [[50, .50], [100, .28], [150, .14], [250, .05]];

  const toggle = document.getElementById('soundToggle');
  if(!toggle) return;

  let ctx = null, master = null, playing = false, suspendTimer = null, nodes = null;

  function build(){
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    /* chain: sources -> master (fade in/out) -> breath (slow LFO) -> lowpass -> out */
    master = ctx.createGain();
    master.gain.value = 0;

    const breath = ctx.createGain();
    breath.gain.value = 1;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 900;

    master.connect(breath);
    breath.connect(lowpass);
    lowpass.connect(ctx.destination);

    /* the hum: one oscillator per harmonic */
    HARMONICS.forEach(([freq, amp]) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g);
      g.connect(master);
      osc.start();
    });

    /* the static: heavily lowpassed noise in a loop, with its seam
       crossfaded into itself so the loop point is inaudible */
    const N = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, N, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let lp1 = 0, lp2 = 0;
    for(let i = 0; i < N; i++){
      const x = Math.random() * 2 - 1;
      lp1 += .02 * (x - lp1);
      lp2 += .02 * (lp1 - lp2);
      d[i] = lp2 * 6;
    }
    const F = (ctx.sampleRate / 2) | 0;
    for(let j = 0; j < F; j++){
      const t = j / F;
      d[N - F + j] = d[N - F + j] * (1 - t) + d[j] * t;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = .35;
    noise.connect(ng);
    ng.connect(master);
    noise.start();

    /* slow breathing: a 0.25Hz wobble on the volume, like load on the line */
    const lfo = ctx.createOscillator();
    lfo.frequency.value = .25;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = .09;
    lfo.connect(lfoGain);
    lfoGain.connect(breath.gain);
    lfo.start();

    /* remember the excitable parts */
    nodes = { lfo, lfoGain, lowpass };
  }

  async function soundOn(){
    if(!ctx) build();
    clearTimeout(suspendTimer);
    if(ctx.state === 'suspended') await ctx.resume();
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(VOLUME, t + 2.5);   /* slow fade in */
  }

  function soundOff(){
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 1.5);         /* slow fade out */
    suspendTimer = setTimeout(() => ctx.suspend(), 1700);    /* then sleep, saves battery */
  }

  /* ---- excitement: lingering on a piece quickens the hum ----
     Called by script.js. The breathing speeds up, wobbles harder,
     and the filter opens slightly — like current rising. Everything
     ramps smoothly, and it's a no-op if sound is off. */
  window.__hum = {
    excite(on){
      if(!ctx || !nodes || !playing) return;
      const t = ctx.currentTime;
      nodes.lfo.frequency.cancelScheduledValues(t);
      nodes.lfo.frequency.setValueAtTime(nodes.lfo.frequency.value, t);
      nodes.lfo.frequency.linearRampToValueAtTime(on ? .95 : .25, t + 1.4);
      nodes.lfoGain.gain.cancelScheduledValues(t);
      nodes.lfoGain.gain.setValueAtTime(nodes.lfoGain.gain.value, t);
      nodes.lfoGain.gain.linearRampToValueAtTime(on ? .16 : .09, t + 1.4);
      nodes.lowpass.frequency.cancelScheduledValues(t);
      nodes.lowpass.frequency.setValueAtTime(nodes.lowpass.frequency.value, t);
      nodes.lowpass.frequency.linearRampToValueAtTime(on ? 1500 : 900, t + 1.4);
    }
  };

  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'sound off' : 'sound on';
    toggle.setAttribute('aria-pressed', playing);
    toggle.classList.toggle('playing', playing);
    playing ? soundOn() : soundOff();
  });
})();
