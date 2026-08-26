// tools/touchtest.js — verify the on-screen controls on a tablet viewport:
// that they mount, that the button registers, that holding a d-pad direction
// actually walks the character, and that the game is not hidden behind them.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 768 },   // iPad landscape
    hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.resolve(__dirname, '..', 'dist', 'rhubarb.html'));
  await page.waitForFunction('window.RB && RB.scene');

  await page.evaluate(() => {
    // Helpers the test drives the controls with. Real TouchEvents, so the
    // production hit-testing path is what's under test.
    window.__t = {
      down: {},
      fire(type, id, x, y) {
        const target = document.elementFromPoint(x, y) || document.body;
        const t = new Touch({ identifier: id, target, clientX: x, clientY: y });
        if (type === 'touchend') delete this.down[id];
        else this.down[id] = t;
        target.dispatchEvent(new TouchEvent(type, {
          changedTouches: [t], touches: Object.values(this.down),
          targetTouches: [], bubbles: true, cancelable: true
        }));
      },
      rect(sel) { const r = document.querySelector(sel).getBoundingClientRect();
                  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, top: r.top }; }
    };
  });

  const visible = await page.evaluate(() => RB.touchControlsVisible());
  const geom = await page.evaluate(() => {
    const pad = window.__t.rect('#rb-pad'), btn = window.__t.rect('#rb-a');
    const canvas = document.querySelector('canvas').getBoundingClientRect();
    return { pad, btn, inset: RB.uiInset, canvasH: canvas.height, vh: window.innerHeight };
  });
  console.log('controls mounted:', visible);
  console.log('pad', Math.round(geom.pad.w) + 'px  button', Math.round(geom.btn.w) + 'px  reserved inset', geom.inset + 'px');

  // The game must be drawn entirely above the controls.
  const gameBottom = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    // offY + H*scale, recovered from the reserved area
    return (window.innerHeight - RB.uiInset + RB.H * Math.max(1,
      Math.floor(Math.min(window.innerWidth / RB.W, (window.innerHeight - RB.uiInset) / RB.H)))) / 2;
  });
  console.log('game bottom edge', Math.round(gameBottom) + 'px   controls top', Math.round(geom.pad.top) + 'px',
              gameBottom <= geom.pad.top ? '(clear)' : '(OVERLAP)');

  // Press the button to leave the title screen. The title ignores input for
  // its first moments, so give it a beat.
  await page.waitForTimeout(1400);
  await page.evaluate(() => { const b = window.__t.rect('#rb-a'); window.__t.fire('touchstart', 1, b.cx, b.cy); });
  await page.waitForTimeout(220);
  await page.evaluate(() => { const b = window.__t.rect('#rb-a'); window.__t.fire('touchend', 1, b.cx, b.cy); });
  await page.waitForTimeout(2600);          // the title fades out over 2s
  console.log('after button tap, scene =', await page.evaluate(() => RB.scene.id));

  // Skip the arrival cutscene, then hold right on the pad and see if we walk.
  await page.evaluate(() => { RB.paused = true;
    let press = false;
    for (let i = 0; i < 60 * 40; i++) {
      // The arrival cutscene waits on its one line of dialogue, so tap through
      // it while fast-forwarding or the scene never hands back control.
      RB.input.action = RB.dialog.active() ? (press = !press) : false;
      RB.now += 1/60; RB.updateTransition(1/60);
      RB.dialog.update(1/60); RB.caption.update(1/60); RB.scene.update(1/60); RB.input.latch();
    }
    RB.input.action = false;
    RB.paused = false; });
  await page.waitForTimeout(300);

  const before = await page.evaluate(() => RB.scene.p ? RB.scene.p().x : null);
  console.log('walking test runs in scene =', await page.evaluate(() => RB.scene.id));
  await page.evaluate(() => { const p = window.__t.rect('#rb-pad');
    window.__t.fire('touchstart', 2, p.cx + p.w * 0.38, p.cy); });     // right arm
  await page.waitForTimeout(900);
  const held = await page.evaluate(() => ({
    x: RB.scene.p ? RB.scene.p().x : null,
    right: RB.input.right,
    armLit: document.querySelector('#rb-pad .rt').classList.contains('hit')
  }));

  // Diagonal: slide the same touch down-right, and press the button at once.
  await page.evaluate(() => { const p = window.__t.rect('#rb-pad');
    window.__t.fire('touchmove', 2, p.cx + p.w * 0.30, p.cy + p.h * 0.30);
    const b = window.__t.rect('#rb-a'); window.__t.fire('touchstart', 3, b.cx, b.cy); });
  await page.waitForTimeout(120);
  const multi = await page.evaluate(() => ({ right: RB.input.right, down: RB.input.down, action: RB.input.action }));

  // B, and A+B together.
  await page.evaluate(() => {
    const b = window.__t.rect('#rb-b');
    window.__t.fire('touchstart', 4, b.cx, b.cy);
  });
  await page.waitForTimeout(120);
  const bOnly = await page.evaluate(() => ({ b: RB.input.b, action: RB.input.action,
    lit: document.querySelector('#rb-b').classList.contains('hit') }));
  await page.evaluate(() => { window.__t.fire('touchend', 4, 0, 0); });

  await page.evaluate(() => { window.__t.fire('touchend', 2, 0, 0); window.__t.fire('touchend', 3, 0, 0); });
  await page.waitForTimeout(150);
  const released = await page.evaluate(() => ({ right: RB.input.right, action: RB.input.action }));

  console.log('hold right:  x ' + Math.round(before) + ' -> ' + Math.round(held.x) +
              '   input.right=' + held.right + '   arm highlighted=' + held.armLit);
  console.log('diagonal + A held together:', JSON.stringify(multi));
  console.log('B button:', JSON.stringify(bOnly));
  console.log('after release:', JSON.stringify(released));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no runtime errors');

  await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', 'ipad-controls.png') });
  await browser.close();
})();
