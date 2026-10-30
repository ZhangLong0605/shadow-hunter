'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const draws=[];
class ImageStub {
 set src(value){this.source=value;this.complete=/character-(sun|bull|orange|round|basket)/.test(value);this.naturalWidth=this.complete?900:0;this.naturalHeight=this.complete?1024:0;}
}
const ctx=new Proxy({}, {get:(o,k)=>o[k]||((...args)=>{if(k==='drawImage')draws.push(args);if(k==='createRadialGradient')return {addColorStop(){}};}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={window:{Image:ImageStub},Math,console};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/art.js'),'utf8'),sandbox);
const art=sandbox.window.HUNTER_ART;
for(const id of ['sun','bull','orange','round','basket']){
 draws.length=0;
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const motion={...art.createMotion(),appearance:id};
  art.beginAttack(motion,'blade',angle,false);art.advanceMotion(motion,2,1,.03,{});
  art.hunter(ctx,100,100,angle,'#fff',1.15,false,1,true,'blade',motion);
 }
 assert.equal(draws.length,4);assert.ok(draws.every(d=>d[0].source.includes('character-'+id)));
 assert.ok(draws.every(d=>d.slice(1).every(Number.isFinite)));
 draws.length=0;art.hunter(ctx,100,100,0,'#fff',1,true,0,false,'blade',{appearance:id});assert.equal(draws.length,0);
}
console.log('Appearance: all five companions render in every aim direction with finite geometry; enemies keep their own artwork.');
