// Put the LPC character into a real curb frame at 1:1 next to our own sprite.
const { chromium } = require('playwright');
const M = require('/home/user/Rhubarb/assets/chars/oldman.frames.json');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 896 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction('window.RB && RB.scene');
  await p.evaluate(() => {
    RB.paused = true;
    const noop = () => {};
    RB.audio = { start: noop, bed: noop, music: noop, ambLevel: noop, fadeOut: noop,
      started: () => true, sfx: { tick: noop, scan: noop, chime: noop, door: noop, belt: noop } };
  });
  const raw = await p.evaluate(() => {
    window.__noAuto = false;
    RB.now = 0; RB.fade.v = 0;
    RB.enterScene('curb');
    const dt = 1 / 60; let press = false;
    for (let i = 0; i < 1500; i++) {
      RB.input.action = (RB.chooser.active() || RB.dialog.active()) ? (press = !press) : false;
      RB.now += dt;
      RB.updateTransition(dt); RB.dialog.update(dt); RB.chooser.update(dt);
      RB.caption.update(dt);
      if (RB.scene.update) RB.scene.update(dt);
      RB.input.latch();
    }
    RB.scene.draw(); RB.caption.draw(); RB.drawFade(); RB.present();
    return document.querySelector('canvas').toDataURL('image/png');
  });
  const lpc = 'data:image/png;base64,' +
    fs.readFileSync(path.resolve(__dirname, '..', 'assets/chars/oldman.walk.png')).toString('base64');
  const out = await p.evaluate(async (a) => {
    const { raw, lpc } = a;
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const bg = await load(raw), sh = await load(lpc);
    const fw = a.fw, fh = a.fh;
    const GS = bg.width / 256;            // the buffer is already presented upscaled
    const c = document.createElement('canvas');
    c.width = bg.width; c.height = bg.height;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(bg, 0, 0);
    // down-facing walk is row 2; stand them on the pavement line beside us
    [[70, 160], [104, 160], [200, 160]].forEach(([px, py], n) => {
      x.drawImage(sh, n * fw, 2 * fh, fw, fh,
        (px - fw / 2) * GS, (py - fh) * GS, fw * GS, fh * GS);
    });
    return c.toDataURL('image/png');
  }, { raw, lpc, fw: M.frameW, fh: M.frameH });
  fs.writeFileSync(path.resolve(__dirname, '..', 'shots/lpc_scale.png'),
    Buffer.from(out.split(',')[1], 'base64'));
  await b.close(); console.log('ok');
})();
