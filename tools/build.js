// tools/build.js — inline every source file into one self-contained HTML.
// Used for the playable single-file build; the game itself is unchanged.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORDER = [
  'core.js', 'font.js', 'sprites.js', 'audio.js', 'world.js',
  'scenes_ground.js', 'scenes_gate.js', 'scenes_flight.js', 'game.js'
];

const js = ORDER
  .map(f => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'))
  .join('\n');

const html = `<title>Rhubarb — a short flight</title>
<style>
  html, body { margin:0; padding:0; height:100%; background:#05070d; overflow:hidden;
               touch-action:none; overscroll-behavior:none; }
  canvas { display:block; image-rendering:pixelated; image-rendering:crisp-edges; }
  #hint { position:fixed; left:0; right:0; bottom:10px; text-align:center;
          font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; color:#5a6478;
          letter-spacing:.06em; pointer-events:none; transition:opacity .8s; }
</style>
<canvas id="screen"></canvas>
<div id="hint">click, then press Z &nbsp;·&nbsp; arrows or WASD to walk &nbsp;·&nbsp; shift to slow down</div>
<script>
${js}
RB.boot(document.getElementById('screen'));
(function () {
  // The page needs one gesture before audio can start, and the hint should
  // get out of the way the moment the player has read it.
  var hint = document.getElementById('hint');
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
