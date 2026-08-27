// sprites.js — 20x32 characters, drawn to sit in an oblique world.
//
// Rows are authored as run-length segments ("6. 8t 6.") and expanded, because
// hand-counting twenty characters per row across ninety-odd rows is how you
// get a sprite that is sheared by one pixel and impossible to spot by eye.
//
// Light comes from the top-left, matching the module kit: left edges take the
// light tone, right edges take the shade.
//
// Keys: . clear  t outline
//       d hair-dark  h hair  H hair-light
//       k skin  K skin-shade  f skin-light
//       e eye  q eye-white
//       s shirt  S shirt-shade  L shirt-light
//       w collar  c tie
//       p trousers  P trouser-shade  A trouser-light
//       o shoe  O shoe-light
(function (RB) {
  'use strict';

  var W = 20, H = 32;

  function R(spec) {
    var out = '';
    spec.split(' ').forEach(function (seg) {
      var n = parseInt(seg, 10);
      out += seg.slice(String(n).length).repeat(n);
    });
    return out;
  }
  function S(rows) { return rows.map(R); }

  // ------------------------------------------------------------------ down
  // Twelve pixels across the skull, ten across the body. The previous pass
  // was sixteen and fourteen, which is genuinely fat next to the real thing —
  // a Pokemon or Battle Network overworld sprite is narrow for its height,
  // and the slimness is most of what stops it reading as a block.
  var HEAD_DOWN = [
    '8. 4t 8.',
    '6. 2t 4d 2t 6.',
    '5. 1t 8d 1t 5.',
    '4. 1t 10d 1t 4.',
    '4. 1t 1d 3H 2d 3H 1d 1t 4.',
    '4. 1t 1h 2d 6k 1h 1t 4.',
    '4. 1t 1h 8k 1h 1t 4.',
    '4. 1t 1h 8k 1h 1t 4.',
    '4. 1t 1h 1k 2e 2k 2e 1k 1h 1t 4.',
    '4. 1t 1h 1k 1q 1e 2k 1e 1q 1k 1h 1t 4.',
    '4. 1t 1h 8k 1h 1t 4.',
    '4. 1t 1h 1f 2k 2K 2k 1f 1h 1t 4.',
    '5. 1t 1h 6k 1h 1t 5.',
    '6. 1t 6k 1t 6.',
    '7. 1t 4K 1t 7.'
  ];
  var TORSO_DOWN = [
    '5. 1t 1L 2s 2w 2s 1S 1t 5.',
    '4. 1t 1L 2s 1w 2c 1w 2s 1S 1t 4.',
    '4. 1t 1L 3s 2c 3s 1S 1t 4.',
    '3. 1t 1k 1L 3s 2c 3s 1S 1k 1t 3.',
    '3. 1t 1k 1L 3s 2c 3s 1S 1k 1t 3.',
    '3. 1t 1k 1L 8s 1S 1k 1t 3.',
    '4. 1t 1L 8s 1S 1t 4.',
    '4. 1t 10s 1t 4.',
    '4. 1t 10s 1t 4.',
    '4. 1t 10s 1t 4.'
  ];
  var LEGS_IDLE = [
    '4. 1t 4p 2t 4p 1t 4.',
    '4. 1t 1A 2p 1P 2t 1A 2p 1P 1t 4.',
    '4. 1t 1A 2p 1P 2t 1A 2p 1P 1t 4.',
    '4. 1t 4P 2t 4P 1t 4.',
    '4. 1t 4o 2t 4o 1t 4.',
    '4. 1t 1O 3o 2t 1O 3o 1t 4.',
    '4. 5t 2. 5t 4.'
  ];
  var LEGS_A = [
    '4. 1t 4p 2t 4p 1t 4.',
    '4. 1t 1A 4p 2t 1A 2p 1t 4.',
    '4. 1t 1A 4p 2t 1A 2p 1t 4.',
    '4. 1t 5P 2t 3P 1t 4.',
    '4. 1t 5o 2t 3o 1t 4.',
    '4. 1t 1O 4o 2t 1O 2o 1t 4.',
    '4. 6t 2. 4t 4.'
  ];
  var LEGS_B = [
    '4. 1t 4p 2t 4p 1t 4.',
    '4. 1t 1A 2p 2t 1A 4p 1t 4.',
    '4. 1t 1A 2p 2t 1A 4p 1t 4.',
    '4. 1t 3P 2t 5P 1t 4.',
    '4. 1t 3o 2t 5o 1t 4.',
    '4. 1t 1O 2o 2t 1O 4o 1t 4.',
    '4. 4t 2. 6t 4.'
  ];

  // -------------------------------------------------------------------- up
  var HEAD_UP = [
    '8. 4t 8.',
    '6. 2t 4d 2t 6.',
    '5. 1t 8d 1t 5.',
    '4. 1t 10d 1t 4.',
    '4. 1t 1d 3H 2d 3H 1d 1t 4.',
    '4. 1t 10h 1t 4.',
    '4. 1t 10h 1t 4.',
    '4. 1t 10h 1t 4.',
    '4. 1t 10h 1t 4.',
    '4. 1t 10h 1t 4.',
    '4. 1t 10h 1t 4.',
    '5. 1t 8h 1t 5.',
    '5. 1t 8d 1t 5.',
    '6. 1t 6d 1t 6.',
    '7. 1t 4K 1t 7.'
  ];
  var TORSO_UP = [
    '5. 1t 1L 6s 1S 1t 5.',
    '4. 1t 1L 8s 1S 1t 4.',
    '4. 1t 1L 8s 1S 1t 4.',
    '3. 1t 1k 1L 8s 1S 1k 1t 3.',
    '3. 1t 1k 1L 8s 1S 1k 1t 3.',
    '3. 1t 1k 1L 8s 1S 1k 1t 3.',
    '4. 1t 1L 8s 1S 1t 4.',
    '4. 1t 10s 1t 4.',
    '4. 1t 10s 1t 4.',
    '4. 1t 10s 1t 4.'
  ];

  // ------------------------------------------------------------------ side
  var HEAD_SIDE = [
    '7. 4t 9.',
    '5. 2t 4d 2t 7.',
    '4. 1t 8d 1t 6.',
    '3. 1t 10d 1t 5.',
    '3. 1t 1d 4H 3d 2k 1t 5.',
    '3. 1t 6h 4k 1t 5.',
    '3. 1t 5h 5k 1t 5.',
    '3. 1t 4h 6k 1t 5.',
    '3. 1t 4h 1k 2e 3k 1t 5.',
    '3. 1t 4h 1k 1q 1e 3k 1t 5.',
    '3. 1t 4h 6k 1t 5.',
    '3. 1t 3h 1f 2k 2K 2k 1t 5.',
    '4. 1t 8k 1t 6.',
    '5. 1t 6k 1t 7.',
    '6. 1t 4K 1t 8.'
  ];
  var TORSO_SIDE = [
    '5. 1t 1L 4s 2w 1S 1t 5.',
    '4. 1t 1L 6s 1c 1S 1t 5.',
    '4. 1t 1L 7s 1S 1t 5.',
    '4. 1t 1L 7s 1S 1t 1k 4.',
    '4. 1t 1L 7s 1S 1t 1k 4.',
    '4. 1t 1L 7s 1S 1t 5.',
    '4. 1t 9s 1t 5.',
    '4. 1t 9s 1t 5.',
    '4. 1t 9s 1t 5.',
    '4. 1t 9s 1t 5.'
  ];
  var SIDE_LEGS_IDLE = [
    '4. 1t 9p 1t 5.',
    '4. 1t 1A 7p 1P 1t 5.',
    '4. 1t 1A 7p 1P 1t 5.',
    '4. 1t 9P 1t 5.',
    '4. 1t 9o 1t 5.',
    '4. 1t 1O 8o 1t 5.',
    '4. 11t 5.'
  ];
  var SIDE_LEGS_A = [
    '4. 1t 9p 1t 5.',
    '3. 1t 1A 4p 2t 1A 1p 1t 6.',
    '3. 1t 1A 4p 2t 1A 1p 1t 6.',
    '3. 1t 5P 2t 2P 1t 6.',
    '3. 1t 5o 2t 2o 1t 6.',
    '3. 1t 1O 4o 2t 1O 1o 1t 6.',
    '3. 6t 2. 3t 6.'
  ];
  var SIDE_LEGS_B = [
    '4. 1t 9p 1t 5.',
    '5. 1t 7p 1t 6.',
    '5. 1t 7p 1t 6.',
    '5. 1t 7P 1t 6.',
    '5. 1t 7o 1t 6.',
    '5. 1t 1O 6o 1t 6.',
    '5. 9t 6.'
  ];

  var DOWN = {
    0: S(HEAD_DOWN.concat(TORSO_DOWN, LEGS_IDLE)),
    1: S(HEAD_DOWN.concat(TORSO_DOWN, LEGS_A)),
    2: S(HEAD_DOWN.concat(TORSO_DOWN, LEGS_B))
  };
  var UP = {
    0: S(HEAD_UP.concat(TORSO_UP, LEGS_IDLE)),
    1: S(HEAD_UP.concat(TORSO_UP, LEGS_A)),
    2: S(HEAD_UP.concat(TORSO_UP, LEGS_B))
  };
  var SIDE = {
    0: S(HEAD_SIDE.concat(TORSO_SIDE, SIDE_LEGS_IDLE)),
    1: S(HEAD_SIDE.concat(TORSO_SIDE, SIDE_LEGS_A)),
    2: S(HEAD_SIDE.concat(TORSO_SIDE, SIDE_LEGS_B))
  };

  // ------------------------------------------------------------------ props
  var BAG = S([
    '3. 6t 3.', '3. 1t 4. 1t 3.', '12t',
    '1t 10b 1t', '1t 1B 8b 1B 1t', '1t 10b 1t',
    '1t 1B 8b 1B 1t', '1t 10S 1t', '1t 10b 1t',
    '1t 1B 8b 1B 1t', '12t', '1. 1t 8. 1t 1.',
    '1. 1o 8. 1o 1.', '12.'
  ]);
  var CUP = S([
    '1. 5t 1.', '1t 5b 1t', '1t 5B 1t', '7t',
    '1. 1t 3w 1t 1.', '1. 1t 3b 1t 1.', '1. 1t 3B 1t 1.',
    '1. 1t 3w 1t 1.', '2. 3t 2.'
  ]);
  var BIGCUP = S([
    '3. 8t 3.', '2. 1t 8L 1t 2.', '1. 1t 10L 1t 1.',
    '1. 1t 10l 1t 1.', '1t 12l 1t', '14t',
    '1. 1t 10c 1t 1.', '1. 1t 1H 8c 1C 1t 1.', '1. 1t 1H 8c 1C 1t 1.',
    '1. 1t 1H 8c 1C 1t 1.', '1. 1t 10c 1t 1.', '1. 1t 10B 1t 1.',
    '1. 1t 8s 2S 1t 1.', '1. 1t 8s 2S 1t 1.', '1. 1t 8s 2S 1t 1.',
    '1. 1t 8s 2S 1t 1.', '1. 1t 8s 2S 1t 1.', '1. 1t 10S 1t 1.',
    '1. 1t 10c 1t 1.', '1. 1t 1H 8c 1C 1t 1.', '1. 1t 1H 8c 1C 1t 1.',
    '2. 1t 7c 1C 1t 2.', '2. 1t 1H 6c 1C 1t 2.', '3. 1t 6c 1C 1t 2.',
    '3. 8t 3.', '4. 6t 4.'
  ]);

  // Validate. A bad row is loud at load rather than sheared in the game.
  var errors = [];
  function check(name, rows, w) {
    rows.forEach(function (r, i) {
      if (r.length !== w) errors.push(name + ' row ' + i + ' = ' + r.length + ' (want ' + w + ')');
    });
    return rows;
  }
  ['0', '1', '2'].forEach(function (k) {
    check('down' + k, DOWN[k], W); check('up' + k, UP[k], W); check('side' + k, SIDE[k], W);
    if (DOWN[k].length !== H) errors.push('down' + k + ' has ' + DOWN[k].length + ' rows');
    if (SIDE[k].length !== H) errors.push('side' + k + ' has ' + SIDE[k].length + ' rows');
  });
  check('bag', BAG, 12); check('cup', CUP, 7); check('bigcup', BIGCUP, 14);

  // Seated poses derive from the standing idle, so they cannot drift from it.
  function seat(rows, legs) {
    return ['20.', '20.'].map(R).concat(rows.slice(0, 25)).concat(S(legs));
  }
  var SIT_D = seat(DOWN[0], [
    '4. 1t 10p 1t 4.', '4. 1t 1A 8p 1P 1t 4.',
    '4. 1t 10P 1t 4.', '4. 1t 3o 4t 3o 1t 4.',
    '4. 4t 4. 4t 4.'
  ]);
  var SIT_S = seat(SIDE[0], [
    '4. 1t 10p 1t 4.', '4. 1t 1A 9p 1t 4.',
    '4. 1t 10P 1t 4.', '4. 1t 8o 1t 6.',
    '4. 8t 8.'
  ]);
  check('sitDown', SIT_D, W); check('sitSide', SIT_S, W);

  if (errors.length && typeof console !== 'undefined') console.warn('sprite errors:', errors);
  RB.spriteErrors = errors;

  RB.sprites = {
    down: DOWN, up: UP, side: SIDE,
    sitDown: SIT_D, sitSide: SIT_S,
    bag: BAG, cup: CUP, bigcup: BIGCUP,
    W: W, H: H
  };

  // --------------------------------------------------------------- palettes
  RB.pal = function (o) {
    var P = RB.P;
    var skin = o.skin || P.k3;
    var hair = o.hair || '#3a2a1e';
    var shirt = o.shirt || P.blu2;
    var pants = o.pants || P.blu1;
    var bag = o.bag || P.w3;
    return {
      t: o.outline || RB.P.outline,
      d: RB.shade(hair, -0.34), h: hair,
      H: RB.mix(hair, '#e8a860', 0.42),
      k: skin, K: RB.shade(skin, -0.24),
      f: RB.mix(RB.shade(skin, 0.10), '#ff9a7a', 0.34),   // cheek warmth
      e: '#4a2c30', q: '#fff4e4',
      s: shirt, S: RB.shade(shirt, -0.28), L: RB.shade(shirt, 0.22),
      w: o.collar || P.pale, c: o.tie || RB.shade(shirt, -0.48),
      p: pants, P: RB.shade(pants, -0.28), A: RB.shade(pants, 0.20),
      o: o.shoe || '#221e2c', O: RB.shade(o.shoe || '#221e2c', 0.28),
      b: bag, B: RB.shade(bag, 0.24),
      // big-cup keys
      l: '#2b2430', C: '#b2aa9c'
    };
  };

  RB.cupPal = {
    t: '#241c28', l: '#2b2430', L: '#4c4254',
    c: '#e8e2d4', C: '#b2aa9c', H: '#f8f4ea',
    s: '#a87848', S: '#7a5430',
    b: '#2b2430', B: '#c89660', w: '#e8e2d4'
  };

  // Characters keep the coordinates written for 12x18 sprites; props draw at
  // their literal position.
  RB.drawSprite = function (rows, x, y, pal, flip, tint, tintAmt) {
    var ctx = RB.ctx;
    var w = rows[0].length, h = rows.length;
    var isChar = (w === W);
    var px = Math.round(x - RB.cam.x - (isChar ? (W - 12) / 2 : 0));
    var py = Math.round(y - RB.cam.y - (isChar ? (H - 18) : 0));
    if (px + w < 0 || px > RB.W || py + h < 0 || py > RB.H) return;
    var cache = {};
    for (var ry = 0; ry < h; ry++) {
      var row = rows[ry];
      for (var rx = 0; rx < w; rx++) {
        var key = row[flip ? (w - 1 - rx) : rx];
        if (key === '.' || key === undefined) continue;
        var c = cache[key];
        if (c === undefined) {
          c = pal[key] || '#ff00ff';
          if (tint && tintAmt) c = RB.mix(c, tint, tintAmt);
          cache[key] = c;
        }
        ctx.fillStyle = c;
        ctx.fillRect(px + rx, py + ry, 1, 1);
      }
    }
  };

  // ------------------------------------------------------------------ actor
  function Actor(o) {
    o = o || {};
    this.x = o.x || 0;
    this.y = o.y || 0;
    this.pal = o.pal || RB.pal({});
    this.dir = o.dir || 'down';
    this.anim = 0;
    this.moving = false;
    this.sitting = o.sitting || false;
    this.hidden = false;
    this.speed = o.speed || 52;
    this.bag = o.bag || false;
    this.cup = o.cup || false;
    this.shadow = o.shadow !== false;
  }

  Actor.prototype.frames = function () {
    var order = [1, 0, 2, 0];
    var set = this.dir === 'up' ? UP : this.dir === 'down' ? DOWN : SIDE;
    return this.moving ? set[order[Math.floor(this.anim) % 4]] : set[0];
  };

  Actor.prototype.update = function (dt) {
    if (this.moving) this.anim += dt * 7; else this.anim = 0;
  };

  Actor.prototype.draw = function (tint, tintAmt) {
    if (this.hidden) return;
    var flip = this.dir === 'left';
    var rows, bob = 0;
    if (this.sitting) {
      rows = (this.dir === 'left' || this.dir === 'right') ? SIT_S : SIT_D;
    } else {
      rows = this.frames();
      if (this.moving && [1, 2].indexOf([1, 0, 2, 0][Math.floor(this.anim) % 4]) >= 0) bob = 1;
    }
    if (this.shadow) {
      var sx = Math.round(this.x - RB.cam.x), sy = Math.round(this.y - RB.cam.y);
      RB.ctx.fillStyle = 'rgba(0,0,0,0.22)';
      RB.ctx.fillRect(sx - 2, sy + 16, 16, 2);
      RB.ctx.fillRect(sx, sy + 18, 12, 1);
    }
    RB.drawSprite(rows, this.x, this.y + bob, this.pal, flip, tint, tintAmt);
    if (this.bag && !this.sitting) {
      RB.drawSprite(BAG, this.x + (flip ? 14 : -13), this.y + 2, this.pal, flip, tint, tintAmt);
    }
    if (this.cup) {
      var cx = this.x + (this.dir === 'left' ? -3 : this.dir === 'right' ? 10 : 8);
      RB.drawSprite(CUP, cx, this.y + (this.sitting ? 6 : 1), this.pal, false, tint, tintAmt);
    }
  };

  RB.Actor = Actor;
})(window.RB = window.RB || {});
