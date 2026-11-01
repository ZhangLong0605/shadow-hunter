'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),store=new Map(),draws=[];
let blocked=false;
class Image { set src(value){this.source=value;this.complete=true;this.naturalWidth=1024;this.naturalHeight=1024;} }
const localStorage={getItem:k=>{if(blocked)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');store.set(k,v);}};
const window={Image};
function load(){const sandbox={window,localStorage};for(const name of ['monster-data.js','monster-art.js'])vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),sandbox);return window.HUNTER_MONSTERS;}
let art=load();assert.equal(art.catalog.length,16);
const ctx=new Proxy({}, {get:(o,k)=>o[k]||((...args)=>{if(k==='drawImage')draws.push(args);}),set:(o,k,v)=>(o[k]=v,true)});
for(const entry of art.catalog){
 for(const style of ['standard','soft']){
  const source=art.source(entry.id,style);assert.ok(fs.existsSync(path.join(root,source)));
  const bytes=fs.readFileSync(path.join(root,source));assert.equal(bytes.readUInt32BE(16),1024);assert.equal(bytes[25],6,'RGBA artwork preserves transparency');
  art.apply({...art.preferences(),[entry.id]:style});
  const enemy={type:entry.type,variant:entry.variant,boss:!!entry.world,r:18,x:500,y:400,aggro:true,telegraph:1,patrol:.4};
  const before=JSON.stringify(enemy);assert.equal(art.entryFor(enemy,entry.world).id,entry.id);
  for(const animate of [true,false])for(const px of [200,800]){draws.length=0;assert.ok(art.draw(ctx,enemy,{x:px},12,entry.world,animate));assert.equal(draws[0][0].source,source);assert.ok(draws[0].slice(1).every(Number.isFinite));}
  assert.equal(JSON.stringify(enemy),before,'Drawing cannot alter combat entities');
 }
 art.apply({...art.preferences(),[entry.id]:'original'});draws.length=0;
 assert.equal(art.draw(ctx,{type:entry.type,variant:entry.variant,boss:!!entry.world},{x:0},0,entry.world),false);assert.equal(draws.length,0);
}
art.apply({'mob-wolf':'soft','boss-dusk-shadow-king':'original','unknown':'soft'});
art=load();assert.equal(art.preferences()['mob-wolf'],'soft');assert.equal(art.preferences()['boss-dusk-shadow-king'],'original');assert.equal(art.preferences()['mob-fire'],'standard');assert.equal(art.preferences().unknown,undefined);
store.set(art.key,'not json');assert.doesNotThrow(()=>{art=load();});assert.equal(art.preferences()['mob-wolf'],'standard');
store.set(art.key,JSON.stringify({'mob-wolf':'forged','__proto__':'soft'}));art=load();assert.equal(art.preferences()['mob-wolf'],'standard');
blocked=true;assert.equal(art.apply({'mob-wolf':'soft'}),false);assert.equal(art.preferences()['mob-wolf'],'soft');assert.doesNotThrow(load);
console.log('Monster artwork: 32 transparent assets, all mob/variant/Boss mappings, render isolation, original fallback, persistence, corrupt and blocked storage passed.');
