// sprites.js — one 12x18 body template, palette-swapped per character.
// Keys: . transparent  t outline  h hair  k skin  e eye
//       s shirt  S shirt-shade  p pants  P pants-shade  o shoe  b bag
(function (RB) {
  'use strict';

  var DOWN = {
    0: [ // contact / idle
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..hhkkkkhh..',
      '..thkkkkht..',
      '..tkekkekt..',
      '..tkkkkkkt..',
      '...tkkkkt...',
      '..tssssSst..',
      '.tksssssSkt.',
      '.tksssssSkt.',
      '..tsssssSt..',
      '..tpppPppt..',
      '..tpppPppt..',
      '..tpp.Ppt...',
      '..tpp.Ppt...',
      '..too.oot...',
      '..ttt.ttt...'
    ],
    1: [ // step A — left leg forward
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..hhkkkkhh..',
      '..thkkkkht..',
      '..tkekkekt..',
      '..tkkkkkkt..',
      '...tkkkkt...',
      '..tssssSst..',
      'tkssssssSt..',
      '.tsssssSkt..',
      '..tsssssSt..',
      '..tpppPppt..',
      '.tppppPppt..',
      '.tpp..Ppt...',
      '.tpp...Pt...',
      '.too...ot...',
      '.ttt...tt...'
    ],
    2: [ // step B — right leg forward
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..hhkkkkhh..',
      '..thkkkkht..',
      '..tkekkekt..',
      '..tkkkkkkt..',
      '...tkkkkt...',
      '..tssssSst..',
      '..tssssssSkt',
      '..tksssssSt.',
      '..tsssssSt..',
      '..tpppPppt..',
      '..tpppPPppt.',
      '...tpP..ppt.',
      '...tP...ppt.',
      '...to...oot.',
      '...tt...ttt.'
    ]
  };

  var UP = {
    0: [
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '...thhhht...',
      '..tssssSst..',
      '.tksssssSkt.',
      '.tksssssSkt.',
      '..tsssssSt..',
      '..tpppPppt..',
      '..tpppPppt..',
      '..tpp.Ppt...',
      '..tpp.Ppt...',
      '..too.oot...',
      '..ttt.ttt...'
    ],
    1: [
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '...thhhht...',
      '..tssssSst..',
      'tkssssssSt..',
      '.tsssssSkt..',
      '..tsssssSt..',
      '..tpppPppt..',
      '.tppppPppt..',
      '.tpp..Ppt...',
      '.tpp...Pt...',
      '.too...ot...',
      '.ttt...tt...'
    ],
    2: [
      '....tttt....',
      '...thhhht...',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '..thhhhhht..',
      '...thhhht...',
      '..tssssSst..',
      '..tssssssSkt',
      '..tksssssSt.',
      '..tsssssSt..',
      '..tpppPppt..',
      '..tpppPPppt.',
      '...tpP..ppt.',
      '...tP...ppt.',
      '...to...oot.',
      '...tt...ttt.'
    ]
  };

  // Facing right; mirrored at draw time for left.
  var SIDE = {
    0: [
      '...tttt.....',
      '..thhhht....',
      '..thhhhht...',
      '..hhkkkkt...',
      '..thkkkht...',
      '..tkkekt....',
      '..tkkkkt....',
      '...tkkkt....',
      '..tsssst....',
      '..tsssskt...',
      '..tsssSt....',
      '..tsssSt....',
      '..tpppPt....',
      '..tpppPt....',
      '..tpp.Pt....',
      '..tpp.Pt....',
      '..too.ot....',
      '..ttt.tt....'
    ],
    1: [
      '...tttt.....',
      '..thhhht....',
      '..thhhhht...',
      '..hhkkkkt...',
      '..thkkkht...',
      '..tkkekt....',
      '..tkkkkt....',
      '...tkkkt....',
      '..tsssst....',
      '.ktssssskt..',
      '..tsssSt....',
      '..tsssSt....',
      '..tpppPt....',
      '.tpppPPt....',
      '.tpp..Pt....',
      '.tp....Pt...',
      '.to....ot...',
      '.tt....tt...'
    ],
    2: [
      '...tttt.....',
      '..thhhht....',
      '..thhhhht...',
      '..hhkkkkt...',
      '..thkkkht...',
      '..tkkekt....',
      '..tkkkkt....',
      '...tkkkt....',
      '..tsssst....',
      '..tsssskt...',
      '..tksssSt...',
      '..tsssSt....',
      '..tpppPt....',
      '..tppPPt....',
      '..tppPt.....',
      '..tppPt.....',
      '..toot......',
      '..tttt......'
    ]
  };

  // Seated, facing the camera / facing right. Used at the gate and in the
  // cabin, which between them is a third of the level.
  var SIT_DOWN = [
    '............',
    '....tttt....',
    '...thhhht...',
    '..thhhhhht..',
    '..hhkkkkhh..',
    '..thkkkkht..',
    '..tkekkekt..',
    '..tkkkkkkt..',
    '...tkkkkt...',
    '..tssssSst..',
    '.tksssssSkt.',
    '.tksssssSkt.',
    '..tsssssSt..',
    '..tpppPppt..',
    '..tpppPppt..',
    '..too.oot...',
    '..ttt.ttt...',
    '............'
  ];

  var SIT_SIDE = [
    '............',
    '...tttt.....',
    '..thhhht....',
    '..thhhhht...',
    '..hhkkkkt...',
    '..thkkkht...',
    '..tkkekt....',
    '..tkkkkt....',
    '...tkkkt....',
    '..tsssst....',
    '..tsssskt...',
    '..tsssSt....',
    '..tpppppt...',
    '..tpppppt...',
    '..tP...Pt...',
    '..to...ot...',
    '..tt...tt...',
    '............'
  ];

  // Rolling suitcase, 8x11.
  var BAG = [
    '..tttt..',
    '..t..t..',
    'tttttttt',
    'tbbbbbbt',
    'tbbbbbbt',
    'tbSSSSbt',
    'tbbbbbbt',
    'tbbbbbbt',
    'tbbbbbbt',
    'tttttttt',
    '.t....t.'
  ];

  // Normalize every row to 12 (or its own width) so a miscount can't shear
  // the sprite. Anything short is padded with transparent.
  function fix(rows, w) {
    return rows.map(function (r) {
      if (r.length > w) return r.slice(0, w);
      while (r.length < w) r += '.';
      return r;
    });
  }
  [DOWN, UP, SIDE].forEach(function (set) {
    for (var k in set) set[k] = fix(set[k], 12);
  });
  var SIT_D = fix(SIT_DOWN, 12), SIT_S = fix(SIT_SIDE, 12), BAG_F = fix(BAG, 8);

  RB.sprites = {
    down: DOWN, up: UP, side: SIDE,
    sitDown: SIT_D, sitSide: SIT_S, bag: BAG_F
  };

  // --------------------------------------------------------------- palettes
  // A character is just a key->color map. Six silhouette-neutral bodies plus
  // hair/shirt variation reads as a crowd at 240x160.
  RB.pal = function (o) {
    var skin = o.skin || RB.P.skin0;
    var shirt = o.shirt || RB.P.steel1;
    var pants = o.pants || RB.P.night1;
    return {
      t: o.outline || RB.P.black,
      h: o.hair || RB.P.warm0,
      k: skin,
      e: o.eye || RB.P.black,
      s: shirt,
      S: o.shirtShade || RB.shade(shirt, -0.28),
      p: pants,
      P: o.pantsShade || RB.shade(pants, -0.3),
      o: o.shoe || RB.P.black,
      b: o.bag || RB.P.warm1
    };
  };

  // Draw a sprite (array of rows) at x,y in WORLD space with a palette map.
  // `flip` mirrors horizontally. `tint`/`tintAmt` lets a whole scene be
  // dimmed or warmed without authoring separate art — this is doing the job
  // hardware palette registers would have done.
  RB.drawSprite = function (rows, x, y, pal, flip, tint, tintAmt) {
    var ctx = RB.ctx;
    var w = rows[0].length;
    var px = Math.round(x - RB.cam.x), py = Math.round(y - RB.cam.y);
    // Cheap offscreen cull.
    if (px + w < 0 || px > RB.W || py + rows.length < 0 || py > RB.H) return;
    var cache = {};
    for (var ry = 0; ry < rows.length; ry++) {
      var row = rows[ry];
      for (var rx = 0; rx < w; rx++) {
        var key = row[flip ? (w - 1 - rx) : rx];
        if (key === '.' || key === undefined) continue;
        var c = cache[key];
        if (c === undefined) {
          c = pal[key] || RB.P.rose;
          if (tint && tintAmt) c = RB.mix(c, tint, tintAmt);
          cache[key] = c;
        }
        ctx.fillStyle = c;
        ctx.fillRect(px + rx, py + ry, 1, 1);
      }
    }
  };

  // ------------------------------------------------------------------ actor
  // Shared by the player and every NPC. Holds position, facing, and the walk
  // cycle; scenes drive `vx/vy` or a script drives `x/y` directly.
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
    this.speed = o.speed || 44;
    this.bag = o.bag || false;
    this.shadow = o.shadow !== false;
  }

  Actor.prototype.frames = function () {
    // 4-step cycle from 3 frames: contact, pass, contact, pass(other side).
    var order = [1, 0, 2, 0];
    var set = this.dir === 'up' ? RB.sprites.up
            : this.dir === 'down' ? RB.sprites.down
            : RB.sprites.side;
    if (!this.moving) return set[0];
    return set[order[Math.floor(this.anim) % 4]];
  };

  Actor.prototype.update = function (dt) {
    if (this.moving) this.anim += dt * 7;
    else this.anim = 0;
  };

  Actor.prototype.draw = function (tint, tintAmt) {
    if (this.hidden) return;
    var flip = this.dir === 'left';
    var rows;
    if (this.sitting) {
      rows = (this.dir === 'left' || this.dir === 'right') ? RB.sprites.sitSide : RB.sprites.sitDown;
    } else {
      rows = this.frames();
    }
    // Contact shadow — a 1px ellipse-ish smear. Without it characters look
    // pasted onto the floor rather than standing on it.
    if (this.shadow) {
      var sx = Math.round(this.x - RB.cam.x), sy = Math.round(this.y - RB.cam.y);
      RB.ctx.fillStyle = 'rgba(0,0,0,0.22)';
      RB.ctx.fillRect(sx + 2, sy + 17, 8, 2);
      RB.ctx.fillRect(sx + 3, sy + 18, 6, 1);
    }
    RB.drawSprite(rows, this.x, this.y, this.pal, flip, tint, tintAmt);
    if (this.bag && !this.sitting) {
      var bx = this.x + (flip ? 9 : -6);
      RB.drawSprite(RB.sprites.bag, bx, this.y + 8, this.pal, flip, tint, tintAmt);
    }
  };

  RB.Actor = Actor;
})(window.RB = window.RB || {});
