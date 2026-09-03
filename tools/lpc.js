/* tools/lpc.js — turn a Universal LPC Spritesheet Generator export into a
   game-ready sheet.

   Usage:  node tools/lpc.js assets/chars/<name>.json [animation ...]

   The export JSON already carries every layer's resolved sprite path and its
   zPos, so paths need no guessing. What it does NOT carry is which *palette*
   a recolour slot belongs to, so that comes from the generator repo's own
   sheet_definitions. Both are read straight off a local checkout; nothing is
   fetched at build time.

   Output: assets/chars/<name>.png  (frames trimmed to a shared box)
           assets/chars/<name>.frames.json
           assets/chars/<name>.CREDITS.md
*/
'use strict';
var fs = require('fs');
var path = require('path');

var LPC = process.env.LPC_REPO ||
  '/home/user/liberatedpixelcup/universal-lpc-spritesheet-character-generator';
var SHEETS = path.join(LPC, 'spritesheets');
var DEFS = path.join(LPC, 'sheet_definitions');
var PALS = path.join(LPC, 'palette_definitions');

/* ---- sheet definitions, indexed by the itemId the export uses ---- */
var defIndex = null;
function defFor(itemId) {
  if (!defIndex) {
    defIndex = {};
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
        var p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.json')) defIndex[e.name.slice(0, -5)] = p;
      });
    })(DEFS);
  }
  return defIndex[itemId] ? JSON.parse(fs.readFileSync(defIndex[itemId], 'utf8')) : null;
}

/* ---- palettes ---- */
var palCache = {};
function palette(material) {
  if (palCache[material]) return palCache[material];
  var ramps = JSON.parse(fs.readFileSync(path.join(PALS, material, material + '_ulpc.json'), 'utf8'));
  var meta = JSON.parse(fs.readFileSync(path.join(PALS, material, 'meta_' + material + '.json'), 'utf8'));
  return (palCache[material] = { ramps: ramps, base: meta.base });
}

/* A recolour slot names a variant ("gray"); the sheet definition names the
   material ("hair"). Map the material's base ramp onto the target ramp,
   colour for colour. */
function rampMap(material, variant) {
  var p = palette(material);
  var from = p.ramps[p.base];
  var to = p.ramps[variant] || p.ramps[variant.replace(/_/g, ' ')];
  if (!from || !to) return null;
  return { from: from.map(hex), to: to.map(hex) };
}
function hex(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/* ---- resolve one export layer to a file on disk ---- */
function layerFile(layer, anim) {
  var sp = layer.source && layer.source.spritePath;
  if (!sp) return null;
  var dir = sp.replace(/\/[^/]+\.png$/, '');
  // Variant-keyed items nest the variant under the animation: <dir>/<anim>/<variant>.png
  if (layer.variant) {
    dir = dir.replace(/\/[^/]+$/, '');           // strip the animation segment
    return path.join(SHEETS, dir, anim, layer.variant + '.png');
  }
  return path.join(SHEETS, dir, anim + '.png');
}

/* Which material/variant pairs recolour this layer. */
function recolorsFor(layer) {
  var out = [];
  if (!layer.recolors) return out;
  var def = defFor(layer.itemId);
  var spec = def && def.recolors;
  if (!spec) return out;
  Object.keys(layer.recolors).forEach(function (slot) {
    var variant = layer.recolors[slot];
    // A definition either names one material, or splits into color_1/color_2.
    var material = spec.material ||
      (spec.color_1 && spec.color_1.material);
    if (material) out.push({ material: material, variant: variant });
  });
  return out;
}

/* ---- animation row layouts ---- */
var ANIMS = {
  walk: { rows: ['up', 'left', 'down', 'right'], frames: 9 },
  idle: { rows: ['up', 'left', 'down', 'right'], frames: 2 },
  sit:  { rows: ['up', 'left', 'down', 'right'], frames: 3 }
};

async function main() {
  var jsonPath = process.argv[2];
  if (!jsonPath) { console.error('usage: node tools/lpc.js <export.json> [anim ...]'); process.exit(1); }
  var wanted = process.argv.slice(3);
  if (!wanted.length) wanted = ['walk'];

  var exp = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  var name = path.basename(jsonPath, '.json');
  var outDir = path.dirname(jsonPath);

  var layers = exp.layers.slice().sort(function (a, b) { return a.zPos - b.zPos; });

  // Gather every layer image we need, per animation, as base64.
  var jobs = [];
  wanted.forEach(function (anim) {
    layers.forEach(function (L) {
      if (L.supportedAnimations && L.supportedAnimations.indexOf(anim) < 0) return;
      var f = layerFile(L, anim);
      if (!f || !fs.existsSync(f)) {
        console.warn('  skip (no ' + anim + '): ' + L.name);
        return;
      }
      jobs.push({
        anim: anim, z: L.zPos, name: L.name,
        data: 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'),
        maps: recolorsFor(L).map(function (r) { return rampMap(r.material, r.variant); })
                            .filter(Boolean)
      });
    });
  });

  var { chromium } = require('playwright');
  var browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  var page = await browser.newPage();

  var result = await page.evaluate(async function (args) {
    var jobs = args.jobs, ANIMS = args.ANIMS, wanted = args.wanted, F = 64;

    function load(src) {
      return new Promise(function (res, rej) {
        var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src;
      });
    }
    function lum(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }

    function recolor(img, maps) {
      var c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      var x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      if (!maps.length) return c;
      var d = x.getImageData(0, 0, c.width, c.height), p = d.data, i, m, k;

      // Every opaque colour actually present, so we can tell whether this
      // layer really is drawn in the palette's declared base ramp.
      var seen = {};
      for (i = 0; i < p.length; i += 4) {
        if (p[i + 3] < 200) continue;
        var key = p[i] + ',' + p[i + 1] + ',' + p[i + 2];
        seen[key] = (seen[key] || 0) + 1;
      }
      var present = Object.keys(seen).map(function (s) {
        return s.split(',').map(Number);
      });

      // Build the actual substitution table for each recolour.
      var tables = maps.map(function (mp) {
        var near = function (a, b) {
          return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && Math.abs(a[2] - b[2]) <= 1;
        };
        var hits = mp.from.filter(function (f) {
          return present.some(function (q) { return near(q, f); });
        });
        if (hits.length >= Math.ceil(mp.from.length / 2)) {
          // Source is in the declared base ramp: map it colour for colour.
          var n = Math.min(mp.from.length, mp.to.length), pairs = [], j;
          for (j = 0; j < n; j++) pairs.push([mp.from[j], mp.to[j]]);
          return pairs;
        }
        // Source is drawn in some other ramp (a lot of the clothing is).
        // Order what is actually there by luminance and spread it across the
        // target ramp, which preserves the shading even though the hues move.
        var ordered = present.slice().sort(function (a, b) { return lum(a) - lum(b); });
        var N = ordered.length, T = mp.to.length, out = [], t;
        for (t = 0; t < N; t++) {
          var idx = N === 1 ? T - 1 : Math.round(t * (T - 1) / (N - 1));
          out.push([ordered[t], mp.to[idx]]);
        }
        return out;
      });

      for (i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        for (m = 0; m < tables.length; m++) {
          var pairs = tables[m];
          for (k = 0; k < pairs.length; k++) {
            var a = pairs[k][0];
            if (Math.abs(p[i] - a[0]) <= 1 && Math.abs(p[i+1] - a[1]) <= 1 && Math.abs(p[i+2] - a[2]) <= 1) {
              var b = pairs[k][1];
              p[i] = b[0]; p[i+1] = b[1]; p[i+2] = b[2];
              k = pairs.length; m = tables.length;
            }
          }
        }
      }
      x.putImageData(d, 0, 0);
      return c;
    }

    // Composite each animation into a full-size sheet first.
    var comps = {};
    for (var a = 0; a < wanted.length; a++) {
      var anim = wanted[a];
      var mine = jobs.filter(function (j) { return j.anim === anim; });
      if (!mine.length) continue;
      var W = 0, H = 0, imgs = [];
      for (var i = 0; i < mine.length; i++) {
        var img = await load(mine[i].data);
        W = Math.max(W, img.width); H = Math.max(H, img.height);
        imgs.push(recolor(img, mine[i].maps));
      }
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var cx = c.getContext('2d');
      imgs.forEach(function (im) { cx.drawImage(im, 0, 0); });
      comps[anim] = c;
    }

    // One trim box shared by every frame of every animation, so nothing shifts.
    var minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
    Object.keys(comps).forEach(function (anim) {
      var c = comps[anim], spec = ANIMS[anim];
      var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (var r = 0; r < spec.rows.length; r++) {
        for (var f = 0; f < spec.frames; f++) {
          var ox = f * 64, oy = r * 64;
          for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
            if (d[((oy + y) * c.width + ox + x) * 4 + 3] > 8) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
      }
    });
    var tw = maxX - minX + 1, th = maxY - minY + 1;

    // Emit one strip per animation, frames packed at the trimmed size.
    var out = {};
    Object.keys(comps).forEach(function (anim) {
      var c = comps[anim], spec = ANIMS[anim];
      var o = document.createElement('canvas');
      o.width = tw * spec.frames; o.height = th * spec.rows.length;
      var ox = o.getContext('2d');
      ox.imageSmoothingEnabled = false;
      for (var r = 0; r < spec.rows.length; r++)
        for (var f = 0; f < spec.frames; f++)
          ox.drawImage(c, f * 64 + minX, r * 64 + minY, tw, th, f * tw, r * th, tw, th);
      out[anim] = o.toDataURL('image/png');
    });
    return { sheets: out, w: tw, h: th, trimX: minX, trimY: minY };
  }, { jobs: jobs, ANIMS: ANIMS, wanted: wanted });

  await browser.close();

  var manifest = { name: name, frameW: result.w, frameH: result.h, anims: {} };
  Object.keys(result.sheets).forEach(function (anim) {
    var file = name + '.' + anim + '.png';
    fs.writeFileSync(path.join(outDir, file),
      Buffer.from(result.sheets[anim].split(',')[1], 'base64'));
    manifest.anims[anim] = { file: file, rows: ANIMS[anim].rows, frames: ANIMS[anim].frames };
    console.log('  wrote ' + file + '  ' + (result.w * ANIMS[anim].frames) + 'x' + (result.h * 4));
  });
  fs.writeFileSync(path.join(outDir, name + '.frames.json'), JSON.stringify(manifest, null, 2));

  // Attribution is a condition of most of these licences; keep it with the art.
  var credits = ['# ' + name + ' — sprite credits', '',
    'Assembled from the Universal LPC Spritesheet Character Generator.', ''];
  (exp.credits || []).forEach(function (c) {
    credits.push('## ' + c.file);
    if (c.notes) credits.push(c.notes);
    credits.push('- authors: ' + c.authors.join(', '));
    credits.push('- licences: ' + c.licenses.join(', '));
    (c.urls || []).forEach(function (u) { credits.push('- ' + u); });
    credits.push('');
  });
  fs.writeFileSync(path.join(outDir, name + '.CREDITS.md'), credits.join('\n'));
  console.log('  frame ' + result.w + 'x' + result.h);
}
main().catch(function (e) { console.error(e); process.exit(1); });
