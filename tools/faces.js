// tools/faces.js — heads only, at 6x, so expression can be judged.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 940 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction('window.RB && RB.sprites');
  await p.evaluate(() => {
    RB.paused = true;
    RB.cam.x = 0; RB.cam.y = 0;
    RB.clear(RB.P.s1);
    const S = RB.sprites, Z = 3;
    const who = [
      ['you',  S.down[0], RB.cast.you,  false],
      ['side', S.side[0], RB.cast.you,  false],
      ['elder',S.down[0], RB.cast.elder,false],
      ['kid',  S.down[0], RB.cast.kid,  false],
      ['agent',S.down[0], RB.cast.agent,false],
      ['coat', S.down[0], RB.cast.coat, false]
    ];
    who.forEach((w, i) => {
      const ox = 6 + i * 42, oy = 8;
      for (let ry = 0; ry < 17; ry++) for (let rx = 0; rx < 20; rx++) {
        const key = w[1][ry][w[3] ? 19 - rx : rx];
        if (key === '.') continue;
        RB.rect(ox + rx * Z, oy + ry * Z, Z, Z, w[2][key] || '#f0f');
      }
      RB.font.draw(w[0], ox + 4, oy + 17 * Z + 4, RB.P.s5);
    });
    RB.present();
  });
  await p.locator('canvas').screenshot({ path: path.resolve(__dirname, '..', 'shots', 'faces.png') });
  console.log('wrote shots/faces.png');
  await b.close();
})();
