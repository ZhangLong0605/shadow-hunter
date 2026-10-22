/* Shadow Hunter — dependency-free Canvas 2D playable vertical slice. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const W=1200,H=780,TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rand=(a,b)=>a+Math.random()*(b-a);
const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const icons={
 wolf:'<path d="m7 7 8 5 5-4 5 4 8-5-3 18-10 9L10 25Z"/><path d="m10 16 7 6-5 1m18-7-7 6 5 1m-11 5 3 3 3-3"/>',
 fire:'<path d="M22 4c3 11-8 10-3 18 3-2 6-5 5-8 14 10 8 21-4 21C7 35 4 25 12 17c-1 7 2 9 4 8C8 14 22 13 22 4Z"/>',
 shield:'<path d="M20 4 33 10v12c0 6-8 11-13 14-5-3-13-8-13-14V10Z"/><path d="M20 10v19m-8-15 8-4 8 4"/>',
 giant:'<path d="m11 7 9-3 9 3-2 9 7 6v10l-10 4-4-6-4 6-10-4V22l7-6Z"/><path d="m13 23 7-4 7 4m-10-12h6"/>',
 ghost:'<path d="M9 33V18C9 1 31 1 31 18v15l-6-4-5 5-5-5Z"/><path d="m14 17 2 4m10-4-2 4"/>',
 archer:'<path d="M11 4c23 8 23 24 0 32l8-16Z"/><path d="M5 20h30m-5-5 5 5-5 5"/>',
 mirror:'<path d="m20 3 13 17-13 17L7 20Z"/><path d="m20 10 8 10-8 10-8-10Zm0-7v7m0 20v7"/>',
 swarm:'<path d="m20 12 6 6-6 9-6-9Zm-9-7 5 6-5 7-5-7Zm18 0 5 6-5 7-5-7ZM9 26l5 4-5 6-5-6Zm22 0 5 4-5 6-5-6Z"/>'
};
const shadows={
 wolf:{name:'狼影',color:'#b4dbc2',tag:'野兽',hunt:'向前撕咬突进',dye:'伤口持续流血',echo:'击杀重置闪避',title:'撕影扑击'},
 fire:{name:'火焰影',color:'#eda874',tag:'元素',hunt:'释放扇形烈焰',dye:'命中附加燃烧',echo:'追加爆炸追击',title:'焚梦之息'},
 shield:{name:'盾兵影',color:'#95bad3',tag:'防御',hunt:'举盾反击震波',dye:'施法获得护盾',echo:'技能结束回血',title:'守夜壁垒'},
 giant:{name:'巨人影',color:'#cab889',tag:'重击',hunt:'大范围震地',dye:'重击削减影压',echo:'延迟再次震地',title:'碎梦震地'},
 ghost:{name:'幽灵影',color:'#9edce0',tag:'灵体',hunt:'幽灵穿行斩击',dye:'施法短暂无敌',echo:'追加穿透灵刃',title:'无形之刃'},
 archer:{name:'弓手影',color:'#c9d6a4',tag:'投射物',hunt:'三支穿透影箭',dye:'增加技能射程',echo:'追加三支追击箭',title:'穿月之矢'},
 mirror:{name:'镜魔影',color:'#b6a2db',tag:'幻象',hunt:'释放环形镜刃',dye:'分裂额外投射物',echo:'延迟重放技能',title:'破镜幻刃'},
 swarm:{name:'蜂群影',color:'#d9c990',tag:'召唤',hunt:'召唤追踪影蜂',dye:'命中诞生影蜂',echo:'追击受伤目标',title:'噬梦蜂群'}
};
const GUIDE=window.HUNTER_GUIDE, JOURNEY=window.HUNTER_JOURNEY;
const shadowIds=Object.keys(shadows),roles=['狩猎影','染色影','回响影'],rolekeys=['hunt','dye','echo'];
const briefEffects={wolf:['突进斩击','流血 3秒','刷新闪避'],fire:['扇形烈焰','燃烧 3秒','追击爆炸'],shield:['反击护盾','护盾 2秒','回复生命'],giant:['范围震地','额外破影','延迟震地'],ghost:['灵体穿行','短暂无敌','穿透灵刃'],archer:['三箭齐射','范围 +30%','追加影箭'],mirror:['环形镜刃','追加镜刃','复制施法'],swarm:['召唤影蜂','命中生蜂','追加影蜂']};
const slotLabels=['招式','附魔','回响'];
function brief(id,slot){return briefEffects[id]?.[slot]||GUIDE.shadows[id].short[slot];}
function uiGlyph(name){const paths={arrow:'M4 12h16m-6-6 6 6-6 6',flask:'M9 3h6m-5 0v6l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V3M8 15h8',home:'m3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7',star:'m12 2 3 6 7 4-7 3-3 7-3-7-7-3 7-4Z',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v6l4 2',seal:'m12 2 9 10-9 10-9-10Zm0 5v10m-4-5h8',box:'m3 7 9-4 9 4v12l-9 3-9-3Zm0 0 9 4 9-4m-9 4v11',check:'m4 12 5 5L20 6'};return `<svg class="ui-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;}
function icon(id){return `<span class="shadow-icon" style="--shadow-color:${shadows[id].color}"><svg viewBox="0 0 40 40" aria-hidden="true">${icons[id]}</svg></span>`;}
let seed=8317;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const trees=[],stones=[],grasses=[],stars=[];
for(let i=0;i<84;i++){const x=rng()*W,y=rng()*H;if(x<120||x>1080||y<115||y>710)trees.push({x,y,size:30+rng()*55,tone:rng()});}
for(let i=0;i<180;i++)grasses.push({x:rng()*W,y:rng()*H,s:3+rng()*10,t:rng()});
for(let i=0;i<66;i++)stones.push({x:rng()*W,y:rng()*H,r:2+rng()*8,rot:rng()*TAU});
for(let i=0;i<35;i++)stars.push({x:rng()*W,y:rng()*H,s:rng()*TAU});
const obstacles=[{x:320,y:250,r:32},{x:884,y:278,r:34},{x:278,y:567,r:30},{x:936,y:568,r:30}];
let state,player,enemies=[],effects=[],projectiles=[],minions=[],hazards=[],floating=[],keys={},mouse={x:760,y:350,down:false,held:0},last=0,clock=0,screenShake=0,toastTimer=0,modalReturn='intro',selectedSlot=0,soundOn=false,audioCtx;
let uiElapsed=0,runCount=0;
try{runCount=+(localStorage.getItem('shadow-hunter-runs')||0);}catch{}
function freshState(){return {campaign:CAMPAIGN.read(campStorage()),journey:JOURNEY.create(),pendingBoons:[],phase:'intro',world:null,mode:'hunt',practiceTarget:'dummy',objective:null,checkpoint:null,hitStop:0,room:0,roomType:'hunt',time:0,kills:0,captures:0,hits:0,corruption:0,nightmare:0,locked:false,skillCd:0,dashCd:0,attackCd:0,capture:0,captureTarget:null,clearTimer:0,bossWon:false,weapon:'blade',slots:['wolf','fire','mirror'],owned:new Set(['wolf','fire','mirror']),levels:Object.fromEntries(shadowIds.map(id=>[id,0])),xp:Object.fromEntries(shadowIds.map(id=>[id,0])),stored:null,modalType:null,muted:false,tutorial:null};}
function newPlayer(){return {x:660,y:450,r:15,hp:100,maxHp:100,focus:0,angle:-.5,invincible:0,dash:0,dx:0,dy:0,shield:0,slash:0,charging:0,...window.HUNTER_ART?.createMotion()};}
function reset(){state=freshState();player=newPlayer();enemies=[];effects=[];projectiles=[];minions=[];hazards=[];floating=[];keys={};mouse.down=false;screenShake=0;toastTimer=0;spawnEnemy('wolf',845,365);spawnEnemy('fire',810,585);spawnEnemy('archer',530,244);$('tutorial-card').classList.add('hidden');$('context-hint').classList.add('hidden');$('intro').classList.remove('hidden');$('modal').classList.add('hidden');$('boss-hud').classList.add('hidden');$('toast').classList.add('hidden');$('capture-hud').classList.add('hidden');$('room-name').textContent='遗忘林地';$('objective').textContent='穿过月光，追寻你的第一枚影子';$('room-tag').innerHTML='猎场 <span>01 / 05</span>';updateBuild();updateUI();refreshResume();}
function start(){requestAnimationFrame(()=>window.scrollTo(0,0));state.mode='hunt';state.tutorial=null;$('tutorial-card').classList.add('hidden');runCount++;try{localStorage.setItem('shadow-hunter-runs',String(runCount));}catch{}state.phase='playing';$('intro').classList.add('hidden');closeModal('playing');enterWorld();canvas.focus({preventScroll:true});}
function toast(text,seconds=3){$('toast').textContent=text;$('toast').classList.remove('hidden');toastTimer=seconds;}
function tone(freq=330,dur=.1,type='sine',volume=.05){if(window.HUNTER_AUDIO){window.HUNTER_AUDIO.effect(freq,dur,type,volume);return;}if(!soundOn)return;try{audioCtx ||=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq/2),audioCtx.currentTime+dur);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch{}}
function burst(x,y,color,count=12,speed=100){for(let i=0;i<count;i++){const a=rand(0,TAU),v=rand(speed*.2,speed);effects.push({kind:'particle',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.7),max:.7,color,r:rand(1,3)});}}
function ring(x,y,r,color,duration=.5){effects.push({kind:'ring',x,y,r,life:duration,max:duration,color});}
function textFloat(x,y,text,color='#e3edd2'){floating.push({x,y,text,color,life:1,max:1});}
function spawnEnemy(type,x,y,elite=false,boss=false){const hp=boss?1250:elite?160:({wolf:68,fire:60,shield:95,giant:125,ghost:55,archer:54,mirror:70,swarm:55}[type]);const e={id:Math.random().toString(36).slice(2),type,x,y,r:boss?42:elite?23:type==='giant'?24:16,hp,maxHp:hp,pressure:boss?190:elite?90:56,maxPressure:boss?190:elite?90:56,elite,boss,cd:boss?1.6:rand(1,2.5),telegraph:0,attack:null,target:null,exposed:0,dead:false,burn:0,bleed:0,hit:0,slow:0,phase:1,dash:0,dx:0,dy:0,trail:0};if(state?.world){e.level=campaignWorld().level+(boss?2:elite?1:0);const scale=1+(campaignWorld().level-1)*.09;e.hp=e.maxHp=Math.round(e.maxHp*scale);e.pressure=e.maxPressure=Math.round(e.maxPressure*(1+(campaignWorld().level-1)*.035));}enemies.push(e);return e;}
const roomNames=['遗忘林地','低语岔路','失落祭坛','无光深林','月狼之巢'];
function enterRoom(index,type){state.world=null;state.checkpoint=takeCheckpoint();state.objective=null;state.room=index;state.roomType=type;state.phase='playing';state.clearTimer=0;state.capture=0;state.captureTarget=null;enemies=[];projectiles=[];hazards=[];minions=[];effects=[];floating=[];keys={};mouse.down=false;$('capture-hud').classList.add('hidden');player.x=600;player.y=570;player.invincible=1.5;state.skillCd=0;state.dashCd=0;$('modal').classList.add('hidden');$('room-name').textContent=roomNames[index];$('room-tag').innerHTML=`${type==='elite'?'梦魇巢穴':type==='rift'?'梦境裂缝':index===4?'区域首领':'猎场'} <span>0${index+1} / 05</span>`;$('objective').textContent=index===4?'击破月狼，夺取它的影子，终结这场长梦':'击破梦魇 · 靠近白色影子，长按 E 夺取';$('boss-hud').classList.toggle('hidden',index!==4);
 if(['chase','defend','capture'].includes(type)){setupObjective(type);updateBuild();updateUI();showObjectiveBrief();return;}
 if(index===4){spawnEnemy('wolf',600,230,true,true);toast('饥饿月狼已苏醒 · 留意紫色不可闪避区域',4);}else{
 const configs=[['wolf','wolf','fire','archer'],['shield','giant','wolf','mirror','fire'],['ghost','archer','swarm','mirror','wolf'],['giant','shield','ghost','swarm','archer','fire']];
 configs[index].forEach((id,i)=>{const a=i/configs[index].length*TAU;spawnEnemy(id,600+Math.cos(a)*rand(230,380),365+Math.sin(a)*rand(150,200),(type==='elite'&&i<2)||(index===3&&i===0));});
 if(type==='rift')toast('梦境裂缝 · 影压减半，梦蚀增长翻倍',4);
 if(type==='rift')enemies.forEach(e=>e.pressure=e.maxPressure*=.5);
 }updateBuild();updateUI();}
function living(){return enemies.filter(e=>!e.dead&&!e.exposed);}
function nearest(x,y,range=Infinity,exclude=null){if(state.world&&range===Infinity)range=650;let found=null,best=range;for(const e of enemies){if(e.dead||e.exposed||e===exclude)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<best){found=e;best=d;}}return found;}
function gainKill(e,captured=false){if(e.dead)return;e.dead=true;if(e.scout&&captured&&state.world)state.world.trailCaptured=true;if(captured&&state.objective?.targetId===e.id)state.objective.captured=true;state.kills++;state.captures+=captured?1:0;if(state.world&&!e.boss)expeditionReward('enemy:'+e.id,e.elite?'elite':'monster');recordChain();for(const id of new Set(state.slots.filter(Boolean))){state.xp[id]++;const level=state.xp[id]>=18?2:state.xp[id]>=7?1:0;if(level>state.levels[id]){state.levels[id]=level;toast(`${shadows[id].name} · ${level===1?'饱食':'觉醒'}，力量提升`);}}if(state.slots[2]==='wolf'&&!state.locked)state.dashCd=0;if(!captured){player.hp=clamp(player.hp+(e.elite?8:3)*(state.corruption>=75?.5:1),0,100);player.focus=clamp(player.focus+8+journeyMods().focus,0,100);burst(e.x,e.y,'#c0d9a3');}if(e.boss){state.bossWon=true;ring(e.x,e.y,280,'#cebae4',1.5);screenShake=12;}updateBuild();}
function expose(e){if(e.exposed||e.dead)return;e.exposed=e.boss?8:7;state.hitStop=.055;e.telegraph=0;e.dash=0;ring(e.x,e.y,e.r+45,'#dcffe8',.6);textFloat(e.x,e.y-35,'影子暴露','#e0ffec');tone(620,.3,'sine');if(state.tutorial?.step===1){setTutorialStep(2);return;}if(e.scout)toast('斥候影子已暴露：停下攻击，靠近并长按 E 夺影，解锁补给箱',4);else if(state.room===0)toast('影子已暴露！靠近并长按 E 夺影，或攻击收割回血',3);}
function skillCast(){return Object.freeze({active:state.slots[0],level:state.levels[state.slots[0]],dye:state.slots[1],corruption:state.corruption,nightmare:state.nightmare>0,skillBonus:journeyMods().skill,attackBonus:journeyMods().attack,origin:Object.freeze({x:player.x,y:player.y})});}
function damageEnemy(e,amount,pressure=amount*.6,source='basic',cast=null){
 if(e.dead)return;
 if(state.tutorial?.step===4&&source==='skill')state.tutorial.skillHit=true;
 if(e.exposed){
  if(state.tutorial)return;
  if(e.scout){if(source==='basic')toast('斥候的影子正在等待你：靠近并长按 E，夺取后解锁补给箱',3);return;}
  if(state.objective?.kind==='capture'&&state.objective.targetId===e.id){if(source==='basic')toast('目标已破影，停下攻击，靠近并长按 E 夺取',2);return;}
  if(source==='basic'){gainKill(e);textFloat(e.x,e.y-20,'收割 +生命');}return;
 }
 const hit=cast||skillCast();let dmg=amount*(hit.nightmare?2:1)*(1+hit.corruption*.004);
 if(source==='skill'||source==='summon')dmg*=(1+hit.level*.22)*hit.skillBonus;
 else if(source==='basic')dmg*=hit.attackBonus;else if(source==='burn')dmg*=hit.skillBonus;
 if(e.type==='shield'&&source==='basic')dmg*=.7;
 if(e.variant==='sentinel'&&!e.telegraph&&Math.abs(Math.atan2(Math.sin(angle(e,hit.origin)-e.facing),Math.cos(angle(e,hit.origin)-e.facing)))<1.1){dmg*=.45;textFloat(e.x,e.y-48,'正面护甲','#abc8df');}
 if(state.world)e.aggro=true;e.hp-=dmg;e.pressure-=pressure;e.hit=.13;burst(e.x,e.y,shadows[e.type].color,5,80);
 textFloat(e.x+rand(-12,12),e.y-e.r-12,Math.round(dmg).toString(),source==='skill'?'#d3bbed':'#e2eacb');player.focus=clamp(player.focus+(source==='basic'?3:1),0,100);pressureBreak(e);
}
function pressureBreak(e){
 if(e.dead||e.exposed||e.hp>0&&e.pressure>0)return;
 if(e.boss&&e.hp>e.maxHp*.2){e.pressure=e.maxPressure;stunBoss(e);}else expose(e);
}
function stunBoss(e){e.telegraph=0;e.dash=0;e.target=null;e.attack=null;e.cueActive=false;e.cd=2.6;ring(e.x,e.y,80,'#d0ffe2');textFloat(e.x,e.y-70,'破影 · 打断','#caffe8');}

function hitPlayer(amount,purple=false){if(state.tutorial)return;if(state.phase!=='playing'||player.invincible>0&&!purple||state.nightmare>0)return;if(player.dash>0&&!purple){player.focus=clamp(player.focus+20,0,100);return;}if(player.shield>0){const cast=player.shieldCast||skillCast();player.shield=0;player.shieldCast=null;ring(player.x,player.y,155,'#abcddd');for(const e of living())if(distance(e,player)<170){damageEnemy(e,40,35,'skill',cast);applyDye(e,cast);}textFloat(player.x,player.y-40,'防御反击','#a7dbe7');tone(440,.2,'triangle');return;}if(state.mode==='practice')return;state.journey.streak=0;state.journey.streakTime=0;cancelRecall();player.hp-=amount*journeyMods().incoming;player.invincible=.85;state.hits++;state.capture=0;state.captureTarget=null;screenShake=8;burst(player.x,player.y,'#c78088',10);tone(110,.18,'sawtooth',.04);if(player.hp<=0){player.hp=0;if(state.objective?.status==='active')failObjective('你倒在了猎场。','留意攻击预警，用闪避避开红色区域。重试后可以换一套影子再挑战。');else endRun(false);} }
function moveEntity(entity,dx,dy){if(state.world){moveWorldEntity(entity,dx,dy);return;}entity.x=clamp(entity.x+dx,80,W-80);entity.y=clamp(entity.y+dy,120,H-100);for(const o of obstacles){const d=distance(entity,o),min=o.r+entity.r;if(d<min&&d>.01){entity.x=o.x+(entity.x-o.x)/d*min;entity.y=o.y+(entity.y-o.y)/d*min;}}}
function basicAttack(charged=false){if(state.tutorial?.step===0){toast('先用 WASD 走进练习圈，再学习攻击');return;}if(state.phase!=='playing'||state.attackCd>0||state.capture>0)return;cancelRecall();state.attackCd=charged?.52:.3;player.angle=angle(player,mouse);player.slash=.2;window.HUNTER_ART?.beginAttack(player,state.weapon,player.angle,charged);const dmg=charged?53:26,press=charged?40:19;
 if(state.weapon==='bow'){shoot(player.x,player.y,player.angle,charged?650:540,dmg*.8,shadows.archer.color,{pressure:press,life:1.4,pierce:charged});tone(510,.09,'triangle');}
 else{effects.push({kind:'slash',x:player.x,y:player.y,a:player.angle,r:charged?150:115,life:.2,max:.2,color:charged?'#d7e7b4':'#c9f3de'});for(const e of enemies){if(e.dead)continue;const d=distance(e,player),diff=Math.atan2(Math.sin(angle(player,e)-player.angle),Math.cos(angle(player,e)-player.angle));if(d<(charged?160:124)+e.r&&Math.abs(diff)<1.25)damageEnemy(e,dmg,press,'basic');}tone(charged?260:370,.1,'triangle');}
 if(charged)ring(player.x,player.y,45,'#d5e7b6',.3);
}
function dash(){if(state.phase!=='playing'||state.dashCd>0||state.capture>0)return;let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);if(!dx&&!dy){dx=Math.cos(player.angle);dy=Math.sin(player.angle);}const n=Math.hypot(dx,dy);player.dx=dx/n;player.dy=dy/n;cancelRecall();player.dash=.18;player.invincible=Math.max(player.invincible,.25);state.dashCd=1.5*journeyMods().dash;tone(210,.15,'triangle');for(const e of enemies){if(!e.dead&&!e.exposed&&e.telegraph>0&&distance(player,e.target||e)<e.r+130){player.focus=clamp(player.focus+22,0,100);e.pressure-=24;textFloat(player.x,player.y-40,'精准闪避','#caffea');pressureBreak(e);break;}}}
function shoot(x,y,a,speed,damage,color,opts={}){projectiles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,color,r:opts.enemy?6:4,life:opts.life??1.4,enemy:false,pierce:false,hit:new Set(),pressure:damage*.7,cast:opts.enemy?null:skillCast(),...opts});}
function spawnMinion(x,y,color,life=5,cast=skillCast()){minions.push({x,y,a:rand(0,TAU),life,cd:0,color,cast});}
function areaDamage(x,y,r,damage,pressure=damage*.7,source='skill',cast=skillCast()){for(const e of living())if(Math.hypot(e.x-x,e.y-y)<r+e.r){damageEnemy(e,damage,pressure,source,cast);if(source==='skill')applyDye(e,cast);}}
function applyDye(e,cast=null){
 if(e.dead)return;const hit=cast||skillCast(),dye=hit.dye;
 if(dye==='fire'){e.burn=Math.max(e.burn,3);e.burnCast=hit;}
 if(dye==='wolf'){e.bleed=3;e.bleedCast=hit;}
 if(dye==='giant'){e.pressure-=18;pressureBreak(e);}
 if(dye==='swarm'&&minions.length<16)spawnMinion(e.x,e.y,'#d4c58a',3,hit);
}

function executeSkill(id,a,echo=false,cast=skillCast()){const mult=echo?.58:1,col=shadows[cast.dye].color,range=cast.dye==='archer'?1.3:1,x=player.x,y=player.y;
 switch(id){
 case 'wolf':case 'ghost':{const length=(id==='ghost'?290:240)*range;const end=worldTravelEnd(x,y,clamp(x+Math.cos(a)*length,40,worldWidth()-40),clamp(y+Math.sin(a)*length,40,worldHeight()-40));const tx=end.x,ty=end.y;effects.push({kind:'beam',x,y,tx,ty,life:.4,max:.4,color:col,width:id==='ghost'?36:24});for(const e of living()){const vx=tx-x,vy=ty-y,t=clamp(((e.x-x)*vx+(e.y-y)*vy)/(vx*vx+vy*vy||1),0,1);if(Math.hypot(e.x-(x+vx*t),e.y-(y+vy*t))<65){damageEnemy(e,58*mult,48,'skill',cast);applyDye(e,cast);}}if(!echo){player.x=tx;player.y=ty;moveEntity(player,0,0);player.invincible=Math.max(player.invincible,.45);}if(cast.dye==='fire')for(let t=0;t<1;t+=.2)hazards.push({x:x+(tx-x)*t,y:y+(ty-y)*t,r:38,life:3,tick:0,friendly:true,color:col,cast});break;}
 case 'fire':effects.push({kind:'slash',x,y,a,r:230*range,life:.55,max:.55,color:col});for(const e of living()){const diff=Math.atan2(Math.sin(angle(player,e)-a),Math.cos(angle(player,e)-a));if(distance(player,e)<250*range&&Math.abs(diff)<1.1){damageEnemy(e,64*mult,36,'skill',cast);e.burn=4;e.burnCast=cast;applyDye(e,cast);}}break;
 case 'shield':player.shield=Math.max(player.shield,3);player.shieldCast=cast;ring(x,y,130*range,col,.7);areaDamage(x,y,145*range,42*mult,44,'skill',cast);if(cast.dye==='giant')areaDamage(x,y,200,28,30,'skill',cast);break;
 case 'giant':ring(x,y,215*range,col,.75);areaDamage(x,y,220*range,70*mult,62,'skill',cast);screenShake=8;break;
 case 'archer':for(let i=-1;i<=1;i++)shoot(x,y,a+i*.15,620,48*mult,col,{pierce:true,life:1.3*range,skill:true,cast});if(cast.dye==='mirror')for(let i of [-2,2])shoot(x,y,a+i*.15,620,30*mult,col,{pierce:true,skill:true,cast});break;
 case 'mirror':for(let i=0;i<8;i++)shoot(x,y,a+i*TAU/8,410,36*mult,col,{pierce:true,skill:true,cast,life:1.4*range});ring(x,y,60,col);break;
 case 'swarm':for(let i=0;i<(echo?3:6);i++)spawnMinion(x+rand(-40,40),y+rand(-40,40),col,7*range,cast);ring(x,y,85,col);break;
 }if(!echo){tone(id==='giant'?100:480,.3,'triangle',.08);player.slash=.3;window.HUNTER_ART?.beginAttack(player,'cast',a);}
}
function skill(){if(state.phase!=='playing')return;if(state.tutorial&&state.tutorial.step<4){toast('先完成当前教学，再试用组合技能');return;}if(state.skillCd>0){toast(`影技还在冷却，${state.skillCd.toFixed(1)} 秒后可再次释放`,1.5);return;}if(state.capture>0)return;cancelRecall();const id=state.slots[0];state.skillCd=state.nightmare>0?1.3:4.8-state.levels[id]*.4;player.angle=angle(player,mouse);const a=player.angle,cast=skillCast();executeSkill(id,a,false,cast);state.corruption=state.mode==='practice'?0:clamp(state.corruption+skillCorruptionCost(),0,100);const dye=state.slots[1];if(dye==='ghost')player.invincible=Math.max(player.invincible,1.4);if(dye==='shield'){player.shield=Math.max(player.shield,2);player.shieldCast=cast;}
 if(!state.locked){const echo=state.slots[2];if(echo==='mirror')effects.push({kind:'delayed',life:.55,action:()=>executeSkill(id,a,true,cast)});if(echo==='giant')effects.push({kind:'delayed',life:.8,action:()=>{ring(player.x,player.y,165,shadows.giant.color);areaDamage(player.x,player.y,170,38,35,'skill',cast);}});if(echo==='fire'){const target=nearest(player.x,player.y,360);if(target){ring(target.x,target.y,115,shadows.fire.color);areaDamage(target.x,target.y,115,30,16,'skill',cast);}}if(echo==='shield')player.hp=clamp(player.hp+5*(state.corruption>=75?.5:1),0,100);if(echo==='swarm')for(let i=0;i<3;i++)spawnMinion(player.x,player.y,shadows.swarm.color,4,cast);if(echo==='archer'||echo==='ghost'){const e=nearest(player.x,player.y,500);if(e)for(let i=-1;i<=1;i++)shoot(player.x,player.y,angle(player,e)+i*.12,530,22,shadows[echo].color,{skill:true,cast,pierce:echo==='ghost'});}}
 if(dye==='mirror'&&id!=='archer')for(const offset of [-.22,.22])shoot(player.x,player.y,a+offset,450,24,shadows.mirror.color,{skill:true,cast,pierce:true});
 if(dye==='swarm'&&id==='swarm')for(let i=0;i<3;i++)spawnMinion(player.x,player.y,shadows.swarm.color,3,cast);
 const evo=evolution();if(evo){ring(player.x,player.y,270,shadows[id].color,.8);areaDamage(player.x,player.y,280,45,40,'skill',cast);if(id==='ghost')player.invincible=2;}
 if(state.corruption>=100&&state.nightmare<=0){if(state.locked){endRun(true,'corrupt');return;}state.nightmare=9;state.skillCd=0;toast('梦魇形态 · 9 秒无敌、双倍伤害！结束后回响槽将被封印',5);ring(player.x,player.y,350,'#c08fe1',1.3);}updateBuild();}
function evolution(){return !state.locked&&state.slots.every(s=>s===state.slots[0])?({wolf:'月蚀狼王',fire:'行走灾炎',ghost:'无形死神'}[state.slots[0]]||null):null;}
function combo(){const [a,b,c]=state.slots,ev=evolution();if(ev)return {name:ev,description:'三影进化：技能额外产生大范围破影冲击，幽灵进化获得更长无敌。',tags:['三影进化',shadows[a].tag],active:true};const tags=[shadows[a].tag,shadows[b].tag,...state.locked?[]:[shadows[c].tag]];let name=`${shadows[a].title} · ${shadows[b].tag}`,active=false;if(a==='wolf'&&b==='fire'){name='烈焰追猎';active=true;}if(a==='shield'&&b==='giant'){name='绝对反击';active=true;}if(a==='archer'&&b==='ghost'){name='幽影狙击';active=true;}if(a==='swarm'&&b==='fire'){name='焚梦虫群';active=true;}if(a==='archer'&&b==='mirror'){name='镜像齐射';active=true;}if(a==='wolf'&&c==='swarm'&&!state.locked){name='群影围猎';active=true;}return {name,description:`${shadows[a].hunt}，${shadows[b].dye}。${state.locked?'回响槽已被梦蚀封印。':shadows[c].echo+'。'}`,tags,active};}
function updateBuild(){
 const b=combo();
 $('compact-name').textContent=b.name;
 $('compact-slots').innerHTML=state.slots.map((id,i)=>`<button data-slot="${i}" class="weave-node ${i===2&&state.locked?'sealed':''}" style="--shadow-color:${shadows[id].color}" title="${GUIDE.roles[i]} · ${shadows[id].name}：${GUIDE.shadows[id].short[i]}" aria-label="更换${GUIDE.roles[i]}：${shadows[id].name}"><small class="node-role">${slotLabels[i]}</small>${icon(id)}<span><b>${i===2&&state.locked?'已封印':shadows[id].name}</b><small>${i===2&&state.locked?'—':brief(id,i)}</small></span></button>`).join('');
 $('compact-slots').querySelectorAll('button').forEach(b=>b.onclick=()=>openBuild(+b.dataset.slot));
 $('shadow-slots').innerHTML=state.slots.map((id,i)=>`<button class="shadow-slot" data-slot="${i}" style="--shadow-color:${shadows[id].color};${i===2&&state.locked?'opacity:.4':''}" aria-label="调整${GUIDE.roles[i]}：${shadows[id].name}">${icon(id)}<span class="slot-copy"><small>0${i+1} / ${GUIDE.roles[i]} <em>${roles[i]}</em></small><strong>${i===2&&state.locked?'已封印':shadows[id].name}</strong><p>${GUIDE.shadows[id].short[i]}</p></span><span class="slot-level">${['初生','饱食','觉醒'][state.levels[id]]}</span></button>`).join('');
 $('shadow-slots').querySelectorAll('button').forEach(b=>b.onclick=()=>openBuild(+b.dataset.slot));
 $('build-name').textContent=b.name;
 $('build-description').innerHTML=buildSequence();
 $('build-tags').innerHTML=`<span>冷却 ${(4.8-state.levels[state.slots[0]]*.4).toFixed(1)} 秒</span><span>每次 +${skillCorruptionCost()} 梦蚀</span>`;
 $('resonance-status').textContent=evolution()?'三影进化':b.active?'组合已激活':'三个槽位均生效';
 $('run-count').textContent=String(Math.max(1,runCount)).padStart(2,'0');
}
function updateUI(){updateJourneyUI();updateModeUI();updateContextHint();updateWorldUI();updateJourneyHint();const hp=Math.ceil(player.hp),focus=Math.floor(player.focus);$('hp-text').textContent=`${hp} / 100`;$('health-bar').style.width=hp+'%';$('focus-bar').style.width=focus+'%';$('focus-text').textContent=`${focus} / 100`;$('kills').textContent=String(state.kills).padStart(2,'0');$('corruption-text').textContent=Math.floor(state.corruption);$('corruption-bar').style.width=state.corruption+'%';$('timer').textContent=formatTime(state.time);$('phase-label').textContent=state.tutorial?'新手教学':state.mode==='practice'&&state.phase==='playing'?'自由试炼':state.world&&state.phase==='playing'?'旷野探索':({intro:'等待入梦',playing:'狩猎进行中',paused:'梦境暂停',map:'岔路抉择',pickup:'夺影成功',end:'梦境终了',build:'编织影子',codex:'影子图鉴',guide:'猎人手册',atlas:'五境星图',inventory:'整理行囊',worldVictory:'世界通关',worldmap:'查看全图',worldIntro:'整装待发',worldComplete:'印记取得',camp:'营地休整',discovery:'探索收获',briefing:'任务准备',missionFailed:'任务未完成'}[state.phase]||'长梦之中');$('weapon-name').textContent=`折叠弓刃 · ${state.weapon==='blade'?'刃形':'弓形'}`;$('skill-label').textContent=state.skillCd>0?`冷却 ${state.skillCd.toFixed(1)}s`:'释放组合影技';$('dash-label').textContent=state.dashCd>0?`${state.dashCd.toFixed(1)}s`:'闪避';$('corruption-description').textContent=state.nightmare>0?`梦魇形态 ${state.nightmare.toFixed(1)}s · 双倍伤害 / 无敌`:state.locked?'回响槽已封印 · 再次满梦蚀将进入同化结局':state.corruption>=75?'深度梦蚀 · 治疗减半，伤害提升；满值将失去回响槽':state.corruption>=40?'梦蚀正在加深 · 影技增伤，谨慎使用黑暗':`每次 Q +${skillCorruptionCost()} 梦蚀；普攻免费。75 起治疗减半，100 时强化后封印第三槽。`;$('depth-label').textContent=`0${state.room+1} / 05`;$('route').innerHTML=Array.from({length:5},(_,i)=>`<span class="route-node ${i===state.room?'current':i<state.room?'done':''}"><span>${i<state.room?'✓':i===4?'☾':'·'}</span></span>`).join('');const boss=enemies.find(e=>e.boss&&!e.dead);if(boss){$('boss-bar').style.width=clamp(boss.hp/boss.maxHp*100,0,100)+'%';$('boss-phase').textContent=boss.exposed?'影子暴露 · 长按 E 夺影':boss.phase===2?'第二阶段 · 饥饿觉醒':'月蚀的守门者';}}
/* Expedition growth is isolated from the tutorial and practice arena. */
function journeyMods(){const mods=JOURNEY.modifiers(state.journey.perks);mods.incoming*=window.HUNTER_RELEASE?.incoming()??1;if(state.world&&state.mode==='hunt'&&state.campaign.equipped){const effect=CAMPAIGN.items[state.campaign.equipped].effect;mods.attack*=effect.attack||1;mods.skill*=effect.skill||1;mods.incoming*=effect.incoming||1;mods.dash*=effect.dash||1;mods.heal+=effect.heal||0;}return mods;}
function skillCorruptionCost(){return state.mode==='practice'?0:Math.max(0,(state.roomType==='rift'?16:8)+journeyMods().corruption);}
function useFlask(){
 if(state.phase!=='playing'||!state.world||state.tutorial||state.mode==='practice')return false;
 const j=state.journey;
 if(state.capture>0||state.nightmare>0){toast('夺影或梦魇形态中不能饮用月露',2);return false;}
 if(j.flaskCd>0){toast(`月露还需 ${j.flaskCd.toFixed(1)} 秒冷却`,2);return false;}
 if(j.flasks<=0){toast('月露用尽：完成任务补充 1 瓶，营地休整补满',3);return false;}
 if(player.hp>=100&&state.corruption<=0){toast('生命与梦蚀状态良好，先留着这瓶月露',2);return false;}
 cancelRecall();const before=player.hp,heal=(35+journeyMods().heal)*(state.corruption>=75?.5:1);
 j.flasks--;j.flaskCd=8;player.hp=clamp(player.hp+heal,0,100);state.corruption=Math.max(0,state.corruption-12);
 ring(player.x,player.y,70,'#a9e1bf');textFloat(player.x,player.y-42,`+${Math.round(player.hp-before)} 生命`,'#c9f4ce');
 toast(`饮用月露：恢复 ${Math.round(player.hp-before)} 生命，净化 12 梦蚀`,2.5);tone(680,.2);updateUI();return true;
}
function cancelRecall(){if(state?.journey)state.journey.recall=0;}
function recallBlocked(){
 if(!state.world||state.objective)return '任务期间不能回营，请先完成任务';
 if(state.nightmare>0)return '梦魇形态中不能回营';
 if(campThreat()||WORLD.terrainAt(player.x,player.y)?.kind==='embers')return '附近有敌人或危险区域，先脱离战斗';
 if(player.dash>0||state.capture>0||mouse.down)return '停止攻击、闪避或夺影，再引导回营';
 return null;
}
function startRecall(){
 if(!state.world||state.phase!=='playing')return false;
 if(state.journey.recall>0){cancelRecall();toast('已取消回营',2);return false;}
 const reason=recallBlocked();if(reason){toast(reason,3);return false;}
 if(distance(player,WORLD.sites[0])<130){openCamp();return true;}
 state.journey.recall=3;toast('回营引导中：保持静止 3 秒，移动或战斗将中断',3);updateUI();return true;
}
function arriveCamp(){
 cancelRecall();state.capture=0;state.captureTarget=null;player.x=WORLD.sites[0].x;player.y=WORLD.sites[0].y;
 player.dash=0;player.invincible=2;keys={};mouse.down=false;state.world.near=WORLD.sites[0];
 updateCamera(0,true);openCamp();
}
function leaveWorldMission(){
 if(!state.world?.missionCheckpoint||state.phase!=='missionFailed')return false;
 restoreWorldCheckpoint(state.world.missionCheckpoint);$('boss-hud').classList.add('hidden');arriveCamp();
 $('camp-status').textContent='已撤回营地：保留任务开始前的收获，本次失败任务的消耗已还原。';return true;
}
function updateJourney(dt){
 const j=state.journey;j.flaskCd=Math.max(0,j.flaskCd-dt);j.streakTime=Math.max(0,j.streakTime-dt);if(!j.streakTime)j.streak=0;
 if(j.recall<=0)return;
 const moving=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].some(k=>keys[k]);
 if(moving||recallBlocked()){cancelRecall();toast('回营已中断：需要保持静止并远离危险',2);return;}
 j.recall=Math.max(0,j.recall-dt);if(!j.recall)arriveCamp();
}
function recordChain(){
 if(!state.world||state.mode!=='hunt'||state.tutorial)return;
 const j=state.journey;j.streak=j.streakTime>0?j.streak+1:1;j.streakTime=10;j.bestStreak=Math.max(j.bestStreak,j.streak);
 if(j.streak%3===0){player.focus=clamp(player.focus+10,0,100);state.corruption=Math.max(0,state.corruption-3);textFloat(player.x,player.y-60,`${j.streak} 连猎 · +10 专注 / −3 梦蚀`,'#e7d39c');}
}
function chooseBoon(id){
 if(state.phase!=='worldComplete'||!state.pendingBoons.includes(id)||state.journey.perks.includes(id))return false;
 const perk=JOURNEY.perks.find(p=>p.id===id);if(!perk)return false;
 state.journey.perks.push(id);state.pendingBoons=[];
 $('modal-card').querySelectorAll('[data-boon]').forEach(b=>{b.disabled=true;b.classList.toggle('selected',b.dataset.boon===id);});
 $('boon-result').textContent=`已获得「${perk.name}」：${perk.description}`;
 $('world-continue').disabled=false;$('world-continue').textContent='带上祝福，继续探索 ↗';$('world-reward-map').disabled=false;
 tone(780,.3);updateBuild();updateUI();$('world-continue').focus();return true;
}
function navigationTarget(){
 if(!state.world)return null;const o=state.objective;if(o?.nodes){const n=o.nodes.find((_,i)=>!o.activated.includes(i));if(n)return n;}if(o?.kind==='hunt'){const e=enemies.find(e=>o.targets.includes(e.id)&&!e.dead);if(e)return {...e,name:'清剿目标',color:campaignWorld().color};}const site=currentWorldSite(state.world.track);
 const west=player.x<1220&&site.x>1390,east=player.x>1390&&site.x<1220;
 if(WORLD.bridges.length&&(west||east)){
  const y=[...WORLD.bridges].sort((a,b)=>(Math.abs(player.y-a)+Math.abs(site.y-a))-(Math.abs(player.y-b)+Math.abs(site.y-b)))[0];
  const approach=Math.abs(player.y-y)>75;
  return {x:approach?(west?1150:1460):(west?1460:1150),y,name:`${y===670?'北桥':'南桥'} · 过河后前往${site.name}`,color:site.color,bridge:true};
 }
 return site;
}
function updateJourneyUI(){
 const active=!!state.world,j=state.journey;
 $('field-kit').classList.toggle('hidden',!active||state.phase!=='playing');$('journey-status').classList.toggle('hidden',!active);
 if(!active)return;
 $('flask-count').textContent=`月露 ${j.flasks} / ${j.maxFlasks}`;
 const flaskHeal=(35+journeyMods().heal)*(state.corruption>=75?.5:1);
 $('flask-hint').textContent=j.flaskCd>0?`冷却 ${j.flaskCd.toFixed(1)} 秒`:`恢复 ${flaskHeal} · 净化 12${state.corruption>=75?'（半疗）':''}`;
 $('flask-button').disabled=!j.flasks||j.flaskCd>0||state.nightmare>0||state.capture>0;
 $('recall-label').textContent=j.recall>0?'取消回营':'安全回营';$('recall-button').disabled=!!state.objective;
 $('field-risk').textContent=state.nightmare>0?`梦魇 ${state.nightmare.toFixed(1)}s · 结束封印回响`:`梦蚀 ${Math.floor(state.corruption)} / 100 · ${state.locked?'再次满值将同化':state.corruption>=75?'治疗减半':`Q +${skillCorruptionCost()}`}`;
 $('field-risk').classList.toggle('is-danger',state.corruption>=75||state.locked);
 $('recall-progress').classList.toggle('hidden',j.recall<=0);$('recall-progress').textContent=`静止回营 · ${j.recall.toFixed(1)} 秒`;
 const s=currentWorldSite(state.world.track),waypoint=navigationTarget(),dx=waypoint.x-player.x,dy=waypoint.y-player.y;
 const direction=['东','东南','南','西南','西','西北','北','东北'][(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 $('journey-stage').textContent=`世界 ${campaignWorld().number} · Lv.${campaignWorld().level} · ${state.world.completed.size} / 3 印记 → ${campaignWorld().boss}`;
 $('journey-target').textContent=state.objective?`当前任务：${state.objective.site.name}`:`下一站：${s.name}`;
 $('journey-direction').textContent=state.objective?'完成条件见画面右上 · 阅读面板时计时暂停':distance(player,s)<130?'已抵达 · 按 F 互动':`${direction}方 · ${Math.round(distance(player,waypoint))} 步${waypoint.bridge?` · 经${waypoint.name}`:' · M 选择目标'}`;
 $('journey-perks').innerHTML=j.perks.length?j.perks.map(id=>{const p=JOURNEY.perks.find(p=>p.id===id);return `<span title="${p.description}">${p.symbol} ${p.name}</span>`;}).join(''):'<span>完成印记任务，选择猎人祝福</span>';
 $('journey-chain').textContent=j.streak>0?`${j.streak} 连猎 · ${Math.ceil(j.streakTime)}s / 每 3 连额外奖励`:`最佳连猎 ${j.bestStreak} · 受伤中断`;
}
const BUILD_PRESETS=[
 {name:'烈焰追猎',slots:['wolf','fire','mirror'],hint:'突进 + 燃烧 + 重放 · 适合追猎'},
 {name:'镜像齐射',slots:['archer','mirror','fire'],hint:'远程箭雨 + 分裂 + 爆炸 · 安全输出'},
 {name:'守灯壁垒',slots:['giant','ghost','shield'],hint:'范围震地 + 无敌 + 回血 · 保护梦灯'},
 {name:'幽影游猎',slots:['ghost','fire','wolf'],hint:'穿行 + 燃烧 + 击杀重置闪避'}
];
function buildIsSafe(){return state.mode==='practice'||modalReturn!=='playing'||(state.world?!campThreat():living().length===0);}
function presetPlan(index){
 const p=BUILD_PRESETS[index];if(!p)return null;
 const slots=p.slots.map((id,i)=>i===2&&state.locked?state.slots[2]:id),missing=[...new Set(slots.filter(id=>!state.owned.has(id)))];
 const changes=slots.filter((id,i)=>id!==state.slots[i]).length,cost=buildIsSafe()?0:changes*25;
 return {p,slots,missing,changes,cost};
}
function presetMarkup(){return `<div class="build-presets" aria-label="推荐构筑">${BUILD_PRESETS.map((p,i)=>{const plan=presetPlan(i);return `<button data-preset="${i}" ${plan.missing.length||player.focus<plan.cost?'disabled':''}><b>${p.name}</b><small>${p.hint}</small><small>${plan.missing.length?'需夺取：'+plan.missing.map(id=>shadows[id].name).join('、'):!plan.changes?'当前构筑':plan.cost?`整套替换 · ${plan.cost} 专注`:'免费装备整套'}${state.locked?' · 封印槽保留':''}</small></button>`;}).join('')}</div>`;}
function applyPreset(index){
 if(state.phase!=='build')return false;const plan=presetPlan(index);
 if(!plan||plan.missing.length||player.focus<plan.cost||!plan.changes)return false;
 player.focus-=plan.cost;state.slots=[...plan.slots];updateBuild();renderBuild();toast(`已装备「${plan.p.name}」${plan.cost?` · 消耗 ${plan.cost} 专注`:''}`,3);return true;
}
function formatTime(t){return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
function showModal(type,html){cancelRecall();state.capture=0;state.captureTarget=null;player.charging=0;mouse.held=0;$('capture-hud').classList.add('hidden');state.phase=type;state.modalType=type;keys={};mouse.down=false;$('modal-card').innerHTML=html;$('modal-card').scrollTop=0;$('modal').dataset.kind=type;$('modal').classList.remove('hidden');$('intro').classList.add('hidden');updateUI();requestAnimationFrame(()=>{$('modal-card').querySelector('button')?.focus({preventScroll:true});});}
function closeModal(next=modalReturn){state.phase=next;state.modalType=null;$('modal').classList.add('hidden');if(next==='intro')$('intro').classList.remove('hidden');keys={};mouse.down=false;canvas.focus({preventScroll:true});updateUI();}
function pause(){if(state.phase==='paused'){closeModal();return;}if(state.phase!=='playing'&&state.phase!=='intro')return;modalReturn=state.phase;showModal('paused',`<div class="modal-eyebrow">THE DREAM CAN WAIT</div><h2 id="modal-title">让梦境，停留片刻。</h2><p>C 饮用月露，B 脱战回营，F 与营火互动保存。刷新或退出只保留上次营地存档。</p><div class="pause-summary"><span>印记 <b>${state.world?.completed.size||0} / 3</b></span><span>生命 <b>${Math.ceil(player.hp)} / 100</b></span><span>已掌握 <b>${state.owned.size} / 8</b></span></div><div class="modal-actions"><button class="primary" id="resume">继续狩猎 ↗</button><button class="secondary" id="pause-settings">声音与画面</button><button class="secondary" id="pause-guide">操作指南</button><button class="secondary" id="restart">重新入梦</button><button class="secondary" id="pause-home">返回标题</button></div>`);$('resume').onclick=()=>closeModal();$('restart').onclick=()=>confirmLeave(false);$('pause-home').onclick=()=>confirmLeave(true);$('pause-settings').onclick=openSettings;$('pause-guide').onclick=()=>openGuide();}
function openGuide(){
 if(!['intro','playing','paused','guide'].includes(state.phase))return;
 if(!['paused','guide'].includes(state.phase))modalReturn=state.phase;
 showModal('guide',`<div class="modal-eyebrow">HUNTER FIELD GUIDE</div><h2 id="modal-title">影子，就是敌人的能力。</h2><div class="guide-visual"><span><kbd>左键</kbd>击破</span><i>→</i><span><kbd>E</kbd>长按夺影</span><i>→</i><span><kbd>TAB</kbd>编入槽位</span><i>→</i><span><kbd>Q</kbd>释放</span></div><div class="control-chips"><span><kbd>WASD</kbd>移动</span><span><kbd>SPACE</kbd>闪避</span><span><kbd>R</kbd>刀 / 弓</span><span><kbd>C</kbd>月露</span><span><kbd>M</kbd>地图</span><span><kbd>F</kbd>互动 / 保存</span></div><p>目标变白时停手，靠近长按 E。三枚影子共同组成一个 Q 技能。</p><details class="visual-details"><summary>展开完整手册：技能、探索、存档与数值</summary><div class="explain-box">你扮演猎人。<b>夺影会学会敌人的能力；把能力装进三个槽位，就能改变按 Q 释放的技能。</b>左键是武器普攻，始终可以使用。</div>
 <div class="guide-flow"><div><b>1 · 打出白色裂痕</b><p>攻击削减敌人的生命和影压。普通敌人任一条耗尽，即暴露影子 7 秒。Boss 要先压低生命。</p></div><div><b>2 · 走近，按住 E</b><p>引导约 1 秒即可夺影。受伤会打断；专注满时瞬间完成。继续左键攻击暴露目标则收割回血，不会获得影子。</p></div><div><b>3 · 装进一个槽位</b><p>主动形态决定 Q 做什么，附加效果给 Q 加规则，后续触发追加一次效果。三个槽位共同组成一个技能。</p></div></div>
 <h3 class="help-heading">自由调整视野</h3><p>大地图中，滚轮向下拉远、向上拉近，也可拖动小地图下的「视野范围」滑杆。50%–200% 连续可调；100% 是默认，数值越大看到的范围越广。键盘 − / + 调节，0 或「复位」恢复默认。镜头始终以猎人为中心，地图边界外是不可通行的暗色区域。</p><p class="fine-print">只改变观察范围，不改变攻击距离、移速或敌人警戒范围。视野偏好自动保存在当前浏览器，独立于营地存档；教学与试炼保留固定场地视角。</p><h3 class="help-heading">大地图怎么探索？</h3><div class="guide-grid"><div><strong>M 全图 · F 互动</strong><p>沿石路前往追猎、守灯和夺影地点，靠近标记按 F 开始任务。三处印记收齐后，到东北方挑战月狼。任务可自由排序，深河请走桥。</p></div><div><strong>环境与新敌人</strong><p>浅沼减速，余烬灼伤。灰烬祭司会锁定地面落火；沼泽潜伏者会留下毒雾；遗迹卫士正面减伤，绕侧后方攻击。三者分别能夺得火焰影、幽灵影、盾兵影。</p></div></div><h3 class="help-heading">成长与随身补给</h3><div class="guide-grid"><div><strong>C · 饮用月露</strong><p>初始 2 瓶，每瓶恢复 35 生命、净化 12 梦蚀，冷却 8 秒。75 梦蚀起治疗减半。任务完成补充 1 瓶，营地休整补满。</p></div><div><strong>B · 安全回营</strong><p>脱离附近敌人后静止引导 3 秒。移动、攻击、夺影或危险接近会中断；任务中不可用。回营不会自动治疗或保存。</p></div><div><strong>印记奖励 · 三选一</strong><p>每完成一处任务，从三种猎人祝福中选一项，持续本局。祝福和剩余药剂随营地存档保存。</p></div><div><strong>连猎 · 把握战斗节奏</strong><p>10 秒内继续击杀或夺影可延续连猎；每 3 连获得 10 专注、净化 3 梦蚀。受到伤害或超时即中断，暂停不会计时。</p></div></div><p>Tab 中可选择整套推荐构筑；必须先掌握所需影子。战中每个实际更换的槽位花费 25 专注，安全时免费，封印槽保留。</p><h3 class="help-heading">探索与营地存档</h3><p>先沿营地北方石路击破斥候，长按 E 夺影，再按 F 打开补给箱。地图方形标记是四处可选宝藏，清除守卫后可领取。回营地按 F 手动保存任务、装备与宝藏进度；首页可继续存档。只保存在当前浏览器，教学与试炼不会覆盖。</p><div class="warning-key"><span>箭头 / 线条：侧向躲避</span><span>圆圈：离开攻击范围</span><span>紫圈：普通闪避无法免伤</span></div><h3 class="help-heading">以你的当前技能为例</h3><div class="sequence-box">${buildSequence()}</div>
 <div class="guide-grid"><div><strong><kbd>W A S D</kbd> 移动 · 鼠标瞄准</strong><p>左键点击普攻，按住超过 0.5 秒再松开可蓄力。R 切换近战刀刃 / 远程弓。</p></div><div><strong><kbd>SPACE</kbd> 闪避</strong><p>冷却 1.5 秒，短暂无敌。红色攻击可闪避，紫色危险区必须走出去。</p></div><div><strong><kbd>TAB</kbd> 装备已掌握的影子</strong><p>战中替换每槽花 25 专注；清场休整免费。攻击、击杀、精准闪避可获得专注。</p></div><div><strong>◈ 梦蚀是施法的代价</strong><p>每次 Q 增加 8（裂缝 16），并提高伤害。75 起治疗减半；100 时短暂强化，之后永久封印后续触发槽。</p></div></div>
 <details class="help-details"><summary>获得影子后的四种选择，有什么区别？</summary><p><b>装备：</b>立刻改变 Q 的对应部分，旧影子仍能从本局图鉴换回来。<br><b>吞噬：</b>不改技能形态，给当前主动影升一级；主动影每级增伤 22%，冷却缩短 0.4 秒。<br><b>献祭：</b>恢复 25 生命并减少 10 梦蚀，75 梦蚀起只恢复 12.5 生命。<br><b>封存：</b>保留这次奖励的处理机会，稍后从构筑页打开；容器最多一枚。<br>本 Demo 中，一旦夺取就会在本局掌握该影子，无论选哪种奖励；重新开局清空。相同影子可装多个槽位。</p></details>
 </details><div class="modal-actions"><button class="primary" id="guide-close">明白了，继续 ↗</button>${modalReturn==='intro'?'<button class="secondary" id="guide-practice">跟着操作练一遍</button>':''}</div>`);
 $('guide-close').onclick=()=>closeModal();if(modalReturn==='intro')$('guide-practice').onclick=beginTutorial;
}
function openCodex(){
 if(!['intro','playing','paused','codex'].includes(state.phase))return;
 if(!['codex','paused'].includes(state.phase))modalReturn=state.phase;
 showModal('codex',`<div class="modal-eyebrow">本局已掌握 ${state.owned.size} / 8</div><h2 id="modal-title">一本可以装备的能力库。</h2><p>夺影成功后，能力会收入这里。本局可反复换装；同一枚影子也能放进多个槽位。<b>看见图鉴条目不代表已装备，装备后才改变 Q。</b></p><div class="codex-list">${shadowIds.map(id=>`<details class="codex-detail" style="--shadow-color:${shadows[id].color}"><summary>${icon(id)}<span><strong>${shadows[id].name}</strong><small>${GUIDE.shadows[id].origin}</small></span><em>${state.owned.has(id)?'已掌握':'需夺取'}</em><b>＋</b></summary><div class="codex-body">${roles.map((role,i)=>`<div><b>${GUIDE.roles[i]} · ${role}</b><p>${GUIDE.shadows[id][rolekeys[i]]}</p></div>`).join('')}</div></details>`).join('')}</div><p class="fine-print">伤害为基础值，成长与梦蚀会提升伤害。三枚相同狼影 / 火焰影 / 幽灵影会触发进化。</p><button class="primary" id="codex-close">回到梦境 ↗</button>`);
 $('codex-close').onclick=()=>closeModal();
}
function openBuild(slot=0){if(state.tutorial){toast('教学中请按左上角提示操作；正式战斗可随时用 Tab 换装');return;}if(!['intro','playing','paused','map','build'].includes(state.phase))return;if(!['build','paused'].includes(state.phase))modalReturn=state.phase;selectedSlot=slot;renderBuild();}
function renderBuild(){
 const safe=buildIsSafe();
 const current=state.slots[selectedSlot],locked=selectedSlot===2&&state.locked;
 showModal('build',`<div class="weave-heading"><div><div class="modal-eyebrow">SHADOW WEAVING</div><h2 id="modal-title">编织你的影技</h2></div><span class="cost-pill">${safe?'✦ 免费调整':`◈ ${Math.floor(player.focus)} / 每槽25`}</span><button class="weave-done" id="build-close" title="完成编织 · Esc">完成 ✓</button></div>
 <div class="build-slot-tabs visual-slot-tabs">${state.slots.map((id,i)=>`<button data-slot="${i}" title="${GUIDE.roles[i]}：${GUIDE.shadows[id].short[i]}" style="--shadow-color:${shadows[id].color}" class="${selectedSlot===i?'selected':''}"><small>0${i+1} / ${slotLabels[i]}</small>${icon(id)}<strong>${i===2&&state.locked?'已封印':brief(id,i)}</strong></button>`).join('')}</div>
 <div class="weave-result"><kbd>Q</kbd><b>${combo().name}</b><span>一次释放 · 三影联动</span></div>
 <div class="ability-grid">${[...state.owned].map(id=>{const chosen=id===current,cannot=!safe&&player.focus<25&&!chosen;return `<button class="ability-tile ${chosen?'equipped':''}" data-shadow="${id}" style="--shadow-color:${shadows[id].color}" title="${GUIDE.shadows[id][rolekeys[selectedSlot]]}" aria-label="${shadows[id].name}：${brief(id,selectedSlot)}${chosen?'，已装备':''}" ${locked||cannot?'disabled':''}>${icon(id)}<strong>${shadows[id].name}</strong><small>${brief(id,selectedSlot)}</small><em>${chosen?'✓ 已装备':cannot?'专注不足':'点击替换'}</em></button>`;}).join('')}</div>
 <details class="visual-details"><summary>推荐组合</summary>${presetMarkup()}</details><details class="visual-details"><summary>规则与当前效果</summary><p>${GUIDE.purposes[selectedSlot]}。${locked?'此槽已封印。':'点击能力卡即可替换。'}换下的影子不会丢失，战中替换每槽花费25专注。</p>${buildSequence()}</details>
 <div class="modal-actions">${state.stored?`<button class="secondary" id="open-stored">${uiGlyph('box')} ${shadows[state.stored].name}</button>`:''}</div>`);
 $('modal-card').querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{selectedSlot=+b.dataset.slot;renderBuild();});
 $('modal-card').querySelectorAll('[data-shadow]').forEach(b=>b.onclick=()=>{const id=b.dataset.shadow;if(state.slots[selectedSlot]===id||locked||!safe&&player.focus<25)return;if(!safe)player.focus-=25;state.slots[selectedSlot]=id;updateBuild();renderBuild();playEquipFeedback(id);tone(600,.13);});
 $('modal-card').querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(+b.dataset.preset));$('build-close').onclick=()=>{if(modalReturn==='map')showRoute();else closeModal();};
 if(state.stored)$('open-stored').onclick=()=>{const id=state.stored;state.stored=null;showReward(id,false,modalReturn);};
}
function showReward(id,boss=false,next='playing'){
 state.owned.add(id);
 const training=!!state.tutorial;if(training)setTutorialStep(3);
 const heal=state.corruption>=75?12.5:25,level=state.levels[state.slots[0]];
 showModal('pickup',`<div class="acquisition-heading" style="--shadow-color:${shadows[id].color}"><div class="acquisition-sigil"><i></i><i></i><i></i>${icon(id)}</div><div><div class="modal-eyebrow">SHADOW ACQUIRED</div><h2 id="modal-title">${boss?(state.world?campaignWorld().boss+'之影':'月狼影'):shadows[id].name}</h2><span class="acquired-tag">${uiGlyph('check')} 已掌握</span></div></div>
 <p class="choice-instruction">${training?'点亮第一个槽位，把突进变成影箭。':'选择一个槽位，编入你的 Q。'}</p>
 <div class="reward-buttons ritual-choices">${roles.map((role,i)=>`<button data-equip="${i}" style="--shadow-color:${shadows[id].color}" class="ritual-choice ${training&&i===0?'recommended':''}" aria-label="装备到${GUIDE.roles[i]}：${brief(id,i)}" ${i===2&&state.locked||training&&i!==0?'disabled':''}><span class="reward-role">0${i+1} / ${slotLabels[i]}</span><span class="slot-swap">${icon(state.slots[i])}${uiGlyph('arrow')}${icon(id)}</span><strong>${brief(id,i)}</strong><span class="choice-action">${i===2&&state.locked?'已封印':training&&i===0?'点击装备 ↗':'编入此槽 ↗'}</span></button>`).join('')}</div>
 ${training?'':`<div class="reward-alternatives visual-alternatives"><button class="secondary" id="devour" ${level>=2?'disabled':''}>${uiGlyph('star')}<span><b>吞噬</b><small>${level>=2?'已满级':'伤害 +22%'}</small></span></button><button class="secondary" id="sacrifice">${uiGlyph('flask')}<span><b>献祭</b><small>生命 +${heal} · 梦蚀 −10</small></span></button><button class="secondary" id="store-shadow" ${state.stored?'disabled':''}>${uiGlyph('box')}<span><b>封存</b><small>${state.stored?'容器已满':'稍后决定'}</small></span></button></div>`}
 <details class="visual-details"><summary>规则与数值</summary><p>${training?'你的 Q 将从突进变成射箭。火焰影和镜魔影保持原位。':'无论选哪项，影子都已在本局掌握，可在 Tab 中重新装备。战中换装每槽消耗 25 专注。'}</p>${roles.map((role,i)=>`<p><b>${GUIDE.roles[i]}</b><br>现在：${shadows[state.slots[i]].name} · ${GUIDE.shadows[state.slots[i]].short[i]}<br>换成：${GUIDE.shadows[id].short[i]}<br>${GUIDE.shadows[id][rolekeys[i]]}</p>`).join('')}${training?'':`<p>吞噬强化当前主动影一级，伤害 +22%、冷却 −0.4 秒。献祭恢复 ${heal} 生命，减少 10 梦蚀。封存最多一枚，在 Tab 中处理。</p>`}</details>`);
 const finish=(action='equip')=>{updateBuild();playEquipFeedback(id,action);toast(action==='equip'?`已编织 · ${combo().name}`:action==='heal'?'月露回流':action==='devour'?'影子已强化':'已封存',2);if(training){closeModal('playing');enemies=[];projectiles=[];effects=[];player.x=600;player.y=500;spawnEnemy('giant',820,475);state.skillCd=0;setTutorialStep(4);return;}if(boss){endRun(true);return;}if(next==='map')showRoute();else closeModal(next);};
 $('modal-card').querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{if(training&&+b.dataset.equip!==0)return;state.slots[+b.dataset.equip]=id;tone(650,.25);finish();});
 if(!training){$('devour').onclick=()=>{const s=state.slots[0];if(state.phase!=='pickup'||state.levels[s]>=2)return;state.levels[s]++;state.xp[s]=Math.max(state.xp[s],state.levels[s]===2?18:7);finish('devour');};$('sacrifice').onclick=()=>{player.hp=clamp(player.hp+heal,0,100);state.corruption=Math.max(0,state.corruption-10);finish('heal');};$('store-shadow').onclick=()=>{if(state.stored)return;state.stored=id;finish('store');};}
}
function showRoute(){
 const next=state.room+1;if(next>=5){endRun(true);return;}
 const choices=next===1?[
  {type:'chase',title:'追猎 · 破镜小径',symbol:'⌁',tag:'45 秒限时 · 镜魔影',text:'镜魔沿林间小径逃窜。45 秒内击破后收割或夺影即可过关；夺取后可获得环形镜刃 / 分裂 / 重放能力。进入恢复 12 生命。'},
  {type:'defend',title:'守灯 · 余烬庭院',symbol:'✧',tag:'36 秒防守 · 狼影 / 巨人影',text:'守住中央梦灯，灯的耐久不能归零。四波梦魇会优先攻击灯；击破可打断它们。完成恢复 20 生命、净化 15 梦蚀。'}
 ]:next===2?[
  {type:'altar',title:'失落祭坛',symbol:'✧',tag:'休整 · 净化',text:'恢复 30 生命，净化 25 梦蚀。免费整理构筑，再进入夺影猎场。'},
  {type:'rift',title:'梦境裂缝',symbol:'◈',tag:'挑战 · 幽灵 / 弓手 / 蜂群',text:'敌人影压减半，夺影更容易；使用影技会积累双倍梦蚀。'}
 ]:next===3?[
  {type:'capture',title:'夺影 · 缚影祭坛',symbol:'◈',tag:'指定目标 · 幽灵影',text:'盾兵和巨人守护着幽灵精英。击破带金色标记的幽灵，靠近并长按 E 夺取。只击杀守卫不能完成任务。进入获得 35 专注。'}
 ]:[{type:'boss',title:'月狼之巢',symbol:'☾',tag:'首领 · 终结长梦',text:'饥饿月狼正在等待。观察红色预警，走出紫色危险区；残血时可以夺影。'}];
 showModal('map',`<div class="modal-eyebrow">${state.objective?'目标完成':'猎场已清空'} / 选择下一站</div><h2 id="modal-title">月光，在此分岔。</h2><p>每条路都有明确的目标和回报。调整好影子，再踏入下一场狩猎。</p><div class="choice-grid" ${choices.length===1?'style="grid-template-columns:1fr"':''}>${choices.map((c,i)=>`<button class="choice" data-route="${i}"><span class="choice-symbol">${c.symbol}</span><small>${c.tag}</small><strong>${c.title}</strong><p>${c.text}</p></button>`).join('')}</div><div class="modal-actions"><button class="secondary" id="route-build">调整影子 · 免费</button><button class="secondary" id="route-home">返回营地</button></div>`);
 $('modal-card').querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{const c=choices[+b.dataset.route];if(c.type==='altar'){player.hp=clamp(player.hp+30,0,100);state.corruption=Math.max(0,state.corruption-25);state.room=2;state.objective=null;state.skillCd=0;state.dashCd=0;showAltar();return;}if(c.type==='chase')player.hp=clamp(player.hp+12,0,100);if(c.type==='capture')player.focus=clamp(player.focus+35,0,100);enterRoom(next,c.type);canvas.focus({preventScroll:true});});
 $('route-build').onclick=()=>openBuild();$('route-home').onclick=reset;
}
function showAltar(){showModal('map',`<div class="modal-eyebrow">A MOMENT OF STILLNESS</div><h2 id="modal-title">有些光，还没有熄灭。</h2><p>梦灯温暖了你的伤口。恢复 30 生命，净化 25 梦蚀。林间传来狼的低鸣。</p><div class="stats"><div><strong>${Math.ceil(player.hp)}</strong><small>当前生命</small></div><div><strong>${Math.floor(state.corruption)}</strong><small>当前梦蚀</small></div></div><div class="modal-actions"><button class="primary" id="altar-next">继续深入 ↗</button><button class="secondary" id="altar-build">重组影子</button></div>`);$('altar-next').onclick=showRoute;$('altar-build').onclick=()=>openBuild();}
function endRun(win,ending='normal'){
 if(win&&state.world){completeCampaignWorld();return;}
 const outcome=ending==='corrupt'?'assimilated':win?'dawn':'fallen';
 if(!state.releaseRecorded&&state.mode!=='practice'&&!state.tutorial){state.releaseRecorded=true;window.HUNTER_RELEASE?.record({ending:outcome,time:Math.max(1,state.time),kills:state.kills,captures:state.captures});}
 window.HUNTER_AUDIO?.setScene(win&&ending!=='corrupt'?'victory':'defeat');
 showModal('end',`<div class="ending-emblem ${outcome}">${ending==='corrupt'?'◈':win?'☀':'☾'}</div><div class="modal-eyebrow">${ending==='corrupt'?'ENDING / 长梦同化':win?'CHAPTER COMPLETE / 黎明归来':'THE DREAM IS NOT OVER'}</div><h2 id="modal-title">${ending==='corrupt'?'你，成为了长梦。':win?'长夜将尽，猎人归来。':'影子留在了月光里。'}</h2><p>${ending==='corrupt'?'你再一次拥抱了满溢的梦蚀。猎人与梦魇的边界终于消失，森林迎来了新的主人。营火边的守夜人，再也没有等到你的归来。':win?'月狼的影子在晨风中散去。余烬庭院的灯没有熄灭，失落的名字从祭坛回到了人间。你带回的不只是梦魇的力量，还有这片森林久违的黎明。<br><br><b>《月蚀森林》章节已完成。感谢游玩。</b>':'梦魇夺走了这一次机会。用 R 切换弓形远射，保留闪避应对预警，C 使用月露。也可在游戏设置选择「旅人」难度，再次挑战。'}</p><div class="stats"><div><strong>${formatTime(state.time)}</strong><small>梦中时长</small></div><div><strong>${state.kills}</strong><small>猎杀梦魇</small></div><div><strong>${state.captures}</strong><small>夺取影子</small></div></div><div class="journey-result">最佳连猎 ${state.journey.bestStreak} · 猎人祝福 ${state.journey.perks.length} / 3<br>${state.journey.perks.map(id=>JOURNEY.perks.find(p=>p.id===id).name).join(' · ')||'尚未取得祝福'}</div><p>最终构筑：${combo().name}<br>${state.slots.map(s=>shadows[s].name).join(' ＋ ')}</p><p class="fine-print">通关与结局记录保存在本机「猎人纪事」，不覆盖营地检查点。</p><div class="modal-actions"><button class="primary" id="end-restart">再次踏入长梦 ↗</button><button class="secondary" id="end-home">返回首页</button>${state.world&&EXPEDITION.read(campStorage()).status==='ready'?'<button class="secondary" id="end-load">回到营地存档</button>':''}</div>`);
 $('end-restart').onclick=()=>{reset();start();};$('end-home').onclick=reset;if(state.world&&EXPEDITION.read(campStorage()).status==='ready')$('end-load').onclick=resumeCamp;tone(win?660:160,.7,'sine',.07);
}

function updateEnemy(e,dt){if(e.dead)return;e.hit=Math.max(0,e.hit-dt);if(e.exposed){if(e.scout||state.tutorial||state.mode==='practice'&&state.practiceTarget==='dummy')return;e.exposed-=dt;if(e.exposed<=0){if(state.objective&&['capture','chase'].includes(state.objective.kind)&&state.objective.targetId===e.id){e.exposed=0;e.hp=e.maxHp*.5;e.pressure=e.maxPressure;e.cd=1.5;toast(state.objective.kind==='capture'?'目标重新凝聚：再次击破，靠近长按 E 夺取':'镜魔重新凝聚：击破后及时收割或夺影');}else if(e.boss&&e.hp>0){e.exposed=0;e.hp=Math.max(e.hp,e.maxHp*.15);e.pressure=e.maxPressure;e.cd=1.5;toast((state.world?campaignWorld().boss:'月狼')+'重新凝聚了影子！');}else gainKill(e);}return;}
 if(e.burn>0){const active=Math.min(dt,e.burn);e.burn=Math.max(0,e.burn-dt);e.hp-=9*active*(e.burnCast?.skillBonus??journeyMods().skill);if(Math.random()<dt*15)burst(e.x,e.y,'#f1a05e',1,30);}if(e.bleed>0){const active=Math.min(dt,e.bleed);e.bleed=Math.max(0,e.bleed-dt);e.hp-=7*active*(e.bleedCast?.skillBonus??journeyMods().skill);}if(e.hp<=0){expose(e);return;}
 if(state.tutorial||state.mode==='practice'&&state.practiceTarget==='dummy')return;
 if(updateMissionEnemy(e,dt)||updateWorldEnemy(e,dt))return;
 if(e.boss&&e.hp<e.maxHp*.5&&e.phase===1){e.phase=2;ring(e.x,e.y,250,'#b589d2',1);const a=spawnEnemy('wolf',state.world?e.x-150:200,state.world?e.y+100:240),b=spawnEnemy('ghost',state.world?e.x+150:980,state.world?e.y+100:550);if(state.world){a.mission=true;b.mission=true;}toast((state.world?campaignWorld().boss:'月狼')+'觉醒 · 紫色梦蚀无法用普通闪避穿过',4);}
 if(e.dash>0){e.dash-=dt;moveEntity(e,e.dx*650*dt,e.dy*650*dt);if(distance(e,player)<e.r+player.r+8)hitPlayer(e.boss?22:13);return;}
 if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0)performEnemyAttack(e);return;}
 e.cd-=dt;const d=distance(e,player),a=angle(e,player);let speed=e.boss?70:e.type==='wolf'?83:e.type==='giant'?39:e.type==='ghost'?67:52;if(e.elite)speed*=1.1;const ranged=['fire','archer','mirror','swarm'].includes(e.type)&&!e.boss;
 if((ranged&&d>285)||(!ranged&&d>e.r+38))moveEntity(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt);else if(ranged&&d<180)moveEntity(e,-Math.cos(a)*speed*.65*dt,-Math.sin(a)*speed*.65*dt);
 for(const other of enemies){if(other===e||other.dead||other.exposed)continue;const dist=distance(other,e),min=e.r+other.r+4;if(dist<min&&dist>.1)moveEntity(e,(e.x-other.x)/dist*20*dt,(e.y-other.y)/dist*20*dt);}
 if(e.cd<=0&&d<(e.boss?720:ranged?510:170)){e.target={x:player.x,y:player.y};e.attack=e.boss?(e.phase===2&&Math.random()<.45?'curse':Math.random()<.55?'lunge':'slam'):e.type==='wolf'?'lunge':ranged?'shot':'slam';if(e.boss&&state.world&&state.world.id!=='forest')e.attack=e.phase===2&&Math.random()<.3?'curse':Math.random()<.7?campaignWorld().bossMove:'slam';e.telegraph=e.boss?1.05:e.attack==='lunge'?.75:.95;e.cd=e.boss?(e.phase===2?1.5:2):rand(1.8,2.9);}}
function performEnemyAttack(e){if(performVariantAttack(e))return;const t=e.target;if(!t)return;const a=angle(e,t);if(e.attack==='lantern'){ring(e.x,e.y,85,'#d07373',.35);const lamp=state.objective?.lantern;if(lamp&&distance(e,lamp)<105){lamp.hp=Math.max(0,lamp.hp-(e.type==='giant'?14:9));ring(lamp.x,lamp.y,65,'#eda874');}return;}if(e.attack==='lunge'){e.dash=e.boss?.58:.36;e.dx=Math.cos(a);e.dy=Math.sin(a);tone(120,.15,'triangle',.04);}else if(e.attack==='slam'){const r=e.boss?160:e.type==='giant'?110:85;ring(e.x,e.y,r,'#d07373',.35);if(distance(player,e)<r+player.r)hitPlayer(e.boss?24:e.elite?18:12);}else if(e.attack==='curse'){ring(t.x,t.y,145,'#b485db',.6);hazards.push({x:t.x,y:t.y,r:135,life:2.3,tick:0,friendly:false,color:'#a36cca',purple:true});}else{const number=e.type==='mirror'?5:e.type==='swarm'?3:1;for(let i=0;i<number;i++)shoot(e.x,e.y,a+(i-(number-1)/2)*.19,e.type==='archer'?260:200,e.elite?16:10,shadows[e.type].color,{enemy:true,life:3});}}
function updateCapture(dt){const pressing=keys.KeyE;if(!pressing){state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');return;}const target=enemies.filter(e=>!e.dead&&e.exposed>0&&distance(e,player)<115).sort((a,b)=>distance(a,player)-distance(b,player))[0];if(!target){state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');return;}if(state.captureTarget!==target){state.capture=0;state.captureTarget=target;}state.capture+=dt;const duration=player.focus>=100?.04:target.boss?1.65:1.05;$('capture-hud').classList.remove('hidden');$('capture-bar').style.width=clamp(state.capture/duration*100,0,100)+'%';if(Math.random()<.6){const t=rand(0,1);burst(target.x+(player.x-target.x)*t,target.y+(player.y-target.y)*t,'#c8f8df',1,25);}if(state.capture>=duration){if(player.focus>=100)player.focus=0;else player.focus=clamp(player.focus+18,0,100);gainKill(target,true);state.capture=0;state.captureTarget=null;keys.KeyE=false;$('capture-hud').classList.add('hidden');tone(780,.55);captureFeedback(target);showReward(target.type,target.boss);}}
function update(dt){clock+=dt;updateCamera(dt);if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.add('hidden');}screenShake=Math.max(0,screenShake-dt*32);if(state.phase!=='playing'){return;}if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return;}state.time+=dt;updateJourney(dt);if(state.phase!=='playing')return;state.skillCd=Math.max(0,state.skillCd-dt);state.dashCd=Math.max(0,state.dashCd-dt);state.attackCd=Math.max(0,state.attackCd-dt);player.invincible=Math.max(0,player.invincible-dt);player.shield=Math.max(0,player.shield-dt);player.slash=Math.max(0,player.slash-dt);player.angle=angle(player,mouse);
 if(state.nightmare>0){state.nightmare=Math.max(0,state.nightmare-dt);if(state.nightmare<=0){state.locked=true;state.corruption=25;toast('梦魇褪去 · 回响影已被永久封印',4);updateBuild();}}
 const motionX=player.x,motionY=player.y,motionDash=player.dash>0;
 if(player.dash>0){player.dash-=dt;moveEntity(player,player.dx*820*dt,player.dy*820*dt);effects.push({kind:'afterimage',x:player.x,y:player.y,a:player.angle,life:.25,max:.25,color:'#8dd7c2'});}else if(state.capture<=0){let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);const l=Math.hypot(dx,dy);if(l)moveEntity(player,dx/l*worldMoveSpeed()*dt,dy/l*worldMoveSpeed()*dt);}
 window.HUNTER_ART?.advanceMotion(player,player.x-motionX,player.y-motionY,dt,{dash:motionDash,capture:state.capture>0});
 if(mouse.down){mouse.held+=dt;player.charging=mouse.held;}else player.charging=0;
 for(const e of enemies){updateEnemy(e,dt);attackCue(e);if(state.phase!=='playing')return;}
 for(const p of projectiles){if(p.life<=0)continue;const active=Math.min(dt,p.life);p.life-=dt;p.previousX=p.x;p.previousY=p.y;p.x+=p.vx*active;p.y+=p.vy*active;if(projectileBlocked(p)){p.life=0;continue;}if(p.enemy){if(Math.hypot(p.x-player.x,p.y-player.y)<player.r+p.r){hitPlayer(p.damage);p.life=0;if(state.phase!=='playing')return;}}else for(const e of enemies){if(e.dead||p.hit.has(e.id))continue;if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r){p.hit.add(e.id);damageEnemy(e,p.damage,p.pressure,p.skill?'skill':'basic',p.cast);if(p.skill)applyDye(e,p.cast);if(!p.pierce){p.life=0;break;}}}}
 projectiles=projectiles.filter(p=>p.life>0&&p.x>-20&&p.x<worldWidth()+20&&p.y>-20&&p.y<worldHeight()+20);
 for(const m of minions){if(m.life<=0)continue;const active=Math.min(dt,m.life);m.life-=dt;m.cd-=active;const e=nearest(m.x,m.y);if(e){const a=angle(m,e);m.x+=Math.cos(a)*230*active;m.y+=Math.sin(a)*230*active;if(distance(m,e)<e.r+12&&m.cd<=0){damageEnemy(e,8,4,'summon',m.cast);if((m.cast?.dye??state.slots[1])!=='swarm')applyDye(e,m.cast);m.cd=.65;burst(m.x,m.y,m.color,3);}}else{m.a+=dt*2;m.x+=(player.x+Math.cos(m.a)*55-m.x)*dt*3;m.y+=(player.y+Math.sin(m.a)*45-m.y)*dt*3;}}
 minions=minions.filter(m=>m.life>0);
 for(const h of hazards){if(h.life<=0)continue;const active=Math.min(dt,h.life);h.life-=dt;h.tick-=active;if(h.tick<=0){h.tick=.42;if(h.friendly){for(const e of living())if(distance(e,h)<h.r+e.r){damageEnemy(e,6,2,'burn',h.cast);e.burn=.6;e.burnCast=h.cast;}}else if(distance(player,h)<h.r+player.r)hitPlayer(h.damage||9,h.purple===true);if(state.phase!=='playing')return;}}hazards=hazards.filter(h=>h.life>0);
 for(const f of effects){f.life-=dt;if(f.kind==='particle'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.97;f.vy*=.97;}if(f.kind==='delayed'&&f.life<=0)f.action();}effects=effects.filter(f=>f.life>0);
 for(const f of floating){f.life-=dt;f.y-=30*dt;}floating=floating.filter(f=>f.life>0);
 if(state.phase!=='playing')return;updateCapture(dt);if(state.phase!=='playing')return;
 updateTutorial(dt);if(state.phase!=='playing')return;
 updateObjective(dt);if(state.phase!=='playing')return;updateWorld(dt);if(state.phase!=='playing')return;
 if(state.mode==='practice'&&enemies.every(e=>e.dead)){state.clearTimer+=dt;if(state.clearTimer>.8)practiceTargets(state.practiceTarget);}
 if(!state.world&&!state.tutorial&&state.mode!=='practice'&&!state.objective&&enemies.every(e=>e.dead)){state.clearTimer+=dt;if(state.clearTimer>1.4){if(state.bossWon)endRun(true);else showRoute();}}
 uiElapsed+=dt;if(uiElapsed>.08){updateUI();uiElapsed=0;}}


function buildSequence(){
 return `<span class="skill-sequence">${state.slots.map((id,i)=>`<span><b>${i+1}</b><span>${i===2&&state.locked?'后续触发槽已封印':GUIDE.shadows[id].short[i]}</span></span>`).join('')}</span>`;
}
function openSkillDetails(){
 if(!['intro','playing','paused','skillinfo'].includes(state.phase))return;
 if(!['paused','skillinfo'].includes(state.phase))modalReturn=state.phase;
 const id=state.slots[0];
 showModal('skillinfo',`<div class="modal-eyebrow">当前 Q 技能 · 三枚影子共同生效</div><h2 id="modal-title">${combo().name}</h2><div class="explain-box"><b>操作：</b>鼠标瞄准后按 Q。${GUIDE.shadows[id].aim}<br><b>代价：</b>冷却 ${(4.8-state.levels[id]*.4).toFixed(1)} 秒，每次增加 ${skillCorruptionCost()} 梦蚀。鼠标左键普攻不消耗梦蚀。</div><div class="skill-detail-list">${state.slots.map((s,i)=>`<div>${icon(s)}<section><b>${i+1} · ${GUIDE.roles[i]} / ${shadows[s].name}</b><p>${i===2&&state.locked?'此槽已封印，不再生效。':GUIDE.shadows[s][rolekeys[i]]}</p></section></div>`).join('')}</div><p class="fine-print">伤害标注为基础值，成长与梦蚀会提高伤害。三个槽位不是三个按键，按一次 Q 就会一起生效。</p><button class="primary" id="skill-info-close">回到游戏 ↗</button>`);
 $('skill-info-close').onclick=()=>closeModal();
}
function beginTutorial(){
 requestAnimationFrame(()=>window.scrollTo(0,0));reset();state.phase='playing';state.tutorial={step:0,elapsed:0,skillHit:false};
 enemies=[];player.x=560;player.y=520;spawnEnemy('archer',780,460);
 $('intro').classList.add('hidden');$('room-name').textContent='猎人练习场';$('room-tag').innerHTML='安全教学 <span>不会受伤</span>';
 $('objective').textContent='学会夺影，再进入正式狩猎';setTutorialStep(0);updateUI();canvas.focus({preventScroll:true});
}
function setTutorialStep(step){
 if(!state.tutorial)return;state.tutorial.step=step;state.tutorial.elapsed=0;
 const lesson=GUIDE.lessons[step];
 $('tutorial-step').textContent=`新手教学 ${step+1} / 6`;
 $('tutorial-title').textContent=lesson.title;$('tutorial-key').textContent=['WASD','左键','长按 E','点击','Q','✓'][step];$('tutorial-action').textContent=['走进光圈','指向目标攻击','靠近白色目标','装备第一个槽位','指向目标施法','教学完成'][step];
 $('tutorial-text').textContent=['走进目标旁的光圈。','攻击到目标变白，马上停手。','靠近白色目标，持续按住 E。','点亮左侧第一个槽位。','鼠标指向新目标，按 Q。','三影联动，教学完成。'][step];$('tutorial-note').textContent=lesson.note;
 $('tutorial-progress').innerHTML=GUIDE.lessons.map((_,i)=>`<i class="${i<step?'done':i===step?'current':''}"></i>`).join('');
 $('tutorial-card').classList.remove('hidden');$('toast').classList.add('hidden');toastTimer=0;
}
function finishTutorial(){
 state.tutorial=null;$('tutorial-card').classList.add('hidden');state.kills=0;state.captures=0;state.hits=0;state.time=0;state.corruption=0;state.capture=0;state.captureTarget=null;
 state.levels=Object.fromEntries(shadowIds.map(id=>[id,0]));state.xp=Object.fromEntries(shadowIds.map(id=>[id,0]));player=newPlayer();start();
 toast('正式狩猎开始 · 探索三处印记，按 M 看地图，最终挑战月狼',4);
}
function updateTutorial(dt){
 const t=state.tutorial;if(!t)return;t.elapsed+=dt;
 if(t.step===0&&enemies[0]&&distance(player,enemies[0])<145)setTutorialStep(1);
 if(t.step===4&&t.skillHit)setTutorialStep(5);
 if(t.step===5&&t.elapsed>1.4){$('tutorial-card').classList.add('hidden');showModal('lessonComplete',`<div class="chapter-sigil">${uiGlyph('check')}</div><div class="modal-eyebrow">TUTORIAL COMPLETE</div><h2 id="modal-title">你已学会夺影。</h2><div class="visual-sequence">${['archer','fire','mirror'].map((id,i)=>`<div style="--shadow-color:${shadows[id].color}">${icon(id)}<b>${brief(id,i)}</b></div>`).join('')}</div><p class="choice-instruction">一枚新的影子，就能改变整套技能。</p><button class="primary" id="tutorial-finish">进入森林 ↗</button>`);$('tutorial-finish').onclick=finishTutorial;}
}
function updateContextHint(){
 $('tutorial-card').classList.toggle('hidden',!state.tutorial||state.phase!=='playing');
 const hint=$('context-hint');if(state.phase!=='playing'||state.tutorial){hint.classList.add('hidden');return;}
 const exposed=enemies.filter(e=>!e.dead&&e.exposed).sort((a,b)=>distance(a,player)-distance(b,player))[0];
 if(!exposed){hint.classList.add('hidden');return;}
 const near=distance(player,exposed)<115;
 hint.innerHTML=`<strong>${shadows[exposed.type].name}可夺取 · ${exposed.scout||state.mode==='practice'&&state.practiceTarget==='dummy'?'持续暴露':Math.ceil(exposed.exposed)+' 秒'}</strong><span>${near?'<kbd>按住 E</kbd> 学会能力':'先靠近白色敌人，再按住 E'} ${exposed.scout||state.objective?.kind==='capture'&&state.objective.targetId===exposed.id?' · 此目标必须夺取':'<i>或</i> 左键收割回血'}</span>`;
 hint.classList.remove('hidden');
}
function drawTutorialMarker(){
 const t=state.tutorial;if(!t||state.phase!=='playing')return;
 const e=enemies.find(e=>!e.dead);if(!e)return;
 const x=t.step===0?e.x-85:e.x,y=t.step===0?e.y+30:e.y;
 ctx.save();ctx.strokeStyle='#d3edab';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.ellipse(x,y+15,t.step===0?40:e.r+32,t.step===0?22:24,0,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#d7efb8';ctx.font='12px "Microsoft YaHei"';ctx.textAlign='center';
 ctx.fillText(t.step===0?'移动到这里':t.step===1?'鼠标瞄准 · 左键攻击':t.step===2?'靠近 · 长按 E':t.step>=4?'鼠标瞄准 · 按 Q':'',x,y+60);ctx.restore();
}


/* Modes and room objectives share the combat rules; modal phases freeze all timers. */
function takeCheckpoint(){
 return {journey:JOURNEY.normalize(state.journey),hp:player.hp,focus:player.focus,time:state.time,kills:state.kills,captures:state.captures,hits:state.hits,corruption:state.corruption,locked:state.locked,nightmare:state.nightmare,weapon:state.weapon,stored:state.stored,slots:[...state.slots],owned:[...state.owned],levels:{...state.levels},xp:{...state.xp}};
}
function retryObjective(){
 if(state.world){retryWorldMission();return;}
 const c=state.checkpoint,index=state.room,type=state.roomType;
 player=newPlayer();player.hp=c.hp;player.focus=c.focus;state.journey=JOURNEY.normalize(c.journey);
 for(const key of ['time','kills','captures','hits','corruption','locked','nightmare','weapon','stored'])state[key]=c[key];
 state.slots=[...c.slots];state.owned=new Set(c.owned);state.levels={...c.levels};state.xp={...c.xp};state.hitStop=0;
 enterRoom(index,type);
}
function setupObjective(kind){
 const o=state.objective={kind,status:'active',remaining:kind==='chase'?45:kind==='defend'?36:null,targetId:null,captured:false,wave:0,spawnIn:9};
 enemies=[];
 if(kind==='chase'){
  const e=spawnEnemy('mirror',840,270,true);e.waypoint=0;o.targetId=e.id;
  spawnEnemy('wolf',350,330);spawnEnemy('archer',740,510);
  $('room-name').textContent='破镜小径';$('objective').textContent='追上镜魔 · 45 秒内击破后收割或夺影';
 }else if(kind==='defend'){
  o.lantern={x:600,y:350,hp:100};spawnLanternWave();
  $('room-name').textContent='余烬庭院';$('objective').textContent='守住中央梦灯 36 秒 · 击破梦魇可打断攻击';
 }else{
  const e=spawnEnemy('ghost',610,270,true);o.targetId=e.id;
  spawnEnemy('shield',450,350,true);spawnEnemy('giant',790,360);
  $('room-name').textContent='缚影祭坛';$('objective').textContent='夺取金色标记的幽灵 · 击破后靠近长按 E';
 }
 $('room-tag').innerHTML=`${{chase:'追猎',defend:'守灯',capture:'夺影'}[kind]} <span>0${state.room+1} / 05</span>`;
 $('boss-hud').classList.add('hidden');
}
function showObjectiveBrief(){
 const k=state.objective.kind;
 if(state.world&&state.world.id!=='forest'){const s=state.objective.site;showModal('briefing',`<div class="modal-eyebrow">${campaignWorld().name} / Lv.${campaignWorld().level}</div><h2 id="modal-title">${s.name}</h2><p>${s.hint}。</p><div class="explain-box">${k==='capture'?'目标为金色标记的幽灵。击破后靠近并长按 E；收割受到保护，错过夺影窗口可再次击破。':k==='defend'?'梦灯耐久不能降到 0。四波敌人每隔 9 秒出现，击破正在攻击的敌人可打断攻击。':'镜魔会沿路径逃跑。计时内击破后收割或夺影；只有夺影会学会它的能力。'}</div><p>阅读时世界暂停。完成任务必得一件随机物品，并可选择猎人祝福。</p><button class="primary" id="mission-start">开始任务 ↗</button>`);$('mission-start').onclick=()=>closeModal('playing');return;}
 const data={chase:['追上它，别让影子逃走。','镜魔沿小径移动。45 秒内把它打出白色影子，再收割或夺取，就能通过。','想学会镜魔的能力，请选择长按 E 夺影。只收割会失去这次能力奖励。'],defend:['灯还亮着，梦就有归路。','守住中央梦灯 36 秒，耐久不能降到 0。敌人每隔 9 秒从林缘出现，共四波。','敌人接近梦灯后会蓄力攻击。用普攻或 Q 击破它们，可以打断攻击；目标优先级比清空敌群更重要。'],capture:['带回幽灵的能力。','击破金色标记的幽灵精英，然后靠近并长按 E。拿到它的影子就能通过。','只清空守卫不能完成任务。目标暴露后会受到收割保护；如果错过窗口，可以再次击破它。']}[k];
 const steps={chase:[['clock','45秒'],['arrow','追上镜魔'],['seal','收割或夺影']],defend:[['clock','36秒'],['home','守住梦灯'],['star','抵御四波']],capture:[['seal','锁定幽灵'],['star','击破变白'],['check','长按E夺影']]}[k];
 showModal('briefing',`<div class="chapter-sigil">${uiGlyph(k==='defend'?'home':k==='chase'?'arrow':'seal')}</div><div class="modal-eyebrow">${{chase:'追猎 / 破镜小径',defend:'守灯 / 余烬庭院',capture:'夺影 / 缚影祭坛'}[k]}</div><h2 id="modal-title">${{chase:'追上镜魔',defend:'守住最后的光',capture:'带回幽灵之影'}[k]}</h2><div class="objective-steps">${steps.map(([glyph,label])=>`<div>${uiGlyph(glyph)}<b>${label}</b></div>`).join('')}</div><details class="visual-details"><summary>任务规则</summary><p>${data[1]}</p><p>${data[2]}</p><p>阅读与换装时世界暂停。</p></details><button class="primary" id="mission-start">开始${{chase:'追猎',defend:'守灯',capture:'夺影'}[k]} ↗</button>`);
 $('mission-start').onclick=()=>closeModal('playing');
}
function spawnLanternWave(){
 const o=state.objective;o.wave++;
 const positions=[[190,190],[1020,580],[980,180],[190,600]];
 for(let i=0;i<2;i++){const pos=positions[(o.wave+i)%4];const p=missionPoint(pos[0],pos[1]);const e=spawnEnemy(o.wave===4&&i===1?'giant':'wolf',p.x,p.y);e.lanternHunter=true;if(state.world){e.mission=true;e.home={x:e.x,y:e.y};e.id='defend-wave-'+o.wave+'-'+i;}}
 if(o.wave>1)toast(`第 ${o.wave} / 4 波 · 梦魇正在靠近梦灯`,2.5);
}
function updateMissionEnemy(e,dt){
 const o=state.objective;if(!o||o.status!=='active')return false;
 if(o.kind==='chase'&&o.targetId===e.id){
  const points=[{x:990,y:250},{x:1000,y:590},{x:230,y:600},{x:220,y:200}].map(p=>missionPoint(p.x,p.y));
  const t=points[e.waypoint],a=angle(e,t);moveEntity(e,Math.cos(a)*108*dt,Math.sin(a)*108*dt);
  if(distance(e,t)<24)e.waypoint=(e.waypoint+1)%points.length;
  return true;
 }
 if(o.kind==='defend'&&e.lanternHunter){
  if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0)performEnemyAttack(e);return true;}
  e.cd-=dt;const a=angle(e,o.lantern);
  if(distance(e,o.lantern)>70)moveEntity(e,Math.cos(a)*68*dt,Math.sin(a)*68*dt);
  else if(e.cd<=0){e.target={x:o.lantern.x,y:o.lantern.y};e.attack='lantern';e.telegraph=.9;e.cd=2.3;}
  return true;
 }
 return false;
}
function updateObjective(dt){
 const o=state.objective;if(!o||o.status!=='active'||state.phase!=='playing')return;
 if(['hunt','survey','sequence','purify'].includes(o.kind)){updateCampaignObjective();return;}
 const target=enemies.find(e=>e.id===o.targetId);
 if(o.kind==='defend'){
  if(o.lantern.hp<=0){failObjective('梦灯熄灭了。','优先击破正在灯旁蓄力的敌人。震地和环形镜刃适合处理围攻。');return;}
  o.remaining=Math.max(0,o.remaining-dt);o.spawnIn-=dt;
  if(o.remaining===0){player.hp=clamp(player.hp+20,0,100);state.corruption=Math.max(0,state.corruption-15);completeObjective();return;}
  if(o.spawnIn<=0&&o.wave<4){o.spawnIn+=9;spawnLanternWave();}
 }else if(o.kind==='chase'){
  if(target?.dead){completeObjective();return;}
  o.remaining=Math.max(0,o.remaining-dt);
  if(o.remaining===0)failObjective('镜魔逃入了浓雾。','用 R 切换远程弓，或用突进技能截住它。击破后收割或夺影即可通过。');
 }else if(o.captured)completeObjective();
}
function completeObjective(){
 if(state.world){completeWorldMission();return;}
 state.objective.status='complete';enemies=[];projectiles=[];hazards=[];minions=[];effects=[];floating=[];
 state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');
 tone(720,.3);showRoute();
}
function failObjective(title,hint){
 state.objective.status='failed';
 showModal('missionFailed',`<div class="modal-eyebrow">任务未完成 · 可重试当前任务</div><h2 id="modal-title">${title}</h2><p>${hint}</p><div class="explain-box">重试会恢复任务开始时的生命、梦蚀、装备、药剂与战绩。${state.world?'返回营地同样还原本次任务，保留此前的探索收获。':'返回首页会结束本局。'}</div><div class="modal-actions"><button class="primary" id="mission-retry">重试本任务 ↗</button><button class="secondary" id="mission-home">${state.world?'返回营地':'返回首页'}</button></div>`);
 $('mission-retry').onclick=retryObjective;$('mission-home').onclick=()=>state.world?leaveWorldMission():reset();
}
function requestPractice(){
 if(state.phase==='intro'){startPractice();return;}
 if(!['playing','paused','map'].includes(state.phase))return;
 if(state.tutorial){toast('请先完成或跳过教学，再进入自由试炼');return;}
 const previous=state.phase==='paused'?modalReturn:state.phase;
 showModal('modeChoice',`<div class="modal-eyebrow">自由试炼</div><h2 id="modal-title">试试每一种影子。</h2><p>全部八种能力开放，换装免费，不会受伤，也不积累梦蚀。可以切换木桩和敌群。</p><div class="explain-box">进入试炼会结束当前狩猎。试炼装备不会带入新的正式狩猎。</div><div class="modal-actions"><button class="primary" id="enter-practice">结束本局，进入试炼 ↗</button><button class="secondary" id="cancel-practice">留在当前狩猎</button></div>`);
 $('enter-practice').onclick=startPractice;$('cancel-practice').onclick=()=>previous==='map'?showRoute():closeModal(previous);
}
function startPractice(){
 requestAnimationFrame(()=>window.scrollTo(0,0));reset();state.mode='practice';state.phase='playing';state.owned=new Set(shadowIds);player.focus=100;
 $('intro').classList.add('hidden');$('room-name').textContent='月下试炼场';$('room-tag').innerHTML='自由试炼 <span>8 / 8 影子开放</span>';
 practiceTargets('dummy');updateBuild();updateUI();canvas.focus({preventScroll:true});
 toast('按 Tab 免费换装 · Q 测试组合 · 重置状态可以立即再试',4);
}
function practiceTargets(kind){
 if(state.mode!=='practice'||state.phase!=='playing')return;
 state.practiceTarget=kind;state.clearTimer=0;state.capture=0;state.captureTarget=null;
 enemies=[];projectiles=[];effects=[];minions=[];hazards=[];floating=[];keys={};mouse.down=false;
 $('capture-hud').classList.add('hidden');
 player.x=510;player.y=480;
 if(kind==='dummy'){const e=spawnEnemy('giant',780,410);e.hp=e.maxHp=600;e.pressure=e.maxPressure=160;}
 else ['wolf','shield','archer','fire'].forEach((id,i)=>spawnEnemy(id,450+i*140,230+i%2*90));
 $('objective').textContent=kind==='dummy'?'木桩不会攻击 · 暴露后可练习夺影 · 清空后自动补充':'真实敌群 · 你不会受伤 · 清空后自动补充';
 refreshPractice();
}
function refreshPractice(){
 if(state.mode!=='practice'||state.phase!=='playing')return;
 projectiles=[];effects=[];hazards=[];minions=[];floating=[];player.shield=0;player.dash=0;state.capture=0;state.captureTarget=null;keys={};mouse.down=false;$('capture-hud').classList.add('hidden');
 state.skillCd=0;state.dashCd=0;state.attackCd=0;state.corruption=0;state.locked=false;state.nightmare=0;player.hp=100;player.focus=100;
 updateBuild();updateUI();canvas.focus({preventScroll:true});
}
function updateModeUI(){
 const active=state.phase!=='intro'&&!(modalReturn==='intro'&&['guide','codex','build','skillinfo','paused'].includes(state.phase));
 $('app-shell').classList.toggle('in-combat',active);
 $('app-shell').classList.toggle('is-practice',state.mode==='practice');
 $('compact-build').classList.toggle('hidden',!active||!!state.tutorial);
 $('practice-toolbar').classList.toggle('hidden',state.mode!=='practice');
 $('practice-dummy').classList.toggle('selected',state.practiceTarget==='dummy');
 $('practice-mobs').classList.toggle('selected',state.practiceTarget==='mobs');
 $('compact-cost').textContent=state.mode==='practice'?'试炼：梦蚀关闭 · 免费换装':`梦蚀 ${Math.floor(state.corruption)} / 100 · ${state.locked?'回响已封印':state.nightmare>0?'梦魇强化中':state.corruption>=75?'治疗减半':`每次 Q +${skillCorruptionCost()}`}`;
 const o=state.objective,hud=$('mission-hud');if(o&&['hunt','survey','sequence','purify'].includes(o.kind)){hud.classList.toggle('hidden',state.phase!=='playing');hud.innerHTML=o.kind==='hunt'?`<b>${o.site.name}</b><span>清剿 ${o.targets.filter(id=>enemies.find(e=>e.id===id)?.dead).length} / ${o.targets.length} · 标记守卫</span>`:`<b>${o.site.name} · ${o.activated.length} / 3</b><span>${o.kind==='sequence'?'日 → 月 → 星':'循光标探索'} · 靠近按 F</span>`;return;}hud.classList.toggle('hidden',!o||o.kind==='boss'||state.phase!=='playing');
 if(o){hud.innerHTML=o.kind==='defend'?`<b>守灯 ${Math.ceil(o.remaining)}s</b><span>耐久 ${Math.ceil(o.lantern.hp)} / 100 · 第 ${o.wave} / 4 波</span><i style="--progress:${o.lantern.hp}%"></i>`:o.kind==='chase'?`<b>追猎 ${Math.ceil(o.remaining)}s</b><span>金色标记 · 镜魔</span><i style="--progress:${o.remaining/45*100}%"></i>`:'<b>夺取幽灵影</b><span>击破 → 靠近 → 长按 E</span>';}
}
function captureFeedback(e){
 const el=$('capture-flight');el.innerHTML=icon(e.type);const p=pointOnScreen(e);el.style.left=(p.x*100)+'%';el.style.top=(p.y*100)+'%';el.style.animation='none';void el.offsetWidth;el.style.animation='shadow-arrival .9s ease-in-out forwards';
 ring(e.x,e.y,120,'#d9ffe8',.8);screenShake=4;
}
function drawMissionScenery(){
 const o=state.objective;
 if(state.mode==='practice'){
  ctx.save();ctx.strokeStyle='#a6d4c333';ctx.setLineDash([6,10]);
  for(let r=80;r<=240;r+=80){ctx.beginPath();ctx.ellipse(780,410,r,r*.65,0,0,TAU);ctx.stroke();}
  ctx.setLineDash([]);ctx.fillStyle='#b9ddc4';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('月下试炼 · 随时换装，自由尝试',600,165);ctx.restore();
 }
 if(!o)return;
 if(o.kind==='defend'){
  const l=o.lantern;glow(l.x,l.y-20,180,'#edc67525');
  ctx.save();ctx.strokeStyle='#e8cc873f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(l.x,l.y,95,60,0,0,TAU);ctx.stroke();
  path([[l.x-16,l.y+15],[l.x-8,l.y-13],[l.x+8,l.y-13],[l.x+16,l.y+15]],'#49615a','#afbb89');
  path([[l.x-13,l.y-13],[l.x-10,l.y-54],[l.x+10,l.y-54],[l.x+13,l.y-13]],'#685b30','#f0d69d');
  glow(l.x,l.y-34,45,'#f4d58b99');ellipse(l.x,l.y-34,4+Math.sin(clock*6),12,'#ffe2a0');
  ctx.font='12px sans-serif';ctx.fillStyle='#eed8a2';ctx.textAlign='center';ctx.fillText('梦灯 · '+Math.ceil(l.hp)+' / 100',l.x,l.y+42);ctx.restore();
 }else if(o.kind==='chase'){
  ctx.save();ctx.setLineDash([7,18]);ctx.strokeStyle='#d3ba722e';ctx.lineWidth=3;ctx.strokeRect(220,200,780,400);ctx.restore();
  glow(1000,200,100,'#bca1d428');
 }else{
  glow(610,270,180,'#a98bd02e');ctx.save();ctx.strokeStyle='#c6a0e754';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(610,270,115,65,0,0,TAU);ctx.stroke();ctx.restore();
 }
}

/* Continuous expedition. All combat positions are world coordinates; HUD stays in screen space. */
const CAMPAIGN=window.HUNTER_CAMPAIGN;
let WORLD=window.HUNTER_WORLD;
function campaignWorld(){return CAMPAIGN.worlds.find(w=>w.id===(state.world?.id||'forest'));}
function showCampaignIntro(){
 const w=campaignWorld();showModal('worldIntro',`<div class="modal-eyebrow">WORLD ${w.number} / Lv.${w.level}–${w.level+2}</div><div class="campaign-intro-sigil" style="color:${w.color}">${w.symbol}</div><h2 id="modal-title">${w.name}</h2><p>${w.description}</p><div class="campaign-missions">${WORLD.sites.filter(s=>s.kind!=='camp').map((s,i)=>`<div><span>${i===3?'☾':'0'+(i+1)}</span><b>${s.name}</b><small>${s.hint}</small></div>`).join('')}</div><p class="fine-print">每次出发重置任务，奖励重新随机抽取；已学影子、行囊和世界解锁保留，祝福与影子等级重新成长。完成任务必得随机物品，首次通关必得此境护符。</p><div class="control-chips"><span><kbd>M</kbd>区域地图</span><span><kbd>N</kbd>五境星图</span><span><kbd>F</kbd>互动</span><span><kbd>B</kbd>回营</span></div><button class="primary" id="world-begin">开始探索 ↗</button>`);
 $('world-begin').onclick=()=>{closeModal('playing');if(state.world.saveOnBegin||EXPEDITION.read(campStorage()).status==='empty')saveCamp();};
}
function campaignSave(){const ok=CAMPAIGN.save(campStorage(),state.campaign);if(!ok)toast('世界进度暂存在本页；浏览器未能写入，请保留页面并稍后重试保存。',6);return ok;}
function expeditionReward(token,kind){
 if(!state.world||state.mode!=='hunt')return null;
 const result=CAMPAIGN.reward(state.campaign,state.world.id,state.world.visit+':'+token,kind);
 if(!result.duplicate){campaignSave();if(result.item){const item=CAMPAIGN.items[result.item];toast(`获得 ${item.rarity} · ${item.name} ×1（已放入行囊）`,3);}}
 return result.item;
}
function lootMarkup(id){const item=CAMPAIGN.items[id];return item?`<span class="loot-pill ${item.kind}">${item.rarity} · ${item.name} ×1</span>`:'';}
let atlasReturn='intro',atlasSelected='forest';
function openAtlas(selected){
 if(!['intro','playing','paused','camp','worldmap','atlas','worldVictory','inventory'].includes(state.phase)||state.tutorial||state.mode==='practice')return;
 if(state.phase!=='atlas'&&state.phase!=='inventory')atlasReturn=state.phase==='paused'?'playing':state.phase;
 atlasSelected=CAMPAIGN.worlds.some(w=>w.id===selected)?selected:state.world?.id||atlasSelected;
 const p=state.campaign,w=CAMPAIGN.worlds.find(w=>w.id===atlasSelected),available=CAMPAIGN.unlocked(p,w.id),missing=w.requires.filter(id=>!p.cleared.includes(id));
 const canTravel=!state.world||state.phase==='worldVictory'||atlasReturn==='worldVictory'||(!state.objective&&distance(player,WORLD.sites[0])<130&&!campThreat());
 const edges=CAMPAIGN.worlds.flatMap(b=>b.requires.map(id=>{const a=CAMPAIGN.worlds.find(w=>w.id===id);return `<path class="${p.cleared.includes(a.id)?'open':''}" d="M${a.pos[0]} ${a.pos[1]} L${b.pos[0]} ${b.pos[1]}"/>`;})).join('');
 const mobilePositions=[[50,15],[25,36],[75,36],[50,58],[50,80]];
 const mobileSvg=`<svg class="atlas-mobile-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="atlas-edges">${CAMPAIGN.worlds.flatMap(b=>b.requires.map(id=>{const a=CAMPAIGN.worlds.find(w=>w.id===id);return `<path class="${p.cleared.includes(a.id)?'open':''}" d="M${mobilePositions[a.number-1].join(' ')} L${mobilePositions[b.number-1].join(' ')}"/>`;})).join('')}</g></svg>`;
 showModal('atlas',`<div class="atlas-heading"><div><div class="modal-eyebrow">ATLAS / 破晓航路</div><h2 id="modal-title">长梦之外，还有世界。</h2></div><span class="atlas-count">${p.cleared.length}<small> / 5 世界已通关</small></span></div><div class="atlas-layout"><div class="atlas-chart"><span class="atlas-chart-label">五境星图 · 点击节点查看</span>${mobileSvg}<svg class="atlas-desktop-edges" viewBox="0 0 850 440" aria-hidden="true"><g class="atlas-edges">${edges}</g>${CAMPAIGN.worlds.map(n=>`<circle cx="${n.pos[0]}" cy="${n.pos[1]}" r="53" fill="${n.color}0c" stroke="${n.color}25"/>`).join('')}</svg>${CAMPAIGN.worlds.map(n=>{const clear=p.cleared.includes(n.id),open=CAMPAIGN.unlocked(p,n.id);return `<button class="atlas-node ${clear?'cleared':''} ${open?'unlocked':'locked'} ${w.id===n.id?'selected':''}" data-world="${n.id}" style="left:${n.pos[0]/850*100}%;top:${n.pos[1]/440*100}%;--world-color:${n.color}" aria-label="世界 ${n.number} ${n.name}，${clear?'已通关':open?'可前往':'未解锁'}" aria-pressed="${w.id===n.id}"><span>${clear?'✓':n.number.toString().padStart(2,'0')}</span><b>${n.name}</b><small>${clear?'已通关 · 可重访':open?'航路已开启':'航路未开启'}</small></button>`;}).join('')}<span class="atlas-chart-note">1 → 2 + 3　·　2 & 3 → 4　·　4 → 5</span></div><section class="atlas-detail" style="--world-color:${w.color}"><div class="atlas-world-icon">${w.symbol}</div><small>WORLD ${w.number.toString().padStart(2,'0')} / Lv.${w.level}–${w.level+2}</small><h3>${w.name}</h3><p class="atlas-subtitle">${w.subtitle}</p><p>${w.description}</p><div class="atlas-feature">${w.feature}<br>首领 · ${w.boss}</div><h4>此境战利品</h4><div class="atlas-loot">${w.loot.map(id=>`<span title="${CAMPAIGN.items[id].description}">${CAMPAIGN.items[id].name}</span>`).join('')}</div><p class="atlas-requirement">${missing.length?'需先通关：'+missing.map(id=>CAMPAIGN.worlds.find(n=>n.id===id).name).join(' ＋ '):p.cleared.includes(w.id)?`已完成 ${p.clears[w.id]||1} 次 · 重访会刷新任务与随机掉落`:'航路已开启 · 完成三处任务与首领即可通关'}</p><button class="primary" id="atlas-travel" ${!available||!canTravel?'disabled':''}>${available?(p.cleared.includes(w.id)?'重新探索':'前往世界')+' '+w.number+' ↗':'尚未解锁'}</button>${!canTravel?'<small class="atlas-travel-note">完成当前任务，脱战回到营地后出发。</small>':''}</section></div><p class="fine-print">出发会刷新所选地图的任务与敌群；已解锁世界、行囊和护符保留。首次通关必得专属护符。切换世界时自动建立新营地存档。</p><div class="modal-actions"><button class="secondary" id="atlas-bag">行囊与护符 · ${Object.values(p.inventory).reduce((a,b)=>a+b,0)} 件</button><button class="secondary" id="atlas-close">${atlasReturn==='intro'?'返回标题':'返回当前旅途'}</button></div><p class="campaign-save-note">${CAMPAIGN.storageOK?'世界解锁与战利品自动保存在当前浏览器。':'存储不可用：进度暂存本页，请保留页面。'}</p>`);
 $('modal-card').querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>openAtlas(b.dataset.world));
 $('atlas-travel').onclick=()=>{if(available&&canTravel)travelWorld(w.id);};$('atlas-close').onclick=closeAtlas;$('atlas-bag').onclick=()=>openInventory('atlas');
}
function closeAtlas(){if(atlasReturn==='camp')openCamp();else if(atlasReturn==='worldmap'){closeModal('playing');openWorldMap();}else if(atlasReturn==='worldVictory')showWorldVictory();else closeModal(atlasReturn);}
function travelWorld(id){
 if(!CAMPAIGN.unlocked(state.campaign,id))return false;
 if(state.world&&atlasReturn!=='worldVictory'&&(state.objective||distance(player,WORLD.sites[0])>=130||campThreat()))return false;
 const owned=new Set(state.owned),slots=[...state.slots],profile=state.campaign;
 state=freshState();state.campaign=profile;state.owned=owned;state.slots=slots;player=newPlayer();
 enterWorld(id);state.world.saveOnBegin=true;return true;
}
let inventoryReturn='camp';
function openInventory(back){
 if(!['atlas','camp','inventory','worldVictory'].includes(state.phase))return;
 if(state.phase!=='inventory')inventoryReturn=back||state.phase;
 const p=state.campaign,canUse=!!state.world&&!state.objective&&!campThreat()&&distance(player,WORLD.sites[0])<130;
 showModal('inventory',`<div class="modal-eyebrow">SATCHEL / 跨世界保留</div><h2 id="modal-title">旅途带回的东西。</h2><p>补给品在营地使用；护符同时佩戴一件，在正式探索中生效。重复护符保留在行囊，不叠加属性。</p><p class="inventory-equipped">已佩戴：${p.equipped?CAMPAIGN.items[p.equipped].name+' · '+CAMPAIGN.items[p.equipped].description:'暂无护符'}</p><div class="inventory-grid">${Object.entries(p.inventory).filter(([,n])=>n>0).map(([id,n])=>{const item=CAMPAIGN.items[id];return `<article class="inventory-item ${item.kind}"><small>${item.rarity} · ${CAMPAIGN.worlds.find(w=>w.id===item.world).name}</small><h3>${item.name}<span>×${n}</span></h3><p>${item.description}</p><button class="secondary" data-item="${id}" ${item.kind==='supply'&&!canUse||item.kind==='relic'&&p.equipped===id?'disabled':''}>${item.kind==='relic'?p.equipped===id?'已佩戴':'佩戴护符':canUse?'使用一份':'回营地使用'}</button></article>`;}).join('')||'<p class="inventory-empty">行囊还是空的。击败梦魇、完成任务或通关世界，收集属于此境的战利品。</p>'}</div><button class="primary" id="inventory-close">返回 ↗</button><p class="campaign-save-note">${CAMPAIGN.storageOK?'物品与护符自动保存；使用补给后会同步保存营地状态。':'存储不可用：当前收获暂存本页。'}</p>`);
 $('modal-card').querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>useCampaignItem(b.dataset.item));
 $('inventory-close').onclick=()=>{if(inventoryReturn==='atlas')openAtlas(atlasSelected);else if(inventoryReturn==='worldVictory')showWorldVictory();else openCamp();};
}
function useCampaignItem(id){
 const item=CAMPAIGN.items[id],p=state.campaign;if(state.phase!=='inventory'||!item||!p.inventory[id])return false;
 if(item.kind==='relic')p.equipped=id;
 else{if(!state.world||state.objective||campThreat()||distance(player,WORLD.sites[0])>=130)return false;const e=item.effect;
  if(e.heal&&player.hp>=100||e.focus&&player.focus>=100||e.purge&&state.corruption<=0){toast('当前无需这份补给，物品已保留。');return false;}
  player.hp=clamp(player.hp+(e.heal||0)*(state.corruption>=75?.5:1),0,100);player.focus=clamp(player.focus+(e.focus||0),0,100);state.corruption=clamp(state.corruption-(e.purge||0),0,100);p.inventory[id]--;
 }
 campaignSave();if(item.kind==='supply'){state.phase='camp';saveCamp();state.phase='inventory';}updateBuild();openInventory();return true;
}
function completeCampaignWorld(){
 if(!state.world||!state.bossWon)return;
 if(!state.world.victory){state.world.victory=CAMPAIGN.complete(state.campaign,state.world.id,state.world.visit)||{item:null};campaignSave();state.objective=null;state.pendingBoons=[];enemies=enemies.filter(e=>!e.mission);hazards=[];projectiles=[];minions=[];state.releaseRecorded=true;window.HUNTER_RELEASE?.record({ending:'dawn',time:Math.max(1,state.time),kills:state.kills,captures:state.captures});}
 showWorldVictory();
}
function showWorldVictory(){
 const w=campaignWorld(),reward=state.world.victory||{},all=state.campaign.cleared.length===5;
 window.HUNTER_AUDIO?.setScene('victory');
 showModal('worldVictory',`<div class="ending-emblem dawn">${w.symbol}</div><div class="modal-eyebrow">WORLD ${w.number} COMPLETE / ${state.campaign.cleared.length} OF 5</div><h2 id="modal-title">${all?'五境破晓，长梦终尽。':w.name+'，已迎来黎明。'}</h2><p>三枚印记汇聚，${w.boss}的封印已经解除。${all?'所有世界均已通关，你仍可重返任意世界，尝试新的构筑。':'星图上的新航路已亮起，下一段旅途由你决定。'}</p><div class="victory-loot">${lootMarkup(reward.item)}${reward.guaranteed&&reward.guaranteed!==reward.item?lootMarkup(reward.guaranteed):''}</div><p>${reward.guaranteed?'首次通关专属护符已入行囊。':'通关战利品已入行囊。'}世界解锁与物品${CAMPAIGN.storageOK?'已自动保存':'暂存本页，尚未写入浏览器'}。</p><div class="modal-actions"><button class="primary" id="victory-atlas">展开五境星图 ↗</button><button class="secondary" id="victory-bag">查看行囊</button><button class="secondary" id="victory-home">返回标题</button></div>`);
 $('victory-atlas').onclick=()=>openAtlas(CAMPAIGN.worlds.find(n=>!state.campaign.cleared.includes(n.id)&&CAMPAIGN.unlocked(state.campaign,n.id))?.id||w.id);$('victory-bag').onclick=()=>openInventory('worldVictory');$('victory-home').onclick=reset;
}
function setupCampaignObjective(site){
 const o=state.objective={kind:site.kind,status:'active',site,targetId:null,remaining:null,nodes:[],activated:[],targets:[]};
 if(site.kind==='hunt'){for(let i=0;i<4;i++){const w=campaignWorld(),p=nearestFreeWorldPosition(site.x+(i%2?170:-170),site.y+(i<2?-140:140),24),e=spawnWorldEnemy(w.enemies[i%w.enemies.length],p.x,p.y,i===3);e.mission=true;e.id=`${site.id}-hunt-${i}`;o.targets.push(e.id);}}
 else{const offsets=[[-220,-170],[230,-120],[0,230]];o.nodes=offsets.map(([x,y],i)=>({...nearestFreeWorldPosition(site.x+x,site.y+y,20),name:site.kind==='sequence'?['日','月','星'][i]:site.kind==='purify'?`裂隙 ${i+1}`:`${state.world.id==='forge'?'阀门':'航标'} ${i+1}`,color:site.color}));if(site.kind==='purify')o.nodes.forEach((n,i)=>{const e=spawnWorldEnemy(campaignWorld().enemies[i%3],n.x+35,n.y+25,true);e.mission=true;e.id=`${site.id}-guard-${i}`;});}
 showModal('briefing',`<div class="modal-eyebrow">${campaignWorld().name} / Lv.${campaignWorld().level}</div><h2 id="modal-title">${site.name}</h2><p>${site.hint}。</p><div class="explain-box">${site.kind==='hunt'?'只有本任务的四名标记守卫计入目标；击破后收割或夺影。':site.kind==='sequence'?'三个石碑显示日、月、星。必须按此顺序激活；顺序错误会重置本轮机关，不扣除生命。':'跟随方向标到达三个发光标记，靠近 100 步内按 F。'+(site.kind==='purify'?'先清除标记周围的守卫。':'无需清空整张地图。')}</div><p>完成任务必得一件随机战利品，并可选择猎人祝福。</p><button class="primary" id="mission-start">开始任务 ↗</button>`);$('mission-start').onclick=()=>closeModal('playing');
}
function interactCampaignNode(){
 const o=state.objective;if(!o?.nodes?.length)return false;
 const i=o.nodes.findIndex((n,j)=>!o.activated.includes(j)&&distance(player,n)<100);if(i<0){toast('循方向标寻找尚未激活的标记，靠近后按 F。');return true;}
 if(o.kind==='purify'&&enemies.some(e=>e.mission&&!e.dead&&distance(e,o.nodes[i])<300)){toast('裂隙守卫仍在附近，先收割或夺取它的影子。');return true;}
 if(o.kind==='sequence'&&i!==o.activated.length){o.activated=[];toast('机关次序错误，已重置：日 → 月 → 星。');return true;}
 o.activated.push(i);ring(o.nodes[i].x,o.nodes[i].y,100,'#d1e6ac');toast(`${o.nodes[i].name} 已激活 · ${o.activated.length} / 3`);if(o.activated.length===3)completeWorldMission();return true;
}
function updateCampaignObjective(){const o=state.objective;if(o?.kind==='hunt'&&o.targets.every(id=>enemies.find(e=>e.id===id)?.dead))completeWorldMission();}
function drawCampaignNodes(){const o=state.objective;if(!o?.nodes)return;for(const [i,n] of o.nodes.entries()){const done=o.activated.includes(i);glow(n.x,n.y,80,done?'#cde7a025':'#bfa3e544');ctx.strokeStyle=done?'#bad6a0':n.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(n.x,n.y,40,0,TAU);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#edf3dc';ctx.font='16px sans-serif';ctx.fillText(done?'✓':n.name,n.x,n.y+5);ctx.font='12px sans-serif';ctx.fillText(done?'已激活':distance(player,n)<100?'按 F 激活':'靠近此处',n.x,n.y+64);}}
const VIEW_RANGE={min:50,max:200,default:100,key:'shadow-hunter-view-range-v1'};
function readViewRange(){
 try{const value=Number(localStorage.getItem(VIEW_RANGE.key));if(Number.isFinite(value)&&value>=VIEW_RANGE.min&&value<=VIEW_RANGE.max)return Math.round(value);}catch{}
 return VIEW_RANGE.default;
}
let viewRange=readViewRange(),wheelRemainder=0;
const camera={x:0,y:0,w:1100,h:700,range:viewRange/100};
let worldGround=null,worldScenery=null;
function worldWidth(){return state.world?WORLD.width:W;}
function worldHeight(){return state.world?WORLD.height:H;}
function pointOnScreen(p){return state.world?{x:(p.x-camera.x)/camera.w,y:(p.y-camera.y)/camera.h}:{x:p.x/W,y:p.y/H};}
function updateViewControls(){
 $('view-range').value=String(viewRange);$('view-value').textContent=`${viewRange}%`;
 $('view-range').setAttribute('aria-valuetext',`${viewRange}% 视野范围，数值越大看得越远`);
 $('view-near').disabled=viewRange<=VIEW_RANGE.min;$('view-far').disabled=viewRange>=VIEW_RANGE.max;
}
function setViewRange(value){
 if(!Number.isFinite(Number(value)))return;
 wheelRemainder=0;
 viewRange=clamp(Math.round(Number(value)),VIEW_RANGE.min,VIEW_RANGE.max);
 updateViewControls();
 try{localStorage.setItem(VIEW_RANGE.key,String(viewRange));}catch{}
}
function cameraWorldRect(){
 const x=clamp(camera.x,0,WORLD.width),y=clamp(camera.y,0,WORLD.height);
 return {x,y,w:Math.max(0,Math.min(camera.x+camera.w,WORLD.width)-x),h:Math.max(0,Math.min(camera.y+camera.h,WORLD.height)-y)};
}
function updateCamera(dt,snap=false){
 if(!state.world)return;
 const ratio=Math.max(1,canvas.clientHeight)/Math.max(1,canvas.clientWidth),target=viewRange/100;
 camera.range+=(target-camera.range)*(snap?1:1-Math.exp(-dt*14));
 if(Math.abs(camera.range-target)<.0001)camera.range=target;
 camera.h=Math.min(850,1100*ratio)*camera.range;camera.w=camera.h/ratio;
 // Keep the hunter at the centre even at the forest edge. Only terrain drawing
 // is clipped to the world; the camera must not drift towards the mouse or edge.
 camera.x=player.x-camera.w*.5;camera.y=player.y-camera.h*.5;
 mouse.x=camera.x+(mouse.u??.65)*camera.w;mouse.y=camera.y+(mouse.v??.45)*camera.h;
}
function changeViewByWheel(e){
 if(!state.world||state.phase!=='playing'||e.ctrlKey||e.metaKey||e.altKey||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
 e.preventDefault();mousePosition(e);
 const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
 const next=clamp(viewRange*Math.exp(clamp(pixels,-240,240)*.0015)+wheelRemainder,VIEW_RANGE.min,VIEW_RANGE.max);
 setViewRange(next);wheelRemainder=next-viewRange;
}
function worldVisible(x,y,pad=130){return x>camera.x-pad&&x<camera.x+camera.w+pad&&y>camera.y-pad&&y<camera.y+camera.h+pad;}
function enterWorld(id='forest',visit=null){
 WORLD=CAMPAIGN.map(id);worldGround=null;worldScenery=null;
 state.world={id,visit:visit||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),completed:new Set(),visited:new Set(),track:'chase',region:null,restCharges:1,terrainTick:0,near:null,missionCheckpoint:null};
 state.objective=null;state.room=0;state.roomType='world';state.phase='playing';state.bossWon=false;
 enemies=[];effects=[];hazards=[];projectiles=[];minions=[];floating=[];state.capture=0;state.captureTarget=null;
 player.x=WORLD.sites[0].x;player.y=WORLD.sites[0].y;player.invincible=2;state.skillCd=0;state.dashCd=0;
 if(!worldGround){worldScenery=WORLD.create();worldGround=document.createElement('canvas');worldGround.width=WORLD.width;worldGround.height=WORLD.height;WORLD.drawGround(worldGround.getContext('2d'));}
 for(const pack of WORLD.packs)pack.types.forEach((id,i)=>spawnWorldEnemy(id,pack.x+(i%2)*72,pack.y+Math.floor(i/2)*66));
 initializeDiscoveries();
 updateCamera(0,true);updateBuild();updateUI();
 if(id!=='forest'){showCampaignIntro();return;}
 showModal('worldIntro',`<div class="modal-eyebrow">THE MOONLIT FOREST</div><h2 id="modal-title">三枚印记，一场终猎。</h2><div class="chapter-route"><span>${uiGlyph('arrow')}追猎</span><i>→</i><span>${uiGlyph('home')}守灯</span><i>→</i><span>${uiGlyph('seal')}夺影</span><i>→</i><span>☾<b>月狼</b></span></div><div class="first-stop">${uiGlyph('box')}<div><small>你的第一站</small><b>沿北方石路，寻找斥候补给箱。</b></div></div><div class="control-chips"><span><kbd>M</kbd>地图</span><span><kbd>F</kbd>互动 / 保存</span><span><kbd>C</kbd>喝药</span><span><kbd>B</kbd>回营</span><span><kbd>TAB</kbd>编织</span></div><details class="visual-details"><summary>探索与保存规则</summary><p>完成三处任务后前往东北方月狼之巢。每处任务选一份祝福，补充一瓶月露。首次出发自动建立营地存档；之后回营按 F 保存。深河走桥，浅沼减速，余烬灼伤。B 需脱战静止 3 秒。滚轮调整视野，0 复位。打开面板暂停世界。</p></details><button class="primary" id="world-begin">踏入森林 ↗</button>`);
 $('world-begin').onclick=()=>{closeModal('playing');const status=EXPEDITION.read(campStorage()).status;if(state.world.saveOnBegin||status==='empty')saveCamp();else if(status==='ready')toast('沿石路向北，寻找斥候补给箱 · 现有存档仅在营地手动覆盖',4);else toast('当前没有可用存档；可以继续探索，回营地后尝试保存。',5);};
}
function spawnWorldEnemy(id,x,y,elite=false){
 const v=WORLD.variants[id],e=spawnEnemy(v?v.shadow:id,x,y,elite);
 e.variant=v?id:null;e.home={x,y};e.facing=Math.PI/2;e.aggro=false;e.patrol=Math.random()*TAU;
 if(v){const health={cinder:90,stalker:80,sentinel:145}[id];e.hp=e.maxHp=Math.round(health*(1+(campaignWorld().level-1)*.09));e.pressure=e.maxPressure=id==='sentinel'?80:60;e.r=id==='sentinel'?23:18;}
 if(state.world&&worldScenery){const free=nearestFreeWorldPosition(e.x,e.y,e.r);e.x=free.x;e.y=free.y;e.home={...free};}return e;
}
function worldPositionFree(x,y,r){
 if(x<r+25||y<r+25||x>WORLD.width-r-25||y>WORLD.height-r-25)return false;
 for(const w of WORLD.walls){const nx=clamp(x,w.x,w.x+w.w),ny=clamp(y,w.y,w.y+w.h);if(Math.hypot(x-nx,y-ny)<r)return false;}
 for(const o of worldScenery.rocks)if(Math.hypot(x-o.x,y-o.y)<r+o.r)return false;
 return true;
}
function nearestFreeWorldPosition(x,y,r){
 if(worldPositionFree(x,y,r))return {x,y};
 for(let radius=8;radius<=480;radius+=8)for(let i=0;i<24;i++){const a=i*TAU/24,tx=x+Math.cos(a)*radius,ty=y+Math.sin(a)*radius;if(worldPositionFree(tx,ty,r))return {x:tx,y:ty};}
 return {x:WORLD.sites[0].x,y:WORLD.sites[0].y};
}
function moveWorldEntity(entity,dx,dy){
 // Swept small steps stop both dashes and skill movement tunnelling through a river or wall.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));
 for(let i=0;i<steps;i++){
  const nx=entity.x+dx/steps,ny=entity.y+dy/steps;
  if(worldPositionFree(nx,entity.y,entity.r))entity.x=nx;
  if(worldPositionFree(entity.x,ny,entity.r))entity.y=ny;
 }
}
function worldTravelEnd(x,y,tx,ty,r=15){
 if(!state.world)return {x:tx,y:ty};
 const probe={x,y,r};moveWorldEntity(probe,tx-x,ty-y);return {x:probe.x,y:probe.y};
}
function projectileBlocked(p){
 if(!state.world)return false;const x0=p.previousX??p.x,y0=p.previousY??p.y,dx=p.x-x0,dy=p.y-y0,r=p.r||0;
 return WORLD.walls.some(w=>{
  if(w.kind!=='wall')return false;let lo=0,hi=1;
  for(const [start,delta,min,max] of [[x0,dx,w.x-r,w.x+w.w+r],[y0,dy,w.y-r,w.y+w.h+r]]){
   if(Math.abs(delta)<1e-9){if(start<min||start>max)return false;continue;}
   const a=(min-start)/delta,b=(max-start)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;
  }
  return true;
 });
}

function worldMoveSpeed(){
 if(!state.world)return 224;
 const mud=WORLD.terrainAt(player.x,player.y)?.kind==='mud';
 const poison=hazards.some(h=>h.poison&&distance(player,h)<h.r);
 return mud||poison?145:224;
}
function updateWorld(dt){
 if(!state.world||state.phase!=='playing')return;
 const w=state.world,region=WORLD.regionAt(player.x,player.y);
 if(w.region!==region.id){w.region=region.id;w.visited.add(region.id);toast(`${region.name} · ${region.hint}`,4);}
 w.near=allWorldSites().find(s=>distance(player,s)<130)||null;updateDiscoveries();
 w.terrainTick-=dt;
 if(w.terrainTick<=0){w.terrainTick=.8;if(WORLD.terrainAt(player.x,player.y)?.kind==='embers'){hitPlayer(6);textFloat(player.x,player.y-38,'余烬灼伤','#e5a071');}}
 if(state.bossWon&&state.phase==='playing')endRun(true);
}
function updateWorldEnemy(e,dt){
 if(!state.world||e.mission&&!e.variant)return false;
 const home=e.home||(e.home={x:e.x,y:e.y}),d=distance(e,player),away=distance(e,home);
 if(e.scout&&!e.aggro&&d>240)return true;
 if(d>720&&!e.aggro)return true;
 if(away>620||d>820)e.aggro=false;
 else if(d<430)e.aggro=true;
 if(!e.aggro){
  e.telegraph=0;e.dash=0;e.patrol+=dt*.45;
  const target=away>90?home:{x:home.x+Math.cos(e.patrol)*45,y:home.y+Math.sin(e.patrol)*30};
  if(distance(e,target)>7){const a=angle(e,target);moveEntity(e,Math.cos(a)*42*dt,Math.sin(a)*42*dt);e.facing=a;}
  return true;
 }
 if(!e.variant)return false;
 if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0)performEnemyAttack(e);return true;}
 e.cd-=dt;const a=angle(e,player);e.facing=a;
 if(e.variant==='cinder'){
  if(d>350)moveEntity(e,Math.cos(a)*51*dt,Math.sin(a)*51*dt);else if(d<220)moveEntity(e,-Math.cos(a)*42*dt,-Math.sin(a)*42*dt);
  if(e.cd<=0&&d<560){e.target={x:player.x,y:player.y};e.attack='meteor';e.telegraph=1.25;e.cd=3.5;}
 }else if(e.variant==='stalker'){
  if(d>105)moveEntity(e,Math.cos(a)*106*dt,Math.sin(a)*106*dt);
  if(e.cd<=0&&d<235){e.target={x:player.x,y:player.y};e.attack='venom';e.telegraph=.95;e.cd=3.1;}
 }else{
  if(d>115)moveEntity(e,Math.cos(a)*47*dt,Math.sin(a)*47*dt);
  if(e.cd<=0&&d<180){e.target={x:player.x,y:player.y};e.attack='shieldBash';e.telegraph=1.05;e.cd=2.8;}
 }
 return true;
}
function performVariantAttack(e){
 if(e.attack==='meteor'||e.attack==='venom'){
  const poison=e.attack==='venom',r=poison?72:88,color=poison?'#84c8a3':'#edac6f';
  ring(e.target.x,e.target.y,r,color,.6);
  if(distance(player,e.target)<r+player.r)hitPlayer(poison?10:17);
  hazards.push({x:e.target.x,y:e.target.y,r,life:poison?4:2.6,tick:.5,friendly:false,color,poison,damage:poison?5:7});return true;
 }
 if(e.attack==='shieldBash'){
  ring(e.x,e.y,145,'#a9c7de',.5);
  if(distance(player,e)<145+player.r)hitPlayer(19);return true;
 }
 return false;
}
function copyEnemy(e){return {...e,home:e.home?{...e.home}:null,target:e.target?{...e.target}:null};}
function worldCheckpoint(){return {run:takeCheckpoint(),player:{...player},enemies:enemies.map(copyEnemy),completed:[...state.world.completed],restCharges:state.world.restCharges,exploration:{claimed:[...state.world.claimed],seen:[...state.world.seen],trailCaptured:state.world.trailCaptured,visited:[...state.world.visited],track:state.world.track}};}
function restoreWorldCheckpoint(c){
 for(const key of ['time','kills','captures','hits','corruption','locked','nightmare','weapon','stored'])state[key]=c.run[key];
 state.journey=JOURNEY.normalize(c.run.journey);state.pendingBoons=[];state.skillCd=0;state.dashCd=0;state.attackCd=0;state.slots=[...c.run.slots];state.owned=new Set(c.run.owned);state.levels={...c.run.levels};state.xp={...c.run.xp};
 player={...c.player};enemies=c.enemies.map(copyEnemy);state.world.completed=new Set(c.completed);state.world.restCharges=c.restCharges;if(c.exploration){const w=c.exploration;Object.assign(state.world,{claimed:new Set(w.claimed),seen:new Set(w.seen),trailCaptured:w.trailCaptured,visited:new Set(w.visited),track:w.track});}
 state.objective=null;state.hitStop=0;state.capture=0;state.captureTarget=null;effects=[];hazards=[];projectiles=[];minions=[];floating=[];keys={};mouse.down=false;
 $('capture-hud').classList.add('hidden');state.phase='playing';updateCamera(0,true);updateBuild();updateUI();
}
function missionPoint(x,y,site=state.objective?.site){return site?{x:site.x+(x-600)*.72,y:site.y+(y-350)*.72}:{x,y};}
function startWorldMission(site){
 if(!state.world||state.phase!=='playing'||state.objective||state.world.completed.has(site.id))return;
 state.world.track=site.id;state.world.missionCheckpoint=worldCheckpoint();state.checkpoint=takeCheckpoint();
 if(site.kind==='boss'&&state.world.completed.size<3)return;
 const ambient=enemies;
 if(['hunt','survey','sequence','purify'].includes(site.kind)){setupCampaignObjective(site);return;}
 if(site.kind==='boss'){
  const e=spawnEnemy(campaignWorld().bossType,site.x,site.y-40,true,true);e.mission=true;e.home={x:e.x,y:e.y};
  state.objective={kind:'boss',status:'active',site,targetId:e.id};$('boss-hud').classList.remove('hidden');
  $('boss-name').textContent=campaignWorld().boss;toast(campaignWorld().boss+'已苏醒 · 留意攻击预警',4);return;
 }
 setupObjective(site.kind);
 for(const e of enemies){const p=missionPoint(e.x,e.y,site);e.x=p.x;e.y=p.y;e.home={...p};e.mission=true;const wasTarget=state.objective.targetId===e.id;e.id=site.id+'-target-'+enemies.indexOf(e);if(wasTarget)state.objective.targetId=e.id;}
 state.objective.site=site;
 if(state.objective.lantern)Object.assign(state.objective.lantern,missionPoint(600,350,site));
 enemies=[...ambient,...enemies];state.roomType='world';player.invincible=2;showObjectiveBrief();updateWorldUI();
}
function interactWorld(){
 if(!state.world||state.phase!=='playing')return;
 if(state.objective&&interactCampaignNode())return;
 const s=allWorldSites().find(s=>distance(player,s)<130);
 if(!s){toast('靠近地图上的发光地点，再按 F 互动',2);return;}
 if(state.objective){toast('先完成当前任务，再与其他地点互动',2);return;}
 if(s.kind==='camp'){if(campThreat()){toast('先摆脱附近敌人，再回营地休整或保存',3);return;}openCamp();return;}
 if(s.kind==='discovery'){claimDiscovery(s);return;}
 if(state.world.completed.has(s.id)){toast('这处印记已完成 · 按 M 寻找其他目标',3);return;}
 if(s.kind==='boss'&&state.world.completed.size<3){toast(`首领封印尚未解除 · 还需要 ${3-state.world.completed.size} 枚印记`,3);return;}
 startWorldMission(s);
}
function completeWorldMission(){
 if(!state.objective||state.objective.status!=='active'||!state.objective.site)return;const site=state.objective.site;state.world.completed.add(site.id);state.world.restCharges++;
 enemies=enemies.filter(e=>!e.mission);state.objective=null;state.capture=0;state.captureTarget=null;projectiles=[];hazards=[];minions=[];effects=[];floating=[];
 const loot=expeditionReward('mission:'+site.id,'mission');
 const next=WORLD.sites.find(s=>!['camp','boss'].includes(s.kind)&&!state.world.completed.has(s.id))||WORLD.sites.find(s=>s.kind==='boss');
 state.world.track=next.id;state.room=state.world.completed.size;state.journey.flasks=Math.min(state.journey.maxFlasks,state.journey.flasks+1);state.pendingBoons=JOURNEY.offers(state.journey.perks,state.world.completed.size).map(p=>p.id);updateBuild();
 showModal('worldComplete',`<div class="modal-eyebrow">FOREST SEAL / ${state.world.completed.size} OF 3</div><h2 id="modal-title">印记已点亮</h2>${lootMarkup(loot)}<div class="seal-progress">${[0,1,2].map(i=>`<span class="${i<state.world.completed.size?'lit':''}">${uiGlyph('seal')}</span>`).join('')}</div><p class="choice-instruction">${state.world.completed.size===3?campaignWorld().boss+'的封印已解除。':'下一站 · '+next.name}　·　月露 +1</p><div class="boon-grid">${state.pendingBoons.map(id=>{const p=JOURNEY.perks.find(p=>p.id===id);return `<button class="boon-card" data-boon="${id}"><span class="boon-symbol">${p.symbol}</span><strong>${p.name}</strong><p>${p.description}</p></button>`;}).join('')}</div><p id="boon-result" class="journey-result" role="status">选择一项祝福 · 本局持续生效 · 回营按 F 保存</p><div class="modal-actions"><button class="primary" id="world-continue" ${state.pendingBoons.length?'disabled':''}>${state.pendingBoons.length?'先选择一项祝福':'继续探索'}</button><button class="secondary" id="world-reward-map" ${state.pendingBoons.length?'disabled':''}>查看全图</button></div>`);
 $('modal-card').querySelectorAll('[data-boon]').forEach(b=>b.onclick=()=>chooseBoon(b.dataset.boon));$('world-continue').onclick=()=>{if(!state.pendingBoons.length)closeModal('playing');};$('world-reward-map').onclick=()=>{if(state.pendingBoons.length)return;closeModal('playing');openWorldMap();};
}
function retryWorldMission(){
 const site=state.objective.site,c=state.world.missionCheckpoint;
 restoreWorldCheckpoint(c);startWorldMission(site);
}
function openWorldMap(){
 if(!state.world||!['playing','paused','worldmap'].includes(state.phase))return;
 if(state.phase==='worldmap'){closeModal('playing');return;}
 modalReturn='playing';
 showModal('worldmap',`<div class="modal-eyebrow">${campaignWorld().name} / Lv.${campaignWorld().level}–${campaignWorld().level+2}</div><h2 id="modal-title">你的下一站在哪里？</h2><p>已探索 ${state.world.visited.size} / 5 种环境 · 已取得 ${state.world.completed.size} / 3 枚印记。白色圆点是你，金色空框是当前视野。${WORLD.bridges.length?'河道请从两座桥通行。':'沿地表道路探索，避开深色障碍与危险地形。'}</p><div class="world-map-layout"><div class="world-overview">${worldMapSvg()}</div><div class="world-map-choices">${WORLD.sites.map(s=>`<button data-track="${s.id}" class="${state.world.track===s.id?'selected':''}"><b>${s.symbol} ${s.name}${state.world.completed.has(s.id)?' ✓':''}</b><small>${s.hint}</small><span>${state.objective&&state.objective.site.id!==s.id?'任务中可查看路线':state.world.track===s.id?'正在追踪':'追踪此地点 →'}</span></button>`).join('')}</div></div>${discoveryMapChoices()}<p class="fine-print">追踪只显示方向，不会传送。地图打开时，敌人和任务计时暂停。</p><button class="primary" id="world-map-close">继续探索 · M / Esc ↗</button><button class="secondary" id="map-atlas">五境星图 ↗</button>`);
 $('modal-card').querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{state.world.track=b.dataset.track;closeModal('playing');});
 $('world-map-close').onclick=()=>closeModal('playing');$('map-atlas').onclick=()=>openAtlas();
}
function worldMapSvg(){
 const view=cameraWorldRect();
 return `<svg viewBox="0 0 3600 2400" role="img" aria-label="五区域世界地图，河道上有北桥和南桥"><rect width="3600" height="2400" fill="#152c2a"/>${WORLD.regions.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/><text x="${r.x+r.w/2}" y="${r.y+(r.id==='forest'?1050:r.id==='marsh'?850:170)}" text-anchor="middle" fill="${r.ink}" font-size="98">${r.name}</text>`).join('')}${WORLD.bridges.length?'<path d="M1305 0V2400" stroke="#83b1bc" stroke-width="150"/>':''}${WORLD.walls.filter(w=>w.kind!=='river').map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="#8a91a5"/>`).join('')}${WORLD.paths.map(line=>`<polyline points="${line.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#c1bb9266" stroke-width="24"/>`).join('')}${WORLD.bridges.map(y=>`<rect x="1190" y="${y-110}" width="230" height="220" fill="#bbac7d"/>`).join('')}${WORLD.sites.map(s=>`<circle cx="${s.x}" cy="${s.y}" r="${state.world.track===s.id?88:60}" fill="${state.world.completed.has(s.id)?'#a9c991':s.color}" fill-opacity=".28" stroke="${s.color}" stroke-width="9"/><text x="${s.x}" y="${s.y+24}" font-size="85" text-anchor="middle" fill="${s.color}">${state.world.completed.has(s.id)?'✓':s.symbol}</text><text x="${s.x}" y="${s.y+140}" text-anchor="middle" font-size="76" fill="#dbe5cb">${s.name}</text>`).join('')}${discoveryMapSvg()}<rect x="${view.x}" y="${view.y}" width="${view.w}" height="${view.h}" fill="none" stroke="#e1cc8e" stroke-width="12"/><circle cx="${player.x}" cy="${player.y}" r="38" fill="#f4ffe9" stroke="#152c2a" stroke-width="15"/></svg>`;
}
function drawMinimap(){
 const view=cameraWorldRect();
 const c=$('world-minimap'),g=c.getContext('2d');c.width=180;c.height=120;
 const sx=180/WORLD.width,sy=120/WORLD.height;g.setTransform(sx,0,0,sy,0,0);
 for(const r of WORLD.regions){g.fillStyle=r.color;g.fillRect(r.x,r.y,r.w,r.h);}
 if(WORLD.bridges.length){g.fillStyle='#639ba6';g.fillRect(1220,0,170,WORLD.height);}for(const w of WORLD.walls.filter(w=>w.kind!=='river')){g.fillStyle='#768692';g.fillRect(w.x,w.y,w.w,w.h);}
 for(const y of WORLD.bridges){g.fillStyle='#baa575';g.fillRect(1190,y-120,230,240);}
 for(const s of WORLD.sites){g.fillStyle=state.world.completed.has(s.id)?'#d5f0b6':s.color;g.beginPath();g.arc(s.x,s.y,state.world.track===s.id?65:38,0,TAU);g.fill();}
 for(const s of worldDiscoveries()){g.fillStyle=state.world.claimed.has(s.id)?'#668273':s.color;g.fillRect(s.x-35,s.y-35,70,70);}
 for(const e of enemies)if(!e.dead&&distance(e,player)<700){g.fillStyle='#d78275';g.fillRect(e.x-22,e.y-22,44,44);}
 g.strokeStyle='#dfcf9c';g.lineWidth=18;g.strokeRect(view.x,view.y,view.w,view.h);g.fillStyle='#f3ffec';g.beginPath();g.arc(player.x,player.y,42,0,TAU);g.fill();
}
function updateWorldUI(){
 const active=!!state.world;$('app-shell').classList.toggle('is-world',active);$('world-hud').classList.toggle('hidden',!active);$('world-map-nav').classList.toggle('hidden',!active);$('world-interact').classList.toggle('hidden',!active||state.phase!=='playing'||!!state.objective||!state.world.near);
 if(!active)return;
 const w=state.world,r=WORLD.regionAt(player.x,player.y),s=currentWorldSite(w.track),near=w.near;
 $('room-name').textContent=r.name.startsWith(campaignWorld().name)?r.name:campaignWorld().name+' · '+r.name;$('room-tag').innerHTML=`旷野探索 <span>印记 ${w.completed.size} / 3</span>`;
 $('objective').textContent=state.objective?`${state.objective.site.name} · ${state.objective.kind==='boss'?'击败'+campaignWorld().boss:state.objective.kind==='capture'?'击破幽灵，长按 E 夺取':state.objective.kind==='defend'?'保护梦灯，坚持到倒计时结束':state.objective.kind==='chase'?'追上镜魔，击破后收割或夺影':state.objective.site.hint}`:`追踪：${s.name} · 靠近发光地点按 F`;
 $('world-progress').textContent=`印记 ${w.completed.size} / 3 · 环境 ${w.visited.size} / 5`;
 const terrain=WORLD.terrainAt(player.x,player.y);$('world-terrain').textContent=terrain?.kind==='mud'?'浅沼 · 移速降低':terrain?.kind==='embers'?'余烬 · 持续灼伤':'M 全图 · F 互动';
 if(near)$('world-interact').textContent=state.objective?'任务进行中':near.kind==='camp'?'F · 营地存档 / 休整':near.kind==='discovery'?w.claimed.has(near.id)?`${near.name} · 已领取`:`F · ${near.name} · 查看奖励`:w.completed.has(near.id)?`${near.name} · 已完成`:near.kind==='boss'&&w.completed.size<3?`首领封印 · 还需 ${3-w.completed.size} 枚印记`:`F · ${near.name} · 开始${{chase:'追猎',defend:'守灯',capture:'夺影',hunt:'清剿',survey:'探索',sequence:'机关',purify:'净化',boss:'首领战'}[near.kind]}`;
 updateViewControls();drawMinimap();
}
function drawWorldProp(p){
 const {x,y,size:s,kind}=p;
 ctx.save();
 // Fade foliage between the camera and hunter so movement never loses the character.
 if(Math.abs(player.x-x)<s*.95&&player.y<y+20&&player.y>y-s*1.9)ctx.globalAlpha=.24;
 if(kind==='forest'){
  ctx.save();ctx.translate(x,y);ellipse(16,13,s*.8,s*.27,'#06181f80');path([[-5,6],[-4,-s*1.1],[4,-s*1.2],[8,8]],'#384336','#9ca78030');
  if(p.tone>.45){
   for(let i=0;i<3;i++){const yy=-s*(.35+i*.36),ww=s*(.78-i*.14);path([[-ww,yy+12],[-ww*.55,yy-s*.35],[0,yy-s*.84],[ww*.45,yy-s*.4],[ww,yy+12],[5,yy+4]],i===2?'#436253':i===1?'#2d5044':'#234638','#8eb59b22');path([[-ww*.55,yy-s*.35],[0,yy-s*.84],[0,yy+4]],'#a1c2a314');}
  }else{
   for(let i=0;i<4;i++){const dx=(i%3-1)*s*.39,dy=-s*(.64+(i===3?.55:i%2*.25));ellipse(dx,dy,s*.57,s*.4,i===3?'#49694e':i===1?'#3b5c47':'#2d4e3e');ctx.strokeStyle='#9bbd8a30';ctx.stroke();ellipse(dx-s*.15,dy-s*.12,s*.28,s*.13,'#b3c68d0c');}
  }ctx.restore();
 }else if(kind==='ash'){
  ctx.strokeStyle='#42342b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-s*1.5);ctx.moveTo(x,y-s*.8);ctx.lineTo(x-s*.4,y-s*1.4);ctx.moveTo(x,y-s*.6);ctx.lineTo(x+s*.5,y-s*1.2);ctx.stroke();ellipse(x,y+4,16,6,'#b06c3033');
 }else if(kind==='marsh'){
  for(let i=0;i<5;i++){const dx=(i-2)*9;ctx.strokeStyle=i%2?'#658a68':'#426e65';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+dx,y);ctx.lineTo(x+dx*1.3,y-22-i%3*10);ctx.stroke();ellipse(x+dx*1.3,y-24-i%3*10,3,7,'#a7b78a88');}
 }else if(kind==='ruins'){
  ellipse(x+8,y+8,25,8,'#0b1c2866');path([[x-15,y],[x-12,y-s],[x+13,y-s-7],[x+18,y],[x,y+8]],'#56636b','#91a8b148');path([[x+3,y-s-4],[x+13,y-s-7],[x+18,y],[x+3,y+5]],'#2e424e');
 }else{
  path([[x-20,y+5],[x-5,y-s],[x+8,y-s*1.2],[x+24,y+6]],'#514d69','#aa9bc04d');path([[x-5,y-s],[x+8,y-s*1.2],[x+24,y+6],[x+3,y]],'#70627a80');
 }
 ctx.restore();
}
function drawWorldLandmark(s){
 const done=state.world.completed.has(s.id),active=state.objective?.site?.id===s.id;
 glow(s.x,s.y,150,s.color+'20');ctx.save();ctx.strokeStyle=s.color+(done?'44':'99');ctx.lineWidth=2;ctx.setLineDash([8,12]);ctx.beginPath();ctx.ellipse(s.x,s.y,80+Math.sin(clock*2)*3,50,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
 if(s.kind==='camp'){path([[s.x-75,s.y+16],[s.x-42,s.y-65],[s.x+10,s.y+16]],'#4a6452','#a3b48d');path([[s.x-42,s.y-65],[s.x+25,s.y-40],[s.x+48,s.y+15],[s.x+10,s.y+16]],'#263f37');glow(s.x+55,s.y-10,60,'#e4b76e44');path([[s.x+42,s.y],[s.x+53,s.y-32],[s.x+66,s.y]],'#edc488');}
 else if(s.kind==='defend'&&!active){path([[s.x-12,s.y+8],[s.x-9,s.y-58],[s.x+9,s.y-58],[s.x+12,s.y+8]],'#50665c',s.color);glow(s.x,s.y-35,32,'#f0cd7c66');}
 else if(s.kind==='capture'){for(const dx of [-95,95]){path([[s.x+dx-14,s.y+8],[s.x+dx-8,s.y-65],[s.x+dx+14,s.y-55],[s.x+dx+18,s.y+8]],'#50606d','#a0c9d05a');}ctx.strokeStyle='#c3a7e655';ctx.beginPath();ctx.ellipse(s.x,s.y,110,65,0,0,TAU);ctx.stroke();}
 ctx.textAlign='center';ctx.font='20px Georgia';ctx.fillStyle=s.color;ctx.fillText(done?'✓':s.symbol,s.x,s.y-84);ctx.font='13px "Microsoft YaHei"';ctx.fillText(s.name,s.x,s.y-105);ctx.font='10px sans-serif';ctx.fillStyle='#c0d3bc';ctx.fillText(done?'印记已取得':active?'任务进行中':s.kind==='boss'&&state.world.completed.size<3?'收集三处印记以解除封印':distance(player,s)<130?'按 F 互动':'靠近发光标记',s.x,s.y+78);ctx.restore();
}
function drawWorldWaypoint(){
 const site=navigationTarget();if(!site||distance(player,site)<150)return;
 const p=pointOnScreen(site);if(p.x>.12&&p.x<.78&&p.y>.2&&p.y<.72)return;
 const x=clamp(p.x,.08,.76)*camera.w,y=clamp(p.y,.2,.68)*camera.h,a=angle(player,site);
 ctx.save();ctx.translate(x,y);ctx.rotate(a);path([[12,0],[-7,-7],[-4,0],[-7,7]],site.color);ctx.rotate(-a);ctx.fillStyle='#e0e5c7';ctx.textAlign='center';ctx.font='11px sans-serif';ctx.fillText(site.name,0,25);ctx.restore();
}
function drawHazard(h){
 if(h.life<=0)return;
 ctx.save();const color=h.friendly?'#d9b776':h.purple?'#d4a0f2':h.poison?'#a3d19d':'#f5ab77';
 // The visible boundary uses the same world-space circle as the damage test.
 ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,TAU);ctx.fillStyle=color+(h.friendly?'0d':'20');ctx.fill();
 ctx.strokeStyle=color;ctx.lineWidth=h.friendly?1.4:2.5;if(h.friendly)ctx.setLineDash([4,7]);ctx.stroke();ctx.setLineDash([]);
 if(!h.friendly){
  ctx.strokeStyle=color+'55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(h.x,h.y,h.r-5,0,TAU);ctx.stroke();
  ctx.fillStyle=color;ctx.font='bold 12px "Microsoft YaHei"';ctx.textAlign='center';ctx.fillText(h.purple?'不可闪避':h.poison?'毒雾':'灼烧',h.x,h.y-6);
  ctx.globalAlpha=.45+.15*Math.sin(clock*5);ctx.beginPath();ctx.moveTo(h.x-5,h.y+8);ctx.lineTo(h.x+5,h.y+8);ctx.stroke();
 }ctx.restore();
}
function drawWorld(){
 const dpr=Math.min(window.devicePixelRatio||1,2),width=canvas.clientWidth,height=canvas.clientHeight;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);updateCamera(0,true);}
 updateCamera(0); // Movement and dashes happened after this frame's input update.
 ctx.setTransform(canvas.width/camera.w,0,0,canvas.height/camera.h,0,0);ctx.fillStyle='#091918';ctx.fillRect(0,0,camera.w,camera.h);ctx.save();
 if(screenShake>0)ctx.translate(rand(-screenShake,screenShake),rand(-screenShake,screenShake));ctx.translate(-camera.x,-camera.y);
 const visible=cameraWorldRect();
 if(visible.w>0&&visible.h>0)ctx.drawImage(worldGround,visible.x,visible.y,visible.w,visible.h,visible.x,visible.y,visible.w,visible.h);
 ctx.strokeStyle='#75977d40';ctx.lineWidth=3;ctx.strokeRect(0,0,WORLD.width,WORLD.height);
 for(const h of hazards)if(worldVisible(h.x,h.y,h.r))drawHazard(h);
 for(const s of WORLD.sites)if(worldVisible(s.x,s.y))drawWorldLandmark(s);
 for(const s of worldDiscoveries())if(worldVisible(s.x,s.y))drawDiscovery(s);
 if(state.objective?.kind==='defend')drawMissionScenery();drawCampaignNodes();
 const entities=[...worldScenery.props.filter(p=>worldVisible(p.x,p.y)).map(p=>({y:p.y,draw:()=>drawWorldProp(p)})),...worldScenery.rocks.filter(p=>worldVisible(p.x,p.y)).map(p=>({y:p.y,draw:()=>{ellipse(p.x,p.y,p.r,p.r*.65,'#596d6466');}})),...enemies.filter(e=>!e.dead&&worldVisible(e.x,e.y)).map(e=>({y:e.y,draw:()=>drawEnemy(e)})),{y:player.y,draw:drawPlayer}];
 entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 for(const p of projectiles){if(!worldVisible(p.x,p.y,20))continue;glow(p.x,p.y,14,p.color+'44');ctx.strokeStyle=p.color;ctx.lineWidth=p.enemy?3:2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);ctx.stroke();}
 for(const m of minions){if(worldVisible(m.x,m.y,20)){glow(m.x,m.y,13,m.color+'44');path([[m.x,m.y-6],[m.x+4,m.y],[m.x,m.y+6],[m.x-4,m.y]],m.color);}}
 drawEffects();for(const f of floating){if(!worldVisible(f.x,f.y,20))continue;ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign='center';ctx.font=/^\d+$/.test(f.text)?'bold 15px Georgia':'11px "Microsoft YaHei"';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 const region=WORLD.regionAt(player.x,player.y);if(region.id==='marsh'){for(let i=0;i<4;i++){const y=camera.y+i*140+Math.sin(clock*.3+i)*30;ellipse(camera.x+camera.w*.5,y,camera.w*.7,34,'#add5c408');}}
 if(releaseSettings().atmosphere)for(let i=0;i<16;i++){const x=camera.x+(i*131+Math.sin(clock*.4+i)*19)%camera.w,y=camera.y+(i*89+clock*(region.id==='ash'?-8:2))%camera.h;glow(x,y,6,region.id==='ash'?'#eea56630':'#b7d9a827');}
 ctx.restore();drawWorldWaypoint();
 const vignette=ctx.createRadialGradient(camera.w*.5,camera.h*.45,100,camera.w*.5,camera.h*.45,camera.w*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#06101a85');ctx.fillStyle=vignette;ctx.fillRect(0,0,camera.w,camera.h);
}


/* Exploration rewards, camp checkpoints and readable attack anticipation. */
const EXPEDITION=window.HUNTER_EXPEDITION;
function campStorage(){try{return localStorage;}catch{return null;}}
function worldDiscoveries(){return WORLD.discoveries||EXPEDITION.discoveries;}
function allWorldSites(){return [...WORLD.sites,...worldDiscoveries()];}
function currentWorldSite(id){return allWorldSites().find(s=>s.id===id)||WORLD.sites[1];}
function initializeDiscoveries(){
 const w=state.world;w.claimed=new Set();w.seen=new Set();w.trailCaptured=false;w.track='trail-cache';
 const scout=spawnWorldEnemy('archer',650,1530);scout.scout=true;scout.hp=scout.maxHp=40;scout.pressure=scout.maxPressure=35;
}
function campThreat(){return enemies.some(e=>!e.dead&&distance(e,player)<460)||projectiles.some(p=>p.enemy&&distance(p,player)<600)||hazards.some(h=>!h.friendly&&distance(h,player)<h.r+150);}
function canSaveCamp(){return !!state.world&&state.mode==='hunt'&&!state.objective&&!state.bossWon&&['playing','camp'].includes(state.phase)&&distance(player,WORLD.sites[0])<130&&!campThreat()&&player.hp>0&&state.nightmare<=0;}
function saveCamp(){
 if(!canSaveCamp()){toast('请回到守夜营地，脱离战斗后再保存。任务或梦魇形态中无法保存。',4);return false;}
 const w=state.world,checkpoint=worldCheckpoint();
 // Camp checkpoints retain enemies and rewards, but never pending attacks or effect closures.
 checkpoint.enemies=checkpoint.enemies.map(e=>({...e,cd:Math.max(1,e.cd),telegraph:0,target:null,attack:null,dash:0,burn:0,bleed:0,hit:0,aggro:false,patrol:e.patrol%TAU}));
 const save={version:1,savedAt:Date.now(),checkpoint,world:{worldId:w.id,visit:w.visit,visited:[...w.visited],claimed:[...w.claimed],seen:[...w.seen],trailCaptured:w.trailCaptured,track:w.track}};
 const ok=EXPEDITION.write(campStorage(),save);
 if(ok){campaignSave();refreshResume();toast('营地存档已保存 · 任务、装备、敌人与奖励进度已记录',4);}else toast('未能保存：浏览器存储不可用或空间不足。当前游戏仍可继续。',5);
 return ok;
}
function saveDescription(s){return `${CAMPAIGN.worlds.find(w=>w.id===(s.world.worldId||'forest')).name} · ${s.checkpoint.completed.length} / 3 印记 · ${s.world.claimed.length} / 4 宝藏 · ${formatTime(s.checkpoint.run.time)} · ${new Date(s.savedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}`;}
function refreshResume(){
 const saved=EXPEDITION.read(campStorage());$('continue-run').classList.toggle('hidden',saved.status!=='ready');
 $('save-note').textContent=saved.status==='ready'?'存档保存在当前浏览器；新狩猎不会覆盖它，直到你在营地再次保存。':saved.status==='empty'?'首次出发自动建立营地存档；之后回营地按 F 手动保存。':saved.status==='invalid'?'营地存档格式不兼容或已损坏；可开始新狩猎，并在营地重新保存。':'当前浏览器无法读取存档；仍可开始新狩猎。';
 if(saved.status==='ready')$('resume-summary').textContent=saveDescription(saved.data);
}
function resumeCamp(){
 const saved=EXPEDITION.read(campStorage());if(saved.status!=='ready'){refreshResume();toast('未找到可用的营地存档。',3);return false;}
 const s=saved.data,c=s.checkpoint;reset();enterWorld(s.world.worldId||'forest',s.world.visit||'legacy-'+s.savedAt);
 // Restore only fields the game owns. Storage is not a trusted runtime object.
 const restored=c.enemies.map(raw=>{
  const e=spawnWorldEnemy(raw.variant||raw.type,raw.home.x,raw.home.y,raw.elite);
  for(const k of ['id','x','y','r','hp','maxHp','pressure','maxPressure','dead','exposed','facing','patrol'])e[k]=raw[k];
  const free=nearestFreeWorldPosition(e.x,e.y,e.r);e.x=free.x;e.y=free.y;e.home=nearestFreeWorldPosition(e.home.x,e.home.y,e.r);e.scout=raw.scout===true;e.cd=1.5;return e;
 });
 const clean={...c,exploration:s.world,enemies:restored,player:{...newPlayer(),x:c.player.x,y:c.player.y,hp:c.player.hp,focus:c.player.focus,invincible:2}};
 restoreWorldCheckpoint(clean);Object.assign(state.world,{visited:new Set(s.world.visited),claimed:new Set(s.world.claimed),seen:new Set(s.world.seen),trailCaptured:s.world.trailCaptured,track:s.world.track,region:null});
 state.room=c.completed.length;state.skillCd=0;state.dashCd=0;state.attackCd=0;state.bossWon=false;closeModal('playing');updateWorld(0);updateBuild();updateUI();refreshResume();toast('已回到上次营地存档 · 保存后的探索需要重新进行',4);return true;
}
function openCamp(){
 modalReturn='playing';
 const ready=EXPEDITION.read(campStorage()).status==='ready',w=state.world;
 showModal('camp',`<div class="modal-eyebrow">守夜营地 / 一个可以回来的地方</div><h2 id="modal-title">把这段旅途，留在火光里。</h2><p>保存当前装备、已取得的印记、宝藏与敌人状态。下次从这里继续；保存后的探索不会自动记录。</p><div class="camp-summary"><div><strong>${w.completed.size} / 3</strong><small>任务印记</small></div><div><strong>${w.claimed.size} / 4</strong><small>已领取宝藏</small></div><div><strong>${w.restCharges}</strong><small>剩余休整次数</small></div></div><div class="modal-actions"><button class="primary" id="camp-save">${ready?'保存并覆盖营地存档':'保存营地存档'} ↗</button><button class="secondary" id="camp-rest" ${!w.restCharges?'disabled':''}>休整 · 回满生命 / 净化 / 补满药剂</button><button class="secondary" id="camp-leave">继续探索</button><button class="secondary" id="camp-atlas">五境星图 · 前往其他世界</button><button class="secondary" id="camp-bag">行囊与护符</button></div><p id="camp-status" class="save-status" role="status">保存免费；休整消耗一次机会。休整后请再保存。</p><p class="fine-print">仅保存在当前浏览器，不跨设备同步。教学与试炼不会写入此存档。</p>`);
 $('camp-save').onclick=()=>{$('camp-status').textContent=saveCamp()?'已保存。可以关闭页面，下次从首页「继续营地存档」回来。':'保存失败。请脱离战斗；若仍失败，检查浏览器是否允许本地存储。';};
 $('camp-rest').onclick=()=>{if(!w.restCharges||campThreat())return;w.restCharges--;state.journey.flasks=state.journey.maxFlasks;state.journey.flaskCd=0;player.hp=100;state.corruption=Math.max(0,state.corruption-25);state.skillCd=0;state.dashCd=0;updateBuild();openCamp();$('camp-status').textContent='已恢复生命、净化 25 梦蚀、补满月露药剂。请点击保存，记录休整后的状态。';};
 $('camp-leave').onclick=()=>closeModal('playing');$('camp-atlas').onclick=()=>openAtlas();$('camp-bag').onclick=()=>openInventory('camp');
}
function discoveryBlocked(site){
 if(site.id==='trail-cache'&&!state.world.trailCaptured)return '先击破箱旁的斥候，靠近后长按 E 夺影。白色暴露时不要继续攻击。';
 if(enemies.some(e=>!e.dead&&distance(e,site)<330))return '附近仍有守卫：击败或夺取其影子后，才能安全领取。';
 return null;
}
function claimDiscovery(site){
 const w=state.world;if(!w||state.phase!=='playing'||state.objective||distance(player,site)>=130||w.claimed.has(site.id))return false;
 const blocked=discoveryBlocked(site);if(blocked){toast(blocked,4);return false;}
 const before={hp:player.hp,focus:player.focus,corruption:state.corruption},id=state.slots[0];
 player.hp=clamp(player.hp+site.heal,0,100);player.focus=clamp(player.focus+site.focus,0,100);state.corruption=Math.max(0,state.corruption-site.purge);w.restCharges+=site.rest||0;
 let extra=site.rest?'营地休整次数 +1。':'';
 if(site.upgrade){if(state.levels[id]<2){state.levels[id]++;state.xp[id]=Math.max(state.xp[id],state.levels[id]===2?18:7);extra=`${shadows[id].name}升至${state.levels[id]===2?'觉醒':'饱食'}：主动伤害 +22%，冷却 −0.4 秒。`;}else{state.corruption=Math.max(0,state.corruption-25);extra='当前主动影已满级，改为净化 25 梦蚀。';}}
 w.claimed.add(site.id);if(w.track===site.id)w.track='chase';updateBuild();
 modalReturn='playing';showModal('discovery',`<div class="modal-eyebrow">探索发现 / 已领取 ${w.claimed.size} / 4</div><h2 id="modal-title">${site.name}，属于你了。</h2><div class="discovery-summary">${site.reward}<br>${extra}</div><p>生命 ${Math.ceil(before.hp)} → ${Math.ceil(player.hp)} · 专注 ${Math.floor(before.focus)} → ${Math.floor(player.focus)} · 梦蚀 ${Math.floor(before.corruption)} → ${Math.floor(state.corruption)}</p><p>${site.id==='trail-cache'?'你已经走完一次「击破 → 夺影 → 补给」。获得的弓手影随时可以用 Tab 装备。继续沿石路向北，前往破镜小径取得第一枚印记。':'宝藏每局只能领取一次。回到营地保存，可以记住这次探索收获。'}</p><button class="primary" id="discovery-close">继续探索 ↗</button>`);
 $('discovery-close').onclick=()=>closeModal('playing');tone(720,.25,'triangle');return true;
}
function updateDiscoveries(){
 if(!state.world)return;const w=state.world;
 const unfamiliar=enemies.find(e=>e.variant&&!e.dead&&distance(e,player)<360&&!w.seen.has(e.variant));
 if(unfamiliar){w.seen.add(unfamiliar.variant);toast(`首次遭遇 · ${WORLD.variants[unfamiliar.variant].name}：${WORLD.variants[unfamiliar.variant].tip}`,5);}
}
function updateJourneyHint(){
 const w=state.world,show=w&&state.phase==='playing'&&!state.objective&&!w.claimed.has('trail-cache')&&distance(player,worldDiscoveries()[0])<900;
 $('journey-hint').classList.toggle('hidden',!show);if(!show)return;
 const scout=enemies.find(e=>e.scout&&!e.dead);
 $('journey-title').textContent=w.trailCaptured?'领取你的第一份探索补给':scout?.exposed?'停下攻击 · 长按 E 夺影':'第一站 · 营地北方的斥候补给箱';
 $('journey-description').textContent=w.trailCaptured?'靠近补给箱按 F：恢复 20 生命、获得 30 专注。':scout?.exposed?'走到白色斥候身边，按住 E 约 1 秒；装备后 Q 会改变。':'沿石路向北，击破箱旁斥候。奖励：弓手影 + 补给。';
}
function drawDiscovery(s){
 const done=state.world.claimed.has(s.id);ctx.save();glow(s.x,s.y,70,s.color+(done?'0c':'26'));
 ellipse(s.x+3,s.y+12,35,13,'#071b2088');path([[s.x-23,s.y-12],[s.x+23,s.y-12],[s.x+23,s.y+13],[s.x-23,s.y+13]],done?'#263e39':'#526352',s.color+'99');
 path([[s.x-23,s.y-12],[s.x-16,s.y-26],[s.x+17,s.y-26],[s.x+23,s.y-12]],done?'#213a32':'#78836a',s.color+'99');
 ctx.fillStyle=s.color;ctx.fillRect(s.x-3,s.y-13,6,19);ctx.font='12px "Microsoft YaHei"';ctx.textAlign='center';ctx.fillText((done?'✓ ':'')+s.name,s.x,s.y-49);ctx.font='10px sans-serif';ctx.fillStyle=done?'#9aaf9e':'#dfe4be';ctx.fillText(done?'已经领取':s.id==='trail-cache'&&!state.world.trailCaptured?'夺取斥候影子以解锁':'靠近按 F · 清除守卫后领取',s.x,s.y+37);ctx.restore();
}
function discoveryMapSvg(){return worldDiscoveries().map(s=>`<rect x="${s.x-32}" y="${s.y-32}" width="64" height="64" fill="${state.world.claimed.has(s.id)?'#668273':s.color}" stroke="#e3ecc8" stroke-width="8"/>`).join('');}
function discoveryMapChoices(){return `<details class="discovery-options"><summary>可选探索 · 宝藏 ${state.world.claimed.size} / 4（方形标记）</summary><div class="world-map-choices">${worldDiscoveries().map(s=>`<button data-track="${s.id}"><b>${s.symbol} ${s.name}${state.world.claimed.has(s.id)?' ✓':''}</b><small>${s.reward}</small><span>${s.hint}</span></button>`).join('')}</div></details>`;}
function telegraphInfo(e){
 const t=e.target||e,a=e.attack;
 const data={lunge:['冲锋 · 向侧面闪避','#efab8c',0],shot:['射击 · 横向移动','#ead093',0],slam:['重击 · 离开圆圈','#efab8c',e.boss?160:e.type==='giant'?110:85],lantern:['袭击梦灯 · 攻击打断','#efab8c',85],meteor:['落火 · 离开橙圈','#f3b36f',88],venom:['毒雾 · 离开绿圈','#a6d5ae',72],shieldBash:['盾击 · 离开圆圈','#b8d4ed',145],curse:['梦蚀 · 必须走出紫圈','#d5a9ef',135]}[a]||['攻击预警','#efab8c',85];
 return {label:data[0],color:data[1],radius:data[2],x:['meteor','venom','curse'].includes(a)?t.x:e.x,y:['meteor','venom','curse'].includes(a)?t.y:e.y,length:a==='lunge'?(e.boss?.58:.36)*650:520};
}
function attackCue(e){
 const before=e.cueActive;const active=e.telegraph>0&&!e.exposed&&!e.dead;
 if(active&&!before){e.windup=e.telegraph;if(distance(e,player)<600){tone(e.attack==='curse'?180:e.attack==='shot'?610:e.attack==='meteor'?330:240,.13,'triangle',.035);}}
 e.cueActive=active;
}
function drawAttackTelegraph(e){
 if(e.telegraph<=0||!e.target)return;const info=telegraphInfo(e),progress=clamp(1-e.telegraph/(e.windup||1.25),0,1);
 ctx.save();ctx.strokeStyle=info.color;ctx.fillStyle=info.color+'22';ctx.lineWidth=2.5;
 if(info.radius){ctx.beginPath();ctx.arc(info.x,info.y,info.radius,0,TAU);ctx.fill();ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.arc(info.x,info.y,info.radius,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();ctx.strokeStyle=info.color+'88';ctx.beginPath();ctx.moveTo(info.x-9,info.y);ctx.lineTo(info.x+9,info.y);ctx.moveTo(info.x,info.y-9);ctx.lineTo(info.x,info.y+9);ctx.stroke();}
 else {ctx.save();ctx.translate(e.x,e.y);ctx.rotate(angle(e,e.target));if(e.attack==='lunge'){const width=e.r+player.r+8;ctx.fillRect(0,-width,info.length,width*2);ctx.strokeRect(0,-width,info.length,width*2);path([[info.length,0],[info.length-17,-9],[info.length-17,9]],info.color);ctx.fillStyle=info.color+'44';ctx.fillRect(0,-width,info.length*progress,width*2);}else{const n=e.type==='mirror'?5:e.type==='swarm'?3:1;for(let i=0;i<n;i++){ctx.save();ctx.rotate((i-(n-1)/2)*.19);ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(info.length,0);ctx.stroke();ctx.restore();}}ctx.restore();}
 ctx.font='bold 11px "Microsoft YaHei"';ctx.textAlign='center';const labelY=info.y-(info.radius||e.r)-22;ctx.fillStyle='#0a1b21e8';ctx.fillRect(info.x-91,labelY-14,182,23);ctx.fillStyle=info.color;ctx.fillText(info.label,info.x,labelY+2);ctx.restore();
}


/* Layered procedural artwork: a moonlit clearing, broken shrines and forest silhouettes. */
function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill();}
function path(points,fill,stroke=null){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function drawTree(t){const {x,y,size:s,tone}=t;ellipse(x+14,y+9,s*.65,s*.23,'#0516196b');path([[x-8,y],[x-4,y-s*1.7],[x+4,y-s*1.8],[x+10,y]],'#111e23');const color=tone>.5?'#18302f':'#102627';for(let i=0;i<3;i++){const yy=y-s*.55-i*s*.5,ww=s*(.8-i*.15);path([[x-ww,yy+20],[x-ww*.65,yy-18],[x-ww*.3,yy-s*.5],[x,yy-s],[x+ww*.3,yy-s*.5],[x+ww*.72,yy-10],[x+ww,yy+20],[x+ww*.2,yy+12]],color,'#24423a60');}path([[x,y-s*2.1],[x-10,y-s*1.4],[x+1,y-s*1.6]],'#31504766');}
function drawShrine(o,index){const {x,y,r}=o;ellipse(x+14,y+15,r*1.3,r*.45,'#081a1fd0');path([[x-r,y+8],[x-r*.9,y-2],[x+r*.8,y-8],[x+r,y+8],[x+8,y+21]],'#344441','#4a5c50');path([[x-r*.63,y+4],[x-r*.45,y-75],[x-3,y-91],[x+r*.53,y-83],[x+r*.68,y-7],[x+8,y+10]],'#314348','#587069');path([[x+5,y-86],[x+r*.53,y-83],[x+r*.68,y-7],[x+8,y+10]],'#1c3239');path([[x-r*.45,y-75],[x-3,y-91],[x+r*.53,y-83],[x+5,y-68]],'#4c6564');ctx.strokeStyle='#9fcabc88';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-5,y-57);ctx.lineTo(x+2,y-45);ctx.lineTo(x-5,y-31);ctx.lineTo(x-13,y-43);ctx.closePath();ctx.stroke();glow(x-5,y-44,28,'#9adbc42a');for(let i=0;i<4;i++)ellipse(x-r+i*11,y+8+Math.sin(i)*4,9,3,'#47604a99');}
const ground=document.createElement('canvas');ground.width=W;ground.height=H;
function makeGround(){const real=ctx;const g=ground.getContext('2d');g.fillStyle='#172c30';g.fillRect(0,0,W,H);const bg=g.createRadialGradient(720,340,30,600,390,670);bg.addColorStop(0,'#334d49');bg.addColorStop(.45,'#243e3d');bg.addColorStop(1,'#0a1c25');g.fillStyle=bg;g.fillRect(0,0,W,H);
 for(let i=0;i<1300;i++){const x=rng()*W,y=rng()*H;g.fillStyle=i%3===0?'#6682750c':'#02151c14';g.beginPath();g.ellipse(x,y,8+rng()*60,2+rng()*12,0,0,TAU);g.fill();}
 g.strokeStyle='#7a897024';g.lineWidth=110;g.lineCap='round';g.beginPath();g.moveTo(630,790);g.bezierCurveTo(520,570,795,350,900,-30);g.stroke();g.strokeStyle='#8da1890b';g.lineWidth=68;g.stroke();
 // A broken ritual circle, carefully cut stone tiles and a moonlit pool.
 g.save();g.translate(664,414);g.scale(1,.59);g.strokeStyle='#8095863b';g.lineWidth=2;for(const r of [140,152,186]){g.beginPath();g.arc(0,0,r,.1,TAU-.13);g.stroke();}for(let i=0;i<20;i++){const a=i*TAU/20;g.beginPath();g.moveTo(Math.cos(a)*158,Math.sin(a)*158);g.lineTo(Math.cos(a)*178,Math.sin(a)*178);g.stroke();}g.restore();
 for(let i=0;i<14;i++){const x=560+rng()*140+(i>9?60:0),y=500+i*18;g.fillStyle=i%2?'#485f524d':'#65736636';g.strokeStyle='#9ba58c28';g.beginPath();g.moveTo(x,y);g.lineTo(x+40+rng()*15,y-4);g.lineTo(x+52,y+13);g.lineTo(x+6,y+19);g.closePath();g.fill();g.stroke();}
 const pool=g.createRadialGradient(935,163,10,935,163,160);pool.addColorStop(0,'#7ea8a555');pool.addColorStop(1,'#17474a00');g.fillStyle=pool;g.fillRect(770,40,330,260);g.strokeStyle='#91babb20';for(let i=0;i<4;i++){g.beginPath();g.ellipse(932,165,70+i*23,15+i*7,-.2,0,TAU);g.stroke();}
 for(const s of stones){g.save();g.translate(s.x,s.y);g.rotate(s.rot);g.fillStyle='#67817322';g.beginPath();g.moveTo(-s.r,0);g.lineTo(-s.r*.5,-s.r*.4);g.lineTo(s.r*.8,-s.r*.3);g.lineTo(s.r,s.r*.4);g.lineTo(-s.r*.4,s.r*.5);g.closePath();g.fill();g.restore();}
 for(const b of grasses){g.strokeStyle=b.t>.6?'#77946545':'#42645170';g.lineWidth=1;g.beginPath();g.moveTo(b.x-4,b.y);g.quadraticCurveTo(b.x-4,b.y-b.s,b.x-8,b.y-b.s);g.moveTo(b.x,b.y);g.lineTo(b.x+1,b.y-b.s*1.5);g.moveTo(b.x+4,b.y);g.quadraticCurveTo(b.x+3,b.y-b.s,b.x+7,b.y-b.s);g.stroke();}
}
function drawHumanoid(x,y,a=0,color='#a4d9c7',scale=1,enemy=false){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(5,12,22,8,'#04151ca0');const walk=state.phase==='playing'?Math.sin(clock*10)*3:0;path([[-7,3],[-10,24+walk],[-2,22],[3,6]],'#0b171e');path([[3,4],[7,23-walk],[14,21],[10,1]],'#0c1720');path([[-12,-12],[-18,9],[-7,16],[0,9],[11,15],[16,7],[10,-15]],enemy?'#18222e':'#13202c','#416365');path([[-11,-11],[-16,7],[-3,4],[4,-16]],enemy?'#343442':'#37545a');path([[-9,-16],[-5,-31],[4,-34],[13,-22],[8,-11]],enemy?'#151d2c':'#172634',color+'99');path([[-5,-22],[8,-23],[5,-16],[-3,-16]],'#061316');ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-20);ctx.lineTo(4,-20);ctx.stroke();path([[5,-11],[18,-4],[27,18],[12,13]],color+'3a');ctx.save();ctx.rotate(a);ctx.strokeStyle='#90aaab';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(11,-3);ctx.lineTo(27,-3);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(27,-3);ctx.lineTo(47,-10);ctx.stroke();ctx.restore();ctx.restore();}
function drawWolf(e){const {x,y}=e,s=e.boss?2.5:e.elite?1.4:1;ctx.save();ctx.translate(x,y);if(player.x<x)ctx.scale(-1,1);ctx.scale(s,s);ellipse(0,13,28,9,'#04171ac0');path([[-22,5],[-12,20],[-6,19],[-9,1],[10,3],[15,20],[21,19],[18,0]],'#14232a');path([[-29,-3],[-16,-18],[3,-17],[18,-27],[20,-13],[33,-4],[24,6],[8,3],[-9,10],[-21,5]],e.boss?'#242c39':'#1a3035',e.hit>0?'#f1f9df':'#608374');path([[4,-17],[11,-34],[16,-21],[20,-36],[24,-13]],'#203440','#78998d');path([[-23,-2],[-41,-22],[-32,-1],[-23,7]],'#1b3236');ctx.strokeStyle=e.boss?'#d7a9f1':'#b7edc6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(19,-13);ctx.lineTo(26,-10);ctx.stroke();ctx.strokeStyle='#9dc8b966';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-15,-16);ctx.lineTo(-3,-5);ctx.lineTo(4,-16);ctx.stroke();if(e.boss){path([[0,-13],[-3,-32],[5,-40],[7,-19]],'#6e7d8977');glow(18,-11,20,'#c39fed55');}ctx.restore();}
function drawEnemy(e){if(e.dead)return;if(state.world){ctx.font='10px sans-serif';ctx.fillStyle=campaignWorld().color;ctx.textAlign='center';ctx.fillText('Lv.'+(e.level||campaignWorld().level)+(state.objective?.targets?.includes(e.id)?' ◆ 清剿目标':''),e.x,e.y-e.r-76);}if(e.variant){const v=WORLD.variants[e.variant];ctx.save();ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle=v.color;ctx.fillText(v.name+' · '+shadows[e.type].name,e.x,e.y-e.r-55);if(e.variant==='stalker'&&!e.aggro)ctx.globalAlpha=.35;if(e.variant==='sentinel'){ctx.strokeStyle=v.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y-8,31,e.facing-1.1,e.facing+1.1);ctx.stroke();}if(e.variant==='cinder'){glow(e.x+20,e.y-35,32,'#efa46855');ellipse(e.x+20,e.y-35,5,10,'#efbe85');}ctx.restore();}
 drawAttackTelegraph(e);
 if(e.exposed){glow(e.x,e.y,65,'#bfffe51b');ctx.save();ctx.strokeStyle='#d4ffed';ctx.lineWidth=1.5;ctx.setLineDash([4,8]);ctx.beginPath();ctx.ellipse(e.x,e.y+8,e.r+19,(e.r+19)*.6,clock,0,TAU);ctx.stroke();ctx.restore();ctx.globalAlpha=.65+Math.sin(clock*9)*.15;}
 if(e.variant==='stalker'&&!e.aggro&&!e.exposed)ctx.globalAlpha=.35;if(e.type==='wolf')drawWolf(e);else if(e.type==='ghost'){ellipse(e.x,e.y+13,21,7,'#041a2190');glow(e.x,e.y-4,35,'#8edde125');const bob=Math.sin(clock*3)*4;path([[e.x-17,e.y+12+bob],[e.x-15,e.y-22+bob],[e.x-5,e.y-34+bob],[e.x+9,e.y-32+bob],[e.x+17,e.y-17+bob],[e.x+19,e.y+13+bob],[e.x+7,e.y+8+bob],[e.x,e.y+19+bob],[e.x-6,e.y+8+bob]],'#233e4b','#87c9c399');ctx.fillStyle='#c6f9e5';ctx.fillRect(e.x-6,e.y-19+bob,3,3);ctx.fillRect(e.x+4,e.y-19+bob,3,3);}else if(e.type==='swarm'){drawHumanoid(e.x,e.y,angle(e,player),shadows.swarm.color,e.elite?1.3:1,true);for(let i=0;i<3;i++){const a=clock*2+i*TAU/3;ellipse(e.x+Math.cos(a)*25,e.y-12+Math.sin(a)*15,3,2,'#d0c788');}}else{drawHumanoid(e.x,e.y,angle(e,player),shadows[e.type].color,e.type==='giant'?1.5:e.elite?1.3:1,true);if(e.type==='shield')path([[e.x-20,e.y-22],[e.x-4,e.y-18],[e.x-5,e.y+4],[e.x-16,e.y+13],[e.x-26,e.y+2]],'#334550','#8ca8b6');if(e.type==='fire')glow(e.x+23,e.y-5,30,'#f3a26055');if(e.type==='mirror'){ctx.save();ctx.translate(e.x,e.y-8);ctx.rotate(clock);ctx.strokeStyle='#b29bd777';ctx.strokeRect(-25,-25,50,50);ctx.restore();}}
 ctx.globalAlpha=1;if(e.scout){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e1d99c';ctx.fillText('斥候 · 夺影解锁补给',e.x,e.y-e.r-63);}if(e.hit>0){glow(e.x,e.y-12,45,'#eef9dc44');}if(state.objective?.targetId===e.id){ctx.fillStyle='#e6ce8e';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(state.objective.kind==='capture'?'◆ 指定夺影目标':'◆ 追猎目标',e.x,e.y-e.r-58);}if(e.exposed){ctx.font='11px "Microsoft YaHei"';ctx.textAlign='center';ctx.fillStyle='#e1ffea';ctx.fillText(distance(e,player)<115?'长按 E 夺影':'影子暴露',e.x,e.y-e.r-38);ctx.fillStyle='#213c38';ctx.fillRect(e.x-24,e.y-e.r-30,48,2);ctx.fillStyle='#c7e8cc';ctx.fillRect(e.x-24,e.y-e.r-30,48*e.exposed/(e.boss?8:7),2);}else if(e.hp<e.maxHp||e.elite||state.tutorial||state.mode==='practice'){const size=e.boss?80:40;ctx.fillStyle='#081b1e';ctx.fillRect(e.x-size/2,e.y-e.r-29,size,4);ctx.fillStyle=e.boss?'#c597cc':'#92b093';ctx.fillRect(e.x-size/2,e.y-e.r-29,size*clamp(e.hp/e.maxHp,0,1),4);ctx.fillStyle='#aabfe28c';ctx.fillRect(e.x-size/2,e.y-e.r-23,size*clamp(e.pressure/e.maxPressure,0,1),2);if(state.tutorial){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#d8eccb';ctx.fillText(`${shadows[e.type].name} · 练习目标`,e.x,e.y-e.r-52);ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillStyle='#a2c79e';ctx.fillText('生命',e.x-size/2-7,e.y-e.r-25);ctx.fillStyle='#b7c9e6';ctx.fillText('影压',e.x-size/2-7,e.y-e.r-17);}if(e.elite&&!e.boss){ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#cfb785';ctx.fillText('◆ 精英',e.x,e.y-e.r-37);}}}
function drawPlayer(){const p=player;glow(p.x,p.y,65,state.nightmare>0?'#a85cdd45':'#a4dfb619');if(p.invincible>0&&Math.sin(clock*35)>.5)ctx.globalAlpha=.55;if(state.nightmare>0){ctx.save();ctx.strokeStyle='#cfa1eb';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+7,43,19,0,0,TAU);ctx.stroke();ctx.restore();}drawHumanoid(p.x,p.y,p.angle,state.nightmare>0?'#ddb0f2':'#beffe0',1.15);ctx.globalAlpha=1;
 if(p.shield>0){ctx.strokeStyle='#b6e3f0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-8,38,0,TAU);ctx.stroke();glow(p.x,p.y,45,'#a1d8e222');}
 state.slots.forEach((s,i)=>{if(i===2&&state.locked)return;const a=clock*.6+i*TAU/3,x=p.x+Math.cos(a)*39,y=p.y+Math.sin(a)*19+6;glow(x,y,14,shadows[s].color+'44');path([[x,y-5],[x+4,y],[x,y+5],[x-4,y]],shadows[s].color);});
 if(p.charging>.15){ctx.strokeStyle=p.charging>=.5?'#e5efb9':'#9dccba';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,33,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,p.charging/.5));ctx.stroke();}
 // Quiet cursor reticle makes aiming unambiguous without obscuring the world.
 ctx.strokeStyle='#c5e2cc80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,TAU);ctx.moveTo(mouse.x-12,mouse.y);ctx.lineTo(mouse.x-8,mouse.y);ctx.moveTo(mouse.x+8,mouse.y);ctx.lineTo(mouse.x+12,mouse.y);ctx.moveTo(mouse.x,mouse.y-12);ctx.lineTo(mouse.x,mouse.y-8);ctx.stroke();}
function drawEffects(){for(const f of effects){const t=clamp(f.life/(f.max||1),0,1);ctx.save();ctx.globalAlpha=t;if(f.kind==='particle'){ellipse(f.x,f.y,f.r,f.r,f.color);}else if(f.kind==='ring'){ctx.strokeStyle=f.color;ctx.lineWidth=2+t*4;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(1-t*.75),f.r*(1-t*.75)*.66,0,0,TAU);ctx.stroke();}else if(f.kind==='slash'){ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.strokeStyle=f.color;ctx.lineWidth=5+12*t;ctx.beginPath();ctx.arc(0,0,f.r*(1-t*.25),-1.05,1.05);ctx.stroke();ctx.globalAlpha=t*.16;ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,f.r,-1.05,1.05);ctx.closePath();ctx.fill();}else if(f.kind==='beam'){ctx.strokeStyle=f.color;ctx.lineWidth=f.width*t;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.tx,f.ty);ctx.stroke();}else if(f.kind==='afterimage'){drawHumanoid(f.x,f.y,f.a,f.color,1.15);}ctx.restore();}}
function draw(){if(state.world){drawWorld();return;}const dpr=Math.min(window.devicePixelRatio||1,2),width=canvas.clientWidth,height=canvas.clientHeight;if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);ctx.save();if(screenShake>0)ctx.translate(rand(-screenShake,screenShake),rand(-screenShake,screenShake));ctx.drawImage(ground,0,0);drawMissionScenery();
 for(const h of hazards)drawHazard(h);
 // Moonbeams extend across the clearing; gradients keep play space readable.
 ctx.save();ctx.globalCompositeOperation='screen';const beam=ctx.createLinearGradient(930,0,530,H);beam.addColorStop(0,'#b7d9c90f');beam.addColorStop(.6,'#b7d9c911');beam.addColorStop(1,'#b7d9c900');path([[850,0],[1040,0],[610,780],[290,780]],beam);path([[1110,0],[1140,0],[770,780],[700,780]],beam);ctx.restore();
 drawTutorialMarker();
 const entities=[...trees.map(t=>({y:t.y,draw:()=>drawTree(t)})),...obstacles.map((o,i)=>({y:o.y,draw:()=>drawShrine(o,i)})),...enemies.filter(e=>!e.dead).map(e=>({y:e.y,draw:()=>drawEnemy(e)})),{y:player.y,draw:drawPlayer}];entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 for(const p of projectiles){glow(p.x,p.y,15,p.color+'45');ctx.strokeStyle=p.color;ctx.lineWidth=p.enemy?3:2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);ctx.stroke();ellipse(p.x,p.y,p.r,p.r,p.color);}
 for(const m of minions){glow(m.x,m.y,13,m.color+'44');path([[m.x,m.y-6],[m.x+4,m.y],[m.x,m.y+6],[m.x-4,m.y]],m.color);}
 drawEffects();for(const f of floating){ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign='center';ctx.font=/^\d+$/.test(f.text)?'bold 15px Georgia':'11px "Microsoft YaHei"';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 if(releaseSettings().atmosphere)for(const s of stars){const x=s.x+Math.sin(clock*.35+s.s)*13,y=s.y+Math.cos(clock*.45+s.s)*8;ctx.globalAlpha=.3+Math.sin(clock+s.s)*.2;glow(x,y,7,'#cdf3c188');ellipse(x,y,1.2,1.2,'#d4eaca');}ctx.globalAlpha=1;
 const vignette=ctx.createRadialGradient(610,390,200,600,390,690);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#07151fce');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 if(state.phase==='intro'){const shade=ctx.createLinearGradient(0,0,800,0);shade.addColorStop(0,'#081921ae');shade.addColorStop(1,'#08192100');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);}ctx.restore();}
function frame(timestamp){const dt=Math.min(.04,(timestamp-last)/1000||.016);last=timestamp;update(dt);updateRelease(dt);if(window.HUNTER_RELEASE?.settings.shake===false)screenShake=0;draw();drawFeedback(dt);requestAnimationFrame(frame);}
function mousePosition(e){const rect=canvas.getBoundingClientRect();mouse.u=(e.clientX-rect.left)/rect.width;mouse.v=(e.clientY-rect.top)/rect.height;mouse.x=state.world?camera.x+mouse.u*camera.w:mouse.u*W;mouse.y=state.world?camera.y+mouse.v*camera.h:mouse.v*H;}
canvas.addEventListener('wheel',changeViewByWheel,{passive:false});
$('view-range').addEventListener('input',e=>{if(state.world&&state.phase==='playing')setViewRange(e.target.value);});
for(const id of ['view-range','view-near','view-far','view-reset'])$(id).addEventListener('focus',()=>{keys={};mouse.down=false;state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');});
for(const [id,delta] of [['view-near',-10],['view-far',10],['view-reset',0]])$(id).onclick=()=>{if(!state.world||state.phase!=='playing')return;setViewRange(delta?viewRange+delta:VIEW_RANGE.default);canvas.focus({preventScroll:true});};
canvas.addEventListener('pointermove',mousePosition);canvas.addEventListener('pointerdown',e=>{if(e.button!==0||state.phase!=='playing')return;mousePosition(e);mouse.down=true;mouse.held=0;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});canvas.addEventListener('pointerup',e=>{if(e.button!==0)return;if(mouse.down){const charged=mouse.held>=.5;mouse.down=false;basicAttack(charged);mouse.held=0;}});canvas.addEventListener('pointercancel',()=>{mouse.down=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable||e.target?.closest?.(".view-controls"))return;if(state.world&&state.phase==='playing'&&['Minus','Equal','NumpadSubtract','NumpadAdd','Digit0','Numpad0'].includes(e.code)){e.preventDefault();setViewRange(['Digit0','Numpad0'].includes(e.code)?VIEW_RANGE.default:viewRange+(['Minus','NumpadSubtract'].includes(e.code)?-10:10));return;}const tabShortcut=e.code==='Tab'&&['intro','playing','map'].includes(state.phase);if(tabShortcut||state.phase==='playing'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat){keys[e.code]=true;return;}keys[e.code]=true;if(e.code==='Escape'&&state.phase==='atlas'){closeAtlas();return;}if(e.code==='Escape'&&state.phase==='inventory'){$('inventory-close').onclick();return;}if(e.code==='KeyN'){openAtlas();return;}if(e.code==='Escape'){if(['guide','codex','skillinfo','worldmap','camp','discovery'].includes(state.phase))closeModal();else if(state.phase==='build'){if(modalReturn==='map')showRoute();else closeModal();}else pause();}if(tabShortcut)openBuild();if(e.code==='KeyC')useFlask();if(e.code==='KeyB')startRecall();if(e.code==='KeyM')openWorldMap();if(e.code==='KeyF')interactWorld();if(e.code==='Space')dash();if(e.code==='KeyQ')skill();if(e.code==='KeyR'&&state.phase==='playing'&&!state.tutorial){state.weapon=state.weapon==='blade'?'bow':'blade';updateUI();toast(state.weapon==='bow'?'弓形 · 远程精准攻击':'刃形 · 近身弧形斩击',1.5);}if(e.code==='KeyJ')basicAttack();if(e.code==='KeyE'&&state.phase==='playing'&&!enemies.some(t=>!t.dead&&t.exposed&&distance(t,player)<115))toast('夺影条件：敌人变白后，走近它，再按住 E 约 1 秒',2);});window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{keys={};mouse.down=false;if(state.phase==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};mouse.down=false;if(state.phase==='playing')pause();}});
$('atlas-button').onclick=()=>openAtlas();$('atlas-nav').onclick=()=>openAtlas();$('start-button').onclick=beginTutorial;$('skip-intro').onclick=start;$('skip-tutorial').onclick=finishTutorial;$('skill-detail-button').onclick=openSkillDetails;$('pause-button').onclick=pause;$('guide-button').onclick=openGuide;$('codex-button').onclick=openCodex;$('build-button').onclick=()=>openBuild();$('hunt-tab').onclick=()=>{if(['guide','codex','paused','skillinfo','worldmap'].includes(state.phase))closeModal();};$('skill-button').onclick=skill;$('dash-button').onclick=dash;$('attack-button').onclick=()=>basicAttack();$('capture-button').onpointerdown=e=>{keys.KeyE=true;e.currentTarget.setPointerCapture(e.pointerId);};$('capture-button').onpointerup=()=>{keys.KeyE=false;};$('capture-button').onpointercancel=()=>{keys.KeyE=false;};$('sound-button').onclick=()=>{soundOn=!soundOn;$('sound-button').innerHTML=soundOn?'♫':'♫<span class="sound-off">/</span>';$('sound-button').ariaLabel=soundOn?'关闭声音':'开启声音';$('sound-button').title=soundOn?'关闭声音':'开启声音';tone(660,.25);};$('fullscreen-button').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast('当前窗口不支持全屏，请在独立浏览器中打开');}};

$('practice-intro').onclick=startPractice;$('practice-button').onclick=requestPractice;
$('practice-dummy').onclick=()=>practiceTargets('dummy');$('practice-mobs').onclick=()=>practiceTargets('mobs');
$('practice-refresh').onclick=refreshPractice;$('practice-exit').onclick=()=>{if(state.mode==='practice')reset();};
$('compact-detail').onclick=openSkillDetails;$('compact-edit').onclick=()=>openBuild();

$('continue-run').onclick=resumeCamp;
$('flask-button').onclick=useFlask;$('recall-button').onclick=startRecall;$('world-map-nav').onclick=openWorldMap;$('world-map-button').onclick=openWorldMap;$('world-interact').onclick=interactWorld;

// A read-only snapshot is intentionally available for automated smoke verification.
window.shadowHunter={snapshot:()=>({phase:state.phase,mode:state.mode,campaign:{cleared:[...state.campaign.cleared],inventory:{...state.campaign.inventory},equipped:state.campaign.equipped},journey:{...state.journey,perks:[...state.journey.perks]},world:state.world?{id:state.world.id,completed:[...state.world.completed],visited:[...state.world.visited],track:state.world.track,camera:{...camera}}:null,objective:state.objective?{kind:state.objective.kind,status:state.objective.status,remaining:state.objective.remaining,lanternHp:state.objective.lantern?.hp}:null,room:state.room,time:state.time,hp:player.hp,focus:player.focus,kills:state.kills,captures:state.captures,slots:[...state.slots],owned:[...state.owned],corruption:state.corruption,locked:state.locked,skillCd:state.skillCd,weapon:state.weapon,player:{x:player.x,y:player.y},enemies:enemies.filter(e=>!e.dead).map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp,pressure:e.pressure,exposed:e.exposed,boss:e.boss})),tutorial:state.tutorial?{step:state.tutorial.step}:null,projectiles:projectiles.length,minions:minions.length,combo:combo().name})};
/* Release integration keeps camp data and original combat rules compatible. */
let releaseReturn='intro',releaseClock=0,achievementTime=0,lastAudioScene='',releaseLastOutcome='defeat';
const knownAchievements=new Set(window.HUNTER_RELEASE?.journal().achievements||[]);
function releaseSettings(){return window.HUNTER_RELEASE?.settings||{sound:true,music:48,effects:65,brightness:108,shake:true,atmosphere:true,difficulty:'standard'};}
function applyReleaseSettings(){
 const settings=releaseSettings();soundOn=settings.sound;
 document.documentElement?.style.setProperty('--game-brightness',String(settings.brightness/100));
 document.body?.classList.toggle('reduced-motion',!settings.atmosphere);
 $('sound-button').innerHTML=settings.sound?'♫':'♫<span class="sound-off">/</span>';
 $('sound-button').ariaLabel=settings.sound?'静音全部声音':'开启音乐与音效';$('sound-button').title=settings.sound?'静音全部声音':'开启音乐与音效';
 window.HUNTER_AUDIO?.configure(settings);
}
function updateReleaseSettings(patch){const saved=window.HUNTER_RELEASE?.configure(patch);applyReleaseSettings();return saved;}
function beginReleasePanel(){if(!['intro','playing','paused'].includes(state.phase))return false;releaseReturn=state.phase;return true;}
function closeReleasePanel(){if(releaseReturn==='paused'){state.phase=modalReturn;pause();}else closeModal(releaseReturn);}
function openSettings(){
 if(!beginReleasePanel())return;const s=releaseSettings();
 showModal('settings',`<div class="modal-eyebrow">OPTIONS / 随心调整</div><h2 id="modal-title">让这场旅程，适合你。</h2><p>调整时游戏暂停，设置会在当前浏览器记住。难度可随时切换，不重置存档。</p><div class="settings-grid"><label class="setting-row"><span>背景音乐 <output id="music-value">${s.music}%</output></span><input id="music-volume" aria-label="背景音乐音量" type="range" min="0" max="100" value="${s.music}"><small>随营地、探索、战斗与首领自动变奏。</small></label><label class="setting-row"><span>战斗音效 <output id="effects-value">${s.effects}%</output></span><input id="effects-volume" aria-label="战斗音效音量" type="range" min="0" max="100" value="${s.effects}"><small>包含攻击、夺影与敌人预警。</small></label><label class="setting-row"><span>场景亮度 <output id="brightness-value">${s.brightness}%</output></span><input id="scene-brightness" aria-label="场景亮度" type="range" min="85" max="130" value="${s.brightness}"><small>只调整游戏场景，不影响界面和判定。</small></label><label class="setting-row"><span>旅程难度</span><select id="difficulty-select" aria-label="旅程难度"><option value="story" ${s.difficulty==='story'?'selected':''}>旅人 · 受到伤害降低 35%</option><option value="standard" ${s.difficulty==='standard'?'selected':''}>猎人 · 标准挑战</option></select><small>旅人适合初次游玩；猎人保留原版数值。不会改变守灯任务的梦灯耐久。</small></label></div><div class="setting-row"><label class="setting-switch"><input id="sound-enabled" type="checkbox" ${s.sound?'checked':''}>启用音乐与音效</label><label class="setting-switch"><input id="shake-enabled" type="checkbox" ${s.shake?'checked':''}>战斗镜头震动</label><label class="setting-switch"><input id="atmosphere-enabled" type="checkbox" ${s.atmosphere?'checked':''}>环境光粒与界面动画</label></div><p class="settings-note" id="settings-note" role="status">首次点击后才能播放音乐；如无声音，请检查系统音量和右上角静音按钮。</p><div class="modal-actions"><button class="primary" id="settings-close">保存并返回 ↗</button><button class="secondary" id="settings-defaults">恢复默认设置</button></div>`);
 for(const [id,key,output] of [['music-volume','music','music-value'],['effects-volume','effects','effects-value'],['scene-brightness','brightness','brightness-value']])$(id).addEventListener('input',e=>{const value=Number(e.target.value);$(output).textContent=value+'%';saveOption({[key]:value});});
 $('difficulty-select').addEventListener('change',e=>saveOption({difficulty:e.target.value}));
 for(const [id,key] of [['sound-enabled','sound'],['shake-enabled','shake'],['atmosphere-enabled','atmosphere']])$(id).addEventListener('change',e=>saveOption({[key]:e.target.checked}));
 $('settings-close').onclick=closeReleasePanel;
 $('settings-defaults').onclick=()=>{updateReleaseSettings(window.HUNTER_RELEASE?.defaults||{});const previous=releaseReturn;state.phase=previous;openSettings();};
}
function saveOption(patch){const saved=updateReleaseSettings(patch);$('settings-note').textContent=saved?'设置已保存，即时生效。':'设置已生效；浏览器不允许存储，关闭后可能不会保留。';window.HUNTER_AUDIO?.unlock();}
function openRecords(){
 if(!beginReleasePanel())return;const data=window.HUNTER_RELEASE?.journal()||{wins:0,runs:0,bestTime:null,achievements:[]};
 showModal('records',`<div class="modal-eyebrow">HUNTER'S JOURNAL / 猎人纪事</div><h2 id="modal-title">月光记得你的足迹。</h2><div class="stats"><div><strong>${data.wins}</strong><small>黎明归来</small></div><div><strong>${data.runs}</strong><small>已结算旅程</small></div><div><strong>${data.bestTime?formatTime(data.bestTime):'—'}</strong><small>最快通关</small></div></div><div class="journal-grid">${(window.HUNTER_RELEASE?.achievements||[]).map(([id,name,description])=>`<div class="journal-card ${data.achievements.includes(id)?'unlocked':''}"><b>${data.achievements.includes(id)?'✦':'◇'} ${name}</b><small>${description}</small></div>`).join('')}</div><p class="fine-print">记录仅保存在此浏览器，不跨设备同步。教学与试炼不计入成就。通关时间包含本局实际探索时间，暂停不计时；不同难度共用纪事。</p><button class="primary" id="records-close">返回 ↗</button>`);$('records-close').onclick=closeReleasePanel;
}
function openCredits(){
 if(!beginReleasePanel())return;
 showModal('credits',`<div class="modal-eyebrow">SHADOW HUNTER / 1.2</div><h2 id="modal-title">影子猎手 · 五境远征</h2><p>一场关于借用力量、承担代价与寻找归路的单人动作冒险。</p><div class="explain-box"><b>核心设计与基础实现</b><br>项目小组：夺影、三槽构筑、梦蚀与连续探索。<br><br><b>版本完善</b><br>在现有项目上进行 AI 辅助代码完善、程序化画面与界面打磨。<br><br><b>画面与声音</b><br>场景和角色由 Canvas / SVG 实时绘制；标题背景由 AI 辅助生成。背景配乐采用为本项目编写的旋律与和声，以 Web Audio 本地合成，无外部音乐文件。<br><br><b>技术</b><br>HTML、CSS、JavaScript、Canvas 2D、Web Audio。无需账号与网络，支持本地离线游玩。</div><p>感谢每一位参与试玩、记录问题、提出建议的同学。</p><button class="primary" id="credits-close">回到月光之下 ↗</button>`);$('credits-close').onclick=closeReleasePanel;
}
function confirmLeave(home){
 showModal('leaveConfirm',`<div class="modal-eyebrow">离开当前旅程</div><h2 id="modal-title">要回到梦的起点吗？</h2><p>营地检查点会保留，但上次保存之后的探索不会自动保存。可以先返回森林，脱战按 B 回营，再按 F 保存。</p><div class="modal-actions"><button class="secondary" id="leave-cancel">继续当前旅程</button><button class="primary" id="leave-confirm">${home?'返回标题':'重新开始'}</button></div>`);
 $('leave-cancel').onclick=()=>{state.phase=modalReturn;pause();};$('leave-confirm').onclick=()=>{if(home)reset();else if(state.mode==='practice')startPractice();else{reset();start();}};
}
function awardAchievement(id){
 if(knownAchievements.has(id)||!window.HUNTER_RELEASE)return;knownAchievements.add(id);
 if(window.HUNTER_RELEASE.unlock(id)){const name=window.HUNTER_RELEASE.achievements.find(a=>a[0]===id)?.[1];$('achievement-toast').textContent='✦ 纪事已点亮 · '+name;$('achievement-toast').classList.remove('hidden');achievementTime=4;}
}
function updateRelease(dt){
 if(achievementTime>0){achievementTime-=dt;if(achievementTime<=0)$('achievement-toast').classList.add('hidden');}
 releaseClock+=dt;if(releaseClock<.25)return;releaseClock=0;
 const audio=window.HUNTER_AUDIO?.status();$('audio-note').textContent=audio&&!audio.supported?'此浏览器不支持背景音乐，请使用新版 Edge 或 Chrome。':!releaseSettings().sound?'音乐与音效已静音 · 可在右上角开启':audio?.unlocked?'背景配乐已启用 · 音量可在游戏设置中调整':'首次点击后启用背景音乐 · 右上角可静音';
 document.body?.classList.toggle('low-health',state.phase==='playing'&&player.hp<=30&&!state.tutorial&&state.mode!=='practice');
 let musicScene='menu';
 if(state.phase==='worldVictory'||state.world?.victory&&['atlas','inventory'].includes(state.phase))musicScene='victory';
 else if(state.phase==='end')musicScene=releaseLastOutcome;
 else if(state.mode==='practice'||state.tutorial)musicScene='camp';
 else if(state.world){const boss=enemies.some(e=>e.boss&&!e.dead);const danger=enemies.some(e=>!e.dead&&!e.exposed&&e.aggro&&distance(e,player)<540);musicScene=boss?'boss':state.phase==='playing'&&danger?'combat':state.phase==='camp'||distance(player,WORLD.sites[0])<220?'camp':'explore';}
 if(musicScene!==lastAudioScene){lastAudioScene=musicScene;window.HUNTER_AUDIO?.setScene(musicScene);}
 if(!state.tutorial&&state.mode!=='practice'&&state.phase!=='intro'){
  if(state.captures>0)awardAchievement('capture');if(state.world?.completed.size>0)awardAchievement('seal');if(state.world?.completed.size>=3)awardAchievement('trinity');if(state.nightmare>0||state.locked)awardAchievement('nightmare');
 }
}
function drawFeedback(dt){
 window.HUNTER_FEEDBACK?.render($('feedback-canvas'),{dt,screenPoint:pointOnScreen,player,capture:state.capture,target:state.captureTarget,phase:state.phase,instant:player.focus>=100,rich:releaseSettings().atmosphere,dpr:window.devicePixelRatio});
}
function playEquipFeedback(id,action='equip'){
 const color=shadows[id]?.color||'#c1e6d5';
 window.HUNTER_FEEDBACK?.emit(action==='heal'?'heal':'equip',{x:player.x,y:player.y,color,anchor:action==='heal'?undefined:'hud'});
 const panel=$('compact-build');panel.classList.remove('weave-pulse');void panel.offsetWidth;panel.classList.add('weave-pulse');
}
function initializeExperience(){
 const feedback=window.HUNTER_FEEDBACK;if(!feedback)return;
 const attackOriginal=basicAttack,dashOriginal=dash,skillOriginal=skill,flaskOriginal=useFlask,hitOriginal=hitPlayer,captureOriginal=captureFeedback,boonOriginal=chooseBoon,resetOriginal=reset;
 basicAttack=(...args)=>{const cd=state.attackCd,result=attackOriginal(...args);if(cd<=0&&state.attackCd>0&&state.weapon==='blade')feedback.emit('attack',{x:player.x,y:player.y,angle:player.angle,color:'#d1ece4'});return result;};
 dash=(...args)=>{const cd=state.dashCd,result=dashOriginal(...args);if(cd<=0&&state.dashCd>0)feedback.emit('dash',{x:player.x,y:player.y,angle:Math.atan2(player.dy,player.dx),color:'#a7e6d1'});return result;};
 skill=(...args)=>{const cd=state.skillCd,origin={x:player.x,y:player.y},result=skillOriginal(...args);if(cd<=0&&state.skillCd>0)feedback.emit('cast',{...origin,angle:player.angle,color:shadows[state.slots[0]].color,colors:state.slots.map(id=>shadows[id].color)});return result;};
 useFlask=(...args)=>{const count=state.journey.flasks,result=flaskOriginal(...args);if(state.journey.flasks<count)feedback.emit('heal',{x:player.x,y:player.y,color:'#b3edd0'});return result;};
 hitPlayer=(...args)=>{const hp=player.hp,result=hitOriginal(...args);if(player.hp<hp&&releaseSettings().shake!==false)feedback.emit('hit');return result;};
 captureFeedback=e=>{captureOriginal(e);feedback.emit('capture',{x:e.x,y:e.y,color:shadows[e.type]?.color||'#c7e7dc'});};
 chooseBoon=id=>{const result=boonOriginal(id);if(result)feedback.emit('boon',{color:'#e7d29a'});return result;};
 reset=(...args)=>{feedback.clear();return resetOriginal(...args);};
 $('skill-button').onclick=()=>skill();$('dash-button').onclick=()=>dash();$('attack-button').onclick=()=>basicAttack();$('flask-button').onclick=()=>useFlask();
}
function initializeRelease(){
 applyReleaseSettings();
 $('settings-button').onclick=openSettings;$('intro-settings').onclick=openSettings;$('records-button').onclick=openRecords;$('credits-button').onclick=openCredits;
 $('sound-button').onclick=()=>{const enabled=!releaseSettings().sound;updateReleaseSettings({sound:enabled});window.HUNTER_AUDIO?.unlock();};
 document.addEventListener('pointerdown',()=>window.HUNTER_AUDIO?.unlock(),{passive:true});
 document.addEventListener('keydown',()=>window.HUNTER_AUDIO?.unlock(),{passive:true});
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&['settings','records','credits'].includes(state.phase)){e.preventDefault();closeReleasePanel();}});
 if(window.HUNTER_ART){
  const art=window.HUNTER_ART,oldProp=drawWorldProp,oldGround=WORLD.drawGround,oldWorld=drawWorld;
  drawHumanoid=(x,y,a,color,scale,enemy)=>art.hunter(ctx,x,y,a,color,scale,enemy,enemy?clock:player.motionTime||0,enemy||player.moveBlend>.01,enemy?'blade':state.weapon,enemy?{}:player);
  drawWolf=e=>art.wolf(ctx,e,player,clock);
  drawWorldProp=p=>p.kind==='forest'?art.tree(ctx,p,clock,player):oldProp(p);
  WORLD.drawGround=g=>{oldGround(g);art.ground(g,WORLD);};
  drawWorld=()=>{oldWorld();if(releaseSettings().atmosphere){ctx.save();ctx.translate(-camera.x,-camera.y);art.atmosphere(ctx,camera,clock,WORLD.regionAt(player.x,player.y).id);ctx.restore();}};
 }
 const originalEnd=endRun;
 endRun=(win,ending='normal')=>{releaseLastOutcome=win&&ending!=='corrupt'?'victory':'defeat';originalEnd(win,ending);};
}
initializeRelease();
initializeExperience();
makeGround();reset();requestAnimationFrame(frame);
})();


