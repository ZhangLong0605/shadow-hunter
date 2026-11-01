/* Fixed discoveries and a versioned, validated browser-local camp checkpoint. */
window.HUNTER_EXPEDITION = (() => {
  const key='shadow-hunter-camp-v1',keys={main:key,cloud:'shadow-hunter-q-camp-v2'};
  const discoveries=[
    {id:'trail-cache',name:'斥候补给箱',x:650,y:1530,kind:'discovery',symbol:'▣',color:'#d8d7a2',reward:'恢复 20 生命 · 获得 30 专注',hint:'营地北方的短遭遇：击破斥候，长按 E 夺影后领取补给',heal:20,focus:30,purge:0},
    {id:'ash-cache',name:'灰烬秘藏',x:2330,y:1080,kind:'discovery',symbol:'▣',color:'#e8b778',reward:'净化 20 梦蚀 · 营地休整次数 +1',hint:'击败附近的灰烬守卫，打开废树下的秘藏',heal:0,focus:0,purge:20,rest:1},
    {id:'marsh-cache',name:'芦苇药匣',x:2150,y:2100,kind:'discovery',symbol:'✚',color:'#a1d4ba',reward:'恢复 35 生命 · 获得 25 专注',hint:'沼泽深处的药匣，附近有潜伏者与幽灵',heal:35,focus:25,purge:0},
    {id:'relic-cache',name:'守卫遗物',x:3300,y:2070,kind:'discovery',symbol:'◇',color:'#b4cde3',reward:'当前主动影升 1 级；已满级则净化 25 梦蚀',hint:'击败遗迹重甲守卫与巨人，领取主动影强化',upgrade:true,heal:0,focus:0,purge:0}
  ];
  const ids=['wolf','fire','shield','giant','ghost','archer','mirror','swarm'];
  const variants={cinder:'fire',stalker:'ghost',sentinel:'shield'};
  const maxLength=200000;
  const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
  const list=(v,allowed,max)=>Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length&&Array.from(v).every(x=>allowed.includes(x));
  function valid(s){
    if(!record(s)||s.version!==1||!num(s.savedAt,1,1e15)||!record(s.checkpoint)||!record(s.world))return false;
    const c=s.checkpoint,r=c.run,p=c.player,w=s.world,cloud=window.HUNTER_CAMPAIGN?.themeOf(w.worldId)==='cloud';
    const map=cloud?window.HUNTER_Q_THEME.map(w.worldId):null;
    if(cloud&&!map)return false;
    const missionIds=cloud?map.sites.filter(s=>!['camp','boss'].includes(s.kind)).map(s=>s.id):['chase','defend','capture'];
    const regionIds=cloud?map.regions.map(r=>r.id):['forest','ash','marsh','ruins','lair'];
    const discoveryIds=cloud?map.charms.map(c=>c.id):discoveries.map(d=>d.id);
    const variantTypes=cloud?Object.fromEntries(Object.entries(map.variants).map(([id,v])=>[id,v.shadow])):variants;
    if(w.worldId!==undefined&&!window.HUNTER_CAMPAIGN?.catalog.some(v=>v.id===w.worldId))return false;
    if(w.visit!==undefined&&(typeof w.visit!=='string'||!/^[-a-z0-9]{1,80}$/.test(w.visit)))return false;
    if(!record(r)||!record(p)||!record(r.levels)||!record(r.xp)||!list(r.owned,ids,8)||!Array.isArray(r.slots)||![1,3].includes(r.slots.length)||!Array.from(r.slots).every(x=>r.owned.includes(x)))return false;
    if(!ids.every(id=>Number.isInteger(r.levels?.[id])&&num(r.levels[id],0,2)&&Number.isInteger(r.xp?.[id])&&num(r.xp[id],0,1e6)))return false;
    if(!['blade','bow'].includes(r.weapon)||typeof r.locked!=='boolean'||r.stored!==null&&!ids.includes(r.stored))return false;
    if(!['time','kills','captures','hits'].every(k=>num(r[k],0,1e9))||!num(r.corruption,0,100)||!num(r.nightmare,0,9))return false;
    if(!num(p.hp,0,100)||p.hp===0||!num(p.focus,0,100)||!num(p.x,390,650)||!num(p.y,1880,2140)||Math.hypot(p.x-520,p.y-2010)>131)return false;
    if(!list(c.completed,missionIds,missionIds.length)||!Number.isInteger(c.restCharges)||!num(c.restCharges,0,20))return false;
    if(!list(w.visited,regionIds,5)||!list(w.claimed,discoveryIds,discoveryIds.length)||!list(w.seen,Object.keys(variantTypes),Object.keys(variantTypes).length)||typeof w.trailCaptured!=='boolean')return false;
    if(!['shop','camp',...missionIds,'boss',...discoveryIds].includes(w.track))return false;
    if(!Array.isArray(c.enemies)||c.enemies.length>120)return false;
    const enemyIds=new Set();
    for(const e of c.enemies){
      if(!record(e)||typeof e.id!=='string'||!/^[a-z0-9-]{1,64}$/.test(e.id)||enemyIds.has(e.id)||!ids.includes(e.type)||e.mission||e.boss)return false;
      enemyIds.add(e.id);
      if(!num(e.x,0,3600)||!num(e.y,0,2400)||!num(e.hp,-10000,5000)||!num(e.maxHp,1,5000)||!num(e.pressure,-10000,5000)||!num(e.maxPressure,1,5000)||!num(e.r,1,60))return false;
      if(!record(e.home)||!num(e.home.x,0,3600)||!num(e.home.y,0,2400)||typeof e.dead!=='boolean'||typeof e.elite!=='boolean')return false;
      if(e.variant!==null&&(typeof e.variant!=='string'||!Object.prototype.hasOwnProperty.call(variantTypes,e.variant)||variantTypes[e.variant]!==e.type))return false;
      if(e.scout!==undefined&&(typeof e.scout!=='boolean'||e.scout&&(e.type!=='archer'||e.variant!==null)))return false;
      if(!['cd','telegraph','exposed','burn','bleed','hit','slow','dash','dx','dy','trail','facing','patrol'].every(k=>num(e[k],-100,1000)))return false;
      // Expired dead enemies can retain a negative timer. A living scout cannot:
      // it would be protected from attacks while no longer eligible for capture.
      if(!e.dead&&e.exposed<0)return false;
    }
    return true;
  }
  function read(storage,theme='main'){
    let raw;
    try{raw=storage.getItem(keys[theme]);}catch{return {status:'unavailable'};}
    if(raw===null||raw===undefined)return {status:'empty'};
    if(typeof raw!=='string'||!raw.length||raw.length>maxLength)return {status:'invalid'};
    try{const data=JSON.parse(raw);if(data?.world?.worldId==='cloud'){if(!storage.getItem(key+'-legacy-backup'))storage.setItem(key+'-legacy-backup',raw);return {status:'legacy'};}return valid(data)&&(window.HUNTER_CAMPAIGN?.themeOf(data.world.worldId)||'main')===theme?{status:'ready',data}:{status:'invalid'};}catch{return {status:'invalid'};}
  }
  function write(storage,data,theme=window.HUNTER_CAMPAIGN?.themeOf(data?.world?.worldId)||'main'){
    try{
      if(!valid(data)||(window.HUNTER_CAMPAIGN?.themeOf(data.world.worldId)||'main')!==theme)return false;
      const raw=JSON.stringify(data);
      // A successful write must remain readable after JSON conversion and the
      // same size limit; do not replace the last good checkpoint otherwise.
      if(raw.length>maxLength||!valid(JSON.parse(raw)))return false;
      const previous=storage.getItem(keys[theme]);let legacy=false;try{legacy=JSON.parse(previous)?.world?.worldId==='cloud';}catch{}
      if(legacy&&!storage.getItem(key+'-legacy-backup'))storage.setItem(key+'-legacy-backup',previous);
      storage.setItem(keys[theme],raw);return true;
    }catch{return false;}
  }
  return {key,keys,discoveries,valid,read,write};
})();
