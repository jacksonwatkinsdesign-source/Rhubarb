// scenes_flight.js — cabin, takeoff seen through the window, and the sunrise.
(function (RB) {
  'use strict';
  var P = RB.P, A = RB.art;

  // =================================================================== cabin
  RB.scenes.cabin = (function () {
    var s = { id: 'cabin' };
    var player, cast, crew, script, roomW = 520;

    // A cabin reads from three bands stacked in depth: portholes behind, a
    // row of headrests with people in them, and the backs of the row nearest
    // camera closing off the bottom of the frame. The aisle is the gap.
    var BINS = 12, WIN = 26, HEAD = 48, BACK = 58, AISLE = 84, NEAR = 114;
    var MY_SEAT = 322;
    var PITCH = 30;              // seat pitch, in px

    s.enter = function () {
      RB.audio.bed('cabin');
      RB.audio.music(0.26, 4);
      player = new RB.Actor({ x: 16, y: 78, pal: RB.cast.you, dir: 'right' });
      player.cup = !!RB.state.hasCoffee;
      RB.state.cupsHeld = RB.state.hasCoffee ? 1 : 0;
      s.seated = false;
      s.t = 0;
      script = new RB.Script(function* () {
        yield RB.wait(1.6);
        yield RB.captionFor('Row 14. By the window, as asked.', 5.0, 132);
      });

      // The same six from the gate, now in seats. Finding them again is the
      // payoff for having noticed them at all.
      cast = [
        seated(112, RB.cast.elder),
        seated(172, RB.cast.kid),
        seated(202, RB.cast.suit),
        seated(262, RB.cast.student),
        seated(382, RB.cast.coat),
        seated(442, RB.cast.crew)
      ];
      crew = new RB.Actor({ x: 62, y: 74, pal: RB.cast.crew, dir: 'right' });
    };

    function seated(x, pal) {
      return new RB.Actor({ x: x, y: 41, pal: pal, dir: 'down', sitting: true, shadow: false });
    }

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 520, h: AISLE - 2 },
      { x: 0, y: NEAR - 4, w: 520, h: 60 }
    ];
    var bounds = { x0: 10, y0: 66, x1: roomW - 22, y1: 92 };

    s.update = function (dt) {
      s.t += dt;
      if (script) { script.update(dt); if (script.done) script = null; }
      if (!s.seated && !RB.dialog.active() && !RB.transitioning()) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);
      cast.forEach(function (a) { a.update(dt); });
      crew.update(dt);

      var near = !s.seated && !script && !RB.dialog.active() && !RB.transitioning() &&
                 Math.abs(player.x - MY_SEAT) < 18;
      s.prompt = near;
      if (near && RB.input.pressed('action')) {
        s.seated = true;
        script = new RB.Script(function* () {
          yield RB.call(function () {
            player.sitting = true; player.moving = false; player.dir = 'down';
            player.x = MY_SEAT; player.y = 41; player.shadow = false;
          });
          yield RB.wait(1.6);
          yield RB.captionFor('You put your head against the glass.', 4.6, 132);
          yield RB.wait(0.6);
          yield RB.call(function () { RB.go('takeoff', { fade: 2.2 }); });
          yield RB.wait(4);
        });
      }
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#20242e');

      // Ceiling, curving away at the edges of frame.
      RB.wrect(x0, 0, w, BINS, '#2b3040');
      RB.wrect(x0, 0, w, 3, '#232837');
      RB.wrect(x0, BINS - 1, w, 1, '#1b1f2c');

      // Overhead bins: a long closed run with latches and a shadow beneath.
      RB.wrect(x0, BINS, w, WIN - BINS - 4, '#394054');
      RB.wrect(x0, BINS, w, 1, '#4a5268');
      for (var bx = Math.floor(x0 / 44) * 44; bx < x0 + w; bx += 44) {
        RB.wrect(bx, BINS, 1, WIN - BINS - 4, '#2c3243');
        RB.wrect(bx + 18, WIN - 10, 8, 2, '#6b7389');
      }
      RB.wrect(x0, WIN - 4, w, 4, '#242938');
      // Reading lights and gasper vents in the underside.
      for (var lx = Math.floor(x0 / 22) * 22; lx < x0 + w; lx += 22) {
        var on = ((lx / 22) | 0) % 4 === 0;
        RB.wrect(lx + 8, WIN - 3, 3, 2, on ? '#e8d8a8' : '#333a4c');
        if (on) {
          RB.ctx.globalAlpha = 0.06;
          RB.wrect(lx + 2, WIN, 15, 34, P.warm4);
          RB.ctx.globalAlpha = 1;
        }
      }

      // Window wall: portholes onto a paling sky.
      RB.wrect(x0, WIN, w, HEAD - WIN, '#3a4054');
      RB.wrect(x0, WIN, w, 1, '#454c62');
      for (var wx = Math.floor(x0 / PITCH) * PITCH; wx < x0 + w; wx += PITCH) {
        var px = wx + 8;
        RB.wrect(px - 1, WIN + 3, 15, 15, '#232a3c');
        RB.ctx.save();
        RB.ctx.beginPath();
        RB.ctx.rect(px - RB.cam.x, WIN + 4, 13, 13);
        RB.ctx.clip();
        RB.vgrad(px - RB.cam.x, WIN + 4, 13, 13, A.skyMix('civil', 'dawn', 0.4), 5);
        RB.wrect(px, WIN + 13, 13, 4, '#2c3348');
        RB.ctx.restore();
        RB.wrect(px - 1, WIN + 3, 15, 1, '#5c6379');
        RB.wrect(px - 1, WIN + 17, 15, 1, '#282e3e');
      }

      // Far row: seat backs with headrests. Passengers are drawn between the
      // back and the headrest so they sit *in* the seats.
      farBacks(x0, w);
      var vis = cast.concat(s.seated ? [] : []);
      vis.sort(function (a, b) { return a.x - b.x; });
      vis.forEach(function (a) { a.draw(P.warm4, 0.10); });
      if (s.seated) player.draw(P.warm4, 0.10);
      farHeadrests(x0, w);

      // Aisle.
      RB.wrect(x0, AISLE, w, NEAR - AISLE, '#2b3142');
      RB.wrect(x0, AISLE, w, 1, '#353c50');
      for (var fx = Math.floor(x0 / 18) * 18; fx < x0 + w; fx += 18) RB.wrect(fx, AISLE, 1, NEAR - AISLE, '#272d3c');
      RB.ctx.globalAlpha = 0.07;
      RB.wrect(x0, AISLE + 3, w, 5, P.warm4);
      RB.ctx.globalAlpha = 1;
      // Aisle floor strip lighting, low down where it actually is.
      for (var sx2 = Math.floor(x0 / 26) * 26; sx2 < x0 + w; sx2 += 26) {
        RB.wrect(sx2 + 6, NEAR - 6, 6, 1, '#7d6f4e');
      }

      if (!s.seated) {
        var mid = [player, crew];
        mid.sort(function (a, b) { return a.y - b.y; });
        mid.forEach(function (a) { a.draw(P.warm4, 0.10); });
      } else {
        crew.draw(P.warm4, 0.10);
      }

      // Nearest row, seen from behind: tall backs that close off the bottom
      // of the frame and put the player inside the tube rather than beside it.
      nearBacks(x0, w);

      if (s.prompt && !RB.dialog.active()) RB.drawPrompt(MY_SEAT + 6, HEAD - 22, 'Z  sit');
    };

    function farBacks(x0, w) {
      var c = '#3f5875';
      for (var x = Math.floor(x0 / PITCH) * PITCH; x < x0 + w; x += PITCH) {
        RB.wrect(x + 2, BACK, 25, AISLE - BACK - 2, c);
        RB.wrect(x + 2, BACK, 25, 1, RB.shade(c, 0.20));
        RB.wrect(x + 26, BACK, 2, AISLE - BACK - 2, RB.shade(c, -0.35));
        RB.wrect(x + 2, AISLE - 4, 25, 2, RB.shade(c, -0.42));   // seat base
        RB.wrect(x + 27, BACK + 8, 4, 3, RB.shade(c, -0.2));     // armrest
      }
    }

    function farHeadrests(x0, w) {
      var c = '#4a6684';
      for (var x = Math.floor(x0 / PITCH) * PITCH; x < x0 + w; x += PITCH) {
        RB.wrect(x + 4, HEAD, 21, 11, c);
        RB.wrect(x + 4, HEAD, 21, 1, RB.shade(c, 0.28));
        RB.wrect(x + 4, HEAD + 10, 21, 1, RB.shade(c, -0.35));
        RB.wrect(x + 6, HEAD + 2, 17, 7, RB.shade(c, -0.12));    // antimacassar
      }
    }

    function nearBacks(x0, w) {
      var c = '#33485f';
      RB.wrect(x0, NEAR, w, RB.H - NEAR, '#1e2430');
      for (var x = Math.floor(x0 / PITCH) * PITCH; x < x0 + w; x += PITCH) {
        RB.wrect(x + 2, NEAR, 25, RB.H - NEAR, c);
        RB.wrect(x + 2, NEAR, 25, 2, RB.shade(c, 0.26));          // headrest top
        RB.wrect(x + 4, NEAR + 2, 21, 9, RB.shade(c, 0.10));
        RB.wrect(x + 26, NEAR, 2, RB.H - NEAR, RB.shade(c, -0.4));
        RB.wrect(x + 6, NEAR + 20, 17, 2, RB.shade(c, -0.28));    // tray latch
        RB.wrect(x + 10, NEAR + 30, 9, 6, RB.shade(c, -0.18));    // seat pocket
      }
      RB.ctx.globalAlpha = 0.22;
      RB.wrect(x0, NEAR, w, 4, '#0b0d14');
      RB.ctx.globalAlpha = 1;
    }

    return s;
  })();

  // ================================================================ takeoff
  // Everything from here is seen through one window. There is nothing to
  // press; the only input that matters is looking.
  RB.scenes.takeoff = (function () {
    var s = { id: 'takeoff' };
    var script;

    // The view model: a horizon at some height, ground sliding past at some
    // speed, and an altitude that shrinks everything. Every beat of the
    // takeoff is just these four numbers moving.
    var v;

    s.enter = function () {
      RB.audio.bed('cabin');
      v = { horizon: 96, speed: 0, scroll: 0, alt: 0, tilt: 0, shade: 0, cloud: 0, sky: 0 };
      s.t = 0;

      script = new RB.Script(function* () {
        yield RB.wait(2.4);
        yield RB.captionFor('The bridge pulls away.', 4.0, 20);
        // Pushback — everything slides the wrong way, gently.
        yield RB.tween(v, 'speed', -14, 3.0, 'inOut');
        yield RB.wait(2.6);
        yield RB.tween(v, 'speed', 0, 2.4, 'inOut');
        yield RB.wait(1.6);
        // Taxi.
        yield RB.call(function () { RB.audio.bed('roll'); RB.audio.ambLevel(0.34, 4); });
        yield RB.tween(v, 'speed', 42, 5.0, 'inOut');
        yield RB.captionFor('Blue lights, one after another, for a long time.', 5.5, 20);
        yield RB.wait(6.0);
        yield RB.tween(v, 'speed', 16, 3.5, 'inOut');
        yield RB.wait(2.0);
        // Line up and hold.
        yield RB.tween(v, 'speed', 0, 2.5, 'inOut');
        yield RB.captionFor('Then a pause, which is the best part.', 5.0, 20);
        yield RB.wait(5.0);
        // Roll.
        yield RB.call(function () { RB.audio.ambLevel(0.9, 6); RB.audio.music(0.16, 5); });
        yield RB.tween(v, 'speed', 400, 9.0, 'in');
        yield RB.wait(0.2);
        // Rotate: the ground lets go.
        yield RB.tweenAll([
          RB.tween(v, 'tilt', 1, 3.0, 'out'),
          RB.tween(v, 'horizon', 122, 3.4, 'out'),
          RB.tween(v, 'alt', 0.34, 3.4, 'out')
        ]);
        yield RB.call(function () { RB.audio.ambLevel(0.55, 8); });
        yield RB.captionFor('And then it simply stops touching the ground.', 5.4, 20);
        // Climb out.
        // Keep pushing the horizon down and off frame — the ground has to
        // actually leave, not settle into a band and sit there.
        yield RB.tweenAll([
          RB.tween(v, 'alt', 0.92, 14.0, 'inOut'),
          RB.tween(v, 'horizon', 158, 14.0, 'inOut'),
          RB.tween(v, 'speed', 150, 10.0, 'inOut'),
          RB.tween(v, 'tilt', 0.35, 8.0, 'inOut'),
          RB.tween(v, 'sky', 1, 12.0, 'inOut')
        ]);
        // Into the layer.
        yield RB.call(function () { RB.audio.music(0.30, 6); });
        yield RB.tween(v, 'cloud', 1, 5.0, 'inOut');
        yield RB.captionFor('Grey. Then more grey.', 4.4, 20);
        yield RB.wait(4.0);
        yield RB.tweenAll([
          RB.tween(v, 'alt', 1, 6.0, 'inOut'),
          RB.tween(v, 'horizon', 172, 6.0, 'inOut'),
          RB.tween(v, 'cloud', 0, 4.0, 'inOut')
        ]);
        yield RB.wait(1.0);
        yield RB.call(function () { RB.go('sunrise', { fade: 3.0 }); });
        yield RB.wait(6);
      });
    };

    s.update = function (dt) {
      s.t += dt;
      script.update(dt);
      v.scroll += v.speed * dt;
    };

    // Draw the world outside, then mask it to the window shape.
    s.draw = function () {
      RB.clear('#0d1120');
      var wx = 26, wy = 18, ww = RB.W - 52, wh = RB.H - 46;

      RB.ctx.save();
      roundRect(wx, wy, ww, wh, 26);
      RB.ctx.clip();
      drawOutside(wx, wy, ww, wh);
      RB.ctx.restore();

      drawWindowFrame(wx, wy, ww, wh);
      drawCabinSurround(wx, wy, ww, wh);
    };

    function drawOutside(wx, wy, ww, wh) {
      var ramp = A.skyMix('civil', 'dawn', v.sky);
      var hz = wy + (v.horizon / 160) * wh;
      hz = Math.min(hz, wy + wh + 40);

      RB.vgrad(wx, wy, ww, Math.max(1, hz - wy), ramp, 12);
      A.stars(wx, ww, wy, Math.max(1, (hz - wy) * 0.7), RB.clamp(0.7 - v.sky, 0, 1));

      // Ground. As altitude rises, features compress toward the horizon and
      // slide more slowly — the whole sense of height comes from this.
      if (hz < wy + wh) {
        var gh = wy + wh - hz;
        var compress = 1 - v.alt * 0.90;
        // Atmospheric haze: the further down and away the ground gets, the
        // more it takes the colour of the air between you and it.
        var haze = RB.clamp(v.alt * 1.05, 0, 0.86);
        var apron = RB.mix(RB.mix('#232a3c', ramp[3], 0.18 + v.sky * 0.2), ramp[2], haze);
        RB.rect(wx, hz, ww, gh, apron);
        RB.rect(wx, hz, ww, 1, RB.shade(apron, 0.25));

        // Taxiway / runway edge lights, the signature of a night departure.
        var pitch = Math.max(6, 34 * compress);
        var off = -(v.scroll % pitch);
        for (var i = -1; i < ww / pitch + 2; i++) {
          var lx = wx + off + i * pitch;
          var ly = hz + 6 * compress + 2;
          RB.rect(lx, ly, Math.max(1, 2 * compress), Math.max(1, 2 * compress), '#5a8ad0');
          RB.rect(lx, hz + gh * 0.55 * compress + 8, Math.max(1, 2 * compress), 1, RB.mix('#e8d8a8', apron, 0.3));
        }
        // Centreline dashes, which is what actually sells acceleration.
        var dp = Math.max(10, 60 * compress);
        var doff = -(v.scroll * 1.35 % dp);
        for (var d = -1; d < ww / dp + 2; d++) {
          RB.rect(wx + doff + d * dp, hz + gh * 0.42, Math.max(2, 22 * compress), Math.max(1, 2 * compress), RB.mix(P.white, apron, 0.45));
        }
        // Ground clutter that shrinks with altitude.
        if (v.alt < 0.75) {
          var bp = Math.max(14, 56 * compress);
          var boff = -(v.scroll * 0.55 % bp);
          // Hangars and terminal blocks standing on the horizon line, hazed
          // with distance and lit here and there.
          var bCol = RB.mix(RB.mix(ramp[0], '#0a0c14', 0.30), ramp[2], haze);
          var bLit = RB.mix('#c9b184', bCol, 0.45);
          for (var b = -1; b < ww / bp + 2; b++) {
            var bxx = wx + boff + b * bp;
            var idx = Math.abs(Math.round((boff + b * bp) / bp));
            var bhh = Math.max(1, (8 + (idx % 3) * 6) * compress);
            var bww = Math.max(2, (20 + (idx % 4) * 9) * compress);
            RB.rect(bxx, hz - bhh, bww, bhh + 1, bCol);
            RB.rect(bxx, hz - bhh, bww, Math.max(1, compress), RB.shade(bCol, 0.20));
            if (compress > 0.35 && idx % 2 === 0) RB.rect(bxx + 3, hz - bhh + 2, 3, 2, bLit);
            if (idx % 5 === 0) RB.rect(bxx + bww * 0.5, hz - bhh - 3 * compress, Math.max(1, compress), 3 * compress, bCol);
          }
        }
        // Motion blur streaks at speed.
        // Short dashes torn along the ground rather than full-width rules.
        if (v.speed > 200) {
          var blur = RB.clamp((v.speed - 200) / 280, 0, 1);
          RB.ctx.globalAlpha = blur * 0.22;
          for (var sN = 0; sN < 18; sN++) {
            var sy = hz + ((sN * 29 + v.scroll * 2.2) % Math.max(1, gh));
            var sxx = wx + ((sN * 71 + v.scroll * 6) % (ww + 60)) - 30;
            RB.rect(sxx, sy, 24 + (sN % 4) * 14, 1, RB.shade(apron, 0.35));
          }
          RB.ctx.globalAlpha = 1;
        }
      }

      // Wing, always in shot, tilting with the aircraft. Anchoring the view
      // to a piece of the aeroplane is what makes it read as a window and
      // not a camera.
      drawWing(wx, wy, ww, wh);

      // Cloud layer. You are climbing through it, so the cloud streaks
      // downward past the glass rather than drifting sideways — and it is
      // drawn as torn bands, never as boxes.
      if (v.cloud > 0.01) {
        var cAmt = RB.clamp(v.cloud, 0, 1);
        var cCol = RB.mix('#9aa6bd', ramp[2], 0.30);
        for (var c = 0; c < 7; c++) {
          var speed = 26 + c * 17;
          var cy = wy - 40 + ((s.t * speed + c * 53) % (wh + 90));
          wisp(wx, ww, cy, 10 + (c % 3) * 9, cCol, cAmt * (0.16 + (c % 3) * 0.10), c * 37);
        }
        // At the thickest point the whole window greys over.
        RB.ctx.globalAlpha = cAmt * 0.45;
        RB.rect(wx, wy, ww, wh, cCol);
        RB.ctx.globalAlpha = 1;
      }
    }

    function drawWing(wx, wy, ww, wh) {
      wingAt(wx, wy, ww, wh, -v.tilt * 12, 0, 1);
    }

    // Shared by takeoff and sunrise so it is unmistakably the same wing.
    // Anchoring the view to a piece of the aeroplane is what makes the frame
    // read as a window rather than a camera.
    function wingAt(wx, wy, ww, wh, tiltDeg, warm, warmAmt) {
      var baseY = wy + wh * 0.70;
      var sun = '#f4d08a';
      var top   = RB.mix('#d6dde8', sun, warm * warmAmt);
      var mid   = RB.mix('#b9c2d1', sun, warm * warmAmt * 0.7);
      var under = RB.mix('#828da4', sun, warm * warmAmt * 0.35);
      var hi    = RB.mix('#eef2f8', sun, warm * warmAmt);

      RB.ctx.save();
      RB.ctx.translate(wx + ww * 0.5, baseY);
      RB.ctx.rotate((tiltDeg * Math.PI) / 180);
      RB.ctx.translate(-(wx + ww * 0.5), -baseY);

      var n = 90;
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        var x = wx + ww * 0.16 + t * ww * 0.95;
        var y = baseY + t * 30;
        var thick = 19 - t * 14;
        RB.rect(x, y, 3, thick, mid);
        RB.rect(x, y, 3, Math.max(1, thick * 0.45), top);
        RB.rect(x, y, 3, 1, hi);                          // leading edge
        RB.rect(x, y + thick - 2, 3, 2, under);           // trailing edge
        // Slat break just aft of the leading edge.
        if (i % 2 === 0) RB.rect(x, y + 2, 3, 1, RB.mix(mid, under, 0.5));
      }
      // Flap-track fairings hanging off the trailing edge.
      [0.26, 0.52].forEach(function (ft) {
        var fx = wx + ww * 0.16 + ft * ww * 0.95;
        var fy = baseY + ft * 30 + (19 - ft * 14) - 2;
        RB.rect(fx, fy, 12, 5, under);
        RB.rect(fx + 10, fy + 1, 6, 3, RB.shade(under, -0.2));
      });
      // Winglet turning up at the tip.
      var tx = wx + ww * 0.16 + ww * 0.95, ty = baseY + 30;
      RB.rect(tx, ty - 10, 3, 14, mid);
      RB.rect(tx, ty - 10, 3, 2, hi);
      if (Math.floor(RB.now * 1.4) % 2 === 0) RB.rect(tx, ty - 13, 3, 3, P.green);
      RB.ctx.restore();
    }
    s.wingAt = wingAt;

    // A torn band of cloud: both edges follow a sum of sines, so it reads as
    // vapour rather than as a rectangle with the opacity turned down.
    function wisp(x0, w, y, h, col, alpha, phase) {
      if (alpha <= 0.01) return;
      RB.ctx.globalAlpha = alpha;
      RB.ctx.fillStyle = col;
      for (var i = 0; i < w; i++) {
        var u = i + phase;
        var top = y + Math.sin(u * 0.055 + phase) * 3.0 + Math.sin(u * 0.019) * 4.5;
        var thick = h + Math.sin(u * 0.041 + 2.1) * (h * 0.45) + Math.sin(u * 0.11) * 2.0;
        if (thick < 1) continue;
        RB.ctx.fillRect(x0 + i, Math.round(top), 1, Math.round(thick));
      }
      RB.ctx.globalAlpha = 1;
    }

    function roundRect(x, y, w, h, r, cont) {
      var c = RB.ctx;
      if (!cont) c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }
    s.roundRect = roundRect;

    function drawWindowFrame(wx, wy, ww, wh) {
      var c = RB.ctx;
      // Inner bevel
      c.save();
      roundRect(wx - 3, wy - 3, ww + 6, wh + 6, 29);
      roundRect(wx, wy, ww, wh, 26, true);
      c.fillStyle = '#5a6378';
      c.fill('evenodd');
      c.restore();
      c.save();
      roundRect(wx - 7, wy - 7, ww + 14, wh + 14, 33);
      roundRect(wx - 3, wy - 3, ww + 6, wh + 6, 29, true);
      c.fillStyle = '#7c8598';
      c.fill('evenodd');
      c.restore();
      // Smudge on the glass
      c.globalAlpha = 0.05;
      c.fillStyle = P.white;
      c.fillRect(wx + 14, wy + 12, 26, 4);
      c.fillRect(wx + 20, wy + 18, 14, 3);
      c.globalAlpha = 1;
    }

    function drawCabinSurround(wx, wy, ww, wh) {
      // The cabin wall around the window, so the frame has something to sit
      // in. Warm against the cold outside.
      var wall = '#3a4054';
      RB.rect(0, 0, wx - 7, RB.H, wall);
      RB.rect(wx + ww + 7, 0, RB.W - wx - ww - 7, RB.H, wall);
      RB.rect(0, 0, RB.W, wy - 7, wall);
      RB.rect(0, wy + wh + 7, RB.W, RB.H - wy - wh - 7, wall);
      RB.rect(0, wy + wh + 7, RB.W, 2, '#2c3142');
      // Shade track above, sill below.
      RB.rect(wx - 10, wy - 12, ww + 20, 4, '#4a5165');
      RB.rect(wx - 10, wy + wh + 9, ww + 20, 5, '#4a5165');
      RB.rect(wx - 10, wy + wh + 9, ww + 20, 1, '#5c6479');
      RB.ctx.globalAlpha = 0.07;
      RB.rect(wx - 14, wy + wh + 14, ww + 28, 10, P.warm4);
      RB.ctx.globalAlpha = 1;
    }

    return s;
  })();

  // ================================================================ sunrise
  // Above the layer. Nothing happens except the light, which is the point.
  RB.scenes.sunrise = (function () {
    var s = { id: 'sunrise' };
    var sky, service, k, sun, titleA, endFade, att, dim;
    var TK = RB.scenes.takeoff;

    // The cruise runs two scripts at once: one owns the light, the other owns
    // the cabin service. Interleaving them in a single generator would mean a
    // thirty-second sky tween blocking a drinks trolley, which is exactly
    // backwards.
    s.enter = function () {
      RB.audio.bed('sky');
      RB.audio.ambLevel(0.45, 4);
      RB.audio.music(0.40, 6);
      k = { t: 0 };
      sun = { y: 1.05 };
      titleA = { v: 0 };
      endFade = { v: 0 };
      dim = { v: 0 };
      att = { x: -22, tray: false };
      s.finished = false;
      s.t = 0;
      if (RB.state.cupsHeld === undefined) RB.state.cupsHeld = RB.state.hasCoffee ? 1 : 0;

      sky = new RB.Script(function* () {
        yield RB.wait(3.0);
        yield RB.captionFor('Above the layer, it is already morning.', 5.5, 22);
        yield RB.tweenAll([
          RB.tween(k, 't', 0.45, 46.0, 'inOut'),
          RB.tween(sun, 'y', 0.74, 46.0, 'inOut')
        ]);
        yield RB.tweenAll([
          RB.tween(k, 't', 0.80, 48.0, 'inOut'),
          RB.tween(sun, 'y', 0.30, 48.0, 'inOut')
        ]);
        yield RB.wait(4.0);
        yield RB.captionFor('It has been morning up here the whole time.', 5.5, 22);
        yield RB.call(function () { RB.audio.fadeOut(16); });
        yield RB.tween(endFade, 'v', 0.68, 7.0, 'inOut');
        yield RB.tween(titleA, 'v', 1, 3.0, 'inOut');
        yield RB.wait(5.0);
        yield RB.tween(endFade, 'v', 1, 6.0, 'inOut');
        yield RB.call(function () { s.finished = true; });
        yield RB.wait(2.0);
      });

      // Quarter of the way in, halfway, three-quarters.
      service = new RB.Script(function* () {
        var accepted = false;

        yield RB.waitFor(function () { return s.t > 30; });
        yield RB.call(function () { RB.audio.sfx.tick(); });
        yield arrive();
        var pick = yield RB.choose('Coffee, sir?', 'Attendant', ['Yes, please.', 'No, thank you.']);
        accepted = pick === 0;
        yield RB.say(accepted ? ['Of course.'] : ['Certainly, sir.'], 'Attendant');
        yield leave();

        if (accepted) {
          yield RB.waitFor(function () { return s.t > 62; });
          yield RB.call(function () { att.tray = true; });
          yield arrive();
          yield RB.say(['Your coffee, sir.'], 'Attendant');
          yield RB.call(function () {
            RB.state.cupsHeld = (RB.state.cupsHeld || 0) + 1;
            att.tray = false;
            RB.audio.sfx.belt();
          });
          yield RB.wait(0.6);
          yield leave();
        }

        yield RB.waitFor(function () { return s.t > 94; });
        if (RB.state.cupsHeld > 0) {
          yield RB.call(function () { att.tray = true; });
          yield arrive();
          yield RB.say([RB.state.cupsHeld > 1 ? 'May I take those, sir?' : 'May I take that, sir?'], 'Attendant');
          yield RB.call(function () { RB.state.cupsHeld = 0; RB.audio.sfx.tick(); });
          yield RB.wait(0.5);
          yield RB.say(['Thank you, sir.'], 'Attendant');
          yield RB.call(function () { att.tray = false; });
          yield leave();
        }
      });

      function arrive() {
        return RB.tweenAll([RB.tween(att, 'x', 16, 1.4, 'out'), RB.tween(dim, 'v', 1, 1.0, 'inOut')]);
      }
      function leave() {
        return RB.tweenAll([RB.tween(att, 'x', -22, 1.6, 'in'), RB.tween(dim, 'v', 0, 1.4, 'inOut')]);
      }
    };

    s.dbg = function () { return { t: s.t, cups: RB.state.cupsHeld }; };

    s.update = function (dt) {
      s.t += dt;
      sky.update(dt);
      service.update(dt);
      if (s.finished && RB.input.anyPressed()) RB.go('title', { fade: 1.2 });
    };

    function ramp() {
      if (k.t < 0.34) return A.skyMix('civil', 'dawn', k.t / 0.34);
      if (k.t < 0.7) return A.skyMix('dawn', 'sunrise', (k.t - 0.34) / 0.36);
      return A.skyMix('sunrise', 'day', (k.t - 0.7) / 0.3);
    }

    s.draw = function () {
      var R = ramp();
      var wx = 26, wy = 18, ww = RB.W - 52, wh = RB.H - 46;

      RB.clear('#0d1120');
      RB.ctx.save();
      TK.roundRect(wx, wy, ww, wh, 26);
      RB.ctx.clip();

      var hz = wy + wh * 0.62;
      RB.vgrad(wx, wy, ww, hz - wy, R, 14);
      A.stars(wx, ww, wy, (hz - wy) * 0.5, RB.clamp(0.45 - k.t * 1.4, 0, 1));

      var sy = wy + wh * sun.y;
      var sx = wx + ww * 0.66;
      var sunC = RB.mixRamp(['#f4d08a', '#ffe9b8'], RB.clamp(k.t, 0, 1));
      for (var r = 5; r >= 1; r--) {
        RB.ctx.globalAlpha = 0.055 * r * RB.clamp(k.t + 0.25, 0, 1);
        disc(sx, sy, 10 + r * 11, RB.mix(sunC, R[3], 0.35));
      }
      RB.ctx.globalAlpha = 1;
      disc(sx, sy, 11, sunC);
      disc(sx, sy, 8, '#fff6dc');

      var deck = RB.mix('#5d6d92', R[3], 0.30);
      RB.rect(wx, hz, ww, wy + wh - hz, deck);
      RB.ctx.globalAlpha = 0.45;
      RB.rect(wx, hz - 5, ww, 9, RB.mix(R[3], sunC, 0.35));
      RB.ctx.globalAlpha = 1;

      for (var layer = 0; layer < 3; layer++) {
        var ly = hz + 3 + layer * 13;
        var amp = 5 + layer * 5;
        var drift = s.t * (3 + layer * 5);
        var base = RB.mix(RB.mix('#93a2c0', '#e0cfc4', k.t * 0.55), R[3], 0.26 - layer * 0.09);
        base = RB.shade(base, -layer * 0.10);
        var lit = RB.mix(base, sunC, 0.42 * (1 - layer * 0.22));
        cloudBank(wx, ww, ly, amp, drift, layer * 2.7, base, lit, sx, wy + wh);
      }

      TK.wingAt(wx, wy, ww, wh, -2, 1, 0.55 * k.t);

      // The window dims while someone is standing over you.
      if (dim.v > 0.01) {
        RB.ctx.globalAlpha = dim.v * 0.30;
        RB.ctx.fillStyle = '#0b0d14';
        RB.ctx.fillRect(wx, wy, ww, wh);
        RB.ctx.globalAlpha = 1;
      }
      RB.ctx.restore();

      RB.ctx.save();
      TK.roundRect(wx - 3, wy - 3, ww + 6, wh + 6, 29);
      TK.roundRect(wx, wy, ww, wh, 26, true);
      RB.ctx.fillStyle = RB.mix('#5a6378', sunC, 0.18 * k.t);
      RB.ctx.fill('evenodd');
      RB.ctx.restore();
      RB.ctx.save();
      TK.roundRect(wx - 7, wy - 7, ww + 14, wh + 14, 33);
      TK.roundRect(wx - 3, wy - 3, ww + 6, wh + 6, 29, true);
      RB.ctx.fillStyle = RB.mix('#7c8598', sunC, 0.22 * k.t);
      RB.ctx.fill('evenodd');
      RB.ctx.restore();

      var wall = RB.mix('#3a4054', sunC, 0.12 * k.t);
      RB.rect(0, 0, wx - 7, RB.H, wall);
      RB.rect(wx + ww + 7, 0, RB.W - wx - ww - 7, RB.H, wall);
      RB.rect(0, 0, RB.W, wy - 7, wall);
      RB.rect(0, wy + wh + 7, RB.W, RB.H - wy - wh - 7, wall);
      RB.rect(wx - 10, wy - 12, ww + 20, 4, RB.mix('#4a5165', sunC, 0.15 * k.t));
      RB.rect(wx - 10, wy + wh + 9, ww + 20, 5, RB.mix('#4a5165', sunC, 0.15 * k.t));

      // Whatever you are holding sits on the ledge, and visibly goes away
      // when she collects it.
      var cups = RB.state.cupsHeld || 0;
      for (var c = 0; c < cups; c++) {
        RB.drawSprite(RB.sprites.cup, wx + 14 + c * 11, wy + wh + 1, RB.cast.you);
      }

      // The attendant, leaning into your view from the aisle. Drawn after the
      // frame so she overlaps its edge rather than sitting behind it.
      if (att.x > -20) {
        RB.drawSprite(RB.sprites.side[0], att.x, 74, RB.cast.crew, false,
                      sunC, 0.14 * k.t);
        if (att.tray) {
          RB.rect(att.x + 13, 84, 12, 2, '#8a8f9c');
          RB.drawSprite(RB.sprites.cup, att.x + 15, 76, RB.cast.you);
        }
      }

      if (endFade.v > 0.001) {
        RB.ctx.globalAlpha = RB.clamp(endFade.v, 0, 1);
        RB.ctx.fillStyle = '#05070d';
        RB.ctx.fillRect(0, 0, RB.W, RB.H);
        RB.ctx.globalAlpha = 1;
      }
      if (titleA.v > 0.01) {
        RB.ctx.globalAlpha = titleA.v;
        RB.font.drawCentered('RHUBARB', RB.W / 2, RB.H / 2 - 7, '#fff6dc', { shadow: 'rgba(10,8,18,0.95)', scale: 2, tracking: 3 });
        RB.ctx.globalAlpha = 1;
      }
      if (s.finished && Math.floor(RB.now * 1.2) % 2 === 0) {
        RB.ctx.globalAlpha = 0.55;
        RB.font.drawCentered('press any key', RB.W / 2, RB.H - 24, '#b3c0d4');
        RB.ctx.globalAlpha = 1;
      }
    };

    function disc(cx, cy, r, c) {
      RB.ctx.fillStyle = c;
      for (var y = -r; y <= r; y++) {
        var half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
        if (half <= 0) continue;
        RB.ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
      }
    }

    function cloudBank(x0, w, baseY, amp, drift, phase, base, lit, sunX, bottomY) {
      for (var i = 0; i < w; i++) {
        var u = i + drift;
        var h = amp * (0.55 + 0.45 * Math.sin(u * 0.055 + phase))
                    * (0.60 + 0.40 * Math.sin(u * 0.017 + phase * 2.3))
              + amp * 0.30 * Math.sin(u * 0.130 + phase * 4.1);
        var top = Math.round(baseY - Math.max(0, h));
        var d = Math.abs((x0 + i) - sunX);
        var c = d < w * 0.30 ? lit : (d < w * 0.46 ? RB.mix(lit, base, (d - w * 0.30) / (w * 0.16)) : base);
        RB.rect(x0 + i, top, 1, bottomY - top, c);
        RB.rect(x0 + i, top, 1, 2, RB.shade(c, 0.20));
      }
    }

    return s;
  })();
})(window.RB = window.RB || {});
