// tools/spritesheet.js — render the cast and every animation frame onto one
// sheet, so character art can be judged without hunting for someone in a scene.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 900, height: 620 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction('window.RB && RB.sprites && RB.cast');

  await page.evaluate(() => {
    RB.paused = true;
    RB.cam.x = 0; RB.cam.y = 0;
    RB.clear('#2a3040');

    const S = RB.sprites;
    const rows = [
      ['down',  [S.down[1], S.down[0], S.down[2], S.down[0]]],
      ['up',    [S.up[1], S.up[0], S.up[2], S.up[0]]],
      ['side',  [S.side[1], S.side[0], S.side[2], S.side[0]]],
      ['sit',   [S.sitDown, S.sitSide, S.sitSide, S.down[0]]]
    ];
    // The player, every pose.
    rows.forEach((r, ri) => {
      RB.font.draw(r[0], 2, 6 + ri * 26, '#b3c0d4');
      r[1].forEach((rowsData, ci) => {
        const flip = (r[0] === 'sit' && ci === 2);
        RB.drawSprite(rowsData, 30 + ci * 20, 2 + ri * 26, RB.cast.you, flip);
      });
    });

    // The rest of the cast, facing camera.
    const names = ['driver','agent','guard','suit','student','elder','kid','coat','crew'];
    names.forEach((n, i) => {
      RB.drawSprite(S.down[0], 120 + (i % 5) * 22, 4 + Math.floor(i / 5) * 30, RB.cast[n]);
      RB.font.draw(n, 118 + (i % 5) * 22, 28 + Math.floor(i / 5) * 30, '#8a9bb8');
    });
    // Cup-in-hand check, every facing, plus the sill cup with steam.
    RB.font.draw('holding', 2, 106, '#e8a054');
    ['down','right','left','up'].forEach((d, i) => {
      const a = new RB.Actor({ x: 40 + i * 24, y: 108, pal: RB.cast.you, dir: d, cup: true, shadow: false });
      a.draw();
    });
    RB.sillCup(150, 112, RB.now);
    RB.font.draw('player: blue suit', 2, 132, '#e8a054');
    RB.font.draw('the cast', 120, 92, '#e8a054');
    RB.drawSprite(S.bag, 14, 140, RB.cast.you);
    RB.present();
  });

  await page.locator('canvas').screenshot({ path: path.resolve(__dirname, '..', 'shots', 'spritesheet.png') });
  console.log('wrote shots/spritesheet.png');
  await browser.close();
})();
