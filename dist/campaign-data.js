/* Five authored worlds, progression and browser-local expedition rewards. */
window.HUNTER_CAMPAIGN = (() => {
 'use strict';
 const worlds=[
  {id:'forest',number:1,name:'月蚀森林',subtitle:'第一盏灯，第一条归路',level:1,requires:[],color:'#bad4a0',symbol:'♧',pos:[100,220],theme:'forest',description:'沿月光小径追猎镜魔、守住梦灯、夺取幽灵。三枚印记将唤醒月狼。',feature:'双桥河道 · 夺影入门',enemies:['wolf','archer','mirror'],boss:'饥饿月狼',bossType:'wolf',bossMove:'lunge',loot:['leaf','dew','seed','fang']},
  {id:'forge',number:2,name:'熔火裂谷',subtitle:'在灰烬中，重新点燃炉心',level:3,requires:['forest'],color:'#efa777',symbol:'♨',pos:[310,100],theme:'ash',description:'猎杀熔炉守卫，保卫余火，穿过熔岩带关闭三座散热阀。小心祭司锁定的落火。',feature:'余烬地形 · 阀门探索',enemies:['cinder','fire','giant'],boss:'熔心巨像',bossType:'giant',bossMove:'meteor',loot:['coal','ember','ore','heart']},
  {id:'tide',number:3,name:'潮汐群岛',subtitle:'循着潮声，找回失落航标',level:3,requires:['forest'],color:'#8ddbd4',symbol:'≈',pos:[310,340],theme:'marsh',description:'走过浅滩连接的岛屿，点亮三座航标，捕获潮灵，清除潜伏的水泽梦魇。',feature:'浅滩减速 · 航标寻路',enemies:['stalker','ghost','swarm'],boss:'深潮幽魂',bossType:'ghost',bossMove:'venom',loot:['shell','pearl','kelp','tideglass']},
  {id:'ruins',number:4,name:'风蚀遗迹',subtitle:'当两条归路，在旧城交汇',level:5,requires:['forge','tide'],color:'#dec898',symbol:'◇',pos:[535,220],theme:'ruins',description:'按「日 → 月 → 星」复原古代机关，截住镜魔信使，从侧后方击破遗迹卫士。',feature:'顺序机关 · 重甲侧击',enemies:['sentinel','archer','mirror'],boss:'砂冠守卫',bossType:'shield',bossMove:'shieldBash',loot:['sand','rune','alloy','compass']},
  {id:'eclipse',number:5,name:'永夜王庭',subtitle:'穿越裂隙，把黎明带回来',level:7,requires:['ruins'],color:'#c5a5ee',symbol:'☾',pos:[750,220],theme:'lair',description:'清剿王庭精英，守护最后的梦灯，逐一净化裂隙。暮影君王会在第二阶段释放梦蚀。',feature:'混合精英 · 裂隙净化',enemies:['cinder','sentinel','stalker','mirror'],boss:'暮影君王',bossType:'mirror',bossMove:'shot',loot:['dust','star','prism','crown']}
 ];
 const qWorlds=(window.HUNTER_Q_THEME?.worlds||[]).map((w,i)=>({...w,number:i+1,pos:worlds[i].pos,theme:w.decor,campaign:'cloud',description:w.desc+' 完成任意三项活动即可挑战首领，其余活动可自由探索。',symbol:['♧','≈','♫','◇','☁'][i],bossType:'mirror',bossMove:'slam',loot:['sugar','sodapearl','honeydrop','rainbow']}));
 worlds.forEach(w=>w.campaign='main');
 const catalog=[...worlds,...qWorlds],themeOf=id=>qWorlds.some(w=>w.id===id)?'cloud':'main';
 const forTheme=theme=>theme==='cloud'?qWorlds:worlds;
 const items={};
 const names=[['月纹叶','澄净月露','萤光种子','月狼牙坠'],['温热煤晶','不熄余火','赤铜矿','熔心护符'],['潮纹贝','清潮珠','银叶海藻','潮汐琉璃'],['星纹砂','风语符','古代合金','归途罗盘'],['月蚀尘','破晓星屑','夜光棱晶','曙光冠冕']];
 const effects=[['heal',22,'purge',18,'focus',35],['focus',30,'heal',30,'purge',22],['heal',25,'purge',25,'focus',40],['focus',40,'purge',28,'heal',35],['purge',30,'heal',45,'focus',55]];
 const relics=[{attack:1.1,text:'普攻伤害 +10%'},{incoming:.9,text:'受到伤害 −10%'},{heal:10,text:'月露药剂额外恢复 10 生命'},{dash:.85,text:'闪避冷却 −15%'},{skill:1.15,text:'影技伤害 +15%'}];
 names.push(['星糖粒','汽水珠','蜜糖露','彩虹糖护符']);effects.push(['focus',25,'purge',20,'heal',25]);relics.push({dash:.9,text:'闪避冷却 −10%'});
 [...worlds,qWorlds[0]].filter(Boolean).forEach((w,i)=>w.loot.forEach((id,j)=>{const effect=j===3?relics[i]:{[effects[i][j*2]]:effects[i][j*2+1]};items[id]={id,name:names[i][j],world:w.id,rarity:j===3?'珍稀':j===0?'普通':'精良',kind:j===3?'relic':'supply',effect,description:j===3?effect.text:`${{heal:'恢复生命',purge:'净化梦蚀',focus:'获得专注'}[effects[i][j*2]]} ${effects[i][j*2+1]}`};}));
 const rides={moonbike:{id:'moonbike',name:'月轮单车',price:60,speed:1.45,description:'骑乘移动速度 +45%，保持地形碰撞。'},glideboard:{id:'glideboard',name:'浮光滑板',price:120,speed:1.75,description:'骑乘移动速度 +75%，浅沼仍会减速。'}};
 const shopGoods=[{id:'moonbike',ride:'moonbike',price:60},{id:'glideboard',ride:'glideboard',price:120},{id:'leaf',item:'leaf',price:10},{id:'dew',item:'dew',price:12},{id:'fang',item:'fang',price:50},{id:'heart',item:'heart',price:65},{id:'compass',item:'compass',price:65}];
 const qShopGoods=[...shopGoods.filter(g=>g.ride),{id:'sugar',item:'sugar',price:10},{id:'rainbow',item:'rainbow',price:50}];
 const goodsFor=p=>p.theme==='cloud'?qShopGoods:shopGoods;
 function garage(p){return p.transport||(p.transport={coins:0,owned:[],selected:null});}
 function validGarage(t){return record(t)&&Number.isInteger(t.coins)&&t.coins>=0&&t.coins<=999999&&Array.isArray(t.owned)&&t.owned.length<=2&&new Set(t.owned).size===t.owned.length&&t.owned.every(id=>Object.hasOwn(rides,id))&&(t.selected===null||t.owned.includes(t.selected));}
 function buy(p,id){const good=goodsFor(p).find(g=>g.id===id);if(!good||!valid(p))return {ok:false,reason:'商品不可用'};const t=garage(p);if(good.ride&&t.owned.includes(good.ride))return {ok:false,reason:'已经拥有这辆载具'};if(t.coins<good.price)return {ok:false,reason:'归途币不足'};if(good.item&&(p.inventory[good.item]||0)>=999999)return {ok:false,reason:'物品数量已满'};t.coins-=good.price;if(good.ride){t.owned.push(good.ride);t.selected=good.ride;}else p.inventory[good.item]=(p.inventory[good.item]||0)+1;return {ok:true,item:good.item||null,ride:good.ride||null};}
 const key='shadow-hunter-campaign-v1',keys={main:key,cloud:'shadow-hunter-q-campaign-v2'},ids=catalog.map(w=>w.id);
 const empty=(theme='main')=>({version:1,theme,cleared:[],inventory:{},equipped:null,claims:{},clears:{},transport:{coins:0,owned:[],selected:null}});
 const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 function valid(p){return record(p)&&(p.theme===undefined||['main','cloud'].includes(p.theme))&&(p.transport===undefined||validGarage(p.transport))&&p.version===1&&Array.isArray(p.cleared)&&p.cleared.length<=5&&new Set(p.cleared).size===p.cleared.length&&p.cleared.every(id=>ids.includes(id)&&themeOf(id)===(p.theme||'main'))&&p.cleared.every(id=>catalog.find(w=>w.id===id).requires.every(r=>p.cleared.includes(r)))&&record(p.inventory)&&Object.entries(p.inventory).every(([id,n])=>Object.hasOwn(items,id)&&themeOf(items[id].world)===(p.theme||'main')&&Number.isInteger(n)&&n>=0&&n<=999999)&& (p.equipped===null||Object.hasOwn(items,p.equipped)&&items[p.equipped].kind==='relic'&&p.inventory[p.equipped]>0)&&record(p.claims)&&Object.entries(p.claims).length<=100000&&Object.entries(p.claims).every(([id,v])=>/^[a-z0-9:-]{1,160}$/.test(id)&&(v===null||Object.hasOwn(items,v)))&&record(p.clears)&&Object.entries(p.clears).every(([id,n])=>ids.includes(id)&&themeOf(id)===(p.theme||'main')&&Number.isInteger(n)&&n>=0&&n<=999999);}
 const cache={};let storageOK=true;
 function bucket(theme){return cache[theme]||(cache[theme]={memory:empty(theme),unsaved:false,raw:null});}
 function read(storage,theme='main'){
  const b=bucket(theme);
  try{const raw=storage?.getItem(keys[theme])??null;if(b.unsaved&&raw===b.raw)return b.memory;b.raw=raw;b.unsaved=false;
   if(raw===null){storageOK=!!storage;return b.memory=empty(theme);}
   let p=raw.length<12000000?JSON.parse(raw):null;
   // Retain a verbatim backup of the previous mixed profile before separating it.
   if(theme==='main'&&p&&!p.theme&&(p.cleared?.includes('cloud')||['sugar','sodapearl','honeydrop','rainbow'].some(id=>p.inventory?.[id]))){
    if(!storage.getItem(key+'-legacy-backup'))storage.setItem(key+'-legacy-backup',raw);
    p.cleared=p.cleared.filter(id=>id!=='cloud');delete p.clears.cloud;
    for(const id of ['sugar','sodapearl','honeydrop','rainbow'])delete p.inventory[id];
    if(['sugar','sodapearl','honeydrop','rainbow'].includes(p.equipped))p.equipped=null;
    p.claims=Object.fromEntries(Object.entries(p.claims).filter(([token,item])=>!token.startsWith('cloud-')&&!['sugar','sodapearl','honeydrop','rainbow'].includes(item)));
   }
   if(!valid(p)||(p.theme||'main')!==theme){storageOK=false;return b.memory=empty(theme);}
   p.theme=theme;storageOK=true;return b.memory=p;
  }catch{storageOK=false;return b.memory;}
 }
 function save(storage,p,theme=p.theme||'main'){
  const b=bucket(theme);b.memory=p;
  try{if(!valid(p)||(p.theme||'main')!==theme)throw Error('Invalid campaign');const raw=JSON.stringify(p);storage.setItem(keys[theme],raw);b.raw=raw;b.unsaved=false;storageOK=true;return true;}
  catch{b.unsaved=true;storageOK=false;return false;}
 }
 function unlocked(p,id){const w=catalog.find(w=>w.id===id);return !!w&&themeOf(id)===(p.theme||'main')&&w.requires.every(r=>p.cleared.includes(r));}
 function roll(id,kind,random=Math.random){const w=catalog.find(w=>w.id===id);if(!w)return null;if(kind==='monster'&&random()>=.28||kind==='elite'&&random()>=.65)return null;const r=random();return w.loot[kind==='boss'?(r<.5?3:1+Math.floor(random()*2)):r<.60?0:r<.78?1:r<.94?2:3];}
 function reward(p,worldId,token,kind,random=Math.random){if(!catalog.some(w=>w.id===worldId)||themeOf(worldId)!==(p.theme||'main')||!['monster','elite','mission','boss','packed'].includes(kind))return {item:null,coins:0,duplicate:false};if(Object.hasOwn(p.claims,token))return {item:null,duplicate:true};const item=roll(worldId,kind,random)||(['monster','elite'].includes(kind)?catalog.find(w=>w.id===worldId)?.loot[0]||null:null);p.claims[token]=item;if(item)p.inventory[item]=Math.min(999999,(p.inventory[item]||0)+1);const coins=({monster:5,elite:12,mission:20,boss:40})[kind]||0;garage(p).coins=Math.min(999999,garage(p).coins+coins);return {item,coins,duplicate:false};}
 function complete(p,id,visit){if(!unlocked(p,id))return null;const token=visit+':clear';if(Object.hasOwn(p.claims,token))return null;const first=!p.cleared.includes(id);const result=reward(p,id,token,'boss');if(first){p.cleared.push(id);const relic=catalog.find(w=>w.id===id).loot[3];if(result.item!==relic)p.inventory[relic]=(p.inventory[relic]||0)+1;result.guaranteed=relic;}p.clears[id]=(p.clears[id]||0)+1;return result;}
 const layouts={
  forge:{points:[[850,540],[2090,700],[2920,1700],[3060,410]],kinds:['hunt','defend','survey'],names:['碎炉哨站','余火熔炉','散热回廊','熔心王座'],paths:[[[520,2010],[600,1300],[850,540],[2090,700],[3060,410]],[[600,1300],[1800,1800],[2920,1700],[3060,410]]],walls:[{x:1280,y:0,w:170,h:1050},{x:1280,y:1450,w:170,h:500},{x:2270,y:950,w:850,h:70}],terrain:[{x:1040,y:1150,rx:220,ry:120,kind:'embers'},{x:2280,y:1600,rx:190,ry:100,kind:'embers'},{x:2680,y:510,rx:120,ry:170,kind:'embers'}]},
  tide:{points:[[700,650],[2040,1610],[2830,700],[3120,1870]],kinds:['survey','capture','hunt'],names:['迷航灯塔','潮灵之泉','沉船湾','深潮祭台'],paths:[[[520,2010],[700,650],[1720,650],[2040,1610],[3120,1870]],[[1720,650],[2830,700],[3120,1870]]],walls:[{x:1030,y:1100,w:550,h:400},{x:2400,y:0,w:90,h:350},{x:2420,y:1050,w:80,h:340}],terrain:[{x:1720,y:650,rx:350,ry:140,kind:'mud'},{x:2610,y:1750,rx:300,ry:130,kind:'mud'},{x:700,y:1400,rx:150,ry:250,kind:'mud'}]},
  ruins:{points:[[780,550],[1840,650],[2870,1610],[3100,430]],kinds:['sequence','chase','hunt'],names:['日月星仪','镜廊驿站','守卫长阶','砂冠之门'],paths:[[[520,2010],[780,550],[1840,650],[3100,430]],[[520,2010],[1850,1970],[2870,1610],[3100,430]]],walls:[{x:1100,y:950,w:1200,h:70},{x:1100,y:950,w:70,h:600},{x:2230,y:950,w:70,h:600},{x:2640,y:1000,w:700,h:60}],terrain:[]},
  eclipse:{points:[[870,700],[2110,1610],[2100,500],[3140,1100]],kinds:['hunt','defend','purify'],names:['黑曜卫庭','末夜灯台','三相裂隙','无光王座'],paths:[[[520,2010],[870,700],[2100,500],[3140,1100],[2110,1610],[520,2010]],[[870,700],[2110,1610]]],walls:[{x:2600,y:0,w:100,h:600},{x:2600,y:1600,w:100,h:800},{x:1250,y:1000,w:420,h:80}],terrain:[{x:1510,y:1670,rx:150,ry:100,kind:'embers'},{x:2510,y:960,rx:160,ry:110,kind:'mud'}]}
 };
 const hints={hunt:'清剿本处标记敌群 · 收割或夺影均计入',defend:'守护梦灯 36 秒 · 抵御四波敌人',capture:'指定夺影 · 击破幽灵并长按 E',chase:'追上镜魔 · 45 秒内收割或夺影',survey:'探索三处光标 · 靠近后按 F 激活',sequence:'依照日 → 月 → 星顺序，靠近石碑按 F',purify:'击败裂隙守卫 · 靠近三处裂隙按 F 净化'};
 const palettes={forge:['#402c29','#6c4330','#3b2526','#e9a16c'],tide:['#173d43','#317782','#214e57','#a4dfd3'],ruins:['#444038','#71654d','#343944','#dfc990'],eclipse:['#29263d','#4e3d66','#202136','#c3a3e6']};
 function map(id){if(themeOf(id)==='cloud')return window.HUNTER_Q_THEME.map(id);if(id==='forest')return window.HUNTER_WORLD;const w=catalog.find(w=>w.id===id),l=layouts[id];if(!w||!l)throw Error('Unknown world');
  const p=palettes[id],width=3600,height=2400,bridges=[];
  const sites=[{id:'camp',name:'界门营地',kind:'camp',x:520,y:2010,symbol:'✧',color:w.color,hint:'保存、休整、使用物品或前往其他已解锁世界'},...l.points.map(([x,y],i)=>({id:['chase','defend','capture','boss'][i],x,y,kind:i===3?'boss':l.kinds[i],name:l.names[i],symbol:i===3?'☾':['◇','✦','◈'][i],color:w.color,hint:i===3?'取得三枚印记后挑战'+w.boss:hints[l.kinds[i]]}))];
  const regions=[{id:'forest',name:w.name+' · 边境',x:0,y:0,w:1200,h:2400},{id:'ash',name:'上层回廊',x:1200,y:0,w:1200,h:1200},{id:'marsh',name:'下层荒野',x:1200,y:1200,w:1200,h:1200},{id:'ruins',name:'遗落腹地',x:2400,y:1200,w:1200,h:1200},{id:'lair',name:l.names[3],x:2400,y:0,w:1200,h:1200}].map((r,i)=>({...r,color:i%2?p[2]:p[0],light:p[1],ink:p[3],hint:w.feature}));
  const walls=l.walls.map(v=>({...v,kind:'wall'})),terrain=l.terrain,paths=l.paths;
  const regionAt=(x,y)=>regions.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)||regions[0];
  const terrainAt=(x,y)=>terrain.find(t=>((x-t.x)/t.rx)**2+((y-t.y)/t.ry)**2<1);
  function onPath(x,y,pad=100){return paths.some(line=>line.some(([bx,by],i)=>{if(!i)return false;const [ax,ay]=line[i-1],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-ax-t*dx,y-ay-t*dy)<pad;}));}
  const packPoints=[[850,1250],[500,960],[1800,360],[1810,2050],[2370,2100],[3290,2200],[3350,800],[3400,1490]];
  const packs=packPoints.map(([x,y],i)=>({x,y,types:[w.enemies[i%w.enemies.length],w.enemies[(i+1)%w.enemies.length]]}));
  const discoveries=window.HUNTER_EXPEDITION.discoveries.map((d,i)=>({...d,x:[650,1800,2370,3290][i],y:[1530,2050,2100,2200][i],name:[w.name+'补给箱','旅人行囊','遗落药匣','封印秘藏'][i],hint:i?'清除附近守卫后领取补给':'夺取箱旁斥候的影子，打开补给箱'}));
  const blocked=(x,y,pad)=>walls.some(r=>x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad);
  function create(){let seed=w.number*971;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const props=[],rocks=[];for(let i=0;i<650;i++){const x=70+random()*3460,y=70+random()*2260;if(onPath(x,y,145)||sites.some(s=>Math.hypot(x-s.x,y-s.y)<440)||discoveries.some(s=>Math.hypot(x-s.x,y-s.y)<180)||packs.some(s=>Math.hypot(x-s.x,y-s.y)<160)||blocked(x,y,90))continue;props.push({x,y,size:28+random()*40,tone:random(),kind:w.theme});if(i%6===0)rocks.push({x,y,r:22});}return {props,rocks};}
  function drawGround(g){g.fillStyle=p[0];g.fillRect(0,0,width,height);for(const r of regions){g.fillStyle=r.color;g.fillRect(r.x,r.y,r.w,r.h);}for(let i=0;i<4000;i++){const x=(i*173+w.number*19)%width,y=(i*317)%height;g.fillStyle=i%3?p[1]+'30':p[3]+'10';g.fillRect(x,y,3+i%13,2);}g.lineJoin='round';g.lineCap='round';for(const line of paths){g.beginPath();line.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.lineWidth=id==='tide'?155:105;g.strokeStyle=p[1];g.stroke();g.lineWidth=2;g.strokeStyle=p[3]+'45';g.stroke();}for(const t of terrain){g.fillStyle=t.kind==='embers'?'#d66b3740':'#8dcbd240';g.beginPath();g.ellipse(t.x,t.y,t.rx,t.ry,0,0,Math.PI*2);g.fill();g.strokeStyle=t.kind==='embers'?'#ed9a6280':'#a3dae080';g.lineWidth=3;g.stroke();}for(const r of walls){g.fillStyle='#0c172acc';g.fillRect(r.x+12,r.y+16,r.w,r.h);g.fillStyle=p[1];g.fillRect(r.x,r.y,r.w,r.h);g.strokeStyle=p[3]+'66';g.lineWidth=4;g.strokeRect(r.x,r.y,r.w,r.h);}for(const s of sites){g.strokeStyle=s.color+'55';g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,115,0,Math.PI*2);g.stroke();}}
  return {width,height,sites,regions,bridges,walls,terrain,paths,packs,discoveries,variants:window.HUNTER_WORLD.variants,regionAt,terrainAt,onPath,create,drawGround};
 }
 return {worlds,qWorlds,catalog,forTheme,themeOf,keys,items,rides,shopGoods,goodsFor,garage,buy,key,empty,valid,read,save,unlocked,roll,reward,complete,map,get storageOK(){return storageOK;}};
})();
