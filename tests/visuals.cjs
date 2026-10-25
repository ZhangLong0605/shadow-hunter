'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),{inspect}=require('../tools/inspect-atlas.cjs');
const atlas=inspect(path.join(root,'dist/assets/hunter-directions.png'));
assert.equal(atlas.width,1774);assert.equal(atlas.height,887);assert.equal(atlas.frames.length,8);
assert.ok(atlas.transparentRatio>.3);assert.ok(atlas.frames.every(f=>f.bodyHeight>350&&f.pixels>10000));
const window={Image:class{constructor(){this.complete=true;this.naturalWidth=1774;}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'dist/art.js'),'utf8'),{window,Math});
for(let i=0;i<8;i++){assert.equal(window.HUNTER_ART.direction(i*Math.PI/4),i);assert.equal(window.HUNTER_ART.direction(i*Math.PI/4+Math.PI*2),i);}
assert.equal(window.HUNTER_ART.spriteStatus().ready,true);
const calls=[],transforms=[],noop=()=>{},context=new Proxy({drawImage:(...args)=>calls.push(args),transform:(...args)=>transforms.push(args)},{get:(o,k)=>k in o?o[k]:k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):noop,set:(o,k,v)=>(o[k]=v,true)});
for(let i=0;i<8;i++)window.HUNTER_ART.hunter(context,100,100,i*Math.PI/4,'#bbddcc',1.15,false,1,true,'blade',{slash:.1,charging:.3});
assert.ok(calls.length>8);assert.equal(new Set(calls.map(c=>c[1]+','+c[2])).size,8);assert.ok(transforms.every(t=>t.every(Number.isFinite)));
const art=window.HUNTER_ART,walk=art.createMotion(),fast=art.createMotion();
for(let i=0;i<60;i++)art.advanceMotion(walk,2,0,1/60);
for(let i=0;i<30;i++)art.advanceMotion(fast,4,0,1/30);
assert.ok(Math.abs(Math.atan2(Math.sin(walk.stridePhase-fast.stridePhase),Math.cos(walk.stridePhase-fast.stridePhase)))<1e-10,'Gait follows distance, independent of frame rate');
const phase=walk.stridePhase;
for(let i=0;i<60;i++)art.advanceMotion(walk,0,0,1/60);
assert.equal(walk.stridePhase,phase);assert.equal(walk.moveBlend,0,'Blocked or released movement settles to standing');
art.advanceMotion(walk,90,0,.1,{dash:true});assert.equal(walk.stridePhase,phase,'Dash is not a high-speed walk cycle');
for(const weapon of ['blade','bow','cast'])for(const charged of [false,true]){
 const m=art.createMotion();art.beginAttack(m,weapon,.5,charged);const duration=m.attackPoseTime;
 const poses=[];for(let step=0;step<=20;step++){const a=art.motionPose(0,false,.5,weapon,m);poses.push(a.upper);assert.ok(Object.values(a).every(v=>typeof v!=='number'||Number.isFinite(v)));art.advanceMotion(m,0,0,duration/20);}
 assert.ok(Math.max(...poses)-Math.min(...poses)>.15,'Attack articulates the arm');assert.ok(m.attackPoseTime<1e-10);
 assert.ok(Math.abs(art.motionPose(0,false,.5,weapon,m).upper)<.001,'Attack returns to neutral');
}
// Every direction and key strike pose must produce finite, non-degenerate texture transforms.
for(let facing=0;facing<8;facing++)for(const progress of [0,.18,.53,.72,1]){
 const m=art.createMotion();art.beginAttack(m,'blade',facing*Math.PI/4);m.attackPoseTime=m.attackPoseDuration*(1-progress);
 art.hunter(context,0,0,facing*Math.PI/4,'#bbddcc',1,false,0,false,'blade',m);
}
assert.ok(transforms.every(t=>t.every(Number.isFinite)));
vm.runInNewContext(fs.readFileSync(path.join(root,'dist/feedback.js'),'utf8'),{window,Math});
const fx=window.HUNTER_FEEDBACK,player=Object.freeze({x:600,y:390}),canvas={width:1200,height:780,clientWidth:1200,clientHeight:780,getContext:()=>context};
context.createRadialGradient=()=>({addColorStop:(_,color)=>assert.ok(color==='transparent'||/^#[a-f0-9]{6}([a-f0-9]{2})?$/i.test(color),'Valid gradient color: '+color)});
const view={dt:.02,screenPoint:p=>({x:p.x/1200,y:p.y/780}),player,phase:'pickup',capture:0,rich:true,dpr:1};
for(const colors of [['#b4dbc2'],[],undefined]){fx.emit('cast',{x:600,y:390,color:'#b4dbc2',colors});fx.render(canvas,view);fx.clear();}
for(const kind of ['attack','cast','dash','capture','equip','heal','boon','hit'])fx.emit(kind,{x:600,y:390,color:'#bcd5ac',colors:['#aaddcc','#eebb99','#bb99dd'],angle:.4});
assert.equal(fx.snapshot().length,8);for(let i=0;i<100;i++)fx.render(canvas,view);
assert.equal(fx.snapshot().length,0,'Effects expire while gameplay is paused for a reward');
for(let i=0;i<100;i++)fx.emit('cast',{x:600,y:390});assert.equal(fx.snapshot().length,18);
fx.render(canvas,{...view,phase:'intro'});assert.equal(fx.snapshot().length,0);
fx.emit('attack');fx.clear();assert.equal(fx.snapshot().length,0);
console.log('Visuals: transparent eight-direction atlas, render paths, bounded event pool, paused animation expiry and reset passed.');

// Check finite geometry at every supported zoom, bounded busy fights, and
// reduced effects. Rendering must never mutate gameplay or map objects.
let geometryCalls=0;
for(const name of ['moveTo','lineTo','translate','scale','rotate','arc','ellipse','fillRect','strokeRect','bezierCurveTo','quadraticCurveTo'])context[name]=(...args)=>{geometryCalls++;assert.ok(args.filter(v=>typeof v==='number').every(Number.isFinite),'Finite '+name);};
for(const rich of [true,false])for(const scale of [.5,1,2]){
 fx.clear();for(const skill of ['wolf','fire','shield','archer'])fx.emit('cast',{skill,x:600,y:390,tx:820,ty:440,angle:.3,color:'#e7b78a'});
 for(const kind of ['impact','break','vanish','hit','boon'])fx.emit(kind,{x:660,y:390,color:'#afe9d5',boss:true});
 fx.emit('attack',{x:600,y:390,angle:.4,charged:true,color:'#ffddaa'});
 for(let frame=0;frame<50;frame++)fx.render(canvas,{...view,rich,scale});
}
const countImpact=rich=>{fx.clear();fx.emit('impact',{x:600,y:390,color:'#cceedd'});geometryCalls=0;fx.render(canvas,{...view,rich});return geometryCalls;};
assert.ok(countImpact(false)<countImpact(true),'Reduced effects submit fewer primitives');
fx.clear();for(let i=0;i<80;i++)fx.emit('impact',{x:i*40,y:390});assert.ok(fx.snapshot().length<=6,'Dense hits cannot flood the event pool');
vm.runInNewContext(fs.readFileSync(path.join(root,'dist/scene-fx.js'),'utf8'),{window,Math});
const scene=window.HUNTER_SCENE,world={width:3600,height:2400,bridges:[670,1640],onPath:()=>false,walls:[],terrain:[{x:1300,y:500,rx:160,ry:70,kind:'embers'},{x:1500,y:700,rx:170,ry:65,kind:'mud'}],sites:[{x:520,y:2010,kind:'camp',color:'#bad4a0'}]},scenery={props:[{x:700,y:1900,size:35}],rocks:[{x:640,y:1880,r:24}]};
const frozenHero=Object.freeze({x:600,y:2010,shield:3,charging:.7,angle:.4}),before=JSON.stringify({world,scenery});
for(const id of ['forest','forge','tide','ruins','eclipse'])for(const rich of [true,false]){
 scene.bake(context,world,scenery,id);scene.rock(context,scenery.rocks[0],id);
 const v={world,camera:{x:100,y:1300,w:2400,h:1000},player:frozenHero,id,time:17,rich};scene.floor(context,v);scene.atmosphere(context,v);scene.aura(context,frozenHero,17,rich);
 scene.projectile(context,Object.freeze({x:600,y:400,vx:620,vy:0,life:1,color:'#e7b78a'}),rich);
}
assert.equal(JSON.stringify({world,scenery}),before,'Scenery rendering preserves map data');
console.log('Enhanced visuals: four skill shapes, finite zoomed geometry, impact budgets, reduced effects, five palettes and immutable scenery passed.');
