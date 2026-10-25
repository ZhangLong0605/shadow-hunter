/* Run the actual game in a minimal DOM/Canvas harness. No browser or dependencies. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let passed=0;
const noop=()=>{};
const context2d=new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop:noop}):noop,set:(o,k,v)=>(o[k]=v,true)});
const elements=new Map();
class Element {
  constructor(){this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.listeners={};this.children=[];this.clientWidth=1000;this.clientHeight=650;const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)};}
  set innerHTML(html){this.html=html;this.children=[];for(const m of html.matchAll(/<button\b([^>]*)>/g)){const e=new Element();e.disabled=m[1].includes('disabled');for(const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='id')elements.set(a[2],e);if(a[1].startsWith('data-'))e.dataset[a[1].slice(5)]=a[2];}this.children.push(e);}}
  get innerHTML(){return this.html||'';}
  querySelectorAll(s){if(s==='button')return this.children;const key=s.match(/data-([\w-]+)/)?.[1];return this.children.filter(c=>key in c.dataset);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  addEventListener(k,f){this.listeners[k]=f;}
  focus(){} setAttribute(k,v){this[k]=v;} setPointerCapture(){} getContext(){return context2d;} getBoundingClientRect(){return {left:0,top:0,width:1200,height:780};}
}
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const windowListeners=new Map();
const window={devicePixelRatio:1,addEventListener:(type,listener)=>{const list=windowListeners.get(type)||[];list.push(listener);windowListeners.set(type,list);}};
const document={getElementById:el,createElement:()=>new Element(),addEventListener:noop};
const storage=new Map();let storageFail=false;
const localStorage={getItem:k=>{if(storageFail)throw Error('Storage blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(storageFail)throw Error('Storage blocked');storage.set(k,v);}};
const sandbox={window,document,localStorage,requestAnimationFrame:noop,console,Math};
for(const name of ['release-data.js','art.js','feedback.js','scene-fx.js','combat-cues.js'])vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist',name),'utf8'),sandbox);
const code=fs.readFileSync(require('node:path').join(__dirname,'../dist/game.js'),'utf8');
const hook=`window.testGame={get state(){return state},get player(){return player},get enemies(){return enemies},get projectiles(){return projectiles},get minions(){return minions},get effects(){return effects},get keys(){return keys},get mouse(){return mouse},reset,start,update,enterRoom,damageEnemy,hitPlayer,expose,gainKill,skill,dash,basicAttack,updateCapture,openBuild,openCodex,openGuide,pause,closeModal,showRoute,combo,normalizeSkills,showReward,equipSkill,beginTutorial,finishTutorial,updateTutorial,setTutorialStep,openSkillDetails,startPractice,practiceTargets,refreshPractice,updateObjective,retryObjective,requestPractice,draw,enterWorld,updateCamera,get camera(){return {...camera}},pointOnScreen,mousePosition,moveEntity,worldPositionFree,worldMoveSpeed,worldTravelEnd,spawnWorldEnemy,updateWorldEnemy,performEnemyAttack,interactWorld,startWorldMission,completeWorldMission,openWorldMap,updateWorld,useFlask,startRecall,updateJourney,chooseBoon,navigationTarget,leaveWorldMission,stunBoss,pressureBreak,updateEnemy,shoot,spawnMinion,showModal,projectileBlocked,drawHazard,get hazards(){return hazards}};\n`;
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/guide-data.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/world-data.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/expedition-data.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/journey-data.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/campaign-data.js'),'utf8'),sandbox);
const expeditionHook='window.expeditionTest={saveCamp,resumeCamp,canSaveCamp,claimDiscovery,discoveryBlocked,openCamp,telegraphInfo,attackCue,updateJourneyHint,allWorldSites,expeditionReward,closeSettlement,saveSettlement};window.cameraTest={setViewRange,readViewRange,cameraWorldRect,worldMapSvg,changeViewByWheel,VIEW_RANGE,get range(){return viewRange}};';
const releaseHook='window.releaseTest={openSettings,openRecords,openCredits,updateRelease,updateReleaseSettings,releaseSettings,endRun};';
const campaignHook='window.campaignTest={openAtlas,closeAtlas,travelWorld,openInventory,useCampaignItem,campaignWorld,journeyMods,setupCampaignObjective,interactCampaignNode,completeCampaignWorld,get map(){return WORLD}};';
vm.runInNewContext(code.replace('makeGround();reset();requestAnimationFrame(frame);',hook+expeditionHook+releaseHook+campaignHook+'makeGround();reset();'),sandbox);
const g=window.testGame;
function test(name,fn){try{storage.clear();storageFail=false;fn();console.log('PASS '+name);passed++;}catch(e){console.error('FAIL '+name);throw e;}}
function tick(seconds){for(let n=0;n<Math.ceil(seconds/.02);n++)g.update(.02);}
function start(){g.reset();g.enterRoom(0,'hunt');}
function choice(data,value){return el('modal-card').querySelectorAll(`[data-${data}]`).find(b=>b.dataset[data]===String(value));}
function keyEvent(type,code,options={}){const event={code,repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.defaultPrevented=true;},defaultPrevented:false,...options};for(const listener of windowListeners.get(type)||[])listener(event);return event;}
function continueWorld(){const first=el('modal-card').querySelectorAll('[data-boon]')[0];if(g.state.pendingBoons?.length&&first)g.chooseBoon(first.dataset.boon);el('world-continue').onclick();}

test('Hunter gait tracks travel, settles against walls, and freezes with paused attacks',()=>{
 g.startPractice();g.player.x=500;g.player.y=500;g.keys.KeyD=true;tick(.25);g.keys.KeyD=false;
 assert.ok(g.player.moveBlend>.5);assert.ok(g.player.stridePhase>0);assert.ok(g.player.x>500);
 g.player.x=80;g.keys.KeyA=true;const blockedPhase=g.player.stridePhase;tick(.7);
 assert.equal(g.player.x,80);assert.equal(g.player.stridePhase,blockedPhase);assert.ok(g.player.moveBlend<.001);g.keys.KeyA=false;
 g.mouse.x=900;g.mouse.y=500;g.basicAttack();assert.equal(g.player.attackPoseWeapon,'blade');assert.ok(g.player.attackPoseTime>0);
 const poseTime=g.player.attackPoseTime,motionTime=g.player.motionTime;g.pause();tick(.5);
 assert.equal(g.player.attackPoseTime,poseTime);assert.equal(g.player.motionTime,motionTime);g.closeModal();tick(.5);assert.equal(g.player.attackPoseTime,0);
 g.state.weapon='bow';g.basicAttack(true);assert.equal(g.player.attackPoseWeapon,'bow');assert.equal(g.player.attackStrong,true);
 const shot=g.player.attackPoseTime;g.basicAttack();assert.equal(g.player.attackPoseTime,shot,'Cooldown does not restart the arm animation');
 g.reset();assert.equal(g.player.attackPoseTime,0);assert.equal(g.player.moveBlend,0);
});
test('Intro, start, weapon attack and pause state',()=>{assert.equal(g.state.phase,'intro');start();assert.equal(g.enemies.length,4);const e=g.enemies[0];g.player.x=e.x-60;g.player.y=e.y;g.mouse.x=e.x;g.mouse.y=e.y;const hp=e.hp;g.basicAttack();assert.ok(e.hp<hp);const time=g.state.time;g.pause();tick(1);assert.equal(g.state.time,time);g.closeModal();assert.equal(g.state.phase,'playing');});
test('Shadow pressure exposes a living enemy; channel grants a shadow',()=>{start();const e=g.enemies.find(e=>e.type==='archer');g.damageEnemy(e,5,100);assert.ok(e.hp>0&&e.exposed>0);g.player.x=e.x;g.player.y=e.y;g.keys.KeyE=true;for(let i=0;i<55;i++)g.updateCapture(.02);assert.equal(g.state.phase,'pickup');assert.ok(g.state.owned.has('archer'));assert.equal(g.state.captures,1);choice('equip',0).onclick();assert.equal(g.state.slots[0],'archer');assert.equal(g.state.phase,'playing');});
test('Capture interruption, full-focus instant capture and harvesting',()=>{start();let e=g.enemies[0];g.expose(e);g.player.x=e.x;g.player.y=e.y;g.keys.KeyE=true;g.updateCapture(.4);assert.ok(g.state.capture>0);g.player.invincible=0;g.hitPlayer(10);assert.equal(g.state.capture,0);g.player.focus=100;g.updateCapture(.05);assert.equal(g.state.phase,'pickup');assert.equal(g.player.focus,0);choice('equip',0).onclick();assert.equal(g.player.hp,100);e=g.enemies[1];g.expose(e);g.damageEnemy(e,1,1,'basic');assert.ok(e.dead);assert.equal(g.state.kills,2);});
test('Switching is free, preserves cooldown, and only known skills can be equipped',()=>{
start();g.player.focus=0;g.state.skillCd=3;g.openBuild();assert.equal(el('modal-card').querySelectorAll('[data-shadow]').length,4);assert.ok(choice('shadow','shield').disabled);assert.equal(g.equipSkill('shield'),false);choice('shadow','fire').onclick();assert.equal(g.player.focus,0);assert.equal(g.state.skillCd,3);assert.deepEqual([...g.state.slots],['fire']);assert.equal(g.equipSkill('fire'),false);el('build-close').onclick();g.skill();assert.equal(g.state.skillCd,3);assert.equal(g.equipSkill('wolf'),false);
});

test('Four skills have distinct single actions without hidden echoes or modifiers',()=>{
for(const id of ['wolf','fire','shield','archer']){g.startPractice();g.state.slots=[id];const e=g.enemies[0];Object.assign(e,{x:g.player.x+120,y:g.player.y,hp:1000,pressure:1000});g.mouse.x=e.x;g.mouse.y=e.y;const x=g.player.x;g.skill();assert.equal(g.state.skillCd,4.8);assert.equal(g.minions.length,0);assert.ok(!g.effects.some(e=>e.kind==='delayed'));if(id==='archer')assert.equal(g.projectiles.length,3);else assert.equal(g.projectiles.length,0);if(id==='fire')assert.equal(e.burn,4);else assert.equal(e.burn,0);if(id==='wolf')assert.notEqual(g.player.x,x);else assert.equal(g.player.x,x);if(id==='shield')assert.equal(g.player.shield,3);else assert.equal(g.player.shield,0);}
});

test('All eight enemy rewards map into four skills; capture heals once and can keep equipment',()=>{
const mapping={wolf:'wolf',ghost:'wolf',fire:'fire',swarm:'fire',shield:'shield',giant:'shield',archer:'archer',mirror:'archer'};for(const [enemy,id] of Object.entries(mapping)){start();g.player.hp=50;g.state.corruption=30;g.state.skillCd=2;g.showReward(enemy);assert.ok(g.state.owned.has(id));assert.equal(g.player.hp,75);assert.equal(g.state.corruption,20);assert.ok(g.state.owned.size<=4);const equip=choice('equip',0);equip.onclick();assert.deepEqual([...g.state.slots],[id]);assert.equal(g.state.skillCd,2);equip.onclick();assert.equal(g.player.hp,75);}start();g.showReward('mirror');el('keep-skill').onclick();assert.deepEqual([...g.state.slots],['wolf']);assert.ok(g.state.owned.has('archer'));
});

test('Nightmare risk remains but no skill is sealed after the first awakening',()=>{
start();g.state.corruption=96;g.skill();assert.equal(g.state.nightmare,9);for(const e of g.enemies)e.cd=999;tick(9.6);assert.ok(g.state.locked);assert.equal(g.state.corruption,25);g.openBuild();assert.equal(g.equipSkill('fire'),true);el('build-close').onclick();assert.equal(g.combo().name,'火焰');g.state.corruption=96;g.state.skillCd=0;g.skill();assert.equal(g.state.phase,'end');assert.match(el('modal-card').innerHTML,/你，成为了长梦/);
});

test('Boss pressure gate, second phase, capture and victory restart',()=>{start();g.enterRoom(4,'boss');const b=g.enemies[0];g.damageEnemy(b,5,300);assert.equal(b.exposed,0);b.hp=500;g.update(.02);assert.equal(b.phase,2);assert.ok(g.enemies.length===3);g.damageEnemy(b,400,300);assert.ok(b.exposed>0);g.player.x=b.x;g.player.y=b.y;g.keys.KeyE=true;g.player.focus=100;g.updateCapture(.05);assert.equal(g.state.phase,'pickup');choice('equip',0).onclick();assert.equal(g.state.phase,'end');assert.ok(g.state.bossWon);el('end-restart').onclick();assert.equal(g.state.phase,'worldIntro');el('world-begin').onclick();assert.equal(g.state.phase,'playing');assert.equal(g.state.room,0);assert.equal(g.state.kills,0);assert.equal(g.player.hp,100);});
test('Death and return to camp reset UI; codex opened from pause resumes correctly',()=>{start();g.player.invincible=0;g.hitPlayer(150);assert.equal(g.state.phase,'end');el('end-home').onclick();assert.equal(g.state.phase,'intro');assert.equal(el('room-name').textContent,'遗忘林地');start();g.pause();g.openCodex();el('build-close').onclick();assert.equal(g.state.phase,'playing');});
test('Guided tutorial requires movement, exposure, capture, equip and an actual skill hit',()=>{
 g.beginTutorial();assert.equal(g.state.tutorial.step,0);assert.equal(g.enemies.length,1);
 const e=g.enemies[0];const hp=g.player.hp;tick(3);assert.equal(g.player.hp,hp);g.skill();assert.equal(g.state.skillCd,0);
 g.keys.KeyD=true;tick(.5);g.keys.KeyD=false;assert.equal(g.state.tutorial.step,1);
 g.mouse.x=e.x;g.mouse.y=e.y;for(let i=0;i<3;i++){g.basicAttack();tick(.32);}assert.equal(g.state.tutorial.step,2);assert.ok(e.exposed>0);
 tick(10);assert.equal(e.dead,false);g.damageEnemy(e,999,999,'basic');assert.equal(e.dead,false);
 g.player.x=e.x-65;g.player.y=e.y;g.keys.KeyE=true;g.updateCapture(.4);g.keys.KeyE=false;g.updateCapture(.1);assert.equal(g.state.capture,0);
 g.keys.KeyE=true;for(let i=0;i<55;i++)g.updateCapture(.02);assert.equal(g.state.phase,'pickup');assert.equal(g.state.tutorial.step,3);
 assert.equal(choice('equip',1),undefined);assert.match(el('modal-card').innerHTML,/装备影箭/);
 choice('equip',0).onclick();assert.equal(g.state.slots[0],'archer');assert.equal(g.state.tutorial.step,4);
 g.mouse.x=g.enemies[0].x;g.mouse.y=g.enemies[0].y;g.skill();tick(2.2);assert.equal(g.state.phase,'lessonComplete');assert.equal(g.state.tutorial.step,5);
 el('tutorial-finish').onclick();assert.equal(g.state.tutorial,null);assert.equal(g.state.phase,'worldIntro');el('world-begin').onclick();assert.equal(g.state.phase,'playing');assert.equal(g.state.room,0);assert.equal(g.state.corruption,0);assert.equal(g.state.time,0);assert.equal(g.state.kills,0);assert.equal(g.player.hp,100);assert.equal(g.state.slots[0],'archer');assert.ok(g.state.owned.has('archer'));
});
test('Tutorial pause, skip and restart do not trap the player',()=>{g.beginTutorial();g.pause();tick(1);assert.equal(g.state.tutorial.step,0);g.closeModal();assert.equal(g.state.phase,'playing');g.finishTutorial();assert.equal(g.state.tutorial,null);assert.equal(g.state.phase,'worldIntro');assert.ok(g.enemies.length>=30);g.reset();assert.ok(el('tutorial-card').classList.contains('hidden'));});
test('Skill details show a short use and expandable numbers; healing respects high corruption',()=>{
start();g.openSkillDetails();assert.equal(g.state.phase,'skillinfo');assert.match(el('modal-card').innerHTML,/4.8 秒冷却/);assert.match(el('modal-card').innerHTML,/详细数值/);assert.doesNotMatch(el('modal-card').innerHTML,/槽位|回响|附魔/);el('skill-info-close').onclick();g.player.hp=50;g.state.corruption=80;g.showReward('wolf');assert.equal(g.player.hp,62.5);assert.equal(g.state.corruption,70);assert.equal(el('modal-card').querySelectorAll('button').length,1);
});

test('Skill catalog has four concise entries and old families migrate without losing mastery',()=>{
const guide=window.HUNTER_GUIDE;assert.equal(Object.keys(guide.skills).length,4);for(const info of Object.values(guide.skills)){assert.ok(info.summary.length<15);assert.ok(info.detail.length>20);}start();g.state.slots=['giant','ghost','mirror'];g.state.owned=new Set(['giant','ghost','mirror']);g.state.stored='swarm';g.state.levels.giant=2;g.state.xp.giant=18;g.state.levels.shield=1;g.normalizeSkills();assert.deepEqual([...g.state.slots],['shield']);assert.equal(g.state.owned.size,4);assert.equal(g.state.levels.shield,2);assert.equal(g.state.xp.shield,18);assert.equal(g.state.levels.giant,0);assert.equal(g.state.stored,null);g.normalizeSkills();assert.equal(g.state.levels.shield,2);g.openBuild();assert.equal(el('modal-card').querySelectorAll('[data-shadow]').length,4);
});

test('Other panels cannot replace reward or tutorial completion dialogs',()=>{
 start();g.state.phase='lessonComplete';g.openGuide();g.openCodex();g.openBuild();assert.equal(g.state.phase,'lessonComplete');
 g.state.phase='pickup';g.openGuide();g.openCodex();g.openBuild();assert.equal(g.state.phase,'pickup');
 g.state.phase='playing';g.openSkillDetails();g.openBuild();assert.equal(g.state.phase,'skillinfo');el('skill-info-close').onclick();assert.equal(g.state.phase,'playing');
});
test('Route offers objectives, altar rest, guarded capture and Boss',()=>{
 start();for(const e of g.enemies)g.gainKill(e);tick(1.5);assert.equal(g.state.phase,'map');
 choice('route',0).onclick();assert.equal(g.state.phase,'briefing');assert.equal(g.state.objective.kind,'chase');
 const timer=g.state.objective.remaining;tick(2);assert.equal(g.state.objective.remaining,timer);
 el('mission-start').onclick();const e=g.enemies.find(e=>e.id===g.state.objective.targetId);const x=e.x;tick(.3);assert.notEqual(e.x,x);
 g.gainKill(e);tick(.02);assert.equal(g.state.phase,'map');assert.equal(g.enemies.length,0);
 g.player.hp=50;g.state.corruption=50;choice('route',0).onclick();assert.equal(g.state.room,2);assert.equal(g.player.hp,80);assert.equal(g.state.corruption,25);
 el('altar-next').onclick();choice('route',0).onclick();assert.equal(g.state.objective.kind,'capture');assert.equal(g.state.phase,'briefing');
 el('mission-start').onclick();const target=g.enemies.find(e=>e.id===g.state.objective.targetId);g.expose(target);g.player.x=target.x;g.player.y=target.y;g.keys.KeyE=true;g.player.focus=100;g.updateCapture(.05);choice('equip',0).onclick();tick(.15);assert.equal(g.state.phase,'map');
 choice('route',0).onclick();assert.equal(g.state.room,4);assert.ok(g.enemies[0].boss);g.draw();
});
test('Chase failure restores entry resources and avoids retry farming',()=>{
 start();g.player.hp=67;g.player.focus=21;g.enterRoom(1,'chase');el('mission-start').onclick();
 g.gainKill(g.enemies.find(e=>e.id!==g.state.objective.targetId),true);g.state.owned.add('ghost');g.state.corruption=40;g.state.objective.remaining=.01;g.updateObjective(.02);
 assert.equal(g.state.phase,'missionFailed');el('mission-retry').onclick();assert.equal(g.state.phase,'briefing');assert.equal(g.state.kills,0);assert.equal(g.state.captures,0);assert.equal(g.player.hp,67);assert.equal(g.player.focus,21);assert.equal(g.state.corruption,0);assert.ok(!g.state.owned.has('ghost'));assert.equal(g.state.objective.remaining,45);g.draw();
});
test('Lantern has real incoming damage, paused timers, four waves and success',()=>{
 start();g.enterRoom(1,'defend');el('mission-start').onclick();const o=g.state.objective,e=g.enemies[0];e.x=o.lantern.x+40;e.y=o.lantern.y;e.cd=0;
 tick(1.1);assert.ok(o.lantern.hp<100);const remaining=o.remaining;g.pause();tick(2);assert.equal(o.remaining,remaining);g.closeModal();
 o.lantern.hp=0;g.updateObjective(.02);assert.equal(g.state.phase,'missionFailed');el('mission-retry').onclick();el('mission-start').onclick();assert.equal(g.state.objective.lantern.hp,100);
 g.player.hp=60;g.state.corruption=50;for(let i=0;i<4;i++){for(const enemy of g.enemies)g.gainKill(enemy);g.updateObjective(9);}
 assert.equal(g.state.objective.wave,4);assert.equal(g.state.phase,'map');assert.equal(g.state.objective.status,'complete');assert.equal(g.state.corruption,35);assert.ok(g.player.hp>=80);assert.equal(g.enemies.length,0);g.draw();
});
test('Capture objective cannot be completed by guard kills or accidental harvesting',()=>{
 start();g.enterRoom(3,'capture');el('mission-start').onclick();const o=g.state.objective,e=g.enemies.find(e=>e.id===o.targetId);
 for(const guard of g.enemies.filter(t=>t!==e))g.gainKill(guard);tick(2);assert.equal(g.state.phase,'playing');
 g.expose(e);g.damageEnemy(e,999,999,'basic');assert.ok(!e.dead);tick(7.3);assert.ok(!e.dead);assert.equal(e.exposed,0);assert.ok(e.pressure>0);
 g.expose(e);g.player.x=e.x;g.player.y=e.y;g.player.focus=100;g.keys.KeyE=true;g.updateCapture(.05);assert.equal(g.state.phase,'pickup');assert.ok(g.state.owned.has('wolf'));assert.ok(o.captured);
 choice('equip',0).onclick();tick(.1);assert.equal(g.state.phase,'map');assert.deepEqual([...g.state.slots],['wolf']);g.draw();
});
test('Free practice unlocks all shadows, waives costs, resets and cannot leak into a run',()=>{
 g.startPractice();assert.equal(g.state.mode,'practice');assert.equal(g.state.owned.size,4);g.player.focus=0;g.player.invincible=0;g.hitPlayer(999,true);assert.equal(g.player.hp,100);
 g.openBuild(0);assert.ok(!choice('shadow','shield').disabled);choice('shadow','shield').onclick();assert.equal(g.player.focus,0);el('build-close').onclick();g.skill();assert.equal(g.state.corruption,0);assert.ok(g.state.skillCd>0);g.refreshPractice();assert.equal(g.state.skillCd,0);
 g.practiceTargets('mobs');assert.equal(g.enemies.length,4);tick(2);assert.equal(g.player.hp,100);g.player.invincible=0;g.player.shield=2;g.hitPlayer(10);assert.equal(g.player.shield,0);assert.equal(g.player.hp,100);for(const e of g.enemies)g.gainKill(e);tick(1);assert.equal(g.state.phase,'playing');assert.equal(g.enemies.filter(e=>!e.dead).length,4);
 g.practiceTargets('dummy');g.draw();assert.equal(g.enemies.length,1);const pos=g.enemies[0].x;tick(2);assert.equal(g.enemies[0].x,pos);
 g.reset();g.start();assert.equal(g.state.phase,'worldIntro');assert.equal(g.state.mode,'hunt');assert.equal(g.state.owned.size,2);assert.equal(g.state.slots[0],'wolf');assert.equal(g.state.kills,0);
});
test('Mode switch is explicit and cancellation resumes the same run',()=>{
 start();g.requestPractice();assert.equal(g.state.phase,'modeChoice');el('cancel-practice').onclick();assert.equal(g.state.phase,'playing');assert.equal(g.enemies.length,4);
 g.requestPractice();el('enter-practice').onclick();assert.equal(g.state.mode,'practice');assert.ok(el('app-shell').classList.contains('in-combat'));
 g.reset();assert.ok(el('compact-build').classList.contains('hidden'));assert.ok(el('practice-toolbar').classList.contains('hidden'));
});
test('Idle lantern defense fails naturally; chase exposure alone is insufficient',()=>{
 start();g.enterRoom(1,'defend');el('mission-start').onclick();tick(37);assert.equal(g.state.phase,'missionFailed');assert.equal(g.state.objective.lantern.hp,0);
 start();g.enterRoom(1,'chase');el('mission-start').onclick();const e=g.enemies.find(e=>e.id===g.state.objective.targetId);g.expose(e);g.player.invincible=100;tick(7.5);assert.equal(g.state.phase,'playing');assert.ok(!e.dead);assert.equal(e.exposed,0);g.gainKill(e);tick(.1);assert.equal(g.state.phase,'map');
});
function expedition(){g.reset();g.start();assert.equal(g.state.phase,'worldIntro');el('world-begin').onclick();}
test('Expedition opens a persistent world with five biomes and variant packs',()=>{
 g.reset();g.start();assert.equal(g.state.phase,'worldIntro');const t=g.state.time;tick(1);assert.equal(g.state.time,t);el('world-begin').onclick();
 assert.ok(g.state.world);assert.equal(g.enemies.length,31);assert.equal(window.HUNTER_WORLD.regions.length,5);assert.ok(g.enemies.some(e=>e.variant==='cinder'));assert.ok(g.enemies.some(e=>e.variant==='stalker'));assert.ok(g.enemies.some(e=>e.variant==='sentinel'));
 const distant=g.enemies.find(e=>e.home.x>3000),x=distant.x,y=distant.y;tick(3);assert.equal(distant.x,x);assert.equal(distant.y,y);assert.equal(g.player.hp,100);g.draw();
});
test('Camera follows the hunter centre at map edges and keeps pointer aiming in world space',()=>{
 expedition();const before=g.camera;g.player.x=2800;g.player.y=1800;g.updateCamera(1);assert.ok(g.camera.x>before.x+1000);assert.ok(g.camera.y>1000);
 g.mousePosition({clientX:600,clientY:390});assert.ok(Math.abs(g.mouse.x-g.camera.x-g.camera.w/2)<.01);assert.ok(Math.abs(g.mouse.y-g.camera.y-g.camera.h/2)<.01);
 g.player.x=3590;g.player.y=2390;g.updateCamera(0,true);assert.equal(g.camera.x+g.camera.w/2,g.player.x);assert.equal(g.camera.y+g.camera.h/2,g.player.y);
 g.player.x=20;g.player.y=20;g.updateCamera(0,true);assert.ok(g.camera.x<0);assert.ok(g.camera.y<0);assert.ok(Math.abs(g.pointOnScreen(g.player).x-.5)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).y-.5)<1e-9);g.draw();
});
test('River blocks fast movement; bridges and all landmark routes remain passable',()=>{
 expedition();g.player.x=1120;g.player.y=1200;g.moveEntity(g.player,400,0);assert.ok(g.player.x<1220-g.player.r);const end=g.worldTravelEnd(1120,1200,1480,1200);assert.ok(end.x<1220);
 g.player.x=1120;g.player.y=1650;g.moveEntity(g.player,400,0);assert.ok(g.player.x>1420);
 const step=40,seen=new Set(['13,50']),queue=[[13,50]];for(let n=0;n<queue.length;n++){const [x,y]=queue[n];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,key=a+','+b;if(!seen.has(key)&&g.worldPositionFree(a*step,b*step,16)){seen.add(key);queue.push([a,b]);}}}
 for(const site of window.expeditionTest.allWorldSites()){const x=Math.round(site.x/step),y=Math.round(site.y/step);assert.ok(seen.has(x+','+y),'unreachable: '+site.id);}
});
test('Terrain changes movement and damage; skills and projectiles work beyond the old screen',()=>{
 expedition();g.player.x=1770;g.player.y=1510;assert.equal(g.worldMoveSpeed(),145);g.player.x=1600;g.player.y=1250;assert.equal(g.worldMoveSpeed(),224);
 g.player.x=1620;g.player.y=880;g.player.invincible=0;g.state.world.terrainTick=0;g.updateWorld(.02);assert.equal(g.player.hp,94);
 g.player.x=2100;g.player.y=1700;g.updateCamera(0,true);g.mousePosition({clientX:900,clientY:390});g.state.slots=['archer'];g.skill();tick(.12);assert.ok(g.projectiles.some(p=>p.x>1200));assert.ok(g.player.x>1200);g.draw();
});
test('New enemy variants have distinct telegraphs, hazards and armor',()=>{
 expedition();g.player.x=1900;g.player.y=1050;g.player.invincible=0;const e=g.spawnWorldEnemy('cinder',1900,800);e.cd=0;g.updateWorldEnemy(e,.02);assert.equal(e.attack,'meteor');const lockedX=e.target.x;g.player.x+=200;g.performEnemyAttack(e);assert.equal(g.hazards.at(-1).x,lockedX);assert.equal(g.player.hp,100);
 const stalker=g.spawnWorldEnemy('stalker',g.player.x-120,g.player.y);stalker.cd=0;g.updateWorldEnemy(stalker,.02);assert.equal(stalker.attack,'venom');g.performEnemyAttack(stalker);assert.ok(g.hazards.at(-1).poison);assert.equal(g.worldMoveSpeed(),145);
 const shield=g.spawnWorldEnemy('sentinel',3100,1500);shield.facing=0;shield.telegraph=0;g.player.x=3200;g.player.y=1500;const hp=shield.hp;g.damageEnemy(shield,20,0);const front=hp-shield.hp;g.player.x=3000;const hp2=shield.hp;g.damageEnemy(shield,20,0);assert.ok(hp2-shield.hp>front*2);g.draw();
});
test('World map pauses, tracks locations and does not teleport; skills can be swapped anywhere',()=>{
 expedition();const x=g.player.x,y=g.player.y;g.openWorldMap();const time=g.state.time;tick(2);assert.equal(g.state.time,time);choice('track','capture').onclick();assert.equal(g.state.world.track,'capture');assert.equal(g.player.x,x);assert.equal(g.player.y,y);assert.equal(g.state.phase,'playing');
 g.player.focus=0;g.openBuild();assert.ok(!choice('shadow','fire').disabled);el('build-close').onclick();const e=g.enemies[0];g.player.x=e.x-60;g.player.y=e.y;g.openBuild();assert.ok(!choice('shadow','fire').disabled);el('build-close').onclick();
});
test('World objectives preserve ambient enemies, retry resources and unlock the local Boss',()=>{
 expedition();const sites=window.HUNTER_WORLD.sites;const boss=sites.find(s=>s.id==='boss');g.player.x=boss.x;g.player.y=boss.y;g.interactWorld();assert.equal(g.state.objective,null);
 const defend=sites.find(s=>s.id==='defend');g.player.x=defend.x;g.player.y=defend.y+90;g.player.hp=72;g.interactWorld();assert.equal(g.state.phase,'briefing');el('mission-start').onclick();assert.equal(g.state.objective.lantern.x,defend.x);assert.ok(g.enemies.filter(e=>!e.mission).length===31);
 g.state.corruption=80;g.state.objective.lantern.hp=0;g.updateObjective(.1);el('mission-retry').onclick();assert.equal(g.player.hp,72);assert.equal(g.state.corruption,0);assert.equal(g.enemies.filter(e=>!e.mission).length,31);el('mission-start').onclick();
 for(let i=0;i<4;i++){for(const e of g.enemies.filter(e=>e.mission))g.gainKill(e);g.updateObjective(9);}assert.equal(g.state.phase,'worldComplete');assert.ok(g.state.world.completed.has('defend'));assert.equal(g.enemies.filter(e=>!e.mission).length,31);continueWorld();
 for(const id of ['capture','chase']){const s=sites.find(s=>s.id===id);g.player.x=s.x;g.player.y=s.y+90;g.interactWorld();el('mission-start').onclick();const e=g.enemies.find(e=>e.id===g.state.objective.targetId);assert.ok(Math.abs(e.x-s.x)<400&&Math.abs(e.y-s.y)<300);g.expose(e);g.player.x=e.x;g.player.y=e.y;g.player.focus=100;g.keys.KeyE=true;g.updateCapture(.05);choice('equip',0).onclick();g.updateObjective(.1);assert.equal(g.state.phase,'worldComplete');continueWorld();}
 assert.equal(g.state.world.completed.size,3);g.player.x=boss.x;g.player.y=boss.y;g.interactWorld();assert.equal(g.state.objective.kind,'boss');const b=g.enemies.find(e=>e.boss);assert.ok(b.x>2500&&b.y<700);b.hp=500;g.update(.1);assert.ok(g.enemies.filter(e=>e.mission).every(e=>e.x>2500));g.draw();g.gainKill(b);g.updateWorld(.02);assert.equal(g.state.phase,'worldVictory');assert.ok(g.state.campaign.cleared.includes('forest'));
});
test('Practice and tutorial return to the small arena without expedition state',()=>{
 expedition();g.startPractice();assert.equal(g.state.world,null);assert.equal(g.enemies.length,1);assert.ok(el('world-hud').classList.contains('hidden'));g.draw();g.beginTutorial();assert.equal(g.state.world,null);assert.ok(g.state.tutorial);g.draw();
});
const x=window.expeditionTest,ex=window.HUNTER_EXPEDITION;
test('First expedition creates a camp checkpoint; new runs and practice preserve it',()=>{
 expedition();assert.equal(ex.read(localStorage).status,'ready');const saved=storage.get(ex.key);assert.match(el('resume-summary').textContent,/0 \/ 3/);
 g.reset();g.start();el('world-begin').onclick();assert.equal(storage.get(ex.key),saved);g.startPractice();assert.equal(x.saveCamp(),false);g.beginTutorial();assert.equal(x.saveCamp(),false);assert.equal(storage.get(ex.key),saved);
});
test('Nearby scout teaches capture, resists harvesting and unlocks a single supply reward',()=>{
 expedition();const scout=g.enemies.find(e=>e.scout),site=ex.discoveries[0];assert.ok(Math.hypot(scout.x-520,scout.y-2010)<520);g.player.x=scout.x;g.player.y=scout.y+50;
 assert.equal(x.claimDiscovery(site),false);g.damageEnemy(scout,1,100);assert.ok(scout.exposed>0);g.damageEnemy(scout,999,999);assert.equal(scout.dead,false);g.player.invincible=100;tick(9);assert.ok(scout.exposed>0&&!scout.dead);
 g.keys.KeyE=true;g.player.focus=100;g.updateCapture(.05);assert.ok(g.state.world.trailCaptured);assert.ok(g.state.owned.has('archer'));choice('equip',0).onclick();assert.equal(g.state.slots[0],'archer');
 g.player.hp=55;g.player.focus=5;assert.equal(x.claimDiscovery(site),true);assert.equal(g.player.hp,75);assert.equal(g.player.focus,35);assert.equal(g.state.phase,'discovery');const time=g.state.time;tick(2);assert.equal(g.state.time,time);el('discovery-close').onclick();assert.equal(x.claimDiscovery(site),false);assert.equal(g.player.hp,75);assert.equal(g.state.world.track,'chase');
});
test('Opening route returns safely to camp without attracting neighboring patrols',()=>{
 expedition();const walk=(key,t)=>{g.keys[key]=true;tick(t);g.keys[key]=false;};walk('KeyW',1.5);walk('KeyD',.55);walk('KeyW',.72);
 const scout=g.enemies.find(e=>e.scout);g.gainKill(scout,true);assert.equal(x.claimDiscovery(ex.discoveries[0]),true);el('discovery-close').onclick();walk('KeyS',2.1);walk('KeyA',.55);tick(5);assert.equal(g.player.hp,100);assert.equal(x.canSaveCamp(),true);
});
test('Remote discoveries require guards cleared; upgrade and max-level fallback differ',()=>{
 expedition();const ash=ex.discoveries[1];g.player.x=ash.x;g.player.y=ash.y;assert.equal(x.claimDiscovery(ash),false);
 for(const e of g.enemies)if(Math.hypot(e.x-ash.x,e.y-ash.y)<330)g.gainKill(e);g.state.corruption=55;assert.equal(x.claimDiscovery(ash),true);assert.equal(g.state.corruption,35);assert.equal(g.state.world.restCharges,2);el('discovery-close').onclick();
 const relic=ex.discoveries[3];g.player.x=relic.x;g.player.y=relic.y;for(const e of g.enemies)if(Math.hypot(e.x-relic.x,e.y-relic.y)<330)g.gainKill(e);const level=g.state.levels.wolf;assert.equal(x.claimDiscovery(relic),true);assert.equal(g.state.levels.wolf,level+1);assert.ok(g.state.xp.wolf>=7);
 expedition();g.state.levels.wolf=2;g.state.xp.wolf=18;g.state.corruption=60;g.player.x=relic.x;g.player.y=relic.y;for(const e of g.enemies)if(Math.hypot(e.x-relic.x,e.y-relic.y)<330)g.gainKill(e);assert.equal(x.claimDiscovery(relic),true);assert.equal(g.state.levels.wolf,2);assert.equal(g.state.corruption,35);
});
test('Camp roundtrip restores build, resources, rewards, enemy deaths and mission progress',()=>{
 expedition();const scout=g.enemies.find(e=>e.scout);g.gainKill(scout,true);g.state.owned.add('archer');g.state.slots[0]='archer';g.state.world.claimed.add('trail-cache');g.state.world.completed.add('chase');g.state.world.visited.add('marsh');g.state.world.seen.add('stalker');g.state.world.track='defend';g.state.world.restCharges=0;g.state.stored='ghost';g.state.time=123;g.state.corruption=37;g.player.hp=63;g.player.focus=42;
 assert.equal(x.saveCamp(),true);const saved=storage.get(ex.key);g.state.world.completed.add('defend');g.state.world.claimed.add('ash-cache');g.state.slots[0]='wolf';g.player.hp=12;
 g.reset();assert.ok(!el('continue-run').classList.contains('hidden'));assert.equal(x.resumeCamp(),true);assert.equal(g.state.phase,'playing');assert.equal(g.player.hp,63);assert.equal(g.player.focus,42);assert.equal(g.player.x,520);assert.equal(g.state.slots[0],'archer');assert.equal(g.state.corruption,37);assert.equal(g.state.stored,null);assert.equal(g.state.world.completed.size,1);assert.equal(g.state.world.claimed.size,1);assert.equal(g.state.world.restCharges,0);assert.equal(g.state.world.track,'defend');assert.ok(g.enemies.find(e=>e.scout).dead);assert.equal(g.enemies.length,31);assert.equal(g.projectiles.length,0);assert.equal(storage.get(ex.key),saved);
 g.interactWorld();assert.equal(g.state.phase,'camp');assert.ok(el('camp-rest').disabled);assert.equal(x.saveCamp(),true);el('camp-leave').onclick();g.player.x=650;g.player.y=1530;assert.equal(x.claimDiscovery(ex.discoveries[0]),false);g.draw();
});
test('Camp saving rejects dangerous contexts and resumes death from the last checkpoint',()=>{
 expedition();const saved=storage.get(ex.key);g.player.x=800;assert.equal(x.saveCamp(),false);g.player.x=520;const e=g.enemies[0],pos={x:e.x,y:e.y};e.x=550;e.y=2010;assert.equal(x.saveCamp(),false);Object.assign(e,pos);
 g.state.objective={kind:'boss',status:'active'};assert.equal(x.saveCamp(),false);g.state.objective=null;g.state.nightmare=3;assert.equal(x.saveCamp(),false);g.state.nightmare=0;g.player.invincible=0;g.hitPlayer(150);assert.equal(g.state.phase,'end');assert.equal(storage.get(ex.key),saved);el('end-load').onclick();assert.equal(g.player.hp,100);assert.equal(g.state.phase,'playing');
});
test('Storage failure, malformed and future saves fail safely without starting a broken run',()=>{
 expedition();const good=storage.get(ex.key);storageFail=true;assert.equal(x.saveCamp(),false);assert.match(el('toast').textContent,/未能保存/);assert.equal(x.resumeCamp(),false);assert.equal(g.state.phase,'playing');storageFail=false;assert.equal(storage.get(ex.key),good);
 for(const bad of ['{broken',JSON.stringify({...JSON.parse(good),version:99}),JSON.stringify({...JSON.parse(good),world:{}})]){storage.set(ex.key,bad);g.reset();assert.ok(el('continue-run').classList.contains('hidden'));assert.equal(x.resumeCamp(),false);assert.equal(g.state.phase,'intro');}
 const invalid=JSON.parse(good);invalid.checkpoint.run.slots[0]='<script>';storage.set(ex.key,JSON.stringify(invalid));assert.equal(ex.read(localStorage).status,'invalid');
 storage.set(ex.key,good);g.reset();assert.equal(x.resumeCamp(),true);
});
test('A browser denying access to the storage object still allows normal play',()=>{
 Object.defineProperty(sandbox,'localStorage',{configurable:true,get(){throw Error('SecurityError');}});
 try{g.reset();g.start();el('world-begin').onclick();assert.equal(g.state.phase,'playing');assert.equal(x.saveCamp(),false);assert.equal(x.resumeCamp(),false);assert.match(el('save-note').textContent,/无法读取/);}finally{Object.defineProperty(sandbox,'localStorage',{configurable:true,writable:true,value:localStorage});}
});
test('Camp rest consumes a charge, saves the resulting state, and never advances world timers',()=>{
 expedition();g.player.hp=35;g.state.corruption=70;g.interactWorld();const time=g.state.time;tick(3);assert.equal(g.state.time,time);el('camp-rest').onclick();assert.equal(g.player.hp,100);assert.equal(g.state.corruption,45);assert.equal(g.state.world.restCharges,0);el('camp-save').onclick();assert.match(el('camp-status').textContent,/已保存/);g.reset();x.resumeCamp();assert.equal(g.state.corruption,45);assert.equal(g.state.world.restCharges,0);
});
test('Mission retry rolls back scouting and discoveries along with the run resources',()=>{
 expedition();const site=window.HUNTER_WORLD.sites.find(s=>s.id==='defend');g.player.x=site.x;g.player.y=site.y;g.interactWorld();el('mission-start').onclick();const scout=g.enemies.find(e=>e.scout);g.gainKill(scout,true);g.state.world.claimed.add('trail-cache');g.state.objective.lantern.hp=0;g.updateObjective(.02);el('mission-retry').onclick();assert.equal(g.state.world.trailCaptured,false);assert.equal(g.state.world.claimed.size,0);assert.ok(!g.enemies.find(e=>e.scout).dead);
});
test('Attack anticipation names each danger, locks targets and matches the actual lunge distance',()=>{
 expedition();const e=g.enemies[0];e.target={x:100,y:200};e.telegraph=1;e.attack='meteor';x.attackCue(e);assert.equal(e.windup,1);assert.equal(x.telegraphInfo(e).x,100);assert.equal(x.telegraphInfo(e).radius,88);assert.match(x.telegraphInfo(e).label,/离开橙圈/);g.player.x=400;assert.equal(x.telegraphInfo(e).x,100);
 for(const attack of ['lunge','shot','slam','lantern','venom','shieldBash','curse']){e.attack=attack;const info=x.telegraphInfo(e);assert.ok(info.label.length>4);if(attack==='lunge')assert.equal(info.length,.36*650);g.draw();}e.boss=true;e.attack='lunge';assert.equal(x.telegraphInfo(e).length,.58*650);e.telegraph=0;x.attackCue(e);assert.equal(e.cueActive,false);
});
test('Nightmare history remains saveable with a single active skill',()=>{
 expedition();g.state.owned.add('shield');g.state.slots=['shield'];g.state.corruption=96;g.skill();assert.equal(g.state.nightmare,9);tick(9.6);
 assert.equal(g.state.nightmare,0);assert.ok(g.state.locked);assert.equal(x.canSaveCamp(),true);assert.equal(x.saveCamp(),true);g.reset();assert.equal(x.resumeCamp(),true);assert.ok(g.state.locked);assert.equal(g.state.nightmare,0);
});
test('Boss exposure expiry restores combat instead of leaving a negative capture timer',()=>{
 start();g.enterRoom(4,'boss');const boss=g.enemies[0];boss.hp=150;g.expose(boss);g.player.invincible=100;tick(8.3);
 assert.equal(boss.exposed,0);assert.equal(boss.dead,false);assert.ok(boss.hp>150);assert.equal(boss.pressure,boss.maxPressure);
 const hp=boss.hp;g.damageEnemy(boss,10,0,'skill');assert.ok(boss.hp<hp);assert.equal(boss.dead,false);tick(3);assert.ok(boss.telegraph>0||boss.dash>0||boss.cd<1.5);
});
test('World mission retry resets all action cooldowns and transient inputs',()=>{
 expedition();const site=window.HUNTER_WORLD.sites.find(s=>s.id==='chase');g.player.x=site.x;g.player.y=site.y;g.interactWorld();el('mission-start').onclick();
 g.state.skillCd=4.8;g.state.dashCd=1.5;g.state.attackCd=.52;g.player.invincible=0;g.hitPlayer(999);assert.equal(g.state.phase,'missionFailed');el('mission-retry').onclick();
 assert.equal(g.state.phase,'briefing');assert.equal(g.state.skillCd,0);assert.equal(g.state.dashCd,0);assert.equal(g.state.attackCd,0);assert.equal(g.state.capture,0);assert.equal(g.mouse.down,false);
});
test('Leaving a failed world mission returns to camp with earlier exploration intact',()=>{
 expedition();const scout=g.enemies.find(e=>e.scout);g.gainKill(scout,true);g.state.owned.add('archer');g.state.world.claimed.add('trail-cache');g.state.world.completed.add('chase');g.state.journey.perks=['keen'];g.state.journey.flasks=1;
 const site=window.HUNTER_WORLD.sites.find(s=>s.id==='defend');g.player.x=site.x;g.player.y=site.y;g.player.hp=72;g.interactWorld();el('mission-start').onclick();const kills=g.state.kills;
 g.gainKill(g.enemies.find(e=>e.mission));g.state.journey.flasks=0;g.state.world.claimed.add('ash-cache');g.state.objective.lantern.hp=0;g.updateObjective(.02);el('mission-home').onclick();
 assert.equal(g.state.phase,'camp');assert.ok(g.state.world);assert.equal(g.state.objective,null);assert.equal(g.player.x,520);assert.equal(g.player.y,2010);assert.equal(g.player.hp,72);assert.equal(g.state.kills,kills);
 assert.deepEqual([...g.state.world.completed],['chase']);assert.deepEqual([...g.state.world.claimed],['trail-cache']);assert.deepEqual([...g.state.journey.perks],['keen']);assert.equal(g.state.journey.flasks,1);assert.ok(g.enemies.find(e=>e.scout).dead);assert.ok(g.enemies.every(e=>!e.mission));
});
test('Only purple hazards bypass dodge invulnerability; orange and green hazards respect it',()=>{
 for(const purple of [false,true]){expedition();g.player.x=1000;g.player.y=1800;g.player.invincible=.25;g.player.dash=.18;g.player.dx=0;g.player.dy=0;g.hazards.push({x:g.player.x,y:g.player.y,r:72,life:4,tick:0,friendly:false,color:purple?'#a36cca':'#84c8a3',poison:!purple,purple,damage:5});g.update(.02);assert.equal(g.player.hp,purple?95:100);}
 expedition();g.player.invincible=.25;g.hazards.push({x:g.player.x,y:g.player.y,r:88,life:2.6,tick:0,friendly:false,color:'#edac6f',damage:7});g.update(.02);assert.equal(g.player.hp,100);
});
test('Skill levels increase direct arrow damage by 22 percent each',()=>{
const damages=[];for(const level of [0,2]){const enemy=castTarget('archer');g.state.levels.archer=level;g.skill();for(const p of g.projectiles){p.x=enemy.x;p.y=enemy.y;p.vx=p.vy=0;}g.update(.001);damages.push(1000-enemy.hp);}assert.ok(Math.abs(damages[1]/damages[0]-1.44)<1e-8);
});

test('Flasks are limited, cool down, cleanse corruption, and waste no charge at full resources',()=>{
 expedition();const j=g.state.journey;assert.equal(j.flasks,2);g.useFlask();assert.equal(j.flasks,2);assert.equal(j.flaskCd,0);
 g.player.hp=40;g.state.corruption=40;g.useFlask();assert.equal(g.player.hp,75);assert.equal(g.state.corruption,28);assert.equal(j.flasks,1);assert.equal(j.flaskCd,8);g.useFlask();assert.equal(j.flasks,1);assert.equal(g.player.hp,75);
 tick(8.1);g.player.hp=40;g.state.corruption=80;g.useFlask();assert.equal(g.player.hp,57.5);assert.equal(g.state.corruption,68);assert.equal(j.flasks,0);tick(8.1);g.useFlask();assert.equal(g.player.hp,57.5);assert.equal(j.flasks,0);
 expedition();g.state.journey.perks=['renewal'];g.player.hp=25;g.useFlask();assert.equal(g.player.hp,75);
});
test('C and B keyboard shortcuts execute once per key press and Space suppresses button activation',()=>{
 expedition();g.player.hp=35;const c=keyEvent('keydown','KeyC');assert.equal(g.player.hp,70);assert.equal(g.state.journey.flasks,1);keyEvent('keydown','KeyC',{repeat:true});assert.equal(g.state.journey.flasks,1);keyEvent('keyup','KeyC');
 const button={tagName:'BUTTON',closest:selector=>selector.includes('button')?button:null};const space=keyEvent('keydown','Space',{target:button});assert.equal(space.defaultPrevented,true);assert.ok(g.state.dashCd>0);keyEvent('keyup','Space');
 g.player.dash=0;g.player.x=350;g.player.y=2010;keyEvent('keydown','KeyB');assert.ok(g.state.journey.recall>0);keyEvent('keyup','KeyB');
});
test('Stationary recall takes three seconds even at camp, then saves and opens settlement',()=>{
 for(const originX of [350,520]){
  expedition();g.player.x=originX;g.player.hp=54;g.state.corruption=37;
  assert.equal(g.startRecall(),true);assert.equal(g.state.journey.recall,3);tick(2.8);
  assert.equal(g.state.phase,'playing');assert.equal(g.player.x,originX);g.draw();tick(.22);
  assert.equal(g.state.phase,'settlement');assert.equal(g.player.x,520);assert.equal(g.player.y,2010);
  assert.equal(g.player.hp,54);assert.equal(g.state.corruption,37);assert.equal(g.state.journey.recall,0);
  assert.ok(g.state.settlement.campSaved);assert.ok(g.state.settlement.profileSaved);assert.ok(ex.valid(JSON.parse(storage.get(ex.key))));
  assert.ok(Math.abs(g.state.settlement.elapsed-3)<.03);assert.equal(JSON.parse(storage.get(ex.key)).checkpoint.player.hp,54);
  const elapsed=g.state.settlement.elapsed;tick(5);assert.equal(g.state.settlement.elapsed,elapsed);g.draw();
 }
});
test('Recall protects against live enemies, purple hazards and nightmare until arrival',()=>{
 expedition();g.player.x=1770;g.player.y=1510;g.player.hp=61;g.player.invincible=0;
 const enemy=g.enemies[0];enemy.x=g.player.x+60;enemy.y=g.player.y;enemy.cd=0;
 g.hazards.push({x:g.player.x,y:g.player.y,r:100,life:10,tick:0,purple:true,damage:999});
 assert.equal(g.startRecall(),true);g.hitPlayer(999,true);assert.equal(g.player.hp,61);tick(.4);
 assert.ok(g.state.journey.recall>0);assert.equal(g.player.hp,61);g.state.nightmare=8;tick(2.7);
 assert.equal(g.state.phase,'settlement');assert.equal(g.player.hp,61);assert.equal(g.state.nightmare,0);
 assert.equal(g.hazards.length,0);assert.equal(g.projectiles.length,0);assert.equal(g.minions.length,0);
 assert.ok(g.enemies.every(e=>e.dead||!e.telegraph&&!e.dash));assert.ok(g.state.settlement.campSaved);
});
test('Movement, attacks, skills, dodge, capture, flasks and panels each interrupt recall',()=>{
 const actions=[
  ()=>{keyEvent('keydown','KeyD');tick(.02);keyEvent('keyup','KeyD');},
  ()=>g.basicAttack(),()=>g.skill(),()=>g.dash(),
  ()=>{g.keys.KeyE=true;tick(.02);g.keys.KeyE=false;},
  ()=>{g.player.hp=50;g.useFlask();},()=>g.openWorldMap(),()=>g.pause()
 ];
 for(const action of actions){expedition();g.player.x=350;assert.equal(g.startRecall(),true);action();assert.equal(g.state.journey.recall,0);assert.notEqual(g.state.phase,'settlement');}
 expedition();g.player.x=350;keyEvent('keydown','KeyB');tick(.3);const remaining=g.state.journey.recall;
 keyEvent('keydown','KeyB',{repeat:true});assert.equal(g.state.journey.recall,remaining);keyEvent('keyup','KeyB');keyEvent('keydown','KeyB');assert.equal(g.state.journey.recall,0);keyEvent('keyup','KeyB');
 g.startPractice();assert.equal(g.startRecall(),false);g.beginTutorial();assert.equal(g.startRecall(),false);g.reset();assert.equal(g.startRecall(),false);
});
test('Recall abandons an active mission while preserving earned rewards and cleaning inputs',()=>{
 expedition();const site=window.campaignTest.map.sites.find(s=>s.kind==='defend');g.player.x=site.x;g.player.y=site.y;
 g.interactWorld();el('mission-start').onclick();const enemy=g.enemies.find(e=>e.mission);g.gainKill(enemy,true);
 g.showReward('archer');el('keep-skill').onclick();g.state.journey.perks.push('keen');
 const reward=x.expeditionReward('recall-test:mission','mission'),inventory=JSON.stringify(g.state.campaign.inventory),kills=g.state.kills;
 g.state.objective.remaining=.01;g.state.objective.lantern.hp=1;
 assert.ok(reward);assert.equal(g.startRecall(),true);g.keys.KeyB=true;tick(3.1);
 assert.equal(g.state.phase,'settlement');assert.equal(g.state.objective,null);assert.equal(g.state.world.missionCheckpoint,null);
 assert.equal(g.state.kills,kills);assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);assert.ok(g.state.owned.has('archer'));assert.ok(g.state.journey.perks.includes('keen'));
 assert.ok(g.enemies.every(e=>!e.mission));assert.equal(g.state.world.completed.has(site.id),false);assert.ok(g.state.settlement.abandoned);
 assert.ok(g.state.settlement.skills.includes('archer'));assert.ok(g.state.settlement.perks.includes('keen'));assert.ok(g.state.settlement.items[reward]>0);
 assert.equal(Object.keys(g.keys).length,0);assert.equal(g.mouse.down,false);assert.equal(g.player.charging,0);assert.equal(g.state.capture,0);
 const save=JSON.parse(storage.get(ex.key));assert.ok(save.checkpoint.run.owned.includes('archer'));assert.ok(save.checkpoint.run.journey.perks.includes('keen'));
});
test('A Boss defeated during recall keeps the channel and settles its unlock and guaranteed relic once',()=>{
 expedition();const campaign=window.HUNTER_CAMPAIGN;g.state.world.completed=new Set(['chase','defend','capture']);
 const site=window.campaignTest.map.sites.find(s=>s.kind==='boss');g.player.x=site.x;g.player.y=site.y;g.interactWorld();
 const boss=g.enemies.find(e=>e.boss);assert.ok(boss);boss.hp=.01;boss.burn=.1;g.updateEnemy(boss,.02);
 assert.ok(boss.hp<=0&&boss.exposed>0);boss.exposed=.06;g.state.hitStop=0;const before={...g.state.campaign.inventory};assert.equal(g.startRecall(),true);tick(.1);
 assert.ok(boss.dead);assert.equal(g.state.phase,'playing');assert.ok(g.state.journey.recall>0);assert.ok(g.state.campaign.cleared.includes('forest'));assert.ok(campaign.unlocked(g.state.campaign,'forge'));
 tick(2.8);assert.equal(g.state.phase,'playing');tick(.12);assert.equal(g.state.phase,'settlement');
 const report=g.state.settlement,inventory=JSON.stringify(g.state.campaign.inventory);assert.ok(Math.abs(report.elapsed-3)<.03);assert.equal(report.kills,1);assert.equal(report.items.fang,1);assert.ok(report.campSaved);
 for(const [id,count] of Object.entries(g.state.campaign.inventory))assert.equal(report.items[id]||0,count-(before[id]||0));
 assert.match(el('modal-card').innerHTML,/月狼牙坠/);el('settlement-close').onclick();assert.equal(g.state.phase,'intro');assert.ok(x.resumeCamp());
 assert.ok(g.state.campaign.cleared.includes('forest'));assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);g.updateWorld(.02);assert.equal(g.state.phase,'playing');
 g.startRecall();tick(3.1);assert.equal(g.state.phase,'settlement');assert.equal(Object.keys(g.state.settlement.items).length,0);assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);
});
test('Settlement measures active adventure time and acquired loot without counting duplicates',()=>{
 expedition();tick(1);g.pause();const active=g.state.adventure.elapsed;tick(5);assert.equal(g.state.adventure.elapsed,active);g.closeModal();
 const id=x.expeditionReward('recall-test:loot','mission');assert.ok(id);const gained=g.state.adventure.items[id];
 assert.equal(x.expeditionReward('recall-test:loot','mission'),null);assert.equal(g.state.adventure.items[id],gained);
 const enemy=g.enemies.find(e=>!e.scout);g.gainKill(enemy,true);const kills=g.state.adventure.kills;g.gainKill(enemy,true);assert.equal(g.state.adventure.kills,kills);
 g.state.owned.add('archer');g.state.journey.perks.push('keen');g.state.world.claimed.add('trail-cache');g.state.world.completed.add('chase');
 g.startRecall();tick(3.1);const summary=g.state.settlement;
 assert.ok(Math.abs(summary.elapsed-4)<.03);assert.equal(summary.kills,1);assert.equal(summary.captures,1);assert.equal(summary.completed,1);
 assert.deepEqual([...summary.skills],['archer']);assert.deepEqual([...summary.perks],['keen']);assert.deepEqual([...summary.discoveries],['trail-cache']);assert.ok(summary.items[id]>=gained);
 assert.match(el('modal-card').innerHTML,new RegExp(window.HUNTER_CAMPAIGN.items[id].name));assert.match(el('modal-card').innerHTML,/settlement-close/);
 el('settlement-close').onclick();assert.equal(g.state.phase,'intro');const inventory=JSON.stringify(g.state.campaign.inventory);assert.ok(x.resumeCamp());
 assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);assert.ok(g.state.owned.has('archer'));assert.equal(g.state.adventure.elapsed,0);assert.equal(g.state.adventure.kills,0);assert.equal(Object.keys(g.state.adventure.items).length,0);
 g.startRecall();tick(3.1);assert.deepEqual([...g.state.settlement.skills],[]);assert.deepEqual([...g.state.settlement.perks],[]);assert.deepEqual([...g.state.settlement.discoveries],[]);assert.equal(g.state.settlement.completed,0);
});
test('Mission retries retain adventure duration and actual loot without duplicating guard rewards',()=>{
 expedition();const site=window.campaignTest.map.sites.find(s=>s.kind==='defend');g.player.x=site.x;g.player.y=site.y;g.interactWorld();el('mission-start').onclick();
 tick(.5);g.gainKill(g.enemies.find(e=>e.mission));const item=x.expeditionReward('recall-test:retry','mission');
 const elapsed=g.state.adventure.elapsed,items=JSON.stringify(g.state.adventure.items),inventory=JSON.stringify(g.state.campaign.inventory);
 g.state.objective.lantern.hp=0;g.updateObjective(.02);el('mission-retry').onclick();
 assert.equal(g.state.adventure.elapsed,elapsed);assert.equal(JSON.stringify(g.state.adventure.items),items);assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);
 tick(3);assert.equal(g.state.adventure.elapsed,elapsed);el('mission-start').onclick();assert.equal(x.expeditionReward('recall-test:retry','mission'),null);
 assert.equal(JSON.stringify(g.state.adventure.items),items);g.startRecall();tick(3.1);assert.ok(g.state.settlement.elapsed>=elapsed+3-.03);assert.ok(g.state.settlement.items[item]>0);
});
test('Every world returns to its own initial camp and settlement close controls preserve progress',()=>{
 const controls=['settlement-close','settlement-x','Escape'];
 for(const [index,world] of window.HUNTER_CAMPAIGN.worlds.entries()){
  g.reset();g.enterWorld(world.id);el('world-begin').onclick();const camp=window.campaignTest.map.sites.find(s=>s.kind==='camp');
  g.player.x=350;g.player.y=2010;keyEvent('keydown','KeyB');keyEvent('keyup','KeyB');tick(3.1);
  assert.equal(g.state.phase,'settlement');assert.equal(g.state.world.id,world.id);assert.equal(g.player.x,camp.x);assert.equal(g.player.y,camp.y);
  const control=controls[index%controls.length];if(control==='Escape'){keyEvent('keydown','Escape');keyEvent('keyup','Escape');}else el(control).onclick();
  assert.equal(g.state.phase,'intro');assert.ok(!el('continue-run').classList.contains('hidden'));assert.ok(x.resumeCamp());assert.equal(g.state.world.id,world.id);assert.equal(g.player.x,camp.x);assert.equal(g.player.y,camp.y);
 }
});
test('Mission blessings require one offered choice and repeated or foreign choices do not stack',()=>{
 expedition();const site=window.HUNTER_WORLD.sites.find(s=>s.id==='chase');g.player.x=site.x;g.player.y=site.y;g.interactWorld();el('mission-start').onclick();g.gainKill(g.enemies.find(e=>e.id===g.state.objective.targetId));g.updateObjective(.02);
 assert.equal(g.state.phase,'worldComplete');assert.equal(g.state.pendingBoons.length,3);const offered=[...g.state.pendingBoons];assert.ok(el('world-continue').disabled);el('world-continue').onclick();assert.equal(g.state.phase,'worldComplete');g.chooseBoon('invalid');assert.equal(g.state.journey.perks.length,0);
 const chosen=offered[0];g.chooseBoon(chosen);assert.deepEqual([...g.state.journey.perks],[chosen]);assert.equal(g.state.pendingBoons.length,0);assert.equal(el('world-continue').disabled,false);g.chooseBoon(chosen);g.chooseBoon(offered[1]);assert.deepEqual([...g.state.journey.perks],[chosen]);el('world-continue').onclick();assert.equal(g.state.phase,'playing');
});
test('Journey perks and flask stock survive camp loading and mission retries roll them back',()=>{
 expedition();g.state.journey.perks=['ward','renewal'];g.state.journey.flasks=1;g.state.journey.bestStreak=5;assert.equal(x.saveCamp(),true);g.reset();assert.equal(x.resumeCamp(),true);assert.deepEqual([...g.state.journey.perks],['ward','renewal']);assert.equal(g.state.journey.flasks,1);assert.equal(g.state.journey.bestStreak,5);
 const site=window.HUNTER_WORLD.sites.find(s=>s.id==='defend');g.player.x=site.x;g.player.y=site.y;g.interactWorld();el('mission-start').onclick();g.state.journey.perks.push('keen');g.state.journey.flasks=0;g.state.journey.bestStreak=20;g.state.objective.lantern.hp=0;g.updateObjective(.02);el('mission-retry').onclick();assert.deepEqual([...g.state.journey.perks],['ward','renewal']);assert.equal(g.state.journey.flasks,1);assert.equal(g.state.journey.bestStreak,5);
});
test('Old camp equipment migrates all families and new one-skill camps roundtrip',()=>{
expedition();assert.equal(x.saveCamp(),true);const raw=JSON.parse(storage.get(ex.key)),run=raw.checkpoint.run;run.slots=['ghost','swarm','giant'];run.owned=['ghost','swarm','giant','mirror'];run.stored='shield';run.levels.ghost=2;run.xp.ghost=18;run.levels.giant=1;run.xp.giant=7;run.locked=true;storage.set(ex.key,JSON.stringify(raw));g.reset();assert.equal(x.resumeCamp(),true);assert.deepEqual([...g.state.slots],['wolf']);assert.equal(g.state.owned.size,4);assert.equal(g.state.levels.wolf,2);assert.equal(g.state.levels.shield,1);assert.equal(g.state.stored,null);assert.equal(x.saveCamp(),true);assert.equal(JSON.parse(storage.get(ex.key)).checkpoint.run.slots.length,1);g.reset();assert.equal(x.resumeCamp(),true);assert.equal(g.state.levels.wolf,2);assert.deepEqual([...g.state.slots],['wolf']);
});

test('Navigation leads across a reachable bridge before pointing at the tracked site',()=>{
 expedition();const target=window.HUNTER_WORLD.sites.find(s=>s.id==='capture');g.state.world.track=target.id;let waypoint=g.navigationTarget();assert.ok(waypoint.bridge);assert.equal(waypoint.y,1650);assert.ok(waypoint.x<1220);assert.ok(g.worldPositionFree(waypoint.x,waypoint.y,g.player.r));
 g.player.x=1150;g.player.y=1650;waypoint=g.navigationTarget();assert.ok(waypoint.bridge);assert.ok(waypoint.x>1390);assert.equal(waypoint.y,1650);
 g.player.x=1500;waypoint=g.navigationTarget();assert.equal(waypoint.id,target.id);assert.equal(waypoint.x,target.x);g.state.world.track='camp';waypoint=g.navigationTarget();assert.ok(waypoint.bridge);assert.ok(waypoint.x<1220);
});
test('Blessings alter attacks, skills, damage taken, dodge cooldown, and corruption cost',()=>{
 expedition();g.state.journey.perks=['keen','arcane'];let enemy=g.enemies[0],hp=enemy.hp;g.damageEnemy(enemy,20,0,'basic');assert.ok(Math.abs((hp-enemy.hp)-23.6)<1e-8);hp=enemy.hp;g.damageEnemy(enemy,20,0,'skill');assert.ok(Math.abs((hp-enemy.hp)-23.6)<1e-8);
 expedition();g.state.journey.perks=['ward'];g.player.invincible=0;g.hitPlayer(20);assert.equal(g.player.hp,83);
 expedition();g.state.journey.perks=['stride'];g.dash();assert.ok(Math.abs(g.state.dashCd-1.2)<1e-8);
 expedition();g.state.journey.perks=['clarity'];g.skill();assert.equal(g.state.corruption,6);
 expedition();g.state.journey.perks=['renewal'];g.player.focus=0;g.gainKill(g.enemies[0]);assert.equal(g.player.focus,11);
});
test('Kill chains grant a third-kill bonus and damage breaks the chain without erasing its record',()=>{
 expedition();g.state.corruption=30;g.player.focus=0;for(const enemy of g.enemies.slice(0,3))g.gainKill(enemy);assert.equal(g.state.journey.streak,3);assert.equal(g.state.journey.bestStreak,3);assert.equal(g.player.focus,34);assert.equal(g.state.corruption,27);
 g.player.invincible=0;g.hitPlayer(1);assert.equal(g.state.journey.streak,0);assert.equal(g.state.journey.bestStreak,3);
 g.gainKill(g.enemies[3]);assert.equal(g.state.journey.streak,1);g.pause();const remaining=g.state.journey.streakTime;tick(2);assert.equal(g.state.journey.streakTime,remaining);g.closeModal();tick(10.1);assert.equal(g.state.journey.streak,0);assert.equal(g.state.journey.bestStreak,3);
});
test('Arcane blessing increases burn, bleed, and friendly fire-trail damage by eighteen percent',()=>{
 for(const kind of ['burn','bleed','trail']){const damage=[];for(const boosted of [false,true]){start();g.state.journey.perks=boosted?['arcane']:[];const enemy=g.enemies[0];enemy.cd=999;const hp=enemy.hp;if(kind==='trail')g.hazards.push({x:enemy.x,y:enemy.y,r:38,life:3,tick:0,friendly:true,color:'#eda874'});else enemy[kind]=1;g.update(.02);damage.push(hp-enemy.hp);}
  assert.ok(damage[0]>0,kind+' should deal damage');assert.ok(Math.abs(damage[1]/damage[0]-1.18)<1e-8,kind+' should receive the arcane multiplier');
 }
});
test('Flask HUD shows the actual reduced healing at deep corruption',()=>{
 expedition();g.state.corruption=75;g.pause();assert.match(el('flask-hint').textContent,/恢复 17\.5/);assert.match(el('flask-hint').textContent,/半疗/);g.closeModal();
 g.state.journey.perks=['renewal'];g.pause();assert.match(el('flask-hint').textContent,/恢复 25/);assert.match(el('flask-hint').textContent,/半疗/);g.closeModal();
 g.state.journey.perks=[];g.state.corruption=74;g.pause();assert.match(el('flask-hint').textContent,/恢复 35/);assert.doesNotMatch(el('flask-hint').textContent,/半疗/);
});
test('Browser modifier shortcuts do not cast skills or consume flasks',()=>{
 expedition();g.player.hp=30;for(const modifier of ['ctrlKey','metaKey','altKey'])for(const code of ['KeyQ','KeyC']){const event=keyEvent('keydown',code,{[modifier]:true});assert.equal(event.defaultPrevented,false);assert.equal(g.player.hp,30);assert.equal(g.state.journey.flasks,2);assert.equal(g.state.journey.flaskCd,0);assert.equal(g.state.skillCd,0);assert.equal(g.state.corruption,0);assert.ok(!g.keys[code]);keyEvent('keyup',code);}
});
test('Opening a modal clears capture progress and held combat inputs before resuming',()=>{
 start();const enemy=g.enemies[0];g.expose(enemy);g.player.x=enemy.x;g.player.y=enemy.y;g.keys.KeyE=true;g.updateCapture(.4);assert.ok(g.state.capture>0);assert.equal(g.state.captureTarget,enemy);g.mouse.down=true;g.mouse.held=.6;g.player.charging=.6;
 g.openGuide();assert.equal(g.state.phase,'guide');assert.equal(g.state.capture,0);assert.equal(g.state.captureTarget,null);assert.ok(el('capture-hud').classList.contains('hidden'));assert.equal(g.mouse.down,false);assert.equal(g.mouse.held,0);assert.equal(g.player.charging,0);assert.ok(!g.keys.KeyE);el('guide-close').onclick();g.updateCapture(.02);assert.equal(g.state.capture,0);assert.equal(enemy.dead,false);
});
test('Esc closes a first-run discovery back into the same expedition',()=>{
 g.reset();g.openGuide();el('guide-close').onclick();g.start();el('world-begin').onclick();
 const scout=g.enemies.find(e=>e.scout),site=ex.discoveries[0];g.gainKill(scout,true);g.player.x=site.x;g.player.y=site.y;
 assert.equal(x.claimDiscovery(site),true);assert.equal(g.state.phase,'discovery');const world=g.state.world;
 keyEvent('keydown','Escape');keyEvent('keyup','Escape');assert.equal(g.state.phase,'playing');assert.equal(g.state.world,world);assert.ok(el('intro').classList.contains('hidden'));assert.ok(world.claimed.has(site.id));
});
test('Boss pressure breaks cancel an active lunge before it can move or damage again',()=>{
 start();g.enterRoom(4,'boss');const boss=g.enemies[0];boss.dash=.5;boss.dx=1;boss.dy=0;boss.attack='lunge';boss.target={x:boss.x+100,y:boss.y};
 g.player.x=boss.x+50;g.player.y=boss.y;g.player.invincible=0;g.damageEnemy(boss,1,boss.maxPressure+1,'basic');
 assert.equal(boss.dash,0);assert.equal(boss.telegraph,0);assert.equal(boss.exposed,0);assert.equal(boss.pressure,boss.maxPressure);const position={x:boss.x,y:boss.y};
 g.update(.02);assert.equal(g.player.hp,100);assert.ok(Math.hypot(boss.x-position.x,boss.y-position.y)<2);
});
test('Shield pressure applies the Boss gate at high and low health',()=>{
 for(const lowHealth of [false,true]){start();g.enterRoom(4,'boss');const boss=g.enemies[0];g.state.slots=['shield'];g.player.x=boss.x+60;g.player.y=boss.y;boss.pressure=10;boss.telegraph=1;boss.dash=.3;if(lowHealth)boss.hp=100;g.skill();assert.equal(boss.telegraph,0);assert.equal(boss.dash,0);if(lowHealth)assert.ok(boss.exposed>0);else{assert.equal(boss.exposed,0);assert.equal(boss.pressure,boss.maxPressure);}}
});
test('A precise dodge applies the Boss pressure break instead of leaving negative pressure',()=>{
 for(const lowHealth of [false,true]){start();g.enterRoom(4,'boss');const boss=g.enemies[0];boss.pressure=10;boss.telegraph=1;boss.attack='slam';boss.target={x:g.player.x,y:g.player.y};if(lowHealth)boss.hp=100;
  g.dash();assert.equal(boss.telegraph,0);if(lowHealth)assert.ok(boss.exposed>0);else{assert.equal(boss.exposed,0);assert.equal(boss.pressure,boss.maxPressure);}
 }
});
function changeCastLoadout(){g.openBuild();choice('shadow','shield').onclick();el('build-close').onclick();}
function castTarget(active,echo='wolf'){
 g.startPractice();g.state.slots=[active];g.state.levels[active]=0;g.state.levels.shield=active==='shield'?0:2;
 const enemy=g.enemies[0];Object.assign(enemy,{x:780,y:410,hp:1000,maxHp:1000,pressure:1000,maxPressure:1000,cd:999});g.mouse.x=enemy.x;g.mouse.y=enemy.y;return enemy;
}
test('In-flight arrows keep their casting level after switching skills',()=>{
const results=[];for(const changed of [false,true]){const enemy=castTarget('archer');g.skill();if(changed)changeCastLoadout();tick(.6);results.push(1000-enemy.hp);assert.equal(enemy.burn,0);assert.equal(enemy.bleed,0);}assert.ok(results[0]>0);assert.ok(Math.abs(results[0]-results[1])<1e-8);
});

test('Existing fire burns retain the cast when switching skills',()=>{
const results=[];for(const changed of [false,true]){const enemy=castTarget('fire');enemy.x=g.player.x+120;enemy.y=g.player.y;g.mouse.x=enemy.x;g.mouse.y=enemy.y;g.skill();if(changed)changeCastLoadout();tick(.6);results.push(1000-enemy.hp);assert.ok(enemy.burn>0);assert.equal(enemy.burnCast.active,'fire');}assert.ok(Math.abs(results[0]-results[1])<1e-8);
});

test('Learning mirror gives arrows without delayed replay',()=>{
g.startPractice();g.showReward('mirror');choice('equip',0).onclick();g.skill();assert.equal(g.projectiles.length,3);g.projectiles.splice(0);tick(.6);assert.equal(g.projectiles.length,0);
});

test('Non-combat dialogs preserve native Tab navigation and Space activation',()=>{
 for(const phase of ['guide','codex','skillinfo','paused','pickup','briefing','worldComplete','discovery','camp','missionFailed']){
  start();g.showModal(phase,'<button id="test-modal-action">Continue</button>');
  for(const code of ['Tab','Space']){const event=keyEvent('keydown',code,{target:{tagName:'BUTTON'}});assert.equal(event.defaultPrevented,false,phase+' '+code);assert.equal(g.state.phase,phase);keyEvent('keyup',code);}
  assert.equal(g.state.dashCd,0);assert.equal(g.state.skillCd,0);
 }
 start();assert.equal(keyEvent('keydown','Tab').defaultPrevented,true);assert.equal(g.state.phase,'build');keyEvent('keyup','Tab');
 assert.equal(keyEvent('keydown','Tab',{target:{tagName:'BUTTON'}}).defaultPrevented,false);assert.equal(g.state.phase,'build');keyEvent('keyup','Tab');
 keyEvent('keydown','Escape');assert.equal(g.state.phase,'playing');keyEvent('keyup','Escape');
});
test('Expired projectiles cannot hit, and their final partial frame preserves their actual range',()=>{
 for(const sample of [{life:0,distance:0,hit:false},{life:.005,distance:35,hit:false},{life:.005,distance:30,hit:true}]){
  const enemy=castTarget('archer');g.shoot(enemy.x-sample.distance,enemy.y,0,1000,10,'#ffffff',{life:sample.life});g.update(.02);
  assert.equal(enemy.hp,sample.hit?990:1000,JSON.stringify(sample));assert.equal(g.projectiles.length,0);
 }
});
test('Expired summons cannot bite while a positive final lifetime can still attack',()=>{
 for(const life of [0,.005]){const enemy=castTarget('archer');g.spawnMinion(enemy.x,enemy.y,'#ffffff',life);g.update(.02);assert.equal(enemy.hp,life>0?992:1000);assert.equal(g.minions.length,0);}
});
test('Expired ground hazards cause no damage but a valid final partial frame still ticks',()=>{
 for(const life of [0,.005]){start();for(const enemy of g.enemies)enemy.dead=true;g.player.invincible=0;g.hazards.push({x:g.player.x,y:g.player.y,r:40,life,tick:0,friendly:false,color:'#ffffff',damage:7});g.update(.02);assert.equal(g.player.hp,life>0?93:100);assert.equal(g.hazards.length,0);}
});
test('All initial world enemies spawn outside solid terrain and can leave their spawn',()=>{
 expedition();for(const enemy of g.enemies){assert.ok(g.worldPositionFree(enemy.x,enemy.y,enemy.r),'blocked spawn: '+enemy.type+' at '+enemy.x+','+enemy.y);}
 const wolf=g.enemies.find(enemy=>enemy.type==='wolf'&&enemy.home.x>=800&&enemy.home.x<900&&enemy.home.y===1020);assert.ok(wolf);const before={x:wolf.x,y:wolf.y};
 for(const enemy of g.enemies)if(enemy!==wolf)enemy.dead=true;g.player.x=wolf.x-250;g.player.y=wolf.y;g.player.invincible=100;tick(1);assert.ok(Math.hypot(wolf.x-before.x,wolf.y-before.y)>20);
});
test('Dodging preserves the invulnerability already granted by a dash skill',()=>{
castTarget('wolf');g.skill();assert.equal(g.player.invincible,.45);g.dash();assert.equal(g.player.invincible,.45);assert.ok(g.player.dash>0);
});

test('Shield remains active for three seconds and only counters once',()=>{
castTarget('shield');g.skill();assert.equal(g.player.shield,3);g.update(.02);assert.ok(Math.abs(g.player.shield-2.98)<1e-8);g.player.invincible=0;g.hitPlayer(10);assert.equal(g.player.shield,0);assert.equal(g.player.hp,100);
});

test('A shield counter retains its casting level after changing skills',()=>{
const enemy=castTarget('shield');enemy.x=g.player.x+90;enemy.y=g.player.y;g.skill();enemy.hp=1000;g.state.levels.fire=2;g.openBuild();choice('shadow','fire').onclick();el('build-close').onclick();g.player.invincible=0;g.hitPlayer(10);assert.equal(g.player.shield,0);assert.ok(Math.abs((1000-enemy.hp)-40)<1e-8);assert.equal(g.player.hp,100);assert.equal(enemy.burn,0);assert.equal(g.player.shieldCast,null);
});

test('Burn and bleed consume only their actual remaining duration on the final frame',()=>{
 const enemy=castTarget('archer');enemy.burn=.005;enemy.bleed=.004;g.update(.02);assert.ok(Math.abs((1000-enemy.hp)-(9*.005+7*.004))<1e-8);assert.equal(enemy.burn,0);assert.equal(enemy.bleed,0);
});
test('Projectile wall collision sweeps the traveled segment and includes projectile radius',()=>{
 expedition();assert.equal(g.projectileBlocked({previousX:2680,previousY:1019,x:3050,y:1019,r:4}),true);
 assert.equal(g.projectileBlocked({previousX:2750,previousY:995,x:2850,y:995,r:6}),true);
 assert.equal(g.projectileBlocked({previousX:2750,previousY:995,x:2850,y:995,r:4}),false);
 assert.equal(g.projectileBlocked({previousX:1200,previousY:1200,x:1420,y:1200,r:4}),false);
 g.startPractice();assert.equal(g.projectileBlocked({previousX:2680,previousY:1019,x:3050,y:1019,r:4}),false);
});
test('Hazard drawing uses the same circular boundary as damage in every hazard type',()=>{
 const original=context2d.arc,arcs=[];context2d.arc=(...args)=>arcs.push(args);
 try{for(const flags of [{},{purple:true},{poison:true},{friendly:true}]){arcs.length=0;g.drawHazard({x:70,y:90,r:88,life:1,color:'#ffffff',...flags});assert.ok(arcs.length>0);assert.deepEqual(arcs[0].slice(0,3),[70,90,88]);assert.ok(arcs.every(arc=>arc[2]<=88));}
  arcs.length=0;g.drawHazard({x:70,y:90,r:88,life:0,color:'#ffffff'});assert.equal(arcs.length,0);
 }finally{context2d.arc=original;}
});
const view=window.cameraTest;
test('View range changes visible radius continuously without changing combat state',()=>{
 expedition();view.setViewRange(100);g.updateCamera(0,true);const baseline=g.camera,stats=JSON.stringify([g.player,g.state.slots,g.state.skillCd,g.state.corruption]),speed=g.worldMoveSpeed();
 for(const percent of [50,73,137,200]){view.setViewRange(percent);g.updateCamera(0,true);assert.ok(Math.abs(g.camera.w/baseline.w-percent/100)<1e-9);assert.ok(Math.abs(g.camera.h/baseline.h-percent/100)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).x-.5)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).y-.5)<1e-9);assert.equal(view.range,percent);}
 assert.equal(JSON.stringify([g.player,g.state.slots,g.state.skillCd,g.state.corruption]),stats);assert.equal(g.worldMoveSpeed(),speed);view.setViewRange(100);
});
test('Zoom interpolates smoothly and a stationary pointer remains aimed at its screen position',()=>{
 expedition();view.setViewRange(50);g.updateCamera(0,true);g.mousePosition({clientX:900,clientY:195});view.setViewRange(200);
 let previous=g.camera.w;for(let i=0;i<80;i++){g.updateCamera(.02);assert.ok(g.camera.w>=previous);previous=g.camera.w;const p=g.pointOnScreen(g.mouse);assert.ok(Math.abs(p.x-.75)<1e-9);assert.ok(Math.abs(p.y-.25)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).x-.5)<1e-9);}
 assert.equal(g.camera.range,2);view.setViewRange(100);
});
test('Every corner clips ground and map rectangles while preserving a centred hunter',()=>{
 expedition();const original=context2d.drawImage,calls=[];context2d.drawImage=(...args)=>calls.push(args);
 try{for(const percent of [50,200])for(const [x,y] of [[28,28],[3572,28],[28,2372],[3572,2372]]){
  view.setViewRange(percent);g.player.x=x;g.player.y=y;g.updateCamera(0,true);calls.length=0;g.draw();const r=view.cameraWorldRect();assert.ok(r.x>=0&&r.y>=0&&r.w>0&&r.h>0);assert.ok(r.x+r.w<=3600&&r.y+r.h<=2400);assert.deepEqual(calls[0].slice(1),[r.x,r.y,r.w,r.h,r.x,r.y,r.w,r.h]);assert.match(view.worldMapSvg(),new RegExp(`rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"`));assert.ok(Math.abs(g.pointOnScreen(g.player).x-.5)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).y-.5)<1e-9);
 }}finally{context2d.drawImage=original;view.setViewRange(100);}
});
test('Resize and movement preserve camera aspect ratio and hunter centre in the rendered frame',()=>{
 expedition();const canvas=el('game'),size=[canvas.clientWidth,canvas.clientHeight];
 try{for(const [w,h] of [[360,650],[1440,900],[3200,600]]){canvas.clientWidth=w;canvas.clientHeight=h;view.setViewRange(200);g.updateCamera(0,true);g.player.x+=20;g.player.y-=10;g.draw();assert.ok(Math.abs(g.camera.w/g.camera.h-w/h)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).x-.5)<1e-9);assert.ok(Math.abs(g.pointOnScreen(g.player).y-.5)<1e-9);}}
 finally{[canvas.clientWidth,canvas.clientHeight]=size;view.setViewRange(100);}
});
test('Zoomed ranged attacks still travel towards the on-screen aim point',()=>{
 for(const percent of [50,137,200]){expedition();view.setViewRange(percent);g.updateCamera(0,true);g.mousePosition({clientX:900,clientY:390});g.state.weapon='bow';g.basicAttack();assert.ok(g.projectiles.length);assert.ok(g.projectiles[0].vx>0);assert.ok(Math.abs(g.projectiles[0].vy)<1e-9);}
 view.setViewRange(100);
});
test('Wheel zoom is scoped to live world play and preserves browser modifiers and panel scrolling',()=>{
 expedition();view.setViewRange(100);const wheel=el('game').listeners.wheel;
 const event=(extra={})=>({deltaY:120,deltaMode:0,clientX:600,clientY:390,preventDefault(){this.prevented=true;},...extra});
 let e=event();wheel(e);assert.ok(e.prevented);assert.ok(view.range>100);e=event({deltaY:-120});wheel(e);assert.ok(view.range<120);
 for(const modifier of ['ctrlKey','metaKey','altKey']){e=event({[modifier]:true});const old=view.range;wheel(e);assert.equal(view.range,old);assert.ok(!e.prevented);}
 g.pause();e=event();const old=view.range;wheel(e);assert.equal(view.range,old);assert.ok(!e.prevented);g.closeModal();
 view.setViewRange(100);wheel(event({deltaY:3,deltaMode:1}));assert.ok(view.range>100);view.setViewRange(100);wheel(event({deltaY:1,deltaMode:2}));assert.ok(view.range>100);
 view.setViewRange(50);for(let i=0;i<20;i++)wheel(event({deltaY:1}));assert.ok(view.range>50);
 view.setViewRange(200);e=event();wheel(e);assert.equal(view.range,200);assert.ok(e.prevented);
 g.startPractice();view.setViewRange(100);e=event();wheel(e);assert.equal(view.range,100);assert.ok(!e.prevented);
});
test('Slider, keyboard, buttons and reset agree without triggering movement or attacks',()=>{
 expedition();view.setViewRange(100);g.keys.KeyW=true;g.mouse.down=true;el('view-range').listeners.focus();assert.equal(Object.keys(g.keys).length,0);assert.equal(g.mouse.down,false);
 el('view-range').listeners.input({target:{value:'137'}});assert.equal(view.range,137);assert.equal(el('view-value').textContent,'137%');
 const arrow=keyEvent('keydown','ArrowRight',{target:{tagName:'INPUT'}});assert.ok(!arrow.defaultPrevented);assert.ok(!g.keys.ArrowRight);
 const space=keyEvent('keydown','Space',{target:{tagName:'BUTTON',closest:selector=>selector==='.view-controls'}});assert.equal(space.defaultPrevented,false);assert.equal(g.state.dashCd,0);
 assert.ok(keyEvent('keydown','Equal').defaultPrevented);assert.equal(view.range,147);keyEvent('keydown','Minus',{repeat:true});assert.equal(view.range,137);el('view-far').onclick();assert.equal(view.range,147);el('view-near').onclick();assert.equal(view.range,137);
 keyEvent('keydown','Digit0');assert.equal(view.range,100);view.setViewRange(50);assert.equal(el('view-near').disabled,true);el('view-reset').onclick();assert.equal(view.range,100);
 view.setViewRange(200);assert.equal(el('view-far').disabled,true);g.pause();keyEvent('keydown','Minus');el('view-reset').onclick();assert.equal(view.range,200);view.setViewRange(100);
});
test('View preference survives new runs and camp loading independently of game progress',()=>{
 expedition();const camp=storage.get(window.HUNTER_EXPEDITION.key);view.setViewRange(163);assert.equal(view.readViewRange(),163);g.reset();g.enterWorld();assert.equal(view.range,163);assert.equal(g.camera.range,1.63);
 assert.equal(storage.get(window.HUNTER_EXPEDITION.key),camp);window.expeditionTest.resumeCamp();assert.equal(view.range,163);view.setViewRange(100);
});
test('Bad or inaccessible view preferences do not break camera control or overwrite the camp',()=>{
 expedition();const camp=storage.get(window.HUNTER_EXPEDITION.key),key=view.VIEW_RANGE.key;
 for(const value of ['bad','NaN','Infinity','0','49','201','',JSON.stringify({value:150})]){storage.set(key,value);assert.equal(view.readViewRange(),100);}
 storageFail=true;assert.equal(view.readViewRange(),100);view.setViewRange(177);assert.equal(view.range,177);g.updateCamera(0,true);g.draw();storageFail=false;
 assert.equal(storage.get(window.HUNTER_EXPEDITION.key),camp);view.setViewRange(NaN);assert.equal(view.range,177);view.setViewRange(-500);assert.equal(view.range,50);view.setViewRange(900);assert.equal(view.range,200);view.setViewRange(100);
});
test('Settings pause real gameplay, apply difficulty, and return safely to intro or pause',()=>{
 const r=window.releaseTest;g.reset();r.openSettings();assert.equal(g.state.phase,'settings');keyEvent('keydown','Escape');assert.equal(g.state.phase,'intro');keyEvent('keyup','Escape');
 start();g.player.invincible=0;r.updateReleaseSettings({difficulty:'story'});g.hitPlayer(20);assert.equal(g.player.hp,87);g.player.invincible=0;r.updateReleaseSettings({difficulty:'standard'});g.hitPlayer(20);assert.equal(g.player.hp,67);
 g.pause();r.openSettings();assert.equal(g.state.phase,'settings');const elapsed=g.state.time;tick(1);assert.equal(g.state.time,elapsed);el('settings-close').onclick();assert.equal(g.state.phase,'paused');el('resume').onclick();assert.equal(g.state.phase,'playing');
});
test('Release journal excludes practice and does not count assimilation as a Boss victory',()=>{
 const r=window.releaseTest;g.startPractice();r.endRun(true);assert.equal(window.HUNTER_RELEASE.journal().runs,0);
 start();r.endRun(true,'corrupt');assert.equal(window.HUNTER_RELEASE.journal().wins,0);assert.equal(window.HUNTER_RELEASE.journal().runs,1);r.endRun(true,'corrupt');assert.equal(window.HUNTER_RELEASE.journal().runs,1);
 start();g.state.time=240;r.endRun(true);assert.equal(window.HUNTER_RELEASE.journal().wins,1);assert.equal(window.HUNTER_RELEASE.journal().bestTime,240);assert.match(el('modal-card').innerHTML,/章节已完成/);
});
test('Art renders across every biome and journal panels do not change the camp checkpoint',()=>{
 const r=window.releaseTest;expedition();const saved=storage.get(window.HUNTER_EXPEDITION.key);
 for(const [x,y] of [[520,2010],[2020,520],[2140,1730],[3020,1690],[3070,370]]){g.player.x=x;g.player.y=y;g.updateCamera(0,true);g.draw();}
 g.pause();r.openRecords();assert.equal(g.state.phase,'records');el('records-close').onclick();assert.equal(g.state.phase,'paused');assert.equal(storage.get(window.HUNTER_EXPEDITION.key),saved);
 r.openCredits();assert.equal(g.state.phase,'credits');el('credits-close').onclick();assert.equal(g.state.phase,'paused');
});
test('Visual feedback follows real actions, refuses cooldown casts and resets safely',()=>{
 const fx=window.HUNTER_FEEDBACK;start();fx.clear();g.skill();assert.ok(fx.snapshot().some(e=>e.kind==='cast'));const count=fx.snapshot().length;g.skill();assert.equal(fx.snapshot().length,count);
 g.dash();assert.ok(fx.snapshot().some(e=>e.kind==='dash'));g.reset();assert.equal(fx.snapshot().length,0);
 start();g.player.invincible=0;g.hitPlayer(1);assert.ok(fx.snapshot().some(e=>e.kind==='hit'));
});
test('Acquisition has two choices and the picker has four icon cards with optional rules',()=>{
 start();const enemy=g.enemies.find(e=>e.type==='archer');g.expose(enemy);g.player.x=enemy.x;g.player.y=enemy.y;g.player.focus=100;g.keys.KeyE=true;g.updateCapture(.05);
 const html=el('modal-card').innerHTML;assert.match(html,/skill-icon/);assert.equal(el('modal-card').querySelectorAll('[data-equip]').length,1);assert.equal(el('modal-card').querySelectorAll('button').length,2);
 choice('equip',0).onclick();assert.ok(window.HUNTER_FEEDBACK.snapshot().some(e=>e.kind==='equip'));g.openBuild();assert.match(el('modal-card').innerHTML,/skill-grid/);assert.match(el('modal-card').innerHTML,/成长与施法规则/);assert.doesNotMatch(el('modal-card').innerHTML,/推荐组合|附魔|回响/);
});
test('All five campaigns finish through their actual mission handlers and AND-gated travel',()=>{
 const c=window.HUNTER_CAMPAIGN,x=window.campaignTest;g.reset();x.openAtlas('forge');assert.ok(el('atlas-travel').disabled);assert.equal(x.travelWorld('forge'),false);x.closeAtlas();
 x.openAtlas('forest');assert.ok(x.travelWorld('forest'));el('world-begin').onclick();
 for(const w of c.worlds){
  assert.equal(g.state.world.id,w.id);assert.ok(window.expeditionTest.canSaveCamp());assert.ok(g.enemies.every(e=>g.worldPositionFree(e.x,e.y,e.r)));g.draw();
  const originalVisit=g.state.world.visit;assert.ok(window.expeditionTest.saveCamp());assert.ok(window.expeditionTest.resumeCamp());assert.equal(g.state.world.visit,originalVisit);assert.equal(g.state.world.id,w.id);
  for(const site of x.map.sites.filter(s=>!['camp','boss'].includes(s.kind))){
   g.player.x=site.x;g.player.y=site.y;g.interactWorld();assert.equal(g.state.phase,'briefing');assert.equal(g.state.objective.kind,site.kind);el('mission-start').onclick();
   const o=g.state.objective;
   if(o.kind==='hunt'){for(const e of g.enemies.filter(e=>o.targets.includes(e.id)))g.gainKill(e);g.updateObjective(.02);}
   else if(o.nodes){
    if(o.kind==='sequence'){g.player.x=o.nodes[1].x;g.player.y=o.nodes[1].y;g.interactWorld();assert.equal(o.activated.length,0);}
    if(o.kind==='purify'){g.player.x=o.nodes[0].x;g.player.y=o.nodes[0].y;g.interactWorld();assert.equal(o.activated.length,0);for(const e of g.enemies.filter(e=>e.mission))g.gainKill(e);}
    for(const n of o.nodes){g.player.x=n.x;g.player.y=n.y;g.draw();g.interactWorld();}
   }else if(o.kind==='defend'){for(let wave=0;wave<4;wave++){for(const e of g.enemies.filter(e=>e.mission))g.gainKill(e);g.updateObjective(9);}}
   else{const target=g.enemies.find(e=>e.id===o.targetId);assert.ok(target);g.gainKill(target,o.kind==='capture');g.updateObjective(.02);}
   assert.equal(g.state.phase,'worldComplete');assert.ok(g.state.world.completed.has(site.id));assert.ok(Object.hasOwn(g.state.campaign.claims,originalVisit+':mission:'+site.id));continueWorld();
  }
  const boss=x.map.sites.find(s=>s.kind==='boss');g.player.x=boss.x;g.player.y=boss.y;g.interactWorld();const target=g.enemies.find(e=>e.boss);assert.equal(target.type,w.bossType);assert.equal(target.level,w.level+2);
  target.cd=0;g.updateEnemy(target,.02);if(w.id!=='forest')assert.ok([w.bossMove,'slam'].includes(target.attack));g.gainKill(target);g.updateWorld(.02);assert.equal(g.state.phase,'worldVictory');assert.ok(g.state.campaign.cleared.includes(w.id));assert.ok(g.state.campaign.inventory[w.loot[3]]>0);
  const inventory=JSON.stringify(g.state.campaign.inventory);x.completeCampaignWorld();assert.equal(JSON.stringify(g.state.campaign.inventory),inventory,'No double victory reward');
  if(w.id==='forge')assert.ok(!c.unlocked(g.state.campaign,'ruins'),'Both branch worlds are required');
  const next=c.worlds[w.number];if(next){x.openAtlas(next.id);assert.ok(!el('atlas-travel').disabled);assert.ok(x.travelWorld(next.id));el('world-begin').onclick();assert.equal(g.state.world.completed.size,0);assert.equal(g.state.journey.perks.length,0);}
 }
 assert.equal(g.state.campaign.cleared.length,5);x.openAtlas('forge');assert.ok(x.travelWorld('forge'));el('world-begin').onclick();assert.equal(g.state.world.id,'forge');assert.equal(g.state.world.completed.size,0);assert.ok(Object.keys(g.state.campaign.inventory).length>=5);
 g.reset();assert.equal(g.state.campaign.cleared.length,5);assert.equal(g.state.phase,'intro');
});
test('Saved enemy drops and retried mission guards cannot duplicate inventory rewards',()=>{
 expedition();const x=window.expeditionTest,c=window.HUNTER_CAMPAIGN;
 const enemy=g.enemies.find(e=>!e.scout),id=enemy.id,visit=g.state.world.visit;g.gainKill(enemy);const first=JSON.stringify(g.state.campaign.inventory);assert.ok(Object.hasOwn(g.state.campaign.claims,visit+':enemy:'+id));
 x.resumeCamp();assert.ok(g.enemies.some(e=>e.id===id&&!e.dead));g.gainKill(g.enemies.find(e=>e.id===id));assert.equal(JSON.stringify(g.state.campaign.inventory),first);
 const s=window.campaignTest.map.sites.find(s=>s.kind==='defend');g.player.x=s.x;g.player.y=s.y;g.interactWorld();el('mission-start').onclick();for(const e of g.enemies.filter(e=>e.mission))g.gainKill(e);const inventory=JSON.stringify(g.state.campaign.inventory);g.state.objective.lantern.hp=0;g.updateObjective(.1);el('mission-retry').onclick();el('mission-start').onclick();for(const e of g.enemies.filter(e=>e.mission))g.gainKill(e);assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);
 assert.ok(c.valid(g.state.campaign));
});
test('Inventory effects, camp persistence, atlas pause and locked travel work together',()=>{
 expedition();const x=window.campaignTest;g.state.campaign.inventory={leaf:2,fang:1,heart:1,tideglass:1,compass:1,crown:1};g.player.hp=40;window.expeditionTest.openCamp();x.openInventory('camp');assert.ok(x.useCampaignItem('leaf'));assert.equal(g.player.hp,62);assert.equal(g.state.campaign.inventory.leaf,1);assert.ok(x.useCampaignItem('fang'));assert.equal(x.journeyMods().attack,1.1);assert.ok(x.useCampaignItem('heart'));assert.equal(x.journeyMods().attack,1);assert.equal(x.journeyMods().incoming,.9);assert.ok(x.useCampaignItem('tideglass'));assert.equal(x.journeyMods().heal,10);assert.ok(x.useCampaignItem('compass'));assert.equal(x.journeyMods().dash,.85);assert.ok(x.useCampaignItem('crown'));assert.equal(x.journeyMods().skill,1.15);
 el('inventory-close').onclick();assert.equal(g.state.phase,'camp');assert.ok(window.expeditionTest.resumeCamp());assert.equal(g.player.hp,62);assert.equal(g.state.campaign.inventory.leaf,1);assert.equal(g.state.campaign.equipped,'crown');
 g.player.x=800;g.player.y=1300;x.openAtlas('forest');assert.ok(el('atlas-travel').disabled);const time=g.state.time;g.update(10);assert.equal(g.state.time,time);keyEvent('keydown','Escape');assert.equal(g.state.phase,'playing');assert.equal(g.player.x,800);
 g.startPractice();assert.equal(x.journeyMods().skill,1);g.beginTutorial();assert.equal(x.journeyMods().skill,1);
});
test('Campaign missing storage, new camp metadata and forged world ids fail safely',()=>{
 expedition();const ex=window.HUNTER_EXPEDITION,save=JSON.parse(storage.get(ex.key));assert.equal(save.world.worldId,'forest');assert.ok(save.world.visit);save.world.worldId='missing';assert.ok(!ex.valid(save));save.world.worldId='forge';save.world.visit='<script>';assert.ok(!ex.valid(save));
 storageFail=true;const x=window.campaignTest;g.state.campaign.inventory.fang=1;window.expeditionTest.openCamp();x.openInventory('camp');assert.ok(x.useCampaignItem('fang'));assert.equal(x.journeyMods().attack,1.1);g.reset();assert.equal(g.state.campaign.equipped,'fang');storageFail=false;
});
test('The fire cast that awakens nightmare still emits its visual when cooldown resets',()=>{
 start();g.state.slots=['fire'];g.state.corruption=92;const fx=window.HUNTER_FEEDBACK;fx.clear();g.skill();
 assert.ok(g.state.nightmare>0);assert.equal(g.state.skillCd,0);assert.equal(fx.snapshot().filter(e=>e.kind==='cast').length,1);
 g.draw();
});
test('Settlement reports blocked storage and can retry durable saving without awarding loot again',()=>{
 expedition();const initial=storage.get(ex.key),item=x.expeditionReward('recall-test:save-retry','mission');g.state.owned.add('archer');
 const inventory=JSON.stringify(g.state.campaign.inventory);storageFail=true;g.startRecall();tick(3.1);
 assert.equal(g.state.phase,'settlement');assert.equal(g.state.settlement.campSaved,false);assert.equal(g.state.settlement.profileSaved,false);assert.match(el('modal-card').innerHTML,/暂存/);
 assert.equal(storage.get(ex.key),initial);storageFail=false;x.saveSettlement();
 assert.equal(g.state.settlement.campSaved,true);assert.equal(g.state.settlement.profileSaved,true);assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);assert.ok(g.state.settlement.items[item]>0);
 assert.notEqual(storage.get(ex.key),initial);x.closeSettlement();assert.equal(g.state.phase,'intro');assert.ok(x.resumeCamp());assert.ok(g.state.owned.has('archer'));assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);
});
test('Closing a failed settlement keeps a resumable in-page camp newer than persistent storage',()=>{
 expedition();const initial=storage.get(ex.key);g.showReward('archer');el('keep-skill').onclick();g.state.journey.perks.push('keen');
 const item=x.expeditionReward('recall-test:memory','mission'),inventory=JSON.stringify(g.state.campaign.inventory);storageFail=true;g.startRecall();tick(3.1);
 assert.equal(g.state.phase,'settlement');assert.equal(g.state.settlement.campSaved,false);assert.ok(g.state.settlement.items[item]>0);el('settlement-x').onclick();
 assert.equal(g.state.phase,'intro');assert.ok(!el('continue-run').classList.contains('hidden'));assert.match(el('save-note').textContent,/本页|暂存/);assert.equal(storage.get(ex.key),initial);
 storageFail=false;assert.ok(x.resumeCamp());assert.ok(g.state.owned.has('archer'));assert.ok(g.state.journey.perks.includes('keen'));assert.equal(JSON.stringify(g.state.campaign.inventory),inventory);assert.equal(g.player.x,520);assert.equal(g.player.y,2010);
 assert.equal(g.state.adventure.elapsed,0);assert.equal(Object.keys(g.state.adventure.items).length,0);assert.ok(x.saveCamp());
});
if(fs.existsSync(require('node:path').join(__dirname,'../release/影子猎手-直接玩.html'))){
 test('Portable single HTML boots from inline scripts with no external loader',()=>{
  const portableWindow={devicePixelRatio:1,addEventListener:noop};
  const portable={window:portableWindow,document,localStorage,requestAnimationFrame:noop,console,Math,setInterval:noop};
  const html=fs.readFileSync(require('node:path').join(__dirname,'../release/影子猎手-直接玩.html'),'utf8');
  const sourceHtml=fs.readFileSync(require('node:path').join(__dirname,'../dist/index.html'),'utf8');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,[...sourceHtml.matchAll(/<script src=/g)].length);
  for(const script of scripts)vm.runInNewContext(script[1],portable);
  assert.equal(portableWindow.shadowHunter.snapshot().phase,'intro');el('skip-intro').onclick();assert.equal(portableWindow.shadowHunter.snapshot().phase,'worldIntro');el('world-begin').onclick();
  assert.equal(portableWindow.shadowHunter.snapshot().phase,'playing');assert.ok(portableWindow.shadowHunter.snapshot().enemies.length>=30);assert.ok(portableWindow.HUNTER_AUDIO);assert.ok(portableWindow.HUNTER_ART);assert.ok(html.includes('data:image/png;base64,'));
  assert.ok(portableWindow.HUNTER_SCENE);assert.doesNotMatch(html,/<script[^>]+src=/);assert.doesNotMatch(html,/<link rel="stylesheet"/);
 });
}
console.log(`\n${passed} gameplay smoke scenarios passed.`);

