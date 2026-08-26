const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await p.goto('file:///home/user/Rhubarb/dist/rhubarb.html');
  await p.waitForFunction('window.RB && RB.scene');
  const fontErrs = await p.evaluate(() => RB.fontErrors);
  // Play it for real: click, press Z, walk right for a while, mash Z at triggers.
  await p.mouse.click(400, 300);
  await p.keyboard.press('KeyZ');
  await p.waitForTimeout(3500);
  const seq = async (secs) => {
    await p.keyboard.down('ArrowRight');
    for (let i=0;i<secs*2;i++){ await p.waitForTimeout(500); await p.keyboard.press('KeyZ'); }
    await p.keyboard.up('ArrowRight');
  };
  await seq(75);
  const st = await p.evaluate(() => ({ scene: RB.scene.id, fade: RB.fade.v, now: Math.round(RB.now) }));
  console.log('after 30s of walking right + mashing Z:', JSON.stringify(st));
  console.log('font glyph errors:', fontErrs.length ? fontErrs : 'none');
  console.log(errs.length ? errs.slice(0,10).join('\n') : 'no runtime errors');
  await b.close();
})();
