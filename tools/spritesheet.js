// tools/spritesheet.js — render the cast and every animation frame onto one
// sheet, so character art can be judged without hunting for someone in a scene.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction('window.RB && RB.sprites && RB.cast');

  await page.evaluate(() => {
    RB.paused = true;
    RB.cam.x = 0; RB.cam.y = 0;
    RB.clear(RB.P.s1);

    const S = RB.sprites;
    const rows = [
      ['down',  [S.down[1], S.down[0], S.down[2], S.down[0]]],
      ['up',    [S.up[1], S.up[0], S.up[2], S.up[0]]],
      ['side',  [S.side[1], S.side[0], S.side[2], S.side[0]]],
      ['sit',   [S.sitDown, S.sitSide, S.sitSide, S.down[0]]]
    ];
    // The player, every pose.
    rows.forEach((r, ri) => {
      RB.font.draw(r[0], 2, 120 + ri * 42, RB.P.s5);
      r[1].forEach((rowsData, ci) => {
        const flip = (r[0] === 'sit' && ci === 2);
        RB.drawSprite(rowsData, 34 + ci * 24, 20 + ri * 42, RB.cast.you, flip);
      });
    });

    // The rest of the cast, facing camera.
    const names = ['driver','agent','guard','suit','student','elder','kid','coat','crew'];
    names.forEach((n, i) => {
      RB.drawSprite(S.down[0], 140 + (i % 5) * 24, 22 + Math.floor(i / 5) * 46, RB.cast[n]);
      RB.font.draw(n, 138 + (i % 5) * 24, 322 + Math.floor(i / 5) * 46, RB.P.s4);
    });
    // Cup-in-hand check, every facing, plus the sill cup with steam.
    RB.font.draw('holding', 2, 192, RB.P.gold2);
    ['down','right','left','up'].forEach((d, i) => {
      const a = new RB.Actor({ x: 40 + i * 28, y: 196, pal: RB.cast.you, dir: d, cup: true, shadow: false });
      a.draw();
    });
    
    // Zoomed faces — draw each head pixel as a 3x3 block.
    RB.font.draw('faces', 2, 214, RB.P.gold2);
    const zoom = (rows, ox, oy, pal, flip) => {
      for (let ry = 0; ry < 16; ry++) for (let rx = 0; rx < 20; rx++) {
        const key = rows[ry][flip ? 19 - rx : rx];
        if (key === '.') continue;
        RB.rect(ox + rx * 3, oy + ry * 3, 3, 3, pal[key] || '#f0f');
      }
    };
    zoom(S.down[0], 44, 200, RB.cast.you);
    zoom(S.side[0], 110, 200, RB.cast.you);
    zoom(S.down[0], 176, 200, RB.cast.elder);
    zoom(S.down[0], 242, 200, RB.cast.kid);
    RB.font.draw('the cast', 140, 132, RB.P.gold2);
    RB.drawSprite(S.bag, 60, 216, RB.cast.you);
    RB.present();
  });

  await page.locator('canvas').screenshot({ path: path.resolve(__dirname, '..', 'shots', 'spritesheet.png') });
  console.log('wrote shots/spritesheet.png');
  await browser.close();
})();
