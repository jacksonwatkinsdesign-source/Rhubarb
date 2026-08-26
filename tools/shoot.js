// tools/shoot.js — boot the game headless, step each scene deterministically,
// and write a PNG of the 240x160 buffer scaled 3x. This is the only way to
// see whether the art is actually landing.
const { chromium } = require('playwright');
const path = require('path');

const SHOTS = [
  // [name, scene, frames to advance before shooting, setup fn source]
  ['00-title',      'title',    120,  null],
  ['01-curb-arrive','curb',     420,  null],
  ['02-curb-bag',   'curb',     1500, null],
  ['03-checkin',    'checkin',  90,   `RB.state.hasBag=true;RB.scene.p().x=280;`],
  ['04-security',   'security', 260,  `RB.scene.p().x=290;`],
  ['05-concourse',  'gate',     120,  `RB.scene.p().x=180;`],
  ['06-gate-wait',  'gate',     600,  `RB.scene.p().x=598;RB.scene.sitNow();`],
  ['07-gate-plane', 'gate',     1700, `RB.scene.p().x=598;RB.scene.sitNow();`],
  ['08-jetbridge',  'jetbridge',150,  `RB.scene.p().x=300;`],
  ['09-cabin',      'cabin',    120,  `RB.scene.p().x=300;`],
  ['10-taxi',       'takeoff',  1500, null],
  ['11-roll',       'takeoff',  2900, null],
  ['12-climb',      'takeoff',  3600, null],
  ['13-sunrise-a',  'sunrise',  900,  null],
  ['14-sunrise-b',  'sunrise',  2600, null],
  ['15-title-card', 'sunrise',  4200, null],
  ['16-end-card',   'sunrise',  5100, null]
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction('window.RB && RB.scene');
  await page.evaluate(() => {
    RB.paused = true;
    // Silence audio entirely under test — we're checking pictures, and a
    // headless AudioContext just adds noise to the failure output.
    const noop = () => {};
    RB.audio = {
      start: noop, bed: noop, music: noop, ambLevel: noop, fadeOut: noop,
      started: () => true,
      sfx: { tick: noop, scan: noop, chime: noop, door: noop, belt: noop }
    };
  });

  for (const [name, scene, frames, setup] of SHOTS) {
    const res = await page.evaluate(({ scene, frames, setup }) => {
      const err = [];
      try {
        RB.now = 0;
        RB.fade.v = 0;
        RB.enterScene(scene);
        if (setup) eval(setup);
        const dt = 1 / 60;
        for (let i = 0; i < frames; i++) {
          RB.now += dt;
          RB.updateTransition(dt);
          RB.dialog.update(dt);
          RB.caption.update(dt);
          if (RB.scene.update) RB.scene.update(dt);
          RB.input.latch();
        }
        RB.scene.draw();
        RB.caption.draw();
        RB.dialog.draw();
        RB.drawFade();
        RB.present();
        return { ok: true, scene: RB.scene.id, err };
      } catch (e) {
        return { ok: false, err: [e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')] };
      }
    }, { scene, frames, setup });

    if (!res.ok) { console.log(`FAIL ${name}: ${res.err.join('\n')}`); continue; }
    await page.locator('#screen').screenshot({ path: path.resolve(__dirname, '..', 'shots', name + '.png') });
    console.log(`ok   ${name}  (in ${res.scene})`);
  }

  if (errors.length) { console.log('\n--- runtime errors ---'); errors.slice(0, 20).forEach(e => console.log(e)); }
  else console.log('\nno runtime errors');
  await browser.close();
})();
