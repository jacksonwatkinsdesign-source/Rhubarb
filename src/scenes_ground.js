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
    crew:    RB.pal({ hair: '#2b2320', skin: '#f0c090', shirt: '#263c74', pants: '#1a2646', tie: '#c04048' })
  };

  // ===================================================================== curb
  // Night. A van pulls in, a driver does you a small kindness, and leaves.
  // The player has no control until it's over — this is the one moment in
  // the level that is purely watched.
  RB.scenes.curb = (function () {
    var s = { id: 'curb' };
    var player, driver, van, bag, script, ready;

    // Composition is built around the dialogue box: everything that matters
    // lives between the sky and the kerb, and the road below is left empty.
    var FACADE = 46, WIN_Y = 58, PAVE = 94, KERB = 114, ROAD = 117;
    var VAN_Y = 114;
    var STAND = 82;            // sprite y for someone standing on the pavement
    var DOOR_X = 156;

    // Fixed, deterministic lit-window pattern. A real pseudorandom mask is
    // the difference between a terminal at 4am and a row of gold bricks.
    var WINDOWS = [];
    (function () {
      var seed = 90210;
      function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      for (var x = 4; x < 240; x += 13) {
        WINDOWS.push({ x: x, lit: rnd() > 0.42, warm: rnd() });
      }
    })();

    s.enter = function () {
      RB.audio.bed('night');
      RB.state.hasBag = false;

      van = { x: 300, y: VAN_Y };
      s.doorOpen = 0;
      player = new RB.Actor({ x: 134, y: STAND, pal: RB.cast.you, dir: 'down' });
      player.hidden = true;
      driver = new RB.Actor({ x: 176, y: STAND, pal: RB.cast.driver, dir: 'left' });
      driver.hidden = true;
      bag = null;
      ready = false;
      s.showPrompt = false;

      script = new RB.Script(function* () {
        yield RB.wait(1.2);
        yield RB.captionFor('Somewhere before five in the morning.', 3.6, 24);
        yield RB.tween(van, 'x', 88, 3.4, 'outQuint');
        yield RB.wait(0.9);
        yield RB.call(function () {
          RB.audio.sfx.door();
          driver.hidden = false; driver.x = 176; driver.y = STAND;
          driver.moving = true; driver.dir = 'left';
        });
        // Round the front of the van to your door.
        yield RB.tween(driver, 'x', 146, 1.7, 'inOut');
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; });
        yield RB.wait(0.4);
        yield RB.call(function () { RB.audio.sfx.door(); });
        yield RB.tween(s, 'doorOpen', 1, 0.8, 'out');
        yield RB.wait(0.5);
        // You climb out and step up onto the pavement.
        yield RB.call(function () {
          player.hidden = false; player.x = 130; player.y = 100;
          player.dir = 'up'; player.moving = true;
        });
        yield RB.tween(player, 'y', STAND, 1.5, 'out');
        yield RB.call(function () { player.moving = false; player.dir = 'down'; });
        yield RB.wait(0.7);
        // Back for the luggage.
        yield RB.call(function () { driver.moving = true; driver.dir = 'right'; });
        yield RB.tween(driver, 'x', 184, 1.7, 'inOut');
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; RB.audio.sfx.door(); });
        yield RB.wait(0.9);
        yield RB.call(function () { bag = { x: 186, y: STAND + 8 }; });
        yield RB.call(function () { driver.moving = true; driver.dir = 'left'; });
        yield RB.tweenAll([RB.tween(driver, 'x', 144, 1.8, 'inOut'), RB.tween(bag, 'x', 146, 1.8, 'inOut')]);
        yield RB.call(function () { driver.moving = false; driver.dir = 'down'; });
        yield RB.wait(0.5);
        yield RB.say(['Here you are, sir.'], 'Driver', { top: true });
        yield RB.wait(0.6);
        yield RB.call(function () { driver.moving = true; driver.dir = 'right'; });
        yield RB.tween(driver, 'x', 180, 2.0, 'inOut');
        yield RB.call(function () { driver.hidden = true; RB.audio.sfx.door(); });
        yield RB.tween(s, 'doorOpen', 0, 0.5, 'in');
        yield RB.wait(0.7);
        yield RB.call(function () {
          bag = null;
          RB.state.hasBag = true;
          player.bag = true;
          ready = true;
        });
        // You get the controls back while the van is still pulling away.
        yield RB.tween(van, 'x', -110, 5.5, 'in');
        yield RB.captionFor('The doors are open. There is no hurry.', 5.0, 22);
      });
    };

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 22, h: 200 },
      { x: 238, y: 0, w: 22, h: 200 }
    ];
    var bounds = { x0: 10, y0: 74, x1: 218, y1: 96 };

    s.update = function (dt) {
      script.update(dt);
      if (ready && !RB.dialog.active() && !RB.transitioning()) {
        RB.walk(player, dt, solids, bounds);
        var near = Math.abs(player.x - DOOR_X) < 20 && player.y < 90;
        s.showPrompt = near;
        if (near && RB.input.pressed('action')) {
          RB.audio.sfx.door();
          RB.go('checkin');
        }
      }
      driver.update(dt);
    };

    s.draw = function () {
      // Sky.
      RB.vgrad(0, 0, RB.W, FACADE + 2, A.skyRamp('night'), 8);
      A.stars(0, RB.W, 2, FACADE - 4, 0.85);

      // Terminal facade.
      RB.rect(0, FACADE, RB.W, 4, '#0f1425');
      RB.rect(0, FACADE + 4, RB.W, PAVE - FACADE - 4, '#1a2136');
      RB.rect(0, FACADE + 4, RB.W, 1, '#28304a');

      // Window band — mostly dark, a few lit, warm pools beneath the lit ones.
      RB.rect(0, WIN_Y - 2, RB.W, 22, '#151b2c');
      for (var i = 0; i < WINDOWS.length; i++) {
        var wnd = WINDOWS[i];
        if (wnd.x > RB.W - 6) continue;
        var c = wnd.lit ? RB.mix('#c9b184', '#e0cb9c', wnd.warm) : '#222a42';
        RB.rect(wnd.x, WIN_Y, 9, 16, c);
        RB.rect(wnd.x, WIN_Y, 9, 1, wnd.lit ? '#e8d8b0' : '#2a3350');
        if (wnd.lit) {
          RB.ctx.globalAlpha = 0.07;
          RB.rect(wnd.x - 3, WIN_Y + 16, 15, 8, P.warm4);
          RB.ctx.globalAlpha = 1;
        }
      }
      RB.rect(0, WIN_Y + 20, RB.W, 2, '#101627');
      RB.rect(0, WIN_Y + 22, RB.W, PAVE - WIN_Y - 22, '#161d30');

      A.sign(76, 26, 'DEPARTURES', 88, '#0d1322', P.cream);

      // The entrance: the brightest thing on screen, which is the whole point.
      RB.rect(DOOR_X - 20, 64, 40, PAVE - 64, '#0c1120');
      RB.rect(DOOR_X - 18, 66, 36, PAVE - 66, '#d8c49a');
      RB.rect(DOOR_X - 1, 66, 2, PAVE - 66, '#8a7a5e');
      RB.rect(DOOR_X - 18, 66, 36, 1, '#f0e2c0');
      RB.ctx.globalAlpha = 0.14;
      RB.rect(DOOR_X - 28, PAVE, 56, 20, P.warm4);
      RB.ctx.globalAlpha = 0.07;
      RB.rect(DOOR_X - 38, PAVE, 76, 26, P.warm4);
      RB.ctx.globalAlpha = 1;

      // Pavement, kerb, road.
      RB.rect(0, PAVE, RB.W, KERB - PAVE, '#2a3145');
      RB.rect(0, PAVE, RB.W, 1, '#38415a');
      for (var px = 0; px < RB.W; px += 22) RB.rect(px, PAVE, 1, KERB - PAVE, '#252c3f');
      RB.rect(0, KERB, RB.W, 3, '#3c4459');
      RB.rect(0, ROAD, RB.W, RB.H - ROAD, '#141a29');
      RB.rect(0, ROAD, RB.W, 1, '#1d2437');
      for (var rx = 0; rx < RB.W; rx += 34) RB.rect(rx, 146, 16, 2, '#1f2739');

      // Actors first, then the van over them — anyone on the pavement is
      // behind it, which is what puts the van at the kerb rather than on it.
      var list = [];
      if (!driver.hidden) list.push(driver);
      if (!player.hidden) list.push(player);
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (a) { a.draw(P.night1, 0.28); });

      if (bag) {
        RB.ctx.fillStyle = 'rgba(0,0,0,0.28)';
        RB.ctx.fillRect(Math.round(bag.x), Math.round(bag.y + 10), 8, 2);
        RB.drawSprite(RB.sprites.bag, bag.x, bag.y, RB.cast.you, false, P.night1, 0.28);
      }

      drawVan(van, s.doorOpen);

      if (s.showPrompt && !RB.dialog.active()) RB.drawPrompt(DOOR_X, 54, 'Z  enter');
    };

    function drawVan(v, open) {
      var x = Math.round(v.x), y = Math.round(v.y);
      if (x > RB.W + 90 || x < -100) return;
      var body = '#3d4a63', dark = '#26304a', glass = '#141c30';

      RB.ctx.fillStyle = 'rgba(0,0,0,0.32)';
      RB.ctx.fillRect(x - 2, y + 30, 82, 4);
      // Headlight throw down the road.
      RB.ctx.globalAlpha = 0.09;
      RB.rect(x - 48, y + 14, 50, 14, P.warm4);
      RB.ctx.globalAlpha = 0.05;
      RB.rect(x - 78, y + 16, 34, 11, P.warm4);
      RB.ctx.globalAlpha = 1;

      RB.rect(x + 2, y + 1, 56, 7, body);           // roof
      RB.rect(x + 2, y + 1, 56, 1, RB.shade(body, 0.3));
      RB.rect(x, y + 7, 78, 22, body);
      RB.rect(x, y + 7, 78, 1, RB.shade(body, 0.18));
      RB.rect(x + 4, y + 3, 20, 10, glass);         // windscreen
      RB.rect(x + 28, y + 3, 16, 10, open > 0.5 ? '#c9b184' : glass);
      RB.rect(x + 48, y + 3, 14, 10, glass);
      RB.rect(x, y + 25, 78, 4, dark);
      RB.rect(x, y + 7, 1, 22, RB.shade(body, -0.35));

      if (open > 0.02) {
        var w = Math.round(2 + open * 13);
        RB.rect(x + 28, y + 7, w, 22, RB.shade(body, -0.28));
        RB.rect(x + 28, y + 7, 1, 22, P.black);
        RB.ctx.globalAlpha = 0.13 * open;
        RB.rect(x + 20, y + 24, 30, 12, P.warm4);
        RB.ctx.globalAlpha = 1;
      }

      RB.rect(x + 8, y + 27, 13, 7, P.black);
      RB.rect(x + 57, y + 27, 13, 7, P.black);
      RB.rect(x + 10, y + 28, 9, 5, '#333c52');
      RB.rect(x + 59, y + 28, 9, 5, '#333c52');
      RB.rect(x - 2, y + 15, 3, 5, '#f4e6b8');      // headlamp
      RB.rect(x + 77, y + 15, 2, 4, P.red);
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
        if (s.prompt) RB.drawPrompt(DESK_X + 6, WALL - 26, 'Z  check bag');
        else if (s.exitPrompt) RB.drawPrompt(EXIT_X + 13, 60, 'Z  security');
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

    s.enter = function () {
      RB.audio.bed('hall');
      player = new RB.Actor({ x: 22, y: FLOOR + 24, pal: RB.cast.you, dir: 'right' });
      cleared = false;
      flash = 0;
      script = null;
      s.t = 0;

      queue = [
        { a: new RB.Actor({ x: 262, y: FLOOR + 14, pal: RB.cast.suit, dir: 'right' }), goal: 262 },
        { a: new RB.Actor({ x: 226, y: FLOOR + 22, pal: RB.cast.elder, dir: 'right' }), goal: 226 },
        { a: new RB.Actor({ x: 190, y: FLOOR + 30, pal: RB.cast.kid, dir: 'right' }), goal: 190 }
      ];
      guard = new RB.Actor({ x: ARCH_X + 40, y: FLOOR + 6, pal: RB.cast.guard, dir: 'left' });
    };

    s.p = function () { return player; };

    var solids = [
      { x: -20, y: 0, w: 24, h: 300 },
      { x: 0, y: 0, w: 580, h: FLOOR }
    ];
    var bounds = { x0: 10, y0: FLOOR, x1: roomW - 22, y1: 134 };

    s.update = function (dt) {
      s.t += dt;
      if (script) { script.update(dt); if (script.done) script = null; }
      if (!script && !RB.dialog.active() && !RB.transitioning()) RB.walk(player, dt, solids, bounds);
      RB.camFollow(player.x, roomW, dt);
      if (flash > 0) flash -= dt * 2;

      var advance = Math.min(3, Math.floor(s.t / 3.2));
      queue.forEach(function (q) {
        var target = q.goal + advance * 36;
        if (target > ARCH_X + 44) { q.a.hidden = true; return; }
        q.a.moving = Math.abs(target - q.a.x) > 0.4;
        q.a.x += (target - q.a.x) * Math.min(1, dt * 2.2);
        q.a.dir = 'right';
        q.a.update(dt);
      });
      guard.update(dt);

      var busy = !!script || RB.dialog.active() || RB.transitioning();
      var atArch = !cleared && !busy && Math.abs(player.x - ARCH_X) < 16;
      s.prompt = atArch;
      if (atArch && RB.input.pressed('action')) {
        script = new RB.Script(function* () {
          yield RB.call(function () { player.dir = 'right'; player.moving = true; });
          yield RB.tween(player, 'x', ARCH_X + 30, 1.6, 'inOut');
          yield RB.call(function () { player.moving = false; RB.audio.sfx.belt(); flash = 1; });
          yield RB.say(['Passport, please.'], 'Officer');
          yield RB.wait(0.7);
          yield RB.say(['Thank you.'], 'Officer');
          yield RB.call(function () { cleared = true; });
        });
      }

      var atExit = cleared && !busy && player.x > EXIT_X - 18;
      s.exitPrompt = atExit;
      if (atExit && RB.input.pressed('action')) RB.go('gate', { fade: 1.8 });
    };

    s.draw = function () {
      var x0 = RB.cam.x - 8, w = RB.W + 16;
      RB.clear('#1b2130');
      A.ceiling(x0, w, CEIL, '#212736', '#dfe6f0');
      A.hall(x0, w, CEIL, WALL, FLOOR, '#252c3d', P.steel3, 0.055);

      A.sign(140, 26, 'SECURITY', 58, '#1a2740', P.cream);
      A.sign(444, 26, 'GATES  1 - 24  >', 96, '#1a2740', P.cream);

      // X-ray belt against the wall, running the whole width of the lane.
      RB.wrect(ARCH_X + 44, WALL - 6, 104, 6, '#39445c');
      RB.wrect(ARCH_X + 44, WALL, 104, 5, '#1b2230');
      for (var bx = ARCH_X + 44 + ((s.t * 22) % 12); bx < ARCH_X + 148; bx += 12) RB.wrect(bx, WALL - 5, 6, 4, '#4a5670');
      RB.wrect(ARCH_X + 60, WALL - 22, 40, 16, '#2e3648');
      RB.wrect(ARCH_X + 62, WALL - 20, 36, 12, '#161d2c');

      A.floor(x0, w, FLOOR, RB.H, '#333a52', '#2e344a', P.white);
      A.queueLine(150, 116, 6, 32);

      // Scanner arch.
      RB.wrect(ARCH_X - 18, WALL - 26, 7, FLOOR - WALL + 32, '#8fa0bb');
      RB.wrect(ARCH_X + 12, WALL - 26, 7, FLOOR - WALL + 32, '#8fa0bb');
      RB.wrect(ARCH_X - 18, WALL - 32, 37, 7, '#a8b6cc');
      RB.wrect(ARCH_X - 18, WALL - 32, 37, 1, P.white);
      RB.wrect(ARCH_X - 18, WALL - 26, 7, 1, '#c4cede');
      if (flash > 0) {
        RB.ctx.globalAlpha = 0.32 * flash;
        RB.wrect(ARCH_X - 12, WALL - 26, 25, FLOOR - WALL + 30, P.green);
        RB.ctx.globalAlpha = 1;
      }

      A.doorway(EXIT_X, 28, WALL + 16, '#4a5468', 0.12);

      var list = queue.map(function (q) { return q.a; }).filter(function (a) { return !a.hidden; });
      list.push(guard, player);
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (a) { a.draw(P.steel3, 0.07); });

      if (!RB.dialog.active()) {
        if (s.prompt) RB.drawPrompt(ARCH_X, WALL - 44, 'Z  step through');
        else if (s.exitPrompt) RB.drawPrompt(EXIT_X + 13, 58, 'Z  to the gates');
      }
    };

    return s;
  })();
})(window.RB = window.RB || {});
