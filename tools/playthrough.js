// tools/playthrough.js — drive the whole level end to end, deterministically.
// Walks toward each trigger, presses it when its prompt appears, advances
// dialogue, sits when asked to sit, and reports every scene transition. This
// is the test that proves the level is actually completable.
const { chromium } = require('playwright');
const path = require('path');

const MAX_FRAMES = 60 * 60 * 14;   // 14 simulated minutes, hard stop

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction('window.RB && RB.scene');

  const result = await page.evaluate((MAX) => {
    RB.paused = true;
    const noop = () => {};
    RB.audio = { start: noop, bed: noop, music: noop, ambLevel: noop, fadeOut: noop,
                 started: () => true,
                 sfx: { tick: noop, scan: noop, chime: noop, door: noop, belt: noop } };

    const dt = 1 / 60;
    const log = [];
    let last = null, lastChange = 0, press = false, stuckAt = null, diag = null;
    let lastX = -1e9, blockedFor = 0;

    function anyPrompt() {
      const s = RB.scene;
      return !!(s.showPrompt || s.prompt || s.exitPrompt || s.boardPrompt ||
                (s.seatPrompt !== null && s.seatPrompt !== undefined));
    }

    for (let f = 0; f < MAX; f++) {
      if (RB.scene.id !== last) {
        log.push({ scene: RB.scene.id, atSec: +(f / 60).toFixed(1) });
        last = RB.scene.id;
        lastChange = f;
        lastX = -1e9; blockedFor = 0;
      }
      // 90 simulated seconds with no progress means something is unreachable.
      if (f - lastChange > 60 * 170) {
        stuckAt = last;
        var sc = RB.scene, pl = sc.p && sc.p();
        diag = {
          scene: sc.id,
          player: pl ? { x: Math.round(pl.x), y: Math.round(pl.y) } : null,
          prompts: { prompt: !!sc.prompt, exit: !!sc.exitPrompt, show: !!sc.showPrompt,
                     board: !!sc.boardPrompt, seat: sc.seatPrompt },
          state: JSON.parse(JSON.stringify(RB.state)),
          dialog: RB.dialog.active(),
          fade: +RB.fade.v.toFixed(2)
        };
        break;
      }

      // Decide input for this frame.
      RB.input.left = RB.input.right = RB.input.up = RB.input.down = false;
      RB.input.action = false;

      const g = RB.scene.dbg && RB.scene.dbg();
      if (g && g.seated && !g.boardingCalled) {
        // Seated at the gate with the aeroplane not in yet: do nothing at all,
        // which is the entire intended activity.
      } else if (g && g.boardingCalled && !RB.scene.boardPrompt) {
        RB.input.right = true;              // stand up, then head for the door
      } else if (RB.dialog.active()) {
        press = !press;
        RB.input.action = press;            // tap to advance, don't hold
      } else if (anyPrompt()) {
        press = !press;
        RB.input.action = press;
      } else if (RB.scene.id === 'title') {
        press = !press;
        RB.input.action = press;
      } else if (RB.scene.id !== 'takeoff' && RB.scene.id !== 'sunrise') {
        RB.input.right = true;              // otherwise, keep walking on
        // If x stops increasing something is in the way: sidestep down for a
        // while, then up, the way a person would.
        const px = RB.scene.p ? RB.scene.p().x : 0;
        if (px > lastX + 0.5) { lastX = px; blockedFor = 0; }
        else blockedFor++;
        if (blockedFor > 40) {
          if (((blockedFor / 90) | 0) % 2 === 0) RB.input.down = true;
          else RB.input.up = true;
        }
        if (blockedFor > 400) blockedFor = 0;
      }

      RB.now += dt;
      RB.updateTransition(dt);
      RB.dialog.update(dt);
      RB.caption.update(dt);
      if (RB.scene.update) RB.scene.update(dt);
      RB.input.latch();

      if (RB.scenes.sunrise.finished) {
        log.push({ scene: 'FINISHED', atSec: +(f / 60).toFixed(1) });
        break;
      }
    }
    return { log, stuckAt, diag };
  }, MAX_FRAMES);

  result.log.forEach(e => console.log(`  ${String(e.atSec).padStart(7)}s  ${e.scene}`));
  if (result.stuckAt) { console.log(`\nSTUCK in "${result.stuckAt}" — no progress for 170s`); console.log(JSON.stringify(result.diag, null, 2)); }
  else console.log('\ncompleted the level');
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'no runtime errors');
  await browser.close();
  process.exitCode = result.stuckAt ? 1 : 0;
})();
