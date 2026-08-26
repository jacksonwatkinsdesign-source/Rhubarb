// game.js — title screen and the main loop.
(function (RB) {
  'use strict';
  var P = RB.P, A = RB.art;

  // =================================================================== title
  RB.scenes.title = (function () {
    var s = { id: 'title' };
    var t, started;

    s.enter = function () {
      t = 0;
      started = false;
      RB.audio.bed('night');
    };

    s.update = function (dt) {
      t += dt;
      if (!started && t > 0.6 && RB.input.anyPressed()) {
        started = true;
        RB.audio.start();
        RB.go('curb', { fade: 2.0 });
      }
    };

    s.draw = function () {
      RB.clear('#080b16');
      RB.vgrad(0, 0, RB.W, 110, A.skyRamp('night'), 10);
      A.stars(0, RB.W, 4, 92, 0.9);

      // A terminal on the horizon with one aeroplane on the ground.
      RB.rect(0, 104, RB.W, RB.H - 104, '#0e1424');
      RB.rect(0, 104, RB.W, 1, '#1c2540');
      for (var bx = 0; bx < RB.W; bx += 46) {
        RB.rect(bx + 6, 92, 30, 12, '#121a2e');
        for (var wx = bx + 9; wx < bx + 34; wx += 6) {
          if ((wx * 7) % 5 !== 0) RB.rect(wx, 95, 3, 4, '#a8925e');
        }
      }
      A.horizonLights(0, RB.W, 106, 0.6);
      A.airliner(38, 118, 170, '#141a2c', 0.55, true);

      RB.ctx.globalAlpha = RB.clamp(t / 1.6, 0, 1);
      RB.font.drawCentered('RHUBARB', RB.W / 2, 34, '#f2e3c6', { shadow: 'rgba(8,11,22,0.85)', scale: 2, tracking: 3 });
      RB.ctx.globalAlpha = 1;

      if (t > 2.0 && Math.floor(t * 1.4) % 2 === 0) {
        RB.font.drawCentered('press  A', RB.W / 2, RB.H - 30, '#e8a054', { shadow: 'rgba(8,11,22,0.8)' });
      }
      if (t > 3.4) {
        RB.ctx.globalAlpha = 0.45;
        RB.font.drawCentered('arrows to walk   ·   Z is A, X is B   ·   shift to slow down', RB.W / 2, RB.H - 15, '#8a9bb8');
        RB.ctx.globalAlpha = 1;
      }
    };

    return s;
  })();

  // ================================================================ main loop
  var last = 0, acc = 0;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (RB.paused) { RB.present(); return; }
    RB.input.sync();
    if (!last) last = ts;
    var dt = (ts - last) / 1000;
    last = ts;
    // Clamp so a background tab doesn't fast-forward the whole cutscene when
    // the player comes back to it.
    dt = Math.min(dt, 0.05);
    RB.now += dt;

    RB.updateTransition(dt);

    var sc = RB.scene;
    if (sc) {
      // Dialogue eats input while it's up; scenes check RB.dialog.active().
      RB.dialog.update(dt);
      RB.chooser.update(dt);
      RB.caption.update(dt);
      if (sc.update) sc.update(dt);
      if (sc.draw) sc.draw();
    }

    RB.caption.draw();
    RB.dialog.draw();
    RB.chooser.draw();
    RB.drawFade();

    RB.input.latch();
    RB.present();
  }

  RB.boot = function (canvas) {
    RB.attach(canvas);
    RB.mountTouchControls();
    RB.now = 0;
    RB.enterScene('title');
    // Browsers require a gesture before audio; wire the first key/tap to it.
    RB.onFirstInput = function () { RB.audio.start(); };
    requestAnimationFrame(frame);
  };
})(window.RB = window.RB || {});

// Debug affordance used by the screenshot harness in tools/: when set, the
// rAF loop stops advancing so a test can step the simulation by hand.
