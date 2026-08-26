// sprites.js — 16x24 character sprites, three-tone shaded, palette-swapped.
//
// Scale and proportion are pitched at GBA-era Pokemon (big head, readable
// face at 1x), with the heavier outline and higher-saturation shading of the
// Battle Network overworld sprites.
//
// Keys: . transparent   t outline
//       h hair   H hair highlight
//       k skin   K skin shade
//       e eye
//       s jacket   S jacket shade   L jacket highlight
//       w collar   c tie
//       p trousers   P trouser shade
//       o shoe   b bag   B bag highlight
(function (RB) {
  'use strict';

  var W = 16, H = 24;

  // ------------------------------------------------------------------ down
  // Head is twelve rows of twenty-four. Any more and it tips from GBA-chibi
  // into bobblehead; any less and the face stops reading at 1x.
  var D0 = [
    '.....tttttt.....',
    '...tthhhhhhtt...',
    '..thhhhhhhhhht..',
    '.thhhHHHHHHhhht.',
    '.thhhhhhhhhhhht.',
    '.thhkkkkkkkkhht.',
    '.thkkttkkttkkht.',
    '.thkkeekkeekkht.',
    '.tkkkkkkkkkkkkt.',
    '.tKkkkkkkkkkkKt.',
    '..tkkkkkkkkkkt..',
    '...ttkkkkkktt...',
    '..ttsswwwwsstt..',
    '.tLssswccwsssLt.',
    '.tLsssswccsssLt.',
    '.tksssssccsssKt.',
    '.tksssssccsssKt.',
    '.tkssssssssssKt.',
    '..tsssssssssst..',
    '..tppppttppppt..',
    '..tpppt..tpppt..',
    '..tpppt..tpppt..',
    '..tPPPt..tPPPt..',
    '..tooot..tooot..'
  ];
  // Step frames differ only below the waist; at this size the legs carry the
  // whole cycle and articulating the arms too just reads as noise.
  var D1 = D0.slice(0, 19).concat([
    '..tppppttppppt..',
    '.tppppt..tpppt..',
    '.tppppt...tppt..',
    '.tPPPPt...tPPt..',
    '.tooot....toot..'
  ]);
  var D2 = D0.slice(0, 19).concat([
    '..tppppttppppt..',
    '..tpppt..tppppt.',
    '..tppt...tppppt.',
    '..tPPt...tPPPPt.',
    '..toot....tooot.'
  ]);

  // -------------------------------------------------------------------- up
  var U0 = [
    '.....tttttt.....',
    '...tthhhhhhtt...',
    '..thhhhhhhhhht..',
    '.thhhHHHHHHhhht.',
    '.thhhhhhhhhhhht.',
    '.thhhhhhhhhhhht.',
    '.thhhhhhhhhhhht.',
    '.thhhhhhhhhhhht.',
    '.thhhhhhhhhhhht.',
    '.thhhhhhhhhhhht.',
    '..thhhhhhhhhht..',
    '...ttkkkkkktt...',
    '..ttsssssssstt..',
    '.tLssssssssssLt.',
    '.tLssssssssssLt.',
    '.tkssssssssssKt.',
    '.tkssssssssssKt.',
    '.tkssssssssssKt.',
    '..tsssssssssst..',
    '..tppppttppppt..',
    '..tpppt..tpppt..',
    '..tpppt..tpppt..',
    '..tPPPt..tPPPt..',
    '..tooot..tooot..'
  ];
  var U1 = U0.slice(0, 19).concat(D1.slice(19));
  var U2 = U0.slice(0, 19).concat(D2.slice(19));

  // ------------------------------------------------------------------ side
  // Facing right; mirrored at draw time for left.
  var S0 = [
    '....tttttt......',
    '..tthhhhhhtt....',
    '.thhhhhhhhhht...',
    '.thhHHHHhhhkkt..',
    '.thhhhhhhkkkkt..',
    '.thhhhhkkkkkkt..',
    '.thhhkkttkkkkt..',
    '.thhhkkeekkkkt..',
    '.thhhkkkkkkkkt..',
    '..thkkkkkkkkt...',
    '...tkkkkkkkt....',
    '....tkkkkkt.....',
    '..ttsswwwstt....',
    '.tLsssswwcst....',
    '.tLsssssccst....',
    '.tLsssssssskt...',
    '.tSssssssssKt...',
    '.tSssssssssst...',
    '..tsssssssst....',
    '..tppppppppt....',
    '..tpppppppt.....',
    '..tpppppppt.....',
    '..tPPPPPPt......',
    '..toooooot......'
  ];
  var S1 = S0.slice(0, 19).concat([
    '..tppppppppt....',
    '.tppppppppt.....',
    '.tPPPt..tPPPt...',
    '.tPPt....tPPt...',
    '.toot....toot...'
  ]);
  var S2 = S0.slice(0, 19).concat([
    '..tppppppppt....',
    '..tpppppppt.....',
    '..tPPPPPt.......',
    '..tPPPPt........',
    '..toooot........'
  ]);

  // ------------------------------------------------------------------ bag
  var BAG = [
    '...tttt...',
    '...t..t...',
    'tttttttttt',
    'tbbbbbbbbt',
    'tbBBBBBBbt',
    'tbbbbbbbbt',
    'tbbbbbbbbt',
    'tbSSSSSSbt',
    'tbbbbbbbbt',
    'tbbbbbbbbt',
    'tttttttttt',
    '.t......t.',
    '.o......o.',
    '..........'
  ];

  // ------------------------------------------------------------------ cup
  // A takeaway cup: dark lid, pale cup, card sleeve. Reuses the bag's palette
  // keys so carrying one needs no new colours.
  var CUP = [
    '.ttttt.',
    'tbbbbbt',
    'tBBBBBt',
    'ttttttt',
    '.twwwt.',
    '.tbbbt.',
    '.tBBBt.',
    '.twwwt.',
    '..ttt..'
  ];

  // Validate rather than silently pad: a sheared sprite is very hard to spot
  // by eye and very easy to introduce by miscounting one row.
  var errors = [];
  function check(name, rows, w, h) {
    if (rows.length !== h) errors.push(name + ' has ' + rows.length + ' rows, expected ' + h);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].length !== w) {
        errors.push(name + ' row ' + i + ' is ' + rows[i].length + ' wide: "' + rows[i] + '"');
      }
    }
    return rows.map(function (r) {
      if (r.length > w) return r.slice(0, w);
      while (r.length < w) r += '.';
      return r;
    });
  }

  var DOWN = { 0: check('down0', D0, W, H), 1: check('down1', D1, W, H), 2: check('down2', D2, W, H) };
  var UP   = { 0: check('up0', U0, W, H),   1: check('up1', U1, W, H),   2: check('up2', U2, W, H) };
  var SIDE = { 0: check('side0', S0, W, H), 1: check('side1', S1, W, H), 2: check('side2', S2, W, H) };
  var BAG_F = check('bag', BAG, 10, 14);
  var CUP_F = check('cup', CUP, 7, 9);

  // Seated poses are derived from the standing idle so they can never drift
  // out of sync with it: drop two rows in, fold the legs at the bottom.
  function seat(rows, legs) {
    return ['................', '................']
      .concat(rows.slice(0, 19))
      .concat(legs);
  }
  var SIT_D = seat(DOWN[0], ['..tppppppppppt..', '..tPPPPPPPPPPt..', '..toot....toot..']);
  var SIT_S = seat(SIDE[0], ['..tppppppppppt..', '..tPPPPPPPPt....', '..toooot........']);

  if (errors.length && typeof console !== 'undefined') console.warn('sprite errors:', errors);
  RB.spriteErrors = errors;

  RB.sprites = {
    down: DOWN, up: UP, side: SIDE,
    sitDown: SIT_D, sitSide: SIT_S, bag: BAG_F, cup: CUP_F,
    W: W, H: H
  };

  // --------------------------------------------------------------- palettes
  // Three tones per material. The mid tone is the character's identity; the
  // shade and highlight are derived unless a caller wants them specific.
  RB.pal = function (o) {
    var skin  = o.skin  || '#f0c090';
    var hair  = o.hair  || '#3a2418';
    var shirt = o.shirt || '#3c6fc0';
    var pants = o.pants || '#2e5296';
    var bag   = o.bag   || '#8a5a3c';
    return {
      t: o.outline    || '#181428',
      h: hair,
      H: o.hairHi     || RB.shade(hair, 0.30),
      k: skin,
      K: o.skinShade  || RB.shade(skin, -0.20),
      e: o.eye        || '#241c30',
      s: shirt,
      S: o.shirtShade || RB.shade(shirt, -0.30),
      L: o.shirtLight || RB.shade(shirt, 0.24),
      w: o.collar     || '#f2eee0',
      c: o.tie        || '#1f3468',
      p: pants,
      P: o.pantsShade || RB.shade(pants, -0.30),
      o: o.shoe       || '#241e2c',
      b: bag,
      B: o.bagHi      || RB.shade(bag, 0.22)
    };
  };

  // Draw a sprite at x,y in WORLD space. `x,y` still mean what they meant
  // when characters were 12x18 — the extra width and height are absorbed
  // here — so every scene coordinate in the game stays valid.
  RB.drawSprite = function (rows, x, y, pal, flip, tint, tintAmt) {
    var ctx = RB.ctx;
    var w = rows[0].length, h = rows.length;
    var px = Math.round(x - RB.cam.x - (w - 12) / 2);
    var py = Math.round(y - RB.cam.y - (h - 18));
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
    this.speed = o.speed || 44;
    this.bag = o.bag || false;
    this.cup = o.cup || false;
    this.shadow = o.shadow !== false;
  }

  Actor.prototype.frames = function () {
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
    var rows, bob = 0;
    if (this.sitting) {
      rows = (this.dir === 'left' || this.dir === 'right') ? RB.sprites.sitSide : RB.sprites.sitDown;
    } else {
      rows = this.frames();
      // Contact frames sit a pixel lower than the passing frame. It is one
      // pixel and it is most of what makes the walk read as weight.
      if (this.moving && [1, 2].indexOf([1, 0, 2, 0][Math.floor(this.anim) % 4]) >= 0) bob = 1;
    }

    if (this.shadow) {
      var sx = Math.round(this.x - RB.cam.x), sy = Math.round(this.y - RB.cam.y);
      RB.ctx.fillStyle = 'rgba(0,0,0,0.20)';
      RB.ctx.fillRect(sx, sy + 17, 12, 2);
      RB.ctx.fillRect(sx + 2, sy + 19, 8, 1);
    }
    RB.drawSprite(rows, this.x, this.y + bob, this.pal, flip, tint, tintAmt);

    if (this.bag && !this.sitting) {
      var bx = this.x + (flip ? 12 : -10);
      RB.drawSprite(RB.sprites.bag, bx, this.y + 6, this.pal, flip, tint, tintAmt);
    }
    // Held out at chest height, on the side you're facing.
    if (this.cup) {
      var cx = this.x + (this.dir === 'left' ? -5 : this.dir === 'right' ? 11 : 10);
      var cy = this.y + (this.sitting ? 12 : 8);
      RB.drawSprite(RB.sprites.cup, cx, cy, this.pal, false, tint, tintAmt);
    }
  };

  RB.Actor = Actor;
})(window.RB = window.RB || {});
