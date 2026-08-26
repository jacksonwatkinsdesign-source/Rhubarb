// audio.js — chiptune pad engine + per-scene ambience, all synthesized.
//
// The music is an original arrangement written in the register of Aphex
// Twin's "Rhubarb": a very slow major-7th pad cycle, heavy detune, no
// percussion, long tails. See README for why it isn't a transcription.
(function (RB) {
  'use strict';

  var ctx = null, master = null, musicGain = null, ambGain = null;
  var started = false;
  var voices = [];
  var ambNodes = [];
  var timer = null;
  var step = 0;

  // --------------------------------------------------------------- helpers
  function n2f(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // A 12.5%/25% duty pulse via a periodic wave — this is the GB/GBA pulse
  // channel timbre, not a generic square.
  function pulseWave(duty, harmonics) {
    harmonics = harmonics || 24;
    var real = new Float32Array(harmonics + 1);
    var imag = new Float32Array(harmonics + 1);
    for (var i = 1; i <= harmonics; i++) {
      // Fourier series for a pulse train of the given duty cycle.
      imag[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  var waves = {};

  // ------------------------------------------------------------ chord cycle
  // Root motion sits in a slow, unresolved loop. Each chord is a set of MIDI
  // notes; the arrangement holds each for `hold` seconds.
  var PROG = [
    { notes: [45, 52, 57, 61, 64], hold: 8 },   // A  maj7-ish
    { notes: [43, 50, 55, 59, 62], hold: 8 },   // G  maj7
    { notes: [41, 48, 53, 57, 60], hold: 8 },   // F  maj7
    { notes: [40, 47, 52, 56, 59], hold: 8 }    // E  min-ish, hangs
  ];

  // A sparse melodic figure that drifts over the pad. Nulls are rests, which
  // is most of it — space is the point.
  var LEAD = [
    76, null, 74, null, 71, null, null, null,
    72, null, 71, null, 69, null, null, null,
    69, null, 67, null, 65, null, null, null,
    67, null, 64, null, null, null, null, null
  ];

  // ------------------------------------------------------------------ setup
  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.34;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.5;

    // One shared lowpass with a very slow LFO gives the whole mix the
    // tape-warble drift that the source material is built on.
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1750;
    lp.Q.value = 0.4;

    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    var lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 420;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    lfo.start();

    musicGain.connect(lp);
    lp.connect(master);
    ambGain.connect(master);

    waves.p50 = pulseWave(0.5);
    waves.p25 = pulseWave(0.25);
    waves.p12 = pulseWave(0.125);

    return true;
  }

  // ------------------------------------------------------------------ voice
  function pad(freq, at, dur, gain, wave, detune) {
    var o = ctx.createOscillator();
    o.setPeriodicWave(waves[wave || 'p25']);
    o.frequency.value = freq;
    o.detune.value = detune || 0;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    // Long attack, long release. Nothing in this piece has an edge.
    g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.35);
    g.gain.setValueAtTime(gain, at + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    o.connect(g);
    g.connect(musicGain);
    o.start(at);
    o.stop(at + dur + 0.1);
    voices.push(o);
    if (voices.length > 64) voices.splice(0, 32);
  }

  function bell(freq, at, dur, gain) {
    var o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(musicGain);
    o.start(at); o.stop(at + dur + 0.05);
  }

  // ---------------------------------------------------------------- sequencer
  // Schedules one chord ahead of time and re-arms itself. A setTimeout-driven
  // scheduler is fine here because nothing is rhythmic enough to expose jitter.
  function schedule() {
    var chord = PROG[step % PROG.length];
    var at = ctx.currentTime + 0.05;
    var dur = chord.hold;

    chord.notes.forEach(function (n, i) {
      var f = n2f(n);
      var g = i === 0 ? 0.09 : 0.05 - i * 0.005;
      // Two oscillators a few cents apart per note: the detune beating is
      // most of the warmth.
      pad(f, at, dur * 1.5, g, i < 2 ? 'p50' : 'p25', -7 + i);
      pad(f, at, dur * 1.5, g * 0.8, 'p12', +8 - i);
    });

    // Lead figure: four sparse slots per chord.
    for (var s = 0; s < 8; s++) {
      var idx = (step * 8 + s) % LEAD.length;
      var note = LEAD[idx];
      if (note === null) continue;
      bell(n2f(note), at + (dur / 8) * s, 2.6, 0.030);
    }

    step++;
    timer = setTimeout(schedule, dur * 1000);
  }

  // ---------------------------------------------------------------- ambience
  function noiseBuffer(secs) {
    var len = Math.floor(ctx.sampleRate * secs);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      // Brown-ish noise: closer to wind and cabin rumble than white.
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }
  var nb = null;

  function clearAmb() {
    ambNodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    ambNodes = [];
  }

  // Each scene gets a filtered noise bed with its own centre frequency and
  // level. It is a cheap effect that does an enormous amount of work: it is
  // the difference between "a picture of an airport" and "being in one".
  var BEDS = {
    night:  { freq: 340,  q: 0.7, gain: 0.055 },
    lobby:  { freq: 620,  q: 0.5, gain: 0.038 },
    hall:   { freq: 480,  q: 0.6, gain: 0.045 },
    gate:   { freq: 400,  q: 0.6, gain: 0.042 },
    bridge: { freq: 260,  q: 0.8, gain: 0.060 },
    cabin:  { freq: 200,  q: 0.9, gain: 0.105 },
    roll:   { freq: 150,  q: 1.1, gain: 0.190 },
    sky:    { freq: 180,  q: 0.9, gain: 0.080 },
    none:   { freq: 200,  q: 1,   gain: 0.0 }
  };

  var curBed = null;

  function setBed(name) {
    if (!ctx || curBed === name) return;
    curBed = name;
    clearAmb();
    var b = BEDS[name] || BEDS.none;
    if (b.gain <= 0) return;
    if (!nb) nb = noiseBuffer(4);

    var src = ctx.createBufferSource();
    src.buffer = nb;
    src.loop = true;

    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = b.freq;
    f.Q.value = b.q;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(b.gain, ctx.currentTime + 2.5);

    src.connect(f); f.connect(g); g.connect(ambGain);
    src.start();
    ambNodes.push(src);
  }

  // ------------------------------------------------------------------- sfx
  function blip(freq, dur, gain, wave) {
    if (!ctx) return;
    var at = ctx.currentTime;
    var o = ctx.createOscillator();
    o.setPeriodicWave(waves[wave || 'p50']);
    o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(master);
    o.start(at); o.stop(at + dur + 0.02);
  }

  RB.audio = {
    start: function () {
      if (started || !ensure()) return;
      started = true;
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 4.0);
      schedule();
    },
    bed: setBed,
    // Duck the music under a moment (used for the takeoff roll and the
    // sunrise, where the ambience should carry it).
    music: function (level, secs) {
      if (!ctx) return;
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), ctx.currentTime);
      musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), ctx.currentTime + (secs || 3));
    },
    ambLevel: function (level, secs) {
      if (!ctx) return;
      ambGain.gain.cancelScheduledValues(ctx.currentTime);
      ambGain.gain.setValueAtTime(Math.max(0.0001, ambGain.gain.value), ctx.currentTime);
      ambGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), ctx.currentTime + (secs || 3));
    },
    fadeOut: function (secs) {
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (secs || 5));
    },
    sfx: {
      // Soft UI tick for advancing dialogue.
      tick: function () { blip(880, 0.05, 0.022, 'p12'); },
      // Check-in / boarding-pass scan.
      scan: function () { blip(1320, 0.09, 0.035, 'p25'); setTimeout(function () { blip(1760, 0.12, 0.03, 'p25'); }, 90); },
      // Two-tone PA chime before an announcement.
      chime: function () {
        blip(1174, 0.9, 0.05, 'p50');
        setTimeout(function () { blip(880, 1.3, 0.05, 'p50'); }, 420);
      },
      door: function () { blip(160, 0.28, 0.05, 'p50'); },
      belt: function () { blip(1046, 0.16, 0.04, 'p25'); }
    },
    started: function () { return started; }
  };
})(window.RB = window.RB || {});
