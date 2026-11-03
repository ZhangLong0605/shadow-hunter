'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};for(const name of ['q-map-data.js','q-adventure.js','world-data.js','expedition-data.js','campaign-data.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist',name),'utf8'),{window,Math});
const q=window.HUNTER_Q,m=window.HUNTER_Q_WORLD;
const free=(x,y,r=16)=>!m.walls.some(w=>Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r)&&!m.create().rocks.some(s=>Math.hypot(x-s.x,y-s.y)<r+s.r);
assert.ok(!free(1305,1000));assert.ok(free(1305,670));assert.ok(free(1305,1650));
for(const c of m.charms)assert.ok(free(c.x,c.y),c.name+' cannot be inside a hedge');
const fish=q.create(m.sites.find(s=>s.kind==='fish')),player={...fish.spots[0]};
q.interact(fish,player,()=>0);q.interact(fish,player);assert.equal(fish.count,0,'early cast must not catch');
q.interact(fish,player,()=>0);q.step(fish,3.4,{player});assert.equal(fish.cast,null,'missed bite resets');
for(const spot of fish.spots){Object.assign(player,spot);for(let i=0;i<2;i++){q.interact(fish,player,()=>0);q.step(fish,1.8,{player});q.interact(fish,player);}}
assert.equal(fish.count,6);q.interact(fish,player);assert.equal(fish.count,6,'cannot farm an emptied spot');
let completed=0;const rhythm=q.create(m.sites.find(s=>s.kind==='rhythm'));
q.step(rhythm,4,{player:{x:0,y:0},complete:()=>completed++});assert.equal(rhythm.count,0);
for(let i=0;i<600&&rhythm.count<6;i++){q.step(rhythm,.02,{player:rhythm.pads[rhythm.count],complete:()=>completed++});}
assert.equal(completed,1);assert.equal(rhythm.count,6);
const puzzle=q.create(m.sites.find(s=>s.kind==='puzzle'));
const before=JSON.stringify(puzzle.board);q.movePuzzle(puzzle,1,0);q.undo(puzzle);assert.equal(JSON.stringify(puzzle.board),before);
q.movePuzzle(puzzle,-1,0);assert.equal(puzzle.board.moves,0,'hedges block');
for(const [dx,dy] of [[1,0],[0,1],[0,1],[0,-1],[0,-1],[1,0],[0,1],[0,1],[0,-1],[0,-1],[1,0],[0,1],[0,1]])q.movePuzzle(puzzle,dx,dy);
assert.equal(puzzle.count,3);q.resetPuzzle(puzzle);assert.equal(puzzle.count,0);
// All authored activity objects lie in reachable open space.
for(const site of m.sites.filter(s=>q.types.includes(s.kind))){const o=q.create(site);for(const p of [...(o.sheep||[]),...(o.spots||[]),...(o.pads||[])])assert.ok(free(p.x,p.y,15),site.name+' blocked activity object');}
const profile=window.HUNTER_CAMPAIGN.empty('cloud');assert.ok(window.HUNTER_CAMPAIGN.unlocked(profile,'candy-town'));assert.ok(!window.HUNTER_CAMPAIGN.unlocked(profile,'eclipse'));assert.ok(window.HUNTER_CAMPAIGN.valid(profile));
// Rendering must handle a newly spawned Boss before its first AI tick.
const canvas=new Proxy({},{get:(o,k)=>o[k]||((...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'nonfinite '+k);}),set:(o,k,v)=>(o[k]=v,true)});
for(const kind of Object.keys(m.variants)){const e={qKind:kind,x:100,y:100,boss:kind==='nightmare',phase:1,facing:0,telegraph:1};const before=JSON.stringify(e);q.drawEnemy(canvas,e,0);assert.equal(JSON.stringify(e),before);}
console.log('QMap: bridge collision, unobstructed candy/activities, fishing early/late/per-spot limits, rhythm streak and solvable undoable puzzle passed.');
let activities=0;
for(const spec of window.HUNTER_Q_THEME.worlds){
 const map=window.HUNTER_Q_THEME.map(spec.id),scenery=map.create();
 const open=(x,y,r=24)=>x>=r+25&&y>=r+25&&x<=map.width-r-25&&y<=map.height-r-25&&!map.walls.some(w=>Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r)&&!scenery.rocks.some(v=>Math.hypot(x-v.x,y-v.y)<v.r+r);
 const relocate=(x,y,r=24)=>{if(open(x,y,r))return {x,y};for(let d=20;d<=500;d+=20)for(let i=0;i<32;i++){const a=i*Math.PI/16,n={x:x+Math.cos(a)*d,y:y+Math.sin(a)*d};if(open(n.x,n.y,r))return n;}throw Error('No free point');};
 assert.equal(map.regions.length,5);assert.equal(map.charms.length,5);
 for(const c of map.charms)assert.ok(open(c.x,c.y,15),spec.id+' blocked candy '+c.id);
 for(const site of map.sites.filter(s=>q.types.includes(s.kind))){
  activities++;const o=q.create(site,relocate);
  for(const n of [...o.sheep||[],...o.spots||[],...o.pads||[],...o.nodes||[],...o.chicks||[],...o.flags||[]])assert.ok(open(n.x,n.y,15),spec.id+' blocked activity '+site.id);
  if(['gather','dig','water'].includes(o.kind)){
   q.interact(o,{x:0,y:0});assert.equal(o.count,0);
   for(const n of o.nodes){q.interact(o,n);if(o.kind==='dig'){assert.ok(!n.done);q.interact(o,n);}}
   assert.ok(q.finished(o));const count=o.count;for(const n of o.nodes)q.interact(o,n);assert.equal(o.count,count,'finished objects cannot be farmed');
  }
  if(o.kind==='race'){
   q.step(o,.01,{player:site,move:()=>{}});q.step(o,30.1,{player:site,move:()=>{}});assert.ok(o.failed);assert.ok(!q.finished(o));
   q.interact(o,{x:0,y:0});assert.ok(o.failed);q.interact(o,site);assert.ok(!o.failed);assert.equal(o.count,0);
  }
 }
 if(!map.river.vertical){assert.ok(!open(1600,1285));assert.ok(open(700,1285));assert.ok(open(2900,1285));}
}
assert.equal(activities,67);
const c=window.HUNTER_CAMPAIGN,legacy=c.empty();delete legacy.theme;legacy.cleared=['forest','cloud'];legacy.clears={forest:1,cloud:1};legacy.inventory={fang:1,sodapearl:2};
const raw=JSON.stringify(legacy),data=new Map([[c.key,raw]]),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const migrated=c.read(storage);assert.ok(c.valid(migrated));assert.equal(migrated.inventory.fang,1);assert.equal(migrated.inventory.sodapearl,undefined);assert.equal(data.get(c.key+'-legacy-backup'),raw);assert.equal(c.read(storage,'cloud').cleared.length,0);
const expedition=window.HUNTER_EXPEDITION,oldCamp=JSON.stringify({world:{worldId:'cloud'}});data.set(expedition.key,oldCamp);assert.equal(expedition.read(storage).status,'legacy');assert.equal(data.get(expedition.key+'-legacy-backup'),oldCamp);
console.log('All 67 activity object placements, 25 candies, two river orientations, interaction limits, race retry and legacy backups passed.');
