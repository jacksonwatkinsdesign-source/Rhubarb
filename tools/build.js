// tools/build.js — inline every source file into one self-contained HTML.
// Used for the playable single-file build; the game itself is unchanged.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORDER = [
  'palette.js', 'core.js', 'font.js', 'touch.js', 'sprites.js', 'audio.js', 'oblique.js', 'world.js',
  'scenes_ground.js', 'scenes_gate.js', 'scenes_flight.js', 'game.js'
];

const js = ORDER
  .map(f => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'))
  .join('\n');

const html = `<title>Rhubarb</title>
<style>
  /* The page is a single game screen, so it commits to one visual world
     rather than following the viewer's theme — but every colour is painted
     explicitly so it holds on either host ground. The ground and the chrome
     are taken from the game's own palette. */
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: #05070d; color: #8a9bb8;
    overflow: hidden; touch-action: none; overscroll-behavior: none;
  }
  canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  #hint {
    position: fixed; left: 0; right: 0; bottom: 14px;
    text-align: center;
    font: 10px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: .14em; text-transform: uppercase;
    color: #4e5a72; background: none;
    pointer-events: none; transition: opacity 1.2s ease;
  }
  #hint b { color: #8a7350; font-weight: 500; }
  @media (prefers-reduced-motion: reduce) { #hint { transition: none; } }
</style>
<canvas id="screen"></canvas>
<div id="hint">click, then press <b>Z</b> (A) &nbsp;·&nbsp; arrows to walk &nbsp;·&nbsp; X is B &nbsp;·&nbsp; shift to slow down</div>
<script>
${js}
RB.boot(document.getElementById('screen'));
(function () {
  // The page needs one gesture before audio can start, and the hint should
  // get out of the way the moment the player has read it.
  var hint = document.getElementById('hint');
  if (RB.touchControlsVisible && RB.touchControlsVisible()) {
    hint.innerHTML = 'tap <b>A</b> to begin &nbsp;·&nbsp; d-pad to walk';
  }
  function go() {
    if (RB.onFirstInput) { RB.onFirstInput(); RB.onFirstInput = null; }
    hint.style.opacity = 0;
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
  }
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
  setTimeout(function () { hint.style.opacity = 0; }, 14000);
  // Keep focus so arrow keys reach the canvas rather than scrolling a host page.
  window.focus();
})();
</script>
`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'rhubarb.html'), html);
console.log('dist/rhubarb.html  ' + (html.length / 1024).toFixed(1) + ' KB');
