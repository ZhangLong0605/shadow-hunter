'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist'),shots=path.join(__dirname,'screenshots');
const hook=`window.qQA={get state(){return state},get player(){return player},get world(){return WORLD},get enemies(){return enemies},reset,selectTheme,openTheme,openAtlas,enterWorld,closeModal,updateObjective,updateWorld,updateUI,draw,updateCamera,moveEntity,interactWorld,damageEnemy,hitPlayer,skill,pause,saveCamp,resumeCamp,arriveCamp,getCampSave,worldPositionFree,navigationTarget,chooseBoon,cloudPuzzleKey,clearNotices(){achievementQueue=[];renderAchievementNotices();toastTimer=0;$('toast').classList.add('hidden');killRewards=[];renderKillRewards();}};`;
async function shot(page,name){await page.screenshot({path:path.join(shots,'parallel-'+name+'.png')});}
async function reward(page){const b=page.locator('[data-boon]');if(await b.count())await b.first().click();await page.locator('#world-continue').click();}
async function resume(page,theme){await page.locator('#continue-run').click();await page.locator(`[data-resume-theme="${theme}"]`).click();await page.locator('#profession-confirm').click();}
async function activity(page,id){
 await page.evaluate(id=>{const q=window.qQA,s=q.world.sites.find(s=>s.id===id);Object.assign(q.player,{x:s.x,y:s.y});q.interactWorld();},id);
 await page.locator('#mission-start').click();
 await page.evaluate(()=>{
  const q=window.qQA,o=q.state.objective,kind=o.kind;
  if(kind==='herd')for(const sheep of o.sheep){if(sheep.home)continue;Object.assign(q.player,{x:sheep.x,y:sheep.y});q.updateObjective(.02);for(let i=0;i<350&&q.state.objective;i++){const dx=o.site.x-q.player.x,dy=o.site.y-q.player.y,d=Math.hypot(dx,dy);if(d>1)q.moveEntity(q.player,dx/d*Math.min(3,d),dy/d*Math.min(3,d));q.updateObjective(.02);}}
  if(kind==='fish')for(const spot of o.spots){Object.assign(q.player,spot);for(let i=0;i<2;i++){q.interactWorld();q.updateObjective(o.cast.wait+.1);q.interactWorld();}}
  if(kind==='rhythm')for(let i=0;i<700&&q.state.objective;i++){Object.assign(q.player,o.pads[Math.min(o.count,5)]);q.updateObjective(.02);}
  if(kind==='puzzle')for(const code of ['ArrowRight','ArrowDown','ArrowDown','ArrowUp','ArrowUp','ArrowRight','ArrowDown','ArrowDown','ArrowUp','ArrowUp','ArrowRight','ArrowDown','ArrowDown'])q.cloudPuzzleKey(code);
  if(['gather','dig','water'].includes(kind))for(const n of o.nodes){Object.assign(q.player,{x:n.x,y:n.y});q.interactWorld();if(kind==='dig')q.interactWorld();}
  if(kind==='race'){Object.assign(q.player,o.site);q.updateObjective(.02);for(const n of o.flags){Object.assign(q.player,n);q.updateObjective(.02);}}
  if(kind==='escort')for(const c of o.chicks){if(c.home)continue;Object.assign(q.player,{x:c.x,y:c.y});q.updateObjective(.02);for(let i=0;i<400&&q.state.objective;i++){const dx=o.home.x-q.player.x,dy=o.home.y-q.player.y,d=Math.hypot(dx,dy);if(d>1)q.moveEntity(q.player,dx/d*Math.min(2,d),dy/d*Math.min(2,d));q.updateObjective(.02);}}
  if(kind==='bubble')for(const id of o.targets){const e=q.enemies.find(e=>e.id===id);q.damageEnemy(e,5);}
  if(q.state.phase!=='worldComplete')throw Error(kind+' did not complete: '+JSON.stringify({count:o.count,phase:q.state.phase}));
 });
 await reward(page);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
  await page.route('http://qmap.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html',file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   let body=fs.readFileSync(file);if(name==='game.js')body=Buffer.from(body.toString().replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();requestAnimationFrame(frame);'));
   await route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  await page.goto('http://qmap.test/');assert.deepEqual(errors,[]);
  // Create a genuine original-world camp first, then keep its bytes as an isolation oracle.
  await page.locator('#atlas-button').click();assert.equal(await page.locator('[data-world]').count(),5);assert.equal(await page.locator('[data-world="candy-town"]').count(),0);
  await page.locator('#atlas-travel').click();await page.locator('#world-begin').click();
  const original=await page.evaluate(()=>({camp:localStorage.getItem(window.HUNTER_EXPEDITION.keys.main),profile:localStorage.getItem(window.HUNTER_CAMPAIGN.keys.main)}));assert.ok(original.camp);
  await page.evaluate(()=>window.qQA.reset());await page.locator('#qmap-entry').click();assert.equal(await page.locator('[data-world]').count(),5);assert.equal(await page.locator('[data-world="forest"]').count(),0);await shot(page,'q-atlas');
  await page.locator('#atlas-travel').click();await page.locator('#world-begin').click();
  assert.equal(await page.evaluate(()=>window.qQA.state.world.id),'candy-town');assert.equal(await page.evaluate(()=>window.qQA.getCampSave().status),'ready');
  await page.keyboard.press('p');await page.locator('[data-profession="q-shadow-f"]').click();await page.locator('#profession-confirm').click();
  await page.evaluate(()=>{window.qQA.clearNotices();window.qQA.updateUI();});await page.waitForTimeout(200);await shot(page,'candy-camp');
  // All original PNGs must decode and have nonzero image dimensions.
  await page.evaluate(async()=>{await Promise.all(Object.values(window.HUNTER_Q_ART.sources).map(src=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>im.naturalWidth?ok():no(Error(src));im.onerror=()=>no(Error('Missing asset '+src));im.src=src;})));});
  await page.keyboard.press('o');assert.equal(await page.locator('[data-q-creature]').count(),13);await page.locator('[data-q-creature="cloudtop-throne"]').click();assert.match(await page.locator('.q-creature-detail').innerText(),/梦魇棉花糖/);await shot(page,'q-creatures');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.qQA.state.phase),'playing');
  let total=0;
  const worlds=await page.evaluate(()=>window.HUNTER_CAMPAIGN.qWorlds.map(w=>w.id));
  for(const [index,id] of worlds.entries()){
   if(index){await page.locator('#victory-atlas').click();await page.locator(`[data-world="${id}"]`).click();await page.locator('#atlas-travel').click();await page.locator('#world-begin').click();}
   assert.equal(await page.evaluate(()=>window.qQA.state.world.id),id);
   await page.keyboard.press('m');await shot(page,id+'-map');assert.ok(await page.locator('#modal-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.keyboard.press('Escape');
   if(index===1){await page.evaluate(()=>{const q=window.qQA;if(q.world.river.vertical)throw Error('Expected horizontal river');if(q.worldPositionFree(1600,1285,15))throw Error('Water is passable');if(!q.worldPositionFree(700,1285,15)||!q.worldPositionFree(2900,1285,15))throw Error('Bridge blocked');q.state.world.track='t4';Object.assign(q.player,{x:520,y:2010});const nav=q.navigationTarget();if(!nav.bridge||nav.x!==700)throw Error('Wrong horizontal crossing hint');});}
   const sites=await page.evaluate(()=>window.qQA.world.sites.filter(s=>window.HUNTER_Q.types.includes(s.kind)).map(s=>s.id));
   // A two-seal boss gate must remain closed; the third seal opens it.
   for(const site of sites){
    console.log("RUN "+id+" / "+site);
    await activity(page,site);total++;
    const done=await page.evaluate(()=>window.qQA.state.world.completed.size);
    if(done===2)await page.evaluate(()=>{const q=window.qQA,b=q.world.sites.find(s=>s.kind==='boss');Object.assign(q.player,b);q.interactWorld();if(q.state.objective)throw Error('Boss opened with two seals');});
    if(index===0&&done===3){await page.evaluate(()=>{const q=window.qQA,b=q.world.sites.find(s=>s.kind==='boss');Object.assign(q.player,b);q.interactWorld();if(q.state.objective?.kind!=='boss')throw Error('Three seals did not open boss');q.arriveCamp(true);});await page.locator('#settlement-close').click();await resume(page,'cloud');}
   }
   await page.evaluate(()=>{const q=window.qQA;for(const c of q.world.charms){if(!q.worldPositionFree(c.x,c.y,15))throw Error('Candy blocked '+c.name);Object.assign(q.player,{x:c.x,y:c.y});q.updateWorld(0);}const before=JSON.stringify(q.state.campaign.inventory);q.updateWorld(0);if(before!==JSON.stringify(q.state.campaign.inventory))throw Error('Duplicated candy');Object.assign(q.player,{x:520,y:2010});q.state.world.track='c5';if(!q.saveCamp())throw Error('Invalid camp '+q.state.world.id);});
   await page.reload();await resume(page,'cloud');
   assert.deepEqual(await page.evaluate(()=>({id:window.qQA.state.world.id,tasks:window.qQA.state.world.completed.size,stars:window.qQA.state.world.claimed.size})),{id,tasks:sites.length,stars:5});
   await page.evaluate(()=>{const q=window.qQA;q.player.invincible=0;const hp=q.player.hp;q.hitPlayer(999,true);if(q.player.hp!==hp)throw Error('Q lost HP');q.state.corruption=99;q.skill();if(q.state.corruption!==0)throw Error('Q retained corruption');const b=q.world.sites.find(s=>s.kind==='boss');Object.assign(q.player,{x:b.x,y:b.y+50});q.interactWorld();q.clearNotices();q.updateCamera(0,true);q.updateUI();});
   await shot(page,id+'-boss');
   await page.evaluate(()=>{const q=window.qQA,b=q.enemies.find(e=>e.boss&&!e.dead);q.damageEnemy(b,200);if(b.phase!==2||b.guards.length!==4)throw Error('No phase two');const hp=b.hp;q.damageEnemy(b,999);if(b.hp!==hp)throw Error('Unguarded core');for(const id of b.guards)q.damageEnemy(q.enemies.find(e=>e.id===id),1);q.damageEnemy(b,999);q.updateWorld(.02);});
   assert.equal(await page.evaluate(()=>window.qQA.state.phase),'worldVictory');
   assert.deepEqual(await page.evaluate(()=>({camp:localStorage.getItem(window.HUNTER_EXPEDITION.keys.main),profile:localStorage.getItem(window.HUNTER_CAMPAIGN.keys.main)})),original,'Q changed the original world');
   console.log('PASS '+id+' / '+sites.length+' activities, 5 stars, resume, two-phase boss and isolated saves');
  }
  assert.equal(total,67);assert.equal(await page.evaluate(()=>window.qQA.state.campaign.cleared.length),5);await shot(page,'q-complete');
  await page.locator('#victory-home').click();await resume(page,'main');assert.equal(await page.evaluate(()=>window.qQA.state.world.id),'forest');assert.equal(await page.evaluate(()=>window.qQA.state.campaign.cleared.length),0);
  await page.evaluate(()=>window.qQA.reset());await page.locator('#continue-run').click();await shot(page,'save-selector');await page.locator('#save-chooser-back').click();
  for(const [width,height] of [[1024,600],[540,760]]){
   await page.setViewportSize({width,height});await page.locator('#qmap-entry').click();assert.equal(await page.locator('[data-world]').count(),5);await shot(page,'atlas-'+width);await page.locator('#atlas-travel').click();await page.locator('#world-begin').click();
   await page.keyboard.press('m');assert.ok(await page.locator('#modal-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await shot(page,'map-'+width);await page.keyboard.press('Escape');await page.evaluate(()=>window.qQA.reset());
  }
  // Denied writes keep each campaign in a separate in-page slot.
  await resume(page,'cloud');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Denied by test');};window.qQA.arriveCamp(true);});await page.locator('#settlement-close').click();await resume(page,'main');assert.equal(await page.evaluate(()=>window.qQA.state.world.id),'forest');await page.evaluate(()=>window.qQA.reset());await resume(page,'cloud');assert.equal(await page.evaluate(()=>window.qQA.getCampSave().temporary),true);
  // Real standalone file, no test hooks, router or server.
  const offline=await browser.newPage({viewport:{width:1366,height:900}});offline.on('pageerror',e=>errors.push(e.stack));await offline.goto(require('node:url').pathToFileURL(path.resolve(root,'../release/影子猎手-直接玩.html')).href);
  await offline.locator('#qmap-entry').click();assert.equal(await offline.locator('[data-world]').count(),5);await offline.locator('#atlas-travel').click();await offline.locator('#world-begin').click();assert.equal(await offline.evaluate(()=>window.shadowHunter.snapshot().world.id),'candy-town');await offline.keyboard.press('b');await offline.locator('#settlement-close').click();await resume(offline,'cloud');assert.equal(await offline.evaluate(()=>window.shadowHunter.snapshot().world.id),'candy-town');
  assert.deepEqual(errors,[]);console.log('PASS 67 activities / 5 Q maps, 33 assets, two save slots, original-world return, small layouts, blocked storage and offline release');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
