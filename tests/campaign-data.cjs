const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const window={};for(const name of ['world-data.js','expedition-data.js','campaign-data.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist',name),'utf8'),{window,Math});
const c=window.HUNTER_CAMPAIGN,p=c.empty();
assert.equal(c.worlds.length,5);assert.equal(Object.keys(c.items).length,20);assert.ok(c.valid(p));
assert.ok(c.unlocked(p,'forest'));assert.ok(!c.unlocked(p,'forge'));assert.equal(c.complete(p,'ruins','invalid'),null);
c.complete(p,'forest','a');assert.ok(c.unlocked(p,'forge')&&c.unlocked(p,'tide'));assert.ok(!c.unlocked(p,'ruins'));c.complete(p,'forge','b');assert.ok(!c.unlocked(p,'ruins'));c.complete(p,'tide','c');assert.ok(c.unlocked(p,'ruins'));c.complete(p,'ruins','d');assert.ok(c.unlocked(p,'eclipse'));c.complete(p,'eclipse','e');assert.equal(p.cleared.length,5);
const before=JSON.stringify(p);assert.equal(c.complete(p,'forest','a'),null);assert.equal(JSON.stringify(p),before);assert.ok(c.valid(p));
for(const w of c.worlds){assert.ok(p.inventory[w.loot[3]]>=1);const found=new Set();for(const n of [0,.65,.8,.98])found.add(c.roll(w.id,'mission',()=>n));assert.equal(found.size,4);assert.equal(c.roll(w.id,'monster',()=>.9),null);for(const item of found)assert.equal(c.items[item].world,w.id);}
assert.equal(c.reward(p,'forest','test','mission',()=>0).item,'leaf');assert.ok(c.reward(p,'forest','test','mission',()=>.99).duplicate);
for(const bad of [{...p,cleared:['eclipse']},{...p,equipped:'nope'},{...p,inventory:{leaf:-1}},{...p,claims:{bad:'unknown'}}])assert.ok(!c.valid(bad));
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};assert.ok(c.save(storage,p));assert.equal(c.read(storage).cleared.length,5);const denying={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};assert.ok(!c.save(denying,p));assert.equal(c.read(denying).cleared.length,5);assert.ok(!c.storageOK);assert.ok(c.save(storage,p));
const stale=JSON.stringify(p);data.set(c.key,stale);c.read(storage);p.inventory.leaf=29;const full={getItem:storage.getItem,setItem(){throw Error('Quota full');}};assert.ok(!c.save(full,p));assert.equal(c.read(full).inventory.leaf,29,'Returning to title must not replace unsaved rewards with the last stale profile');assert.equal(data.get(c.key),stale);assert.ok(c.save(storage,c.read(full)));assert.equal(JSON.parse(data.get(c.key)).inventory.leaf,29);
// Grid flood fill through the real walls and scenery, from camp to every objective,
// cache and boss. Use four-neighbour moves so diagonal corner cutting cannot pass.
const layouts=new Set();
for(const w of c.worlds){const m=c.map(w.id),sc=m.create(),step=40,cols=m.width/step,rows=m.height/step;
 layouts.add(JSON.stringify(m.sites.map(s=>[s.x,s.y,s.kind])));
 function free(x,y){return x>=40&&x<m.width-40&&y>=40&&y<m.height-40&&!m.walls.some(r=>Math.hypot(x-Math.max(r.x,Math.min(x,r.x+r.w)),y-Math.max(r.y,Math.min(y,r.y+r.h)))<18)&&!sc.rocks.some(r=>Math.hypot(x-r.x,y-r.y)<r.r+18);}
 const start=[Math.round(m.sites[0].x/step),Math.round(m.sites[0].y/step)],queue=[start],seen=new Set([start.join(',')]);
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx<1||ny<1||nx>=cols||ny>=rows||seen.has(key)||!free(nx*step,ny*step))continue;seen.add(key);queue.push([nx,ny]);}}
 for(const s of [...m.sites,...(m.discoveries||window.HUNTER_EXPEDITION.discoveries)])assert.ok(queue.some(([x,y])=>Math.hypot(x*step-s.x,y*step-s.y)<90),w.id+': unreachable '+s.name);
 for(const s of m.sites.filter(s=>['sequence','survey','purify'].includes(s.kind)))for(const [dx,dy] of [[-220,-170],[230,-120],[0,230]])assert.ok(queue.some(([x,y])=>Math.hypot(x*step-s.x-dx,y*step-s.y-dy)<90),w.id+': unreachable interaction node');
 console.log('PASS reachable map, camp, caches and mission nodes: '+w.name);
}
assert.equal(layouts.size,5);
console.log('Campaign: AND unlocks, repeat rewards, distinct loot, persistence, denial and five connected maps passed.');
for(const w of c.worlds){
 const rewards=c.empty();
 for(const kind of ['monster','elite']){
  const token=w.id+':guaranteed:'+kind;
  assert.equal(c.reward(rewards,w.id,token,kind,()=>.99).item,w.loot[0]);
  const before=JSON.stringify(rewards.inventory);
  assert.ok(c.reward(rewards,w.id,token,kind,()=>0).duplicate);
  assert.equal(JSON.stringify(rewards.inventory),before);
 }
}
console.log('Kill loot: every world guarantees a basic supply on a failed bonus roll; repeated claims never duplicate it.');
