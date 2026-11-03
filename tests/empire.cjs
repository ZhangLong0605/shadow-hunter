'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const box={window:{}};vm.runInNewContext(fs.readFileSync('dist/empire.js','utf8'),box);const {create,step}=box.window.HUNTER_EMPIRE;
const tick=(s,t,input={})=>{for(let n=0;n<Math.ceil(t/.02);n++)step(s,.02,input);};
let s=create();tick(s,7.6);assert.equal(s.stage,'climb');assert.equal(s.height,0);assert.ok(Number.isFinite(s.x));
tick(s,2,{up:true});assert.ok(s.height>7);assert.ok(s.grip<100);const grip=s.grip;tick(s,1);assert.ok(s.grip>grip);
s.paused=true;const frozen=JSON.stringify(s);tick(s,4,{up:true,dash:true});assert.equal(JSON.stringify(s),frozen);s.paused=false;
s.objects=[];s.spawn=10;s.x=.5;s.height=40;s.grip=100;s.objects.push({kind:'ledge',x:.5,h:40,w:.2,hit:false});step(s,.02,{});assert.equal(s.hits,1);assert.equal(s.height,36);assert.equal(s.hp,84);assert.equal(s.grip,100);tick(s,.3);assert.equal(s.hits,1);
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=100;
tick(s,1,{dash:true,up:true});assert.equal(s.accelerating,true);assert.ok(Math.abs(s.height-18)<.001);assert.ok(s.grip>95&&s.grip<96);
const acceleratedHeight=s.height;tick(s,1,{up:true});assert.equal(s.accelerating,false);assert.ok(Math.abs(s.height-acceleratedHeight-7.5)<.001);
step(s,.02,{dash:true});assert.equal(s.accelerating,false,'space without upward input does not climb');
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=100;s.objects=[{kind:'vent',x:.5,h:0,w:.2,hit:false}];step(s,.02,{dash:true,up:true});assert.equal(s.hits,1,'acceleration must not bypass obstacles');

s=create();s.stage='climb';s.spawn=1000;tick(s,81);assert.ok(s.media&&s.police&&s.heli);assert.equal(s.height,0);
s.height=442.99;s.grip=100;step(s,.02,{up:true});assert.equal(s.stage,'summit');assert.equal(s.height,443);tick(s,4.1);assert.equal(s.stage,'summit','victory cinematic must play before results');tick(s,7);assert.equal(s.stage,'won');const done=JSON.stringify(s);tick(s,3,{up:true});assert.equal(JSON.stringify(s),done);
s=create();s.stage='climb';s.hp=16;s.hits=0;s.spawn=100;s.objects=[{kind:'net',x:.5,h:0,w:.2}];step(s,.02);assert.equal(s.stage,'failed');
console.log('Empire: intro transitions, finite input, climbing, grip recovery, pause, collision, hold-to-accelerate and release, escalation, summit and failure passed.');
// Random windows telegraph before activation, expire safely and never fill all lanes.
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=100;s.x=.5;s.height=40;s.windows=[{kind:'window',col:3,x:.5,h:40,w:.085,age:0,hit:false}];
tick(s,1.7);assert.equal(s.hits,0,'flashing warning must be harmless');tick(s,.2);assert.equal(s.hits,1,'lit window detects the climber');tick(s,2);assert.equal(s.hits,1,'one window cannot hit twice');
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=100;s.windows=[{kind:'window',col:3,x:.5,h:0,w:.085,age:7.29,hit:false}];step(s,.02);assert.equal(s.hits,0);assert.equal(s.windows.length,0,'expired window is safe');
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=0;step(s,.02,{},()=>.1);assert.equal(s.windows.length,2);assert.equal(new Set(s.windows.map(w=>w.col)).size,2);assert.ok(s.windows.every(w=>w.age===0&&w.h>s.height));
const pattern=s.windows.map(w=>w.col).join();s.windowSpawn=0;step(s,.02,{},()=>.8);assert.notEqual(s.windows.slice(2).map(w=>w.col).join(),pattern);
s.paused=true;const lights=JSON.stringify(s.windows);tick(s,3);assert.equal(JSON.stringify(s.windows),lights);
s=create();s.stage='climb';s.spawn=100;s.windowSpawn=100;s.x=.9;s.windows=[{kind:'window',x:.2,h:0,w:.085,age:2,hit:false}];step(s,.02);assert.equal(s.hits,0,'dark lanes remain safe');
console.log('Window lights: harmless warning, active detection, single hit, expiry, random lanes, safe route and pause passed.');

assert.equal(box.window.HUNTER_EMPIRE.flagMessage('  我要站上世界之巅  '),'我要站上世界之巅');
assert.equal([...box.window.HUNTER_EMPIRE.flagMessage('一二三四五六七八九十一二三四五')].length,12);
assert.equal(box.window.HUNTER_EMPIRE.flagMessage('\n  '),'此夜之后皆是黎明');
console.log('Custom flag: user wording, whitespace, control characters, default and length limits passed.');

s=create({hp:42,incoming:.5});s.stage='climb';s.spawn=100;s.windowSpawn=100;s.objects=[{kind:'net',x:.5,h:0,w:.2}];step(s,.02);assert.equal(s.hp,34,'damage reduction carries into climbing');const injured=s.hp;tick(s,3);assert.equal(s.hp,injured,'rest restores grip, not health');
s=create({hp:100});s.stage='climb';s.hits=8;s.spawn=100;s.windowSpawn=100;step(s,.02);assert.equal(s.stage,'climb','hit count is no longer a failure condition');
assert.equal(create({hp:0}).stage,'failed');
console.log('Climbing health: incoming health, damage reduction, no idle healing, health-based failure and removed hit limit passed.');
