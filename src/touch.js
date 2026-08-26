// touch.js — on-screen d-pad and button for touch devices.
//
// Built as DOM over the canvas rather than drawn into the 240x160 buffer, so
// the controls stay finger-sized regardless of how far the game is scaled up.
// Every active touch is hit-tested against the controls each event, which is
// what makes "hold a direction and tap the button" work, and lets a thumb
// slide around the pad without lifting.
(function (RB) {
  'use strict';

  var root = null, pad = null, btn = null, btnB = null, mounted = false;
  var touches = Object.create(null);

  // dx/dy octant -> directions. Index 0 is due right, going clockwise.
  var OCT = [
    ['right'], ['right', 'down'], ['down'], ['left', 'down'],
    ['left'], ['left', 'up'], ['up'], ['right', 'up']
  ];

  var CSS = [
    '#rb-touch,#rb-touch *{box-sizing:border-box;}',
    '#rb-touch{position:fixed;left:0;right:0;bottom:0;z-index:10;',
    '  display:none;align-items:center;justify-content:space-between;',
    '  padding:0 max(18px,env(safe-area-inset-left)) max(14px,env(safe-area-inset-bottom))',
    '          max(18px,env(safe-area-inset-right));',
    '  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;}',
    // D-pad on the right, button on the left. Reversing the flex direction
    // swaps them without touching the DOM order the hit-testing reads.
    '#rb-touch.on{display:flex;flex-direction:row-reverse;}',
    '#rb-pad{position:relative;width:var(--pad);height:var(--pad);flex:none;}',
    '#rb-pad .arm{position:absolute;background:#232a3c;border:2px solid #3d4760;',
    '  box-shadow:0 2px 0 #10141f;}',
    '#rb-pad .up{left:34%;top:0;width:32%;height:38%;border-radius:8px 8px 0 0;border-bottom:none;}',
    '#rb-pad .dn{left:34%;bottom:0;width:32%;height:38%;border-radius:0 0 8px 8px;border-top:none;}',
    '#rb-pad .lf{top:34%;left:0;height:32%;width:38%;border-radius:8px 0 0 8px;border-right:none;}',
    '#rb-pad .rt{top:34%;right:0;height:32%;width:38%;border-radius:0 8px 8px 0;border-left:none;}',
    '#rb-pad .hub{left:30%;top:30%;width:40%;height:40%;border:2px solid #3d4760;}',
    '#rb-pad .arm.hit{background:#3f6ea8;border-color:#5f93d0;}',
    // Two keys, offset like a handheld: B low and left, A high and right.
    '#rb-keys{position:relative;flex:none;display:block;',
    '  width:calc(var(--btn)*2.15);height:calc(var(--btn)*1.5);}',
    '.rb-key{position:absolute;width:var(--btn);height:var(--btn);border-radius:50%;',
    '  background:#232a3c;box-shadow:0 3px 0 #10141f;',
    '  display:flex;align-items:center;justify-content:center;',
    '  font:600 calc(var(--btn)*0.34)/1 ui-monospace,SFMono-Regular,Menlo,monospace;',
    '  letter-spacing:.04em;}',
    '#rb-a{right:0;top:0;border:3px solid #6b5a34;color:#e8a054;}',
    '#rb-b{left:0;bottom:0;border:3px solid #4a4a68;color:#8fa0bb;}',
    '.rb-key.hit{transform:translateY(2px);box-shadow:0 1px 0 #10141f;}',
    '#rb-a.hit{background:#4a3a1e;border-color:#e8a054;color:#f4d8a8;}',
    '#rb-b.hit{background:#2c3350;border-color:#8fa0bb;color:#dfe6f0;}',
    '@media (prefers-reduced-motion:reduce){#rb-btn{transition:none;}}'
  ].join('\n');

  function sizes() {
    // Pad and button scale with the short edge, clamped so they stay usable on
    // a phone and don't become absurd on a 13" tablet.
    var short = Math.min(window.innerWidth, window.innerHeight);
    var padPx = Math.round(Math.max(112, Math.min(168, short * 0.28)));
    var btnPx = Math.round(Math.max(64, Math.min(104, short * 0.155)));
    return { pad: padPx, btn: btnPx };
  }

  function layout() {
    if (!mounted) return;
    var s = sizes();
    root.style.setProperty('--pad', s.pad + 'px');
    root.style.setProperty('--btn', s.btn + 'px');
    // Reserve the strip the controls occupy so the game letterboxes above them
    // instead of hiding behind a thumb.
    RB.uiInset = s.pad + 24;
    RB.resize();
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.id = 'rb-touch';
    root.innerHTML =
      '<div id="rb-pad">' +
        '<div class="arm up" data-dir="up"></div>' +
        '<div class="arm lf" data-dir="left"></div>' +
        '<div class="arm rt" data-dir="right"></div>' +
        '<div class="arm dn" data-dir="down"></div>' +
        '<div class="arm hub"></div>' +
      '</div>' +
      '<div id="rb-keys">' +
        '<div class="rb-key" id="rb-b">B</div>' +
        '<div class="rb-key" id="rb-a">A</div>' +
      '</div>';
    document.body.appendChild(root);

    pad = root.querySelector('#rb-pad');
    btn = root.querySelector('#rb-a');
    btnB = root.querySelector('#rb-b');
    mounted = true;
  }

  function paint(dirs, action, bDown) {
    var arms = pad.querySelectorAll('.arm[data-dir]');
    for (var i = 0; i < arms.length; i++) {
      arms[i].classList.toggle('hit', dirs.indexOf(arms[i].getAttribute('data-dir')) >= 0);
    }
    btn.classList.toggle('hit', action);
    btnB.classList.toggle('hit', bDown);
  }

  // Recompute the whole control state from every touch currently down.
  function apply() {
    var dirs = [], action = false, bDown = false;
    var pr = pad.getBoundingClientRect();
    var br = btn.getBoundingClientRect(), br2 = btnB.getBoundingClientRect();
    var pcx = pr.left + pr.width / 2, pcy = pr.top + pr.height / 2;
    var bcx = br.left + br.width / 2, bcy = br.top + br.height / 2;
    var b2cx = br2.left + br2.width / 2, b2cy = br2.top + br2.height / 2;

    for (var id in touches) {
      var t = touches[id];
      // Buttons first, with a generous radius — a near miss should still fire.
      var bdx = t.x - bcx, bdy = t.y - bcy;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < br.width * 0.72) { action = true; continue; }
      var b2dx = t.x - b2cx, b2dy = t.y - b2cy;
      if (Math.sqrt(b2dx * b2dx + b2dy * b2dy) < br2.width * 0.72) { bDown = true; continue; }

      var dx = t.x - pcx, dy = t.y - pcy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > pr.width * 0.95) continue;
      if (dist < pr.width * 0.15) continue;              // dead zone at the hub
      var oct = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      var set = OCT[oct];
      for (var j = 0; j < set.length; j++) {
        if (dirs.indexOf(set[j]) < 0) dirs.push(set[j]);
      }
    }

    RB.clearTouch();
    for (var k = 0; k < dirs.length; k++) RB.setTouch(dirs[k], true);
    if (action) RB.setTouch('action', true);
    if (bDown) RB.setTouch('b', true);
    paint(dirs, action, bDown);
  }

  function track(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (e.type === 'touchend' || e.type === 'touchcancel') delete touches[t.identifier];
      else touches[t.identifier] = { x: t.clientX, y: t.clientY };
    }
    apply();
    if (RB.onFirstInput) { RB.onFirstInput(); RB.onFirstInput = null; }
  }

  RB.mountTouchControls = function (force) {
    var coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    var touchCapable = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!force && !coarse && !touchCapable) return false;

    if (!mounted) build();
    root.classList.add('on');
    layout();

    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (ev) {
      window.addEventListener(ev, function (e) {
        track(e);
        // Only swallow the gesture when it started on the controls, so the
        // host page can still be scrolled from elsewhere.
        if (e.target && root.contains(e.target)) e.preventDefault();
      }, { passive: false });
    });
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 150); });
    return true;
  };

  RB.touchControlsVisible = function () { return mounted && root.classList.contains('on'); };
})(window.RB = window.RB || {});
