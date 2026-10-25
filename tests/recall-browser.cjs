/* Optional browser QA. Run with Playwright available through NODE_PATH. Uses an
   isolated browser context and intercepted local files, never a player's save. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const hook=`window.recallQA={get state(){return state},get player(){return player},get enemies(){return enemies},start,beginAdventure,enterWorld,recordAdventureLoot,arriveCamp,update,draw};`;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://recall.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html';
   const filename=path.resolve(root,name);if(!filename.startsWith(root+path.sep))return route.abort();
   let body=fs.readFileSync(filename);if(name==='game.js')body=Buffer.from(body.toString().replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();requestAnimationFrame(frame);'));
   await route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream'});
  });
  await page.goto('http://recall.test/');
  await page.locator('#skip-intro').click();await page.locator('#world-begin').click();
  await page.evaluate(()=>{
   const q=window.recallQA,s=q.state;q.player.x=620;q.player.y=1800;
   s.time=268;s.kills=14;s.captures=3;s.adventure.elapsed=268;s.adventure.kills=14;s.adventure.captures=3;
   s.owned.add('archer');s.journey.perks.push('keen');s.world.completed.add('chase');
   for(const [id,n] of [['fang',1],['leaf',3],['dew',2],['seed',1]]){s.campaign.inventory[id]=(s.campaign.inventory[id]||0)+n;for(let i=0;i<n;i++)q.recordAdventureLoot(id);}
  });
  await page.keyboard.press('b');
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(__dirname,'screenshots/recall-channel.png')});
  await page.locator('[data-kind="settlement"]').waitFor({state:'visible'});
  assert.equal(await page.locator('.return-loot').count(),4);
  assert.match(await page.locator('#settlement-status').innerText(),/已保存/);
  await page.screenshot({path:path.join(__dirname,'screenshots/recall-settlement.png')});
  await page.setViewportSize({width:1024,height:600});
  await page.locator('#settlement-close').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(__dirname,'screenshots/recall-compact.png')});
  await page.locator('#settlement-close').click();
  await page.locator('#continue-run').click();
  const saved=await page.evaluate(()=>window.shadowHunter.snapshot());
  assert.equal(saved.player.x,520);assert.equal(saved.player.y,2010);
  assert.equal(saved.campaign.inventory.fang,1);assert.ok(saved.owned.includes('archer'));
  assert.deepEqual(errors,[]);
  const offline=await browser.newPage({viewport:{width:1366,height:768}});
  offline.on('pageerror',e=>errors.push(e.message));
  await offline.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../release/影子猎手-直接玩.html')).href);
  await offline.locator('#skip-intro').click();await offline.locator('#world-begin').click();
  await offline.keyboard.press('b');await offline.locator('[data-kind="settlement"]').waitFor({state:'visible'});
  assert.equal(await offline.locator('.return-empty').count(),1);
  await offline.keyboard.press('Escape');assert.equal(await offline.evaluate(()=>window.shadowHunter.snapshot().phase),'intro');
  await offline.locator('#continue-run').click();assert.equal(await offline.evaluate(()=>window.shadowHunter.snapshot().phase),'playing');
  assert.deepEqual(errors,[]);
  console.log('Browser QA: portal, settlement, compact close, saved equipment, resume and portable offline HTML passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
