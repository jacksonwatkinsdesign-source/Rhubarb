// world.js — scene framework, dialogue, transitions, and the drawing
// vocabulary for airport interiors.
(function (RB) {
  'use strict';

  var P = RB.P;

  // ================================================================ scenes
  RB.scenes = {};
  RB.scene = null;
  RB.state = {};            // carries across scenes (has your bag, seat, etc.)

  var fade = { v: 1, color: P.black };
  RB.fade = fade;
  var pendingScene = null;

  RB.go = function (id, opts) {
    pendingScene = { id: id, opts: opts || {} };
  };

  RB.enterScene = function (id, opts) {
    var s = RB.scenes[id];
    if (!s) throw new Error('no scene: ' + id);
    RB.scene = s;
    RB.cam.x = 0; RB.cam.y = 0;
    RB.dialog.clear();
    RB.caption.clear();
    s.time = 0;
    if (s.enter) s.enter(opts || {});
  };

  // Cross-scene transition: fade to black, swap, fade back up. Every scene
  // change in the level goes through this, which is what makes the whole
  // thing feel like one continuous journey rather than a set of levels.
  var transition = null;
  RB.updateTransition = function (dt) {
    if (pendingScene && !transition) {
      transition = { phase: 'out', t: 0, dur: opDur(pendingScene.opts), target: pendingScene };
      pendingScene = null;
    }
    if (!transition) {
      fade.v = Math.max(0, fade.v - dt / 1.2);
      return;
    }
    transition.t += dt;
    var k = RB.clamp(transition.t / transition.dur, 0, 1);
    if (transition.phase === 'out') {
      fade.v = k;
      if (k >= 1) {
        RB.enterScene(transition.target.id, transition.target.opts);
        transition = { phase: 'in', t: 0, dur: transition.dur, target: null };
      }
    } else {
      fade.v = 1 - k;
      if (k >= 1) { fade.v = 0; transition = null; }
    }
  };
  function opDur(o) { return o && o.fade !== undefined ? o.fade : 1.1; }
  RB.transitioning = function () { return !!transition; };

  RB.drawFade = function () {
    if (fade.v <= 0.001) return;
    RB.ctx.fillStyle = fade.color;
    RB.ctx.globalAlpha = RB.clamp(fade.v, 0, 1);
    RB.ctx.fillRect(0, 0, RB.W, RB.H);
    RB.ctx.globalAlpha = 1;
  };

  // ============================================================== dialogue
  // A boxed, typewritten line at the bottom. Used sparingly — most of this
  // level says nothing at all.
  var dlg = { lines: [], idx: 0, chars: 0, active: false, speaker: null, done: false, top: false };

  RB.dialog = {
    clear: function () { dlg.active = false; dlg.lines = []; dlg.idx = 0; dlg.chars = 0; },
    active: function () { return dlg.active; },
    update: function (dt) {
      if (!dlg.active) return;
      var full = dlg.lines[dlg.idx] || '';
      if (dlg.chars < full.length) {
        dlg.chars += dt * 42;
        if (RB.input.pressed('action')) dlg.chars = full.length; // skip typing
      } else if (RB.input.pressed('action')) {
        RB.audio.sfx.tick();
        dlg.idx++;
        dlg.chars = 0;
        if (dlg.idx >= dlg.lines.length) { dlg.active = false; dlg.done = true; }
      }
    },
    draw: function () {
      if (!dlg.active) return;
      // Anchored to the top when the scene's action sits low in frame.
      var boxH = 42, boxY = dlg.top ? 5 : RB.H - 46;
      // Panel
      RB.rect(6, boxY, RB.W - 12, boxH, 'rgba(11,13,20,0.90)');
      RB.rect(6, boxY, RB.W - 12, 1, P.steel1);
      RB.rect(6, boxY + boxH - 1, RB.W - 12, 1, P.steel1);
      RB.rect(6, boxY, 1, boxH, P.steel1);
      RB.rect(RB.W - 7, boxY, 1, boxH, P.steel1);

      var full = dlg.lines[dlg.idx] || '';
      var shown = full.slice(0, Math.floor(dlg.chars));
      var wrapped = RB.font.wrap(shown, RB.W - 28);
      var ty = boxY + 8;
      if (dlg.speaker) {
        RB.font.draw(dlg.speaker, 13, ty, P.amber);
        ty += 10;
      }
      for (var i = 0; i < Math.min(wrapped.length, 3); i++) {
        RB.font.draw(wrapped[i], 13, ty + i * 10, P.cream);
      }
      // Blinking advance arrow once the line is fully typed.
      if (dlg.chars >= full.length && Math.floor(RB.now * 2) % 2 === 0) {
        RB.font.draw('>', RB.W - 18, boxY + boxH - 12, P.steel2);
      }
    }
  };

  // Yieldable: pauses a cutscene until the player has read the lines.
  RB.say = function (lines, speaker, opts) {
    if (typeof lines === 'string') lines = [lines];
    opts = opts || {};
    return {
      started: false,
      update: function () {
        if (!this.started) {
          dlg.lines = lines; dlg.idx = 0; dlg.chars = 0;
          dlg.active = true; dlg.done = false; dlg.speaker = speaker || null;
          dlg.top = !!opts.top;
          this.started = true;
          return false;
        }
        return !dlg.active;
      }
    };
  };

  // =============================================================== chooser
  // A two-option question in the dialogue box. Up/down (or the d-pad) moves
  // the cursor, the action key confirms. Used exactly once, for the coffee.
  var chz = { active: false, prompt: '', speaker: null, options: [], i: 0, result: -1 };

  RB.chooser = {
    active: function () { return chz.active; },
    update: function () {
      if (!chz.active) return;
      if (RB.input.pressed('up')) { chz.i = (chz.i + chz.options.length - 1) % chz.options.length; RB.audio.sfx.tick(); }
      if (RB.input.pressed('down')) { chz.i = (chz.i + 1) % chz.options.length; RB.audio.sfx.tick(); }
      if (RB.input.pressed('action')) {
        chz.result = chz.i;
        chz.active = false;
        RB.audio.sfx.tick();
      }
    },
    draw: function () {
      if (!chz.active) return;
      // Height derived from exactly what gets drawn below, or the last
      // option slides off the bottom of the screen.
      var boxH = 12 + (chz.speaker ? 10 : 0) + 12 + chz.options.length * 11;
      var boxY = RB.H - boxH - 5;
      RB.rect(6, boxY, RB.W - 12, boxH, 'rgba(11,13,20,0.92)');
      RB.rect(6, boxY, RB.W - 12, 1, P.steel1);
      RB.rect(6, boxY + boxH - 1, RB.W - 12, 1, P.steel1);
      RB.rect(6, boxY, 1, boxH, P.steel1);
      RB.rect(RB.W - 7, boxY, 1, boxH, P.steel1);

      var ty = boxY + 6;
      if (chz.speaker) { RB.font.draw(chz.speaker, 13, ty, P.amber); ty += 10; }
      RB.font.draw(chz.prompt, 13, ty, P.cream);
      ty += 12;
      for (var i = 0; i < chz.options.length; i++) {
        var on = i === chz.i;
        if (on) RB.font.draw('>', 16, ty + i * 11, P.amber);
        RB.font.draw(chz.options[i], 26, ty + i * 11, on ? P.cream : P.steel2);
      }
    }
  };

  // Yieldable. The generator receives the chosen index.
  RB.choose = function (prompt, speaker, options) {
    var task = {
      started: false,
      result: -1,
      update: function () {
        if (!this.started) {
          chz.prompt = prompt; chz.speaker = speaker || null;
          chz.options = options; chz.i = 0; chz.result = -1;
          chz.active = true;
          this.started = true;
          return false;
        }
        if (chz.active) return false;
        this.result = chz.result;
        return true;
      }
    };
    return task;
  };

  // ============================================================== captions
  // Unboxed centred text that fades in and out on its own. This is the voice
  // the ambient beats use — no border, no prompt, nothing to press.
  var cap = { text: '', t: 0, dur: 0, alpha: 0, y: 0 };
  RB.caption = {
    clear: function () { cap.text = ''; cap.t = 0; cap.dur = 0; cap.alpha = 0; },
    update: function (dt) {
      if (!cap.text) return;
      cap.t += dt;
      var fin = 1.0, fout = 1.4;
      if (cap.t < fin) cap.alpha = cap.t / fin;
      else if (cap.t > cap.dur - fout) cap.alpha = Math.max(0, (cap.dur - cap.t) / fout);
      else cap.alpha = 1;
      if (cap.t >= cap.dur) cap.text = '';
    },
    draw: function () {
      if (!cap.text || cap.alpha <= 0.01) return;
      var lines = RB.font.wrap(cap.text, 190);
      // A plate behind the words. Captions land over skies, tarmac and lit
      // windows, and a drop shadow alone is not enough to hold them.
      var wMax = 0;
      for (var i = 0; i < lines.length; i++) wMax = Math.max(wMax, RB.font.width(lines[i]));
      var bw = wMax + 14, bh = lines.length * 11 + 7;
      var bx = Math.round((RB.W - bw) / 2), by = Math.round(cap.y - 5);
      RB.ctx.globalAlpha = cap.alpha * 0.82;
      RB.rect(bx, by, bw, bh, '#0b0d14');
      RB.ctx.globalAlpha = cap.alpha * 0.5;
      RB.rect(bx, by, bw, 1, P.steel1);
      RB.rect(bx, by + bh - 1, bw, 1, P.steel1);
      RB.ctx.globalAlpha = cap.alpha;
      for (var j = 0; j < lines.length; j++) {
        RB.font.drawCentered(lines[j], RB.W / 2, cap.y + j * 11, P.cream, { shadow: 'rgba(0,0,0,0.75)' });
      }
      RB.ctx.globalAlpha = 1;
    },
    show: function (text, dur, y) {
      cap.text = text; cap.t = 0; cap.dur = dur || 5; cap.y = y === undefined ? RB.H - 34 : y;
    }
  };

  // Yieldable caption that blocks for its full duration.
  RB.captionFor = function (text, dur, y) {
    var started = false, t = 0;
    return {
      update: function (dt) {
        if (!started) { RB.caption.show(text, dur, y); started = true; }
        t += dt;
        return t >= dur;
      }
    };
  };

  // ================================================================ prompt
  // The little "Z" pip that floats over an interactive thing. It is the only
  // HUD in the game.
  RB.drawPrompt = function (wx, wy, label) {
    var x = Math.round(wx - RB.cam.x), y = Math.round(wy - RB.cam.y);
    var bob = Math.sin(RB.now * 3) * 1.2;
    y += Math.round(bob);
    var text = label || 'Z';
    var w = RB.font.width(text) + 7;
    RB.rect(x - w / 2, y, w, 11, 'rgba(11,13,20,0.85)');
    RB.rect(x - w / 2, y, w, 1, P.amber);
    RB.rect(x - w / 2, y + 10, w, 1, P.amber);
    RB.rect(x - w / 2, y, 1, 11, P.amber);
    RB.rect(x + w / 2 - 1, y, 1, 11, P.amber);
    RB.font.drawCentered(text, x, y + 2, P.cream);
  };

  // ============================================================ collision
  RB.solidAt = function (solids, x, y, w, h) {
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return s;
    }
    return null;
  };

  // Move an actor with axis-separated collision so sliding along a wall
  // feels right instead of sticking.
  RB.moveActor = function (a, dx, dy, solids, bounds) {
    var W = 8, H = 6, ox = 2, oy = 12;   // feet-box, not sprite-box
    var nx = a.x + dx;
    if (!RB.solidAt(solids, nx + ox, a.y + oy, W, H)) a.x = nx;
    var ny = a.y + dy;
    if (!RB.solidAt(solids, a.x + ox, ny + oy, W, H)) a.y = ny;
    if (bounds) {
      a.x = RB.clamp(a.x, bounds.x0, bounds.x1);
      a.y = RB.clamp(a.y, bounds.y0, bounds.y1);
    }
  };

  // Standard player movement + facing. Returns true if the player moved.
  RB.walk = function (a, dt, solids, bounds) {
    var dx = 0, dy = 0;
    if (RB.input.left) dx -= 1;
    if (RB.input.right) dx += 1;
    if (RB.input.up) dy -= 1;
    if (RB.input.down) dy += 1;
    var moving = dx !== 0 || dy !== 0;
    if (moving) {
      var len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      // Hold Shift to stroll. Deliberately the *slow* modifier rather than a
      // run button — hurrying is the one thing this game does not want.
      var sp = a.speed * (RB.input.slow ? 0.45 : 1);
      RB.moveActor(a, dx * sp * dt, dy * sp * dt, solids, bounds);
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx < 0 ? 'left' : 'right';
      else a.dir = dy < 0 ? 'up' : 'down';
    }
    a.moving = moving;
    a.update(dt);
    return moving;
  };

  // Camera eased toward a target x, clamped to the room. Easing rather than
  // snapping keeps long walks from feeling mechanical.
  RB.camFollow = function (targetX, roomW, dt, lead) {
    var want = RB.clamp(targetX - RB.W / 2 + (lead || 0), 0, Math.max(0, roomW - RB.W));
    RB.cam.x += (want - RB.cam.x) * Math.min(1, dt * 3.5);
    if (Math.abs(RB.cam.x - want) < 0.3) RB.cam.x = want;
  };

  // ======================================================== airport pieces
  var A = {};
  RB.art = A;

  // --- Floor: banded tiles with a subtle sheen row. Airport floors are
  // polished, and the specular streak is what reads as "terminal".
  A.floor = function (x0, w, yTop, yBot, base, seam, sheen) {
    RB.wrect(x0, yTop, w, yBot - yTop, base);
    var tile = 24;
    var start = Math.floor(x0 / tile) * tile;
    for (var x = start; x < x0 + w; x += tile) {
      RB.wrect(x, yTop, 1, yBot - yTop, seam);
    }
    for (var y = yTop + 10; y < yBot; y += 14) {
      RB.wrect(x0, y, w, 1, seam);
    }
    if (sheen) {
      RB.ctx.globalAlpha = 0.10;
      RB.wrect(x0, yTop + 4, w, 3, sheen);
      RB.ctx.globalAlpha = 0.06;
      RB.wrect(x0, yTop + 12, w, 2, sheen);
      RB.ctx.globalAlpha = 1;
    }
  };

  // --- Ceiling with recessed light strips.
  A.ceiling = function (x0, w, h, base, strip) {
    RB.wrect(x0, 0, w, h, base);
    RB.wrect(x0, h - 1, w, 1, RB.shade(base, -0.3));
    var pitch = 56;
    var start = Math.floor(x0 / pitch) * pitch;
    for (var x = start; x < x0 + w; x += pitch) {
      RB.wrect(x + 10, h - 6, 30, 3, strip);
      RB.ctx.globalAlpha = 0.16;
      RB.wrect(x + 6, h - 3, 38, 6, strip);
      RB.ctx.globalAlpha = 1;
    }
  };

  // --- Glass curtain wall. `viewFn(x0,w,y,h)` paints whatever is beyond.
  A.glassWall = function (x0, w, y, h, viewFn, mullion) {
    RB.ctx.save();
    RB.ctx.beginPath();
    RB.ctx.rect(x0 - RB.cam.x, y, w, h);
    RB.ctx.clip();
    viewFn(x0, w, y, h);
    RB.ctx.restore();
    // Mullions on top of the view.
    var pitch = 32;
    var start = Math.floor(x0 / pitch) * pitch;
    for (var x = start; x < x0 + w; x += pitch) {
      RB.wrect(x, y, 2, h, mullion);
    }
    RB.wrect(x0, y, w, 2, mullion);
    RB.wrect(x0, y + h - 2, w, 2, mullion);
    // Glass reflection: two soft diagonal bands.
    RB.ctx.globalAlpha = 0.035;
    for (var i = 0; i < 2; i++) {
      var bx = x0 + 40 + i * 150;
      for (var yy = 0; yy < h; yy++) {
        RB.wrect(bx + yy * 0.6, y + yy, 6, 1, P.white);
      }
    }
    RB.ctx.globalAlpha = 1;
  };

  // --- A concourse wall. Flat colour over 45px of screen reads as a slab,
  // so the wall is built from four things instead: panel seams, an accent
  // stripe, a darker lower section, and warm pools under the ceiling lights.
  A.hall = function (x0, w, ceilY, wallBottom, floorY, wall, light, lightAmt) {
    RB.wrect(x0, ceilY, w, floorY - ceilY, wall);
    RB.wrect(x0, ceilY, w, 1, RB.shade(wall, 0.22));

    var pitch = 40;
    for (var x = Math.floor(x0 / pitch) * pitch; x < x0 + w; x += pitch) {
      RB.wrect(x, ceilY, 1, wallBottom - ceilY, RB.shade(wall, -0.18));
      RB.wrect(x + 1, ceilY, 1, wallBottom - ceilY, RB.shade(wall, 0.09));
    }

    RB.wrect(x0, wallBottom - 22, w, 2, RB.shade(wall, -0.32));
    RB.wrect(x0, wallBottom - 20, w, 1, RB.shade(wall, 0.16));

    RB.wrect(x0, wallBottom, w, floorY - wallBottom, RB.shade(wall, -0.24));
    RB.wrect(x0, wallBottom, w, 1, RB.shade(wall, -0.42));
    RB.wrect(x0, floorY - 3, w, 3, RB.shade(wall, -0.46));

    RB.ctx.globalAlpha = lightAmt;
    for (var lx = Math.floor(x0 / 56) * 56; lx < x0 + w; lx += 56) {
      RB.wrect(lx + 4, ceilY, 44, floorY - ceilY, light);
    }
    RB.ctx.globalAlpha = 1;
  };

  // --- An opening through to the next hall, with light spilling out of it.
  A.doorway = function (x, top, bottom, frame, glow) {
    RB.wrect(x, top, 4, bottom - top, frame);
    RB.wrect(x + 26, top, 4, bottom - top, frame);
    RB.wrect(x, top, 30, 5, frame);
    RB.wrect(x, top, 30, 1, RB.shade(frame, 0.3));
    RB.ctx.globalAlpha = glow;
    RB.wrect(x + 4, top + 5, 22, (bottom - top) + 52, P.white);
    RB.ctx.globalAlpha = glow * 0.5;
    RB.wrect(x - 4, top + 5, 38, (bottom - top) + 52, P.white);
    RB.ctx.globalAlpha = 1;
  };

  // --- A row of gate seating, seen 3/4 from the front.
  A.seatRow = function (x, y, n, frame, cushion) {
    for (var i = 0; i < n; i++) {
      var sx = x + i * 16;
      RB.wrect(sx + 1, y - 10, 14, 11, cushion);            // back
      RB.wrect(sx + 1, y - 10, 14, 1, RB.shade(cushion, 0.2));
      RB.wrect(sx, y + 1, 16, 5, RB.shade(cushion, -0.15)); // seat
      RB.wrect(sx, y + 6, 16, 1, frame);
      RB.wrect(sx + 2, y + 7, 2, 5, frame);                 // legs
      RB.wrect(sx + 12, y + 7, 2, 5, frame);
      RB.wrect(sx, y - 10, 1, 17, RB.shade(cushion, -0.4)); // divider
    }
    RB.wrect(x, y + 6, n * 16, 1, RB.shade(frame, -0.3));
  };

  // --- Check-in / bag drop counter.
  A.counter = function (x, y, w, top, body) {
    RB.wrect(x, y - 16, w, 16, body);
    RB.wrect(x, y - 16, w, 1, RB.shade(body, 0.16));
    for (var i = 10; i < w; i += 30) RB.wrect(x + i, y - 15, 1, 14, RB.shade(body, -0.22));
    // Worktop, overhanging slightly, with a lit front edge.
    RB.wrect(x - 1, y - 20, w + 2, 4, top);
    RB.wrect(x - 1, y - 20, w + 2, 1, RB.shade(top, 0.35));
    RB.wrect(x - 1, y - 17, w + 2, 1, RB.shade(top, -0.35));
    RB.wrect(x, y - 1, w, 2, RB.shade(body, -0.45));
  };

  // --- Backlit hanging sign.
  A.sign = function (x, y, text, w, bg, fg) {
    w = w || RB.font.width(text) + 12;
    RB.wrect(x + w / 2 - 1, y - 8, 2, 8, P.steel0);   // hanger
    RB.wrect(x, y, w, 14, bg || P.navy);
    RB.wrect(x, y, w, 1, RB.shade(bg || P.navy, 0.35));
    RB.wrect(x, y + 13, w, 1, P.black);
    RB.font.draw(text, Math.round(x - RB.cam.x + 6), y + 4, fg || P.cream);
    RB.ctx.globalAlpha = 0.09;
    RB.wrect(x - 2, y + 14, w + 4, 4, fg || P.cream);
    RB.ctx.globalAlpha = 1;
  };

  // --- Departure board: a column of amber rows. Deliberately unreadable
  // detail at this resolution — it's texture, not information.
  A.board = function (x, y, w, h, rows) {
    RB.wrect(x, y, w, h, '#0a0e08');
    RB.wrect(x, y, w, 1, P.steel0);
    RB.wrect(x, y + h - 1, w, 1, P.black);
    for (var i = 0; i < rows; i++) {
      var ry = y + 4 + i * 7;
      if (ry > y + h - 6) break;
      var seed = (i * 37 + Math.floor(RB.now * 0.4)) % 5;
      RB.wrect(x + 4, ry, 14 + seed * 2, 3, P.amber);
      RB.wrect(x + 26, ry, 30 - seed * 3, 3, RB.shade(P.amber, -0.35));
      RB.wrect(x + w - 22, ry, 16, 3, seed === 2 ? P.green : RB.shade(P.amber, -0.5));
    }
  };

  // --- Rope-and-post queue line.
  A.queueLine = function (x, y, n, dx) {
    for (var i = 0; i < n; i++) {
      var px = x + i * dx;
      RB.wrect(px, y, 2, 12, P.steel0);
      RB.wrect(px - 1, y + 11, 4, 2, RB.shade(P.steel0, -0.4));
      if (i < n - 1) RB.wrect(px + 2, y + 2, dx - 2, 1, P.red);
    }
  };

  // --- Potted plant / pillar clutter to break long sightlines.
  A.pillar = function (x, y, h, c) {
    RB.wrect(x, y - h, 10, h, c);
    RB.wrect(x, y - h, 2, h, RB.shade(c, 0.18));
    RB.wrect(x + 8, y - h, 2, h, RB.shade(c, -0.25));
    RB.wrect(x - 2, y - 2, 14, 3, RB.shade(c, -0.35));
  };

  A.plant = function (x, y) {
    var g = '#4f7a4c', gd = '#3a5c39', gl = '#659463';
    // Broad leaves fanning out and drooping, drawn back to front.
    var leaves = [[-6, -9, 5, 3], [5, -9, 5, 3], [-7, -13, 4, 4], [6, -13, 4, 4],
                  [-4, -17, 4, 5], [3, -17, 4, 5], [-1, -20, 3, 6]];
    for (var i = 0; i < leaves.length; i++) {
      var L = leaves[i], c = i % 3 === 0 ? gd : (i % 3 === 1 ? g : gl);
      RB.wrect(x + 4 + L[0], y + L[1], L[2], L[3], c);
      RB.wrect(x + 4 + L[0], y + L[1], L[2], 1, RB.shade(c, 0.2));
    }
    RB.wrect(x + 3, y - 12, 2, 8, gd);
    // Pot
    RB.wrect(x, y - 5, 11, 6, '#7a5744');
    RB.wrect(x, y - 5, 11, 1, '#96705a');
    RB.wrect(x - 1, y - 6, 13, 2, '#8a6450');
    RB.wrect(x, y, 11, 1, '#4a352a');
  };

  // ============================================================ sky / outside
  // Named sky states the level moves through. Each is a vertical ramp; the
  // whole dawn arc is just interpolation between these.
  A.SKY = {
    night:   ['#080b16', '#0e1428', '#182240', '#232f52'],
    predawn: ['#0d1226', '#182248', '#31356a', '#4a3f70'],
    civil:   ['#141d3e', '#2a2f62', '#54427c', '#8a5a78'],
    dawn:    ['#1d2a52', '#3d3a72', '#8a5a80', '#d8836f'],
    sunrise: ['#2a3f74', '#5a5590', '#b0708a', '#f0a868'],
    day:     ['#3a63a8', '#5d86c4', '#8fb0dc', '#c8dcf0']
  };

  A.skyRamp = function (state) { return A.SKY[state] || A.SKY.night; };

  // Blend two sky states — used to drift the sky continuously across the
  // gate wait rather than snapping between them.
  A.skyMix = function (a, b, t) {
    var A1 = A.skyRamp(a), B1 = A.skyRamp(b), out = [];
    for (var i = 0; i < A1.length; i++) out.push(RB.mix(A1[i], B1[i], t));
    return out;
  };

  // Deterministic star field — same stars every run, fading as dawn comes.
  var STARS = [];
  (function () {
    var seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < 70; i++) {
      STARS.push({
        x: rnd(), y: rnd() * 0.55, b: 0.3 + rnd() * 0.7,
        sp: 0.5 + rnd() * 2.6,     // its own twinkle rate
        ph: rnd() * 6.283          // ...and its own phase, so they don't pulse together
      });
    }
  })();

  // Screen-space. Parallax is applied internally and wrapped, so stars drift
  // very slightly as the camera pans without ever leaving the band.
  A.stars = function (sx, w, y, h, alpha) {
    if (alpha <= 0.01) return;
    var par = (RB.cam.x * 0.06) % w;
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i];
      // Raising the sine to a power makes each star sit dim most of the time
      // and flare briefly, which reads as sparkle rather than as a pulse.
      var wave = (Math.sin(RB.now * s.sp + s.ph) + 1) / 2;
      var tw = 0.30 + 0.70 * Math.pow(wave, 2.4);
      var px = sx + ((s.x * w - par) % w + w) % w;
      var py = y + s.y * h;
      RB.ctx.globalAlpha = alpha * s.b * tw;
      RB.rect(px, py, 1, 1, P.white);
      // At the peak of a flare the brightest stars throw a one-pixel cross.
      if (tw > 0.93 && s.b > 0.72) {
        RB.ctx.globalAlpha = alpha * s.b * (tw - 0.93) * 7;
        RB.rect(px - 1, py, 1, 1, P.white);
        RB.rect(px + 1, py, 1, 1, P.white);
        RB.rect(px, py - 1, 1, 1, P.white);
        RB.rect(px, py + 1, 1, 1, P.white);
      }
    }
    RB.ctx.globalAlpha = 1;
  };

  // Distant airport lights along a horizon — the thing that makes a flat
  // band of tarmac read as somewhere enormous.
  // Screen-space, same wrapping treatment as the stars.
  A.horizonLights = function (sx, w, y, alpha) {
    RB.ctx.globalAlpha = alpha;
    var par = (RB.cam.x * 0.18) % w;
    for (var i = 0; i < 40; i++) {
      var c = i % 7 === 0 ? P.amber : i % 5 === 0 ? P.red : P.warm4;
      var px = sx + (((i * 137) % w - par) % w + w) % w;
      RB.rect(px, y - (i % 3), 1, 1, c);
    }
    RB.ctx.globalAlpha = 1;
  };

  RB.cupPal = {
    t: '#241c28',
    l: '#2b2430', L: '#4c4254',
    c: '#e8e2d4', C: '#b2aa9c', H: '#f8f4ea',
    s: '#a87848', S: '#7a5430', B: '#c89660'
  };

  // A cup at rest with steam curling off it. Three wisps on different
  // phases, drifting up and sideways and fading as they rise.
  // x,y is where the cup STANDS — its base — so callers position it on the
  // ledge rather than guessing at a top-left corner.
  RB.sillCup = function (x, y, t) {
    var h = RB.sprites.bigcup.length;
    RB.drawSprite(RB.sprites.bigcup, x, y - h, RB.cupPal);
    // Steam scaled to match: taller, wider, slower.
    for (var i = 0; i < 4; i++) {
      var k = ((t * 0.34 + i * 0.25) % 1);
      var sy = y - h - 2 - k * 26;
      var sx = x + 5 + Math.sin(t * 1.2 + i * 1.9 + k * 3.4) * 4.5;
      var fade = (1 - k) * (1 - k);
      RB.ctx.globalAlpha = fade * 0.70;
      RB.rect(sx, sy, 2, 4, P.white);
      RB.ctx.globalAlpha = fade * 0.40;
      RB.rect(sx - 1, sy + 1, 1, 3, P.white);
      RB.rect(sx + 2, sy + 2, 1, 2, P.white);
      RB.ctx.globalAlpha = 1;
    }
  };

  RB.now = 0;
})(window.RB = window.RB || {});
