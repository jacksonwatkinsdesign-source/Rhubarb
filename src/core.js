// core.js — 240x160 framebuffer, integer scaling, input, tweens, cutscenes.
(function (RB) {
  'use strict';

  RB.W = 240;   // GBA native
  RB.H = 160;

  // ---------------------------------------------------------------- palette
  // One cohesive ramp for the whole level. The level arcs from night at the
  // curb to sunrise above the clouds, so most of the drama is palette, not
  // geometry.
  RB.P = {
    black:   '#0b0d14',
    night0:  '#141a2c',
    night1:  '#1d2740',
    night2:  '#2a3757',
    night3:  '#3b4d72',
    steel0:  '#4a5c7d',
    steel1:  '#66789a',
    steel2:  '#8a9bb8',
    steel3:  '#b3c0d4',
    white:   '#e8edf4',
    warm0:   '#3a3038',
    warm1:   '#5c4a4a',
    warm2:   '#8a6f5e',
    warm3:   '#b89476',
    warm4:   '#dcbb92',
    cream:   '#f2e3c6',
    amber:   '#e8a054',
    gold:    '#f0c060',
    orange:  '#e08850',
    rose:    '#d4718a',
    violet:  '#7a5c96',
    teal:    '#4e8f8a',
    green:   '#5f8f5a',
    red:     '#b8524e',
    skin0:   '#c99a72',
    skin1:   '#a67450',
    navy:    '#22304e'
  };

  // ---------------------------------------------------------------- canvas
  var buffer = document.createElement('canvas');
  buffer.width = RB.W;
  buffer.height = RB.H;
  RB.buffer = buffer;
  RB.ctx = buffer.getContext('2d');
  RB.ctx.imageSmoothingEnabled = false;

  var screen, sctx, scale = 1, offX = 0, offY = 0;

  RB.attach = function (canvas) {
    screen = canvas;
    sctx = screen.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    resize();
    window.addEventListener('resize', resize);
  };

  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    screen.width = vw;
    screen.height = vh;
    // Integer scale only — a fractional scale on a 240x160 buffer produces
    // uneven pixel sizes, which is the single most common way a pixel game
    // gives itself away as not really being one.
    scale = Math.max(1, Math.floor(Math.min(vw / RB.W, vh / RB.H)));
    offX = Math.floor((vw - RB.W * scale) / 2);
    offY = Math.floor((vh - RB.H * scale) / 2);
    sctx.imageSmoothingEnabled = false;
  }
  RB.resize = resize;

  RB.present = function () {
    sctx.imageSmoothingEnabled = false;
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, screen.width, screen.height);
    sctx.drawImage(buffer, 0, 0, RB.W, RB.H, offX, offY, RB.W * scale, RB.H * scale);
  };

  // ------------------------------------------------------------ draw helpers
  RB.clear = function (c) {
    RB.ctx.fillStyle = c || RB.P.black;
    RB.ctx.fillRect(0, 0, RB.W, RB.H);
  };

  RB.rect = function (x, y, w, h, c) {
    RB.ctx.fillStyle = c;
    RB.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // World-space rect (camera applied).
  RB.wrect = function (x, y, w, h, c) {
    RB.rect(x - RB.cam.x, y - RB.cam.y, w, h, c);
  };

  RB.hline = function (x, y, w, c) { RB.rect(x, y, w, 1, c); };
  RB.vline = function (x, y, h, c) { RB.rect(x, y, 1, h, c); };

  // A vertical gradient quantized to `steps` bands. Real 16-bit hardware
  // couldn't do smooth gradients, and banding is a large part of why the
  // sky in an SNES game looks the way it does.
  RB.vgrad = function (x, y, w, h, colors, steps) {
    steps = steps || colors.length;
    var bandH = h / steps;
    for (var i = 0; i < steps; i++) {
      var t = steps === 1 ? 0 : i / (steps - 1);
      RB.rect(x, y + i * bandH, w, Math.ceil(bandH) + 1, RB.mixRamp(colors, t));
    }
  };

  // ------------------------------------------------------------------ color
  // Accepts #rgb and #rrggbb. Shorthand matters: an unhandled '#000' yields
  // NaN channels, rgb2hex emits an unparseable string, and canvas silently
  // keeps whatever fillStyle was set last — which looks like random colours
  // appearing in unrelated art.
  function hex2rgb(h) {
    if (h.length === 4) {
      return [parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), parseInt(h[3] + h[3], 16)];
    }
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      if (!isFinite(v)) v = 0;
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? '0' + s : s;
    }).join('');
  }
  RB.hex2rgb = hex2rgb;
  RB.rgb2hex = rgb2hex;

  RB.mix = function (a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };

  // Sample a multi-stop ramp at t in [0,1].
  RB.mixRamp = function (colors, t) {
    if (colors.length === 1) return colors[0];
    t = Math.max(0, Math.min(1, t));
    var f = t * (colors.length - 1);
    var i = Math.min(colors.length - 2, Math.floor(f));
    return RB.mix(colors[i], colors[i + 1], f - i);
  };

  RB.shade = function (c, amt) {
    var C = hex2rgb(c);
    if (amt >= 0) return rgb2hex(C[0] + (255 - C[0]) * amt, C[1] + (255 - C[1]) * amt, C[2] + (255 - C[2]) * amt);
    return rgb2hex(C[0] * (1 + amt), C[1] * (1 + amt), C[2] * (1 + amt));
  };

  // ------------------------------------------------------------------ input
  var keys = {}, prev = {};
  var MAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'action', Enter: 'action', Space: 'action', KeyE: 'action',
    KeyX: 'cancel', Escape: 'cancel',
    ShiftLeft: 'slow', ShiftRight: 'slow'
  };

  RB.input = {
    left: false, right: false, up: false, down: false,
    action: false, cancel: false, slow: false,
    pressed: function (n) { return this[n] && !prev[n]; },
    anyPressed: function () {
      return this.pressed('action') || this.pressed('cancel') ||
             this.pressed('left') || this.pressed('right') ||
             this.pressed('up') || this.pressed('down');
    },
    latch: function () {
      for (var k in MAP) prev[MAP[k]] = this[MAP[k]];
    }
  };

  window.addEventListener('keydown', function (e) {
    var a = MAP[e.code];
    if (a) { keys[a] = true; RB.input[a] = true; e.preventDefault(); }
    if (RB.onFirstInput) { RB.onFirstInput(); RB.onFirstInput = null; }
  });
  window.addEventListener('keyup', function (e) {
    var a = MAP[e.code];
    if (a) { keys[a] = false; RB.input[a] = false; e.preventDefault(); }
  });
  window.addEventListener('blur', function () {
    for (var k in keys) { keys[k] = false; RB.input[k] = false; }
  });

  // Touch: left half = walk toward tap, right half = action. Enough to play
  // it on a phone without building a whole virtual pad.
  RB.bindTouch = function (el) {
    function set(on, e) {
      if (RB.onFirstInput) { RB.onFirstInput(); RB.onFirstInput = null; }
      var t = e.changedTouches ? e.changedTouches[0] : e;
      var r = el.getBoundingClientRect();
      var nx = (t.clientX - r.left) / r.width, ny = (t.clientY - r.top) / r.height;
      RB.input.left = RB.input.right = RB.input.up = RB.input.down = RB.input.action = false;
      if (!on) return;
      if (nx > 0.72) { RB.input.action = true; return; }
      var dx = nx - 0.5, dy = ny - 0.5;
      if (Math.abs(dx) > 0.06) RB.input[dx < 0 ? 'left' : 'right'] = true;
      if (Math.abs(dy) > 0.06) RB.input[dy < 0 ? 'up' : 'down'] = true;
    }
    el.addEventListener('touchstart', function (e) { set(true, e); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchmove', function (e) { set(true, e); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend', function (e) { set(false, e); e.preventDefault(); }, { passive: false });
  };

  // ----------------------------------------------------------------- camera
  RB.cam = { x: 0, y: 0 };

  // ------------------------------------------------------------------ easing
  RB.ease = {
    linear: function (t) { return t; },
    inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    in: function (t) { return t * t * t; },
    outSine: function (t) { return Math.sin((t * Math.PI) / 2); },
    inSine: function (t) { return 1 - Math.cos((t * Math.PI) / 2); }
  };

  RB.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  RB.lerp = function (a, b, t) { return a + (b - a) * t; };

  // ---------------------------------------------------------------- tasks
  // Tiny task objects consumed by the generator-based cutscene runner. Each
  // has update(dt) -> true when finished.
  RB.wait = function (secs) {
    var t = 0;
    return { update: function (dt) { t += dt; return t >= secs; } };
  };

  RB.waitFor = function (fn) {
    return { update: function () { return !!fn(); } };
  };

  RB.tween = function (obj, prop, to, dur, easing) {
    var from = null, t = 0, ez = RB.ease[easing || 'inOut'];
    return {
      update: function (dt) {
        if (from === null) from = obj[prop];
        t += dt;
        var k = dur <= 0 ? 1 : RB.clamp(t / dur, 0, 1);
        obj[prop] = from + (to - from) * ez(k);
        return k >= 1;
      }
    };
  };

  RB.tweenAll = function (list) {
    return {
      update: function (dt) {
        var done = true;
        for (var i = 0; i < list.length; i++) if (!list[i].update(dt)) done = false;
        return done;
      }
    };
  };

  RB.call = function (fn) {
    return { update: function () { fn(); return true; } };
  };

  // Run a generator as a cutscene. Yield task objects; the runner steps them.
  // This is what keeps scripted beats (the van, the jetbridge, the takeoff
  // roll) readable instead of a pile of timer flags.
  function Script(genFn) {
    this.it = genFn();
    this.cur = null;
    this.done = false;
    this.step();
  }
  Script.prototype.step = function () {
    var n = this.it.next();
    if (n.done) { this.done = true; this.cur = null; }
    else this.cur = n.value;
  };
  Script.prototype.update = function (dt) {
    if (this.done) return true;
    // Drain zero-duration tasks in the same frame so RB.call chains don't
    // each cost a frame.
    var guard = 0;
    while (this.cur && this.cur.update(dt) && guard++ < 64) this.step();
    return this.done;
  };
  RB.Script = Script;

})(window.RB = window.RB || {});
