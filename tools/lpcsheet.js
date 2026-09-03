const fs=require('fs'),{chromium}=require('playwright');
const M=require('/home/user/Rhubarb/assets/chars/oldman.frames.json');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage();
 const d=f=>'data:image/png;base64,'+fs.readFileSync('/home/user/Rhubarb/assets/chars/'+f).toString('base64');
 const buf=await p.evaluate(async(imgs)=>{
   const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;});
   const W=await load(imgs.walk);
   const c=document.createElement('canvas');
   const S=4, fw=imgs.fw, fh=imgs.fh;
   c.width=fw*9*S; c.height=fh*4*S+fh*4+20;
   const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
   x.fillStyle='#2c3a6e'; x.fillRect(0,0,c.width,c.height);
   x.drawImage(W,0,0,W.width,W.height,0,0,W.width*S,W.height*S);
   x.drawImage(W,0,0,W.width,W.height,0,fh*4*S+20,W.width,W.height);
   return c.toDataURL('image/png');
 },{walk:d('oldman.walk.png'),fw:M.frameW,fh:M.frameH});
 fs.writeFileSync('/home/user/Rhubarb/shots/lpc_walk.png',Buffer.from(buf.split(',')[1],'base64'));
 await b.close(); console.log('ok');
})();
