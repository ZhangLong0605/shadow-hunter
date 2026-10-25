/* Reproducible, isolated browser screenshots of real gameplay render paths. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist'),out=path.join(__dirname,'screenshots');
const hook=`window.visualQA={get state(){return state},get player(){return player},get enemies(){return enemies},get mouse(){return mouse},enterWorld,closeModal,skill,basicAttack,damageEnemy,expose,gainKill,startPractice,updateReleaseSettings,setViewRange,updateCamera,draw,drawFeedback,richVisuals,step(dt){update(dt);updateRelease(dt);draw();drawFeedback(dt);}};`;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://graphics.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html',filename=path.resolve(root,name);
   if(!filename.startsWith(root+path.sep))return route.abort();
   let body=fs.readFileSync(filename);
   if(name==='game.js')body=Buffer.from(body.toString().replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();'));
   await route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream'});
  });
  await page.goto('http://graphics.test/');
  await page.waitForFunction(()=>window.HUNTER_ART?.spriteStatus().ready);
  for(const id of ['forest','forge','tide','ruins','eclipse']){
   await page.evaluate(id=>{const q=window.visualQA;q.enterWorld(id);q.closeModal('playing');q.updateReleaseSettings({sound:false});q.player.invincible=99;q.step(.02);},id);
   await page.screenshot({path:path.join(out,'graphics-'+id+'.png')});
  }
  await page.evaluate(()=>{const q=window.visualQA;q.enterWorld('forest');q.closeModal('playing');q.player.x=760;q.player.y=1740;q.player.invincible=99;q.updateCamera(0,true);q.step(.02);});
  for(const id of ['fire','wolf','shield','archer']){
   await page.evaluate(id=>{
    const q=window.visualQA;q.player.x=760;q.player.y=1740;q.mouse.x=1000;q.mouse.y=1690;q.state.slots=[id];q.state.owned.add(id);q.state.skillCd=0;q.player.shield=0;
    window.HUNTER_FEEDBACK.clear();q.updateCamera(0,true);q.skill();for(let i=0;i<9;i++)q.step(.02);
   },id);
   await page.screenshot({path:path.join(out,'graphics-skill-'+id+'.png')});
  }
  await page.evaluate(()=>{const q=window.visualQA;q.player.x=760;q.player.y=1740;q.mouse.x=880;q.mouse.y=1700;q.state.attackCd=0;window.HUNTER_FEEDBACK.clear();q.basicAttack(true);const e=q.enemies[0];e.x=845;e.y=1705;e.hp=100;e.exposed=0;q.damageEnemy(e,28,5);q.updateCamera(0,true);for(let i=0;i<5;i++)q.step(.02);});
  await page.screenshot({path:path.join(out,'graphics-impact.png')});
  const metrics=await page.evaluate(()=>{
   const q=window.visualQA,measure=()=>{const times=[];for(let i=0;i<60;i++){const now=performance.now();q.draw();q.drawFeedback(.016);times.push(performance.now()-now);}times.sort((a,b)=>a-b);return {median:times[30],p95:times[57]};};
   const normal=measure();q.setViewRange(200);q.updateCamera(0,true);const wide=measure();q.updateReleaseSettings({atmosphere:false,shake:false});const reduced=measure();return {normal,wide,reduced};
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>window.visualQA.richVisuals()),false);
  assert.deepEqual(errors,[]);console.log('Graphics browser QA: five worlds, four skills, impact, zoom, reduced motion; no browser errors.');console.log(JSON.stringify(metrics));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
