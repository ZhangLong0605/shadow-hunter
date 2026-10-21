'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=new Map(),listeners={},scheduled=[],parameters=[],intervals=[];
let blocked=false;
const localStorage={getItem:key=>{if(blocked)throw Error('blocked');return data.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');data.set(key,value);}};
const parameter=()=>({value:0,setValueAtTime(value,time){assert.ok(Number.isFinite(value)&&Number.isFinite(time));parameters.push(value);},linearRampToValueAtTime(value){parameters.push(value);},exponentialRampToValueAtTime(value){assert.ok(value>0);parameters.push(value);},setTargetAtTime(value){assert.ok(Number.isFinite(value));parameters.push(value);}});
class AudioNode{constructor(){this.gain=parameter();this.frequency=parameter();}connect(){}disconnect(){}start(time){scheduled.push(time);}stop(){} }
class AudioContext{constructor(){this.currentTime=1;this.sampleRate=1000;this.state='suspended';this.destination={};}createGain(){return new AudioNode();}createOscillator(){return new AudioNode();}createConvolver(){return new AudioNode();}createDynamicsCompressor(){return new AudioNode();}createBuffer(channels,length){assert.ok(channels===2&&length>0);return {getChannelData:()=>new Float32Array(length)};}async resume(){this.state='running';}async suspend(){this.state='suspended';}}
const context={window:{AudioContext},document:{hidden:false,addEventListener:(name,fn)=>{listeners[name]=fn;}},localStorage,console,Float32Array,setInterval:fn=>{intervals.push(fn);return intervals.length;}};
vm.createContext(context);
for(const name of ['release-data.js','audio.js','art.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name),'utf8'),context);
const release=context.window.HUNTER_RELEASE,audio=context.window.HUNTER_AUDIO;
async function main(){
 assert.equal(release.settings.difficulty,'standard');assert.equal(release.incoming(),1);
 release.configure({difficulty:'story',music:150,effects:-12,brightness:500});assert.equal(release.incoming(),.65);assert.equal(release.settings.music,100);assert.equal(release.settings.effects,0);assert.equal(release.settings.brightness,130);
 release.configure({difficulty:'__proto__',music:NaN,effects:Infinity,brightness:'bad',sound:'yes'});assert.equal(release.settings.difficulty,'standard');assert.equal(release.settings.music,48);assert.equal(release.settings.sound,true);
 assert.equal(release.unlock('capture'),true);assert.equal(release.unlock('capture'),false);assert.equal(release.unlock('unknown'),false);
 release.record({ending:'assimilated',time:25,kills:2,captures:1});assert.equal(release.journal().wins,0);assert.ok(release.journal().achievements.includes('assimilated'));
 release.record({ending:'dawn',time:300,kills:10,captures:5});release.record({ending:'dawn',time:400,kills:10,captures:5});assert.equal(release.journal().bestTime,300);assert.equal(release.journal().wins,2);assert.equal(release.journal().runs,3);
 data.set('shadow-hunter-journal-v1',JSON.stringify({wins:-5,runs:'bad',bestTime:-1,achievements:['dawn','unknown','dawn']}));assert.equal(release.journal().wins,0);assert.equal(release.journal().bestTime,null);assert.equal(release.journal().achievements.length,1);
 const camp='shadow-hunter-camp-test';data.set(camp,'preserve');blocked=true;assert.equal(release.configure({music:21}),false);assert.equal(release.settings.music,21);assert.doesNotThrow(()=>release.record({ending:'fallen',time:5,kills:0,captures:0}));blocked=false;assert.equal(data.get(camp),'preserve');
 audio.configure({...release.defaults});assert.equal(await audio.unlock(),true);assert.equal(intervals.length,1);assert.ok(scheduled.length>0);await audio.unlock();assert.equal(intervals.length,1,'Repeated user clicks must not duplicate audio schedulers');
 for(const scene of ['camp','explore','combat','boss','victory','defeat']){audio.setScene(scene);assert.equal(audio.status().scene,scene);intervals[0]();}
 audio.configure({...release.defaults,sound:false});const before=scheduled.length;intervals[0]();audio.effect();assert.equal(scheduled.length,before,'Muted audio must not create new voices');
 audio.configure({...release.defaults,sound:true,music:0,effects:100});assert.equal(audio.status().musicVolume,0);assert.equal(audio.status().effectsVolume,1);audio.effect();assert.ok(scheduled.length>before);
 context.document.hidden=true;listeners.visibilitychange();const hiddenCount=scheduled.length;intervals[0]();assert.equal(scheduled.length,hiddenCount,'Hidden tabs must not schedule music');context.document.hidden=false;listeners.visibilitychange();await Promise.resolve();
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))assert.ok(fs.existsSync(path.join(__dirname,'../dist',match[1])),match[1]);
 assert.ok(fs.existsSync(path.join(__dirname,'../dist/assets/moonlit-forest.png')));assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 console.log('Release: settings validation, difficulty, journal, storage denial, scene music, mute, tab suspension and offline assets passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
