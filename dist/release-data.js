/* Versioned preferences and lifetime journal; never overwrite camp progress. */
'use strict';
window.HUNTER_RELEASE = (() => {
  const settingsKey='shadow-hunter-settings-v1',journalKey='shadow-hunter-journal-v1';
  const defaults={sound:true,music:48,effects:65,brightness:108,shake:true,atmosphere:true,difficulty:'standard'};
  const modes={story:{name:'旅人',incoming:.65,description:'受到的伤害降低 35%，适合初次探索与课堂演示。'},standard:{name:'猎人',incoming:1,description:'原版战斗数值，观察预警、组合影子、管理补给。'}};
  const achievements=[
 ['capture','夺影初识','第一次夺取敌人的影子','战斗','captures',1],
 ['seal','守夜之约','取得第一枚主线印记','探索','seals',1],
 ['trinity','三印归一','单次探索取得三枚主线印记','探索','seals',3],
 ['dawn','黎明归来','完成森林章节','旅途','forest',1],
 ['nightmare','与影同行','体验梦魇形态','成长','nightmare',1],
 ['assimilated','长梦的新主人','抵达同化结局','旅途','assimilated',1],
 ['firstkill','第一步，别怕','在正式冒险中第一次击败敌人','战斗','firstDefeat',1],
 ['hunter10','刚热完身','单次旅程击败 10 个敌人','战斗','kills',10],
 ['hunter50','今晚加个班','单次旅程击败 50 个敌人','战斗','kills',50],
 ['capture5','影子的回声','单次旅程夺影 5 次','战斗','captures',5],
 ['chain5','行云流水','达成 5 连猎','战斗','chain',5],
 ['skillmax','影技觉醒','任一影技达到 Lv.3','成长','skillLevel',3],
 ['allskills','四影同行','在一次旅程中掌握全部四种影技','成长','skills',4],
 ['explore5','踏遍荒野','探索同一世界的五种区域','探索','regions',5],
 ['discovery4','角落里肯定还有','单次探索领取四处宝藏','探索','discoveries',4],
 ['collector10','背包说它装不下了','行囊同时拥有 10 种物品','收集','items',10],
 ['relic3','配饰比武器还多','行囊同时拥有 3 种护符','收集','relics',3],
 ['return','灯火可亲','完成一次传送回城结算','旅途','returns',1],
 ['worlds3','跨境旅人','通关任意三个世界','旅途','worlds',3],
 ['worlds5','谁也不留下','通关全部五境，让归途灯重新亮起','旅途','mainWorlds',5],
 ['perfectdodge','你打的是残影','在敌方攻击预警中完成一次精准闪避','战斗','perfectdodge',1],
 ['shieldcounter','盾说不行','用护盾抵挡一次攻击并触发反击','战斗','shieldcounter',1],
 ['lastsip','先喝一口再逞强','生命不高于 15 时成功饮用月露','成长','lastsip',1],
 ['closecall','差一点就留在这里','生命不高于 10 时完成传送回城结算','旅途','closecall',1],
 ['shopping','不是来进货的','单次冒险带着至少 10 件战利品回城结算','收集','shopping',1],
 ['fullchest','来都来了','生命与专注全满时仍领取恢复这两项的补给箱','探索','fullchest',1]

 ];
 const achievementFlavors={firstkill:'刚才手有点抖。但你已经迈过去了。',capture:'借你的影子用一下，很快……算了，不还了。',seal:'有人守灯，有人认路。今晚，轮到你了。',trinity:'三枚印记凑齐了，月狼也该起床了。',dawn:'不是所有故事，都要以永夜收场。',nightmare:'刚才那个气场很强的家伙，真的是我？',assimilated:'寻找归路的人，成了长梦的一部分。',hunter10:'手感来了，晚饭再等等。',hunter50:'月亮都快下班了，你还在猎场。',capture5:'影子越来越多，朋友可不能越来越少。',chain5:'这段操作，应该有人替我记下来。',skillmax:'不是你追上了影子，是影子开始回应你。',allskills:'今天想用哪一招？答案是：都可以。',explore5:'地图不是装饰，是我的散步路线。',discovery4:'没有白走的岔路，只有还没开的箱子。',collector10:'“再捡最后一件。”你已经说过十次了。',relic3:'战斗可以朴素，穿搭不能将就。',return:'不是撤退，是灯下还有人等我。',worlds3:'鞋底走薄了，故事走厚了。',worlds5:'这次，谁也不用留下。',perfectdodge:'你以为打中了，其实只是风路过。',shieldcounter:'你的攻击意见已收到，现原路退回。',lastsip:'刚才还嘴硬，现在瓶盖拧得比谁都快。',closecall:'先别问打赢没有，能回来就是赢。',shopping:'出门时说去探路，回来时像搬了家。',fullchest:'身体说不需要，手已经伸过去了。'};
 achievements.forEach(a=>a.push(achievementFlavors[a[0]]));
 const metricKeys=[...new Set(achievements.map(a=>a[4]))];
 let journalMemory=null,journalDirty=false,journalRaw=null,journalStorageOK=true;

  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const limit=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.round(Math.max(min,Math.min(max,value))):fallback;
  function normalize(input){const s=input&&typeof input==='object'?input:{};return {sound:typeof s.sound==='boolean'?s.sound:defaults.sound,music:limit(s.music,0,100,48),effects:limit(s.effects,0,100,65),brightness:limit(s.brightness,85,130,108),shake:typeof s.shake==='boolean'?s.shake:true,atmosphere:typeof s.atmosphere==='boolean'?s.atmosphere:true,difficulty:Object.hasOwn(modes,s.difficulty)?s.difficulty:'standard'};}
  let settings=normalize(read(settingsKey));
  function normalizeJournal(raw){raw=raw&&typeof raw==='object'?raw:{};return {wins:limit(raw.wins,0,999999,0),runs:limit(raw.runs,0,999999,0),bestTime:typeof raw.bestTime==='number'&&Number.isFinite(raw.bestTime)&&raw.bestTime>0?raw.bestTime:null,achievements:Array.isArray(raw.achievements)?[...new Set(raw.achievements.filter(id=>achievements.some(a=>a[0]===id)))]:[],progress:Object.fromEntries(metricKeys.map(k=>[k,limit(k==='mainWorlds'?(raw.progress?.mainWorlds??raw.progress?.worlds):raw.progress?.[k],0,999999,0)])),last:raw.last&&typeof raw.last==='object'?{ending:['dawn','assimilated','fallen'].includes(raw.last.ending)?raw.last.ending:'fallen',time:limit(raw.last.time,0,999999,0),kills:limit(raw.last.kills,0,999999,0),captures:limit(raw.last.captures,0,999999,0)}:null};}
  function journal(){
   try{const text=localStorage.getItem(journalKey);if(journalDirty&&text===journalRaw)return normalizeJournal(journalMemory);journalRaw=text;journalMemory=normalizeJournal(text?JSON.parse(text):null);journalDirty=false;journalStorageOK=true;}
   catch{journalStorageOK=false;if(!journalMemory)journalMemory=normalizeJournal(null);}
   return normalizeJournal(journalMemory);
  }
  function saveJournal(data){journalMemory=normalizeJournal(data);journalDirty=true;try{const text=JSON.stringify(journalMemory);localStorage.setItem(journalKey,text);journalRaw=text;journalDirty=false;journalStorageOK=true;return true;}catch{journalStorageOK=false;return false;}}
  function unlock(id){if(!achievements.some(a=>a[0]===id))return false;const data=journal();if(data.achievements.includes(id))return false;data.achievements.push(id);const a=achievements.find(a=>a[0]===id);data.progress[a[4]]=Math.max(data.progress[a[4]],a[5]);saveJournal(data);return true;}
  function observe(metrics){
   const data=journal(),fresh=[];let changed=false;
   for(const k of metricKeys){const n=limit(metrics[k],0,999999,0);if(n>data.progress[k]){data.progress[k]=n;changed=true;}}
   for(const [id,,,category,key,target] of achievements){if(!data.achievements.includes(id)&&data.progress[key]>=target){data.achievements.push(id);fresh.push(id);changed=true;}}
   if(changed||journalDirty)saveJournal(data);return fresh;
  }
  function record(result){const data=journal();data.runs++;if(result.ending==='dawn'){data.wins++;if(!data.bestTime||result.time<data.bestTime)data.bestTime=result.time;}data.last={ending:result.ending,time:result.time,kills:result.kills,captures:result.captures};saveJournal(data);unlock(result.ending==='dawn'&&result.forest!==false?'dawn':result.ending==='assimilated'?'assimilated':'');return journal();}
  function configure(patch){settings=normalize({...settings,...patch});return write(settingsKey,settings);}
  return {defaults,modes,achievements,normalize,journal,unlock,observe,record,configure,get journalStorageOK(){return journalStorageOK;},get settings(){return {...settings};},incoming:()=>modes[settings.difficulty].incoming};
})();
