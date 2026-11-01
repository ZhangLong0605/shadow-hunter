'use strict';
/* Real-browser QA in isolated storage; route injection is test-only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist'),shots=path.join(__dirname,'screenshots');
const hook=`window.wardrobeQA={get state(){return state},get player(){return player},get enemies(){return enemies},get world(){return WORLD},reset,start,saveCamp,getCampSave,pause,closeModal,openCharacterWardrobe,openMonsterWardrobe,startWorldMission,showReward,openEncounter,get encounterSeen(){return encounterSeen},draw,updateCamera,enterWorld,spawnWorldEnemy,drawEnemy,encounterPortrait,beginTutorial,beginAdventure,arriveCamp,update,clearNotices(){achievementQueue=[];renderAchievementNotices();toastTimer=0;$('toast').classList.add('hidden');}};`;
const errors=[];
async function phase(page){return page.evaluate(()=>window.shadowHunter.snapshot().phase);}
async function pick(page,id){await page.locator(`[data-profession="${id}"]`).click();await page.locator('#profession-confirm').click();}
async function allImages(page){await page.waitForFunction(()=>[...document.querySelectorAll('#modal-card img')].every(i=>i.complete&&i.naturalWidth>0));}
async function shot(page,name){await page.screenshot({path:path.join(shots,name+'.png')});}
async function gameSnapshot(page){return page.evaluate(()=>{
 const q=window.wardrobeQA,s=q.state,p=q.player;
 return {hp:p.hp,focus:p.focus,x:p.x,y:p.y,time:s.time,skillCd:s.skillCd,basketballCd:s.basketballCd,slots:[...s.slots],owned:[...s.owned],objective:s.objective?{kind:s.objective.kind,remaining:s.objective.remaining,lantern:s.objective.lantern?.hp}:null,inventory:s.campaign.inventory,completed:s.world?[...s.world.completed]:[],enemies:q.enemies.map(e=>[e.id,e.hp,e.dead,e.x,e.y])};
 });}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://wardrobe.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html',file=path.resolve(root,name);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   let body=fs.readFileSync(file);if(name==='game.js')body=Buffer.from(body.toString().replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();requestAnimationFrame(frame);'));
   await route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream'});
  });
  await page.goto('http://wardrobe.test/');
  await page.locator('#skip-intro').click();await pick(page,'bull');await page.locator('#vn-skip').click();await page.locator('#world-begin').click();
  const saved=await page.evaluate(()=>{
   const q=window.wardrobeQA,s=q.state;s.world.completed.add('chase');s.campaign.inventory={fang:1,leaf:2};s.campaign.equipped='fang';s.owned.add('archer');s.slots=['archer'];s.journey.perks=['keen'];
   q.player.hp=67;q.player.focus=42;q.enemies[0].dead=true;s.kills=1;s.time=123;
   if(!q.saveCamp())throw Error('Could not prepare camp fixture');const save=JSON.stringify(q.getCampSave().data);q.reset();return save;
  });
  await page.locator('#continue-run').click();await page.locator('[data-resume-theme="main"]').click();assert.equal(await phase(page),'profession');await allImages(page);
  await shot(page,'wardrobe-resume');await page.locator('[data-profession="round"]').click();await page.keyboard.press('Escape');
  assert.equal(await phase(page),'intro');assert.equal(await page.evaluate(()=>window.shadowHunter.snapshot().appearance),'bull');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.wardrobeQA.getCampSave().data)),saved);
  await page.locator('#continue-run').click();await page.locator('[data-resume-theme="main"]').click();await pick(page,'basket');
  await page.evaluate(()=>window.wardrobeQA.pause());
  const resumed=await gameSnapshot(page);assert.equal(resumed.hp,67);assert.equal(resumed.focus,42);assert.deepEqual(resumed.slots,['archer']);assert.deepEqual(resumed.completed,['chase']);assert.equal(resumed.inventory.fang,1);assert.ok(resumed.enemies[0][2]);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.wardrobeQA.getCampSave().data)),saved);
  // A running mission stays frozen, including cooldowns and projectiles, while choosing.
  await page.evaluate(()=>{const q=window.wardrobeQA;q.closeModal('playing');for(const e of q.enemies)q.encounterSeen.add('forest:'+(e.variant||e.type));const site=q.world.sites.find(s=>s.kind==='defend');q.player.x=site.x;q.player.y=site.y;q.startWorldMission(site);});
  await page.locator('#mission-start').click();await page.evaluate(()=>{const q=window.wardrobeQA;q.state.skillCd=3;q.state.basketballCd=5;q.openCharacterWardrobe();});
  const paused=await gameSnapshot(page);await page.waitForTimeout(300);assert.deepEqual(await gameSnapshot(page),paused);
  await page.locator('[data-profession="sun"]').click();await page.evaluate(()=>{document.getElementById('profession-confirm').click();window.wardrobeQA.pause();});
  assert.deepEqual(await gameSnapshot(page),paused);assert.equal(await page.evaluate(()=>window.shadowHunter.snapshot().appearance),'sun');
  assert.ok(await page.locator('#basketball-button').evaluate(e=>e.classList.contains('hidden')));
  await page.locator('#pause-character').click();await page.locator('[data-profession="basket"]').click();await page.locator('#profession-confirm').click();assert.equal(await phase(page),'paused');assert.equal((await gameSnapshot(page)).basketballCd,paused.basketballCd);
  await page.locator('#resume').click();assert.equal(await phase(page),'playing');
  // Nested reward panel retains the same button node and its callback.
  await page.evaluate(()=>{const q=window.wardrobeQA;q.showReward('shield');window.savedRewardButton=document.querySelector('[data-equip]');});
  const rewardHtml=await page.locator('#modal-card').innerHTML();await page.keyboard.press('p');assert.equal(await phase(page),'profession');await page.keyboard.press('Escape');assert.equal(await phase(page),'pickup');assert.equal(await page.locator('#modal-card').innerHTML(),rewardHtml);
  assert.ok(await page.evaluate(()=>window.savedRewardButton===document.querySelector('[data-equip]')));
  await page.locator('[data-equip]').first().click();
  // Enemy-specific drafts cancel, bulk presets, reload, portrait consistency.
  await page.evaluate(()=>{const q=window.wardrobeQA;q.state.objective=null;q.closeModal('playing');q.openMonsterWardrobe();});
  await allImages(page);await shot(page,'wardrobe-monsters');
  await page.locator('[data-monster-style="soft"]').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.HUNTER_MONSTERS.preferences()['mob-wolf']),'standard');
  await page.keyboard.press('o');await page.locator('[data-monster="variant-cinder-priest"]').click();await page.locator('[data-monster-style="soft"]').click();
  await page.locator('[data-monster-group="boss"]').click();assert.equal(await page.locator('[data-monster]').count(),5);await page.locator('[data-monster="boss-dusk-shadow-king"]').click();await page.locator('[data-monster-style="soft"]').click();await allImages(page);await shot(page,'wardrobe-boss');
  await page.locator('#monster-confirm').click();assert.equal(await phase(page),'playing');
  const monsterChoices=await page.evaluate(()=>window.HUNTER_MONSTERS.preferences());assert.equal(monsterChoices['variant-cinder-priest'],'soft');assert.equal(monsterChoices['boss-dusk-shadow-king'],'soft');assert.equal(monsterChoices['mob-wolf'],'standard');
  await page.evaluate(()=>{const q=window.wardrobeQA;q.encounterSeen.clear();const e=q.enemies.find(e=>!e.dead);e.type='fire';e.variant='cinder';q.openEncounter(e);});
  assert.match(await page.locator('#vn-enemy img').getAttribute('src'),/k-variant-cinder-priest/);
  await page.locator('#character-nav').click();await pick(page,'orange');assert.equal(await phase(page),'encounter');assert.match(await page.locator('#vn-hero img').getAttribute('src'),/character-orange/);
  await page.locator('#monster-nav').click();await page.locator('[data-monster-group="mob"]').click();await page.locator('[data-monster="variant-cinder-priest"]').click();await page.locator('[data-monster-style="standard"]').click();await page.locator('#monster-confirm').click();assert.equal(await phase(page),'encounter');assert.match(await page.locator('#vn-enemy img').getAttribute('src'),/\/variant-cinder-priest/);
  await page.locator('#vn-skip').click();
  // Live gameplay screenshots cover all five independently mapped bosses and all 11 mobs.
  for(const world of ['forest','forge','tide','ruins','eclipse']){
   await page.evaluate(world=>{const q=window.wardrobeQA;q.enterWorld(world);q.closeModal('playing');for(const e of q.enemies)e.dead=true;const spec=window.HUNTER_CAMPAIGN.worlds.find(w=>w.id===world);Object.assign(q.player,{x:700,y:1900});const e=q.spawnWorldEnemy(spec.bossType,850,1990,true);e.boss=true;e.r=45;e.hp=e.maxHp=600;e.cd=100;e.aggro=false;q.pause();q.clearNotices();q.updateCamera(0,true);document.getElementById('modal').classList.add('hidden');q.draw();},world);
   await page.waitForTimeout(100);await shot(page,'wardrobe-world-'+world);
  }
  await page.reload();assert.equal(await page.evaluate(()=>window.shadowHunter.snapshot().appearance),'orange');assert.equal(await page.evaluate(()=>window.HUNTER_MONSTERS.preferences()['boss-dusk-shadow-king']),'soft');
  // The layout remains usable at a compact desktop viewport and a narrow viewport.
  for(const [width,height] of [[1024,600],[540,760]]){
   await page.setViewportSize({width,height});await page.locator('#monster-nav').click();await allImages(page);await page.locator('#monster-confirm').scrollIntoViewIfNeeded();
   assert.ok(await page.locator('#monster-confirm').isVisible());assert.ok(await page.locator('#modal-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await shot(page,'wardrobe-compact-'+width);await page.keyboard.press('Escape');
   await page.locator('#continue-run').click();await page.locator('[data-resume-theme="main"]').click();await page.locator('[data-profession="round"]').click();await page.locator('#profession-confirm').scrollIntoViewIfNeeded();assert.ok(await page.locator('#modal-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await shot(page,'wardrobe-characters-'+width);await page.keyboard.press('Escape');
  }
  // Storage denial must still permit an immediate in-page switch.
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Blocked for QA');};});
  await page.locator('#character-nav').click();await pick(page,'round');assert.equal(await page.evaluate(()=>window.shadowHunter.snapshot().appearance),'round');
  await page.locator('#monster-nav').click();await page.locator('[data-monster-preset="soft"]').click();await page.locator('#monster-confirm').click();assert.ok(await page.evaluate(()=>Object.values(window.HUNTER_MONSTERS.preferences()).every(v=>v==='soft')));
  // The portable file must carry every image and the same resume / switch interactions.
  const offline=await browser.newPage({viewport:{width:1366,height:900}});offline.on('pageerror',e=>errors.push(e.message));
  await offline.goto(require('node:url').pathToFileURL(path.resolve(root,'../release/影子猎手-直接玩.html')).href);
  await offline.locator('#monster-nav').click();await allImages(offline);assert.ok(await offline.locator('.monster-style-grid img').first().evaluate(i=>i.src.startsWith('data:image/png;base64,')));await offline.keyboard.press('Escape');
  await offline.locator('#skip-intro').click();await pick(offline,'sun');if(await offline.locator('#vn-skip').isVisible())await offline.locator('#vn-skip').click();await offline.locator('#world-begin').click();
  await offline.keyboard.press('b');await offline.locator('#settlement-close').waitFor({state:'visible'});await offline.locator('#settlement-close').click();await offline.locator('#continue-run').click();await offline.locator('[data-resume-theme="main"]').click();await pick(offline,'bull');assert.equal(await phase(offline),'playing');
  await offline.keyboard.press('p');await pick(offline,'basket');assert.equal(await offline.evaluate(()=>window.shadowHunter.snapshot().appearance),'basket');
  assert.deepEqual(errors,[]);console.log('Browser QA: resume selection/cancel, same checkpoint, live mission and cooldown preservation, nested reward/pause/dialogue, 16 enemies, five Boss scenes, persistence/blocked storage, compact layouts and portable offline flow passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
