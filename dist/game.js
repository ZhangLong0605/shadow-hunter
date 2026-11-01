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
const shadowIds=Object.keys(shadows),skills=GUIDE.skills,skillIds=Object.keys(skills);
const skillId=id=>GUIDE.skillFor[id]||'wolf';
function skillCooldown(id=state.slots[0]){return state.nightmare>0?1.3:4.8-state.levels[id]*.4;}
// Accept old eight-shadow / three-slot checkpoints without rewriting the stored file.
function normalizeSkills(){
 const active=skillId(state.slots[0]),owned=[...state.owned,...(state.stored?[state.stored]:[])];
 state.owned=new Set(owned.map(skillId));state.owned.add(active);state.slots=[active];state.stored=null;
 const levels={...state.levels},xp={...state.xp};
 for(const id of skillIds){const family=shadowIds.filter(old=>skillId(old)===id);state.levels[id]=Math.max(...family.map(old=>levels[old]||0));state.xp[id]=Math.max(...family.map(old=>xp[old]||0));}
 // Retired stats remain in the v1 save schema, but cannot reapply a stale upgrade.
 for(const id of shadowIds)if(!skillIds.includes(id)){state.levels[id]=0;state.xp[id]=0;}
}
const skillIllustrations={
 wolf:'<path fill="#3b877d" stroke="#b5eee0" d="m30 12 25-5-6 25-14-1-7 16-8-5 14-19Z"/><path fill="#dcfff0" stroke="none" d="m30 27 19-13-13 20-8 12 2-12-9-2Z"/><path fill="none" stroke="#7edcc9" stroke-width="3" d="M7 21h15M4 32h12M8 43h8"/><path fill="none" stroke="#d3f0d0" d="m38 43 5 4 9-7M17 52h12"/>',
 fire:'<path fill="#a95037" stroke="#f6bd88" d="M36 6c7 17-11 20-5 32 4-4 7-9 6-14 19 12 22 33-4 35C8 58 7 37 20 24c-1 9 3 13 7 15C20 24 29 14 36 6Z"/><path fill="#f0a24e" stroke="none" d="M35 23c1 10-8 12-7 22 0 0-6-3-7-9-9 15 3 22 12 21 19-2 14-18 9-23-1 7-5 9-7 10 4-10-2-14 0-21Z"/><path fill="#fff0b2" stroke="none" d="M33 39c-11 9-9 15 0 16 12-1 8-10 5-13 0 5-3 5-5-3Z"/><path fill="none" stroke="#e6c18a" d="m11 13 2 5m38-5-2 5"/>',
 shield:'<path fill="#335c80" stroke="#beddea" stroke-width="2" d="M32 6 55 15v17c0 13-11 21-23 28C20 53 9 45 9 32V15Z"/><path fill="#5b89a2" stroke="#94bdcf" d="M32 12 49 19v13c0 10-8 17-17 22-9-5-17-12-17-22V19Z"/><path fill="#bbeced" stroke="#e4ffff" d="m32 20 8 11-8 15-8-15Z"/><path fill="none" stroke="#d2f0ed" stroke-width="2" d="M32 20v26m-14-22 3 1m22 0 3-1M22 42l3 3m14 0 3-3"/>',
 archer:'<path fill="none" stroke="#758a65" stroke-width="2" d="M17 11q25 21 0 42M17 11v42"/><path fill="#bad488" stroke="#e5f3b7" d="m26 27 30 5-30 5 9-5Z"/><path fill="none" stroke="#e5f3b7" stroke-width="3" d="M9 32h28"/><path fill="#8eaf83" stroke="#cee6b0" d="m33 11 15 7-17 1 6-3Zm0 42 15-7-17-1 6 3Z"/><path fill="none" stroke="#a6cf9c" stroke-width="2" d="m13 16 23 1m-23 31 23-1"/>'
};
function skillIcon(id){
 const art=skillIllustrations[id],info=skills[id];if(!art||!info)return '';
 return `<span class="skill-icon" data-skill-icon="${id}" role="img" aria-label="${info.name}" style="--skill-color:${shadows[id].color}"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg></span>`;
}

function skillPreview(id){const art={wolf:'<path class="preview-trail" d="M35 40h97"/><path d="m120 31 15 9-15 9"/><circle cx="35" cy="40" r="6"/><path d="m148 26-12 28m20-24-12 28"/>',fire:'<path class="preview-area" d="m35 40 108-31a112 112 0 0 1 0 62Z"/><circle cx="35" cy="40" r="6"/><path d="m116 29 5 10-5 9m20-19 5 10-5 9"/>',shield:'<circle class="preview-area" cx="90" cy="40" r="31"/><path d="m90 18 16 7v14c0 10-16 20-16 20S74 49 74 39V25Z"/><path d="M23 40h28m-7-7 7 7-7 7m113-7h-28m7-7-7 7 7 7"/>',archer:'<path class="preview-trail" d="m35 40 111-22M35 40h111M35 40l111 22"/><path d="m136 14 10 4-7 8m-2 7 9 7-9 7m2 7 7 8-10 4"/><circle cx="35" cy="40" r="6"/>'};return '<svg class="skill-preview" viewBox="0 0 180 80" aria-hidden="true">'+art[id]+'</svg>';}
function skillCards(){return '<div class="skill-grid">'+skillIds.map(id=>{const info=skills[id],owned=state.owned.has(id),chosen=state.slots[0]===id;return '<button class="skill-card '+(chosen?'equipped':'')+'" data-shadow="'+id+'" style="--skill-color:'+shadows[id].color+'" aria-pressed="'+chosen+'" aria-label="'+info.name+'：'+info.summary+'，'+(chosen?'已装备':owned?'点击装备':'夺取'+info.source+'解锁')+'" '+(!owned?'disabled':'')+'><span class="skill-card-top"><small>'+info.tag+'</small><em>'+(chosen?'✓ 已装备':owned?'可装备':'待解锁')+'</em></span>'+skillIcon(id)+'<strong>'+info.name+'</strong><span class="skill-summary">'+info.summary+'</span>'+skillPreview(id)+'<span class="skill-card-foot">'+(owned?'Lv.'+(state.levels[id]+1)+'<span>'+skillCooldown(id).toFixed(1)+'秒冷却</span>':'夺取 '+info.source)+'</span></button>';}).join('')+'</div>';}
function equipSkill(id){if(state.phase!=='build'||!skillIds.includes(id)||!state.owned.has(id)||state.slots[0]===id)return false;state.slots=[id];updateBuild();renderBuild();playEquipFeedback(id);tone(600,.13);return true;}
function bindSkillCards(){$('modal-card').querySelectorAll('[data-shadow]').forEach(b=>b.onclick=()=>equipSkill(b.dataset.shadow));}

// One authored illustration per item; every inventory surface shares this source.
const itemIllustrations={
 leaf:'<path fill="#5a9972" d="M14 47C8 26 25 11 51 10c1 25-10 43-31 39Z"/><path d="m14 51 31-33M25 40l-2-12m9 5 12 1"/><path fill="#e8e4a7" d="M34 15a9 9 0 0 0 9 12 10 10 0 1 1-9-12Z"/>',
 dew:'<path fill="#95dce4" d="M23 10h18v9l-3 3v5c0 5 12 11 12 22 0 9-36 9-36 0 0-11 12-17 12-22v-5l-3-3Z"/><path fill="#329da9" d="M17 42q15 5 30 0v8q-15 8-30 0Z"/><path fill="#bda379" d="M24 8h16v9H24Z"/><path d="M23 29q-7 8-6 13M30 32v7"/><path fill="#e7f8d7" d="M34 30a7 7 0 0 0 6 9 8 8 0 1 1-6-9Z"/>',
 seed:'<path fill="#8dbb80" d="M31 41c-18-1-21-12-19-20 15 0 21 6 19 20Zm2-10c-1-15 6-23 19-21 0 13-5 20-19 21Z"/><path d="M32 49V26"/><ellipse fill="#d3cf78" cx="32" cy="48" rx="10" ry="8"/><path d="m29 46 3-3 3 3m-3-3v9"/><circle fill="#e6f7b0" cx="14" cy="14" r="2"/><circle fill="#e6f7b0" cx="49" cy="36" r="2"/>',
 fang:'<path d="M15 10q0 22 17 20t17-20"/><path fill="#e8dcc1" d="M24 24h17c-2 18-7 27-19 31 6-12 7-20 2-31Z"/><path fill="#718c8c" d="m23 24 18-2-1 9-16 2Z"/><path d="m28 27 5 2 4-3M30 37l-2 9"/>',
 coal:'<path fill="#333b48" d="m12 26 14-15 20 5 10 20-13 19-25-3-9-13Z"/><path stroke="#f0a05b" d="m26 13 5 16-8 8 5 14m4-22 16-10M24 37l25 8"/><path fill="#e88b4b" d="m31 27 8 4-5 10-7-6Z"/>',
 ember:'<path fill="#ef9e50" d="M34 7c6 14-10 17-4 27 3-3 5-7 5-11 19 13 20 32-3 33C9 55 10 36 21 25c-1 8 4 10 6 12-5-13 1-21 7-30Z"/><path fill="#ffe3a1" d="M32 36c-10 9-9 16 1 17 11-1 11-10 5-16 0 7-4 7-6-1Z"/>',
 ore:'<path fill="#b87855" d="m10 34 12-18 24-2 11 23-15 18-24-5Z"/><path fill="#e4a979" d="m22 16 12 13 12-15 11 23-21 5-18 8-8-16Z"/><path d="m22 16 2 24 12 2 6 13m-6-13-2-13 20 7M10 34l14 6"/>',
 heart:'<path d="M16 8q-1 12 16 18Q49 20 48 8"/><path fill="#bd895f" d="m32 19 21 17-21 23L11 36Z"/><path fill="#dd7447" d="m32 25 13 11-13 15-13-15Z"/><path fill="#ffe0a0" d="M32 31c8 7 9 12 0 15-9-3-7-8 0-15Z"/>',
 shell:'<path fill="#b6d9d2" d="M11 40C0 15 25 5 32 19 40 5 63 18 53 40L37 52H26Z"/><path d="M32 21v27M14 23l14 25m22-25L36 48M10 33l16 16m28-16L38 49"/><path fill="#679ea3" d="M25 48h14l-2 7H27Z"/>',
 pearl:'<path fill="#447b89" d="M8 43q2-15 24-17 23 3 24 17L39 55H24Z"/><path fill="#ddeee0" d="M46 29a14 14 0 1 1-28 0 14 14 0 0 1 28 0Z"/><path d="M23 27q2-7 9-7M13 43l16 8m22-8-15 8"/><circle fill="#fff9dc" cx="27" cy="23" r="3"/>',
 kelp:'<path fill="#63b3a0" d="M27 55c9-20-13-22-6-39 5 10 18 9 14 23 9-11-4-17 2-30 14 21 11 27 2 39 8-6 12-7 13-18 8 18-7 21-13 25Z"/><path d="M31 53q3-13-5-26m10 25 5-30"/>',
 tideglass:'<path d="M18 8q0 15 14 19Q46 23 46 8"/><path fill="#598f9f" d="m20 26 23-2 10 18-20 17-20-18Z"/><path fill="#a5e4db" d="m21 30 19-1 7 12-15 12-13-12Z"/><path d="m32 30-5 12 7 10m-13-12 25 1"/>',
 sand:'<path fill="#d7c58a" d="M13 47q3-8 12-8 8-19 16-5 9 1 13 13-19 13-41 0Z"/><path d="m23 42 4 1m5-6 3 2m8 4 3 2"/><path fill="#fff0bd" d="m20 10 2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm21 5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>',
 rune:'<path fill="#d8c393" d="M19 9h29l-5 45-10-4-14 4 4-30-6-7Z"/><path fill="#52646d" d="M23 13h19l-1 7H23Z"/><path stroke="#6a8c9b" d="m32 24 7 7-9 7 6 6m-8-16 10 12M25 45l12 3"/>',
 alloy:'<path fill="#8c9ba3" d="m11 30 13-17h28l4 19-13 20H15Z"/><path fill="#c2c9c4" d="m11 30 14-16 10 15 20-1-13 20H15Z"/><path d="m25 14 10 15 8 22M11 30h24M21 38l12-1m-9 8 10-1"/>',
 compass:'<path d="M26 11V7h12v4"/><circle fill="#75634c" cx="32" cy="35" r="23"/><circle fill="#cbbb88" cx="32" cy="35" r="18"/><path d="M32 19v4m0 24v4M16 35h4m24 0h4"/><path fill="#73a9ab" d="m42 24-7 14-14 8 8-15Z"/><path fill="#e2eee0" d="m42 24-13 7 6 7Z"/>',
 dust:'<path fill="#a0a0bb" d="M13 49q3-11 13-11 10-13 18 0 9 3 10 11-19 11-41 0Z"/><path fill="#d7c8f0" d="M28 10a11 11 0 0 0 11 15 12 12 0 1 1-11-15Z"/><circle fill="#eae2ff" cx="45" cy="16" r="2"/><circle fill="#eae2ff" cx="23" cy="44" r="2"/><path d="m34 42 3 2m5 2 3 1"/>',
 star:'<path fill="#e4d39a" d="m32 7 6 17 18 7-18 7-6 18-7-18-18-7 18-7Z"/><path fill="#f9efd0" d="m32 16 3 12 12 3-12 4-3 12-4-12-12-4 12-3Z"/><path d="m48 12 2 5 5 1m-42 35 4-5"/>',
 prism:'<path fill="#8c83b2" d="m32 7 19 18-6 26-23 6-10-26Z"/><path fill="#b9dfe4" d="m32 7 4 25 15-7-6 26-9-19-14 25-10-26Z"/><path fill="#e5d3f6" d="m32 7 4 25-24-1Z"/><path d="m32 7-10 50m-10-26 33 20"/>',
 crown:'<path fill="#d9bd76" d="m10 20 13 11 9-18 9 18 13-11-5 30H15Z"/><path fill="#b9935c" d="M15 44h34v9H15Z"/><path fill="#b8def0" d="m32 29 6 8-6 8-6-8Z"/><circle fill="#f4e6b9" cx="10" cy="18" r="3"/><circle fill="#f4e6b9" cx="32" cy="11" r="3"/><circle fill="#f4e6b9" cx="54" cy="18" r="3"/>'
};
Object.assign(itemIllustrations,{
 sugar:'<path fill="#f3c86f" d="m32 8 7 15 17 2-12 12 3 18-15-8-15 8 3-18L8 25l17-2Z"/><path fill="#fff4d1" d="m32 17 4 10 11 1-8 8 2 10-9-5-9 5 2-10-8-8 11-1Z"/>',
 sodapearl:'<circle cx="32" cy="34" r="22" fill="#9edbeb"/><circle cx="25" cy="25" r="8" fill="#e8faff"/><path d="M18 44q14 10 28-2"/><circle cx="45" cy="11" r="5" fill="#d2f1f8"/><circle cx="14" cy="12" r="3" fill="#f6faff"/>',
 honeydrop:'<path fill="#efbd59" d="M32 7c0 0-19 23-19 34a19 16 0 0 0 38 0C51 30 32 7 32 7Z"/><path fill="#ffe1a0" d="M28 22c-7 7-10 14-8 21 3-1 6-2 7-6Z"/><path d="m30 35 8-4 8 4v9l-8 5-8-5Z"/>',
 rainbow:'<path d="M17 8q0 14 15 14T47 8"/><path d="M12 48a20 20 0 0 1 40 0" fill="none" stroke="#e994b6" stroke-width="8"/><path d="M19 48a13 13 0 0 1 26 0" fill="none" stroke="#f2cf74" stroke-width="7"/><path d="M26 48a6 6 0 0 1 12 0" fill="none" stroke="#91cbbb" stroke-width="6"/><ellipse cx="13" cy="49" rx="10" ry="7" fill="#fff6f0"/><ellipse cx="51" cy="49" rx="10" ry="7" fill="#fff6f0"/>'
});
function itemIcon(id){
 const item=CAMPAIGN.items[id],art=itemIllustrations[id];if(!item||!art)return '';
 const color=CAMPAIGN.catalog.find(w=>w.id===item.world).color;
 if(id==='sugar'&&window.HUNTER_Q_ART)return `<span class="item-art ${item.kind}" data-item-icon="${id}" role="img" aria-label="${item.name}"><img src="${window.HUNTER_Q_ART.sources['sugar-shard']}" alt=""></span>`;
 return `<span class="item-art ${item.kind}" data-item-icon="${id}" role="img" aria-label="${item.name}" style="--item-color:${color}"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke="#dbe5d3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg></span>`;
}
function uiGlyph(name){const paths={arrow:'M4 12h16m-6-6 6 6-6 6',flask:'M9 3h6m-5 0v6l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V3M8 15h8',home:'m3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7',star:'m12 2 3 6 7 4-7 3-3 7-3-7-7-3 7-4Z',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v6l4 2',seal:'m12 2 9 10-9 10-9-10Zm0 5v10m-4-5h8',box:'m3 7 9-4 9 4v12l-9 3-9-3Zm0 0 9 4 9-4m-9 4v11',check:'m4 12 5 5L20 6'};return `<svg class="ui-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;}
function icon(id){return `<span class="shadow-icon" style="--shadow-color:${shadows[id].color}"><svg viewBox="0 0 40 40" aria-hidden="true">${icons[id]}</svg></span>`;}
let seed=8317;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const trees=[],stones=[],grasses=[],stars=[];
for(let i=0;i<84;i++){const x=rng()*W,y=rng()*H;if(x<120||x>1080||y<115||y>710)trees.push({x,y,size:30+rng()*55,tone:rng()});}
for(let i=0;i<180;i++)grasses.push({x:rng()*W,y:rng()*H,s:3+rng()*10,t:rng()});
for(let i=0;i<66;i++)stones.push({x:rng()*W,y:rng()*H,r:2+rng()*8,rot:rng()*TAU});
for(let i=0;i<35;i++)stars.push({x:rng()*W,y:rng()*H,s:rng()*TAU});
const obstacles=[{x:320,y:250,r:32},{x:884,y:278,r:34},{x:278,y:567,r:30},{x:936,y:568,r:30}];
let selectedTheme='main';
let state,player,enemies=[],effects=[],projectiles=[],minions=[],hazards=[],floating=[],keys={},mouse={x:760,y:350,down:false,held:0},last=0,clock=0,screenShake=0,toastTimer=0,modalReturn='intro',soundOn=false,audioCtx;
let uiElapsed=0,runCount=0;
// One sampled shake offset is shared by the world and the essential cue layer.
let renderShake={x:0,y:0};
function sampleRenderShake(){const active=screenShake>0&&releaseSettings().shake!==false&&!reducedMotion?.matches;renderShake={x:active?rand(-screenShake,screenShake):0,y:active?rand(-screenShake,screenShake):0};ctx.translate(renderShake.x,renderShake.y);}
try{runCount=+(localStorage.getItem('shadow-hunter-runs')||0);}catch{}
function freshState(){return {campaign:CAMPAIGN.read(campStorage(),selectedTheme),journey:JOURNEY.create(),pendingBoons:[],phase:'intro',world:null,mode:'hunt',practiceTarget:'dummy',objective:null,checkpoint:null,hitStop:0,room:0,roomType:'hunt',time:0,kills:0,captures:0,hits:0,corruption:0,nightmare:0,locked:false,skillCd:0,basketballCd:0,mounted:false,dashCd:0,attackCd:0,capture:0,captureTarget:null,clearTimer:0,bossWon:false,weapon:'blade',slots:['wolf'],owned:new Set(['wolf','fire']),levels:Object.fromEntries(shadowIds.map(id=>[id,0])),xp:Object.fromEntries(shadowIds.map(id=>[id,0])),stored:null,modalType:null,muted:false,tutorial:null};}
function newPlayer(){return {x:660,y:450,r:15,hp:100,maxHp:100,focus:0,angle:-.5,invincible:0,dash:0,dx:0,dy:0,shield:0,slash:0,charging:0,...window.HUNTER_ART?.createMotion()};}
function reset(){appearanceReturn=null;quickInventorySignature='';pendingChest=null;levelCelebration=null;$('level-up').classList.add('hidden');killRewards=[];$('kill-rewards').innerHTML='';encounterDialogue=null;cancelRecall();state=freshState();player=newPlayer();enemies=[];effects=[];projectiles=[];minions=[];hazards=[];floating=[];keys={};mouse.down=false;screenShake=0;toastTimer=0;spawnEnemy('wolf',845,365);spawnEnemy('fire',810,585);spawnEnemy('archer',530,244);$('tutorial-card').classList.add('hidden');$('context-hint').classList.add('hidden');$('intro').classList.remove('hidden');$('modal').classList.add('hidden');$('boss-hud').classList.add('hidden');$('toast').classList.add('hidden');$('capture-hud').classList.add('hidden');$('room-name').textContent='遗忘林地';$('objective').textContent='穿过月光，追寻你的第一枚影子';$('room-tag').innerHTML='猎场 <span>01 / 05</span>';updateBuild();updateUI();refreshResume();}
// Appearance is independent of combat skills and survives camp restoration.
const professions=[
 {id:'shade',name:'影子猎手',tag:'原初形象 · 暗夜行者',color:'#96e5dc',mark:'⟡',description:'披上暗色斗篷，以熟悉的猎手形象探索五境。',detail:'游戏中使用原版猎手形象。'},
 {id:'sun',name:'暖阳伙伴',tag:'全新形象 · 黄色伙伴',color:'#f4d276',mark:'☼',image:'assets/character-sun.png',description:'圆滚滚的黄色伙伴，带着长耳朵和温暖的好奇心进入长梦。',detail:'游戏中替换为黄色角色，具有移动起伏、攻击倾身与闪避动作。'},
 {id:'bull',name:'牛角伙伴',tag:'角色形象 · 从容守望',color:'#e2bc78',mark:'♉',image:'assets/character-bull.png',description:'弯弯牛角与淡定的眼神，大步走进未知的梦境。',detail:'使用牛角伙伴的人物形象，保留统一的战斗能力。'},
 {id:'orange',name:'橙嘴伙伴',tag:'角色形象 · 快乐冒险',color:'#f3aa62',mark:'✧',image:'assets/character-orange.png',description:'戴上小小果帽，带着招牌笑容，把冒险变成一场游乐。',detail:'使用橙嘴伙伴的人物形象，保留统一的战斗能力。'},
 {id:'round',name:'圆肚伙伴',tag:'角色形象 · 慢热好奇',color:'#dce38c',mark:'◉',image:'assets/character-round.png',description:'圆圆肚子与绿色大眼睛，安静地陪你走过五境。',detail:'使用圆肚伙伴的人物形象，保留统一的战斗能力。'},
 {id:'basket',name:'运球小将',tag:'专属形象 · 篮球绝技',color:'#efba79',mark:'◉',image:'assets/character-basket.png',description:'头顶小鸡，手握篮球。就算身处长梦，也要投出漂亮的一球。',detail:'专属 V 技能「穿梦三分」：朝鼠标位置抛投，落地造成范围伤害。8 秒冷却，保留原有 Q 影技。'}


];
professions.push(...[['q-shadow','影','hero-shadow-hunter'],['q-shadow-f','汐','hero-shadow-hunter-f']].map(([id,name,asset])=>({id,name:'影子猎手 · '+name,tag:'甜梦云原 · Q 版伙伴',color:'#9edbcf',mark:'✦',image:window.HUNTER_Q_ART?.sources[asset],description:'来自甜梦云原设计稿的冒险伙伴。',detail:'使用 QMap 原画；移动、攻击与闪避时呈现轻盈动作。'})));
let characterAppearance='shade';
try{const saved=localStorage.getItem('shadow-hunter-appearance');if(professions.some(p=>p.id===saved))characterAppearance=saved;}catch{}
let professionChoice=characterAppearance,professionTutorial=false,professionMode='new',appearanceReturn=null;
let monsterChoice='mob-wolf',monsterGroup='mob',monsterDraft={};
const MONSTERS=window.HUNTER_MONSTERS;
// Keep the actual underlying panel nodes, including their event handlers and choices.
// Opening a wardrobe over a reward, shop, dialogue or pause screen must not discard it.
function rememberAppearanceReturn(){
 if(appearanceReturn)return;
 const card=$('modal-card');
 appearanceReturn={phase:state.phase,modalReturn,modalType:state.modalType,kind:$('modal').dataset.kind,
  hidden:$('modal').classList.contains('hidden'),introHidden:$('intro').classList.contains('hidden'),
  nodes:Array.from(card.childNodes||[]),scroll:card.scrollTop,focus:document.activeElement};
}
function closeAppearance(){
 if(!appearanceReturn)return;
 const previous=appearanceReturn;appearanceReturn=null;
 state.phase=previous.phase;state.modalType=previous.modalType;modalReturn=previous.modalReturn;
 const card=$('modal-card');card.replaceChildren(...previous.nodes);card.scrollTop=previous.scroll;
 $('modal').dataset.kind=previous.kind||'';$('modal').classList.toggle('hidden',previous.hidden);
 $('intro').classList.toggle('hidden',previous.introHidden);keys={};mouse.down=false;
 updateUI();if(previous.focus?.isConnected)previous.focus.focus({preventScroll:true});else canvas.focus({preventScroll:true});
}
function openProfession(tutorial=true){
 if(state.phase!=='intro')return;
 rememberAppearanceReturn();professionMode='new';professionChoice=characterAppearance;professionTutorial=tutorial;renderProfession();
}
function openResumeProfession(){
 if(state.phase!=='intro')return false;
 if(getCampSave().status!=='ready'){refreshResume();toast('未找到可用的营地存档。',3);return false;}
 rememberAppearanceReturn();professionMode='resume';professionChoice=characterAppearance;renderProfession();return true;
}
function openCharacterWardrobe(){
 if(['profession','monsters'].includes(state.phase))return;
 rememberAppearanceReturn();professionMode='switch';professionChoice=characterAppearance;renderProfession();
}
function renderProfession(){
 const scroll=state.phase==='profession'?$('modal-card').scrollTop:0;
 const chosen=professions.find(p=>p.id===professionChoice)||professions[0];
 const resume=professionMode==='resume',switching=professionMode==='switch',saved=resume?getCampSave():null;
 const title=resume?'换个伙伴，继续归途。':switching?'换一种姿态，接着冒险。':'以何种姿态，踏入长梦？';
 const note=resume?'确认后读取同一份营地存档，保留已保存的任务、装备与世界进度。':switching?'确认后立即切换；当前生命、任务、装备和技能冷却继续保留。':professionTutorial?'所选人物将立即出现在教学和正式探索中。':'确认后直接进入月蚀森林。';
 showModal('profession',`<div class="profession-heading"><div><div class="modal-eyebrow">APPEARANCE / ${resume?'继续存档 · 选择人物':'人物形象'}</div><h2 id="modal-title">${title}</h2><p>同行伙伴，自由选择。运球小将另有 V 键篮球绝技。</p></div><button class="secondary" id="profession-back">${switching?'取消 · 返回':'返回首页'} <kbd>Esc</kbd></button></div>${saved?.status==='ready'?`<div class="appearance-save"><span>即将继续的营地存档</span><b>${saveDescription(saved.data)}</b></div>`:''}<div class="profession-grid">${professions.map((p,i)=>`<button class="profession-card ${p.id===chosen.id?'selected':''}" data-profession="${p.id}" style="--profession-color:${p.color}" aria-pressed="${p.id===chosen.id}"><span class="profession-number">0${i+1} / ${p.id===chosen.id?'已选择':'可选择'}</span><span class="profession-art ${p.image?'has-image':p.id}" aria-hidden="true">${p.image?`<img src="${p.image}" alt="">`:`<span class="profession-sigil">${p.mark}</span><i></i>`}</span><span class="profession-copy"><small>${p.tag}</small><strong>${p.name}</strong><span>${p.description}</span><b>${p.id===chosen.id?'✓ 已选择':'选择此形象 ↗'}</b></span></button>`).join('')}</div><div class="profession-confirm"><div><small>当前选择 · ${chosen.name}</small><p>${chosen.detail}</p><span>${note}</span></div><button class="primary" id="profession-confirm">${resume?'以'+chosen.name+'继续存档':switching?'切换为'+chosen.name:'以'+chosen.name+'出发'} ↗</button></div>`);
 $('modal-card').querySelectorAll('[data-profession]').forEach(b=>b.onclick=()=>selectProfession(b.dataset.profession));
 $('profession-back').onclick=closeAppearance;$('profession-confirm').onclick=confirmProfession;
 requestAnimationFrame(()=>{$('modal-card').scrollTop=scroll;$('modal-card').querySelector('[data-profession="'+chosen.id+'"]')?.focus({preventScroll:true});});
}
function selectProfession(id){if(state.phase!=='profession'||!professions.some(p=>p.id===id))return;professionChoice=id;renderProfession();}
function confirmProfession(){
 if(state.phase!=='profession')return;
 const p=professions.find(p=>p.id===professionChoice);if(!p)return;
 if(professionMode==='resume'&&getCampSave().status!=='ready'){closeAppearance();refreshResume();toast('存档暂时无法读取，请重试。',3);return;}
 const tutorial=professionTutorial;characterAppearance=p.id;
 let saved=true;try{localStorage.setItem(selectedTheme==='cloud'?'shadow-hunter-q-appearance':'shadow-hunter-appearance',characterAppearance);}catch{saved=false;}
 if(professionMode==='switch'){closeAppearance();refreshEncounterAppearance();updateHudPortrait();updateBasketballHud();toast('已切换为'+p.name+(saved?'':' · 本次已生效，浏览器保存失败'),3);return;}
 if(professionMode==='resume'){appearanceReturn=null;resumeCamp();if(!saved)toast('人物已切换，本次有效；浏览器未能记住形象。',4);return;}
 appearanceReturn=null;
 const depart=()=>{closeModal('intro');if(tutorial)beginTutorial();else start();};
 let read=false;try{read=localStorage.getItem('shadow-hunter-prologue-v1')==='read';}catch{}
 if(read)depart();else showPrologue(depart);
}
function openMonsterWardrobe(){
 if(!MONSTERS||['profession','monsters'].includes(state.phase))return;
 if(isCloud()){rememberAppearanceReturn();renderQCreatures();return;}
 rememberAppearanceReturn();monsterDraft=MONSTERS.preferences();renderMonsterWardrobe();
}
function renderQCreatures(selected='bubble'){
 const creatures=Object.entries(window.HUNTER_Q_THEME.variants).map(([id,v])=>({id,name:v.name,tip:v.tip,asset:id==='bubble'?'bubble-mob':'mob-'+id}));
 creatures.push(...CAMPAIGN.qWorlds.map((w,i)=>({id:w.id,name:w.boss,tip:w.name+'的首领：完成任意三项活动后开启，打破外壳，再戳破护卫泡泡。',asset:['mob-giant','mob-drop','mob-bee','mob-mirror','nightmare-marshmallow'][i]})));
 const chosen=creatures.find(c=>c.id===selected)||creatures[0];
 showModal('monsters',`<div class="modal-eyebrow">SWEET DREAM / 甜梦图鉴</div><h2 id="modal-title">认识这片世界的小伙伴</h2><p>八种怪物与五位首领，使用 QMap 提供的对象原画。被碰到只会减速，不损失生命。</p><div class="q-creature-detail"><img src="${window.HUNTER_Q_ART.sources[chosen.asset]}" alt="${chosen.name}"><div><h3>${chosen.name}</h3><p>${chosen.tip}</p></div></div><div class="q-creature-grid">${creatures.map(c=>`<button data-q-creature="${c.id}" aria-pressed="${c.id===chosen.id}"><img src="${window.HUNTER_Q_ART.sources[c.asset]}" alt=""><span>${c.name}</span></button>`).join('')}</div><button class="primary" id="q-creatures-close">返回旅程 · Esc</button>`);
 $('modal-card').querySelectorAll('[data-q-creature]').forEach(b=>b.onclick=()=>renderQCreatures(b.dataset.qCreature));$('q-creatures-close').onclick=closeAppearance;
}
function renderMonsterWardrobe(){
 const entry=MONSTERS.catalog.find(e=>e.id===monsterChoice)||MONSTERS.catalog[0];
 const current=monsterDraft[entry.id],actual=MONSTERS.preferences();
 const changed=MONSTERS.catalog.filter(e=>monsterDraft[e.id]!==actual[e.id]).length;
 const list=MONSTERS.catalog.filter(e=>monsterGroup==='boss'?!!e.world:!e.world);
 const names={standard:'标准 Q 版',soft:'超 Q 版',original:'原版画风'};
 showModal('monsters',`<div class="profession-heading"><div><div class="modal-eyebrow">BESTIARY / 怪物形象</div><h2 id="modal-title">给梦境里的对手，换个模样。</h2><p>选择一种敌人，再挑选形象。小怪、变体与五境首领均可单独设置。</p></div><button class="secondary" id="monster-back">取消 · 返回 <kbd>Esc</kbd></button></div><div class="monster-layout"><aside class="monster-browser"><div class="monster-filters" aria-label="敌人分类"><button data-monster-group="mob" aria-pressed="${monsterGroup==='mob'}">小怪与变体 <small>11</small></button><button data-monster-group="boss" aria-pressed="${monsterGroup==='boss'}">BOSS <small>5</small></button></div><div class="monster-roster">${list.map(e=>`<button data-monster="${e.id}" class="monster-entry ${e.id===entry.id?'selected':''}" aria-pressed="${e.id===entry.id}" style="--profession-color:${e.color}"><img src="${MONSTERS.source(e.id,monsterDraft[e.id])||e.standard}" alt=""><span><strong>${e.name}</strong><small>${names[monsterDraft[e.id]]}</small></span></button>`).join('')}</div></aside><section class="monster-detail" style="--profession-color:${entry.color}"><div class="monster-detail-heading"><small>${entry.role}</small><h3>${entry.name}</h3><p>当前选择：${names[current]} · ${current===actual[entry.id]?'已应用':'待确认'}</p></div><div class="monster-style-grid">${['standard','soft'].map(style=>`<button class="profession-card ${current===style?'selected':''}" data-monster-style="${style}" aria-pressed="${current===style}"><span class="profession-number">${current===style?'✓ 已选择':'选择此形象'}</span><span class="profession-art has-image"><img src="${MONSTERS.source(entry.id,style)}" alt="${entry.name} · ${names[style]}"></span><span class="profession-copy"><strong>${names[style]}</strong><span>${style==='standard'?'清晰轮廓，保留装备与种族特征。':'圆润比例，柔和色彩与大眼睛。'}</span></span></button>`).join('')}</div><button class="monster-original ${current==='original'?'selected':''}" data-monster-style="original" aria-pressed="${current==='original'}">${icon(entry.type)}<span><b>原版画风</b><small>使用游戏原有的怪物绘制</small></span><strong>${current==='original'?'✓':'↗'}</strong></button><div class="monster-presets"><span>整套应用</span><button data-monster-preset="standard">全部标准 Q 版</button><button data-monster-preset="soft">全部超 Q 版</button><button data-monster-preset="original">全部原版</button></div></section></div><div class="profession-confirm"><div><small>${changed?'已调整 '+changed+' 类敌人':'16 类敌人 · 两套新形象'}</small><p>确认后，场景中的敌人和遭遇对话会同步更新。</p><span>形象选择自动记住；敌人的技能、数值和任务身份保持原样。</span></div><button class="primary" id="monster-confirm">应用形象 · 返回旅途 ↗</button></div>`);
 $('monster-back').onclick=closeAppearance;
 $('modal-card').querySelectorAll('[data-monster-group]').forEach(b=>b.onclick=()=>{monsterGroup=b.dataset.monsterGroup||b.dataset['monster-group'];monsterChoice=MONSTERS.catalog.find(e=>monsterGroup==='boss'?!!e.world:!e.world).id;renderMonsterWardrobe();});
 $('modal-card').querySelectorAll('[data-monster]').forEach(b=>b.onclick=()=>{monsterChoice=b.dataset.monster;renderMonsterWardrobe();});
 $('modal-card').querySelectorAll('[data-monster-style]').forEach(b=>b.onclick=()=>{monsterDraft[entry.id]=b.dataset.monsterStyle||b.dataset['monster-style'];renderMonsterWardrobe();});
 $('modal-card').querySelectorAll('[data-monster-preset]').forEach(b=>b.onclick=()=>{for(const e of MONSTERS.catalog)monsterDraft[e.id]=b.dataset.monsterPreset||b.dataset['monster-preset'];renderMonsterWardrobe();});
 $('monster-confirm').onclick=()=>{const saved=MONSTERS.apply(monsterDraft);closeAppearance();refreshEncounterAppearance();toast(saved?'怪物形象已应用并保存':'形象已应用，本次有效；浏览器未能保存。',3);};
}
// The lamp gathers voices and memories; it does not add a second progression save.
const journeyStory={
 forest:{title:'第一章 · 没有熄灭的灯',arrival:'镇外的脚印停在月蚀森林。你提着最后一盏灯，发现一根系在树枝上的旧丝带——伙伴们来过这里。先沿石路找到斥候补给箱，再点亮三枚印记，追问守门的月狼。',clue:'灯罩里浮出一行熟悉的字：“我们没有丢下你。别相信这里的月亮。”第一道声音回到灯中，却还无法走出长梦。',boss:'我吃掉的不是旅人，是他们不肯醒来的等待。你也在等谁，对吗？',reply:'我不是来等的。我来带他们回家。'},
 forge:{title:'第二章 · 把温度留下',arrival:'一粒温热的煤晶落进灯芯。裂谷深处，有人一直替晴昼镇添着最后一炉火。关闭散热阀、守住余火，才能听清炉心里的留言。',clue:'你听见伙伴的喘息：“再添一把火，他醒来时就不会冷了。”原来他们进入长梦，是为了替你挡住那一夜。第二道声音融进灯火。',boss:'火总要有东西可烧。你想带走他们，准备拿什么来换？',reply:'不是每一份温暖，都需要谁被烧成灰。'},
 tide:{title:'第三章 · 潮声替你回答',arrival:'海潮反复送回同一声呼唤。伙伴把记忆藏在三座航标之间。点亮航标、穿过浅滩，你或许能听见灯夜真正发生的事。',clue:'潮声里终于传来完整的约定：“让他留在那边。我们轮流守住门。”他们不是去看流星。他们在山顶发现了吞噬小镇的长梦，却把纸条写得像一场普通出游。',boss:'留下最快乐的那一天，就再也不用经历告别。为什么还要醒来？',reply:'因为他们还在等我。快乐不能靠把人困住来保存。'},
 ruins:{title:'第四章 · 不再独自留下',arrival:'裂谷的余火与群岛的潮光在旧城交汇。古代机关刻着“日、月、星”，像镇上灯节的顺序。复原机关，寻找那条被抹掉的归路。',clue:'石壁上的旧誓终于显出最后一行：“归路并不只容一人。将愿意等候的灯连成一线，守门者也能同行。”你把四道伙伴的声音聚进灯里，第一次看见了不必牺牲谁的办法。',boss:'每一次开门，都有人必须留下。这是我守了一千年的秩序。',reply:'你守住了前半句。后半句，被藏起来了。'},
 eclipse:{title:'终章 · 这次一起回家',arrival:'王庭中央悬着晴昼镇所有熄灭的窗灯。暮影君王说，归路只能留给一个人。可你手中的灯里，已经有了四道回应。守住梦灯，净化裂隙，让所有灯火相连。',clue:'你没有交出任何一个人的影子。四道声音一同应答，王庭的窗灯逐盏亮起。守门的人第一次松开手，晴昼镇的清晨从裂隙另一侧照了进来。',boss:'门只能让一个人通过。选吧：醒来的人，还是你想救的人？',reply:'我们已经找到另一条路。这次，谁也不用留下。'}
};
function storyCompanions(){return professions.filter(p=>p.id!==characterAppearance).slice(0,4);}
function storyChapterMarkup(id,ending=false){
 const chapter=journeyStory[id];if(!chapter)return '';
 const friends=storyCompanions(),index=CAMPAIGN.catalog.findIndex(w=>w.id===id);
 const companion=friends[Math.min(index,3)];
 return `<section class="story-chapter"><small>最后一盏归途灯 / ${ending?'记忆回响':'旅途线索'}</small><h3>${chapter.title}</h3><p>${ending?chapter.clue:chapter.arrival}</p>${ending&&id!=='eclipse'?`<span>灯中的同行者 · ${companion.name}</span>`:''}${ending&&id==='eclipse'?'<p>清晨，你们在晴昼镇门口醒来。桌上的点心已经凉了，窗前却一盏灯也没有熄。有人问，流星还看不看。你把灯放回窗边：“看。下次一起去。”</p><p class="story-last">“这次换我走在前面。你们记得，把灯留着。”</p>':''}</section>`;
}
function showPrologue(after=()=>closeModal('intro')){
 // Start with a fresh scene before freezing it; never retain the previous run's pixels.
 reset();draw();
 const feedback=$('feedback-canvas'),fg=feedback.getContext('2d');fg.setTransform(1,0,0,1,0,0);fg.clearRect(0,0,feedback.width,feedback.height);
 const hero=professions.find(p=>p.id===characterAppearance)||professions[0];
 const voice=storyCompanions()[0];
 const lines=[
 {side:'enemy',name:'晴昼镇 · 灯夜',text:'在晴昼镇，不管谁晚归，窗前总会留一盏灯。今晚，你和伙伴约好去山顶看流星。'},
 {side:'hero',text:'……睡过头了？大家怎么都不在？'},
 {side:'enemy',name:'桌上的纸条',text:'“我们先出发啦。沿着灯走，这次可别再迷路。”'},
 {side:'enemy',name:'空无一人的街道',text:'点心还温着，整座小镇却空了。天上的月亮缺了一块，伙伴的脚印消失在一片不该存在的森林前。'},
 {side:'enemy',name:voice.name+' · 灯中的声音',text:'“别来找我们……这里的天，不会亮。”'},
 {side:'hero',text:'你们说过，不管谁晚归，都要留一盏灯。'},
 {side:'hero',text:'这次换我走在前面。等着我，我们一起回家。'}
 ];
 encounterDialogue={hero,name:'最后一盏归途灯',lines,index:0,elapsed:0,revealed:0,after,prologue:true};
 showModal('encounter',`<div class="vn-scene"><div class="vn-heading"><span>PROLOGUE / 最后一盏归途灯</span><button id="vn-skip">跳过序章 · Esc</button></div><div class="vn-actors"><div id="vn-hero" class="vn-actor vn-hero">${hero.image?`<img src="${hero.image}" alt="${hero.name}">`:'<div class="vn-original" role="img" aria-label="影子猎手"></div>'}</div><div id="vn-enemy" class="vn-actor vn-enemy"><div class="story-lamp" role="img" aria-label="最后一盏归途灯"><span>✦</span><small>总有人，为你留灯</small></div></div></div><section class="vn-box" aria-label="故事序章"><div class="vn-name"><h2 id="modal-title"></h2><small id="vn-counter"></small></div><p id="vn-text" aria-live="polite"></p><div class="vn-controls"><span>点击继续 · 空格 / 回车</span><button id="vn-next" class="primary">继续 ▸</button></div></section></div>`);
 $('vn-next').onclick=advanceEncounter;$('vn-text').onclick=advanceEncounter;$('vn-skip').onclick=finishEncounter;renderEncounterLine();
}
// Visual-novel encounters pause the entire combat simulation.
const encounterScripts={
 wolf:{name:'月影狼',lines:['别再往前。月光照不到的地方，都是我的猎场。','你的影子在发抖。它比你更清楚，这片森林吞下过什么。'],reply:'那就让它看清楚——这一次，谁才是猎人。'},
 fire:{name:'焚火者',lines:['听见了吗？余烬里还有他们的声音。','我把归路烧成了灰。你也想留下一点温度吗？'],reply:'火能烧毁道路，却烧不掉我要回去的理由。'},
 shield:{name:'铁幕守卫',lines:['止步。门后的名字，早已从世界上抹去了。','我守的不是一扇门，是最后一道不能破碎的誓言。'],reply:'如果誓言只剩囚禁，也该有人替它找到出口。'},
 giant:{name:'沉岩巨人',lines:['小小的脚步……又把长梦吵醒了。','我在这里等了太久，久到山也忘记了我的名字。'],reply:'我会记住你。但先让我走过这里。'},
 ghost:{name:'失语游魂',lines:['你……看得见我？他们都说，我只是月光里的雾。','别把我留在这里。也别……成为下一个我。'],reply:'如果你已经忘了归路，我会替你找到。'},
 archer:{name:'缄默弓手',lines:['你踩断了第三根枯枝。第一根时，我就已经瞄准了。','在这片长梦里，迟疑的人没有第二次呼吸。'],reply:'那就看看，你的箭能不能追上我的影子。'},
 mirror:{name:'镜中客',lines:['别急着举起武器。看清楚，我用的是谁的脸？','你想夺取我的影子……还是想把自己的影子找回来？'],reply:'镜子会说谎。脚下的路不会。'},
 swarm:{name:'低语虫群',lines:['一个声音太孤独了。加入我们，就再也不会害怕。','我们记得每个迷路的人。现在，也记住了你。'],reply:'我宁愿独自醒来，也不愿在低语里忘记自己。'},
 cinder:{name:'余烬祭司',lines:['天空落下的不是星，是最后一场火雨。','站稳吧，旅人。让余烬替你念完名字。'],reply:'我的名字，还轮不到灰烬来写。'},
 stalker:{name:'潜影者',lines:['别回头。你身后的那道影子，已经不是你的了。','你每靠近一步，我就离你更近一点。'],reply:'藏得再深，也总有被光照到的时刻。'},
 sentinel:{name:'古誓哨兵',lines:['身份不明。归路封锁。请交出你的影子。','千年前的命令，至今有效。'],reply:'那我就用今天的答案，改写它。'}
};
let encounterSeen=new Set(),encounterDialogue=null;
try{const stored=JSON.parse(localStorage.getItem('shadow-hunter-dialogues-v1')||'[]');if(Array.isArray(stored))encounterSeen=new Set(stored.filter(k=>typeof k==='string').slice(-100));}catch{}
function encounterKey(e){return state.world.id+':'+(e.boss?'boss':e.variant||e.type);}
function encounterPortrait(e){
 const entry=MONSTERS?.entryFor(e,state.world?.id||'forest'),source=entry&&MONSTERS.source(entry.id);if(source)return source;
 const portrait=document.createElement('canvas');portrait.width=320;portrait.height=360;
 if(typeof portrait.toDataURL!=='function'||!window.HUNTER_ART)return '';
 try{const g=portrait.getContext('2d');if(e.type==='wolf'){g.translate(160,200);g.scale(3.15,3.15);window.HUNTER_ART.wolf(g,{...e,x:0,y:0,r:28}, {x:-100,y:0},0);}else window.HUNTER_ART.hunter(g,160,260,-.6,shadows[e.type].color,3.8,true,0,false,'blade',{});return portrait.toDataURL('image/png');}catch{return '';}
}
function openEncounter(e){
 if(isCloud())return false;
 if(!e||e.dead||!state.world||state.phase!=='playing'||state.tutorial||state.mode==='practice'||encounterSeen.has(encounterKey(e)))return false;
 const script=encounterScripts[e.variant]||encounterScripts[e.type];if(!script)return false;
 const hero=professions.find(p=>p.id===characterAppearance)||professions[0];
 const name=e.boss?campaignWorld().boss:script.name;
 const lines=e.boss?[
 {side:'enemy',text:`${campaignWorld().name}的封印，终于还是被你打开了。`},
 {side:'hero',text:'我带着这里留下的印记而来。长梦，该结束了。'},
 {side:'enemy',text:journeyStory[state.world.id].boss},
 {side:'hero',text:journeyStory[state.world.id].reply}
 ]:[{side:'enemy',text:script.lines[0]},{side:'hero',text:hero.id==='shade'?'我不是第一个来到这里的人，但我会继续走下去。':'大家都说这里很危险。但总得有人，往前走一步。'},{side:'enemy',text:script.lines[1]},{side:'hero',text:script.reply}];
 encounterDialogue={key:encounterKey(e),name,hero,enemy:e,lines,index:0,elapsed:0,revealed:0,portrait:encounterPortrait(e)};
 modalReturn='playing';
 showModal('encounter',`<div class="vn-scene"><div class="vn-heading"><span>ENCOUNTER / ${campaignWorld().name}</span><button id="vn-skip">跳过对话 · Esc</button></div><div class="vn-actors"><div id="vn-hero" class="vn-actor vn-hero">${hero.image?`<img src="${hero.image}" alt="${hero.name}">`:'<div class="vn-original" role="img" aria-label="影子猎手"></div>'}</div><div id="vn-enemy" class="vn-actor vn-enemy">${encounterDialogue.portrait?`<img src="${encounterDialogue.portrait}" alt="${name}">`:`<div class="vn-enemy-symbol">${icon(e.type)}</div>`}</div></div><section class="vn-box" aria-label="剧情对话"><div class="vn-name"><h2 id="modal-title"></h2><small id="vn-counter"></small></div><p id="vn-text" aria-live="polite" aria-atomic="true"></p><div class="vn-controls"><span>点击继续 · 空格 / 回车</span><button id="vn-next" class="primary">继续 ▸</button></div></section></div>`);
 $('vn-next').onclick=advanceEncounter;$('vn-text').onclick=advanceEncounter;$('vn-skip').onclick=finishEncounter;
 renderEncounterLine();return true;
}
function refreshEncounterAppearance(){
 const d=encounterDialogue;if(state.phase!=='encounter'||!d)return;
 d.hero=professions.find(p=>p.id===characterAppearance)||professions[0];
 $('vn-hero').innerHTML=d.hero.image?`<img src="${d.hero.image}" alt="${d.hero.name}">`:'<div class="vn-original" role="img" aria-label="影子猎手"></div>';
 if(d.enemy){d.portrait=encounterPortrait(d.enemy);$('vn-enemy').innerHTML=d.portrait?`<img src="${d.portrait}" alt="${d.name}">`:`<div class="vn-enemy-symbol">${icon(d.enemy.type)}</div>`;}
 const line=d.lines[d.index];$('modal-title').textContent=line.name||(line.side==='hero'?d.hero.name:d.name);
}
function renderEncounterLine(){
 const d=encounterDialogue;if(!d)return;d.elapsed=0;d.revealed=0;
 const line=d.lines[d.index];$('modal-title').textContent=line.name||(line.side==='hero'?d.hero.name:d.name);
 $('vn-counter').textContent=(d.index+1)+' / '+d.lines.length;
 $('vn-text').textContent='';$('vn-next').textContent='显示全文 ▸';
 $('vn-hero').classList.toggle('speaking',line.side==='hero');$('vn-enemy').classList.toggle('speaking',line.side==='enemy');
}
function updateEncounter(dt){
 const d=encounterDialogue;if(state.phase!=='encounter'||!d)return;
 d.elapsed+=dt;const text=d.lines[d.index].text;const count=Math.min(text.length,Math.floor(d.elapsed*32));
 if(count!==d.revealed){d.revealed=count;$('vn-text').textContent=text.slice(0,count);}
 if(count===text.length)$('vn-next').textContent=d.index===d.lines.length-1?(d.prologue?'提灯出发 ▸':'进入战斗 ▸'):'继续 ▸';
}
function advanceEncounter(){
 const d=encounterDialogue;if(state.phase!=='encounter'||!d)return;
 const text=d.lines[d.index].text;
 if(d.revealed<text.length){d.elapsed=text.length/32;d.revealed=text.length;$('vn-text').textContent=text;$('vn-next').textContent=d.index===d.lines.length-1?(d.prologue?'提灯出发 ▸':'进入战斗 ▸'):'继续 ▸';return;}
 if(++d.index>=d.lines.length){finishEncounter();return;}renderEncounterLine();
}
function finishEncounter(){
 if(state.phase!=='encounter'||!encounterDialogue)return;
 const dialogue=encounterDialogue;
 if(dialogue.prologue){try{localStorage.setItem('shadow-hunter-prologue-v1','read');}catch{}}
 else{encounterSeen.add(dialogue.key);try{localStorage.setItem('shadow-hunter-dialogues-v1',JSON.stringify([...encounterSeen].slice(-100)));}catch{}}
 encounterDialogue=null;
 if(dialogue.after){dialogue.after();return;}
 closeModal('playing');player.invincible=Math.max(player.invincible,1.2);
}
function checkEncounter(){
 if(isCloud()||!state.world||state.phase!=='playing'||state.bossWon||state.tutorial||state.mode==='practice'||player.dash>0||state.capture>0||state.journey.recall>0)return false;
 // Never interrupt an active fight or an incoming attack to introduce another foe.
 if(projectiles.some(p=>p.enemy&&p.life>0)||hazards.some(h=>!h.friendly&&h.life>0)||enemies.some(e=>!e.dead&&(e.telegraph>0||e.dash>0||e.hit>0||e.aggro)))return false;
 const candidates=enemies.filter(e=>!e.dead&&!e.exposed&&!encounterSeen.has(encounterKey(e))&&distance(e,player)<(e.scout?340:540)&&worldVisible(e.x,e.y)).sort((a,b)=>distance(a,player)-distance(b,player));
 return candidates.length?openEncounter(candidates[0]):false;
}
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
let levelCelebration=null;
function skillGrowth(id){
 const level=state.levels[id],xp=state.xp[id],base=level===0?0:7,target=level===0?7:18;
 const progress=level>=2?100:clamp((xp-base)/(target-base)*100,0,100);
 return `<div class="skill-growth"><div><span>${level>=2?'影技已觉醒':'距下一级还需 '+Math.max(0,target-xp)+' 次击败'}</span><small>Lv.${level+1}${level>=2?' · MAX':''}</small></div><div class="skill-growth-track" role="progressbar" aria-label="${skills[id].name}升级进度" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%;background:${shadows[id].color}"></i></div></div>`;
}
function celebrateLevelUp(id,previous,next){
 if(!skills[id]||next<=previous)return;
 const color=shadows[id].color,title=next>=2?'影技觉醒':'影技进阶';
 levelCelebration={id,previous,next,remaining:4};
 const card=$('level-up');card.style.setProperty('--level-color',color);
 card.innerHTML=`<div class="level-spark" aria-hidden="true">✦</div>${skillIcon(id)}<div class="level-up-copy"><small>${title} / LEVEL UP</small><h3>${skills[id].name} <span>Lv.${previous+1} → Lv.${next+1}</span></h3><p>伤害倍率 ${100+previous*22}% → ${100+next*22}%<span>基础冷却 ${(4.8-previous*.4).toFixed(1)}s → ${(4.8-next*.4).toFixed(1)}s</span></p><div class="level-stars" aria-label="${next+1}级">${Array.from({length:sealCount()},(_,i)=>i).map(i=>`<i class="${i<=next?'lit':''}">◆</i>`).join('')}${next>=2?'<b>已达最高等级</b>':'<b>新的力量，回应了你</b>'}</div></div>`;
 card.classList.remove('hidden','level-pop');void card.offsetWidth;card.classList.add('level-pop');
 const subdued=releaseSettings().atmosphere===false||reducedMotion?.matches;
 ring(player.x,player.y,subdued?55:85,color,subdued?.45:.8);
 if(!subdued){ring(player.x,player.y,115,'#e4eec3',1);burst(player.x,player.y-12,color,16,95);}
 textFloat(player.x,player.y-85,title+' · Lv.'+(next+1),color);
 tone(660,.13,'triangle',.035);tone(880,.22,'sine',.025);syncAchievements();
}
function updateLevelCelebration(dt){
 if(!levelCelebration)return;levelCelebration.remaining-=dt;
 if(levelCelebration.remaining<=0){levelCelebration=null;$('level-up').classList.add('hidden');}
}
let killRewards=[];
function renderKillRewards(){
 $('kill-rewards').innerHTML=killRewards.map(r=>`<div class="kill-reward ${r.relic?'rare':''}">${itemIcon(r.itemId)}<div class="kill-reward-copy"><small>${r.title}</small><strong>${r.item}</strong><span>${r.detail}</span></div></div>`).join('');
}
function showKillReward(e,loot,details){
 const item=CAMPAIGN.items[loot];killRewards.push({itemId:loot,title:e.boss?'首领已击败':e.elite?'精英斩杀奖励':'斩杀奖励',item:item?item.name+' ×1':e.boss?'通关奖励即将结算':'战斗成长',relic:item?.kind==='relic',detail:(item?item.rarity+' · 已放入行囊 / ':'')+details.join(' · '),remaining:4});
 killRewards=killRewards.slice(-3);renderKillRewards();textFloat(e.x,e.y-55,item?'+'+item.name:'影技经验 +1',item?.kind==='relic'?'#d0a9ef':'#e6d394');
}
function updateKillRewards(dt){
 if(!killRewards.length)return;for(const r of killRewards)r.remaining-=dt;
 const active=killRewards.filter(r=>r.remaining>0);if(active.length!==killRewards.length){killRewards=active;renderKillRewards();}
}
function gainKill(e,captured=false){if(e.dead)return;e.dead=true;if(e.scout&&captured&&state.world)state.world.trailCaptured=true;if(captured&&state.objective?.targetId===e.id)state.objective.captured=true;state.kills++;state.captures+=captured?1:0;if(state.adventure){state.adventure.kills++;state.adventure.captures+=captured?1:0;}if(state.kills===1&&state.world&&!state.tutorial&&state.mode==='hunt')celebrateFirstDefeat();
 const hpBefore=player.hp,focusBefore=player.focus,coinsBefore=CAMPAIGN.garage(state.campaign).coins;
 const loot=state.world&&!e.boss?expeditionReward('enemy:'+e.id,e.elite?'elite':'monster'):null;recordChain();for(const id of new Set(state.slots.filter(Boolean))){state.xp[id]++;const level=state.xp[id]>=18?2:state.xp[id]>=7?1:0;if(level>state.levels[id]){const previous=state.levels[id];state.levels[id]=level;celebrateLevelUp(id,previous,level);}}if(!captured){player.hp=clamp(player.hp+(e.elite?8:3)*(state.corruption>=75?.5:1),0,100);player.focus=clamp(player.focus+8+journeyMods().focus,0,100);burst(e.x,e.y,'#c0d9a3');}if(e.boss){state.bossWon=true;ring(e.x,e.y,280,'#cebae4',1.5);screenShake=12;}if(state.world&&state.mode==='hunt'&&!state.tutorial){
 const details=['影技经验 +1'];const coinGain=CAMPAIGN.garage(state.campaign).coins-coinsBefore;if(coinGain>0)details.push('归途币 +'+coinGain);const hpGain=Math.round((player.hp-hpBefore)*10)/10,focusGain=player.focus-focusBefore;
 if(hpGain>0)details.push('生命 +'+hpGain);if(focusGain>0)details.push('专注 +'+focusGain);
 showKillReward(e,loot,details);
 }updateBuild();syncAchievements();}
function expose(e){if(e.exposed||e.dead)return;e.exposed=e.boss?8:7;state.hitStop=.055;e.telegraph=0;e.dash=0;ring(e.x,e.y,e.r+45,'#dcffe8',.6);textFloat(e.x,e.y-35,'影子暴露','#e0ffec');tone(620,.3,'sine');if(state.tutorial?.step===1){setTutorialStep(2);return;}if(e.scout)toast('斥候影子已暴露：停下攻击，靠近并长按 E 夺影，解锁补给箱',4);else if(state.room===0)toast('影子已暴露！靠近并长按 E 夺影，或攻击收割回血',3);}
function skillCast(){return Object.freeze({active:state.slots[0],level:state.levels[state.slots[0]],corruption:state.corruption,nightmare:state.nightmare>0,skillBonus:journeyMods().skill,attackBonus:journeyMods().attack,origin:Object.freeze({x:player.x,y:player.y})});}
function damageEnemy(e,amount,pressure=amount*.6,source='basic',cast=null){
 if(isCloud()&&e.qKind){hitCloudEnemy(e,amount,source,cast);return;}
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

function hitPlayer(amount,purple=false){if(isCloud()){if(state.phase==='playing'&&player.invincible<=0&&player.dash<=0&&state.journey.recall<=0){state.qSnared=.6;player.invincible=.8;textFloat(player.x,player.y-45,'泡泡减速 · 不掉血','#9c598e');}return;}if(state.tutorial||state.journey.recall>0)return;if(state.phase!=='playing'||player.invincible>0&&!purple||state.nightmare>0)return;if(player.dash>0&&!purple){player.focus=clamp(player.focus+20,0,100);return;}if(player.shield>0){const cast=player.shieldCast||skillCast();player.shield=0;player.shieldCast=null;ring(player.x,player.y,155,'#abcddd');for(const e of living())if(distance(e,player)<170){damageEnemy(e,40,35,'skill',cast);}textFloat(player.x,player.y-40,'防御反击','#a7dbe7');earnMoment('shieldcounter');tone(440,.2,'triangle');return;}if(state.mode==='practice')return;state.journey.streak=0;state.journey.streakTime=0;cancelRecall();state.mounted=false;player.hp-=amount*journeyMods().incoming;player.invincible=.85;state.hits++;state.capture=0;state.captureTarget=null;screenShake=8;burst(player.x,player.y,'#c78088',10);tone(110,.18,'sawtooth',.04);if(player.hp<=0){player.hp=0;if(state.objective?.status==='active')failObjective('你倒在了猎场。','留意攻击预警，用闪避避开红色区域。重试后可以换一套影子再挑战。');else endRun(false);} }
function moveEntity(entity,dx,dy){if(state.world){moveWorldEntity(entity,dx,dy);return;}entity.x=clamp(entity.x+dx,80,W-80);entity.y=clamp(entity.y+dy,120,H-100);for(const o of obstacles){const d=distance(entity,o),min=o.r+entity.r;if(d<min&&d>.01){entity.x=o.x+(entity.x-o.x)/d*min;entity.y=o.y+(entity.y-o.y)/d*min;}}}
function basketballIcon(){return '<span class="basketball-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#ed963b" stroke="#f7cd80" stroke-width="2"/><g fill="none" stroke="#754325" stroke-width="2.2"><path d="M8 32h48M32 8v48M15 15q33 10 34 34M15 49q33-10 34-34"/></g><path d="m14 8 3-5m31 5-3-5" stroke="#d8ecd6" stroke-width="2"/></svg></span>';}
function basketballSkill(){
 if(characterAppearance!=='basket'||state.phase!=='playing'||state.tutorial||state.capture>0)return false;
 if((state.basketballCd||0)>0){toast('篮球绝技还需 '+state.basketballCd.toFixed(1)+' 秒',1.5);return false;}
 cancelRecall();state.mounted=false;
 const dx=mouse.x-player.x,dy=mouse.y-player.y,length=Math.hypot(dx,dy),range=Math.min(600,length),a=length?Math.atan2(dy,dx):player.angle;
 const tx=clamp(player.x+Math.cos(a)*range,30,worldWidth()-30),ty=clamp(player.y+Math.sin(a)*range,30,worldHeight()-30);
 const cast=Object.freeze({...skillCast(),level:0});
 effects.push({kind:'basketball',x:player.x,y:player.y-24,tx,ty,life:.7,max:.7,cast,landed:false});
 state.basketballCd=8;player.angle=a;window.HUNTER_ART?.beginAttack(player,'cast',a);
 textFloat(player.x,player.y-85,'穿梦三分！','#bcead2');tone(460,.1,'triangle',.025);updateBasketballHud();return true;
}
function landBasketball(ball){
 if(ball.landed)return;ball.landed=true;let hits=0;
 for(const enemy of [...enemies]){
  if(enemy.dead||distance(enemy,{x:ball.tx,y:ball.ty})>105+enemy.r)continue;
  const hp=enemy.hp;damageEnemy(enemy,60,45,'skill',ball.cast);
  if(enemy.hp<hp){hits++;if(!enemy.boss){const a=Math.atan2(enemy.y-ball.ty,enemy.x-ball.tx);moveEntity(enemy,Math.cos(a)*35,Math.sin(a)*35);}}
 }
 effects.push({kind:'basketballBounce',x:ball.tx,y:ball.ty,tx:ball.tx,ty:ball.ty,life:.35,max:.35});ring(ball.tx,ball.ty,105,'#a1ead0',.7);burst(ball.tx,ball.ty-5,'#eac583',12,100);
 textFloat(ball.tx,ball.ty-60,hits?(hits>=3?'三分雨！命中 '+hits+' 个':'好球！命中 '+hits+' 个'):'下次一定！',hits?'#def0b1':'#9cb9ae');
 tone(hits?880:330,.16,'triangle',.03);
}
function drawBasketballFlight(ball){
 const p=clamp(1-ball.life/ball.max,0,1),x=ball.x+(ball.tx-ball.x)*p,y=ball.y+(ball.ty-ball.y)*p-Math.sin(p*Math.PI)*(ball.kind==='basketballBounce'?45:145);
 ctx.globalAlpha=ball.kind==='basketballBounce'?0:.6;ctx.strokeStyle='#9cebd0';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(ball.tx,ball.ty,105,0,TAU);ctx.stroke();ctx.setLineDash([]);
 ctx.globalAlpha=.25;ellipse(x,ball.y+(ball.ty-ball.y)*p+18,13,5,'#081c20');ctx.globalAlpha=1;
 ctx.save();ctx.translate(x,y);ctx.rotate(p*TAU*1.5);ctx.fillStyle='#ed963b';ctx.strokeStyle='#553b2b';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(13,0);ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.moveTo(-9,-9);ctx.quadraticCurveTo(10,0,9,9);ctx.moveTo(-9,9);ctx.quadraticCurveTo(10,0,9,-9);ctx.stroke();ctx.restore();
}
function updateBasketballHud(){
 const button=$('basketball-button'),visible=characterAppearance==='basket'&&!state.tutorial&&state.phase!=='intro';button.classList.toggle('hidden',!visible);
 if(!visible)return;const cd=state.basketballCd||0;
 button.innerHTML='<kbd>V</kbd>'+basketballIcon()+'<span>'+(cd>0?'冷却 '+cd.toFixed(1)+'s':'穿梦三分')+'</span>';
 button.disabled=state.phase!=='playing'||cd>0;button.title='专属篮球绝技：朝鼠标位置投球，落地造成范围伤害。8 秒冷却，最远 600。';
}
function basicAttack(charged=false){if(state.tutorial?.step===0){toast('先用 WASD 走进练习圈，再学习攻击');return;}if(state.phase!=='playing'||state.attackCd>0||state.capture>0)return;cancelRecall();state.mounted=false;state.attackCd=charged?.52:.3;player.angle=angle(player,mouse);player.slash=.2;window.HUNTER_ART?.beginAttack(player,state.weapon,player.angle,charged);const dmg=charged?53:26,press=charged?40:19;
 if(state.weapon==='bow'){shoot(player.x,player.y,player.angle,charged?650:540,dmg*.8,shadows.archer.color,{pressure:press,life:1.4,pierce:charged});tone(510,.09,'triangle');}
 else{effects.push({kind:'slash',x:player.x,y:player.y,a:player.angle,r:charged?150:115,life:.2,max:.2,color:charged?'#d7e7b4':'#c9f3de'});for(const e of enemies){if(e.dead)continue;const d=distance(e,player),diff=Math.atan2(Math.sin(angle(player,e)-player.angle),Math.cos(angle(player,e)-player.angle));if(d<(charged?160:124)+e.r&&Math.abs(diff)<1.25)damageEnemy(e,dmg,press,'basic');}tone(charged?260:370,.1,'triangle');}
 if(charged)ring(player.x,player.y,45,'#d5e7b6',.3);
}
function dash(){if(state.phase!=='playing'||state.dashCd>0||state.capture>0)return;state.mounted=false;let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);if(!dx&&!dy){dx=Math.cos(player.angle);dy=Math.sin(player.angle);}const n=Math.hypot(dx,dy);player.dx=dx/n;player.dy=dy/n;cancelRecall();player.dash=.18;player.invincible=Math.max(player.invincible,.25);state.dashCd=1.5*journeyMods().dash;tone(210,.15,'triangle');for(const e of enemies){if(!e.dead&&!e.exposed&&e.telegraph>0&&distance(player,e.target||e)<e.r+130){player.focus=clamp(player.focus+22,0,100);e.pressure-=24;textFloat(player.x,player.y-40,'精准闪避','#caffea');earnMoment('perfectdodge');pressureBreak(e);break;}}}
function shoot(x,y,a,speed,damage,color,opts={}){projectiles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,color,r:opts.enemy?6:4,life:opts.life??1.4,enemy:false,pierce:false,hit:new Set(),pressure:damage*.7,cast:opts.enemy?null:skillCast(),...opts});}
function spawnMinion(x,y,color,life=5,cast=skillCast()){minions.push({x,y,a:rand(0,TAU),life,cd:0,color,cast});}
function areaDamage(x,y,r,damage,pressure=damage*.7,source='skill',cast=skillCast()){for(const e of living())if(Math.hypot(e.x-x,e.y-y)<r+e.r){damageEnemy(e,damage,pressure,source,cast);}}
function executeSkill(id,a,cast=skillCast()){state.mounted=false;
 const col=shadows[id].color,x=player.x,y=player.y;
 if(id==='wolf'){
  const end=worldTravelEnd(x,y,clamp(x+Math.cos(a)*240,40,worldWidth()-40),clamp(y+Math.sin(a)*240,40,worldHeight()-40)),tx=end.x,ty=end.y;
  effects.push({kind:'beam',x,y,tx,ty,life:.4,max:.4,color:col,width:24});
  for(const e of living()){const vx=tx-x,vy=ty-y,t=clamp(((e.x-x)*vx+(e.y-y)*vy)/(vx*vx+vy*vy||1),0,1);if(Math.hypot(e.x-(x+vx*t),e.y-(y+vy*t))<65)damageEnemy(e,58,48,'skill',cast);}
  player.x=tx;player.y=ty;moveEntity(player,0,0);player.invincible=Math.max(player.invincible,.45);
 }else if(id==='fire'){
  effects.push({kind:'slash',visual:'fire',x,y,a,r:230,life:.55,max:.55,color:col});
  for(const e of living()){const diff=Math.atan2(Math.sin(angle(player,e)-a),Math.cos(angle(player,e)-a));if(distance(player,e)<250&&Math.abs(diff)<1.1){damageEnemy(e,64,36,'skill',cast);e.burn=4;e.burnCast=cast;}}
 }else if(id==='shield'){
  player.shield=Math.max(player.shield,3);player.shieldCast=cast;ring(x,y,130,col,.7);areaDamage(x,y,145,42,44,'skill',cast);
 }else if(id==='archer')for(let i=-1;i<=1;i++)shoot(x,y,a+i*.15,620,48,col,{pierce:true,life:1.3,skill:true,cast});
 tone(480,.3,'triangle',.08);player.slash=.3;window.HUNTER_ART?.beginAttack(player,'cast',a);
}
function skill(){
 if(state.phase!=='playing')return;if(state.tutorial&&state.tutorial.step<4){toast('先完成当前教学，再试用技能');return;}
 if(state.skillCd>0){toast('技能冷却中',1);return;}if(state.capture>0)return;cancelRecall();
 const id=state.slots[0];state.skillCd=skillCooldown(id);player.angle=angle(player,mouse);executeSkill(id,player.angle,skillCast());
 state.corruption=state.mode==='practice'||isCloud()?0:clamp(state.corruption+skillCorruptionCost(),0,100);
 if(state.corruption>=100&&state.nightmare<=0){if(state.locked){endRun(true,'corrupt');return;}state.nightmare=9;state.skillCd=0;syncAchievements();toast('梦魇觉醒 · 9 秒无敌、双倍伤害',4);ring(player.x,player.y,350,'#c08fe1',1.3);}updateBuild();
}
function combo(){const info=skills[state.slots[0]];return {name:info.name,description:info.summary,tags:[info.tag],active:true};}
let quickInventorySignature='';
function hideItemTooltip(){$('item-tooltip').classList.add('hidden');}
function showItemTooltip(id,button){
 const item=CAMPAIGN.items[id];if(!item||!(state.campaign.inventory[id]>0))return;
 const equipped=state.campaign.equipped===id,tooltip=$('item-tooltip');
 tooltip.innerHTML=`<div class="item-tooltip-heading">${itemIcon(id)}<div><small>${item.rarity} · ${item.kind==='relic'?'护符装备':'营地补给'}</small><strong>${item.name}</strong></div></div><p>${item.description}</p><div class="item-tooltip-meta"><span>持有 ${state.campaign.inventory[id]} 件</span>${equipped?'<b>✓ 已装备 · 效果生效中</b>':''}</div><small class="item-tooltip-help">${item.kind==='relic'?'在营地或星图行囊中佩戴；同时只能佩戴一件护符。':'在营地或星图行囊中使用，使用一次消耗一件。'}${item.effect.heal&&state.corruption>=75?'当前梦蚀较高，生命恢复效果减半。':''}</small>`;
 tooltip.classList.remove('hidden');
 const rect=button.getBoundingClientRect(),width=270,viewport=window.innerWidth||1200,height=window.innerHeight||800;
 const left=rect.left>=width+20?rect.left-width-12:Math.min(viewport-width-12,rect.left+rect.width+12);
 tooltip.style.left=Math.max(12,left)+'px';tooltip.style.top=Math.max(12,Math.min(height-(tooltip.offsetHeight||230)-12,rect.top))+'px';
}
function quickItemButton(id){const item=CAMPAIGN.items[id],equipped=state.campaign.equipped===id;return `<button class="quick-item ${equipped?'equipped':''}" data-quick-item="${id}" aria-label="${item.name}，${state.campaign.inventory[id]} 件${equipped?'，已装备':''}" aria-describedby="item-tooltip">${itemIcon(id)}<span class="quick-item-count">${state.campaign.inventory[id]}</span>${equipped?'<i class="quick-item-equipped">✓</i>':''}<span class="quick-item-name">${item.name}</span></button>`;}
function updateQuickInventory(){
 const panel=$('quick-inventory'),active=!!state.world&&state.mode==='hunt'&&state.phase!=='intro';panel.classList.toggle('hidden',!active);
 if(!active){hideItemTooltip();return;}
 const garage=CAMPAIGN.garage(state.campaign),ride=CAMPAIGN.rides[garage.selected];
 const ids=Object.keys(CAMPAIGN.items).filter(id=>state.campaign.inventory[id]>0),signature=JSON.stringify([garage.coins,garage.selected,garage.owned,!!state.mounted,state.campaign.equipped,ids.map(id=>[id,state.campaign.inventory[id]]),state.corruption>=75]);
 if(signature===quickInventorySignature)return;quickInventorySignature=signature;hideItemTooltip();
 const equipment=ids.filter(id=>CAMPAIGN.items[id].kind==='relic'),supplies=ids.filter(id=>CAMPAIGN.items[id].kind==='supply');
 const total=ids.reduce((n,id)=>n+state.campaign.inventory[id],0);
 $('quick-inventory-content').innerHTML=`<div class="quick-wallet">¤ ${garage.coins}<button id="shop-locate">定位商店 ↗</button></div><div class="quick-ride">${ride?rideIcon(ride.id):uiGlyph('box')}<div><strong>${ride?ride.name:'尚无载具'}</strong><small>${ride?ride.description:'营地旁购买 · 按 H 上下车'}</small><button id="mount-button" ${!ride?'disabled':''}>${state.mounted?'H · 下车':'H · 上车'}</button></div></div><div class="quick-inventory-total">${ids.length} 种物品 · ${total} 件</div><section><div class="quick-section-title"><h3>装备</h3><small>${state.campaign.equipped?'已佩戴 '+CAMPAIGN.items[state.campaign.equipped].name:'尚未佩戴护符'}</small></div><div class="quick-item-grid">${equipment.map(quickItemButton).join('')||'<p class="quick-empty">通关世界有机会获得护符。</p>'}</div></section><section><div class="quick-section-title"><h3>道具</h3><small>在营地使用</small></div><div class="quick-item-grid">${supplies.map(quickItemButton).join('')||'<p class="quick-empty">击败敌人、探索宝箱来收集补给。</p>'}</div></section>`;
 $('mount-button').onclick=toggleRide;$('shop-locate').onclick=()=>{if(state.phase!=='playing')return;state.world.track='shop';toast('商店已标记 · 按 M 查看地图，靠近按 F',3);};
 $('quick-inventory-content').querySelectorAll('[data-quick-item]').forEach(button=>{
  const id=button.dataset.quickItem||button.dataset['quick-item'];
  button.addEventListener('mouseenter',()=>showItemTooltip(id,button));button.addEventListener('focus',()=>showItemTooltip(id,button));button.onclick=()=>showItemTooltip(id,button);
  button.addEventListener('mouseleave',hideItemTooltip);button.addEventListener('blur',hideItemTooltip);
 });
}
function updateBuild(){
 const id=state.slots[0],info=skills[id];
 $('compact-name').textContent=info.name;
 $('compact-slots').innerHTML='<button class="active-skill" aria-label="更换技能：'+info.name+'">'+skillIcon(id)+'<span><b>'+info.summary+'</b><small>Lv.'+(state.levels[id]+1)+' · '+info.tag+'</small></span><span class="active-skill-edit">⇄</span></button>'+skillGrowth(id);
 $('compact-slots').querySelector('button').onclick=()=>openBuild();
 $('shadow-slots').innerHTML='<button class="active-skill">'+skillIcon(id)+'<span><b>'+info.name+'</b><small>'+info.summary+'</small></span></button>';
 $('shadow-slots').querySelector('button').onclick=()=>openBuild();
 $('skill-button').innerHTML='<kbd>Q</kbd>'+skillIcon(id)+'<span id="skill-label">'+info.name+'</span>';
 $('build-name').textContent=info.name;$('build-description').textContent=info.use;
 $('build-tags').innerHTML='<span>'+skillCooldown().toFixed(1)+' 秒冷却</span><span>梦蚀 +'+skillCorruptionCost()+'</span>';
 $('resonance-status').textContent='已装备';$('run-count').textContent=String(Math.max(1,runCount)).padStart(2,'0');
}

function updateHudPortrait(){
 const hero=professions.find(p=>p.id===characterAppearance)||professions[0],portrait=$('hud-portrait');
 $('hud-character-name').textContent=hero.name;
 if(portrait.dataset.appearance===hero.id)return;
 portrait.dataset.appearance=hero.id;portrait.setAttribute('aria-label',hero.name);portrait.classList.toggle('character-avatar',!!hero.image);
 portrait.innerHTML=hero.image?`<img src="${hero.image}" alt="" draggable="false">`:'⟡';
}
function updateUI(){updateBasketballHud();updateHudPortrait();updateQuickInventory();updateJourneyUI();updateModeUI();updateContextHint();updateWorldUI();updateJourneyHint();const hp=Math.ceil(player.hp),focus=Math.floor(player.focus);$('hp-text').textContent=`${hp} / 100`;$('health-bar').style.width=hp+'%';$('focus-bar').style.width=focus+'%';$('focus-text').textContent=`${focus} / 100`;$('kills').textContent=String(state.kills).padStart(2,'0');$('corruption-text').textContent=Math.floor(state.corruption);$('corruption-bar').style.width=state.corruption+'%';$('timer').textContent=formatTime(state.time);$('phase-label').textContent=state.tutorial?'新手教学':state.mode==='practice'&&state.phase==='playing'?'自由试炼':state.world&&state.phase==='playing'?'旷野探索':({intro:'等待入梦',playing:'狩猎进行中',paused:'梦境暂停',map:'岔路抉择',pickup:'夺影成功',end:'梦境终了',build:'选择技能',codex:'影子图鉴',guide:'猎人手册',atlas:'子地图星图',inventory:'整理行囊',worldVictory:'世界通关',worldmap:'查看全图',profession:'选择人物',monsters:'怪物形象',worldIntro:'整装待发',worldComplete:'印记取得',camp:'营地休整',settlement:'冒险结算',discovery:'探索收获',briefing:'任务准备',missionFailed:'任务未完成'}[state.phase]||'长梦之中');$('weapon-name').textContent=`折叠弓刃 · ${state.weapon==='blade'?'刃形':'弓形'}`;$('skill-label').textContent=state.skillCd>0?`冷却 ${state.skillCd.toFixed(1)}s`:skills[state.slots[0]].name;$('skill-button').style.setProperty('--cooldown',Math.min(100,state.skillCd/skillCooldown()*100)+'%');$('skill-button').classList.toggle('cooling',state.skillCd>0);$('dash-label').textContent=state.dashCd>0?`${state.dashCd.toFixed(1)}s`:'闪避';$('corruption-description').textContent=state.nightmare>0?`梦魇形态 ${state.nightmare.toFixed(1)}s · 双倍伤害 / 无敌`:state.locked?'梦魇已觉醒一次 · 再满 100 将进入同化结局':state.corruption>=75?'梦蚀 ≥75 · 治疗减半，喝药可以净化':state.corruption>=40?'梦蚀正在加深 · 影技增伤，谨慎使用黑暗':`每次 Q +${skillCorruptionCost()} 梦蚀；普攻免费。75 起治疗减半，首次 100 强化，再次 100 同化。`;$('depth-label').textContent=`0${state.room+1} / 05`;$('route').innerHTML=Array.from({length:5},(_,i)=>`<span class="route-node ${i===state.room?'current':i<state.room?'done':''}"><span>${i<state.room?'✓':i===4?'☾':'·'}</span></span>`).join('');const boss=enemies.find(e=>e.boss&&!e.dead);if(boss){$('boss-bar').style.width=clamp(boss.hp/boss.maxHp*100,0,100)+'%';$('boss-phase').textContent=isCloud()?(boss.phase===1?'第一阶段 · 戳破泡泡外壳':'第二阶段 · 先清除小泡泡，再戳本体'):boss.exposed?'影子暴露 · 长按 E 夺影':boss.phase===2?'第二阶段 · 饥饿觉醒':'月蚀的守门者';}}
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
 if(before<=15&&player.hp>before)earnMoment('lastsip');
 toast(`饮用月露：恢复 ${Math.round(player.hp-before)} 生命，净化 12 梦蚀`,2.5);tone(680,.2);updateUI();return true;
}
function cancelRecall(){if(state?.journey)state.journey.recall=0;recallOrigin=null;}
let recallOrigin=null,memoryCamp=null;const memoryCamps={};
function beginAdventure(){state.adventure={elapsed:0,kills:0,captures:0,items:{},owned:[...state.owned],perks:[...state.journey.perks],claimed:[...state.world.claimed],completed:state.world.completed.size};state.settlement=null;}
function recordAdventureLoot(id){if(state.adventure&&CAMPAIGN.items[id])state.adventure.items[id]=(state.adventure.items[id]||0)+1;}
function recallBlocked(){
 if(!state.world||state.mode!=='hunt'||state.tutorial)return '请在正式冒险中使用回城';
 if(player.dash>0||state.capture>0||mouse.down)return '停止攻击、闪避或夺影，再引导回营';
 return null;
}
function startRecall(){
 if(!state.world||state.phase!=='playing')return false;
 if(state.journey.recall>0){cancelRecall();toast('已取消回营',2);return false;}
 const reason=recallBlocked();if(reason){toast(reason,3);return false;}
 recallOrigin={x:player.x,y:player.y};state.journey.recall=3;player.charging=0;mouse.held=0;
 ring(player.x,player.y,100,'#a9efd9',1);tone(660,.35,'sine');
 toast('归途法阵已展开 · 静止 3 秒回城，移动或主动操作取消',3);updateUI();return true;
}
function arriveCamp(settle=false){state.mounted=false;
 if(settle&&state.settlement)return;
 if(settle){if(player.hp>0&&player.hp<=10)earnMoment('closecall');if(Object.values(state.adventure?.items||{}).reduce((n,v)=>n+v,0)>=10)earnMoment('shopping');}
 if(settle&&state.bossWon&&!state.world.victory)completeCampaignWorld(false);
 const abandoned=state.objective?.site?.name||null;
 if(settle){
  state.objective=null;state.checkpoint=null;state.world.missionCheckpoint=null;state.pendingBoons=[];
  enemies=enemies.filter(e=>!e.mission&&!e.boss);hazards=[];projectiles=[];minions=[];effects=[];floating=[];
  for(const e of enemies){e.aggro=false;e.telegraph=0;e.target=null;e.attack=null;e.dash=0;e.burn=0;e.bleed=0;e.cd=Math.max(1.5,e.cd);if(!e.dead&&distance(e,WORLD.sites[0])<600){const home=distance(e.home,WORLD.sites[0])>=600?e.home:nearestFreeWorldPosition(950,1400,e.r);e.x=home.x;e.y=home.y;}}
  if(state.nightmare>0){state.nightmare=0;state.locked=true;state.corruption=Math.min(25,state.corruption);}
  state.bossWon=false;state.capture=0;state.hitStop=0;state.roomType='world';
 }
 cancelRecall();state.capture=0;state.captureTarget=null;player.x=WORLD.sites[0].x;player.y=WORLD.sites[0].y;
 player.dash=0;player.invincible=2;player.charging=0;keys={};mouse.down=false;mouse.held=0;state.world.near=WORLD.sites[0];
 $('capture-hud').classList.add('hidden');$('boss-hud').classList.add('hidden');
 updateCamera(0,true);
 if(settle){
  const a=state.adventure||{elapsed:state.time,kills:state.kills,captures:state.captures,items:{},owned:[],perks:[],claimed:[],completed:0};
  state.settlement={elapsed:a.elapsed,kills:a.kills,captures:a.captures,items:{...a.items},skills:[...state.owned].filter(id=>!a.owned.includes(id)),perks:state.journey.perks.filter(id=>!a.perks.includes(id)),discoveries:[...state.world.claimed].filter(id=>!a.claimed.includes(id)),completed:Math.max(0,state.world.completed.size-a.completed),abandoned,campSaved:false,profileSaved:false};
  state.phase='camp';saveSettlement();syncAchievements();showSettlement();tone(880,.5,'triangle');
 }else openCamp();
}
function leaveWorldMission(){
 if(!state.world?.missionCheckpoint||state.phase!=='missionFailed')return false;
 restoreWorldCheckpoint(state.world.missionCheckpoint);$('boss-hud').classList.add('hidden');arriveCamp();
 $('camp-status').textContent='已撤回营地：保留任务开始前的收获，本次失败任务的消耗已还原。';return true;
}
function updateJourney(dt){
 const j=state.journey;j.flaskCd=Math.max(0,j.flaskCd-dt);j.streakTime=Math.max(0,j.streakTime-dt);if(!j.streakTime)j.streak=0;
 if(j.recall<=0)return;
 const moving=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].some(k=>keys[k])||recallOrigin&&distance(player,recallOrigin)>.5;
 if(moving||recallBlocked()){cancelRecall();toast('回城已取消 · 保持静止即可重新引导',2);return;}
 j.recall=Math.max(0,j.recall-dt);if(j.recall<.000001){j.recall=0;arriveCamp(true);}
}
function getCampSave(theme=selectedTheme){const saved=memoryCamps[theme];return saved?{status:'ready',data:saved,temporary:true}:EXPEDITION.read(campStorage(),theme);}
function saveSettlement(){
 const report=state.settlement;if(!report)return false;
 const previous=state.phase;state.phase='camp';report.campSaved=saveCamp();state.phase=previous;
 report.profileSaved=campaignSave();return report.campSaved&&report.profileSaved;
}
function closeSettlement(){if(state.phase!=='settlement')return;const owned=new Set(state.owned),slots=[...state.slots],profile=state.campaign;reset();state.owned=owned;state.slots=slots;state.campaign=profile;updateBuild();updateUI();refreshResume();$('continue-run').focus({preventScroll:true});}
function showSettlement(){
 const r=state.settlement;if(!r)return;const w=campaignWorld(),items=Object.entries(r.items).filter(([,n])=>n>0).sort(([a],[b])=>(CAMPAIGN.items[b].kind==='relic')-(CAMPAIGN.items[a].kind==='relic'));
 const count=items.reduce((sum,[,n])=>sum+n,0),saved=r.campSaved&&r.profileSaved;
 const growth=[...r.skills.map(id=>`新技能 · ${skills[id].name}`),...r.perks.map(id=>`祝福 · ${JOURNEY.perks.find(p=>p.id===id).name}`),...r.discoveries.map(id=>`探索 · ${allWorldSites().find(d=>d.id===id)?.name||id}`)];
 showModal('settlement',`<section class="return-report" style="--world-color:${w.color}"><header class="return-heading"><div class="return-emblem">${uiGlyph('home')}</div><div><div class="modal-eyebrow">JOURNEY COMPLETE / ${w.name}</div><h2 id="modal-title">归来，满载故事。</h2></div><button id="settlement-x" class="return-close" aria-label="关闭结算并返回首页" title="关闭 · Esc">×</button></header><p class="return-subtitle">已抵达初始营地，火光为你留着。<br>这一程走过的路，和带回来的收获，都在这里。</p><div class="return-stats"><div class="return-stat time">${uiGlyph('clock')}<strong>${formatTime(r.elapsed)}</strong><small>本轮冒险用时</small></div><div class="return-stat">${uiGlyph('seal')}<strong>${r.kills}</strong><small>击败梦魇</small></div><div class="return-stat">${uiGlyph('star')}<strong>${r.captures}</strong><small>成功夺影</small></div><div class="return-stat">${uiGlyph('box')}<strong>${count}</strong><small>获得物品</small></div></div><div class="return-section-head"><h3>本轮战利品</h3><span>${items.length} 种 · ${count} 件</span></div><div class="return-loot-grid">${items.map(([id,n])=>{const item=CAMPAIGN.items[id];return `<article class="return-loot ${item.kind}"><div class="return-loot-icon">${itemIcon(id)}</div><div class="return-loot-copy"><small>${item.rarity} · ${item.kind==='relic'?'护符装备':'营地补给'}</small><h4>${item.name}</h4><p>${item.description}</p></div><b class="return-quantity">×${n}</b></article>`;}).join('')||`<div class="return-empty">${uiGlyph('box')}<b>这一程，平安也是收获。</b><p>本轮暂未获得装备或道具。现有行囊仍然保留。</p></div>`}</div>${growth.length?`<div class="return-section-head"><h3>旅途成长</h3><span>新印记 ${r.completed}</span></div><div class="return-growth">${growth.map(s=>`<span>${s}</span>`).join('')}</div>`:''}<footer class="return-footer"><div id="settlement-status" class="return-save ${saved?'':'is-warning'}" role="status">${uiGlyph(saved?'check':'box')}<span>${saved?'收获与营地进度已保存':'收获暂存于本页 · 浏览器保存未完成'}<small>${saved?'下次点击首页「继续营地存档」，带着当前装备出发。':'可关闭结算回首页并继续；请勿刷新或关闭网页，稍后重试保存。'}</small></span></div><div class="return-actions"><button id="settlement-retry" class="secondary ${saved?'hidden':''}">重试保存</button><button id="settlement-close" class="primary">关闭结算 · 返回首页 ${uiGlyph('arrow')}</button></div></footer><p class="return-note">用时仅计入实际冒险，阅读面板和暂停不计时。${r.abandoned?`已结束未完成的「${r.abandoned}」，已获得的物品全部保留。`:''}补给若已在本轮使用，会计入获得数量；剩余数量可在行囊查看。</p></section>`);
 $('settlement-close').onclick=closeSettlement;$('settlement-x').onclick=closeSettlement;
 $('settlement-retry').onclick=()=>{saveSettlement();showSettlement();};
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
 if(!state.world)return null;const o=state.objective;if(isCloud()&&o){const t=o.kind==='bubble'?enemies.find(e=>e.qActivity===o.site.id&&!e.dead):QMAP.target(o,player);if(t)return {...t,name:t.name||'戳破标记泡泡',color:o.site.color};}if(o?.nodes&&o.activated){const n=o.nodes.find((_,i)=>!o.activated.includes(i));if(n)return n;}if(o?.kind==='hunt'){const e=enemies.find(e=>o.targets.includes(e.id)&&!e.dead);if(e)return {...e,name:'清剿目标',color:campaignWorld().color};}const site=currentWorldSite(state.world.track);
 if(isCloud()&&!WORLD.river.vertical){const r=WORLD.river,across=player.y<r.y&&site.y>r.y+r.h||player.y>r.y+r.h&&site.y<r.y;if(across){const x=[...WORLD.bridges].sort((a,b)=>Math.abs(player.x-a)+Math.abs(site.x-a)-Math.abs(player.x-b)-Math.abs(site.x-b))[0],north=player.y<r.y,approach=Math.abs(player.x-x)>75;return {x,y:approach?(north?r.y-80:r.y+r.h+80):(north?r.y+r.h+80:r.y-80),name:'云朵桥 · 前往'+site.name,color:site.color,bridge:true};}return site;}
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
 $('recall-label').textContent=j.recall>0?'取消回营':'传送回城';$('recall-button').disabled=false;$('recall-button').classList.toggle('is-channeling',j.recall>0);
 $('field-risk').textContent=state.nightmare>0?`梦魇 ${state.nightmare.toFixed(1)}s · 双倍伤害 / 无敌`:`梦蚀 ${Math.floor(state.corruption)} / 100 · ${state.locked?'再次满值将同化':state.corruption>=75?'治疗减半':`Q +${skillCorruptionCost()}`}`;
 $('field-risk').classList.toggle('is-danger',state.corruption>=75||state.locked);
 $('recall-progress').classList.toggle('hidden',j.recall<=0);$('recall-progress').innerHTML=`<div class="recall-copy"><span>归途法阵 · 保持静止</span><b>${j.recall.toFixed(1)} 秒</b></div><div class="recall-meter"><i style="width:${clamp((3-j.recall)/3*100,0,100)}%"></i></div>`;
 const s=currentWorldSite(state.world.track),waypoint=navigationTarget(),dx=waypoint.x-player.x,dy=waypoint.y-player.y;
 const direction=['东','东南','南','西南','西','西北','北','东北'][(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 $('journey-stage').textContent=`世界 ${campaignWorld().number} · Lv.${campaignWorld().level} · ${Math.min(state.world.completed.size,sealCount())} / ${sealCount()} 印记 → ${campaignWorld().boss}`;
 $('journey-target').textContent=state.objective?`当前任务：${state.objective.site.name}`:`下一站：${s.name}`;
 $('journey-direction').textContent=state.objective?'完成条件见画面右上 · 阅读面板时计时暂停':distance(player,s)<130?'已抵达 · 按 F 互动':`${direction}方 · ${Math.round(distance(player,waypoint))} 步${waypoint.bridge?` · 经${waypoint.name}`:' · M 选择目标'}`;
 $('journey-perks').innerHTML=j.perks.length?j.perks.map(id=>{const p=JOURNEY.perks.find(p=>p.id===id);return `<span title="${p.description}">${p.symbol} ${p.name}</span>`;}).join(''):'<span>完成印记任务，选择猎人祝福</span>';
 $('journey-chain').textContent=j.streak>0?`${j.streak} 连猎 · ${Math.ceil(j.streakTime)}s / 每 3 连额外奖励`:`最佳连猎 ${j.bestStreak} · 受伤中断`;
}

function formatTime(t){return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
function showModal(type,html){cancelRecall();state.capture=0;state.captureTarget=null;player.charging=0;mouse.held=0;$('capture-hud').classList.add('hidden');state.phase=type;state.modalType=type;keys={};mouse.down=false;$('modal-card').innerHTML=html;$('modal-card').scrollTop=0;$('modal').dataset.kind=type;$('modal').classList.remove('hidden');$('intro').classList.add('hidden');updateUI();requestAnimationFrame(()=>{$('modal-card').querySelector('button')?.focus({preventScroll:true});});}
function closeModal(next=modalReturn){state.phase=next;state.modalType=null;$('modal').classList.add('hidden');if(next==='intro')$('intro').classList.remove('hidden');keys={};mouse.down=false;canvas.focus({preventScroll:true});updateUI();}
function pause(){if(state.phase==='paused'){closeModal();return;}if(state.phase!=='playing'&&state.phase!=='intro')return;modalReturn=state.phase;showModal('paused',`<div class="modal-eyebrow">THE DREAM CAN WAIT</div><h2 id="modal-title">让梦境，停留片刻。</h2><p>C 饮用月露，B 静止 3 秒回城并自动结算保存，F 与营火互动。刷新或退出只保留上次营地存档。</p><div class="pause-summary"><span>印记 <b>${state.world?.completed.size||0} / 3</b></span><span>生命 <b>${Math.ceil(player.hp)} / 100</b></span><span>已掌握 <b>${state.owned.size} / 4</b></span></div><div class="modal-actions"><button class="primary" id="resume">继续狩猎 ↗</button><button class="secondary" id="pause-settings">声音与画面</button><button class="secondary" id="pause-guide">操作指南</button><button class="secondary" id="pause-character">切换人物</button><button class="secondary" id="pause-monster">怪物形象</button><button class="secondary" id="restart">重新入梦</button><button class="secondary" id="pause-home">返回标题</button></div>`);$('resume').onclick=()=>closeModal();$('restart').onclick=()=>confirmLeave(false);$('pause-home').onclick=()=>confirmLeave(true);$('pause-settings').onclick=openSettings;$('pause-guide').onclick=()=>openGuide();$('pause-character').onclick=openCharacterWardrobe;$('pause-monster').onclick=openMonsterWardrobe;}
function openGuide(){
 if(!['intro','playing','paused','guide'].includes(state.phase))return;if(!['paused','guide'].includes(state.phase))modalReturn=state.phase;
 showModal('guide',`<div class="modal-eyebrow">猎人手册</div><h2 id="modal-title">击破，夺影，释放。</h2><div class="guide-visual"><span><kbd>左键</kbd>击破</span><i>→</i><span><kbd>E</kbd>长按夺影</span><i>→</i><span><kbd>Tab</kbd>选择技能</span><i>→</i><span><kbd>Q</kbd>释放</span></div><p>四种技能，装备一个。夺影会学会新技能，并恢复生命。</p><div class="control-chips"><span><kbd>WASD</kbd>移动</span><span><kbd>SPACE</kbd>闪避</span><span><kbd>R</kbd>刀 / 弓</span><span><kbd>C</kbd>喝药</span><span><kbd>M</kbd>地图</span><span><kbd>N</kbd>星图</span><span><kbd>F</kbd>互动</span><span><kbd>B</kbd>回营</span></div><details class="visual-details"><summary>战斗与成长</summary><p>敌人变白后，靠近长按 E 约 1 秒夺影；继续攻击则收割回血。攻击、击杀和精准闪避积累专注，满专注可瞬间夺影。</p><p>Tab 免费换技能，切换保留冷却。使用中的技能随击杀成长，7 / 18 次升至 Lv.2 / Lv.3；每级伤害 +22%，冷却 −0.4 秒。</p><p>普通攻击免费，Q 增加梦蚀并提升伤害。75 起治疗减半；首次到 100 获得 9 秒强化，结束降至 25；再次到 100 会进入同化结局。喝药或营地休整可以净化。</p></details><details class="visual-details"><summary>探索与保存</summary><p>M 查看任务，N 查看五境。完成当前世界三处任务，再挑战首领解锁航路。F 互动与手动保存，B 随时静止 3 秒回城，自动保存并展示本轮结算。关闭结算返回首页，继续营地存档保留装备与进度。</p><p>滚轮调节视野，0 复位。深河走桥，浅沼减速，余烬灼伤。橙红实线圈与箭头表示敌方危险，紫色交叉纹必须走出去。薄荷绿、浅金、冰蓝光轨是你的技能；橙红尖头是敌方飞弹。关闭增强特效仍保留全部危险提示。</p></details><div class="modal-actions"><button class="primary" id="guide-close">返回</button>${modalReturn==='intro'?'<button class="secondary" id="guide-practice">跟着练一遍</button>':''}</div>`);
 $('guide-close').onclick=()=>closeModal();if(modalReturn==='intro')$('guide-practice').onclick=beginTutorial;
}
function openCodex(){openBuild();}
function openBuild(){if(state.tutorial){toast('先按提示完成教学，再用 Tab 换技能');return;}if(!['intro','playing','paused','map','build'].includes(state.phase))return;if(!['build','paused'].includes(state.phase))modalReturn=state.phase;renderBuild();}
function renderBuild(){
 showModal('build',`<div class="skill-heading"><div><div class="modal-eyebrow">猎人技能 · ${state.owned.size} / 4 已学会</div><h2 id="modal-title">选一个，按 Q 释放。</h2></div><button class="secondary" id="build-close">完成 <kbd>Esc</kbd></button></div><p class="skill-intro">点击卡片即可装备 · 免费切换</p>${skillCards()}${characterAppearance==='basket'?`<section class="basketball-codex">${basketballIcon()}<div><small>运球小将专属 · 独立于 Q 影技</small><h3><kbd>V</kbd> 穿梦三分</h3><p>鼠标瞄准落点，抛出篮球。落地造成范围伤害与击退，8 秒冷却，不消耗专注。</p><span>基础伤害 60 · 影压 45 · 落点半径 105 · 最远 600</span></div></section>`:''}<div class="skill-equipped"><kbd>Q</kbd><b>${skills[state.slots[0]].name}</b><span>${skills[state.slots[0]].use}</span></div><details class="visual-details"><summary>成长与施法规则</summary><p>切换保留冷却。击杀 7 / 18 次自动升级；每级伤害 +22%，冷却 −0.4 秒。</p><p>每次 Q 增加 ${skillCorruptionCost()} 梦蚀。75 起治疗减半；首次到 100 强化 9 秒，再次到 100 进入同化结局。喝药可净化。</p><p>${skills[state.slots[0]].detail}</p></details>`);
 bindSkillCards();$('build-close').onclick=()=>{if(modalReturn==='map')showRoute();else closeModal();};
}
function showReward(enemyId,boss=false,next='playing'){
 const id=skillId(enemyId),info=skills[id],known=state.owned.has(id),training=!!state.tutorial;
 state.owned.add(id);syncAchievements();if(training)setTutorialStep(3);
 const heal=state.corruption>=75?12.5:25,before=player.hp,purge=Math.min(10,state.corruption);
 if(!training){player.hp=clamp(player.hp+heal,0,100);state.corruption=Math.max(0,state.corruption-10);}
 showModal('pickup',`<div class="skill-acquired" style="--skill-color:${shadows[id].color}"><div class="modal-eyebrow">${known?'夺影成功':'学会新技能'}</div>${skillIcon(id)}<h2 id="modal-title">${info.name}</h2><p>${info.summary}</p>${skillPreview(id)}<span class="skill-recovery">${training?'鼠标瞄准 · Q 释放':'生命 +'+Math.round((player.hp-before)*10)/10+' · 梦蚀 −'+purge}</span></div><div class="skill-reward-actions"><button class="primary" data-equip="0">${state.slots[0]===id?'继续探索':'装备'+info.name+'　↗'}</button>${training||state.slots[0]===id?'':'<button class="secondary" id="keep-skill">保留'+skills[state.slots[0]].name+'</button>'}</div>`);
 let finished=false;const finish=(equip)=>{if(finished||state.phase!=='pickup')return;finished=true;if(equip)state.slots=[id];updateBuild();playEquipFeedback(id,equip?'equip':'heal');if(training){closeModal('playing');enemies=[];projectiles=[];effects=[];player.x=600;player.y=500;spawnEnemy('giant',820,475);state.skillCd=0;setTutorialStep(4);return;}if(boss){endRun(true);return;}if(next==='map')showRoute();else closeModal(next);};
 $('modal-card').querySelector('[data-equip]').onclick=()=>finish(true);if(!training&&state.slots[0]!==id)$('keep-skill').onclick=()=>finish(false);
}

function showRoute(){
 const next=state.room+1;if(next>=5){endRun(true);return;}
 const choices=next===1?[
  {type:'chase',title:'追猎 · 破镜小径',symbol:'⌁',tag:'45 秒限时 · 镜魔影',text:'镜魔沿林间小径逃窜。45 秒内击破后收割或夺影即可过关；夺取后可获得影箭技能。进入恢复 12 生命。'},
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
 syncAchievements();window.HUNTER_AUDIO?.setScene(win&&ending!=='corrupt'?'victory':'defeat');
 showModal('end',`<div class="ending-emblem ${outcome}">${ending==='corrupt'?'◈':win?'☀':'☾'}</div><div class="modal-eyebrow">${ending==='corrupt'?'ENDING / 长梦同化':win?'CHAPTER COMPLETE / 黎明归来':'THE DREAM IS NOT OVER'}</div><h2 id="modal-title">${ending==='corrupt'?'你，成为了长梦。':win?'长夜将尽，猎人归来。':'影子留在了月光里。'}</h2><p>${ending==='corrupt'?'你再一次拥抱了满溢的梦蚀。猎人与梦魇的边界终于消失，森林迎来了新的主人。营火边的守夜人，再也没有等到你的归来。':win?'月狼的影子在晨风中散去。余烬庭院的灯没有熄灭，失落的名字从祭坛回到了人间。你带回的不只是梦魇的力量，还有这片森林久违的黎明。<br><br><b>《月蚀森林》章节已完成。感谢游玩。</b>':'梦魇夺走了这一次机会。用 R 切换弓形远射，保留闪避应对预警，C 使用月露。也可在游戏设置选择「旅人」难度，再次挑战。'}</p><div class="stats"><div><strong>${formatTime(state.time)}</strong><small>梦中时长</small></div><div><strong>${state.kills}</strong><small>猎杀梦魇</small></div><div><strong>${state.captures}</strong><small>夺取影子</small></div></div><div class="journey-result">最佳连猎 ${state.journey.bestStreak} · 猎人祝福 ${state.journey.perks.length} / 3<br>${state.journey.perks.map(id=>JOURNEY.perks.find(p=>p.id===id).name).join(' · ')||'尚未取得祝福'}</div><p>最终技能：${combo().name}<br>${skills[state.slots[0]].summary}</p><p class="fine-print">通关与结局记录保存在本机「猎人纪事」，不覆盖营地检查点。</p><div class="modal-actions"><button class="primary" id="end-restart">再次踏入长梦 ↗</button><button class="secondary" id="end-home">返回首页</button>${state.world&&EXPEDITION.read(campStorage(),selectedTheme).status==='ready'?'<button class="secondary" id="end-load">回到营地存档</button>':''}</div>`);
 $('end-restart').onclick=()=>{reset();start();};$('end-home').onclick=reset;if(state.world&&EXPEDITION.read(campStorage(),selectedTheme).status==='ready')$('end-load').onclick=resumeCamp;tone(win?660:160,.7,'sine',.07);
}

function updateEnemy(e,dt){if(e.dead)return;if(isCloud()&&e.qKind){updateCloudEnemy(e,dt);return;}e.hit=Math.max(0,e.hit-dt);if(e.exposed){if(e.scout||state.tutorial||state.mode==='practice'&&state.practiceTarget==='dummy')return;e.exposed-=dt;if(e.exposed<=0){if(state.objective&&['capture','chase'].includes(state.objective.kind)&&state.objective.targetId===e.id){e.exposed=0;e.hp=e.maxHp*.5;e.pressure=e.maxPressure;e.cd=1.5;toast(state.objective.kind==='capture'?'目标重新凝聚：再次击破，靠近长按 E 夺取':'镜魔重新凝聚：击破后及时收割或夺影');}else if(e.boss&&e.hp>0){e.exposed=0;e.hp=Math.max(e.hp,e.maxHp*.15);e.pressure=e.maxPressure;e.cd=1.5;toast((state.world?campaignWorld().boss:'月狼')+'重新凝聚了影子！');}else gainKill(e);}return;}
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
function performEnemyAttack(e){if(performVariantAttack(e))return;const t=e.target;if(!t)return;const a=angle(e,t);if(e.attack==='lantern'&&state.journey.recall>0)return;if(e.attack==='lantern'){ring(e.x,e.y,85,'#d07373',.35);const lamp=state.objective?.lantern;if(lamp&&distance(e,lamp)<105){lamp.hp=Math.max(0,lamp.hp-(e.type==='giant'?14:9));ring(lamp.x,lamp.y,65,'#eda874');}return;}if(e.attack==='lunge'){e.dash=e.boss?.58:.36;e.dx=Math.cos(a);e.dy=Math.sin(a);tone(120,.15,'triangle',.04);}else if(e.attack==='slam'){const r=e.boss?160:e.type==='giant'?110:85;ring(e.x,e.y,r,'#d07373',.35);if(distance(player,e)<r+player.r)hitPlayer(e.boss?24:e.elite?18:12);}else if(e.attack==='curse'){ring(t.x,t.y,145,'#b485db',.6);hazards.push({x:t.x,y:t.y,r:135,life:2.3,tick:0,friendly:false,color:'#a36cca',purple:true});}else{const number=e.type==='mirror'?5:e.type==='swarm'?3:1;for(let i=0;i<number;i++)shoot(e.x,e.y,a+(i-(number-1)/2)*.19,e.type==='archer'?260:200,e.elite?16:10,shadows[e.type].color,{enemy:true,life:3});}}
function updateCapture(dt){if(isCloud())return;if(keys.KeyE)state.mounted=false;const pressing=keys.KeyE;if(!pressing){state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');return;}const target=enemies.filter(e=>!e.dead&&e.exposed>0&&distance(e,player)<115).sort((a,b)=>distance(a,player)-distance(b,player))[0];if(!target){state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');return;}if(state.captureTarget!==target){state.capture=0;state.captureTarget=target;}state.capture+=dt;const duration=player.focus>=100?.04:target.boss?1.65:1.05;$('capture-hud').classList.remove('hidden');$('capture-bar').style.width=clamp(state.capture/duration*100,0,100)+'%';if(Math.random()<.6){const t=rand(0,1);burst(target.x+(player.x-target.x)*t,target.y+(player.y-target.y)*t,'#c8f8df',1,25);}if(state.capture>=duration){if(player.focus>=100)player.focus=0;else player.focus=clamp(player.focus+18,0,100);gainKill(target,true);state.capture=0;state.captureTarget=null;keys.KeyE=false;$('capture-hud').classList.add('hidden');tone(780,.55);captureFeedback(target);showReward(target.type,target.boss);}}
function update(dt){if(state.phase==='encounter'){updateEncounter(dt);return;}clock+=dt;updateCamera(dt);if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.add('hidden');}screenShake=Math.max(0,screenShake-dt*32);if(state.phase!=='playing'){return;}if(checkEncounter())return;updateKillRewards(dt);updateLevelCelebration(dt);if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return;}state.time+=dt;if(state.adventure)state.adventure.elapsed+=state.journey.recall>0?Math.min(dt,state.journey.recall):dt;updateJourney(dt);if(state.phase!=='playing')return;state.basketballCd=Math.max(0,(state.basketballCd||0)-dt);state.skillCd=Math.max(0,state.skillCd-dt);state.dashCd=Math.max(0,state.dashCd-dt);state.attackCd=Math.max(0,state.attackCd-dt);player.invincible=Math.max(0,player.invincible-dt);player.shield=Math.max(0,player.shield-dt);player.slash=Math.max(0,player.slash-dt);player.angle=angle(player,mouse);
 if(state.nightmare>0){state.nightmare=Math.max(0,state.nightmare-dt);if(state.nightmare<=0){state.locked=true;state.corruption=25;toast('梦魇褪去 · 再次满梦蚀将进入同化结局',4);updateBuild();}}
 const motionX=player.x,motionY=player.y,motionDash=player.dash>0;
 if(player.dash>0){player.dash-=dt;moveEntity(player,player.dx*820*dt,player.dy*820*dt);effects.push({kind:'afterimage',x:player.x,y:player.y,a:player.angle,life:.25,max:.25,color:'#8dd7c2'});}else if(state.capture<=0){let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);const l=Math.hypot(dx,dy);if(l)moveEntity(player,dx/l*worldMoveSpeed()*dt,dy/l*worldMoveSpeed()*dt);}
 window.HUNTER_ART?.advanceMotion(player,player.x-motionX,player.y-motionY,dt,{dash:motionDash,capture:state.capture>0});
 if(mouse.down){mouse.held+=dt;player.charging=mouse.held;}else player.charging=0;
 for(const e of enemies){updateEnemy(e,dt);attackCue(e);if(state.phase!=='playing')return;}
 for(const p of projectiles){if(p.life<=0)continue;const active=Math.min(dt,p.life);p.life-=dt;p.previousX=p.x;p.previousY=p.y;p.x+=p.vx*active;p.y+=p.vy*active;if(projectileBlocked(p)){p.life=0;continue;}if(p.enemy){if(Math.hypot(p.x-player.x,p.y-player.y)<player.r+p.r){hitPlayer(p.damage);p.life=0;if(state.phase!=='playing')return;}}else for(const e of enemies){if(e.dead||p.hit.has(e.id))continue;if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r){p.hit.add(e.id);damageEnemy(e,p.damage,p.pressure,p.skill?'skill':'basic',p.cast);if(!p.pierce){p.life=0;break;}}}}
 projectiles=projectiles.filter(p=>p.life>0&&p.x>-20&&p.x<worldWidth()+20&&p.y>-20&&p.y<worldHeight()+20);
 for(const m of minions){if(m.life<=0)continue;const active=Math.min(dt,m.life);m.life-=dt;m.cd-=active;const e=nearest(m.x,m.y);if(e){const a=angle(m,e);m.x+=Math.cos(a)*230*active;m.y+=Math.sin(a)*230*active;if(distance(m,e)<e.r+12&&m.cd<=0){damageEnemy(e,8,4,'summon',m.cast);m.cd=.65;burst(m.x,m.y,m.color,3);}}else{m.a+=dt*2;m.x+=(player.x+Math.cos(m.a)*55-m.x)*dt*3;m.y+=(player.y+Math.sin(m.a)*45-m.y)*dt*3;}}
 minions=minions.filter(m=>m.life>0);
 for(const h of hazards){if(h.life<=0)continue;const active=Math.min(dt,h.life);h.life-=dt;h.tick-=active;if(h.tick<=0){h.tick=.42;if(h.friendly){for(const e of living())if(distance(e,h)<h.r+e.r){damageEnemy(e,6,2,'burn',h.cast);e.burn=.6;e.burnCast=h.cast;}}else if(distance(player,h)<h.r+player.r)hitPlayer(h.damage||9,h.purple===true);if(state.phase!=='playing')return;}}hazards=hazards.filter(h=>h.life>0);
 for(const f of effects){f.life-=dt;if(f.kind==='particle'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.97;f.vy*=.97;}if(f.kind==='delayed'&&f.life<=0)f.action();if(f.kind==='basketball'&&f.life<=0)landBasketball(f);}effects=effects.filter(f=>f.life>0);
 for(const f of floating){f.life-=dt;f.y-=30*dt;}floating=floating.filter(f=>f.life>0);
 if(state.phase!=='playing')return;updateCapture(dt);if(state.phase!=='playing')return;
 updateTutorial(dt);if(state.phase!=='playing')return;
 updateObjective(dt);if(state.phase!=='playing')return;updateWorld(dt);if(state.phase!=='playing')return;
 if(state.mode==='practice'&&enemies.every(e=>e.dead)){state.clearTimer+=dt;if(state.clearTimer>.8)practiceTargets(state.practiceTarget);}
 if(!state.world&&!state.tutorial&&state.mode!=='practice'&&!state.objective&&enemies.every(e=>e.dead)){state.clearTimer+=dt;if(state.clearTimer>1.4){if(state.bossWon)endRun(true);else showRoute();}}
 uiElapsed+=dt;if(uiElapsed>.08){updateUI();uiElapsed=0;}}


function openSkillDetails(){
 if(!['intro','playing','paused','skillinfo'].includes(state.phase))return;if(!['paused','skillinfo'].includes(state.phase))modalReturn=state.phase;
 const id=state.slots[0],info=skills[id];
 showModal('skillinfo',`<div class="skill-acquired" style="--skill-color:${shadows[id].color}"><div class="modal-eyebrow">当前技能 · Lv.${state.levels[id]+1}</div>${skillIcon(id)}<h2 id="modal-title">${info.name}</h2><p>${info.summary}</p>${skillPreview(id)}<span class="skill-recovery">${skillCooldown().toFixed(1)} 秒冷却 · 梦蚀 +${skillCorruptionCost()}</span></div><p class="skill-tip">${info.use}</p><details class="visual-details"><summary>详细数值</summary><p>${info.detail}</p><p>以上为基础值，等级、祝福与梦蚀会提升伤害。</p></details><button class="primary" id="skill-info-close">返回</button>`);
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
 $('tutorial-title').textContent=lesson.title;$('tutorial-key').textContent=['WASD','左键','长按 E','点击','Q','✓'][step];$('tutorial-action').textContent=['走进光圈','指向目标攻击','靠近白色目标','装备影箭','指向目标施法','教学完成'][step];
 $('tutorial-text').textContent=['走进目标旁的光圈。','攻击到目标变白，马上停手。','靠近白色目标，持续按住 E。','点击「装备影箭」。','鼠标指向新目标，按 Q。','选一个技能，按 Q 释放。'][step];$('tutorial-note').textContent=lesson.note;
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
 if(t.step===5&&t.elapsed>1.4){$('tutorial-card').classList.add('hidden');showModal('lessonComplete',`<div class="chapter-sigil">${uiGlyph('check')}</div><div class="modal-eyebrow">TUTORIAL COMPLETE</div><h2 id="modal-title">你已学会夺影。</h2><div class="skill-acquired" style="--skill-color:${shadows.archer.color}">${skillIcon('archer')}<p>三箭齐射，穿透敌群。</p></div><p class="choice-instruction">Tab 选技能，Q 释放。</p><button class="primary" id="tutorial-finish">进入森林 ↗</button>`);$('tutorial-finish').onclick=finishTutorial;}
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
 state.slots=[...c.slots];state.owned=new Set(c.owned);state.levels={...c.levels};state.xp={...c.xp};normalizeSkills();state.hitStop=0;
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
 if(o.kind==='defend'&&e.lanternHunter){if(state.journey.recall>0)return true;
  if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0)performEnemyAttack(e);return true;}
  e.cd-=dt;const a=angle(e,o.lantern);
  if(distance(e,o.lantern)>70)moveEntity(e,Math.cos(a)*68*dt,Math.sin(a)*68*dt);
  else if(e.cd<=0){e.target={x:o.lantern.x,y:o.lantern.y};e.attack='lantern';e.telegraph=.9;e.cd=2.3;}
  return true;
 }
 return false;
}
function updateObjective(dt){
 const o=state.objective;if(!o||o.status!=='active'||state.phase!=='playing'||state.journey.recall>0)return;
 if(isCloud()&&QMAP.types.includes(o.kind)){QMAP.step(o,dt,{player,enemies,move:moveEntity,complete:completeWorldMission,tone});return;}
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
 showModal('modeChoice',`<div class="modal-eyebrow">自由试炼</div><h2 id="modal-title">试试每一种影子。</h2><p>四种技能全部开放，换装免费，不会受伤，也不积累梦蚀。可以切换木桩和敌群。</p><div class="explain-box">进入试炼会结束当前狩猎。试炼装备不会带入新的正式狩猎。</div><div class="modal-actions"><button class="primary" id="enter-practice">结束本局，进入试炼 ↗</button><button class="secondary" id="cancel-practice">留在当前狩猎</button></div>`);
 $('enter-practice').onclick=startPractice;$('cancel-practice').onclick=()=>previous==='map'?showRoute():closeModal(previous);
}
function startPractice(){
 requestAnimationFrame(()=>window.scrollTo(0,0));reset();state.mode='practice';state.phase='playing';state.owned=new Set(skillIds);player.focus=100;
 $('intro').classList.add('hidden');$('room-name').textContent='月下试炼场';$('room-tag').innerHTML='自由试炼 <span>4 / 4 技能开放</span>';
 practiceTargets('dummy');updateBuild();updateUI();canvas.focus({preventScroll:true});
 toast('按 Tab 免费换装 · Q 释放技能 · 重置状态可以立即再试',4);
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
function refreshPractice(){state.basketballCd=0;
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
 $('compact-cost').textContent=state.mode==='practice'?'试炼：梦蚀关闭 · 免费换装':`梦蚀 ${Math.floor(state.corruption)} / 100 · ${state.locked?'再满100将同化':state.nightmare>0?'梦魇强化中':state.corruption>=75?'治疗减半':`每次 Q +${skillCorruptionCost()}`}`;
 const o=state.objective,hud=$('mission-hud');if(o&&['hunt','survey','sequence','purify'].includes(o.kind)){hud.classList.toggle('hidden',state.phase!=='playing');hud.innerHTML=o.kind==='hunt'?`<b>${o.site.name}</b><span>清剿 ${o.targets.filter(id=>enemies.find(e=>e.id===id)?.dead).length} / ${o.targets.length} · 标记守卫</span>`:`<b>${o.site.name} · ${o.activated.length} / 3</b><span>${o.kind==='sequence'?'日 → 月 → 星':'循光标探索'} · 靠近按 F</span>`;return;}hud.classList.toggle('hidden',!o||o.kind==='boss'||state.phase!=='playing');
 if(o){hud.innerHTML=o.kind==='defend'?`<b>守灯 ${Math.ceil(o.remaining)}s</b><span>耐久 ${Math.ceil(o.lantern.hp)} / 100 · 第 ${o.wave} / 4 波</span><i style="--progress:${o.lantern.hp}%"></i>`:o.kind==='chase'?`<b>追猎 ${Math.ceil(o.remaining)}s</b><span>金色标记 · 镜魔</span><i style="--progress:${o.remaining/45*100}%"></i>`:'<b>夺取幽灵影</b><span>击破 → 靠近 → 长按 E</span>';}
}
function captureFeedback(e){
 const el=$('capture-flight');el.innerHTML=skillIcon(skillId(e.type));const p=pointOnScreen(e);el.style.left=(p.x*100)+'%';el.style.top=(p.y*100)+'%';el.style.animation='none';void el.offsetWidth;el.style.animation='shadow-arrival .9s ease-in-out forwards';
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
const QMAP=window.HUNTER_Q;
function isCloud(){return !!state.world&&CAMPAIGN.themeOf(state.world.id)==='cloud';}
function activeWorlds(){return CAMPAIGN.forTheme(selectedTheme);}
function themeName(theme=selectedTheme){return theme==='cloud'?'甜梦云原':'五境远征';}
function selectTheme(theme){
 if(state.phase!=='intro'||!['main','cloud'].includes(theme))return false;
 const changed=theme!==selectedTheme;
 selectedTheme=theme;state.campaign=CAMPAIGN.read(campStorage(),theme);
 if(changed){state=freshState();player=newPlayer();}
 characterAppearance=theme==='cloud'?'q-shadow':'shade';
 try{const saved=localStorage.getItem(theme==='cloud'?'shadow-hunter-q-appearance':'shadow-hunter-appearance');if(professions.some(p=>p.id===saved))characterAppearance=saved;}catch{}
 atlasSelected=activeWorlds()[0].id;refreshResume();updateBuild();updateUI();return true;
}
function openTheme(theme){if(selectTheme(theme))openAtlas(activeWorlds()[0].id);}
function openSaveChooser(){
 if(state.phase!=='intro')return;
 showModal('saveChooser',`<div class="modal-eyebrow">CONTINUE / 两个世界，各自的旅程</div><h2 id="modal-title">继续哪一段冒险？</h2><p>每个世界拥有五张子地图，地图解锁、行囊、货币与营地存档各自保存。选择后还可更换人物。</p><div class="theme-saves">${['main','cloud'].map(theme=>{const saved=getCampSave(theme);return `<button class="theme-save" data-resume-theme="${theme}" ${saved.status==='ready'?'':'disabled'}><strong>${themeName(theme)}</strong><span>${saved.status==='ready'?saveDescription(saved.data):saved.status==='legacy'?'旧版单地图存档已保留备份，请从新世界入口出发。':'尚无营地存档，从首页对应世界出发。'}</span><b>${saved.status==='ready'?'选择人物，继续 ↗':'未建立旅程'}</b></button>`;}).join('')}</div><button class="secondary" id="save-chooser-back">返回标题</button>`);
 $('modal-card').querySelectorAll('[data-resume-theme]').forEach(el=>el.onclick=()=>{closeModal('intro');selectTheme(el.dataset.resumeTheme);openResumeProfession();});
 $('save-chooser-back').onclick=()=>closeModal('intro');
}
function drawQHero(){
 if(!['q-shadow','q-shadow-f'].includes(characterAppearance))return false;
 const bob=state.phase==='playing'?Math.sin(clock*9)*(player.moveBlend>0?3:1):0;
 ctx.save();ctx.translate(player.x,player.y+14+bob);if(player.attackPoseTime>0)ctx.rotate(Math.sin(player.attackPoseTime*12)*.12);if(player.dash>0)ctx.scale(1.1,.9);
 const drawn=window.HUNTER_Q_ART?.draw(ctx,characterAppearance==='q-shadow-f'?'hero-shadow-hunter-f':'hero-shadow-hunter',0,0,100)||false;ctx.restore();return drawn;
}
function sealCount(){return isCloud()?3:WORLD.sites.filter(s=>!['camp','boss'].includes(s.kind)).length;}
function collectionCount(){return isCloud()?WORLD.charms.length:worldDiscoveries().length;}
let WORLD=window.HUNTER_WORLD;
function campaignWorld(){return CAMPAIGN.catalog.find(w=>w.id===(state.world?.id||'forest'));}
function showCampaignIntro(){
 const w=campaignWorld();showModal('worldIntro',`<div class="modal-eyebrow">WORLD ${w.number} / Lv.${w.level}–${w.level+2}</div><div class="campaign-intro-sigil" style="color:${w.color}">${w.symbol}</div><h2 id="modal-title">${w.name}</h2><p>${w.description}</p>${storyChapterMarkup(w.id)}<div class="campaign-missions">${WORLD.sites.filter(s=>s.kind!=='camp').map((s,i)=>`<div><span>${s.kind==='boss'?'☾':'0'+(i+1)}</span><b>${s.name}</b><small>${s.hint}</small></div>`).join('')}</div><p class="fine-print">每次出发重置任务，奖励重新随机抽取；已学影子、行囊和世界解锁保留，祝福与影子等级重新成长。完成任务必得随机物品，首次通关必得此境护符。</p><div class="control-chips"><span><kbd>M</kbd>区域地图</span><span><kbd>N</kbd>子地图星图</span><span><kbd>F</kbd>互动</span><span><kbd>B</kbd>回营</span></div><button class="primary" id="world-begin">开始探索 ↗</button>`);
 $('world-begin').onclick=()=>{closeModal('playing');if(state.world.saveOnBegin||EXPEDITION.read(campStorage(),selectedTheme).status==='empty')saveCamp();};
}
function campaignSave(){updateQuickInventory();const ok=CAMPAIGN.save(campStorage(),state.campaign);if(!ok)toast('世界进度暂存在本页；浏览器未能写入，请保留页面并稍后重试保存。',6);return ok;}
function expeditionReward(token,kind){
 if(!state.world||state.mode!=='hunt')return null;
 const result=CAMPAIGN.reward(state.campaign,state.world.id,state.world.visit+':'+token,kind);
 if(!result.duplicate){recordAdventureLoot(result.item);campaignSave();syncAchievements();if(result.item){const item=CAMPAIGN.items[result.item];toast(`获得 ${item.rarity} · ${item.name} ×1（已放入行囊）`,3);}}
 return result.item;
}
function lootMarkup(id){const item=CAMPAIGN.items[id];return item?`<span class="loot-pill ${item.kind}">${itemIcon(id)}${item.rarity} · ${item.name} ×1</span>`:'';}
let atlasReturn='intro',atlasSelected='forest';
function openAtlas(selected){
 if(!['intro','playing','paused','camp','worldmap','atlas','worldVictory','inventory'].includes(state.phase)||state.tutorial||state.mode==='practice')return;
 if(state.phase!=='atlas'&&state.phase!=='inventory')atlasReturn=state.phase==='paused'?'playing':state.phase;
 atlasSelected=activeWorlds().some(w=>w.id===selected)?selected:state.world?.id||(activeWorlds().some(w=>w.id===atlasSelected)?atlasSelected:activeWorlds()[0].id);
 const p=state.campaign,w=activeWorlds().find(w=>w.id===atlasSelected),available=CAMPAIGN.unlocked(p,w.id),missing=w.requires.filter(id=>!p.cleared.includes(id));
 const canTravel=!state.world||state.phase==='worldVictory'||atlasReturn==='worldVictory'||(!state.objective&&distance(player,WORLD.sites[0])<130&&!campThreat());
 const edges=activeWorlds().flatMap(b=>b.requires.map(id=>{const a=activeWorlds().find(w=>w.id===id);return `<path class="${p.cleared.includes(a.id)?'open':''}" d="M${a.pos[0]} ${a.pos[1]} L${b.pos[0]} ${b.pos[1]}"/>`;})).join('');
 const mobilePositions=[[50,15],[25,36],[75,36],[50,58],[50,80]];
 const mobileSvg=`<svg class="atlas-mobile-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="atlas-edges">${activeWorlds().flatMap(b=>b.requires.map(id=>{const a=activeWorlds().find(w=>w.id===id);return `<path class="${p.cleared.includes(a.id)?'open':''}" d="M${mobilePositions[a.number-1].join(' ')} L${mobilePositions[b.number-1].join(' ')}"/>`;})).join('')}</g></svg>`;
 showModal('atlas',`<div class="atlas-heading"><div><div class="modal-eyebrow">ATLAS / ${themeName()}</div><h2 id="modal-title">${themeName()} · 五张子地图</h2></div><span class="atlas-count">${p.cleared.length}<small> / ${activeWorlds().length} 子地图已通关</small></span></div><div class="atlas-layout"><div class="atlas-chart"><span class="atlas-chart-label">${themeName()} · 点击子地图查看</span>${mobileSvg}<svg class="atlas-desktop-edges" viewBox="0 0 850 440" aria-hidden="true"><g class="atlas-edges">${edges}</g>${activeWorlds().map(n=>`<circle cx="${n.pos[0]}" cy="${n.pos[1]}" r="53" fill="${n.color}0c" stroke="${n.color}25"/>`).join('')}</svg>${activeWorlds().map(n=>{const clear=p.cleared.includes(n.id),open=CAMPAIGN.unlocked(p,n.id);return `<button class="atlas-node ${clear?'cleared':''} ${open?'unlocked':'locked'} ${w.id===n.id?'selected':''}" data-world="${n.id}" data-rank="${n.number}" style="left:${n.pos[0]/850*100}%;top:${n.pos[1]/440*100}%;--world-color:${n.color}" aria-label="世界 ${n.number} ${n.name}，${clear?'已通关':open?'可前往':'未解锁'}" aria-pressed="${w.id===n.id}"><span>${clear?'✓':n.number.toString().padStart(2,'0')}</span><b>${n.name}</b><small>${clear?'已通关 · 可重访':open?'航路已开启':'航路未开启'}</small></button>`;}).join('')}<span class="atlas-chart-note">本世界路线：1 → 2 + 3 → 4 → 5</span></div><section class="atlas-detail" style="--world-color:${w.color}"><div class="atlas-world-icon">${w.symbol}</div><small>WORLD ${w.number.toString().padStart(2,'0')} / Lv.${w.level}–${w.level+2}</small><h3>${w.name}</h3><p class="atlas-subtitle">${w.subtitle}</p><p>${w.description}</p><div class="atlas-feature">${w.feature}<br>首领 · ${w.boss}</div><h4>此境战利品</h4><div class="atlas-loot">${w.loot.map(id=>`<span title="${CAMPAIGN.items[id].description}">${itemIcon(id)}${CAMPAIGN.items[id].name}</span>`).join('')}</div><p class="atlas-requirement">${missing.length?'需先通关：'+missing.map(id=>activeWorlds().find(n=>n.id===id).name).join(' ＋ '):p.cleared.includes(w.id)?`已完成 ${p.clears[w.id]||1} 次 · 重访会刷新任务与随机掉落`:`航路已开启 · 完成 3 项活动与首领即可通关`}</p><button class="primary" id="atlas-travel" ${!available||!canTravel?'disabled':''}>${available?(p.cleared.includes(w.id)?'重新探索':'前往子地图')+' '+w.number+' ↗':'尚未解锁'}</button>${!canTravel?'<small class="atlas-travel-note">完成当前任务，脱战回到营地后出发。</small>':''}</section></div><p class="fine-print">本世界的地图解锁、行囊、归途币、载具与营地存档独立保存。出发会刷新所选子地图并更新本世界的营地存档；另一世界的旅程保持原样。</p><div class="modal-actions">${!state.world&&getCampSave().status==='ready'?'<button class="primary" id="atlas-resume">继续本世界存档 · 选择人物 ↗</button>':''}<button class="secondary" id="atlas-bag">行囊与护符 · ${Object.values(p.inventory).reduce((a,b)=>a+b,0)} 件</button><button class="secondary" id="atlas-close">${atlasReturn==='intro'?'返回标题':'返回当前旅途'}</button></div><p class="campaign-save-note">${CAMPAIGN.storageOK?'本世界的地图解锁与战利品自动保存在当前浏览器。':'存储不可用：进度暂存本页，请保留页面。'}</p>`);
 $('modal-card').querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>openAtlas(b.dataset.world));
 if($('atlas-resume'))$('atlas-resume').onclick=()=>{closeModal('intro');openResumeProfession();};
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
 if(!['atlas','camp','inventory','worldVictory','shop'].includes(state.phase))return;
 if(state.phase!=='inventory')inventoryReturn=back||state.phase;
 const p=state.campaign,canUse=!!state.world&&!state.objective&&!campThreat()&&distance(player,WORLD.sites[0])<130;
 showModal('inventory',`<div class="modal-eyebrow">SATCHEL / 本世界内保留</div><h2 id="modal-title">旅途带回的东西。</h2><p>补给品在营地使用；护符同时佩戴一件，在正式探索中生效。重复护符保留在行囊，不叠加属性。</p><p class="inventory-equipped">已佩戴：${p.equipped?itemIcon(p.equipped)+CAMPAIGN.items[p.equipped].name+' · '+CAMPAIGN.items[p.equipped].description:'暂无护符'}</p><div class="inventory-grid">${Object.entries(p.inventory).filter(([,n])=>n>0).map(([id,n])=>{const item=CAMPAIGN.items[id];return `<article class="inventory-item ${item.kind}">${itemIcon(id)}<small>${item.rarity} · ${CAMPAIGN.catalog.find(w=>w.id===item.world).name}</small><h3>${item.name}<span>×${n}</span></h3><p>${item.description}</p><button class="secondary" data-item="${id}" ${item.kind==='supply'&&!canUse||item.kind==='relic'&&p.equipped===id?'disabled':''}>${item.kind==='relic'?p.equipped===id?'已佩戴':'佩戴护符':canUse?'使用一份':'回营地使用'}</button></article>`;}).join('')||'<p class="inventory-empty">行囊还是空的。击败梦魇、完成任务或通关世界，收集属于此境的战利品。</p>'}</div><button class="primary" id="inventory-close">返回 ↗</button><p class="campaign-save-note">${CAMPAIGN.storageOK?'物品与护符自动保存；使用补给后会同步保存营地状态。':'存储不可用：当前收获暂存本页。'}</p>`);
 $('modal-card').querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>useCampaignItem(b.dataset.item));
 $('inventory-close').onclick=()=>{if(inventoryReturn==='atlas')openAtlas(atlasSelected);else if(inventoryReturn==='worldVictory')showWorldVictory();else if(inventoryReturn==='shop'){closeModal('playing');openShop();}else openCamp();};
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
function completeCampaignWorld(show=true){
 if(!state.world||!state.bossWon)return;
 if(!state.world.victory){
  state.world.victory=CAMPAIGN.complete(state.campaign,state.world.id,state.world.visit)||{item:null};
  const reward=state.world.victory;recordAdventureLoot(reward.item);if(reward.guaranteed!==reward.item)recordAdventureLoot(reward.guaranteed);
  campaignSave();state.objective=null;state.pendingBoons=[];enemies=enemies.filter(e=>!e.mission);hazards=[];projectiles=[];minions=[];state.releaseRecorded=true;window.HUNTER_RELEASE?.record({ending:'dawn',forest:state.world.id==='forest',time:Math.max(1,state.time),kills:state.kills,captures:state.captures});
 }
 syncAchievements();if(show)showWorldVictory();
}
function showWorldVictory(){
 const w=campaignWorld(),reward=state.world.victory||{},all=activeWorlds().every(w=>state.campaign.cleared.includes(w.id));
 window.HUNTER_AUDIO?.setScene('victory');
 showModal('worldVictory',`<div class="ending-emblem dawn">${w.symbol}</div><div class="modal-eyebrow">WORLD ${w.number} COMPLETE / ${state.campaign.cleared.length} OF ${activeWorlds().length}</div><h2 id="modal-title">${all?'本世界的五张子地图，已迎来黎明。':w.name+'，已迎来黎明。'}</h2><p>${sealCount()} 枚印记汇聚，${w.boss}的封印已经解除。${all?'本世界的五张子地图均已通关，你仍可重返任意世界，尝试不同技能。':'星图上的新航路已亮起，下一段旅途由你决定。'}</p>${storyChapterMarkup(w.id,true)}<div class="victory-loot">${lootMarkup(reward.item)}${reward.guaranteed&&reward.guaranteed!==reward.item?lootMarkup(reward.guaranteed):''}</div><p>${reward.guaranteed?'首次通关专属护符已入行囊。':'通关战利品已入行囊。'}世界解锁与物品${CAMPAIGN.storageOK?'已自动保存':'暂存本页，尚未写入浏览器'}。</p><div class="modal-actions"><button class="primary" id="victory-atlas">展开子地图星图 ↗</button><button class="secondary" id="victory-bag">查看行囊</button><button class="secondary" id="victory-home">返回标题</button></div>`);
 $('victory-atlas').onclick=()=>openAtlas(activeWorlds().find(n=>!state.campaign.cleared.includes(n.id)&&CAMPAIGN.unlocked(state.campaign,n.id))?.id||w.id);$('victory-bag').onclick=()=>openInventory('worldVictory');$('victory-home').onclick=reset;
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
function drawCampaignNodes(){const o=state.objective;if(!o?.nodes||isCloud())return;for(const [i,n] of o.nodes.entries()){const done=o.activated.includes(i);glow(n.x,n.y,80,done?'#cde7a025':'#bfa3e544');ctx.strokeStyle=done?'#bad6a0':n.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(n.x,n.y,40,0,TAU);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#edf3dc';ctx.font='16px sans-serif';ctx.fillText(done?'✓':n.name,n.x,n.y+5);ctx.font='12px sans-serif';ctx.fillText(done?'已激活':distance(player,n)<100?'按 F 激活':'靠近此处',n.x,n.y+64);}}
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
function enterWorld(id='forest',visit=null){state.mounted=false;
 WORLD=CAMPAIGN.map(id);worldGround=null;worldScenery=null;
 state.world={id,visit:visit||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),completed:new Set(),visited:new Set(),track:'chase',region:null,restCharges:1,terrainTick:0,near:null,missionCheckpoint:null};
 state.objective=null;state.room=0;state.roomType='world';state.phase='playing';state.bossWon=false;
 enemies=[];effects=[];hazards=[];projectiles=[];minions=[];floating=[];state.capture=0;state.captureTarget=null;
 player.x=WORLD.sites[0].x;player.y=WORLD.sites[0].y;player.invincible=2;state.skillCd=0;state.dashCd=0;
 if(!worldGround){worldScenery=WORLD.create();worldGround=document.createElement('canvas');worldGround.width=WORLD.width;worldGround.height=WORLD.height;WORLD.drawGround(worldGround.getContext('2d'));if(id==='forest')window.HUNTER_ART?.ground(worldGround.getContext('2d'),WORLD);window.HUNTER_SCENE?.bake(worldGround.getContext('2d'),WORLD,worldScenery,isCloud()?'cloud':id);}
 for(const pack of WORLD.packs)pack.types.forEach((id,i)=>spawnWorldEnemy(id,pack.x+(i%2)*72,pack.y+Math.floor(i/2)*66));
 initializeDiscoveries();beginAdventure();
 updateCamera(0,true);updateBuild();updateUI();
 if(id!=='forest'){showCampaignIntro();return;}
 showModal('worldIntro',`<div class="modal-eyebrow">THE MOONLIT FOREST</div><h2 id="modal-title">循着灯，找到伙伴。</h2>${storyChapterMarkup('forest')}<div class="chapter-route"><span>${uiGlyph('arrow')}追猎</span><i>→</i><span>${uiGlyph('home')}守灯</span><i>→</i><span>${uiGlyph('seal')}夺影</span><i>→</i><span>☾<b>月狼</b></span></div><div class="first-stop">${uiGlyph('box')}<div><small>你的第一站</small><b>沿北方石路，寻找斥候补给箱。</b></div></div><div class="control-chips"><span><kbd>M</kbd>地图</span><span><kbd>F</kbd>互动 / 保存</span><span><kbd>C</kbd>喝药</span><span><kbd>B</kbd>回营</span><span><kbd>TAB</kbd>技能</span></div><details class="visual-details"><summary>探索与保存规则</summary><p>完成三处任务后前往东北方月狼之巢。每处任务选一份祝福，补充一瓶月露。首次出发自动建立营地存档；之后回营按 F 保存。深河走桥，浅沼减速，余烬灼伤。B 可随时静止 3 秒回城，自动保存并展示结算。滚轮调整视野，0 复位。打开面板暂停世界。</p></details><button class="primary" id="world-begin">踏入森林 ↗</button>`);
 $('world-begin').onclick=()=>{closeModal('playing');const status=EXPEDITION.read(campStorage(),selectedTheme).status;if(state.world.saveOnBegin||status==='empty')saveCamp();else if(status==='ready')toast('沿石路向北，寻找斥候补给箱 · 现有存档仅在营地手动覆盖',4);else toast('当前没有可用存档；可以继续探索，回营地后尝试保存。',5);};
}
function spawnWorldEnemy(id,x,y,elite=false){
 const v=WORLD.variants[id],e=spawnEnemy(v?v.shadow:id,x,y,elite);
 e.variant=v?id:null;e.home={x,y};e.facing=Math.PI/2;e.aggro=false;e.patrol=Math.random()*TAU;
 if(isCloud()){e.qKind=v?id:'bubble';e.hp=e.maxHp=1;e.pressure=e.maxPressure=1;e.r=24;}
 else if(v){const health={cinder:90,stalker:80,sentinel:145}[id];e.hp=e.maxHp=Math.round(health*(1+(campaignWorld().level-1)*.09));e.pressure=e.maxPressure=id==='sentinel'?80:60;e.r=id==='sentinel'?23:18;}
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
 const mud=isCloud()?!!WORLD.terrainAt(player.x,player.y)||state.qSnared>0:WORLD.terrainAt(player.x,player.y)?.kind==='mud';
 const poison=hazards.some(h=>h.poison&&distance(player,h)<h.r);
 const ride=state.mounted?CAMPAIGN.rides[CAMPAIGN.garage(state.campaign).selected]:null;return (mud||poison?145:224)*(ride?.speed||1);
}
function updateWorld(dt){
 if(!state.world||state.phase!=='playing')return;
 const w=state.world,region=WORLD.regionAt(player.x,player.y);
 if(w.region!==region.id){w.region=region.id;w.visited.add(region.id);syncAchievements();toast(`${region.name} · ${region.hint}`,4);}
 w.near=allWorldSites().filter(s=>distance(player,s)<130).sort((a,b)=>distance(player,a)-distance(player,b))[0]||null;updateDiscoveries();
 if(isCloud()){state.qSnared=Math.max(0,(state.qSnared||0)-dt);collectCloudCandy();}
 w.terrainTick-=dt;
 if(w.terrainTick<=0){w.terrainTick=.8;if(WORLD.terrainAt(player.x,player.y)?.kind==='embers'){hitPlayer(6);textFloat(player.x,player.y-38,'余烬灼伤','#e5a071');}}
 if(state.bossWon&&state.phase==='playing'){if(state.journey.recall>0)completeCampaignWorld(false);else endRun(true);}
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
function restoreWorldCheckpoint(c){state.mounted=false;
 for(const key of ['time','kills','captures','hits','corruption','locked','nightmare','weapon','stored'])state[key]=c.run[key];
 state.journey=JOURNEY.normalize(c.run.journey);state.pendingBoons=[];state.skillCd=0;state.dashCd=0;state.attackCd=0;state.slots=[...c.run.slots];state.owned=new Set(c.run.owned);state.levels={...c.run.levels};state.xp={...c.run.xp};normalizeSkills();
 player={...c.player};enemies=c.enemies.map(copyEnemy);state.world.completed=new Set(c.completed);state.world.restCharges=c.restCharges;if(c.exploration){const w=c.exploration;Object.assign(state.world,{claimed:new Set(w.claimed),seen:new Set(w.seen),trailCaptured:w.trailCaptured,visited:new Set(w.visited),track:w.track});}
 state.objective=null;state.hitStop=0;state.capture=0;state.captureTarget=null;effects=[];hazards=[];projectiles=[];minions=[];floating=[];keys={};mouse.down=false;
 $('capture-hud').classList.add('hidden');state.phase='playing';updateCamera(0,true);updateBuild();updateUI();
}
function missionPoint(x,y,site=state.objective?.site){return site?{x:site.x+(x-600)*.72,y:site.y+(y-350)*.72}:{x,y};}
function startWorldMission(site){
 if(!state.world||state.phase!=='playing'||state.objective||state.world.completed.has(site.id))return;
 state.world.track=site.id;state.world.missionCheckpoint=worldCheckpoint();state.checkpoint=takeCheckpoint();
 if(site.kind==='boss'&&state.world.completed.size<sealCount())return;
 if(isCloud()&&QMAP.types.includes(site.kind)){startCloudActivity(site);return;}
 const ambient=enemies;
 if(['hunt','survey','sequence','purify'].includes(site.kind)){setupCampaignObjective(site);return;}
 if(site.kind==='boss'){
  const e=spawnEnemy(campaignWorld().bossType,site.x,site.y-40,true,true);e.mission=true;e.home={x:e.x,y:e.y};
  if(isCloud()){e.qBossName=campaignWorld().boss;e.qKind=['giant','drop','bee','mirror','nightmare'][campaignWorld().number-1];e.hp=e.maxHp=180;e.phase=1;e.r=48;e.guards=[];e.patrol=0;e.facing=0;}
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
 if(isCloud()&&state.objective&&interactCloudActivity())return;
 if(state.objective&&interactCampaignNode())return;
 const s=allWorldSites().filter(s=>distance(player,s)<130).sort((a,b)=>distance(player,a)-distance(player,b))[0];
 if(!s){toast('靠近地图上的发光地点，再按 F 互动',2);return;}
 if(state.objective){toast('先完成当前任务，再与其他地点互动',2);return;}
 if(s.kind==='candy'){collectCloudCandy();return;}
 if(s.kind==='camp'){if(campThreat()){toast('先摆脱附近敌人，再回营地休整或保存',3);return;}openCamp();return;}
 if(s.kind==='shop'){openShop();return;}if(s.kind==='discovery'){claimDiscovery(s);return;}
 if(state.world.completed.has(s.id)){toast('这处印记已完成 · 按 M 寻找其他目标',3);return;}
 if(s.kind==='boss'&&state.world.completed.size<sealCount()){toast(`首领封印尚未解除 · 还需要 ${sealCount()-state.world.completed.size} 枚印记`,3);return;}
 startWorldMission(s);
}
function completeWorldMission(){
 if(!state.objective||state.objective.status!=='active'||!state.objective.site)return;const site=state.objective.site;state.world.completed.add(site.id);state.world.restCharges=Math.min(20,state.world.restCharges+1);syncAchievements();
 enemies=enemies.filter(e=>!e.mission);state.objective=null;state.capture=0;state.captureTarget=null;projectiles=[];hazards=[];minions=[];effects=[];floating=[];
 const loot=expeditionReward('mission:'+site.id,'mission');
 const next=state.world.completed.size>=sealCount()?WORLD.sites.find(s=>s.kind==='boss'):WORLD.sites.find(s=>!['camp','boss'].includes(s.kind)&&!state.world.completed.has(s.id));
 state.world.track=next.id;state.room=state.world.completed.size;state.journey.flasks=Math.min(state.journey.maxFlasks,state.journey.flasks+1);state.pendingBoons=JOURNEY.offers(state.journey.perks,state.world.completed.size).map(p=>p.id);updateBuild();
 showModal('worldComplete',`<div class="modal-eyebrow">FOREST SEAL / ${Math.min(state.world.completed.size,sealCount())} OF ${sealCount()}</div><h2 id="modal-title">印记已点亮</h2>${lootMarkup(loot)}<div class="seal-progress">${Array.from({length:sealCount()},(_,i)=>i).map(i=>`<span class="${i<state.world.completed.size?'lit':''}">${uiGlyph('seal')}</span>`).join('')}</div><p class="choice-instruction">${state.world.completed.size>=sealCount()?campaignWorld().boss+'的封印已解除。':'下一站 · '+next.name}　·　月露 +1</p><div class="boon-grid">${state.pendingBoons.map(id=>{const p=JOURNEY.perks.find(p=>p.id===id);return `<button class="boon-card" data-boon="${id}"><span class="boon-symbol">${p.symbol}</span><strong>${p.name}</strong><p>${p.description}</p></button>`;}).join('')}</div><p id="boon-result" class="journey-result" role="status">选择一项祝福 · 本局持续生效 · 回营按 F 保存</p><div class="modal-actions"><button class="primary" id="world-continue" ${state.pendingBoons.length?'disabled':''}>${state.pendingBoons.length?'先选择一项祝福':'继续探索'}</button><button class="secondary" id="world-reward-map" ${state.pendingBoons.length?'disabled':''}>查看全图</button></div>`);
 $('modal-card').querySelectorAll('[data-boon]').forEach(b=>b.onclick=()=>chooseBoon(b.dataset.boon));$('world-continue').onclick=()=>{if(!state.pendingBoons.length)closeModal('playing');};$('world-reward-map').onclick=()=>{if(state.pendingBoons.length)return;closeModal('playing');openWorldMap();};
}
function retryWorldMission(){
 const site=state.objective.site,c=state.world.missionCheckpoint;
 restoreWorldCheckpoint(c);startWorldMission(site);
}
// QMap activities use the same mission/reward/save lifecycle as the other worlds.
function startCloudActivity(site){
 state.objective=QMAP.create(site,nearestFreeWorldPosition);state.mounted=false;modalReturn='playing';
 showModal('briefing',`<div class="modal-eyebrow">SWEETDREAM / ${site.name}</div><h2 id="modal-title">${QMAP.names[site.kind]}</h2><p>${QMAP.instructions[site.kind]}</p><div class="explain-box">完成后获得一枚印记、随机物品与一份祝福。这里不扣血，没有失败惩罚。B 回营会结束尚未完成的活动。</div><button id="mission-start" class="primary">开始活动 ↗</button>`);
 $('mission-start').onclick=()=>{closeModal('playing');if(site.kind==='puzzle')openCloudPuzzle();if(site.kind==='bubble'){const o=state.objective;o.targets=o.nodes.map((n,i)=>{const e=spawnWorldEnemy('bubble',n.x,n.y);e.mission=true;e.qActivity=site.id;return e.id;});}};
}
function interactCloudActivity(){
 const o=state.objective;if(!QMAP.types.includes(o.kind))return false;
 if(o.kind==='puzzle'){if(distance(player,o.site)<180)openCloudPuzzle();else toast('回到镜面花园，靠近按 F 继续拼图。');}
 else if(['fish','gather','dig','water','race'].includes(o.kind)){QMAP.interact(o,player);if(QMAP.finished(o)){completeWorldMission();return true;}}
 else toast(QMAP.status(o));updateCloudUI();return true;
}
function openCloudPuzzle(){
 const o=state.objective;if(!o||o.kind!=='puzzle')return;
 modalReturn='playing';const b=o.board;
 const cells=Array.from({length:b.w*b.h},(_,i)=>{const x=i%b.w,y=Math.floor(i/b.w),box=b.boxes.findIndex(v=>v.x===x&&v.y===y),goal=b.goals.findIndex(v=>v.x===x&&v.y===y),wall=x===0||y===0||x===b.w-1||y===b.h-1,hero=b.player.x===x&&b.player.y===y;
  return `<span class="q-cell ${wall?'q-wall':''} ${goal>=0?'q-goal':''} ${box>=0?'q-box':''} ${hero?'q-hero':''}" style="--candy:${QMAP.colors[box>=0?box:goal]||'#dfd1ba'}" aria-label="${wall?'树篱':box>=0?'糖果 '+String.fromCharCode(65+box):hero?'小伙伴':goal>=0?'镜框 '+String.fromCharCode(65+goal):'空地'}">${!wall&&(hero||box>=0||goal>=0)?'<img alt="" src="'+window.HUNTER_Q_ART.sources[hero?'hero-shadow-hunter':box>=0?'candy-block':'mirror-frame']+'">':''}<b>${hero?'●':box>=0?String.fromCharCode(65+box):goal>=0?String.fromCharCode(65+goal):''}</b></span>`;}).join('');
 showModal('qPuzzle',`<div class="modal-eyebrow">MIRROR GARDEN / 镜面拼图</div><h2 id="modal-title">把糖果推回同字母的镜框</h2><p>A、B、C 对应三种颜色；小圆点是你。树篱不能穿过，每次只能推一颗。</p><div class="q-puzzle-layout"><div class="q-board" role="group" aria-label="七列六行糖果推箱子">${cells}</div><div class="q-puzzle-help"><p role="status">已归位 ${o.count} / 3<br>已移动 ${b.moves} 步</p><div class="q-dpad"><button data-q-dir="up" aria-label="向上">↑</button><button data-q-dir="left" aria-label="向左">←</button><button data-q-dir="down" aria-label="向下">↓</button><button data-q-dir="right" aria-label="向右">→</button></div><p>WASD / 方向键移动<br>Z 撤销 · Esc 收起</p><button id="q-undo" class="secondary" ${b.history.length?'':'disabled'}>撤销一步 · Z</button><button id="q-reset" class="secondary">重置拼图</button></div></div><button id="q-puzzle-close" class="primary">收起，继续探索 · Esc</button>`);
 $('modal-card').querySelectorAll('[data-q-dir]').forEach(el=>el.onclick=()=>cloudPuzzleKey({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[el.dataset.qDir]));
 $('q-undo').onclick=()=>cloudPuzzleKey('KeyZ');$('q-reset').onclick=()=>{QMAP.resetPuzzle(o);openCloudPuzzle();};$('q-puzzle-close').onclick=()=>closeModal('playing');
}
function cloudPuzzleKey(code){
 const o=state.objective;if(!o||o.kind!=='puzzle')return;
 if(code==='Escape'){closeModal('playing');return;}
 if(code==='KeyZ')QMAP.undo(o);
 else{const dirs={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};if(!dirs[code])return;QMAP.movePuzzle(o,...dirs[code]);}
 if(o.count===3){completeWorldMission();return;}openCloudPuzzle();
}
function collectCloudCandy(){
 for(const c of WORLD.charms){if(state.world.claimed.has(c.id)||distance(player,c)>65)continue;
  state.world.claimed.add(c.id);const item=expeditionReward('candy:'+c.id,'packed');ring(c.x,c.y,80,c.color);tone(880,.18);toast(`${c.name} · ${state.world.claimed.size} / 5${item?' · '+CAMPAIGN.items[item].name+'已入行囊':''}`,3);
 }
}
function hitCloudEnemy(e,amount,source,cast){
 if(e.dead)return;
 if(!e.boss){
  if(e.qKind==='mirror'&&source==='basic'&&Math.abs(Math.atan2(Math.sin(angle(e,cast?.origin||player)-e.facing),Math.cos(angle(e,cast?.origin||player)-e.facing)))<.85){textFloat(e.x,e.y-60,'绕到镜面侧后，或使用 Q','#9471bc');return;}
  gainKill(e);const o=state.objective;if(o?.kind==='bubble'&&e.qActivity===o.site.id){o.count++;if(QMAP.finished(o))completeWorldMission();}textFloat(e.x,e.y-25,'啵！','#a86b96');return;
 }
 if(e.phase===2&&e.guards.some(id=>enemies.some(t=>t.id===id&&!t.dead))){textFloat(e.x,e.y-95,'先戳破四只小泡泡','#9e6f9f');return;}
 e.hp=Math.max(0,e.hp-amount);e.hit=.15;burst(e.x,e.y,'#ecc0e4',8);textFloat(e.x,e.y-75,String(Math.round(amount)),'#945887');
 if(e.hp<=0&&e.phase===1){
  e.phase=2;e.hp=e.maxHp=240;e.cd=2;ring(e.x,e.y,180,'#e7afd6');
  e.guards=Array.from({length:4},(_,i)=>{const a=i*TAU/4,t=spawnWorldEnemy('bubble',e.x+Math.cos(a)*145,e.y+Math.sin(a)*145);t.mission=true;return t.id;});
  toast('外壳破啦！先戳破四只小泡泡，再攻击梦魇本体。',4);
 }else if(e.hp<=0){gainKill(e);toast(campaignWorld().name+'的试炼完成了！',4);}
}
function updateCloudEnemy(e,dt){
 e.hit=Math.max(0,e.hit-dt);e.patrol=(e.patrol||0)+dt;const d=distance(e,player);if(d>650)return;
 e.facing=e.qKind==='mirror'?e.patrol*.3:angle(e,player);
 if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){
   const r=e.boss?145:65;if(distance(e,player)<r&&player.dash<=0){hitPlayer(0);const a=angle(e,player);moveEntity(player,Math.cos(a)*35,Math.sin(a)*35);}ring(e.x,e.y,r,'#d69ac5',.4);
   if(e.qKind==='drop')hazards.push({x:e.x,y:e.y,r:55,life:3,tick:0,friendly:false,color:'#83c9e6',poison:true,qPuddle:true});
  }return;}
 if(e.qKind==='bee'){const a=angle(e,player)+.9;if(d>90)moveEntity(e,Math.cos(a)*80*dt,Math.sin(a)*80*dt);}
 else if(['bunny','ghost','nightmare','giant'].includes(e.qKind)&&!e.boss&&d>70)moveEntity(e,Math.cos(e.facing)*65*dt,Math.sin(e.facing)*65*dt);
 else if(e.boss&&d>180)moveEntity(e,Math.cos(e.facing)*48*dt,Math.sin(e.facing)*48*dt);
 e.cd-=dt;if(e.cd<=0&&d<(e.boss?250:150)){e.telegraph=1;e.attack=null;e.cd=e.boss?2:3;}
}
function updateCloudUI(){
 const cloud=isCloud(),o=state.objective,hud=$('q-activity-hud');$('app-shell').classList.toggle('is-cloud',cloud);
 $('app-shell').dataset.theme=selectedTheme;
 $('world-theme-title').innerHTML=cloud?'甜梦云原 <span>五张子地图，一场甜甜的梦。</span>':'五境远征 <span>一切梦魇，皆有其影。</span>';
 hud.classList.toggle('hidden',!cloud||state.phase!=='playing'||!o||!QMAP.types.includes(o.kind));
 if(!cloud)return;
 $('room-tag').textContent='活动 '+state.world.completed.size+' / '+WORLD.sites.filter(s=>QMAP.types.includes(s.kind)).length;
 $('world-progress').textContent='印记 '+Math.min(3,state.world.completed.size)+' / 3 · 区域 '+state.world.visited.size+' / 5';
 $('mission-hud').classList.add('hidden');$('compact-cost').textContent='Q 免费使用 · 不累积梦蚀';
 if(o&&QMAP.types.includes(o.kind))hud.textContent=QMAP.status(o);
 $('field-risk').textContent='甜梦守护 · 不掉血 · Q 无梦蚀';
 $('world-terrain').textContent=WORLD.terrainAt(player.x,player.y)?'糖霜 / 浅汽水 · 减速，不掉血':'M 全图 · F 活动 · B 回营';
 if(o&&QMAP.types.includes(o.kind)){$('objective').textContent=QMAP.names[o.kind]+' · '+QMAP.status(o);$('journey-direction').textContent=QMAP.status(o);}
 const near=state.world.near;if(near&&!o&&QMAP.types.includes(near.kind))$('world-interact').textContent=state.world.completed.has(near.id)?near.name+' · 已完成':'F · '+near.name+' · '+QMAP.names[near.kind];
}

function openWorldMap(){
 if(!state.world||!['playing','paused','worldmap'].includes(state.phase))return;
 if(state.phase==='worldmap'){closeModal('playing');return;}
 modalReturn='playing';
 showModal('worldmap',`<div class="modal-eyebrow">${campaignWorld().name} / Lv.${campaignWorld().level}–${campaignWorld().level+2}</div><h2 id="modal-title">你的下一站在哪里？</h2><p>已探索 ${state.world.visited.size} / 5 种环境 · 已取得 ${Math.min(state.world.completed.size,sealCount())} / ${sealCount()} 枚印记。白色圆点是你，金色空框是当前视野。${WORLD.bridges.length?'河道请从两座桥通行。':'沿地表道路探索，避开深色障碍与危险地形。'}</p><div class="world-map-layout"><div class="world-overview">${worldMapSvg()}</div><div class="world-map-choices">${[...WORLD.sites,shopSite()].map(s=>`<button data-track="${s.id}" class="${state.world.track===s.id?'selected':''}"><b>${s.symbol} ${s.name}${state.world.completed.has(s.id)?' ✓':''}</b><small>${s.hint}</small><span>${state.objective&&state.objective.site.id!==s.id?'任务中可查看路线':state.world.track===s.id?'正在追踪':'追踪此地点 →'}</span></button>`).join('')}</div></div>${discoveryMapChoices()}<p class="fine-print">追踪只显示方向，不会传送。地图打开时，敌人和任务计时暂停。</p><button class="primary" id="world-map-close">继续探索 · M / Esc ↗</button><button class="secondary" id="map-atlas">子地图星图 ↗</button>`);
 $('modal-card').querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{state.world.track=b.dataset.track;closeModal('playing');});
 $('world-map-close').onclick=()=>closeModal('playing');$('map-atlas').onclick=()=>openAtlas();
}
function worldMapSvg(){
 if(isCloud())return QMAP.mapSvg(WORLD,state.world,player,cameraWorldRect(),shopSite());
 const view=cameraWorldRect();
 return `<svg viewBox="0 0 3600 2400" role="img" aria-label="五区域世界地图，河道上有北桥和南桥"><rect width="3600" height="2400" fill="#152c2a"/>${WORLD.regions.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/><text x="${r.x+r.w/2}" y="${r.y+(r.id==='forest'?1050:r.id==='marsh'?850:170)}" text-anchor="middle" fill="${r.ink}" font-size="98">${r.name}</text>`).join('')}${WORLD.bridges.length?'<path d="M1305 0V2400" stroke="#83b1bc" stroke-width="150"/>':''}${WORLD.walls.filter(w=>w.kind!=='river').map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="#8a91a5"/>`).join('')}${WORLD.paths.map(line=>`<polyline points="${line.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#c1bb9266" stroke-width="24"/>`).join('')}${WORLD.bridges.map(y=>`<rect x="1190" y="${y-110}" width="230" height="220" fill="#bbac7d"/>`).join('')}${[...WORLD.sites,shopSite()].map(s=>`<circle cx="${s.x}" cy="${s.y}" r="${state.world.track===s.id?88:60}" fill="${state.world.completed.has(s.id)?'#a9c991':s.color}" fill-opacity=".28" stroke="${s.color}" stroke-width="9"/><text x="${s.x}" y="${s.y+24}" font-size="85" text-anchor="middle" fill="${s.color}">${state.world.completed.has(s.id)?'✓':s.symbol}</text><text x="${s.x}" y="${s.y+140}" text-anchor="middle" font-size="76" fill="#dbe5cb">${s.name}</text>`).join('')}${discoveryMapSvg()}<rect x="${view.x}" y="${view.y}" width="${view.w}" height="${view.h}" fill="none" stroke="#e1cc8e" stroke-width="12"/><circle cx="${player.x}" cy="${player.y}" r="38" fill="#f4ffe9" stroke="#152c2a" stroke-width="15"/></svg>`;
}
function drawMinimap(){
 const c=$('world-minimap'),g=c.getContext('2d'),width=240,height=160,dpr=Math.min(window.devicePixelRatio||1,2);
 if(c.width!==width*dpr||c.height!==height*dpr){c.width=width*dpr;c.height=height*dpr;}
 g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
 const sx=width/WORLD.width,sy=height/WORLD.height,X=x=>x*sx,Y=y=>y*sy;
 const dot=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(X(x),Y(y),r,0,TAU);g.fill();};
 g.fillStyle='#102424';g.fillRect(0,0,width,height);
 for(const r of WORLD.regions){g.fillStyle=r.color;g.fillRect(X(r.x),Y(r.y),r.w*sx,r.h*sy);}
 for(const t of WORLD.terrain||[]){g.fillStyle=t.kind==='embers'?'#d77d4966':'#65a8b066';g.beginPath();g.ellipse(X(t.x),Y(t.y),t.rx*sx,t.ry*sy,0,0,TAU);g.fill();}
 if(WORLD.bridges.length){g.fillStyle='#4e8d9e';if(isCloud()&&!WORLD.river.vertical)g.fillRect(0,Y(WORLD.river.y),width,WORLD.river.h*sy);else g.fillRect(X(1220),0,170*sx,height);}
 g.lineJoin='round';g.lineCap='round';
 for(const line of WORLD.paths){g.beginPath();line.forEach(([x,y],i)=>i?g.lineTo(X(x),Y(y)):g.moveTo(X(x),Y(y)));g.strokeStyle='#d5c89a60';g.lineWidth=3;g.stroke();}
 for(const w of WORLD.walls.filter(w=>w.kind!=='river')){g.fillStyle='#5b6d78';g.fillRect(X(w.x),Y(w.y),Math.max(1,w.w*sx),Math.max(1,w.h*sy));}
 for(const y of WORLD.bridges){g.fillStyle='#d9bd83';if(isCloud()&&!WORLD.river.vertical)g.fillRect(X(y-120),Y(WORLD.river.y-40),240*sx,250*sy);else g.fillRect(X(1190),Y(y-120),230*sx,240*sy);}
 // Grid stays behind markers and uses screen pixels for crisp strokes.
 g.strokeStyle='#d6e8cf0d';g.lineWidth=.5;g.beginPath();for(let x=40;x<width;x+=40){g.moveTo(x,0);g.lineTo(x,height);}for(let y=40;y<height;y+=40){g.moveTo(0,y);g.lineTo(width,y);}g.stroke();
 const target=currentWorldSite(state.world.track);
 if(target){g.setLineDash([3,4]);g.strokeStyle='#f0d98c99';g.lineWidth=1;g.beginPath();g.moveTo(X(player.x),Y(player.y));g.lineTo(X(target.x),Y(target.y));g.stroke();g.setLineDash([]);}
 for(const s of worldDiscoveries()){const claimed=state.world.claimed.has(s.id);g.fillStyle=claimed?'#6c8276':'#e7c47e';g.fillRect(X(s.x)-2,Y(s.y)-2,4,4);if(!claimed){g.strokeStyle='#101f24';g.lineWidth=1;g.strokeRect(X(s.x)-2,Y(s.y)-2,4,4);}}
 for(const site of [...WORLD.sites,shopSite()]){
  const done=state.world.completed.has(site.id),tracked=state.world.track===site.id;
  dot(site.x,site.y,4.5,'#0b1c21');dot(site.x,site.y,3,done?'#7c9c84':site.color);
  if(tracked){g.strokeStyle='#ffe1a0';g.lineWidth=1.5;g.beginPath();g.arc(X(site.x),Y(site.y),6,0,TAU);g.stroke();}
  if(['camp','shop','boss'].includes(site.kind)||tracked){g.font='10px "Shadow Interface",sans-serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#0a1c20';const label=done?'✓':site.kind==='camp'?'营地':site.kind==='shop'?'商店':site.kind==='boss'?'首领':'目标';const ly=Math.max(11,Y(site.y)-9);g.strokeText(label,X(site.x),ly);g.fillStyle=tracked?'#ffe1a0':'#d4e6d2';g.fillText(label,X(site.x),ly);}
 }
 for(const e of enemies)if(!e.dead&&distance(e,player)<700)dot(e.x,e.y,e.boss?3.5:e.elite?2.5:1.8,e.exposed?'#e7eaff':'#f18c7c');
 const view=cameraWorldRect();g.strokeStyle='#dfcf9c88';g.lineWidth=1;g.strokeRect(X(view.x),Y(view.y),view.w*sx,view.h*sy);
 dot(player.x,player.y,6,'#a8ffdf30');dot(player.x,player.y,3.2,'#effff5');
 g.save();g.translate(X(player.x),Y(player.y));g.rotate(player.angle);g.fillStyle='#afffe3';g.beginPath();g.moveTo(10,0);g.lineTo(5,-3);g.lineTo(5,3);g.closePath();g.fill();g.restore();
 g.fillStyle='#d1ddc8';g.font='9px sans-serif';g.textAlign='right';g.fillText('N ↑',width-7,12);
}

function updateWorldUI(){
 updateCloudUI();
 const active=!!state.world;$('app-shell').classList.toggle('is-world',active);$('world-hud').classList.toggle('hidden',!active);$('world-map-nav').classList.toggle('hidden',!active);$('world-interact').classList.toggle('hidden',!active||state.phase!=='playing'||!!state.objective||!state.world.near);
 if(!active)return;
 const w=state.world,r=WORLD.regionAt(player.x,player.y),s=currentWorldSite(w.track),near=w.near;
 $('room-name').textContent=r.name.startsWith(campaignWorld().name)?r.name:campaignWorld().name+' · '+r.name;$('room-tag').innerHTML=`旷野探索 <span>印记 ${Math.min(w.completed.size,sealCount())} / ${sealCount()}</span>`;
 $('objective').textContent=state.objective?`${state.objective.site.name} · ${state.objective.kind==='boss'?'击败'+campaignWorld().boss:state.objective.kind==='capture'?'击破幽灵，长按 E 夺取':state.objective.kind==='defend'?'保护梦灯，坚持到倒计时结束':state.objective.kind==='chase'?'追上镜魔，击破后收割或夺影':state.objective.site.hint}`:`追踪：${s.name} · 靠近发光地点按 F`;
 $('world-progress').textContent=`印记 ${w.completed.size} / ${sealCount()} · 环境 ${w.visited.size} / 5`;
 const terrain=WORLD.terrainAt(player.x,player.y);$('world-terrain').textContent=terrain?.kind==='mud'?'浅沼 · 移速降低':terrain?.kind==='embers'?'余烬 · 持续灼伤':'M 全图 · F 互动';
 if(near)$('world-interact').textContent=state.objective?'任务进行中':near.kind==='camp'?'F · 营地存档 / 休整':near.kind==='discovery'?w.claimed.has(near.id)?`${near.name} · 已领取`:`F · ${near.name} · 查看奖励`:w.completed.has(near.id)?`${near.name} · 已完成`:near.kind==='boss'&&w.completed.size<sealCount()?`首领封印 · 还需 ${sealCount()-w.completed.size} 枚印记`:`F · ${near.name} · 开始${{chase:'追猎',defend:'守灯',capture:'夺影',hunt:'清剿',survey:'探索',sequence:'机关',purify:'净化',boss:'首领战'}[near.kind]}`;
 updateViewControls();drawMinimap();if(isCloud())updateCloudUI();
}
function drawWorldProp(p){
 if(isCloud()){QMAP.drawProp(ctx,p);return;}
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
 if(isCloud()){QMAP.drawLandmark(ctx,s,state.world.completed.has(s.id),state.objective?.site?.id===s.id,distance(player,s)<130,richVisuals()?clock:0);return;}
 const done=state.world.completed.has(s.id),active=state.objective?.site?.id===s.id;
 glow(s.x,s.y,150,s.color+'20');ctx.save();ctx.strokeStyle=s.color+(done?'44':'99');ctx.lineWidth=2;ctx.setLineDash([8,12]);ctx.beginPath();ctx.ellipse(s.x,s.y,80+Math.sin(clock*2)*3,50,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
 if(s.kind==='camp'){path([[s.x-75,s.y+16],[s.x-42,s.y-65],[s.x+10,s.y+16]],'#4a6452','#a3b48d');path([[s.x-42,s.y-65],[s.x+25,s.y-40],[s.x+48,s.y+15],[s.x+10,s.y+16]],'#263f37');if(!window.HUNTER_SCENE){glow(s.x+55,s.y-10,60,'#e4b76e44');path([[s.x+42,s.y],[s.x+53,s.y-32],[s.x+66,s.y]],'#edc488');}}
 else if(s.kind==='defend'&&!active){path([[s.x-12,s.y+8],[s.x-9,s.y-58],[s.x+9,s.y-58],[s.x+12,s.y+8]],'#50665c',s.color);glow(s.x,s.y-35,32,'#f0cd7c66');}
 else if(s.kind==='capture'){for(const dx of [-95,95]){path([[s.x+dx-14,s.y+8],[s.x+dx-8,s.y-65],[s.x+dx+14,s.y-55],[s.x+dx+18,s.y+8]],'#50606d','#a0c9d05a');}ctx.strokeStyle='#c3a7e655';ctx.beginPath();ctx.ellipse(s.x,s.y,110,65,0,0,TAU);ctx.stroke();}
 ctx.textAlign='center';ctx.font='20px Georgia';ctx.fillStyle=s.color;ctx.fillText(done?'✓':s.symbol,s.x,s.y-84);ctx.font='13px "Microsoft YaHei"';ctx.fillText(s.name,s.x,s.y-105);ctx.font='10px sans-serif';ctx.fillStyle='#c0d3bc';ctx.fillText(done?'印记已取得':active?'任务进行中':s.kind==='boss'&&state.world.completed.size<sealCount()?'收集全部印记以解除封印':distance(player,s)<130?'按 F 互动':'靠近发光标记',s.x,s.y+78);ctx.restore();
}
function drawWorldWaypoint(){
 const site=navigationTarget();if(!site||distance(player,site)<150)return;
 const p=pointOnScreen(site);if(p.x>.12&&p.x<.78&&p.y>.2&&p.y<.72)return;
 const x=clamp(p.x,.08,.76)*camera.w,y=clamp(p.y,.2,.68)*camera.h,a=angle(player,site);
 ctx.save();ctx.translate(x,y);ctx.rotate(a);path([[12,0],[-7,-7],[-4,0],[-7,7]],site.color);ctx.rotate(-a);ctx.fillStyle='#e0e5c7';ctx.textAlign='center';ctx.font='11px sans-serif';if(isCloud())QMAP.label(ctx,0,25,site.name,11);else ctx.fillText(site.name,0,25);ctx.restore();
}
function drawHazard(h){
 if(isCloud()&&h.qPuddle){ctx.save();ctx.fillStyle='#9edff099';ctx.beginPath();ctx.ellipse(h.x,h.y,h.r,h.r*.65,0,0,TAU);ctx.fill();QMAP.label(ctx,h.x,h.y,'浅汽水 · 减速',11);ctx.restore();return;}
 if(window.HUNTER_COMBAT){window.HUNTER_COMBAT.hazard(ctx,h);return;}
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
function drawRecallPortal(){
 const remaining=state.journey.recall;if(remaining<=0)return;
 const progress=clamp(1-remaining/3,0,1),rich=richVisuals(),t=rich?clock:0;
 ctx.save();ctx.translate(player.x,player.y+9);
 const beam=ctx.createLinearGradient(0,-190,0,15);beam.addColorStop(0,'#a1f5df00');beam.addColorStop(.7,'#a1f5df12');beam.addColorStop(1,'#b8ffe04d');
 ctx.fillStyle=beam;ctx.fillRect(-35,-190,70,205);
 ctx.save();ctx.scale(1,.5);ctx.rotate(t*.55);
 ctx.strokeStyle='#90dcca66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,65,0,TAU);ctx.stroke();
 ctx.setLineDash([7,9]);ctx.beginPath();ctx.arc(0,0,79,0,TAU);ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<6;i++){const a=i*TAU/6;ctx.save();ctx.rotate(a);ctx.strokeStyle='#d6efb5';ctx.strokeRect(59,-4,8,8);ctx.restore();}
 ctx.restore();ctx.strokeStyle='#d2ffe7';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,69,35,0,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();
 if(rich)for(let i=0;i<12;i++){const a=i*TAU/12+t*.9,lift=(t*42+i*17)%125;ctx.globalAlpha=(1-lift/125)*.8;ellipse(Math.cos(a)*48,-lift+Math.sin(a)*16,1.5,3,'#c8ffe4');}
 ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='600 14px "Microsoft YaHei",sans-serif';ctx.fillStyle='#e2fff0';ctx.fillText(`回城 ${remaining.toFixed(1)}s`,0,-88);
 ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#b0d7c7';ctx.fillText('保持静止 · 移动取消',0,63);ctx.restore();
}
function sceneView(){return {world:WORLD,camera,player,id:isCloud()?'cloud':state.world.id,time:clock,rich:richVisuals()};}
function drawWorld(){
 const dpr=Math.min(window.devicePixelRatio||1,2),width=canvas.clientWidth,height=canvas.clientHeight;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);updateCamera(0,true);}
 updateCamera(0); // Movement and dashes happened after this frame's input update.
 ctx.setTransform(canvas.width/camera.w,0,0,canvas.height/camera.h,0,0);ctx.fillStyle='#091918';ctx.fillRect(0,0,camera.w,camera.h);ctx.save();
 sampleRenderShake();ctx.translate(-camera.x,-camera.y);
 const visible=cameraWorldRect();
 if(visible.w>0&&visible.h>0)ctx.drawImage(worldGround,visible.x,visible.y,visible.w,visible.h,visible.x,visible.y,visible.w,visible.h);
 window.HUNTER_SCENE?.floor(ctx,sceneView());
 // Fog and decorative light stay behind actors and all combat information.
 window.HUNTER_SCENE?.atmosphere(ctx,sceneView());
 ctx.strokeStyle='#75977d40';ctx.lineWidth=3;ctx.strokeRect(0,0,WORLD.width,WORLD.height);
 for(const h of hazards)if(worldVisible(h.x,h.y,h.r))drawHazard(h);
 drawShop();for(const s of WORLD.sites)if(worldVisible(s.x,s.y))drawWorldLandmark(s);
 for(const s of worldDiscoveries())if(worldVisible(s.x,s.y))drawDiscovery(s);
 if(state.objective?.kind==='defend')drawMissionScenery();drawCampaignNodes();
 if(isCloud()){QMAP.drawActivity(ctx,state.objective,richVisuals()?clock:0);for(const c of WORLD.charms)if(!state.world.claimed.has(c.id)&&worldVisible(c.x,c.y)){if(!QMAP.asset(ctx,'star-candy',c.x,c.y+15,72))QMAP.star(ctx,c.x,c.y-15,22,'#f3cc72');QMAP.label(ctx,c.x,c.y-52,c.name,12);}}
 drawEffects();
 const entities=[...worldScenery.props.filter(p=>worldVisible(p.x,p.y)).map(p=>({y:p.y,draw:()=>drawWorldProp(p)})),...worldScenery.rocks.filter(p=>worldVisible(p.x,p.y)).map(p=>({y:p.y,draw:()=>{if(window.HUNTER_SCENE)window.HUNTER_SCENE.rock(ctx,p,state.world.id);else ellipse(p.x,p.y,p.r,p.r*.65,'#596d6466');}})),...enemies.filter(e=>!e.dead&&worldVisible(e.x,e.y)).map(e=>({y:e.y,draw:()=>drawEnemy(e)})),{y:player.y,draw:drawPlayer}];
 entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());drawRecallPortal();
 for(const p of projectiles){if(!worldVisible(p.x,p.y,90)||p.enemy)continue;window.HUNTER_SCENE?.projectile(ctx,p,richVisuals());glow(p.x,p.y,14,'#ffe3a122');ctx.strokeStyle='#ffe3a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);ctx.stroke();}
 for(const m of minions){if(worldVisible(m.x,m.y,20)){glow(m.x,m.y,13,m.color+'44');path([[m.x,m.y-6],[m.x+4,m.y],[m.x,m.y+6],[m.x-4,m.y]],m.color);}}
 for(const f of floating){if(!worldVisible(f.x,f.y,20))continue;ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign='center';ctx.font=/^\d+$/.test(f.text)?'bold 15px Georgia':'11px "Microsoft YaHei"';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 ctx.restore();drawWorldWaypoint();
 const vignette=ctx.createRadialGradient(camera.w*.5,camera.h*.45,100,camera.w*.5,camera.h*.45,camera.w*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,isCloud()?'#fff5df08':'#06101a85');ctx.fillStyle=vignette;ctx.fillRect(0,0,camera.w,camera.h);
}


/* Exploration rewards, camp checkpoints and readable attack anticipation. */
const EXPEDITION=window.HUNTER_EXPEDITION;
function campStorage(){try{return localStorage;}catch{return null;}}
function worldDiscoveries(){return WORLD.discoveries||EXPEDITION.discoveries;}
function shopSite(){
 if(!state.world)return null;
 if(!state.world.shop){const camp=WORLD.sites[0],p=nearestFreeWorldPosition(camp.x+250,camp.y-40,20);state.world.shop={id:'shop',kind:'shop',name:isCloud()?'糖果小铺':'归途小铺',...p,symbol:'¤',color:'#e2c68b',hint:'购买载具、护符和补给 · 靠近按 F'};}
 return state.world.shop;
}
function rideIcon(id){return `<span class="ride-icon" aria-hidden="true"><svg viewBox="0 0 100 64" fill="none" stroke="#bce6d5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${id==='glideboard'?'<path fill="#4b8390" d="M8 28q38 18 84-2l-8 15q-34 10-69-1Z"/><path d="M20 49h15m28 0h16M30 56h40" stroke="#8cf0e1"/>':'<circle cx="23" cy="43" r="15"/><circle cx="77" cy="43" r="15"/><path d="m23 43 20-27 13 27H23m20-27h23l11 27M38 12h14m9-7h12l-8 14"/><path d="m56 43 10-27"/>'}</svg></span>`;}
function openShop(message=''){
 if(!state.world||!['playing','shop'].includes(state.phase)||state.tutorial||state.mode!=='hunt'||state.objective||distance(player,shopSite())>=130)return false;
 if(campThreat()){toast('先摆脱附近敌人，再与商人交谈',3);return false;}
 const garage=CAMPAIGN.garage(state.campaign);state.mounted=false;modalReturn='playing';
 showModal('shop',`<div class="shop-heading"><div><div class="modal-eyebrow">WAYFARER'S SHOP / 归途小铺</div><h2 id="modal-title">路还长，添些好东西吧。</h2><p>击败普通敌人 +5 币，精英 +12 币，主线任务 +20 币，通关 +40 币。</p></div><b class="shop-wallet">¤ ${garage.coins}</b></div><div class="shop-grid">${CAMPAIGN.goodsFor(state.campaign).map(g=>{const ride=g.ride?CAMPAIGN.rides[g.ride]:null,item=g.item?CAMPAIGN.items[g.item]:null,owned=ride&&garage.owned.includes(ride.id);return `<article class="shop-good">${ride?rideIcon(ride.id):itemIcon(item.id)}<small>${ride?'永久载具':item.kind==='relic'?'可佩戴护符':'消耗补给'}</small><h3>${ride?ride.name:item.name}</h3><p>${ride?ride.description:item.description}</p><button class="${owned?'secondary':'primary'}" data-shop-buy="${g.id}" ${!owned&&garage.coins<g.price?'disabled':''}>${owned?(garage.selected===ride.id?'已选用':'选用载具'):'¤ '+g.price+' · 购买'}</button></article>`;}).join('')}</div><p id="shop-result" role="status">${message||'购买后自动保存。护符在行囊中佩戴，载具按 H 上下车。'}</p><div class="modal-actions"><button class="primary" id="shop-close">继续旅程 ↗</button><button class="secondary" id="shop-bag">查看行囊 / 佩戴护符</button></div>`);
 $('modal-card').querySelectorAll('[data-shop-buy]').forEach(b=>b.onclick=()=>buyShopGood(b.dataset.shopBuy||b.dataset['shop-buy']));$('shop-close').onclick=()=>closeModal('playing');$('shop-bag').onclick=()=>openInventory('shop');return true;
}
function buyShopGood(id){
 if(state.phase!=='shop'||!state.world||distance(player,shopSite())>=130)return false;
 const g=CAMPAIGN.goodsFor(state.campaign).find(g=>g.id===id);if(!g)return false;const garage=CAMPAIGN.garage(state.campaign);
 if(g.ride&&garage.owned.includes(g.ride)){garage.selected=g.ride;state.mounted=false;const saved=campaignSave();openShop(saved?'载具已选用，按 H 上车。':'载具已选用，浏览器保存失败，请勿刷新。');return true;}
 const result=CAMPAIGN.buy(state.campaign,id);if(!result.ok){$('shop-result').textContent=result.reason;return false;}
 if(result.ride)state.mounted=false;if(result.item)recordAdventureLoot(result.item);const saved=campaignSave();syncAchievements();openShop((result.ride?'载具已购入并选用，按 H 上车。':'物品已放入行囊。')+(saved?' 已保存。':' 保存未完成，请勿刷新。'));return true;
}
function toggleRide(){
 if(!state.world||state.phase!=='playing'||state.tutorial||state.mode!=='hunt')return false;
 const garage=CAMPAIGN.garage(state.campaign);if(!garage.selected||!garage.owned.includes(garage.selected)){toast('先在营地旁的归途小铺购买载具',3);return false;}
 if(!state.mounted&&(state.capture>0||player.dash>0||enemies.some(e=>!e.dead&&e.aggro&&distance(e,player)<450))){toast('先脱离战斗，再上车',2);return false;}
 cancelRecall();state.mounted=!state.mounted;updateQuickInventory();toast(state.mounted?CAMPAIGN.rides[garage.selected].name+' · 已上车，按 H 下车':'已下车',2);return true;
}
function drawRide(){
 const ride=CAMPAIGN.rides[CAMPAIGN.garage(state.campaign).selected];if(!state.mounted||!ride)return;
 ctx.save();ctx.translate(player.x,player.y+17);ctx.strokeStyle='#b0ded0';ctx.lineWidth=2.5;
 if(ride.id==='moonbike'){
  for(const x of [-26,26]){ctx.beginPath();ctx.arc(x,0,15,0,TAU);ctx.fillStyle='#122b32';ctx.fill();ctx.stroke();const a=player.moveBlend>.01?clock*9:0;ctx.beginPath();ctx.moveTo(x-12*Math.cos(a),-12*Math.sin(a));ctx.lineTo(x+12*Math.cos(a),12*Math.sin(a));ctx.stroke();}
  path([[-26,0],[-9,-25],[9,0],[-26,0],[-9,-25],[15,-25],[26,0]],null,'#98d1bb');ctx.beginPath();ctx.moveTo(15,-25);ctx.lineTo(13,-34);ctx.lineTo(25,-34);ctx.stroke();
 }else{ellipse(0,9,37,9,'#72dfcf25');path([[-39,-7],[-29,6],[29,6],[41,-9],[20,-2],[-20,-2]],'#386a80','#a5e5d8');ctx.strokeStyle='#91ffe5';ctx.beginPath();ctx.moveTo(-23,13);ctx.lineTo(23,13);ctx.stroke();}
 ctx.restore();
}
function drawShop(){
 const s=shopSite();if(!s||!worldVisible(s.x,s.y))return;
 ctx.save();ctx.translate(s.x,s.y);ellipse(0,18,56,18,'#07151aaa');path([[-48,-28],[48,-28],[42,-65],[-35,-65]],'#456958','#d4d0a0');
 for(let i=0;i<5;i++)path([[-48+i*19,-28],[-29+i*19,-28],[-21+i*15,-65],[-36+i*15,-65]],i%2?'#c4b77e':'#7b9c80');
 path([[-42,-25],[-42,24],[42,24],[42,-25]],'#294c43','#789e82');path([[-47,-6],[47,-6],[47,8],[-47,8]],'#54745d','#b4c595');
 ctx.fillStyle=isCloud()?'#614e43':'#eadca4';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText('¤',0,-37);ctx.font='13px sans-serif';ctx.fillText(s.name,0,-84);ctx.font='10px sans-serif';ctx.fillText('靠近按 F · 载具 / 装备 / 补给',0,43);ctx.restore();
}
function allWorldSites(){return [...WORLD.sites,...worldDiscoveries(),...(isCloud()?WORLD.charms.map(c=>({...c,kind:'candy',symbol:'☆',hint:'走近即可收集星糖果'})):[]),shopSite()];}
function currentWorldSite(id){return allWorldSites().find(s=>s.id===id)||WORLD.sites[1];}
function initializeDiscoveries(){
 const w=state.world;w.claimed=new Set();w.seen=new Set();w.trailCaptured=false;w.track='trail-cache';
 if(isCloud()){w.track=WORLD.sites[1].id;state.corruption=0;return;}
 const scout=spawnWorldEnemy('archer',650,1530);scout.scout=true;scout.hp=scout.maxHp=40;scout.pressure=scout.maxPressure=35;
}
function campThreat(){if(isCloud())return false;return enemies.some(e=>!e.dead&&distance(e,player)<460)||projectiles.some(p=>p.enemy&&distance(p,player)<600)||hazards.some(h=>!h.friendly&&distance(h,player)<h.r+150);}
function canSaveCamp(){return !!state.world&&state.mode==='hunt'&&!state.objective&&!state.bossWon&&['playing','camp'].includes(state.phase)&&distance(player,WORLD.sites[0])<130&&!campThreat()&&player.hp>0&&state.nightmare<=0;}
function saveCamp(){
 if(!canSaveCamp()){toast('请回到守夜营地，脱离战斗后再保存。任务或梦魇形态中无法保存。',4);return false;}
 const w=state.world,checkpoint=worldCheckpoint();
 // Camp checkpoints retain enemies and rewards, but never pending attacks or effect closures.
 checkpoint.enemies=checkpoint.enemies.map(e=>({...e,cd:Math.max(1,e.cd),telegraph:0,target:null,attack:null,dash:0,burn:0,bleed:0,hit:0,aggro:false,patrol:e.patrol%TAU}));
 const save={version:1,savedAt:Date.now(),checkpoint,world:{worldId:w.id,visit:w.visit,visited:[...w.visited],claimed:[...w.claimed],seen:[...w.seen],trailCaptured:w.trailCaptured,track:w.track}};
 const ok=EXPEDITION.write(campStorage(),save);
 if(ok){memoryCamp=null;delete memoryCamps[selectedTheme];campaignSave();refreshResume();toast('营地存档已保存 · 任务、装备、敌人与奖励进度已记录',4);}else toast('未能保存：浏览器存储不可用或空间不足。当前游戏仍可继续。',5);
 if(!ok&&state.settlement&&EXPEDITION.valid(save))memoryCamps[selectedTheme]=memoryCamp=JSON.parse(JSON.stringify(save));
 return ok;
}
function saveDescription(s){const cloud=CAMPAIGN.themeOf(s.world.worldId)==='cloud';return `${CAMPAIGN.catalog.find(w=>w.id===(s.world.worldId||'forest')).name} · ${cloud?'已完成活动 '+s.checkpoint.completed.length: s.checkpoint.completed.length+' / 3 印记'} · ${s.world.claimed.length} / ${cloud?5:4} ${cloud?'星糖果':'宝藏'} · ${formatTime(s.checkpoint.run.time)} · ${new Date(s.savedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}`;}
function refreshResume(){
 const saved=getCampSave();$('continue-run').classList.toggle('hidden',!['main','cloud'].some(t=>getCampSave(t).status==='ready'));
 $('resume-summary').textContent='选择世界 → 选择人物 → 继续营地旅程';
 $('save-note').textContent=saved.status==='ready'?'存档保存在当前浏览器；B 传送回城会自动更新，营地也可按 F 手动保存。':saved.status==='empty'?'首次出发自动建立营地存档；B 回城自动结算保存，也可在营地按 F 手动保存。':saved.status==='invalid'?'营地存档格式不兼容或已损坏；可开始新狩猎，并在营地重新保存。':'当前浏览器无法读取存档；仍可开始新狩猎。';
 if(saved.status==='ready')$('resume-summary').textContent=(saved.temporary?'本页暂存 · ':'')+saveDescription(saved.data);if(saved.temporary)$('save-note').textContent='本轮收获暂存于本页，可继续冒险。请勿刷新或关闭网页；回营后可重试保存。';
}
function resumeCamp(){
 const saved=getCampSave();if(saved.status!=='ready'){refreshResume();toast('未找到可用的营地存档。',3);return false;}
 const s=saved.data,c=s.checkpoint;reset();enterWorld(s.world.worldId||'forest',s.world.visit||'legacy-'+s.savedAt);
 // Restore only fields the game owns. Storage is not a trusted runtime object.
 const restored=c.enemies.map(raw=>{
  const e=spawnWorldEnemy(raw.variant||raw.type,raw.home.x,raw.home.y,raw.elite);
  for(const k of ['id','x','y','r','hp','maxHp','pressure','maxPressure','dead','exposed','facing','patrol'])e[k]=raw[k];
  const free=nearestFreeWorldPosition(e.x,e.y,e.r);e.x=free.x;e.y=free.y;e.home=nearestFreeWorldPosition(e.home.x,e.home.y,e.r);e.scout=raw.scout===true;e.cd=1.5;return e;
 });
 const clean={...c,exploration:s.world,enemies:restored,player:{...newPlayer(),x:c.player.x,y:c.player.y,hp:c.player.hp,focus:c.player.focus,invincible:2}};
 restoreWorldCheckpoint(clean);Object.assign(state.world,{visited:new Set(s.world.visited),claimed:new Set(s.world.claimed),seen:new Set(s.world.seen),trailCaptured:s.world.trailCaptured,track:s.world.track,region:null});
 beginAdventure();state.room=c.completed.length;state.skillCd=0;state.dashCd=0;state.attackCd=0;state.bossWon=false;closeModal('playing');updateWorld(0);updateBuild();updateUI();refreshResume();toast('已回到上次营地存档 · 保存后的探索需要重新进行',4);return true;
}
function openCamp(){
 modalReturn='playing';
 const ready=EXPEDITION.read(campStorage(),selectedTheme).status==='ready',w=state.world;
 showModal('camp',`<div class="modal-eyebrow">守夜营地 / 一个可以回来的地方</div><h2 id="modal-title">把这段旅途，留在火光里。</h2><p>保存当前装备、已取得的印记、宝藏与敌人状态。下次从这里继续；保存后的探索不会自动记录。</p><div class="camp-summary"><div><strong>${w.completed.size} / ${sealCount()}</strong><small>任务印记</small></div><div><strong>${w.claimed.size} / ${collectionCount()}</strong><small>已领取宝藏</small></div><div><strong>${w.restCharges}</strong><small>剩余休整次数</small></div></div><div class="modal-actions"><button class="primary" id="camp-save">${ready?'保存并覆盖营地存档':'保存营地存档'} ↗</button><button class="secondary" id="camp-rest" ${!w.restCharges?'disabled':''}>休整 · 回满生命 / 净化 / 补满药剂</button><button class="secondary" id="camp-leave">继续探索</button><button class="secondary" id="camp-atlas">子地图星图 · 前往其他世界</button><button class="secondary" id="camp-bag">行囊与护符</button></div><p id="camp-status" class="save-status" role="status">保存免费；休整消耗一次机会。休整后请再保存。</p><p class="fine-print">仅保存在当前浏览器，不跨设备同步。教学与试炼不会写入此存档。</p>`);
 $('camp-save').onclick=()=>{$('camp-status').textContent=saveCamp()?'已保存。可以关闭页面，下次从首页「继续营地存档」回来。':'保存失败。请脱离战斗；若仍失败，检查浏览器是否允许本地存储。';};
 $('camp-rest').onclick=()=>{if(!w.restCharges||campThreat())return;w.restCharges--;state.journey.flasks=state.journey.maxFlasks;state.journey.flaskCd=0;player.hp=100;state.corruption=Math.max(0,state.corruption-25);state.skillCd=0;state.dashCd=0;updateBuild();openCamp();$('camp-status').textContent='已恢复生命、净化 25 梦蚀、补满月露药剂。请点击保存，记录休整后的状态。';};
 $('camp-leave').onclick=()=>closeModal('playing');$('camp-atlas').onclick=()=>openAtlas();$('camp-bag').onclick=()=>openInventory('camp');
}
function discoveryBlocked(site){
 if(site.id==='trail-cache'&&!state.world.trailCaptured)return '先击破箱旁的斥候，靠近后长按 E 夺影。白色暴露时不要继续攻击。';
 if(enemies.some(e=>!e.dead&&distance(e,site)<330))return '附近仍有守卫：击败或夺取其影子后，才能安全领取。';
 return null;
}
function discoveryRewardCards(before,site,extra){
 const w=campaignWorld();
 if(site.packed){const item=CAMPAIGN.items[w.loot[0]];return `<article class="discovery-extra">${itemIcon(item.id)}<div><small>已放入行囊 · ${item.rarity}</small><p>${item.name} ×${site.packedCount||0}<br>${site.packedCount?'已放入行囊 · 在营地使用':'这次探索中已领取过此补给，不会重复发放'}</p></div></article>`;}
 const rows=[['heal','生命恢复',before.hp,player.hp,'#b7dea4'],['focus','专注补充',before.focus,player.focus,'#a8d6e8'],['purge','梦蚀净化',before.corruption,state.corruption,'#c8b4e8']];
 return rows.filter(([kind])=>(site[kind]||0)>0||kind==='purge'&&state.corruption<before.corruption).map(([kind,label,from,to,color])=>{
  const item=w.loot.find(id=>CAMPAIGN.items[id].effect[kind]);const amount=Math.round(Math.abs(to-from)*10)/10;
  return `<article class="discovery-reward" style="--reward-color:${color}">${itemIcon(item)}<div><small>${label}</small><strong>${amount?(kind==='purge'?'−':'+')+amount:'已满'}</strong><span>${Math.round(from*10)/10} → ${Math.round(to*10)/10}</span></div><b class="discovery-check">✓</b></article>`;
 }).join('')+(extra?`<article class="discovery-extra">${site.upgrade?skillIcon(state.slots[0]):uiGlyph('home')}<div><small>${site.upgrade?'影技共鸣':'营地补给'}</small><p>${extra}</p></div></article>`:'');
}
let pendingChest=null;
function claimDiscovery(site){
 const w=state.world;if(!w||state.phase!=='playing'||state.objective||distance(player,site)>=130||w.claimed.has(site.id))return false;
 const blocked=discoveryBlocked(site);if(blocked){toast(blocked,4);return false;}
 pendingChest={site,world:w,visit:w.visit,choice:'use'};renderChestChoice();return true;
}
function renderChestChoice(){
 const c=pendingChest;if(!c)return;const site=c.site,item=CAMPAIGN.items[campaignWorld().loot[0]];
 showModal('discoveryChoice',`<section class="discovery-ceremony"><div class="discovery-treasure" aria-hidden="true"><div class="treasure-rays"></div>${uiGlyph('box')}<i>✦</i><b>✧</b></div><div class="modal-eyebrow">CHOOSE YOUR REWARD / 二选一</div><h2 id="modal-title">${site.name}</h2><p class="discovery-subtitle">箱中有两份馈赠，只能带走其中一份。</p><div class="chest-choices"><button data-chest-choice="use" class="chest-choice ${c.choice==='use'?'selected':''}" aria-pressed="${c.choice==='use'}">${site.upgrade?skillIcon(state.slots[0]):itemIcon(campaignWorld().loot[0])}<small>选择一 · 立即生效</small><strong>${site.upgrade?'影技共鸣':site.rest?'营地整备':'即刻补给'}</strong><p>${site.reward}</p><span>${c.choice==='use'?'✓ 已选中':'选择这份奖励'}</span></button><button data-chest-choice="pack" class="chest-choice ${c.choice==='pack'?'selected':''}" aria-pressed="${c.choice==='pack'}">${itemIcon(item.id)}<small>选择二 · 放入行囊</small><strong>便携补给包</strong><p>${item.name} ×2<br>每件${item.description}，回到营地使用。</p><span>${c.choice==='pack'?'✓ 已选中':'选择这份奖励'}</span></button></div><p class="chest-choice-note">当前生命 ${Math.ceil(player.hp)} / 100 · 专注 ${Math.floor(player.focus)} / 100 · 梦蚀 ${Math.floor(state.corruption)} / 100<br>确认前不会消耗宝箱，也不会发放任何奖励。</p><div class="discovery-footer"><button id="chest-cancel" class="secondary">暂不领取 · Esc</button><button id="chest-confirm" class="primary">确认领取${c.choice==='pack'?'补给包':site.upgrade?'影技共鸣':'即刻补给'} ↗</button></div></section>`);
 $('modal-card').querySelectorAll('[data-chest-choice]').forEach(b=>b.onclick=()=>selectChestChoice(b.dataset.chestChoice||b.dataset['chest-choice']));
 $('chest-cancel').onclick=cancelChestChoice;$('chest-confirm').onclick=confirmChestChoice;
}
function selectChestChoice(id){if(state.phase!=='discoveryChoice'||!pendingChest||!['use','pack'].includes(id))return false;pendingChest.choice=id;renderChestChoice();return true;}
function cancelChestChoice(){if(state.phase!=='discoveryChoice')return;pendingChest=null;closeModal('playing');}
function confirmChestChoice(){
 const c=pendingChest;if(state.phase!=='discoveryChoice'||!c||c.world!==state.world||c.visit!==state.world.visit||state.world.claimed.has(c.site.id))return false;
 pendingChest=null;closeModal('playing');
 const effective=c.choice==='pack'?{...c.site,heal:0,focus:0,purge:0,rest:0,upgrade:false,packed:true}:c.site;
 return applyDiscoveryReward(effective);
}
function applyDiscoveryReward(site){
 const w=state.world;if(!w||state.phase!=='playing'||state.objective||distance(player,site)>=130||w.claimed.has(site.id))return false;
 const blocked=discoveryBlocked(site);if(blocked){toast(blocked,4);return false;}
 if(site.packed){site.packedCount=0;for(let i=0;i<2;i++){const result=CAMPAIGN.reward(state.campaign,w.id,w.visit+':discoveryPack:'+site.id+':'+i,'packed',()=>0);if(!result.duplicate&&result.item){site.packedCount++;recordAdventureLoot(result.item);}}campaignSave();}
 const before={hp:player.hp,focus:player.focus,corruption:state.corruption},id=state.slots[0];
 if(site.heal>0&&site.focus>0&&player.hp>=100&&player.focus>=100)earnMoment('fullchest');
 player.hp=clamp(player.hp+site.heal,0,100);player.focus=clamp(player.focus+site.focus,0,100);state.corruption=Math.max(0,state.corruption-site.purge);w.restCharges+=site.rest||0;
 let extra=site.rest?'营地休整次数 +1。':'';
 if(site.upgrade){if(state.levels[id]<2){const previous=state.levels[id];state.levels[id]++;celebrateLevelUp(id,previous,state.levels[id]);state.xp[id]=Math.max(state.xp[id],state.levels[id]===2?18:7);extra=`${skills[id].name}升至 Lv.${state.levels[id]+1}：伤害 +22%，冷却 −0.4 秒。`;}else{state.corruption=Math.max(0,state.corruption-25);extra='当前主动影已满级，改为净化 25 梦蚀。';}}
 w.claimed.add(site.id);syncAchievements();if(w.track===site.id)w.track='chase';updateBuild();
 modalReturn='playing';showModal('discovery',`<section class="discovery-ceremony"><div class="discovery-treasure" aria-hidden="true"><div class="treasure-rays"></div>${uiGlyph('box')}<i>✦</i><b>✧</b></div><div class="modal-eyebrow">SUPPLIES FOUND / 探索收获</div><h2 id="modal-title">${site.name}</h2><p class="discovery-subtitle">打开一份补给，让归途再近一点。</p><div class="discovery-rewards">${discoveryRewardCards(before,site,extra)}</div><p class="discovery-applied">${uiGlyph('check')}${site.packed?(site.packedCount?'补给已放入行囊，回营后可使用':'此前已领取，未重复发放物品'):'补给已使用，数值已结算'}</p><div class="discovery-next"><small>下一步</small><p>${site.id==='trail-cache'?'斥候的弓手影已解锁，可按 Tab 装备。沿石路向北，前往破镜小径取得第一枚印记。':'继续寻找印记，或回到营地保存这次收获。'}</p></div><div class="discovery-footer"><span>探索发现 ${w.claimed.size} / ${worldDiscoveries().length} · 本次已领取</span><button class="primary" id="discovery-close">带着收获出发 ↗</button></div></section>`);
 $('discovery-close').onclick=()=>closeModal('playing');tone(720,.25,'triangle');return true;
}
function updateDiscoveries(){
 if(!state.world)return;const w=state.world;
 const unfamiliar=enemies.find(e=>e.variant&&!e.dead&&distance(e,player)<360&&!w.seen.has(e.variant));
 if(unfamiliar){w.seen.add(unfamiliar.variant);toast(`首次遭遇 · ${WORLD.variants[unfamiliar.variant].name}：${WORLD.variants[unfamiliar.variant].tip}`,5);}
}
function updateJourneyHint(){
 if(isCloud()){$('journey-hint').classList.add('hidden');return;}
 const w=state.world,show=w&&state.phase==='playing'&&!state.objective&&!w.claimed.has('trail-cache')&&distance(player,worldDiscoveries()[0])<900;
 $('journey-hint').classList.toggle('hidden',!show);if(!show)return;
 const scout=enemies.find(e=>e.scout&&!e.dead);
 $('journey-title').textContent=w.trailCaptured?'领取你的第一份探索补给':scout?.exposed?'停下攻击 · 长按 E 夺影':'第一站 · 营地北方的斥候补给箱';
 $('journey-description').textContent=w.trailCaptured?'靠近补给箱按 F：选择立即补给，或带走便携补给包。':scout?.exposed?'走到白色斥候身边，按住 E 约 1 秒；装备后 Q 会改变。':'沿石路向北，击破箱旁斥候。奖励：弓手影 + 补给。';
}
function drawDiscovery(s){
 const done=state.world.claimed.has(s.id);ctx.save();glow(s.x,s.y,70,s.color+(done?'0c':'26'));
 ellipse(s.x+3,s.y+12,35,13,'#071b2088');path([[s.x-23,s.y-12],[s.x+23,s.y-12],[s.x+23,s.y+13],[s.x-23,s.y+13]],done?'#263e39':'#526352',s.color+'99');
 path([[s.x-23,s.y-12],[s.x-16,s.y-26],[s.x+17,s.y-26],[s.x+23,s.y-12]],done?'#213a32':'#78836a',s.color+'99');
 ctx.fillStyle=s.color;ctx.fillRect(s.x-3,s.y-13,6,19);ctx.font='12px "Microsoft YaHei"';ctx.textAlign='center';ctx.fillText((done?'✓ ':'')+s.name,s.x,s.y-49);ctx.font='10px sans-serif';ctx.fillStyle=done?'#9aaf9e':'#dfe4be';ctx.fillText(done?'已经领取':s.id==='trail-cache'&&!state.world.trailCaptured?'夺取斥候影子以解锁':'靠近按 F · 清除守卫后领取',s.x,s.y+37);ctx.restore();
}
function discoveryMapSvg(){return worldDiscoveries().map(s=>`<rect x="${s.x-32}" y="${s.y-32}" width="64" height="64" fill="${state.world.claimed.has(s.id)?'#668273':s.color}" stroke="#e3ecc8" stroke-width="8"/>`).join('');}
function discoveryMapChoices(){if(isCloud())return `<details class="discovery-options"><summary>星糖果 ${state.world.claimed.size} / 5 · 走近即可收集</summary><div class="world-map-choices">${WORLD.charms.map(c=>`<button data-track="${c.id}"><b>${state.world.claimed.has(c.id)?'✓':'☆'} ${c.name}</b><small>额外探索奖励 · 不影响印记解锁</small></button>`).join('')}</div></details>`;return `<details class="discovery-options"><summary>可选探索 · 宝藏 ${state.world.claimed.size} / 4（方形标记）</summary><div class="world-map-choices">${worldDiscoveries().map(s=>`<button data-track="${s.id}"><b>${s.symbol} ${s.name}${state.world.claimed.has(s.id)?' ✓':''}</b><small>${s.reward}</small><span>${s.hint}</span></button>`).join('')}</div></details>`;}
function telegraphInfo(e){
 const t=e.target||e,a=e.attack;
 const color=a==='curse'?'#d69bff':a==='lantern'?'#f3cf81':'#ff785e';
 const data={lunge:['冲锋 · 向侧面闪避',0],shot:['射击 · 横向移动',0],slam:['重击 · 离开橙圈',e.boss?160:e.type==='giant'?110:85],lantern:['袭击梦灯 · 攻击打断',0],meteor:['落火 · 离开橙圈',88],venom:['毒雾 · 离开橙圈',72],shieldBash:['盾击 · 离开橙圈',145],curse:['× 梦蚀 · 必须走出紫圈',135]}[a]||['攻击预警',85];
 return {enemy:e,label:data[0],color,radius:data[1],kind:data[1]?'circle':a==='lunge'?'charge':a==='lantern'?'objective':'shot',x:['meteor','venom','curse'].includes(a)?t.x:e.x,y:['meteor','venom','curse'].includes(a)?t.y:e.y,length:a==='lunge'?(e.dash>0?e.dash:e.boss?.58:.36)*650:(e.type==='archer'?260:200)*3,halfWidth:e.r+player.r+8,angle:e.dash>0?Math.atan2(e.dy,e.dx):angle(e,t),count:e.type==='mirror'?5:e.type==='swarm'?3:1,progress:e.dash>0?1:clamp(1-e.telegraph/(e.windup||1.25),0,1)};
}
function attackCue(e){if(isCloud())return;
 const before=e.cueActive;const active=e.telegraph>0&&!e.exposed&&!e.dead;
 if(active&&!before){e.windup=e.telegraph;if(distance(e,player)<600){tone(e.attack==='curse'?180:e.attack==='shot'?610:e.attack==='meteor'?330:240,.13,'triangle',.035);}}
 e.cueActive=active;
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
function drawEnemy(e){if(e.dead)return;if(isCloud()&&e.qKind){QMAP.drawEnemy(ctx,e,richVisuals()?clock:0);return;}const labelY=MONSTERS?.labelY(e,state.world?.id||'forest')??e.y;if(state.world){ctx.font='10px sans-serif';ctx.fillStyle=campaignWorld().color;ctx.textAlign='center';ctx.fillText('Lv.'+(e.level||campaignWorld().level)+(state.objective?.targets?.includes(e.id)?' ◆ 清剿目标':''),e.x,labelY-e.r-76);}if(e.variant){const v=WORLD.variants[e.variant];ctx.save();ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle=v.color;ctx.fillText(v.name+' · '+shadows[e.type].name,e.x,labelY-e.r-55);if(e.variant==='stalker'&&!e.aggro)ctx.globalAlpha=.35;if(e.variant==='sentinel'){ctx.strokeStyle=v.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y-8,31,e.facing-1.1,e.facing+1.1);ctx.stroke();}if(e.variant==='cinder'){glow(e.x+20,e.y-35,32,'#efa46855');ellipse(e.x+20,e.y-35,5,10,'#efbe85');}ctx.restore();}
 if(e.exposed){glow(e.x,e.y,65,'#bfffe51b');ctx.save();ctx.strokeStyle='#d4ffed';ctx.lineWidth=1.5;ctx.setLineDash([4,8]);ctx.beginPath();ctx.ellipse(e.x,e.y+8,e.r+19,(e.r+19)*.6,clock,0,TAU);ctx.stroke();ctx.restore();ctx.globalAlpha=.65+Math.sin(clock*9)*.15;}
 if(e.variant==='stalker'&&!e.aggro&&!e.exposed)ctx.globalAlpha=.35;if(!MONSTERS?.draw(ctx,e,player,state.time,state.world?.id||'forest',richVisuals())){if(e.type==='wolf')drawWolf(e);else if(e.type==='ghost'){ellipse(e.x,e.y+13,21,7,'#041a2190');glow(e.x,e.y-4,35,'#8edde125');const bob=Math.sin(clock*3)*4;path([[e.x-17,e.y+12+bob],[e.x-15,e.y-22+bob],[e.x-5,e.y-34+bob],[e.x+9,e.y-32+bob],[e.x+17,e.y-17+bob],[e.x+19,e.y+13+bob],[e.x+7,e.y+8+bob],[e.x,e.y+19+bob],[e.x-6,e.y+8+bob]],'#233e4b','#87c9c399');ctx.fillStyle='#c6f9e5';ctx.fillRect(e.x-6,e.y-19+bob,3,3);ctx.fillRect(e.x+4,e.y-19+bob,3,3);}else if(e.type==='swarm'){drawHumanoid(e.x,e.y,angle(e,player),shadows.swarm.color,e.elite?1.3:1,true);for(let i=0;i<3;i++){const a=clock*2+i*TAU/3;ellipse(e.x+Math.cos(a)*25,e.y-12+Math.sin(a)*15,3,2,'#d0c788');}}else{drawHumanoid(e.x,e.y,angle(e,player),shadows[e.type].color,e.type==='giant'?1.5:e.elite?1.3:1,true);if(e.type==='shield')path([[e.x-20,e.y-22],[e.x-4,e.y-18],[e.x-5,e.y+4],[e.x-16,e.y+13],[e.x-26,e.y+2]],'#334550','#8ca8b6');if(e.type==='fire')glow(e.x+23,e.y-5,30,'#f3a26055');if(e.type==='mirror'){ctx.save();ctx.translate(e.x,e.y-8);ctx.rotate(clock);ctx.strokeStyle='#b29bd777';ctx.strokeRect(-25,-25,50,50);ctx.restore();}}}
 ctx.globalAlpha=1;if(e.scout){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e1d99c';ctx.fillText('斥候 · 夺影解锁补给',e.x,labelY-e.r-63);}if(e.hit>0){glow(e.x,e.y-12,45,'#eef9dc44');}if(state.objective?.targetId===e.id){ctx.fillStyle='#e6ce8e';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(state.objective.kind==='capture'?'◆ 指定夺影目标':'◆ 追猎目标',e.x,labelY-e.r-58);}if(e.exposed){ctx.font='11px "Microsoft YaHei"';ctx.textAlign='center';ctx.fillStyle='#e1ffea';ctx.fillText(distance(e,player)<115?'长按 E 夺影':'影子暴露',e.x,labelY-e.r-38);ctx.fillStyle='#213c38';ctx.fillRect(e.x-24,labelY-e.r-30,48,2);ctx.fillStyle='#c7e8cc';ctx.fillRect(e.x-24,labelY-e.r-30,48*e.exposed/(e.boss?8:7),2);}else if(e.hp<e.maxHp||e.elite||state.tutorial||state.mode==='practice'){const size=e.boss?80:40;ctx.fillStyle='#081b1e';ctx.fillRect(e.x-size/2,labelY-e.r-29,size,4);ctx.fillStyle=e.boss?'#c597cc':'#92b093';ctx.fillRect(e.x-size/2,labelY-e.r-29,size*clamp(e.hp/e.maxHp,0,1),4);ctx.fillStyle='#aabfe28c';ctx.fillRect(e.x-size/2,labelY-e.r-23,size*clamp(e.pressure/e.maxPressure,0,1),2);if(state.tutorial){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#d8eccb';ctx.fillText(`${shadows[e.type].name} · 练习目标`,e.x,labelY-e.r-52);ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillStyle='#a2c79e';ctx.fillText('生命',e.x-size/2-7,labelY-e.r-25);ctx.fillStyle='#b7c9e6';ctx.fillText('影压',e.x-size/2-7,labelY-e.r-17);}if(e.elite&&!e.boss){ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#cfb785';ctx.fillText('◆ 精英',e.x,labelY-e.r-37);}}}
function drawPlayer(){drawRide();const p=player;p.appearance=characterAppearance;glow(p.x,p.y,65,state.nightmare>0?'#a85cdd45':'#a4dfb619');if(p.invincible>0&&Math.sin(clock*35)>.5)ctx.globalAlpha=.55;if(state.nightmare>0){ctx.save();ctx.strokeStyle='#cfa1eb';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+7,43,19,0,0,TAU);ctx.stroke();ctx.restore();}if(!drawQHero())drawHumanoid(p.x,p.y,p.angle,state.nightmare>0?'#ddb0f2':'#beffe0',1.15);ctx.globalAlpha=1;
 if(p.shield>0){ctx.strokeStyle='#b6e3f0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-8,38,0,TAU);ctx.stroke();glow(p.x,p.y,45,'#a1d8e222');}
 state.slots.forEach((s,i)=>{const a=clock*.6+i*TAU/3,x=p.x+Math.cos(a)*39,y=p.y+Math.sin(a)*19+6;glow(x,y,14,shadows[s].color+'44');path([[x,y-5],[x+4,y],[x,y+5],[x-4,y]],shadows[s].color);});
 if(p.charging>.15){ctx.strokeStyle=p.charging>=.5?'#e5efb9':'#9dccba';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,33,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,p.charging/.5));ctx.stroke();}
 window.HUNTER_SCENE?.aura(ctx,p,clock,richVisuals());
 // Quiet cursor reticle makes aiming unambiguous without obscuring the world.
 ctx.strokeStyle='#c5e2cc80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,TAU);ctx.moveTo(mouse.x-12,mouse.y);ctx.lineTo(mouse.x-8,mouse.y);ctx.moveTo(mouse.x+8,mouse.y);ctx.lineTo(mouse.x+12,mouse.y);ctx.moveTo(mouse.x,mouse.y-12);ctx.lineTo(mouse.x,mouse.y-8);ctx.stroke();}
function drawEffects(){for(const f of effects){if(f.visual==='fire'&&window.HUNTER_FEEDBACK)continue;const t=clamp(f.life/(f.max||1),0,1);ctx.save();ctx.globalAlpha=t;if(f.kind==='basketball'||f.kind==='basketballBounce'){drawBasketballFlight(f);}else if(f.kind==='particle'){ellipse(f.x,f.y,f.r,f.r,f.color);}else if(f.kind==='ring'){ctx.strokeStyle=f.color;ctx.lineWidth=2+t*4;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(1-t*.75),f.r*(1-t*.75)*.66,0,0,TAU);ctx.stroke();}else if(f.kind==='slash'){ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.strokeStyle=f.color;ctx.lineWidth=5+12*t;ctx.beginPath();ctx.arc(0,0,f.r*(1-t*.25),-1.05,1.05);ctx.stroke();ctx.globalAlpha=t*.16;ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,f.r,-1.05,1.05);ctx.closePath();ctx.fill();}else if(f.kind==='beam'){ctx.strokeStyle=f.color;ctx.lineWidth=f.width*t;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.tx,f.ty);ctx.stroke();}else if(f.kind==='afterimage'){drawHumanoid(f.x,f.y,f.a,f.color,1.15);}ctx.restore();}}
function draw(){if(state.world){drawWorld();return;}const dpr=Math.min(window.devicePixelRatio||1,2),width=canvas.clientWidth,height=canvas.clientHeight;if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);ctx.save();sampleRenderShake();ctx.drawImage(ground,0,0);drawMissionScenery();
 for(const h of hazards)drawHazard(h);
 // Moonbeams extend across the clearing; gradients keep play space readable.
 ctx.save();ctx.globalCompositeOperation='screen';const beam=ctx.createLinearGradient(930,0,530,H);beam.addColorStop(0,'#b7d9c90f');beam.addColorStop(.6,'#b7d9c911');beam.addColorStop(1,'#b7d9c900');path([[850,0],[1040,0],[610,780],[290,780]],beam);path([[1110,0],[1140,0],[770,780],[700,780]],beam);ctx.restore();
 drawTutorialMarker();
 drawEffects();
 const entities=[...trees.map(t=>({y:t.y,draw:()=>drawTree(t)})),...obstacles.map((o,i)=>({y:o.y,draw:()=>drawShrine(o,i)})),...enemies.filter(e=>!e.dead).map(e=>({y:e.y,draw:()=>drawEnemy(e)})),{y:player.y,draw:drawPlayer}];entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 for(const p of projectiles){if(p.enemy)continue;window.HUNTER_SCENE?.projectile(ctx,p,richVisuals());ctx.strokeStyle='#ffe3a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);ctx.stroke();}
 for(const m of minions){glow(m.x,m.y,13,m.color+'44');path([[m.x,m.y-6],[m.x+4,m.y],[m.x,m.y+6],[m.x-4,m.y]],m.color);}
 for(const f of floating){ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign='center';ctx.font=/^\d+$/.test(f.text)?'bold 15px Georgia':'11px "Microsoft YaHei"';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 if(releaseSettings().atmosphere)for(const s of stars){const x=s.x+Math.sin(clock*.35+s.s)*13,y=s.y+Math.cos(clock*.45+s.s)*8;ctx.globalAlpha=.3+Math.sin(clock+s.s)*.2;glow(x,y,7,'#cdf3c188');ellipse(x,y,1.2,1.2,'#d4eaca');}ctx.globalAlpha=1;
 const vignette=ctx.createRadialGradient(610,390,200,600,390,690);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#07151fce');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 if(state.phase==='intro'){const shade=ctx.createLinearGradient(0,0,800,0);shade.addColorStop(0,'#081921ae');shade.addColorStop(1,'#08192100');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);}ctx.restore();}
function frame(timestamp){const dt=Math.min(.04,(timestamp-last)/1000||.016);last=timestamp;update(dt);if(state.phase==='encounter'){if(encounterDialogue?.prologue)draw();requestAnimationFrame(frame);return;}updateRelease(dt);if(window.HUNTER_RELEASE?.settings.shake===false)screenShake=0;draw();drawFeedback(dt);requestAnimationFrame(frame);}
function mousePosition(e){const rect=canvas.getBoundingClientRect();mouse.u=(e.clientX-rect.left)/rect.width;mouse.v=(e.clientY-rect.top)/rect.height;mouse.x=state.world?camera.x+mouse.u*camera.w:mouse.u*W;mouse.y=state.world?camera.y+mouse.v*camera.h:mouse.v*H;}
canvas.addEventListener('wheel',changeViewByWheel,{passive:false});
$('view-range').addEventListener('input',e=>{if(state.world&&state.phase==='playing')setViewRange(e.target.value);});
for(const id of ['view-range','view-near','view-far','view-reset'])$(id).addEventListener('focus',()=>{keys={};mouse.down=false;state.capture=0;state.captureTarget=null;$('capture-hud').classList.add('hidden');});
for(const [id,delta] of [['view-near',-10],['view-far',10],['view-reset',0]])$(id).onclick=()=>{if(!state.world||state.phase!=='playing')return;setViewRange(delta?viewRange+delta:VIEW_RANGE.default);canvas.focus({preventScroll:true});};
canvas.addEventListener('pointermove',mousePosition);canvas.addEventListener('pointerdown',e=>{if(e.button!==0||state.phase!=='playing')return;mousePosition(e);cancelRecall();mouse.down=true;mouse.held=0;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});canvas.addEventListener('pointerup',e=>{if(e.button!==0)return;if(mouse.down){const charged=mouse.held>=.5;mouse.down=false;basicAttack(charged);mouse.held=0;}});canvas.addEventListener('pointercancel',()=>{mouse.down=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable||e.target?.closest?.(".view-controls"))return;if(state.phase==='qPuzzle'&&!['KeyP','KeyO'].includes(e.code)){e.preventDefault();if(!e.repeat)cloudPuzzleKey(e.code);return;}if(state.world&&state.phase==='playing'&&['Minus','Equal','NumpadSubtract','NumpadAdd','Digit0','Numpad0'].includes(e.code)){e.preventDefault();setViewRange(['Digit0','Numpad0'].includes(e.code)?VIEW_RANGE.default:viewRange+(['Minus','NumpadSubtract'].includes(e.code)?-10:10));return;}const tabShortcut=e.code==='Tab'&&['intro','playing','map'].includes(state.phase);if(tabShortcut||state.phase==='playing'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(['KeyP','KeyO'].includes(e.code)){e.preventDefault();if(!e.repeat){if(e.code==='KeyP')openCharacterWardrobe();else openMonsterWardrobe();}return;}if(state.phase==='discoveryChoice'&&e.code==='Escape'){e.preventDefault();cancelChestChoice();return;}if(state.phase==='achievements'&&e.code==='Escape'){e.preventDefault();closeReleasePanel();return;}if(state.phase==='encounter'){if(['Space','Enter','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat){if(e.code==='Escape')finishEncounter();else advanceEncounter();}}return;}if(e.repeat){keys[e.code]=true;return;}keys[e.code]=true;if(state.journey.recall>0&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyJ','KeyQ','KeyV','Space','KeyR','KeyC','KeyF'].includes(e.code))cancelRecall();if(state.phase==='settlement'){if(e.code==='Escape'){e.preventDefault();closeSettlement();}return;}if(e.code==='Escape'&&['profession','monsters'].includes(state.phase)){e.preventDefault();closeAppearance();return;}if(e.code==='Escape'&&state.phase==='saveChooser'){closeModal('intro');return;}if(e.code==='Escape'&&state.phase==='atlas'){closeAtlas();return;}if(e.code==='Escape'&&state.phase==='inventory'){$('inventory-close').onclick();return;}if(e.code==='KeyN'){openAtlas();return;}if(e.code==='Escape'){if(['guide','codex','skillinfo','worldmap','camp','discovery','shop'].includes(state.phase))closeModal();else if(state.phase==='build'){if(modalReturn==='map')showRoute();else closeModal();}else pause();}if(tabShortcut)openBuild();if(e.code==='KeyC')useFlask();if(e.code==='KeyB')startRecall();if(e.code==='KeyH')toggleRide();if(e.code==='KeyM')openWorldMap();if(e.code==='KeyF')interactWorld();if(e.code==='Space')dash();if(e.code==='KeyQ')skill();if(e.code==='KeyV')basketballSkill();if(e.code==='KeyR'&&state.phase==='playing'&&!state.tutorial){state.weapon=state.weapon==='blade'?'bow':'blade';updateUI();toast(state.weapon==='bow'?'弓形 · 远程精准攻击':'刃形 · 近身弧形斩击',1.5);}if(e.code==='KeyJ')basicAttack();if(e.code==='KeyE'&&!isCloud()&&state.phase==='playing'&&!enemies.some(t=>!t.dead&&t.exposed&&distance(t,player)<115))toast('夺影条件：敌人变白后，走近它，再按住 E 约 1 秒',2);});window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{keys={};mouse.down=false;if(state.phase==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};mouse.down=false;if(state.phase==='playing')pause();}});
$('atlas-button').onclick=()=>openTheme('main');$('atlas-nav').onclick=()=>openAtlas();$('start-button').onclick=()=>{selectTheme('main');openProfession(true);};$('skip-intro').onclick=()=>{selectTheme('main');openProfession(false);};$('skip-tutorial').onclick=finishTutorial;$('skill-detail-button').onclick=openSkillDetails;$('pause-button').onclick=pause;$('guide-button').onclick=openGuide;$('codex-button').onclick=openCodex;$('build-button').onclick=()=>openBuild();$('hunt-tab').onclick=()=>{if(['guide','codex','paused','skillinfo','worldmap'].includes(state.phase))closeModal();};$('skill-button').onclick=skill;$('basketball-button').onclick=()=>basketballSkill();$('dash-button').onclick=dash;$('attack-button').onclick=()=>basicAttack();$('capture-button').onpointerdown=e=>{keys.KeyE=true;e.currentTarget.setPointerCapture(e.pointerId);};$('capture-button').onpointerup=()=>{keys.KeyE=false;};$('capture-button').onpointercancel=()=>{keys.KeyE=false;};$('sound-button').onclick=()=>{soundOn=!soundOn;$('sound-button').innerHTML=soundOn?'♫':'♫<span class="sound-off">/</span>';$('sound-button').ariaLabel=soundOn?'关闭声音':'开启声音';$('sound-button').title=soundOn?'关闭声音':'开启声音';tone(660,.25);};$('fullscreen-button').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast('当前窗口不支持全屏，请在独立浏览器中打开');}};

$('practice-intro').onclick=startPractice;$('practice-button').onclick=requestPractice;
$('practice-dummy').onclick=()=>practiceTargets('dummy');$('practice-mobs').onclick=()=>practiceTargets('mobs');
$('practice-refresh').onclick=refreshPractice;$('practice-exit').onclick=()=>{if(state.mode==='practice')reset();};
$('compact-detail').onclick=openSkillDetails;$('compact-edit').onclick=()=>openBuild();

$('continue-run').onclick=openSaveChooser;
$('character-nav').onclick=openCharacterWardrobe;$('monster-nav').onclick=openMonsterWardrobe;
window.addEventListener('keydown',e=>{
 if(e.code!=='Tab'||!['profession','monsters'].includes(state.phase))return;
 const buttons=Array.from($('modal-card').querySelectorAll('button:not(:disabled)'));
 const first=buttons[0],last=buttons[buttons.length-1];if(!first)return;
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
$('flask-button').onclick=useFlask;$('recall-button').onclick=startRecall;$('world-map-nav').onclick=openWorldMap;$('world-map-button').onclick=openWorldMap;$('world-interact').onclick=interactWorld;

// A read-only snapshot is intentionally available for automated smoke verification.
window.shadowHunter={snapshot:()=>({appearance:characterAppearance,phase:state.phase,mode:state.mode,campaign:{cleared:[...state.campaign.cleared],inventory:{...state.campaign.inventory},equipped:state.campaign.equipped},journey:{...state.journey,perks:[...state.journey.perks]},world:state.world?{id:state.world.id,completed:[...state.world.completed],visited:[...state.world.visited],track:state.world.track,camera:{...camera}}:null,objective:state.objective?{kind:state.objective.kind,status:state.objective.status,remaining:state.objective.remaining,lanternHp:state.objective.lantern?.hp}:null,room:state.room,time:state.time,hp:player.hp,focus:player.focus,kills:state.kills,captures:state.captures,slots:[...state.slots],owned:[...state.owned],corruption:state.corruption,locked:state.locked,skillCd:state.skillCd,weapon:state.weapon,player:{x:player.x,y:player.y},enemies:enemies.filter(e=>!e.dead).map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp,pressure:e.pressure,exposed:e.exposed,boss:e.boss})),tutorial:state.tutorial?{step:state.tutorial.step}:null,projectiles:projectiles.length,minions:minions.length,combo:combo().name})};
/* Release integration keeps camp data and original combat rules compatible. */
let achievementQueue=[];
let releaseReturn='intro',releaseClock=0,lastAudioScene='',releaseLastOutcome='defeat';
const knownAchievements=new Set(window.HUNTER_RELEASE?.journal().achievements||[]);
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function richVisuals(){return releaseSettings().atmosphere!==false&&!reducedMotion?.matches;}
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
 showModal('settings',`<div class="modal-eyebrow">OPTIONS / 随心调整</div><h2 id="modal-title">让这场旅程，适合你。</h2><p>调整时游戏暂停，设置会在当前浏览器记住。难度可随时切换，不重置存档。</p><div class="settings-grid"><label class="setting-row"><span>背景音乐 <output id="music-value">${s.music}%</output></span><input id="music-volume" aria-label="背景音乐音量" type="range" min="0" max="100" value="${s.music}"><small>随营地、探索、战斗与首领自动变奏。</small></label><label class="setting-row"><span>战斗音效 <output id="effects-value">${s.effects}%</output></span><input id="effects-volume" aria-label="战斗音效音量" type="range" min="0" max="100" value="${s.effects}"><small>包含攻击、夺影与敌人预警。</small></label><label class="setting-row"><span>场景亮度 <output id="brightness-value">${s.brightness}%</output></span><input id="scene-brightness" aria-label="场景亮度" type="range" min="85" max="130" value="${s.brightness}"><small>只调整游戏场景，不影响界面和判定。</small></label><label class="setting-row"><span>旅程难度</span><select id="difficulty-select" aria-label="旅程难度"><option value="story" ${s.difficulty==='story'?'selected':''}>旅人 · 受到伤害降低 35%</option><option value="standard" ${s.difficulty==='standard'?'selected':''}>猎人 · 标准挑战</option></select><small>旅人适合初次游玩；猎人保留原版数值。不会改变守灯任务的梦灯耐久。</small></label></div><div class="setting-row"><label class="setting-switch"><input id="sound-enabled" type="checkbox" ${s.sound?'checked':''}>启用音乐与音效</label><label class="setting-switch"><input id="shake-enabled" type="checkbox" ${s.shake?'checked':''}>战斗镜头震动</label><label class="setting-switch"><input id="atmosphere-enabled" type="checkbox" ${s.atmosphere?'checked':''}>增强光影、粒子与界面动画</label></div><p class="settings-note" id="settings-note" role="status">首次点击后才能播放音乐；如无声音，请检查系统音量和右上角静音按钮。</p><div class="modal-actions"><button class="primary" id="settings-close">保存并返回 ↗</button><button class="secondary" id="settings-defaults">恢复默认设置</button></div>`);
 for(const [id,key,output] of [['music-volume','music','music-value'],['effects-volume','effects','effects-value'],['scene-brightness','brightness','brightness-value']])$(id).addEventListener('input',e=>{const value=Number(e.target.value);$(output).textContent=value+'%';saveOption({[key]:value});});
 $('difficulty-select').addEventListener('change',e=>saveOption({difficulty:e.target.value}));
 for(const [id,key] of [['sound-enabled','sound'],['shake-enabled','shake'],['atmosphere-enabled','atmosphere']])$(id).addEventListener('change',e=>saveOption({[key]:e.target.checked}));
 $('settings-close').onclick=closeReleasePanel;
 $('settings-defaults').onclick=()=>{updateReleaseSettings(window.HUNTER_RELEASE?.defaults||{});const previous=releaseReturn;state.phase=previous;openSettings();};
}
function saveOption(patch){const saved=updateReleaseSettings(patch);$('settings-note').textContent=saved?'设置已保存，即时生效。':'设置已生效；浏览器不允许存储，关闭后可能不会保留。';window.HUNTER_AUDIO?.unlock();}
function openAchievements(){if(!beginReleasePanel())return;renderAchievements('全部');}
function renderAchievements(filter='全部'){
 const release=window.HUNTER_RELEASE,data=release.journal(),list=release.achievements;
 const unlocked=new Set(data.achievements),categories=['全部','已解锁','未解锁','战斗','探索','成长','收集','旅途'];
 const visible=list.filter(([id,,,category])=>filter==='全部'||filter==='已解锁'&&unlocked.has(id)||filter==='未解锁'&&!unlocked.has(id)||filter===category);
 showModal('achievements',`<div class="achievement-heading"><div><div class="modal-eyebrow">ACHIEVEMENTS / 归途勋章</div><h2 id="modal-title">每一步，都值得被记住。</h2><p>战斗、探索、成长与重逢，留下属于你的旅途印记。</p></div><div class="achievement-total"><b>${unlocked.size}</b><span> / ${list.length} 已解锁</span></div></div><div class="achievement-overall" role="progressbar" aria-label="成就总进度" aria-valuenow="${unlocked.size}" aria-valuemin="0" aria-valuemax="${list.length}"><i style="width:${unlocked.size/list.length*100}%"></i></div><div class="achievement-filters" aria-label="成就筛选">${categories.map(c=>`<button data-achievement-filter="${c}" aria-pressed="${c===filter}" class="${c===filter?'active':''}">${c}</button>`).join('')}</div><div class="achievement-grid">${visible.map(([id,name,description,category,key,target,flavor])=>{const done=unlocked.has(id),progress=done?target:Math.min(target,data.progress[key]||0);return `<article class="achievement-card ${done?'unlocked':''}"><div class="achievement-medal" aria-hidden="true">${uiGlyph(done?'star':'seal')}</div><div class="achievement-card-copy"><small>${category} · ${done?'已解锁':'进行中'}</small><h3>${name}</h3><p>${description}</p><blockquote class="achievement-flavor">“${flavor}”</blockquote><div class="achievement-progress"><div><i style="width:${progress/target*100}%"></i></div><span>${progress} / ${target}</span></div></div></article>`;}).join('')||'<p class="achievement-empty">这里还没有成就，下一段冒险正在等你。</p>'}</div><p class="fine-print">${release.journalStorageOK?'成就与最佳进度保存在当前浏览器。':'浏览器存储暂不可用，本次成就暂存于本页，请勿刷新。'}教学与试炼不计入成就；单次旅程目标显示历史最佳进度。领取物品和成就解锁相互独立。</p><button id="achievements-close" class="primary">返回旅途 ↗</button>`);
 $('modal-card').querySelectorAll('[data-achievement-filter]').forEach(b=>b.onclick=()=>renderAchievements(b.dataset.achievementFilter||b.dataset['achievement-filter']));
 $('achievements-close').onclick=closeReleasePanel;
}
function openRecords(){
 if(!beginReleasePanel())return;const data=window.HUNTER_RELEASE?.journal()||{wins:0,runs:0,bestTime:null,achievements:[]};
 showModal('records',`<div class="modal-eyebrow">HUNTER'S JOURNAL / 猎人纪事</div><h2 id="modal-title">月光记得你的足迹。</h2><div class="stats"><div><strong>${data.wins}</strong><small>黎明归来</small></div><div><strong>${data.runs}</strong><small>已结算旅程</small></div><div><strong>${data.bestTime?formatTime(data.bestTime):'—'}</strong><small>最快通关</small></div></div><div class="journal-grid">${(window.HUNTER_RELEASE?.achievements||[]).map(([id,name,description])=>`<div class="journal-card ${data.achievements.includes(id)?'unlocked':''}"><b>${data.achievements.includes(id)?'✦':'◇'} ${name}</b><small>${description}</small></div>`).join('')}</div><p class="fine-print">记录仅保存在此浏览器，不跨设备同步。教学与试炼不计入成就。通关时间包含本局实际探索时间，暂停不计时；不同难度共用纪事。</p><button class="primary" id="records-close">返回 ↗</button>`);$('records-close').onclick=closeReleasePanel;
}
function openCredits(){
 if(!beginReleasePanel())return;
 showModal('credits',`<div class="modal-eyebrow">SHADOW HUNTER / 1.4</div><h2 id="modal-title">影子猎手 · 五境远征</h2><p>一场关于借用力量、承担代价与寻找归路的单人动作冒险。</p><div class="explain-box"><b>核心设计与基础实现</b><br>项目小组：夺影、四种技能、梦蚀与连续探索。<br><br><b>版本完善</b><br>在现有项目上进行 AI 辅助代码完善、程序化画面与界面打磨。<br><br><b>画面与声音</b><br>场景和角色由 Canvas / SVG 实时绘制；标题背景由 AI 辅助生成。背景配乐采用为本项目编写的旋律与和声，以 Web Audio 本地合成，无外部音乐文件。<br><br><b>技术</b><br>HTML、CSS、JavaScript、Canvas 2D、Web Audio。无需账号与网络，支持本地离线游玩。</div><p>感谢每一位参与试玩、记录问题、提出建议的同学。</p><button class="primary" id="credits-close">回到月光之下 ↗</button>`);$('credits-close').onclick=closeReleasePanel;
}
function confirmLeave(home){
 showModal('leaveConfirm',`<div class="modal-eyebrow">离开当前旅程</div><h2 id="modal-title">要回到梦的起点吗？</h2><p>营地检查点会保留，但上次保存之后的探索不会自动保存。可以先继续冒险，按 B 静止 3 秒回城，自动结算并保存本轮收获。</p><div class="modal-actions"><button class="secondary" id="leave-cancel">继续当前旅程</button><button class="primary" id="leave-confirm">${home?'返回标题':'重新开始'}</button></div>`);
 $('leave-cancel').onclick=()=>{state.phase=modalReturn;pause();};$('leave-confirm').onclick=()=>{if(home)reset();else if(state.mode==='practice')startPractice();else{reset();start();}};
}
function renderAchievementNotices(){
 const notice=$('achievement-toast');
 if(!achievementQueue.length){notice.classList.add('hidden');return;}
 notice.innerHTML=achievementQueue.slice(-4).map(entry=>{const a=window.HUNTER_RELEASE.achievements.find(a=>a[0]===entry.id);return `<article class="achievement-popup" data-achievement-popup="${entry.id}"><div class="achievement-toast-medal">${uiGlyph('star')}</div><div class="achievement-notice-copy"><small>${entry.label||'成就已解锁'}</small><strong>${a[1]}</strong><span>${a[2]}</span><em>${a[6]}</em></div></article>`;}).join('');
 notice.classList.remove('hidden');
}
function queueAchievement(id,repeat=false,label='成就已解锁'){
 if(!repeat&&knownAchievements.has(id)||!window.HUNTER_RELEASE.achievements.some(a=>a[0]===id))return;
 knownAchievements.add(id);achievementQueue=achievementQueue.filter(entry=>entry.id!==id);achievementQueue.push({id,label,remaining:6});renderAchievementNotices();tone(780,.16,'triangle',.025);
}
function celebrateFirstDefeat(){
 const release=window.HUNTER_RELEASE;if(!release)return;
 const owned=release.journal().achievements.includes('firstkill');
 release.unlock('firstkill');queueAchievement('firstkill',true,owned?'本次旅程 · 首次斩杀':'成就已解锁');
}
function earnMoment(id){if(state.world&&state.phase==='playing'&&!state.tutorial&&state.mode==='hunt')awardAchievement(id);}
function awardAchievement(id){if(!window.HUNTER_RELEASE)return;if(window.HUNTER_RELEASE.unlock(id))queueAchievement(id);}
function syncAchievements(){
 if(!state.tutorial&&state.mode!=='practice'&&state.phase!=='intro'){
  if(state.captures>0)awardAchievement('capture');if(state.world?.completed.size>0)awardAchievement('seal');if(state.world?.completed.size>=3)awardAchievement('trinity');if(state.nightmare>0||state.locked)awardAchievement('nightmare');
  const release=window.HUNTER_RELEASE;
  const inventory=Object.entries(state.campaign.inventory).filter(([,n])=>n>0);
  release?.observe({kills:state.kills,captures:state.captures,seals:state.world?.completed.size||0,forest:state.campaign.cleared.includes('forest')?1:0,nightmare:state.nightmare>0||state.locked?1:0,chain:state.journey.bestStreak||0,skillLevel:Math.max(...skillIds.map(id=>state.levels[id]+1)),skills:skillIds.filter(id=>state.owned.has(id)).length,regions:state.world?.visited.size||0,discoveries:state.world?.claimed.size||0,items:inventory.length,relics:inventory.filter(([id])=>CAMPAIGN.items[id]?.kind==='relic').length,worlds:state.campaign.cleared.length,mainWorlds:state.campaign.cleared.filter(id=>CAMPAIGN.themeOf(id)==='main').length,returns:state.settlement?1:0});
  for(const id of release?.journal().achievements||[])queueAchievement(id);
 }
}
function updateRelease(dt){
 if(achievementQueue.length){for(const entry of achievementQueue)entry.remaining-=dt;const active=achievementQueue.filter(entry=>entry.remaining>0);if(active.length!==achievementQueue.length){achievementQueue=active;renderAchievementNotices();}}
 releaseClock+=dt;if(releaseClock<.25)return;releaseClock=0;
 const audio=window.HUNTER_AUDIO?.status();$('audio-note').textContent=audio&&!audio.supported?'此浏览器不支持背景音乐，请使用新版 Edge 或 Chrome。':!releaseSettings().sound?'音乐与音效已静音 · 可在右上角开启':audio?.unlocked?'背景配乐已启用 · 音量可在游戏设置中调整':'首次点击后启用背景音乐 · 右上角可静音';
 document.body?.classList.toggle('low-health',state.phase==='playing'&&player.hp<=30&&!state.tutorial&&state.mode!=='practice');
 let musicScene='menu';
 if(state.phase==='worldVictory'||state.world?.victory&&['atlas','inventory'].includes(state.phase))musicScene='victory';
 else if(state.phase==='end')musicScene=releaseLastOutcome;
 else if(state.mode==='practice'||state.tutorial)musicScene='camp';
 else if(state.world){const boss=enemies.some(e=>e.boss&&!e.dead);const danger=enemies.some(e=>!e.dead&&!e.exposed&&e.aggro&&distance(e,player)<540);musicScene=boss?'boss':state.phase==='playing'&&danger?'combat':state.phase==='camp'||distance(player,WORLD.sites[0])<220?'camp':'explore';}
 if(musicScene!==lastAudioScene){lastAudioScene=musicScene;window.HUNTER_AUDIO?.setScene(musicScene);}
 syncAchievements();
}
function drawFeedback(dt){
 const overlay=$('feedback-canvas'),scale=canvas.clientWidth/(state.world?camera.w:W),height=state.world?camera.h:H;
 const visible=enemies.filter(e=>!e.dead&&(!state.world||worldVisible(e.x,e.y,140)));
 const screenPoint=p=>pointOnScreen({x:p.x+renderShake.x,y:p.y+renderShake.y});
 const occluders=[{x:player.x,y:player.y,rx:42,ry:64,offsetY:-24},...visible.map(e=>({x:e.x,y:e.y,rx:e.boss?86:e.type==='giant'?54:40,ry:e.boss?92:60,offsetY:-24}))];
 window.HUNTER_FEEDBACK?.render(overlay,{dt,screenPoint,player,capture:state.capture,target:state.captureTarget,phase:state.phase,instant:player.focus>=100,rich:richVisuals(),scale,scaleY:canvas.clientHeight/height,dpr:window.devicePixelRatio,occluders});
 if(state.phase!=='playing'||!window.HUNTER_COMBAT)return;
 const g=overlay.getContext('2d'),sx=overlay.width/(state.world?camera.w:W),sy=overlay.height/height;
 g.save();g.setTransform(sx,0,0,sy,0,0);g.translate(renderShake.x-(state.world?camera.x:0),renderShake.y-(state.world?camera.y:0));
 const cues=enemies.filter(e=>!e.dead&&!e.exposed&&e.target&&(e.telegraph>0||e.dash>0)).map(telegraphInfo);
 window.HUNTER_COMBAT.render(g,{enemies:visible,cues,hazards,projectiles,player,time:clock,scale,rich:richVisuals(),healthBars:visible.filter(e=>!e.dead).map(e=>({x:e.x,y:(MONSTERS?.labelY(e,state.world?.id||'forest')??e.y)-e.r-27,w:e.boss?84:52,h:14}))});g.restore();
}
function playEquipFeedback(id,action='equip'){
 const color=shadows[id]?.color||'#c1e6d5';
 window.HUNTER_FEEDBACK?.emit(action==='heal'?'heal':'equip',{x:player.x,y:player.y,color,anchor:action==='heal'?undefined:'hud'});
 const panel=$('compact-build');panel.classList.remove('weave-pulse');void panel.offsetWidth;panel.classList.add('weave-pulse');
}
function initializeExperience(){
 const feedback=window.HUNTER_FEEDBACK;if(!feedback)return;
 const damageOriginal=damageEnemy,exposeOriginal=expose,killOriginal=gainKill;
 damageEnemy=(e,...args)=>{const hp=e.hp,alive=!e.dead,result=damageOriginal(e,...args);if(alive&&e.hp<hp&&['basic','skill'].includes(args[2]||'basic')){const skill=args[3]?.active||state.slots[0];feedback.emit('impact',{x:e.x,y:e.y,angle:angle(player,e),color:args[2]==='skill'?shadows[skill].color:'#ffe1aa'});if(releaseSettings().shake!==false&&!reducedMotion?.matches)screenShake=Math.max(screenShake,Math.min(3,(hp-e.hp)*.035));}return result;};
 expose=e=>{const before=e.exposed,result=exposeOriginal(e);if(!before&&e.exposed>0)feedback.emit('break',{x:e.x,y:e.y,color:'#c6fff0'});return result;};
 gainKill=(e,captured=false)=>{const wasDead=e.dead,result=killOriginal(e,captured);if(!wasDead&&e.dead&&!captured)feedback.emit('vanish',{x:e.x,y:e.y,boss:e.boss,color:shadows[e.type].color});return result;};
 const attackOriginal=basicAttack,dashOriginal=dash,castOriginal=executeSkill,flaskOriginal=useFlask,hitOriginal=hitPlayer,captureOriginal=captureFeedback,boonOriginal=chooseBoon,resetOriginal=reset;
 basicAttack=(...args)=>{const cd=state.attackCd,result=attackOriginal(...args);if(cd<=0&&state.attackCd>0&&state.weapon==='blade')feedback.emit('attack',{x:player.x,y:player.y,angle:player.angle,color:args[0]?'#ffe1a4':'#baf9e5',charged:!!args[0]});return result;};
 dash=(...args)=>{const cd=state.dashCd,result=dashOriginal(...args);if(cd<=0&&state.dashCd>0)feedback.emit('dash',{x:player.x,y:player.y,angle:Math.atan2(player.dy,player.dx),color:'#a7e6d1'});return result;};
 executeSkill=(id,a,cast)=>{const origin={x:player.x,y:player.y},result=castOriginal(id,a,cast);feedback.emit('cast',{...origin,angle:a,color:shadows[id].color,colors:[shadows[id].color],skill:id,tx:player.x,ty:player.y});return result;};
 useFlask=(...args)=>{const count=state.journey.flasks,result=flaskOriginal(...args);if(state.journey.flasks<count)feedback.emit('heal',{x:player.x,y:player.y,color:'#b3edd0'});return result;};
 hitPlayer=(...args)=>{const hp=player.hp,result=hitOriginal(...args);if(player.hp<hp)feedback.emit('hit');return result;};
 captureFeedback=e=>{captureOriginal(e);feedback.emit('capture',{x:e.x,y:e.y,color:shadows[e.type]?.color||'#c7e7dc'});};
 chooseBoon=id=>{const result=boonOriginal(id);if(result)feedback.emit('boon',{color:'#e7d29a'});return result;};
 reset=(...args)=>{feedback.clear();return resetOriginal(...args);};
 $('skill-button').onclick=()=>skill();$('dash-button').onclick=()=>dash();$('attack-button').onclick=()=>basicAttack();$('flask-button').onclick=()=>useFlask();
}
function initializeRelease(){
 applyReleaseSettings();
 $('settings-button').onclick=openSettings;$('intro-settings').onclick=openSettings;$('records-button').onclick=openRecords;$('achievements-button').onclick=openAchievements;$('achievements-nav').onclick=openAchievements;$('story-button').onclick=()=>showPrologue();$('credits-button').onclick=openCredits;
 $('sound-button').onclick=()=>{const enabled=!releaseSettings().sound;updateReleaseSettings({sound:enabled});window.HUNTER_AUDIO?.unlock();};
 document.addEventListener('pointerdown',()=>window.HUNTER_AUDIO?.unlock(),{passive:true});
 document.addEventListener('keydown',()=>window.HUNTER_AUDIO?.unlock(),{passive:true});
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&['settings','records','credits'].includes(state.phase)){e.preventDefault();closeReleasePanel();}});
 if(window.HUNTER_ART){
  const art=window.HUNTER_ART,oldProp=drawWorldProp;
  drawHumanoid=(x,y,a,color,scale,enemy)=>art.hunter(ctx,x,y,a,color,scale,enemy,enemy?clock:player.motionTime||0,enemy||player.moveBlend>.01,enemy?'blade':state.weapon,enemy?{}:player);
  drawWolf=e=>art.wolf(ctx,e,player,clock);
  drawWorldProp=p=>p.kind==='forest'?art.tree(ctx,p,richVisuals()?clock:0,player,enemies):oldProp(p);

 }
 const originalEnd=endRun;
 endRun=(win,ending='normal')=>{releaseLastOutcome=win&&ending!=='corrupt'?'victory':'defeat';originalEnd(win,ending);};
}
initializeRelease();
initializeExperience();
$('qmap-entry').onclick=()=>openTheme('cloud');
makeGround();reset();requestAnimationFrame(frame);
})();


