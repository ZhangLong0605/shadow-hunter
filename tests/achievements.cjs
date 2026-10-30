'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const store=new Map();let blocked=false;
const storage={getItem:k=>{if(blocked)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');store.set(k,v);}};
function boot(){const sandbox={window:{},localStorage:storage};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/release-data.js'),'utf8'),sandbox);return sandbox.window.HUNTER_RELEASE;}
store.set('shadow-hunter-journal-v1',JSON.stringify({achievements:['capture']}));let release=boot();assert.equal(release.achievements.length,26);assert.ok(release.journal().achievements.includes('capture'));
assert.ok(!release.observe({kills:100}).includes('firstkill'));assert.ok(release.observe({firstDefeat:1}).includes('firstkill'));store.set('shadow-hunter-journal-v1',JSON.stringify({achievements:['capture','firstkill'],progress:{firstDefeat:1}}));release=boot();assert.equal(release.observe({kills:9}).length,0);assert.equal(release.journal().progress.kills,9);
assert.ok(release.observe({kills:10}).includes('hunter10'));assert.equal(release.observe({kills:10}).length,0);release.observe({kills:2});assert.equal(release.journal().progress.kills,10);
assert.ok(release.observe({worlds:5,skillLevel:3}).includes('worlds5'));assert.ok(release.journal().achievements.includes('worlds3'));assert.ok(release.journal().achievements.includes('skillmax'));
release=boot();assert.ok(release.journal().achievements.includes('worlds5'));assert.equal(release.journal().progress.kills,10);
blocked=true;assert.ok(release.observe({items:10}).includes('collector10'));assert.ok(release.journal().achievements.includes('collector10'));assert.equal(release.journalStorageOK,false);
blocked=false;release.observe({});assert.ok(boot().journal().achievements.includes('collector10'));
release.observe({kills:-100,items:NaN,worlds:Infinity});assert.equal(release.journal().progress.kills,10);
console.log('Achievements: 26 definitions, legacy migration, best progress, idempotent unlocks, reload persistence and blocked-storage recovery passed.');
