// tools/mockup.js — small style mockups of one room, drawn three ways, so a
// direction can be judged before it is committed to across nine scenes.
const { chromium } = require('playwright');
const path = require('path');

const PAGE = `<canvas id="c" width="1580" height="440"></canvas>
<style>body{margin:0;background:#0a0a0e}canvas{image-rendering:pixelated}</style>
<script>
const C = document.getElementById('c').getContext('2d');
C.imageSmoothingEnabled = false;

// ---- one palette, used by every panel. Soft, slightly desaturated, warm and
// cool balanced — the Ihatovo / EarthBound register rather than pure GBA punch.
const P = {
  ink:'#1b1a26', sh:'#2c2a3a', s1:'#43415a', s2:'#5b5876', s3:'#787595',
  s4:'#9a97b2', pale:'#c3c0d2', white:'#eceaf2',
  w1:'#4a3a36', w2:'#6d564a', w3:'#957560', w4:'#bd9a76', cream:'#e6d6b6',
  teal:'#46707e', green:'#5c8062', red:'#9e5058', gold:'#d8a860',
  sky1:'#2a2b4e', sky2:'#4a4470', sky3:'#8a6a86', sky4:'#d09a7c'
};

function panel(ox, oy, W, H, scale, label, mode) {
  const px = (x,y,w,h,c)=>{ C.fillStyle=c; C.fillRect(ox+Math.round(x)*scale, oy+Math.round(y)*scale, Math.round(w)*scale, Math.round(h)*scale); };
  // clip to the panel
  C.save(); C.beginPath(); C.rect(ox,oy,W*scale,H*scale); C.clip();

  const DEP = 0.62;                       // oblique foreshortening
  const off = d => Math.round(d*DEP);
  // A box seen in oblique: front face true, top and side sheared up-right.
  function box(x,y,w,h,d,face,top,side){
    for(let i=d;i>0;i--){ const o=off(i); px(x+o, y-o, w, 1, top); }
    for(let i=d;i>0;i--){ const o=off(i); px(x+w+o-1, y-o, 1, h, side); }
    px(x,y,w,h,face);
    px(x,y,w,1,'rgba(255,255,255,0.10)');
  }
  function flatBox(x,y,w,h,face,top){
    px(x,y-3,w,3,top); px(x,y,w,h,face); px(x,y,w,1,'rgba(255,255,255,0.10)');
  }

  const OB = mode !== 'flat';
  const FLOOR = OB ? Math.round(H*0.52) : Math.round(H*0.56);

  // ---- sky beyond the glass
  px(0,0,W,FLOOR-2, P.sky1);
  [[0,0.30,P.sky1],[0.30,0.52,P.sky2],[0.52,0.72,P.sky3],[0.72,1,P.sky4]].forEach(b=>{
    const y0=Math.round(b[0]*(FLOOR-2)), y1=Math.round(b[1]*(FLOOR-2));
    px(0,y0,W,y1-y0,b[2]);
  });
  // distant terminal, one silhouette module repeated with fittings tacked on
  for(let x=-8;x<W;x+=40){
    px(x,FLOOR-16,30,14,P.sh);
    px(x,FLOOR-16,30,1,P.s1);
    px(x+22,FLOOR-24,5,9,P.sh);            // the tacked-on bit
    px(x+4,FLOOR-12,3,3,P.w4); px(x+12,FLOOR-12,3,3,P.w4);
  }
  px(0,FLOOR-2,W,2,P.s1);

  // ---- floor
  px(0,FLOOR,W,H-FLOOR,P.s1);
  if(OB){
    // Oblique floor: horizontals stay flat, depth lines shear up-right. Kept
    // faint — the grid should say "ordered", not "graph paper".
    for(let y=FLOOR+8;y<H;y+=12) px(0,y,W,1,'#4c4a63');
    for(let x=-48;x<W+48;x+=24){
      for(let i=0;i<H-FLOOR;i++) px(x+off(i), H-i, 1, 1, '#4c4a63');
    }
    px(0,FLOOR,W,2,'#5a5772');
  } else {
    for(let y=FLOOR+8;y<H;y+=10) px(0,y,W,1,P.sh);
    for(let x=0;x<W;x+=16) px(x,FLOOR,1,H-FLOOR,P.sh);
  }

  // ---- glass wall module, repeated on the grid
  for(let x=0;x<W;x+=32){
    px(x,8,2,FLOOR-10,P.s2);
    px(x+1,8,1,FLOOR-10,P.s3);
  }
  px(0,6,W,3,P.s2); px(0,6,W,1,P.s3);

  // ---- ceiling
  px(0,0,W,7,P.sh);
  for(let x=6;x<W;x+=32){
    px(x,4,18,2,P.cream);
    if(OB){ C.globalAlpha=0.05; px(x-3,7,24,H-7,P.w4); C.globalAlpha=1; }
  }

  // ---- furniture, all from the same kit, on an 8px grid
  if(OB){
    // Seat bank: ONE module repeated, with fittings tacked on — a back, an
    // armrest between each. This is the whole grammar idea in miniature.
    for(let i=0;i<4;i++){
      const sx = 22+i*20;
      box(sx+1, FLOOR+1, 16, 10, 5, '#3c626d', '#4f7c88', '#2c4a54');  // back
      box(sx, FLOOR+10, 18, 6, 7, P.teal, '#63909b', '#33555f');       // seat pan
      px(sx+2, FLOOR+16, 3, 5, P.s1);                                  // legs
      px(sx+13, FLOOR+16, 3, 5, P.s1);
      if(i) px(sx-1, FLOOR+7, 2, 5, '#2c4a54');                        // armrest
    }
    // Counter: same box module, bigger, with its own fittings on top.
    box(W-74, FLOOR+3, 58, 15, 11, P.w2, P.w3, P.w1);
    const cd = off(11);
    px(W-74+cd, FLOOR+3-cd, 58, 2, P.cream);
    px(W-74+cd+8, FLOOR+3-cd-9, 11, 9, P.s1);                          // monitor
    px(W-74+cd+9, FLOOR+3-cd-8, 9, 6, P.teal);
    px(W-74+cd+34, FLOOR+3-cd-6, 14, 6, P.gold);                       // little sign
    // Pillar: same module again, with a cap and a base tacked on.
    box(W-98, FLOOR-26, 10, 44, 6, P.s2, P.s3, P.s1);
    px(W-100, FLOOR-28, 14, 3, P.s3);
    px(W-100, FLOOR+16, 14, 3, P.s1);
    // Bin — the smallest instance of the same module.
    box(W-90, FLOOR+14, 8, 9, 5, P.s1, P.s2, P.ink);
  } else {
    for(let i=0;i<4;i++){
      const sx = 24+i*20;
      flatBox(sx, FLOOR+10, 18, 8, P.teal);
      px(sx+1, FLOOR+1, 16, 10, '#3c626d');
    }
    flatBox(W-72, FLOOR+4, 56, 15, P.w3); px(W-72,FLOOR+1,56,3,P.cream);
    flatBox(W-96, FLOOR-24, 10, 43, P.s2);
    flatBox(W-88, FLOOR+14, 8, 10, P.s1);
  }

  // ---- a figure, same in every panel, for scale
  const fx = Math.round(W*0.46), fy = FLOOR+6;
  px(fx+3,fy,10,4,'#3a2a1c'); px(fx+2,fy+3,12,7,'#f0c090');
  px(fx+4,fy+6,2,2,P.ink); px(fx+9,fy+6,2,2,P.ink);
  px(fx+2,fy+10,12,9,'#3c6fc0'); px(fx+6,fy+11,4,7,'#f2eee0');
  px(fx+3,fy+19,4,5,'#2e5296'); px(fx+9,fy+19,4,5,'#2e5296');
  px(fx+3,fy+24,4,2,P.ink); px(fx+9,fy+24,4,2,P.ink);
  C.ctx = null;
  C.restore();

  // frame + label
  C.strokeStyle = '#33313f'; C.lineWidth = 2;
  C.strokeRect(ox-1, oy-1, W*scale+2, H*scale+2);
  C.fillStyle = '#9a97b2';
  C.font = '600 15px ui-monospace, Menlo, monospace';
  C.fillText(label, ox, oy - 10);
}

C.fillStyle = '#0a0a0e'; C.fillRect(0,0,1580,440);
panel(20,  40, 240, 160, 2, 'A — now (flat, ad-hoc)', 'flat');
panel(520, 40, 240, 160, 2, 'B — oblique + grammar, GBA 240x160', 'ob');
panel(1020,40, 256, 224, 2, 'C — same, SNES 256x224', 'ob');
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1580, height: 440 } });
  await p.setContent(PAGE);
  await p.waitForTimeout(300);
  await p.locator('#c').screenshot({ path: path.resolve(__dirname, '..', 'shots', 'mockup.png') });
  console.log('wrote shots/mockup.png');
  await b.close();
})();
