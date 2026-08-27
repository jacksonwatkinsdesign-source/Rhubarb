// oblique.js — the module kit. Every room is composed from these.
//
// Oblique projection: front faces are drawn true, depth shears up and to the
// right, verticals stay vertical. Light comes from the top-left, always, so
// a top face is the lit one and a right face is the shaded one — no object
// anywhere in the game may light itself differently.
//
// Variation comes from fittings tacked onto a constant base, never from
// redrawing the base. A bin, a counter and a pillar are the same box.
(function (RB) {
  'use strict';
  var OB = {};
  RB.ob = OB;

  var DEP = 0.62;                       // depth foreshortening
  OB.GRID = 8;
  OB.snap = function (v) { return Math.round(v / OB.GRID) * OB.GRID; };
  OB.off = function (d) { return Math.round(d * DEP); };

  // Four tones from one colour, and that is the whole budget for an object.
  var cache = {};
  OB.mat = function (base) {
    if (cache[base]) return cache[base];
    cache[base] = {
      edge:  RB.shade(base, 0.46),
      top:   RB.shade(base, 0.30),
      front: base,
      side:  RB.shade(base, -0.38),
      deep:  RB.shade(base, -0.60)
    };
    return cache[base];
  };

  // ------------------------------------------------------------------ box
  // d is the shear in pixels: how far up-right the top face reaches.
  OB.box = function (x, y, w, h, d, base, bare) {
    var m = OB.mat(base), o;
    for (o = d; o >= 1; o--) RB.wrect(x + o, y - o, w, 1, m.top);
    for (o = d; o >= 1; o--) RB.wrect(x + w - 1 + o, y - o, 1, h, m.side);
    RB.wrect(x, y, w, h, m.front);
    RB.wrect(x, y, w, 1, m.edge);
    RB.wrect(x + w - 1, y, 1, h, m.side);
    if (!bare) OB.outline(x, y, w, h, d);
    return m;
  };

  // Trace the silhouette of a sheared box: down the left of the front face,
  // along its bottom, up the two diagonals, and across the back of the top.
  OB.outline = function (x, y, w, h, d) {
    var OL = RB.P.outline, o;
    RB.wrect(x - 1, y, 1, h + 1, OL);                    // front left
    RB.wrect(x - 1, y + h, w + 1, 1, OL);                // front bottom
    for (o = 0; o <= d; o++) {
      RB.wrect(x + o - 1, y - o, 1, 1, OL);              // top-face left diagonal
      RB.wrect(x + w + o, y - o + h, 1, 1, OL);          // side-face bottom diagonal
      RB.wrect(x + w + o, y - o, 1, 1, OL);              // side-face top diagonal
    }
    RB.wrect(x + d, y - d - 1, w, 1, OL);                // back of the top face
    RB.wrect(x + w + d, y - d, 1, h + 1, OL);            // far right
  };

  // A flat panel lying on the ground (a rug, a painted marking, a light pool).
  OB.slab = function (x, y, w, d, base) {
    var m = OB.mat(base), o;
    for (o = d; o >= 0; o--) RB.wrect(x + o, y - o, w, 1, m.front);
    RB.wrect(x + d, y - d, w, 1, m.edge);
  };

  // ---------------------------------------------------------------- floor
  OB.floor = function (x0, w, yTop, yBot, base) {
    var m = OB.mat(base), h = yBot - yTop, x, y, i;
    RB.wrect(x0, yTop, w, h, m.front);
    RB.wrect(x0, yTop, w, 2, m.top);

    // Horizontals stay flat; depth lines shear. Kept faint — the grid should
    // read as order, not as graph paper.
    var seam = RB.mix(m.front, m.side, 0.32);
    for (y = yTop + 16; y < yBot; y += 16) RB.wrect(x0, y, w, 1, seam);
    // Short depth ticks at each seam crossing rather than full-height lines.
    for (x = Math.floor((x0 - 64) / 32) * 32; x < x0 + w + 64; x += 32) {
      for (y = yTop + 16; y < yBot; y += 16) {
        for (i = 0; i < 5; i++) RB.wrect(x + OB.off(i), y - i, 1, 1, seam);
      }
    }
  };

  // ------------------------------------------------------------ glass wall
  // viewFn paints whatever is beyond, clipped to the aperture.
  OB.glass = function (x0, w, y, h, viewFn, base) {
    var m = OB.mat(base);
    RB.ctx.save();
    RB.ctx.beginPath();
    RB.ctx.rect(x0 - RB.cam.x, y, w, h);
    RB.ctx.clip();
    viewFn(x0, w, y, h);
    RB.ctx.restore();

    // Mullions on the grid, each with a lit left edge.
    for (var x = Math.floor(x0 / 32) * 32; x < x0 + w; x += 32) {
      RB.wrect(x, y, 3, h, m.front);
      RB.wrect(x, y, 1, h, m.edge);
      RB.wrect(x + 2, y, 1, h, m.side);
    }
    // Head and sill, both with depth so the wall has thickness.
    OB.box(x0, y - 5, w, 5, 5, base);
    OB.box(x0, y + h, w, 6, 5, base);
  };

  // ------------------------------------------------------------- fittings
  // One seat. A bank is this repeated on the grid with an armrest between.
  OB.seat = function (x, y, base, cushion) {
    OB.box(x + 1, y - 12, 18, 13, 5, cushion);      // back
    OB.box(x, y, 20, 7, 8, cushion);                // pan
    var m = OB.mat(base);
    RB.wrect(x + 2, y + 7, 3, 6, m.front);          // legs
    RB.wrect(x + 15, y + 7, 3, 6, m.front);
    RB.wrect(x, y + 13, 20, 2, m.deep);
  };

  OB.seatBank = function (x, y, n, base, cushion) {
    var m = OB.mat(base);
    for (var i = 0; i < n; i++) {
      OB.seat(x + i * 20, y, base, cushion);
      if (i) RB.wrect(x + i * 20 - 2, y - 4, 3, 8, m.front);   // armrest
    }
  };

  // A counter: the same box, with a worktop overhanging it.
  OB.counter = function (x, y, w, h, base, top) {
    OB.box(x, y, w, h, 10, base);
    var d = OB.off(10);
    var mt = OB.mat(top);
    RB.wrect(x - 1, y - 3, w + 2, 3, mt.front);
    RB.wrect(x - 1 + d, y - 3 - d, w + 2, 3, mt.top);
    for (var o = d; o >= 1; o--) RB.wrect(x - 1 + o, y - 3 - o, w + 2, 1, mt.top);
    RB.wrect(x - 1, y - 3, w + 2, 1, mt.edge);
  };

  // A pillar: the same box again, with a cap and a base tacked on.
  OB.pillar = function (x, yBase, h, base) {
    OB.box(x, yBase - h, 12, h, 7, base);
    OB.box(x - 2, yBase - h - 4, 16, 5, 8, base);
    OB.box(x - 2, yBase - 5, 16, 6, 8, base);
  };

  // A backlit hanging sign.
  OB.sign = function (x, y, text, w, base, fg) {
    var m = OB.mat(base);
    w = w || RB.font.width(text) + 16;
    RB.wrect(x + w / 2 - 1, y - 9, 2, 9, m.side);
    OB.box(x, y, w, 16, 5, base);
    RB.font.draw(text, Math.round(x - RB.cam.x + 8), y + 5, fg || RB.P.cream);
    RB.ctx.globalAlpha = 0.10;
    RB.wrect(x - 2, y + 16, w + 4, 5, fg || RB.P.cream);
    RB.ctx.globalAlpha = 1;
  };

  // ------------------------------------------------- airport street furniture
  // All the same box, at different sizes, with different fittings. A bollard
  // is a bin is a column is a trolley stack.

  OB.bollard = function (x, yBase, base) {
    OB.box(x, yBase - 10, 4, 10, 2, base);
    RB.wrect(x, yBase - 7, 4, 1, RB.P.gold3);        // reflective band
  };

  OB.bin = function (x, yBase, base) {
    OB.box(x, yBase - 18, 13, 18, 5, base);
    OB.box(x - 1, yBase - 22, 15, 5, 6, RB.shade(base, -0.22));
    RB.wrect(x + 3, yBase - 20, 7, 2, RB.P.outline);   // the slot
  };

  // A nested rank of luggage trolleys, which is the most airport object there
  // is. Drawn back to front so they overlap like the real thing.
  OB.trolleys = function (x, yBase, n, base) {
    var m = OB.mat(base), OL = RB.P.outline;
    for (var i = n - 1; i >= 0; i--) {
      var tx = x + i * 6, ty = yBase - i * 2;
      RB.wrect(tx, ty - 26, 2, 26, m.front);            // handle post
      RB.wrect(tx, ty - 26, 2, 1, m.edge);
      RB.wrect(tx, ty - 27, 12, 2, m.top);              // handle bar
      RB.wrect(tx - 1, ty - 28, 14, 1, OL);
      OB.box(tx + 1, ty - 12, 14, 8, 5, base);          // basket
      RB.wrect(tx + 2, ty - 3, 3, 3, OL);               // wheels
      RB.wrect(tx + 11, ty - 3, 3, 3, OL);
    }
  };

  // A column holding the canopy up. Vertical rhythm, and the thing that makes
  // a kerbside canopy read as structure rather than a floating slab.
  OB.column = function (x, yTop, yBase, base) {
    OB.box(x, yTop, 7, yBase - yTop, 4, base);
    OB.box(x - 1, yBase - 4, 9, 5, 5, RB.shade(base, -0.18));
  };

  // Painted markings on the ground: flat, no depth, just paint.
  OB.paint = function (x, y, w, h, col, alpha) {
    RB.ctx.globalAlpha = alpha === undefined ? 0.55 : alpha;
    RB.wrect(x, y, w, h, col);
    RB.ctx.globalAlpha = 1;
  };

  // Ceiling with recessed strips, and the warm pool each one throws.
  OB.ceiling = function (x0, w, h, base, strip, floorY, warmth) {
    var m = OB.mat(base);
    RB.wrect(x0, 0, w, h, m.front);
    RB.wrect(x0, h - 2, w, 2, m.deep);
    for (var x = Math.floor(x0 / 64) * 64; x < x0 + w; x += 64) {
      RB.wrect(x + 14, h - 7, 36, 4, strip);
      RB.wrect(x + 14, h - 7, 36, 1, RB.shade(strip, 0.3));
      if (warmth) {
        RB.ctx.globalAlpha = warmth;
        RB.wrect(x + 8, h, 48, floorY - h, strip);
        RB.ctx.globalAlpha = 1;
      }
    }
  };

  // A wall: panels on the grid, a trim line, a darker dado below it.
  OB.wall = function (x0, w, yTop, yBot, base) {
    var m = OB.mat(base), x;
    RB.wrect(x0, yTop, w, yBot - yTop, m.front);
    RB.wrect(x0, yTop, w, 1, m.top);
    for (x = Math.floor(x0 / 40) * 40; x < x0 + w; x += 40) {
      RB.wrect(x, yTop, 1, yBot - yTop, m.side);
      RB.wrect(x + 1, yTop, 1, yBot - yTop, m.top);
    }
    var dado = yBot - 26;
    RB.wrect(x0, dado, w, 2, m.deep);
    RB.wrect(x0, dado + 2, w, 1, m.top);
    RB.wrect(x0, dado + 3, w, yBot - dado - 3, m.side);
    RB.wrect(x0, yBot - 4, w, 4, m.deep);
  };

})(window.RB = window.RB || {});
