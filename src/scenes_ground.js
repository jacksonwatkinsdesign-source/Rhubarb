// scenes_ground.js — curb, check-in, security.
(function (RB) {
  'use strict';
  var P = RB.P, A = RB.art;

  // The same six people you see at the gate are the ones on your plane.
  // Defining them once and reusing them is nearly free and does more for
  // the feeling of a real trip than any amount of extra geometry.
  RB.cast = {
    // You: a blue suit. White shirt, navy tie, trousers to match the jacket.
    you: RB.pal({
      hair: '#3a2a1c', skin: '#f0c090',
      shirt: '#3c6fc0', shirtShade: '#27508f', shirtLight: '#5f92e0',
      collar: '#f2eee0', tie: '#1c2f5e',
      pants: '#2e5296', pantsShade: '#1f3a70', shoe: '#241e2c'
    }),
    driver:  RB.pal({ hair: '#2a1e16', skin: '#d8a068', shirt: '#6b7488', pants: '#333a4a', tie: '#3a4152' }),
    agent:   RB.pal({ hair: '#2d2320', skin: '#f0c090', shirt: '#2a4e9c', pants: '#1e2f56', tie: '#c04048' }),
    guard:   RB.pal({ hair: '#1e1a18', skin: '#c89060', shirt: '#3d5488', pants: '#26314e', tie: '#26314e' }),
    suit:    RB.pal({ hair: '#4a4a52', skin: '#e8bc8c', shirt: '#6a7084', pants: '#3c414f', tie: '#8a4048' }),
    student: RB.pal({ hair: '#5a3520', skin: '#d8a068', shirt: '#3fa89c', pants: '#3a4658', tie: '#3fa89c' }),
    elder:   RB.pal({ hair: '#ded8cc', skin: '#f0c090', shirt: '#b08a5c', pants: '#5a4c40', tie: '#8a6a44' }),
    kid:     RB.pal({ hair: '#6a4222', skin: '#f0c090', shirt: '#e08a44', pants: '#3f5488', tie: '#e08a44' }),
    coat:    RB.pal({ hair: '#2a1e18', skin: '#d8a068', shirt: '#c04a4a', pants: '#38344a', tie: '#8a3438' }),
    crew:    RB.pal({ hair: '#2b2320', skin: '#f0c090', shirt: '#263c74', pants: '#1a2646', tie: '#c04048' }),
    barista: RB.pal({ hair: '#4a2a18', skin: '#d8a068', shirt: '#4a6b52', pants: '#3a3a44', tie: '#4a6b52' })
  };

  // ===================================================================== curb
  // Night. A van pulls in, a driver does you a small kindness, and leaves.
  // The player has no control until it's over — this is the one moment in
  // the level that is purely watched.
  RB.scenes.curb = (function () {
    var s = { id: 'curb' };
    var player, driver, van, bag, script, ready;

    // Oblique, SNES 256x224. Bands are on the 8px grid and the whole scene is
    // composed from the module kit — the terminal is one bay repeated with
    // fittings tacked on, exactly like the buildings in the games this is
    // trying to feel like.
    var SKY = 64, WIN_Y = 74, CANOPY = 98, PAVE = 128, KERB = 164, ROAD = 170;
    var VAN_Y = 176, STAND = 132, DOOR_X = 168;

    // Fixed lit-window mask. Deterministic, so the terminal looks the same
    // every time you arrive at it.
    var BAYS = [];
    (function () {
      var seed = 90210;
      function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      for (var i = 0; i < 12; i++) BAYS.push({ lit: rnd() > 0.42, warm: rnd(), tall: rnd() > 0.7 });
    })();

    s.enter = function () {
      RB.audio.bed('night');
      RB.state.hasBag = false;
      RB.state.hasCoffee = false;
      RB.state.cupsHeld = 0;
      RB.state.cupLevel = 1;

      van = { x: 340, y: VAN_Y };
      s.doorOpen = 0;
      player = new RB.Actor({ x: 150, y: STAND, pal: RB.cast.you, dir: 'down' });
      player.hidden = true;
      driver = new RB.Actor({ x: 196, y: STAND, pal: RB.cast.driver, dir: 'left' });
      driver.hidden = true;
      bag = null;
      ready = false;
      s.showPrompt = false;

      script = new RB.Script(function* () {
        yield RB.wait(1.2);
        yield RB.captionFor('Somewhere before five in the morning.', 3.6, 28);
        yield RB.tween(van, 'x', 96, 3.4, 'outQuint');
        yield RB.wait(0.9);
        yield RB.call(function () {
          RB.audio.sfx.door();
          driver.hidden = false; driver.x = 196; driver.y = STAND;
          driver.moving = true; driver.dir = 'left';
        });
        yield RB.tween(driver, 'x', 162, 1.7, 'inOut');
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; });
        yield RB.wait(0.4);
        yield RB.call(function () { RB.audio.sfx.door(); });
        yield RB.tween(s, 'doorOpen', 1, 0.8, 'out');
        yield RB.wait(0.5);
        yield RB.call(function () {
          player.hidden = false; player.x = 146; player.y = 152;
          player.dir = 'up'; player.moving = true;
        });
        yield RB.tween(player, 'y', STAND, 1.5, 'out');
        yield RB.call(function () { player.moving = false; player.dir = 'down'; });
        yield RB.wait(0.7);
        yield RB.call(function () { driver.moving = true; driver.dir = 'right'; });
        yield RB.tween(driver, 'x', 206, 1.7, 'inOut');
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; RB.audio.sfx.door(); });
        yield RB.wait(0.9);
        yield RB.call(function () { bag = { x: 208, y: STAND + 10 }; });
        yield RB.call(function () { driver.moving = true; driver.dir = 'left'; });
        yield RB.tweenAll([RB.tween(driver, 'x', 160, 1.8, 'inOut'), RB.tween(bag, 'x', 162, 1.8, 'inOut')]);
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; });
        yield RB.wait(0.5);
        yield RB.say(['Here you are, sir.', 'Safe travels.'], 'Driver', { top: true });
        yield RB.wait(0.6);
        yield RB.call(function () { driver.moving = true; driver.dir = 'right'; });
        yield RB.tween(driver, 'x', 200, 2.0, 'inOut');
        yield RB.call(function () { driver.hidden = true; RB.audio.sfx.door(); });
        yield RB.tween(s, 'doorOpen', 0, 0.5, 'in');
        yield RB.wait(0.7);
        yield RB.call(function () {
          bag = null;
          RB.state.hasBag = true;
          player.bag = true;
          ready = true;
        });
        yield RB.tween(van, 'x', -130, 5.5, 'in');
        yield RB.captionFor('The doors are open. There is no hurry.', 5.0, 26);
      });
    };

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 22, h: 300 },
      { x: 254, y: 0, w: 22, h: 300 }
    ];
    var bounds = { x0: 12, y0: 112, x1: 234, y1: 146 };

    s.update = function (dt) {
      script.update(dt);
      if (ready && !RB.dialog.active() && !RB.transitioning()) {
        RB.walk(player, dt, solids, bounds);
        var near = Math.abs(player.x - DOOR_X) < 22 && player.y < 138;
        s.showPrompt = near;
        if (near && RB.input.pressed('action')) {
          RB.audio.sfx.door();
          RB.go('checkin');
        }
      }
      driver.update(dt);
    };

    s.draw = function () {
      var P = RB.P, OB = RB.ob;

      // ---- sky
      RB.vgrad(0, 0, RB.W, SKY + 4, RB.SKY.night, 10);
      RB.art.stars(0, RB.W, 2, SKY - 6, 0.9);

      // ---- terminal: one bay module repeated, with fittings tacked on.
      var facade = P.s2;
      var mf = OB.mat(facade);
      RB.rect(0, SKY, RB.W, PAVE - SKY, mf.front);
      // Roofline with depth, so the building is a solid and not a backdrop.
      for (var o = 9; o >= 1; o--) RB.rect(o, SKY - o, RB.W, 1, mf.top);
      RB.rect(9, SKY - 10, RB.W, 1, P.outline);
      RB.rect(0, SKY, RB.W, 2, mf.edge);
      RB.rect(0, PAVE - 2, RB.W, 2, P.outline);

      for (var i = 0; i < BAYS.length; i++) {
        var bx = i * 22 + 2, B = BAYS[i];
        RB.rect(bx, SKY + 4, 1, PAVE - SKY - 4, mf.side);        // bay seam
        RB.rect(bx + 1, SKY + 4, 1, PAVE - SKY - 4, mf.top);
        if (bx > DOOR_X - 26 && bx < DOOR_X + 22) continue;      // leave the entrance clear
        var c = B.lit ? RB.mix(P.w5, P.cream, B.warm) : P.ink;
        RB.rect(bx + 4, WIN_Y - 1, 14, 20, P.outline);
        RB.rect(bx + 5, WIN_Y, 12, 18, c);
        if (B.lit) {
          RB.rect(bx + 5, WIN_Y, 12, 2, P.cream);
          RB.ctx.globalAlpha = 0.07;
          RB.rect(bx, WIN_Y + 19, 22, CANOPY - WIN_Y - 19, P.w5);
          RB.ctx.globalAlpha = 1;
        }
      }
      // Canopy over the frontage, below the glazing — one big tacked-on
      // fitting, and the thing that gives the facade a horizon.
      OB.box(0, CANOPY, RB.W, 7, 9, P.s2);
      RB.ctx.globalAlpha = 0.30;
      RB.rect(0, CANOPY + 7, RB.W, 5, P.ink);
      RB.ctx.globalAlpha = 1;

      OB.sign(92, 26, 'DEPARTURES', 92, P.blu1, P.cream);

      // ---- entrance: a recess with light pouring out of it
      var dTop = CANOPY + 9, dH = PAVE - dTop;
      RB.rect(DOOR_X - 26, dTop - 3, 52, dH + 3, P.outline);
      RB.rect(DOOR_X - 22, dTop, 44, dH, RB.mix(P.cream, P.w5, 0.25));
      RB.rect(DOOR_X - 22, dTop, 44, 2, '#fff4d8');
      RB.rect(DOOR_X - 1, dTop, 2, dH, P.w3);
      RB.rect(DOOR_X - 22, dTop, 2, dH, P.w4);
      RB.rect(DOOR_X + 20, dTop, 2, dH, P.w4);
      // Light pouring out onto the pavement.
      RB.ctx.globalAlpha = 0.20;
      OB.slab(DOOR_X - 30, PAVE + 22, 60, 22, P.cream);
      RB.ctx.globalAlpha = 0.09;
      OB.slab(DOOR_X - 42, PAVE + 32, 84, 30, P.w5);
      RB.ctx.globalAlpha = 0.05;
      OB.slab(DOOR_X - 54, PAVE + 40, 108, 38, P.w5);
      RB.ctx.globalAlpha = 1;

      // ---- pavement, kerb, road
      OB.floor(0, RB.W, PAVE, KERB, P.s3);
      OB.box(0, KERB, RB.W, 6, 4, P.s4);
      RB.rect(0, ROAD, RB.W, RB.H - ROAD, P.ink);
      RB.rect(0, ROAD, RB.W, 1, P.outline);
      for (var rx = 0; rx < RB.W; rx += 44) RB.rect(rx, RB.H - 22, 20, 2, P.s1);

      // ---- actors, then the van in front of them
      var list = [];
      if (!driver.hidden) list.push(driver);
      if (!player.hidden) list.push(player);
      list.sort(function (a2, b2) { return a2.y - b2.y; });
      list.forEach(function (a2) { a2.draw(P.blu1, 0.26); });

      if (bag) {
        RB.ctx.fillStyle = 'rgba(0,0,0,0.28)';
        RB.ctx.fillRect(Math.round(bag.x), Math.round(bag.y + 13), 12, 2);
        RB.drawSprite(RB.sprites.bag, bag.x, bag.y, RB.cast.you, false, P.blu1, 0.26);
      }

      drawVan(van, s.doorOpen);

      if (s.showPrompt && !RB.dialog.active()) RB.drawPrompt(DOOR_X, WIN_Y - 22, 'A  enter');
    };

    // The van, in oblique: side face true, roof sheared up-right, nose to the
    // left because that is the way it both arrives and leaves.
    function drawVan(v, open) {
      var P = RB.P, OB = RB.ob;
      var x = Math.round(v.x), y = Math.round(v.y);
      if (x > RB.W + 120 || x < -130) return;

      var body = P.blu2, m = OB.mat(body);
      var glass = P.blu1, gm = OB.mat(glass);

      RB.ctx.fillStyle = 'rgba(0,0,0,0.34)';
      RB.ctx.fillRect(x + 2, y + 42, 88, 5);
      RB.ctx.globalAlpha = 0.09;
      OB.slab(x - 60, y + 34, 62, 16, P.w5);
      RB.ctx.globalAlpha = 1;

      OB.box(x + 2, y + 16, 14, 22, 7, RB.shade(body, -0.16));   // bonnet
      OB.box(x + 10, y + 2, 78, 36, 10, body);                   // body

      // Glazing, one module repeated.
      RB.rect(x + 14, y + 7, 16, 13, gm.front);
      RB.rect(x + 14, y + 7, 16, 1, gm.top);
      [34, 54, 70].forEach(function (gx) {
        RB.rect(x + gx, y + 7, 15, 13, gm.front);
        RB.rect(x + gx, y + 7, 15, 1, gm.top);
      });
      RB.rect(x + 10, y + 22, 78, 1, m.edge);
      RB.rect(x + 10, y + 23, 78, 1, m.side);

      if (open > 0.02) {
        var ow = Math.round(open * 19);
        RB.rect(x + 32, y + 5, ow, 32, P.ink);
        if (ow > 3) {
          RB.rect(x + 33, y + 6, ow - 2, 2, P.w5);
          RB.rect(x + 33, y + 8, ow - 2, 5, P.w2);
          RB.rect(x + 34, y + 15, ow - 4, 16, P.s1);
          RB.rect(x + 33, y + 32, ow - 2, 4, P.w2);
        }
        RB.rect(x + 32 + ow, y + 4, 2, 34, m.deep);
        RB.ctx.globalAlpha = 0.14 * open;
        OB.slab(x + 22, y + 40, 40, 16, P.w5);
        RB.ctx.globalAlpha = 1;
      }

      wheel(x + 24, y + 38, 8);
      wheel(x + 74, y + 38, 8);
      RB.rect(x + 1, y + 22, 5, 6, P.cream);       // headlamp
      RB.rect(x + 88, y + 22, 2, 6, P.red2);       // tail

      function wheel(cx, cy, r) {
        disc(cx, cy, r, P.ink);
        disc(cx, cy, r - 3, P.s2);
        disc(cx, cy, r - 5, P.s1);
      }
      function disc(cx, cy, r, c) {
        if (r <= 0) return;
        for (var dy = -r; dy <= r; dy++) {
          var half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
          if (half > 0) RB.rect(cx - half, cy + dy, half * 2, 1, c);
        }
      }
    }

    return s;
  })();

  // ================================================================= checkin
  // Warm, half-empty, fluorescent. One counter matters; the rest is texture.
  RB.scenes.checkin = (function () {
    var s = { id: 'checkin' };
    var player, npcs, agents, script, roomW = 660, dropped, belt;
    var CEIL = 20, WALL = 66, FLOOR = 84;
    var DESK_X = 320, EXIT_X = 624;

    s.enter = function () {
      RB.audio.bed('lobby');
      player = new RB.Actor({ x: 26, y: FLOOR + 12, pal: RB.cast.you, dir: 'right' });
      player.bag = RB.state.hasBag;
      dropped = false;
      belt = { x: 0, on: false };
      script = null;

      npcs = [
        { a: new RB.Actor({ x: 132, y: FLOOR + 30, pal: RB.cast.elder, dir: 'right', sitting: true }), wander: null, t: 0 },
        { a: new RB.Actor({ x: 214, y: FLOOR + 18, pal: RB.cast.suit, dir: 'right' }), wander: [200, 258], t: 0 },
        { a: new RB.Actor({ x: 452, y: FLOOR + 8, pal: RB.cast.coat, dir: 'left' }), wander: [424, 492], t: 1.4 },
        { a: new RB.Actor({ x: 540, y: FLOOR + 34, pal: RB.cast.student, dir: 'right' }), wander: [516, 578], t: 2.7 }
      ];
      agents = [
        new RB.Actor({ x: DESK_X + 14, y: 48, pal: RB.cast.agent, dir: 'down', shadow: false }),
        new RB.Actor({ x: 470, y: 48, pal: RB.cast.agent, dir: 'down', shadow: false })
      ];
    };

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 660, h: FLOOR }
    ];
    var bounds = { x0: 10, y0: FLOOR, x1: roomW - 22, y1: 134 };

    s.update = function (dt) {
      if (script) { script.update(dt); if (script.done) script = null; }
      if (!script && !RB.dialog.active() && !RB.transitioning()) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);

      npcs.forEach(function (n) {
        n.t += dt;
        if (!n.wander) { n.a.update(dt); return; }
        var span = n.wander[1] - n.wander[0];
        var nx = n.wander[0] + ((Math.sin(n.t * 0.22) + 1) / 2) * span;
        n.a.dir = nx > n.a.x ? 'right' : 'left';
        n.a.moving = Math.abs(nx - n.a.x) > 0.12;
        n.a.x = nx;
        n.a.update(dt);
      });
      agents.forEach(function (g) { g.update(dt); });
      if (belt.on) belt.x += dt * 40;

      var busy = !!script || RB.dialog.active() || RB.transitioning();
      var atDesk = !dropped && RB.state.hasBag && Math.abs(player.x - DESK_X) < 26 && player.y < FLOOR + 16;
      s.prompt = atDesk && !busy;
      if (atDesk && !busy && RB.input.pressed('action')) {
        script = new RB.Script(function* () {
          yield RB.call(function () { player.dir = 'up'; player.moving = false; });
          yield RB.say(['Ticket, please.'], 'Agent');
          yield RB.say(['Thank you, sir.'], 'Agent');
          yield RB.call(function () {
            RB.audio.sfx.scan();
            player.bag = false;
            RB.state.hasBag = false;
            dropped = true;
            belt.on = true;
            belt.x = 0;
          });
          yield RB.wait(1.4);
          yield RB.say(['Gate 14. Enjoy your flight.'], 'Agent');
        });
      }

      var atExit = dropped && !busy && player.x > EXIT_X - 18;
      s.exitPrompt = atExit;
      if (atExit && RB.input.pressed('action')) RB.go('security');
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#1d222f');
      A.ceiling(x0, w, CEIL, '#2b2a35', '#f0dcb0');
      A.hall(x0, w, CEIL, WALL, FLOOR, '#3a3644', P.warm4, 0.15);

      A.board(66, 28, 96, 32, 4);
      A.sign(214, 26, 'BAG DROP', 64, '#1a2740', P.cream);
      A.sign(498, 26, 'SECURITY  >', 74, '#1a2740', P.cream);

      // Baggage belt, set back behind the counter line. Kept low-contrast so
      // it reads as machinery in shadow rather than a stripe across the wall.
      RB.wrect(286, WALL - 12, 160, 9, '#2a2732');
      RB.wrect(286, WALL - 12, 160, 1, '#3c3846');
      for (var bx = 286 + (belt.x % 14); bx < 444; bx += 14) RB.wrect(bx, WALL - 10, 7, 5, '#453f4f');
      RB.wrect(286, WALL - 4, 160, 2, '#221f29');
      if (belt.on && belt.x < 158) {
        RB.drawSprite(RB.sprites.bag, 318 + belt.x, WALL - 21, RB.cast.you, false, '#e0c898', 0.16);
      }
      agents.forEach(function (g) { g.draw('#e0c898', 0.16); });
      A.counter(286, FLOOR, 160, '#d6c4a2', '#5c5468');
      A.counter(452, FLOOR, 92, '#d6c4a2', '#5c5468');
      // Kit on the worktop: a monitor at each position and a bag scale at the
      // drop, so the desk reads as somewhere a person works.
      [318, 372, 484].forEach(function (mx) {
        RB.wrect(mx, WALL - 32, 15, 12, '#2e2b38');
        RB.wrect(mx + 1, WALL - 31, 13, 9, '#4c6b6a');
        RB.wrect(mx + 5, WALL - 20, 5, 2, '#2e2b38');
      });
      RB.wrect(340, WALL - 24, 26, 4, '#6b6478');
      RB.wrect(340, WALL - 24, 26, 1, '#847c92');

      A.floor(x0, w, FLOOR, RB.H, '#4a4557', '#423e4e', P.cream);
      RB.ctx.globalAlpha = 0.07;
      RB.wrect(286, FLOOR, 170, 44, P.warm4);
      RB.ctx.globalAlpha = 1;

      // Pillars sit against the back wall rather than out in the walkway.
      A.pillar(168, FLOOR + 8, 54, '#4e4959');
      A.pillar(430, FLOOR + 8, 54, '#4e4959');
      A.plant(252, FLOOR + 12);
      A.plant(378, FLOOR + 14);
      A.seatRow(104, 116, 4, '#443f50', '#6a5f6e');
      A.seatRow(524, 122, 3, '#443f50', '#6a5f6e');

      A.doorway(EXIT_X, 30, WALL + 14, '#4a5468', 0.10);

      var list = npcs.map(function (n) { return n.a; }).concat([player]);
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (a) { a.draw('#e0c898', 0.16); });

      // One warm pass over everything, which is cheaper and more cohesive
      // than warming twenty individual colours by hand.
      RB.ctx.globalAlpha = 0.07;
      RB.rect(0, 0, RB.W, RB.H, P.warm4);
      RB.ctx.globalAlpha = 1;

      if (!RB.dialog.active()) {
        if (s.prompt) RB.drawPrompt(DESK_X + 6, WALL - 26, 'A  check bag');
        else if (s.exitPrompt) RB.drawPrompt(EXIT_X + 13, 60, 'A  security');
      }
    };

    return s;
  })();

  // ================================================================ security
  // A short queue that moves on its own. You are never asked to hurry it.
  RB.scenes.security = (function () {
    var s = { id: 'security' };
    var player, queue, guard, script, roomW = 580, cleared, flash;
    var CEIL = 18, WALL = 66, FLOOR = 84;
    var ARCH_X = 340, EXIT_X = 546;

    // The line is the point of this room, so it is a real queue: roped into a
    // single lane you cannot walk around, one passport at a time, and you go
    // last. The cadence is deliberately unhurried.
    var SERVE_X = ARCH_X - 26, GAP = 30;
    var LANE_TOP = 100, LANE_BOT = 126, LANE_X0 = 148, LANE_X1 = ARCH_X + 22;
    var PRESENT = 3.4, SHUFFLE = 2.0, CLEAR = 2.0;
    var qPhase, qTimer;

    s.enter = function () {
      RB.audio.bed('hall');
      player = new RB.Actor({ x: 22, y: 102, pal: RB.cast.you, dir: 'right' });
      player.cup = !!RB.state.hasCoffee;
      cleared = false;
      flash = 0;
      script = null;
      qPhase = 'shuffle';
      qTimer = 0;
      s.t = 0;

      queue = [
        new RB.Actor({ x: SERVE_X - 6, y: 98, pal: RB.cast.suit, dir: 'right' }),
        new RB.Actor({ x: SERVE_X - GAP - 8, y: 102, pal: RB.cast.elder, dir: 'right' }),
        new RB.Actor({ x: SERVE_X - GAP * 2 - 10, y: 106, pal: RB.cast.kid, dir: 'right' })
      ];
      guard = new RB.Actor({ x: ARCH_X + 6, y: 96, pal: RB.cast.guard, dir: 'left' });
    };

    s.p = function () { return player; };
    s.dbg = function () { return { queued: queue.filter(function (a) { return !a.hidden; }).length, cleared: cleared, phase: qPhase, px: Math.round(player.x), py: Math.round(player.y) }; };

    var walls = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 580, h: FLOOR },
      // The rope lane. Without these you can simply walk round the queue.
      { x: LANE_X0, y: FLOOR, w: LANE_X1 - LANE_X0, h: LANE_TOP - FLOOR },
      { x: LANE_X0, y: LANE_BOT, w: LANE_X1 - LANE_X0, h: 30 }
    ];
    var bounds = { x0: 10, y0: 86, x1: roomW - 22, y1: 132 };

    s.update = function (dt) {
      s.t += dt;
      qTimer += dt;
      if (script) { script.update(dt); if (script.done) script = null; }
      if (flash > 0) flash -= dt * 2;

      var live = queue.filter(function (a) { return !a.hidden; });

      // One person at the desk at a time: shuffle up, hand it over, move on.
      if (live.length) {
        if (qPhase === 'shuffle' && qTimer > SHUFFLE) { qPhase = 'present'; qTimer = 0; }
        else if (qPhase === 'present' && qTimer > PRESENT) {
          qPhase = 'clear'; qTimer = 0; RB.audio.sfx.scan(); flash = 1;
        } else if (qPhase === 'clear' && qTimer > CLEAR) {
          live[0].hidden = true; qPhase = 'shuffle'; qTimer = 0;
        }
      }

      for (var i = 0; i < live.length; i++) {
        var q = live[i];
        var tx = (i === 0 && qPhase === 'clear') ? ARCH_X + 52 : SERVE_X - i * GAP;
        q.dir = 'right';
        q.moving = Math.abs(tx - q.x) > 0.6;
        q.x += (tx - q.x) * Math.min(1, dt * 1.8);
        // The person at the desk turns to face the officer.
        if (i === 0 && qPhase === 'present') { q.dir = 'right'; q.moving = false; }
        q.update(dt);
      }
      guard.dir = 'left';
      guard.update(dt);

      // Anyone still in the line is solid, so you queue behind them.
      var solids = walls.slice();
      for (var j = 0; j < live.length; j++) {
        solids.push({ x: live[j].x + 2, y: live[j].y + 6, w: 13, h: 18 });
      }
      // The desk itself is closed until you have been seen. Without this you
      // can walk straight through in the gap after the person in front leaves.
      if (!cleared) solids.push({ x: ARCH_X - 16, y: FLOOR, w: 32, h: 62 });

      var busy = !!script || RB.dialog.active() || RB.transitioning();
      if (!busy) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);

      // Your turn only once the line in front of you has gone.
      var yourTurn = live.length === 0 && !cleared;
      var atArch = yourTurn && !busy && Math.abs(player.x - SERVE_X) < 22;
      s.prompt = atArch;
      s.waiting = !cleared && live.length > 0;
      if (atArch && RB.input.pressed('action')) {
        script = new RB.Script(function* () {
          yield RB.call(function () { player.dir = 'right'; player.moving = false; });
          yield RB.say(['Passport, please.'], 'Officer');
          yield RB.wait(1.4);
          yield RB.call(function () { RB.audio.sfx.scan(); flash = 1; });
          yield RB.wait(1.0);
          yield RB.say(['Thank you.'], 'Officer');
          yield RB.call(function () { player.moving = true; });
          yield RB.tween(player, 'x', ARCH_X + 34, 2.0, 'inOut');
          yield RB.call(function () { player.moving = false; cleared = true; });
        });
      }

      var atExit = cleared && !busy && player.x > EXIT_X - 18;
      s.exitPrompt = atExit;
      if (atExit && RB.input.pressed('action')) RB.go('coffee', { fade: 1.6 });
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#1b2130');
      A.ceiling(x0, w, CEIL, '#212736', '#dfe6f0');
      A.hall(x0, w, CEIL, WALL, FLOOR, '#252c3d', P.steel3, 0.055);

      A.sign(140, 26, 'SECURITY', 58, '#1a2740', P.cream);
      A.sign(444, 26, 'GATES  1 - 24  >', 96, '#1a2740', P.cream);

      RB.wrect(ARCH_X + 44, WALL - 6, 104, 6, '#39445c');
      RB.wrect(ARCH_X + 44, WALL, 104, 5, '#1b2230');
      for (var bx = ARCH_X + 44 + ((s.t * 22) % 12); bx < ARCH_X + 148; bx += 12) RB.wrect(bx, WALL - 5, 6, 4, '#4a5670');
      RB.wrect(ARCH_X + 60, WALL - 22, 40, 16, '#2e3648');
      RB.wrect(ARCH_X + 62, WALL - 20, 36, 12, '#161d2c');

      A.floor(x0, w, FLOOR, RB.H, '#333a52', '#2e344a', P.white);

      // The lane, drawn as the rope it collides as.
      A.queueLine(LANE_X0, LANE_TOP - 12, 7, 30);
      A.queueLine(LANE_X0, LANE_BOT, 7, 30);

      // Podium the officer stands behind.
      RB.wrect(ARCH_X - 4, 104, 22, 14, '#4a5468');
      RB.wrect(ARCH_X - 4, 102, 22, 3, '#6c7488');

      RB.wrect(ARCH_X - 18, WALL - 26, 7, FLOOR - WALL + 32, '#8fa0bb');
      RB.wrect(ARCH_X + 12, WALL - 26, 7, FLOOR - WALL + 32, '#8fa0bb');
      RB.wrect(ARCH_X - 18, WALL - 32, 37, 7, '#a8b6cc');
      RB.wrect(ARCH_X - 18, WALL - 32, 37, 1, P.white);
      if (flash > 0) {
        RB.ctx.globalAlpha = 0.32 * flash;
        RB.wrect(ARCH_X - 12, WALL - 26, 25, FLOOR - WALL + 30, P.green);
        RB.ctx.globalAlpha = 1;
      }

      A.doorway(EXIT_X, 28, WALL + 16, '#4a5468', 0.12);

      var list = queue.filter(function (a) { return !a.hidden; });
      list.push(guard, player);
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (a) { a.draw(P.steel3, 0.07); });

      // A passport changing hands, at the moment it changes hands.
      var live = queue.filter(function (a) { return !a.hidden; });
      if (qPhase === 'present' && live.length) {
        var hx = live[0].x + 14, hy = live[0].y + 4;
        RB.wrect(hx, hy, 5, 4, '#2a3f6a');
        RB.wrect(hx, hy, 5, 1, '#4a63a0');
      }

      if (!RB.dialog.active()) {
        if (s.prompt) RB.drawPrompt(SERVE_X + 6, WALL - 44, 'A  passport');
        else if (s.exitPrompt) RB.drawPrompt(EXIT_X + 13, 58, 'A  to the gates');
      }
    };

    return s;
  })();

  // ================================================================== coffee
  // A kiosk on the way to the gates. Buying is optional; the game will not
  // stop you walking past, and it will not congratulate you either way.
  RB.scenes.coffee = (function () {
    var s = { id: 'coffee' };
    var player, barista, sitters, script, roomW = 600, bought;
    var CEIL = 18, WALL = 66, FLOOR = 84;
    var KIOSK_X = 300, EXIT_X = 566;
    var steam = 0;

    s.enter = function () {
      RB.audio.bed('lobby');
      player = new RB.Actor({ x: 22, y: FLOOR + 20, pal: RB.cast.you, dir: 'right' });
      player.cup = RB.state.hasCoffee;
      bought = !!RB.state.hasCoffee;
      script = null;
      steam = 0;

      barista = new RB.Actor({ x: KIOSK_X + 30, y: 48, pal: RB.cast.barista, dir: 'down', shadow: false });
      // Two people already sitting with theirs. Nobody is in a hurry here.
      sitters = [
        new RB.Actor({ x: 158, y: FLOOR + 22, pal: RB.cast.elder, dir: 'right', sitting: true }),
        new RB.Actor({ x: 462, y: FLOOR + 28, pal: RB.cast.student, dir: 'left', sitting: true })
      ];
    };

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 600, h: FLOOR }
    ];
    var bounds = { x0: 10, y0: FLOOR, x1: roomW - 22, y1: 134 };

    s.update = function (dt) {
      steam += dt;
      if (script) { script.update(dt); if (script.done) script = null; }
      var busy = !!script || RB.dialog.active() || RB.transitioning();
      if (!busy) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);
      barista.update(dt);
      sitters.forEach(function (a) { a.update(dt); });

      // Generous: the kiosk is optional, so it must at least be noticeable to
      // someone walking straight through at the height they spawned at.
      var atKiosk = !bought && !busy && Math.abs(player.x - KIOSK_X) < 34 && player.y < FLOOR + 34;
      s.prompt = atKiosk;
      if (atKiosk && RB.input.pressed('action')) {
        script = new RB.Script(function* () {
          yield RB.call(function () { player.dir = 'up'; player.moving = false; });
          yield RB.say(['Coffee, please.'], 'You');
          yield RB.wait(1.1);
          yield RB.call(function () { RB.audio.sfx.belt(); });
          yield RB.wait(1.3);
          yield RB.say(['Thank you, sir.'], 'Barista');
          yield RB.call(function () {
            bought = true;
            RB.state.hasCoffee = true;
            RB.state.cupLevel = 1;
            player.cup = true;
          });
          yield RB.captionFor('Too hot to drink yet.', 4.2, 128);
        });
      }

      var atExit = !busy && player.x > EXIT_X - 18;
      s.exitPrompt = atExit;
      if (atExit && RB.input.pressed('action')) RB.go('gate', { fade: 1.8 });
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#231f2c');
      A.ceiling(x0, w, CEIL, '#2a2732', '#f0dcb0');
      A.hall(x0, w, CEIL, WALL, FLOOR, '#3a3040', P.warm4, 0.16);

      A.sign(96, 26, 'GATES  1 - 24  >', 96, '#1a2740', P.cream);

      // Menu board over the counter — deliberately unreadable at this size.
      RB.wrect(250, 22, 108, 24, '#241c1a');
      RB.wrect(250, 22, 108, 1, '#4a3a30');
      for (var r = 0; r < 4; r++) {
        RB.wrect(256, 26 + r * 5, 44 + (r % 3) * 12, 2, RB.mix(P.cream, '#241c1a', 0.35));
        RB.wrect(340, 26 + r * 5, 12, 2, RB.mix(P.amber, '#241c1a', 0.3));
      }

      // Back bar: grinder, urns, a shelf of cups.
      RB.wrect(262, WALL - 20, 16, 20, '#5a5060');
      RB.wrect(264, WALL - 24, 12, 5, '#6e6376');
      RB.wrect(330, WALL - 16, 22, 16, '#7a6f82');
      RB.wrect(330, WALL - 16, 22, 2, '#9a8ea2');
      for (var c = 0; c < 5; c++) RB.wrect(292 + c * 7, WALL - 8, 5, 7, '#d8cfc0');

      barista.draw('#e0c898', 0.16);
      A.counter(250, FLOOR, 116, '#8a6a4a', '#4a3a34');

      // Espresso machine on the worktop, with steam.
      RB.wrect(268, FLOOR - 36, 30, 16, '#9aa2b0');
      RB.wrect(268, FLOOR - 36, 30, 2, '#c2c8d4');
      RB.wrect(272, FLOOR - 32, 8, 7, '#3a4050');
      RB.wrect(286, FLOOR - 32, 8, 7, '#3a4050');
      RB.wrect(268, FLOOR - 22, 30, 2, '#6f7684');
      RB.ctx.globalAlpha = 0.22;
      for (var st = 0; st < 3; st++) {
        var sy = FLOOR - 40 - ((steam * 9 + st * 6) % 16);
        RB.wrect(280 + Math.sin(steam * 2 + st) * 2, sy, 2, 3, P.white);
      }
      RB.ctx.globalAlpha = 1;

      A.floor(x0, w, FLOOR, RB.H, '#4a4252', '#423b49', P.cream);
      RB.ctx.globalAlpha = 0.07;
      RB.wrect(250, FLOOR, 130, 44, P.warm4);
      RB.ctx.globalAlpha = 1;

      // Two little cafe tables.
      [[132, 116], [436, 122]].forEach(function (t) {
        RB.wrect(t[0], t[1], 28, 3, '#6a5545');
        RB.wrect(t[0], t[1], 28, 1, '#8a7060');
        RB.wrect(t[0] + 12, t[1] + 3, 4, 10, '#4a3c32');
        RB.wrect(t[0] + 8, t[1] + 13, 12, 2, '#4a3c32');
        RB.drawSprite(RB.sprites.cup, t[0] + 16, t[1] - 8, RB.cast.you);
      });
      A.plant(212, FLOOR + 14);
      A.plant(410, FLOOR + 18);

      A.doorway(EXIT_X, 28, WALL + 16, '#4a5468', 0.12);

      var list = sitters.concat([player]);
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (a) { a.draw('#e0c898', 0.14); });

      RB.ctx.globalAlpha = 0.06;
      RB.rect(0, 0, RB.W, RB.H, P.warm4);
      RB.ctx.globalAlpha = 1;

      if (!RB.dialog.active()) {
        if (s.prompt) RB.drawPrompt(KIOSK_X + 6, WALL - 44, 'A  coffee');
        else if (s.exitPrompt) RB.drawPrompt(EXIT_X + 13, 58, 'A  to the gates');
      }
    };

    return s;
  })();
})(window.RB = window.RB || {});
