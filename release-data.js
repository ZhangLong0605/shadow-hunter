/* Versioned preferences and lifetime journal; never overwrite camp progress. */
'use strict';
window.HUNTER_RELEASE = (() => {
  const settingsKey='shadow-hunter-settings-v1',journalKey='shadow-hunter-journal-v1';
  const defaults={sound:true,music:48,effects:65,brightness:108,shake:true,atmosphere:true,difficulty:'standard'};
  const modes={story:{name:'旅人',incoming:.65,description:'受到的伤害降低 35%，适合初次探索与课堂演示。'},standard:{name:'猎人',incoming:1,description:'原版战斗数值，观察预警、组合影子、管理补给。'}};
  const achievements=[['capture','夺影初识','第一次夺取敌人的影子'],['seal','守夜之约','取得第一枚主线印记'],['trinity','三印归一','收集三枚主线印记'],['dawn','黎明归来','击败月狼，完成森林章节'],['nightmare','与影同行','体验梦魇形态'],['assimilated','长梦的新主人','抵达同化结局']];
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const limit=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.round(Math.max(min,Math.min(max,value))):fallback;
  function normalize(input){const s=input&&typeof input==='object'?input:{};return {sound:typeof s.sound==='boolean'?s.sound:defaults.sound,music:limit(s.music,0,100,48),effects:limit(s.effects,0,100,65),brightness:limit(s.brightness,85,130,108),shake:typeof s.shake==='boolean'?s.shake:true,atmosphere:typeof s.atmosphere==='boolean'?s.atmosphere:true,difficulty:Object.hasOwn(modes,s.difficulty)?s.difficulty:'standard'};}
  let settings=normalize(read(settingsKey));
  function journal(){const raw=read(journalKey)||{};return {wins:limit(raw.wins,0,999999,0),runs:limit(raw.runs,0,999999,0),bestTime:typeof raw.bestTime==='number'&&Number.isFinite(raw.bestTime)&&raw.bestTime>0?raw.bestTime:null,achievements:Array.isArray(raw.achievements)?[...new Set(raw.achievements.filter(id=>achievements.some(a=>a[0]===id)))]:[],last:raw.last&&typeof raw.last==='object'?{ending:['dawn','assimilated','fallen'].includes(raw.last.ending)?raw.last.ending:'fallen',time:limit(raw.last.time,0,999999,0),kills:limit(raw.last.kills,0,999999,0),captures:limit(raw.last.captures,0,999999,0)}:null};}
  function unlock(id){if(!achievements.some(a=>a[0]===id))return false;const data=journal();if(data.achievements.includes(id))return false;data.achievements.push(id);write(journalKey,data);return true;}
  function record(result){const data=journal();data.runs++;if(result.ending==='dawn'){data.wins++;if(!data.bestTime||result.time<data.bestTime)data.bestTime=result.time;}data.last={ending:result.ending,time:result.time,kills:result.kills,captures:result.captures};write(journalKey,data);unlock(result.ending==='dawn'?'dawn':result.ending==='assimilated'?'assimilated':'');return journal();}
  function configure(patch){settings=normalize({...settings,...patch});return write(settingsKey,settings);}
  return {defaults,modes,achievements,normalize,journal,unlock,record,configure,get settings(){return {...settings};},incoming:()=>modes[settings.difficulty].incoming};
})();
