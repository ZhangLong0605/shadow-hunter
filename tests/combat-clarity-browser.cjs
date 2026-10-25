/* Reproducible Edge QA for busy combat using actual game renderers and local assets. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist'),out=path.join(__dirname,'screenshots');
const hook=`window.clarityQA={get state(){return state},get player(){return player},get enemies(){return enemies},get hazards(){return hazards},get projectiles(){return projectiles},get effects(){return effects},get camera(){return camera},get mouse(){return mouse},reset,enterWorld,closeModal,spawnEnemy,shoot,updateBuild,updateUI,updateReleaseSettings,setViewRange,updateCamera,draw,drawFeedback,richVisuals,telegraphInfo,setClock(v){clock=v;}};`;
const scenarios=[
 {name:'forest',world:'forest',width:1440,height:1000,range:100,rich:true},
 {name:'tide-wide',world:'tide',width:1440,height:1000,range:200,rich:true},
 {name:'forge',world:'forge',width:1440,height:1000,range:100,rich:true},
 {name:'eclipse-compact-low',world:'eclipse',width:1024,height:600,range:100,rich:false},
 {name:'forest-reduced-motion',world:'forest',width:1440,height:1000,range:100,rich:true,reduced:true},
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1}),errors=[],results=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{let seed=731;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  await page.route('http://combat.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html',filename=path.resolve(root,name);
   if(!filename.startsWith(root+path.sep))return route.abort();
   let body=fs.readFileSync(filename);
   if(name==='game.js'){assert.ok(body.toString().includes('makeGround();reset();requestAnimationFrame(frame);'));body=Buffer.from(body.toString().replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();'));}
   await route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream'});
  });
  await page.goto('http://combat.test/');
  await page.waitForFunction(()=>window.HUNTER_ART?.spriteStatus().ready&&window.HUNTER_COMBAT);
  await page.evaluate(()=>{
   const combat=window.HUNTER_COMBAT,feedback=window.HUNTER_FEEDBACK,scene=window.HUNTER_SCENE;
   window.layerAudit=[];
   window.HUNTER_FEEDBACK={...feedback,render(canvas,v){window.layerAudit.push('feedback');window.feedbackProjection=v;return feedback.render(canvas,v);}};
   window.HUNTER_COMBAT={...combat,render(g,v){window.layerAudit.push('danger');window.dangerProjection={matrix:g.getTransform(),view:v};return combat.render(g,v);}};
   window.HUNTER_SCENE={...scene,atmosphere(g,v){window.layerAudit.push('atmosphere');return scene.atmosphere(g,v);}};
  });
  for(const scenario of scenarios){
   await page.setViewportSize({width:scenario.width,height:scenario.height});await page.emulateMedia({reducedMotion:scenario.reduced?'reduce':'no-preference'});
   const metrics=await page.evaluate(s=>{
    const q=window.clarityQA,fx=window.HUNTER_FEEDBACK;q.reset();q.enterWorld(s.world);q.closeModal('playing');q.updateReleaseSettings({sound:false,shake:false,atmosphere:s.rich});
    q.setViewRange(s.range);q.enemies.length=0;q.hazards.length=0;q.projectiles.length=0;q.effects.length=0;q.setClock(12);
    const p=q.player;p.x=760;p.y=1740;p.hp=100;p.invincible=0;p.shield=3;p.angle=-.15;
    const make=(type,dx,dy,attack,target,options={})=>Object.assign(q.spawnEnemy(type,p.x+dx,p.y+dy,!!options.elite,!!options.boss),{attack,target:{x:p.x+target[0],y:p.y+target[1]},telegraph:.48,windup:1.05,aggro:true,level:3,hp:160,maxHp:200,...options});
    make('giant',-210,58,'slam',[-210,58]);
    make('wolf',-270,-175,'lunge',[-20,10]);
    make('ghost',235,-115,'curse',[100,35],{elite:true});
    make('mirror',300,130,'shot',[-120,-35]);
    make('fire',100,-190,'meteor',[-68,-55]);
    q.hazards.push({x:p.x-60,y:p.y+138,r:72,life:2.3,tick:.4,friendly:false,poison:true,color:'#84c8a3'});
    q.hazards.push({x:p.x-60,y:p.y-70,r:95,life:2,friendly:true,color:'#e7b78a'});
    q.shoot(p.x+205,p.y+58,Math.PI+.3,200,10,'#84c8a3',{enemy:true,life:2.4});
    q.shoot(p.x+85,p.y-135,Math.PI*.75,260,10,'#d5b1e2',{enemy:true,life:2.4});
    q.shoot(p.x+80,p.y-15,-.15,620,48,'#c3e3a2',{enemy:false,pierce:true,life:1,skill:true});
    q.state.slots=['fire'];q.state.owned.add('fire');q.state.skillCd=2.1;q.mouse.x=p.x+200;q.mouse.y=p.y-20;q.updateBuild();q.updateUI();q.updateCamera(0,true);
    fx.clear();fx.emit('cast',{skill:'fire',x:p.x,y:p.y,angle:-.15,color:'#edac6f'});fx.emit('cast',{skill:'wolf',x:p.x-150,y:p.y+32,tx:p.x+90,ty:p.y+15,color:'#a2f3df'});fx.emit('cast',{skill:'shield',x:p.x,y:p.y,color:'#b7e8ff'});
    for(const e of q.enemies.slice(0,4))fx.emit('impact',{x:e.x,y:e.y,color:'#ffe1aa',angle:.3});
    for(let i=0;i<4;i++){window.layerAudit=[];q.draw();q.drawFeedback(.04);}
    const overlay=document.getElementById('feedback-canvas'),canvas=document.getElementById('game'),matrix=window.dangerProjection.matrix,v=window.feedbackProjection;
    const projectionError=Math.max(...[p,...q.enemies].map(point=>{const f=v.screenPoint(point),x=(matrix.a*point.x+matrix.c*point.y+matrix.e)/overlay.width,y=(matrix.b*point.x+matrix.d*point.y+matrix.f)/overlay.height;return Math.hypot((x-f.x)*canvas.clientWidth,(y-f.y)*canvas.clientHeight);}));
    const pixels=overlay.getContext('2d').getImageData(0,0,overlay.width,overlay.height).data;let orange=0,purple=0;
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<160)continue;if(Math.abs(pixels[i]-255)<6&&Math.abs(pixels[i+1]-120)<6&&Math.abs(pixels[i+2]-94)<6)orange++;if(Math.abs(pixels[i]-214)<6&&Math.abs(pixels[i+1]-155)<6&&Math.abs(pixels[i+2]-255)<6)purple++;}
    return {name:s.name,rich:q.richVisuals(),layerOrder:window.layerAudit,projectionError,orangePixels:orange,purplePixels:purple,cues:window.dangerProjection.view.cues.length,canvas:{width:canvas.clientWidth,height:canvas.clientHeight},camera:{w:q.camera.w,h:q.camera.h}};
   },scenario);
   assert.ok(metrics.projectionError<.01,'Feedback and warnings align to subpixel precision');assert.ok(metrics.orangePixels>100&&metrics.purplePixels>100,'Essential warning colors remain visible in rendered pixels');assert.equal(metrics.cues,5);
   assert.deepEqual(metrics.layerOrder,['atmosphere','feedback','danger']);assert.equal(metrics.rich,scenario.rich&&!scenario.reduced);
   await page.screenshot({path:path.join(out,'combat-clarity-'+scenario.name+'.png'),fullPage:true});results.push(metrics);
  }
  assert.deepEqual(errors,[],'No JavaScript errors in real Edge');
  console.log('Combat clarity browser QA: five dense scenarios, four worlds, 200% view, compact low effects and reduced motion passed.');console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
