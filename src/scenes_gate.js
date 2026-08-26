// scenes_gate.js — the concourse, the wait, and the jetbridge.
(function (RB) {
  'use strict';
  var P = RB.P, A = RB.art;

  // A side-view airliner. Used at the gate (parked, big) and again on the
  // taxiway, so it is worth drawing properly once.
  A.airliner = function (x, y, len, tint, tintAmt, lit) {
    var h = Math.round(len * 0.13);
    var body  = RB.mix('#dfe4ee', tint || '#000', tintAmt || 0);
    var shade = RB.mix('#9aa4b8', tint || '#000', tintAmt || 0);
    var trim  = RB.mix('#2c4a7a', tint || '#000', tintAmt || 0);
    var dark  = RB.mix('#1a2233', tint || '#000', tintAmt || 0);

    // Vertical stabiliser: swept leading edge, tall at the rear. Drawn first
    // so the fuselage overlaps its root.
    var finX = x + len * 0.76, finW = len * 0.20, finH = h * 1.55;
    for (var c = 0; c < finW; c++) {
      var ft = c / finW;
      var top = y + 2 - finH * Math.min(1, ft * 1.25);
      RB.wrect(finX + c, top, 1, (y + 4) - top, trim);
      RB.wrect(finX + c, top, 1, 1, RB.shade(trim, 0.35));
    }

    // Fuselage with a tapered nose and a tail cone that lifts.
    RB.wrect(x + len * 0.07, y, len * 0.80, h, body);
    RB.wrect(x + len * 0.07, y + h - 3, len * 0.80, 3, shade);
    RB.wrect(x + len * 0.035, y + 2, len * 0.04, h - 4, body);
    RB.wrect(x + len * 0.012, y + 4, len * 0.03, h - 8, body);
    RB.wrect(x, y + h * 0.38, len * 0.02, h * 0.3, body);
    for (var tc = 0; tc < len * 0.10; tc++) {
      var tt = tc / (len * 0.10);
      RB.wrect(x + len * 0.86 + tc, y + tt * h * 0.45, 1, h * (1 - tt * 0.75), body);
    }

    // Horizontal stabiliser at the tail root.
    RB.wrect(x + len * 0.82, y + h * 0.15, len * 0.13, 3, body);
    RB.wrect(x + len * 0.82, y + h * 0.15 + 2, len * 0.13, 1, shade);

    // Cheatline and cabin windows.
    RB.wrect(x + len * 0.05, y + h * 0.52, len * 0.82, 2, trim);
    for (var wx = x + len * 0.11; wx < x + len * 0.80; wx += len * 0.030) {
      RB.wrect(wx, y + h * 0.24, Math.max(1, len * 0.011), 2, lit ? '#e8d8a8' : dark);
    }
    RB.wrect(x + len * 0.045, y + h * 0.22, len * 0.035, 3, dark);   // flight deck

    // Wing sweeping back and down, with the engine slung under it.
    for (var wc = 0; wc < len * 0.34; wc++) {
      var wt = wc / (len * 0.34);
      RB.wrect(x + len * 0.30 + wc, y + h - 1 + wt * 5, 1, 3 + wt * 2, shade);
    }
    RB.wrect(x + len * 0.30, y + h - 1, len * 0.34, 1, RB.shade(shade, 0.25));
    RB.wrect(x + len * 0.34, y + h + 2, len * 0.10, h * 0.48, shade);
    RB.wrect(x + len * 0.34, y + h + 2, len * 0.10, 2, body);
    RB.wrect(x + len * 0.335, y + h + 2, 2, h * 0.48, dark);

    // Gear.
    RB.wrect(x + len * 0.13, y + h, 2, h * 0.38, dark);
    RB.wrect(x + len * 0.12, y + h + h * 0.36, 5, 3, P.black);
    RB.wrect(x + len * 0.45, y + h, 3, h * 0.36, dark);
    RB.wrect(x + len * 0.44, y + h + h * 0.34, 6, 3, P.black);

    if (Math.floor(RB.now * 1.3) % 2 === 0) RB.wrect(x + len * 0.52, y - 2, 2, 2, P.red);
  };

  // ==================================================================== gate
  RB.scenes.gate = (function () {
    var s = { id: 'gate' };
    var player, cast, script, roomW = 940;
    var FLOOR = 100, GLASS_Y = 18, GLASS_H = 82;
    var GATE_DOOR = 892;

    // The whole scene is driven by one clock. Sitting makes it run faster,
    // which is the closest this game comes to having a mechanic.
    var clock, seated, sitBlend, plane, bridge, boardingCalled, seatX;

    var SEATS = [];
    for (var i = 0; i < 6; i++) SEATS.push(560 + i * 16);

    s.enter = function () {
      RB.audio.bed('gate');
      RB.audio.music(0.30, 3);
      player = new RB.Actor({ x: 16, y: FLOOR + 18, pal: RB.cast.you, dir: 'right' });
      player.cup = !!RB.state.hasCoffee;
      clock = 0;
      seated = false;
      sitBlend = 0;
      boardingCalled = false;
      seatX = null;
      plane = { x: 1180, settled: false };
      bridge = { ext: 0 };
      script = null;

      // The six who will be on your plane, already waiting.
      cast = [
        sit(SEATS[0], RB.cast.elder),
        sit(SEATS[1], RB.cast.kid),
        sit(SEATS[4], RB.cast.suit),
        { a: new RB.Actor({ x: 690, y: FLOOR + 26, pal: RB.cast.student, dir: 'left' }), drift: [664, 716], t: 0 },
        { a: new RB.Actor({ x: 460, y: FLOOR + 8, pal: RB.cast.coat, dir: 'right' }), drift: [430, 500], t: 2.1 },
        sit(SEATS[5], RB.cast.crew)
      ];
      // Gate agent at the desk.
      cast.push({ a: new RB.Actor({ x: 830, y: FLOOR - 26, pal: RB.cast.agent, dir: 'down' }), drift: null, t: 0 });
    };

    function sit(x, pal) {
      return { a: new RB.Actor({ x: x, y: FLOOR + 10, pal: pal, dir: 'down', sitting: true }), drift: null, t: 0 };
    }

    var solids = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 940, h: 100 },              // glass wall + everything behind
      { x: 556, y: 112, w: 100, h: 10 },           // seat bank
      { x: 770, y: 100, w: 118, h: 20 }            // gate desk
    ];
    var bounds = { x0: 8, y0: 100, x1: roomW - 22, y1: 140 };

    s.p = function () { return player; };
    // Read by the playthrough test so it can wait in the chair like a person
    // rather than standing straight back up.
    s.dbg = function () { return { seated: seated, boardingCalled: boardingCalled, clock: clock }; };

    s.sitNow = function () {
      seated = true; player.sitting = true; player.dir = 'down'; player.moving = false;
      player.y = FLOOR + 10;
    };

    s.update = function (dt) {
      // Time moves faster when you are still. This is the only reward loop
      // in the game and it points the opposite way to every other game's.
      clock += dt * (seated ? 2.2 : 1.0);
      sitBlend += ((seated ? 1 : 0) - sitBlend) * Math.min(1, dt * 2.2);

      if (script) { script.update(dt); if (script.done) script = null; }

      if (!script && !RB.dialog.active() && !RB.transitioning()) {
        if (seated) {
          // Any directional input stands you back up.
          if (RB.input.left || RB.input.right || RB.input.up || RB.input.down || RB.input.pressed('cancel')) {
            seated = false;
            player.sitting = false;
            player.y = FLOOR + 22;
          }
        } else {
          RB.walk(player, dt, solids, bounds);
        }
      }

      // Camera: normally follows you; when seated it eases to frame the
      // stand outside the glass instead of you.
      if (seated) {
        var want = RB.clamp(690 - RB.W / 2, 0, roomW - RB.W);
        RB.cam.x += (want - RB.cam.x) * Math.min(1, dt * 1.1);
      } else {
        RB.camFollow(player.x, roomW, dt);
      }

      cast.forEach(function (n) {
        n.t += dt;
        if (n.drift) {
          var span = n.drift[1] - n.drift[0];
          var nx = n.drift[0] + ((Math.sin(n.t * 0.19) + 1) / 2) * span;
          n.a.dir = nx > n.a.x ? 'right' : 'left';
          n.a.moving = Math.abs(nx - n.a.x) > 0.12;
          n.a.x = nx;
        }
        n.a.update(dt);
      });

      // --- the arrival, on the clock
      // Taxis in from the right and settles on the stand outside the glass.
      if (clock > 70 && plane.x > 606) {
        plane.x += (600 - plane.x) * Math.min(1, dt * 0.30);
        if (plane.x < 612) { plane.x = 600; plane.settled = true; }
      }
      if (plane.settled && bridge.ext < 1) bridge.ext = Math.min(1, bridge.ext + dt * 0.22);
      if (bridge.ext >= 1 && !boardingCalled) {
        boardingCalled = true;
        RB.audio.sfx.chime();
        RB.caption.show('"Gate 14 is now boarding. All rows, at your leisure."', 7.5, 128);
      }

      // Sit down
      var nearSeat = null;
      if (!seated) {
        for (var i = 0; i < SEATS.length; i++) {
          if (SEATS[i] === SEATS[0] || SEATS[i] === SEATS[1] || SEATS[i] === SEATS[4] || SEATS[i] === SEATS[5]) continue;
          if (Math.abs(player.x - SEATS[i]) < 12 && player.y < FLOOR + 26) { nearSeat = SEATS[i]; break; }
        }
      }
      var busy = !!script || RB.dialog.active() || RB.transitioning();
      if (busy) nearSeat = null;
      s.seatPrompt = nearSeat;
      if (nearSeat !== null && RB.input.pressed('action')) {
        seated = true;
        seatX = nearSeat;
        player.sitting = true;
        player.dir = 'down';
        player.moving = false;
        player.x = nearSeat;
        player.y = FLOOR + 10;
        if (clock < 4) RB.caption.show('Nothing to do but watch.', 4.5, 128);
      }

      // Board
      var atDoor = boardingCalled && !seated && !busy && player.x > GATE_DOOR - 20;
      s.boardPrompt = atDoor;
      if (atDoor && RB.input.pressed('action')) {
        script = new RB.Script(function* () {
          yield RB.say(['Boarding pass, please.'], 'Gate agent');
          yield RB.call(function () { RB.audio.sfx.scan(); });
          yield RB.wait(0.7);
          yield RB.say(['Thank you, sir.'], 'Gate agent');
          yield RB.call(function () { RB.go('jetbridge', { fade: 1.4 }); });
          yield RB.wait(3);
        });
      }
    };

    // The sky over the whole wait: night -> pre-dawn -> civil twilight.
    function skyNow() {
      var k = RB.clamp(clock / 104, 0, 1);
      if (k < 0.5) return A.skyMix('night', 'predawn', k / 0.5);
      return A.skyMix('predawn', 'civil', (k - 0.5) / 0.5);
    }
    s.skyNow = skyNow;

    // What you can see through the glass: sky, a far treeline of lights,
    // apron, and eventually your aeroplane.
    function tarmacView(vx, vw, vy, vh) {
      var ramp = skyNow();
      var horizon = vy + vh * 0.52;
      RB.vgrad(vx - RB.cam.x, vy, vw, horizon - vy, ramp, 10);
      A.stars(0, RB.W, vy, (horizon - vy) * 0.8, RB.clamp(1 - clock / 76, 0, 1) * 0.9);

      // Distant terminal and tower. Silhouettes only a shade darker than the
      // sky, with their own lit windows, so they read as far away rather than
      // as holes punched in the picture.
      var far = RB.mix(ramp[0], '#0a0c14', 0.42);
      var mid = RB.mix(ramp[1], '#0a0c14', 0.52);
      RB.wrect(vx, horizon - 13, vw, 13, far);
      for (var bx = Math.floor(vx / 70) * 70; bx < vx + vw; bx += 70) {
        RB.wrect(bx + 10, horizon - 23, 28, 23, mid);
        RB.wrect(bx + 10, horizon - 23, 28, 1, RB.shade(mid, 0.22));
        for (var lw = bx + 13; lw < bx + 36; lw += 6) {
          if ((lw * 5) % 7 < 3) RB.wrect(lw, horizon - 19, 3, 3, RB.mix('#c9b184', mid, 0.35));
        }
        RB.wrect(bx + 48, horizon - 36, 7, 36, mid);          // tower shaft
        RB.wrect(bx + 46, horizon - 40, 11, 5, RB.shade(mid, 0.14));
        RB.wrect(bx + 48, horizon - 39, 7, 3, RB.mix('#c9b184', mid, 0.45));
      }
      A.horizonLights(0, RB.W, horizon - 4, 0.55);

      // Apron
      var apron = RB.mix('#2a3145', ramp[3], 0.20);
      RB.wrect(vx, horizon, vw, vy + vh - horizon, apron);
      RB.wrect(vx, horizon, vw, 1, RB.shade(apron, 0.2));
      // Painted stand markings
      RB.wrect(vx, horizon + 16, vw, 1, RB.mix(P.amber, apron, 0.55));
      for (var mx = Math.floor(vx / 40) * 40; mx < vx + vw; mx += 40) {
        RB.wrect(mx, horizon + 26, 18, 1, RB.mix(P.white, apron, 0.6));
      }
      // Apron floodlights
      RB.ctx.globalAlpha = 0.07;
      for (var fx = Math.floor(vx / 120) * 120; fx < vx + vw; fx += 120) {
        RB.wrect(fx, horizon, 70, vy + vh - horizon, P.warm4);
      }
      RB.ctx.globalAlpha = 1;

      // Your aeroplane, taxiing in and settling on the stand.
      if (plane.x < vx + vw + 500) {
        A.airliner(plane.x, horizon + 6, 168, ramp[0], 0.32, true);
      }
    }

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#1b2130');
      A.ceiling(x0, w, GLASS_Y, '#1e2433', '#d8e2f0');

      A.glassWall(x0, w, GLASS_Y, GLASS_H, tarmacView, '#333c52');

      // Jetbridge reaching out to the aircraft, drawn over the glass.
      // Reaches left out of the terminal toward the aircraft door.
      if (bridge.ext > 0) {
        var bw = 30 + bridge.ext * 216;
        RB.wrect(866 - bw, 62, bw, 11, '#5c6580');
        RB.wrect(866 - bw, 62, bw, 2, '#7c86a0');
        RB.wrect(866 - bw, 71, bw, 2, '#3c4358');
        for (var jx = 866 - bw + 6; jx < 862; jx += 15) RB.wrect(jx, 64, 4, 7, '#232a3c');
      }

      A.floor(x0, w, FLOOR, RB.H, '#3c435c', '#353c53', P.white);
      // Warm interior light spilling across the floor near the desk.
      RB.ctx.globalAlpha = 0.05;
      RB.wrect(760, FLOOR, 150, 60, P.warm4);
      RB.ctx.globalAlpha = 1;

      A.sign(120, 26, 'GATES  10 - 18', 86, '#16203a', P.cream);
      A.sign(548, 26, 'GATE 14', 50, '#16203a', P.amber);
      A.pillar(300, FLOOR + 10, 46, '#3f4760');
      A.plant(408, FLOOR + 16);
      A.plant(748, FLOOR + 12);

      A.seatRow(556, 122, 6, '#3c465e', '#5a7099');
      A.seatRow(400, 128, 3, '#3c465e', '#5a7099');

      // Gate desk
      A.counter(770, FLOOR + 20, 118, '#8fa0bb', '#39445c');
      A.board(786, FLOOR - 30, 84, 26, 3);

      // Gate door
      RB.wrect(GATE_DOOR - 6, FLOOR - 42, 3, 62, '#4a5468');
      RB.wrect(GATE_DOOR + 20, FLOOR - 42, 3, 62, '#4a5468');
      RB.wrect(GATE_DOOR - 6, FLOOR - 42, 29, 4, '#4a5468');
      RB.ctx.globalAlpha = boardingCalled ? 0.20 : 0.06;
      RB.wrect(GATE_DOOR - 3, FLOOR - 38, 23, 80, boardingCalled ? P.amber : P.white);
      RB.ctx.globalAlpha = 1;

      var list = cast.map(function (n) { return n.a; }).concat([player]);
      list.sort(function (a, b) { return a.y - b.y; });
      var warm = RB.clamp(1 - clock / 104, 0, 1);
      list.forEach(function (a) { a.draw(RB.mix('#c9b184', '#8aa0d0', 1 - warm), 0.10); });

      // Seated vignette: darken the terminal, leave the window bright, so
      // the eye goes where the player's would.
      if (sitBlend > 0.01) {
        RB.ctx.globalAlpha = sitBlend * 0.42;
        RB.ctx.fillStyle = '#080b16';
        RB.ctx.fillRect(0, GLASS_Y + GLASS_H, RB.W, RB.H - GLASS_Y - GLASS_H);
        RB.ctx.fillRect(0, 0, RB.W, GLASS_Y);
        RB.ctx.globalAlpha = 1;
      }

      if (!RB.dialog.active()) {
        if (s.seatPrompt !== null && s.seatPrompt !== undefined) RB.drawPrompt(s.seatPrompt + 6, FLOOR - 4, 'Z  sit');
        else if (s.boardPrompt) RB.drawPrompt(GATE_DOOR + 7, FLOOR - 56, 'Z  board');
      }
      if (seated && !boardingCalled && Math.floor(RB.now) % 12 < 1) {
        RB.font.drawCentered('any direction to stand', RB.W / 2, RB.H - 12, 'rgba(179,192,212,0.5)');
      }
    };

    return s;
  })();

  // =============================================================== jetbridge
  // Thirty seconds of nowhere. Warm, low, humming, one window.
  RB.scenes.jetbridge = (function () {
    var s = { id: 'jetbridge' };
    var player, roomW = 460, script;
    var FLOOR = 108, END_X = 424;

    s.enter = function () {
      RB.audio.bed('bridge');
      player = new RB.Actor({ x: 14, y: FLOOR + 10, pal: RB.cast.you, dir: 'right' });
      player.cup = !!RB.state.hasCoffee;
      script = new RB.Script(function* () {
        yield RB.wait(2.0);
        yield RB.captionFor('The floor gives slightly underfoot.', 5.0, 132);
      });
      s.t = 0;
    };

    var solids = [{ x: -20, y: 0, w: 24, h: 300 }, { x: 0, y: 0, w: 460, h: 106 }];
    var bounds = { x0: 8, y0: 104, x1: roomW - 20, y1: 130 };

    s.p = function () { return player; };

    s.update = function (dt) {
      s.t += dt;
      if (script) { script.update(dt); if (script.done) script = null; }
      if (!RB.dialog.active() && !RB.transitioning()) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);
      var atEnd = player.x > END_X - 20 && !script && !RB.dialog.active() && !RB.transitioning();
      s.prompt = atEnd;
      if (atEnd && RB.input.pressed('action')) RB.go('cabin', { fade: 1.5 });
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#171d2a');
      // Ribbed ceiling and walls — the corrugated tube.
      RB.wrect(x0, 0, w, 30, '#242b3c');
      for (var rx = Math.floor(x0 / 20) * 20; rx < x0 + w; rx += 20) {
        RB.wrect(rx, 0, 2, 106, '#2c3446');
        RB.wrect(rx + 1, 0, 1, 106, '#1c2231');
      }
      RB.wrect(x0, 28, w, 78, '#212837');
      RB.wrect(x0, 28, w, 1, '#2f3749');
      // Strip lights
      for (var lx = Math.floor(x0 / 60) * 60; lx < x0 + w; lx += 60) {
        RB.wrect(lx + 12, 24, 34, 3, '#e6d4a8');
        RB.ctx.globalAlpha = 0.09;
        RB.wrect(lx + 4, 26, 50, 84, P.warm4);
        RB.ctx.globalAlpha = 1;
      }
      // The one window, showing the sky going pale.
      var wx = 250;
      RB.wrect(wx - 2, 44, 44, 30, '#39445c');
      RB.ctx.save();
      RB.ctx.beginPath();
      RB.ctx.rect(wx - RB.cam.x, 46, 40, 26);
      RB.ctx.clip();
      RB.vgrad(wx - RB.cam.x, 46, 40, 26, A.skyMix('predawn', 'civil', 0.6), 6);
      RB.wrect(wx, 66, 40, 6, '#2b3245');
      RB.ctx.restore();
      RB.wrect(wx + 18, 44, 2, 30, '#39445c');

      A.floor(x0, w, 106, RB.H, '#2c3346', '#272d3e', P.warm4);

      // The aircraft door at the end: brighter, cooler, and slightly other.
      RB.wrect(END_X, 46, 4, 62, '#4a5468');
      RB.wrect(END_X + 26, 46, 4, 62, '#4a5468');
      RB.wrect(END_X, 46, 30, 4, '#4a5468');
      RB.ctx.globalAlpha = 0.22;
      RB.wrect(END_X + 4, 50, 22, 76, '#dfe4ee');
      RB.ctx.globalAlpha = 1;

      player.draw(P.warm4, 0.16);
      if (s.prompt && !RB.dialog.active()) RB.drawPrompt(END_X + 15, 32, 'Z  board');
    };

    return s;
  })();
})(window.RB = window.RB || {});
