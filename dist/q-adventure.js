/* Sweetdream activities. Simulation advances only through the game's playing tick. */
'use strict';
window.HUNTER_Q=(()=>{
 const TAU=Math.PI*2,types=['herd','fish','rhythm','puzzle','gather','escort','race','dig','water','bubble'];
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const colors=['#e78ca8','#66b7d9','#a28bd4'];
 const names={herd:'赶羊归圈',fish:'星星钓鱼',rhythm:'节奏采摘',puzzle:'镜面拼图'};
 Object.assign(names,{gather:'采集果子',escort:'护送小鸡',race:'糖果赛跑',dig:'挖掘宝藏',water:'浇灌花圃',bubble:'戳泡泡'});
 const instructions={
  herd:'靠近团子羊，它就会跟随你。带它走进中央羊圈，五只归位即可取得印记。沿浅色小路慢慢走，不需要攻击。',
  fish:'三个浮标各有两条星鱼。靠近浮标按 F 抛竿，看到“咬钩啦”后再按 F 收线。提前或超时只会空竿，可以立即重试。',
  rhythm:'六朵糖花依次点亮。跟随数字移向下一朵，等收缩光圈与花心重合时站在花上。连续六拍成功即完成；失拍会从第一朵重新开始，不扣血。',
  puzzle:'用 WASD、方向键或屏幕按钮移动小伙伴，把三颗糖果推到同字母的镜框。Z 撤销，或随时重置。退出窗口保留当前拼图，靠近花园按 F 继续。'
 };
 function puzzle(){return {w:7,h:6,player:{x:1,y:1},boxes:[{x:2,y:2},{x:3,y:2},{x:4,y:2}],goals:[{x:2,y:4},{x:3,y:4},{x:4,y:4}],moves:0,history:[]};}
 Object.assign(instructions,{
  gather:'寻找六颗糖果果，走近后按 F 采集。顺着方向标就能找到剩余的果子。',
  escort:'先靠近三只小鸡，让它们跟随你，再慢慢带回鸡窝。附近的泡泡会把小鸡吓回起点，可以先戳破泡泡再护送。',
  race:'从起点出发，依次穿过五面编号旗，再回到终点。小兔会和你一起跑，30 秒内完成即可。超时后回到起点按 F 重试。',
  dig:'找到五个土堆，每个靠近后按 F 挖两次，挖出宝藏罐。',
  water:'找到八朵干渴的花，靠近后按 F 浇水；全部重新开花即可完成。',
  bubble:'用鼠标左键或 J 戳破六只标记泡泡，收集它们的糖屑。Q 技能同样有效，被碰到只会短暂减速。'
 });
 const totals={herd:5,fish:6,rhythm:6,puzzle:3,gather:6,escort:3,race:6,dig:5,water:8,bubble:6};
 function finished(o){return o.count>=totals[o.kind];}
 function create(site,free=(x,y)=>({x,y})){
  const o={kind:site.kind,site,status:'active',elapsed:0,count:0,message:'',messageTime:0};
  if(site.kind==='herd')o.sheep=[[-230,-120],[180,-190],[-200,180],[260,170],[0,-280]].map(([x,y],i)=>({x:site.x+x,y:site.y+y,r:15,following:false,home:false,id:i}));
  if(site.kind==='fish'){o.spots=[[-150,70],[110,100],[0,-130]].map(([x,y])=>({x:site.x+x,y:site.y+y,caught:0}));o.cast=null;}
  if(site.kind==='rhythm'){o.beat=1.8;o.cycle=0;o.elapsed=0;o.scored=false;o.pads=Array.from({length:6},(_,i)=>({x:site.x+Math.cos(-Math.PI/2+i*TAU/6)*115,y:site.y+Math.sin(-Math.PI/2+i*TAU/6)*115}));}
  if(site.kind==='puzzle')o.board=puzzle();
  if(['gather','dig','water','bubble'].includes(site.kind))o.nodes=Array.from({length:totals[site.kind]},(_,i)=>{const a=i*TAU/totals[site.kind];return {...free(site.x+Math.cos(a)*175,site.y+Math.sin(a)*175,24),done:false,hits:0};});
  if(site.kind==='escort'){o.home={...free(site.x+180,site.y+100,24)};o.chicks=Array.from({length:3},(_,i)=>({...free(site.x-170,site.y-50+i*55,18),r:14,following:false,home:false,id:i}));o.origins=o.chicks.map(c=>({x:c.x,y:c.y}));}
  if(site.kind==='race'){o.flags=Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*TAU/5;return {...free(site.x+Math.cos(a)*200,site.y+Math.sin(a)*200,24)};});o.flags.push({x:site.x,y:site.y});o.running=false;o.rival={x:site.x,y:site.y,r:14,index:0};}
  for(const key of ['sheep','spots','pads'])if(o[key])o[key].forEach(n=>Object.assign(n,free(n.x,n.y,24)));
  return o;
 }
 function say(o,message){o.message=message;o.messageTime=2.4;}
 function step(o,dt,api){
  if(!o||!types.includes(o.kind)||o.status!=='active')return;
  o.elapsed+=dt;o.messageTime=Math.max(0,o.messageTime-dt);
  if(o.kind==='escort'){
   for(const c of o.chicks){if(c.home)continue;
    if((api.enemies||[]).some(e=>!e.dead&&distance(e,c)<85)){Object.assign(c,o.origins[c.id]);c.following=false;say(o,'小鸡受惊了，先戳破附近的泡泡再接它。');continue;}
    if(distance(c,api.player)<120)c.following=true;
    if(c.following&&distance(c,api.player)>35){const a=Math.atan2(api.player.y-c.y,api.player.x-c.x);api.move(c,Math.cos(a)*155*dt,Math.sin(a)*155*dt);}
    if(c.following&&distance(c,o.home)<72){c.home=true;o.count++;}
   }
   if(finished(o))api.complete();return;
  }
  if(o.kind==='race'){
   if(!o.running&&!o.failed&&distance(api.player,o.site)<95){o.running=true;o.started=o.elapsed;}
   if(o.running){
    if(o.elapsed-o.started>30){o.running=false;o.failed=true;say(o,'超时啦！回到起点按 F 再来一次。');return;}
    const t=o.flags[Math.min(o.count,5)];if(distance(api.player,t)<70){o.count++;api.tone?.(660,.1);if(finished(o)){api.complete();return;}}
    const r=o.rival,n=o.flags[Math.min(r.index,5)];if(distance(r,n)<30)r.index=Math.min(5,r.index+1);else{const a=Math.atan2(n.y-r.y,n.x-r.x);api.move(r,Math.cos(a)*85*dt,Math.sin(a)*85*dt);}
   }return;
  }
  if(o.kind==='herd'){
   for(const s of o.sheep){if(s.home)continue;if(distance(s,api.player)<135)s.following=true;
    if(s.following&&distance(s,api.player)>42){const a=Math.atan2(api.player.y-s.y,api.player.x-s.x),speed=Math.min(200,(distance(s,api.player)-38)*3);api.move(s,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt);}
    if(s.following&&distance(s,o.site)<85){s.home=true;s.x=o.site.x-52+s.id*26;s.y=o.site.y+22;o.count++;say(o,`团子羊回家啦 · ${o.count} / 5`);api.tone?.(660+o.count*50,.12);}
   }
   if(o.count===5)api.complete();
  }else if(o.kind==='fish'&&o.cast){
   const c=o.cast;c.time+=dt;
   if(distance(api.player,o.spots[c.spot])>115){o.cast=null;say(o,'离开浮标，已收起鱼竿。');}
   else if(c.time>c.wait+1.6){o.cast=null;say(o,'星鱼游走了，再按 F 抛竿。');}
   else if(c.time>=c.wait&&!c.bitten){c.bitten=true;api.tone?.(880,.2);}
  }else if(o.kind==='rhythm'){
   const cycle=Math.floor(o.elapsed/o.beat),phase=o.elapsed%o.beat;
   if(cycle!==o.cycle){if(!o.scored){o.count=0;say(o,'没关系，从第 1 朵重新跟拍。');}o.cycle=cycle;o.scored=false;}
   if(!o.scored&&phase>=1.15&&phase<=1.75&&distance(api.player,o.pads[o.count])<43){o.scored=true;o.count++;api.tone?.(440+o.count*65,.14);say(o,`踩中节拍！${o.count} / 6`);if(o.count===6)api.complete();}
  }
 }
 function interact(o,player,random=Math.random){
  if(['gather','dig','water'].includes(o.kind)){
   const n=o.nodes.filter(n=>!n.done&&distance(n,player)<90).sort((a,b)=>distance(a,player)-distance(b,player))[0];
   if(!n){say(o,'跟随方向标，靠近目标后按 F。');return true;}
   n.hits++;if(o.kind!=='dig'||n.hits>=2){n.done=true;o.count++;say(o,`${names[o.kind]} · ${o.count} / ${totals[o.kind]}`);}else say(o,'已经松土，再按 F 挖出宝藏罐。');return true;
  }
  if(o.kind==='race'){if(o.failed&&distance(player,o.site)<100){o.failed=false;o.count=0;o.running=false;o.rival={x:o.site.x,y:o.site.y,r:14,index:0};say(o,'准备好，再跑一次！');}else say(o,'超时后回起点按 F 重试。');return true;}
  if(o.kind!=='fish')return false;
  if(o.cast){const c=o.cast;if(c.time>=c.wait&&c.time<=c.wait+1.6){o.spots[c.spot].caught++;o.count++;say(o,`钓到星星鱼！${o.count} / 6`);}else say(o,'收线早了一点，再试一次。');o.cast=null;return true;}
  const i=o.spots.findIndex(s=>s.caught<2&&distance(s,player)<95);
  if(i<0){say(o,'靠近还有星鱼的浮标，再按 F。');return true;}
  o.cast={spot:i,time:0,wait:1.7+random()*1.3,bitten:false};say(o,'浮标轻晃……等星鱼咬钩。');return true;
 }
 function movePuzzle(o,dx,dy){
  const b=o.board;if(!b||Math.abs(dx)+Math.abs(dy)!==1)return false;
  const x=b.player.x+dx,y=b.player.y+dy,free=(x,y)=>x>0&&y>0&&x<b.w-1&&y<b.h-1;
  if(!free(x,y))return false;
  const i=b.boxes.findIndex(v=>v.x===x&&v.y===y);
  if(i>=0&&(!free(x+dx,y+dy)||b.boxes.some(v=>v.x===x+dx&&v.y===y+dy)))return false;
  b.history.push({player:{...b.player},boxes:b.boxes.map(v=>({...v})),moves:b.moves});if(b.history.length>500)b.history.shift();
  if(i>=0){b.boxes[i].x+=dx;b.boxes[i].y+=dy;}b.player={x,y};b.moves++;
  o.count=b.boxes.filter((v,i)=>v.x===b.goals[i].x&&v.y===b.goals[i].y).length;return true;
 }
 function undo(o){const b=o.board,h=b.history.pop();if(!h)return;Object.assign(b,h);o.count=b.boxes.filter((v,i)=>v.x===b.goals[i].x&&v.y===b.goals[i].y).length;}
 function resetPuzzle(o){o.board=puzzle();o.count=0;}
 function target(o,player){
  if(!o||!types.includes(o.kind))return null;
  let t=o.site,name=names[o.kind];
  if(o.kind==='herd'){const following=o.sheep.some(s=>!s.home&&s.following);t=following?o.site:o.sheep.filter(s=>!s.home).sort((a,b)=>distance(a,player)-distance(b,player))[0]||o.site;name=following?'带团子羊回羊圈':'寻找团子羊';}
  if(o.kind==='fish'){t=o.cast?o.spots[o.cast.spot]:o.spots.filter(s=>s.caught<2).sort((a,b)=>distance(a,player)-distance(b,player))[0]||o.site;name='星鱼浮标 · F 抛竿 / 收线';}
  if(o.kind==='rhythm'){t=o.pads[Math.min(o.count,5)];name=`糖花 ${o.count+1} · 等光圈重合`;}
  if(o.nodes){t=o.nodes.filter(n=>!n.done).sort((a,b)=>distance(a,player)-distance(b,player))[0]||o.site;name=o.kind==='bubble'?'戳破标记泡泡':names[o.kind]+' · 靠近按 F';}
  if(o.kind==='escort'){t=o.chicks.some(c=>c.following&&!c.home)?o.home:o.chicks.find(c=>!c.home)||o.home;name=t===o.home?'带小鸡回鸡窝':'靠近小鸡';}
  if(o.kind==='race'){t=o.failed?o.site:o.flags[Math.min(o.count,5)];name=o.failed?'回起点 · F 重试':`赛道旗 ${Math.min(6,o.count+1)} / 6`;}
  return {...t,name,color:o.site.color};
 }
 function status(o){
  if(!o)return '';
  if(o.kind==='fish'&&o.cast?.time>=o.cast?.wait)return '咬钩啦！现在按 F 收线';
  if(o.messageTime>0)return o.message;
  if(o.kind==='race')return o.failed?'超时啦 · 回到起点按 F 重试':`赛道 ${o.count} / 6 · 剩余 ${Math.max(0,30-(o.running?o.elapsed-o.started:0)).toFixed(1)} 秒`;
  if(['gather','escort','dig','water','bubble'].includes(o.kind))return `${names[o.kind]} ${o.count} / ${totals[o.kind]} · ${o.kind==='bubble'?'左键 / J 戳破标记泡泡':o.kind==='escort'?'靠近小鸡，带回鸡窝':'靠近目标按 F'}`;
  if(o.kind==='herd')return `归圈 ${o.count} / 5 · 靠近团子羊，再带回中央羊圈`;
  if(o.kind==='fish')return o.cast?(o.cast.time>=o.cast.wait?'咬钩啦！现在按 F 收线':'等待咬钩……不要提前收线'):`星鱼 ${o.count} / 6 · 每个浮标两条，靠近按 F`;
  if(o.kind==='rhythm')return `连拍 ${o.count} / 6 · 前往 ${Math.min(6,o.count+1)} 号糖花，光圈重合时站在花上`;
  return `彩虹镜框 ${o.count} / 3 · 靠近花园按 F 继续拼图`;
 }
 // Use the authored ObjectDesign PNGs; geometric fallbacks remain visible during loading.
 function asset(g,id,x,y,size){return window.HUNTER_Q_ART?.draw(g,id,x,y,size)||false;}
 const landmarkArt={camp:'camp-tent',herd:'sheep',fish:'fishing-rod',rhythm:'honey-windmill',puzzle:'mirror-frame',gather:'candy-tree',escort:'chicken-coop',race:'finish-flag',dig:'shovel',water:'watering-can',bubble:'bubble-mob',boss:'nightmare-marshmallow'};
 function oval(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
 function poly(g,pts,color,stroke='#ffffff'){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle=stroke;g.lineWidth=3;g.stroke();}
 function label(g,x,y,text,size=14){g.font=`600 ${size}px "Microsoft YaHei",sans-serif`;g.textAlign='center';g.lineWidth=4;g.strokeStyle='#fffdf3';g.strokeText(text,x,y);g.fillStyle='#534337';g.fillText(text,x,y);}
 function star(g,x,y,r,color){poly(g,Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,s=i%2?r*.45:r;return [x+Math.cos(a)*s,y+Math.sin(a)*s];}),color);}
 function face(g,x,y,s=1){oval(g,x-9*s,y,2.7*s,4*s,'#514a63');oval(g,x+9*s,y,2.7*s,4*s,'#514a63');g.strokeStyle='#514a63';g.lineWidth=2;g.beginPath();g.arc(x,y+5*s,5*s,0,Math.PI);g.stroke();oval(g,x-16*s,y+6*s,5*s,2.5*s,'#f1aac2');oval(g,x+16*s,y+6*s,5*s,2.5*s,'#f1aac2');}
 function drawProp(g,p){
  const decor={meadow:'candy-tree',coast:'float-bobber',honey:'honey-windmill',mirror:'mirror-frame',cloud:'sugar-flower'};
  if(asset(g,decor[p.kind]||'candy-tree',p.x,p.y,p.size*2.2))return;
  const {x,y,size:s,kind}=p;g.save();g.translate(x,y);oval(g,0,9,s*.7,s*.2,'#728d6130');
  if(kind==='mirror'){poly(g,[[-s*.35,0],[-s*.5,-s*.65],[0,-s*1.2],[s*.38,-s*.7],[s*.2,0]],'#d2b6ed');poly(g,[[0,-s*1.2],[s*.38,-s*.7],[0,-s*.35]],'#faf2ff');}
  else if(kind==='throne'){for(const [a,b,c] of [[-.4,-.2,.45],[0,-.5,.55],[.45,-.2,.4]])oval(g,a*s,b*s,c*s,c*s*.7,'#fffaff');}
  else if(kind==='honey'){g.fillStyle='#d8b080';g.fillRect(-4,-s,8,s);oval(g,0,-s*.8,s*.5,s*.6,'#ffcf75');for(let i=0;i<4;i++){g.strokeStyle='#e3ac4e';g.lineWidth=3;g.beginPath();g.ellipse(0,-s*.45-i*s*.2,s*.4,5,0,0,TAU);g.stroke();}oval(g,0,-s*.4,7,8,'#a17640');}
  else{if(kind==='lagoon'){oval(g,0,0,s*.85,s*.3,'#83c9b2');oval(g,0,-3,s*.7,s*.23,'#b3e8cc');}g.fillStyle='#c4a679';g.fillRect(-4,-s,8,s);for(const [a,b,c] of [[-.4,-.9,.42],[0,-1.2,.52],[.4,-.9,.4]])oval(g,a*s,b*s,c*s,c*s,'#8ccf91');oval(g,-s*.15,-s*1.4,s*.22,s*.15,'#bbeaa9');}
  g.restore();
 }
 function drawLandmark(g,s,done,active,near,time){
  if(asset(g,landmarkArt[s.kind],s.x,s.y+18,170)){
   if(s.kind==='camp'){asset(g,'camp-fire',s.x+105,s.y+16,90);asset(g,'camp-lantern',s.x-105,s.y+12,75);}
   label(g,s.x,s.y-142,(done?'✓ ':'')+s.name,16);
   label(g,s.x,s.y+55,done?'活动已完成':active?'活动进行中':near?'按 F 互动':'沿小路前往',12);return;
  }
  g.save();oval(g,s.x,s.y,105,70,'#ffffff50');g.strokeStyle=s.color;g.lineWidth=4;g.beginPath();g.ellipse(s.x,s.y,105,70,0,0,TAU);g.stroke();
  if(s.kind==='camp'){poly(g,[[s.x-65,s.y],[s.x,s.y-105],[s.x+65,s.y]],'#ffbdd2');poly(g,[[s.x-28,s.y],[s.x,s.y-63],[s.x+28,s.y]],'#fff8ed');}
  if(s.kind==='herd'){for(let i=0;i<12;i++){const a=i*TAU/12;g.fillStyle='#e9c794';g.fillRect(s.x+Math.cos(a)*100-4,s.y+Math.sin(a)*65-24,8,28);}}
  if(s.kind==='fish'){g.fillStyle='#fff9ec';g.fillRect(s.x-20,s.y-85,40,85);g.fillStyle='#83cbec';g.fillRect(s.x-20,s.y-42,40,15);poly(g,[[s.x-30,s.y-85],[s.x,s.y-118],[s.x+30,s.y-85]],'#82c7e7');oval(g,s.x,s.y-70,8,10,'#ffe5a0');}
  if(s.kind==='rhythm'){poly(g,[[s.x-30,s.y],[s.x-20,s.y-82],[s.x+20,s.y-82],[s.x+30,s.y]],'#f6cc81');g.save();g.translate(s.x,s.y-75);g.rotate(time*.7);for(let i=0;i<4;i++){g.rotate(Math.PI/2);poly(g,[[4,4],[12,13],[58,8],[58,-4]],'#fff4c8');}g.restore();}
  if(s.kind==='puzzle'){for(let i=0;i<3;i++)poly(g,[[s.x-65+i*55,s.y],[s.x-65+i*55,s.y-62],[s.x-30+i*55,s.y-85],[s.x-20+i*55,s.y]],colors[i]);}
  if(s.kind==='boss'){for(let i=0;i<3;i++)oval(g,s.x-55+i*55,s.y-8,50,30,'#fffaff');poly(g,[[s.x-42,s.y-30],[s.x-48,s.y-85],[s.x-18,s.y-64],[s.x,s.y-100],[s.x+18,s.y-64],[s.x+48,s.y-85],[s.x+42,s.y-30]],'#f7a9c8');}
  label(g,s.x,s.y-138,(done?'✓ ':'')+s.name,16);label(g,s.x,s.y+96,done?'印记已取得':active?'活动进行中':near?'按 F 互动':'沿奶油小路前往',12);g.restore();
 }
 function drawEnemy(g,e,time){
  const id=e.boss&&e.qKind==='nightmare'?'nightmare-marshmallow':e.qKind==='bubble'?'bubble-mob':'mob-'+e.qKind;
  if(asset(g,id,e.x,e.y+22+Math.sin(time*3+(e.patrol||0))*3,e.boss?195:e.qKind==='giant'?115:90)){
   if(e.telegraph>0){g.strokeStyle='#b85c92';g.lineWidth=3;g.setLineDash([7,5]);g.beginPath();g.arc(e.x,e.y,e.boss?145:65,0,TAU);g.stroke();g.setLineDash([]);}
   if(e.boss){label(g,e.x,e.y-160,(e.qBossName||'首领')+(e.phase===1?' · 泡泡外壳':' · 糖心试炼'),13);if(e.phase===1){g.strokeStyle='#7bc8e4';g.lineWidth=4;g.beginPath();g.ellipse(e.x,e.y-40,80,95,0,0,TAU);g.stroke();}}
   else if(e.qKind==='mirror'){g.strokeStyle='#9471bc';g.lineWidth=4;g.beginPath();g.arc(e.x,e.y,35,e.facing-.85,e.facing+.85);g.stroke();}
   if(e.qActivity)label(g,e.x,e.y-70,'◆ 糖屑泡泡',12);return;
  }
  const kind=e.qKind||'bubble',s=e.boss?2.2:1,r=27*s,bob=Math.sin(time*3+(e.patrol||0))*3;
  g.save();
  if(e.telegraph>0){g.strokeStyle='#b85c92';g.lineWidth=3;g.setLineDash([7,5]);g.beginPath();g.arc(e.x,e.y,e.boss?145:65,0,TAU);g.stroke();g.setLineDash([]);label(g,e.x,e.y+(e.boss?165:86),'离开粉圈 · 泡泡减速',11);}
  g.translate(e.x,e.y-22*s+bob);oval(g,0,28*s,r,.25*r,'#85799426');
  if(kind==='bunny'){oval(g,-11,-38,7,22,'#ffdfeb');oval(g,11,-38,7,22,'#ffdfeb');}
  if(kind==='bee'){oval(g,-27,-12,18,10,'#ffffffbb');oval(g,27,-12,18,10,'#ffffffbb');}
  const color=kind==='bee'?'#ffdc83':kind==='bunny'?'#ffdae7':kind==='mirror'?'#dcc7f6':kind==='nightmare'?'#e4b4e0':'#bfeafa';
  oval(g,0,0,r,r*.92,color);g.strokeStyle='#fffdf7';g.lineWidth=3;g.stroke();oval(g,-r*.3,-r*.4,r*.24,r*.15,'#ffffffa0');face(g,0,0,s);
  if(kind==='drop')poly(g,[[-12,-19],[0,-43],[13,-18]],color);
  if(kind==='bee'){g.strokeStyle='#ba8c46';g.lineWidth=5;g.beginPath();g.arc(0,0,r*.78,.3,1.1);g.stroke();}
  if(kind==='mirror'){g.strokeStyle='#9471bc';g.lineWidth=4;g.beginPath();g.arc(0,0,r+7,e.facing-.85,e.facing+.85);g.stroke();}
  if(e.boss){star(g,0,-r-14,18,'#f9ce78');if(e.phase===1){g.strokeStyle='#a4deed';g.lineWidth=6;g.beginPath();g.arc(0,0,r+14,0,TAU);g.stroke();}label(g,0,-r-42,e.phase===1?'梦魇棉花糖 · 泡泡外壳':'梦魇棉花糖 · 小泡泡守护',12);}
  g.restore();
 }
 function drawActivity(g,o,time){
  if(!o)return;
  const object=(id,n,size=80)=>{if(!asset(g,id,n.x,n.y+16,size))oval(g,n.x,n.y,20,18,'#ffdec4');};
  if(o.kind==='herd')for(const n of o.sheep){object('sheep',n,88);label(g,n.x,n.y-65,n.home?'✓':n.following?'跟着你':'靠近我',11);}
  if(o.kind==='fish')o.spots.forEach((n,i)=>{object(n.caught===2?'star-fish':'float-bobber',n,83);const bite=o.cast?.spot===i&&o.cast.time>=o.cast.wait;label(g,n.x,n.y-62,bite?'咬钩啦！F 收线':n.caught===2?'✓ 星鱼已收集':'浮标 '+(i+1)+' · '+n.caught+' / 2',12);});
  if(o.kind==='rhythm')o.pads.forEach((n,i)=>{object('sugar-flower',n,75);label(g,n.x,n.y+30,i<o.count?'✓':String(i+1),15);if(i===o.count){g.strokeStyle=o.elapsed%o.beat>=1.15?'#58944d':'#b17b30';g.lineWidth=4;g.beginPath();g.arc(n.x,n.y,Math.max(34,88-(o.elapsed%o.beat)*35),0,TAU);g.stroke();}});
  if(o.nodes&&o.kind!=='bubble')o.nodes.forEach((n,i)=>{const id=o.kind==='gather'?'candy-fruit':o.kind==='water'?'flower':n.done?'treasure-jar':'shovel';g.save();if(n.done)g.globalAlpha=.45;object(id,n,85);g.restore();label(g,n.x,n.y+34,n.done?'✓':o.kind==='dig'?'土堆 '+(i+1)+' · '+n.hits+' / 2':'F · '+(o.kind==='water'?'浇水':'采集'),12);});
  if(o.kind==='escort'){object('chicken-coop',o.home,140);label(g,o.home.x,o.home.y-110,'鸡窝 · '+o.count+' / 3',13);o.chicks.forEach(n=>{object('chick',n,65);label(g,n.x,n.y-43,n.home?'✓':n.following?'跟着你':'来接我',11);});}
  if(o.kind==='race'){o.flags.forEach((n,i)=>{object('finish-flag',n,90);label(g,n.x,n.y+25,i===5?'终点':(i+1)+' 号旗'+(i<o.count?' ✓':''),13);if(i===o.count){g.strokeStyle='#a57c3a';g.lineWidth=3;g.beginPath();g.arc(n.x,n.y,65,0,TAU);g.stroke();}});object('mob-bunny',o.rival,75);}
 }
 function mapSvg(world,state,player,view,shop){
  const claimed=state.claimed,completed=state.completed,r=world.river;
  const river=r.vertical?'<path d="M'+(r.x+r.w/2)+' 0V2400" stroke="#a4def3" stroke-width="'+r.w+'"/>':'<path d="M0 '+(r.y+r.h/2)+'H3600" stroke="#a4def3" stroke-width="'+r.h+'"/>';
  const bridges=world.bridges.map(p=>'<rect x="'+(r.vertical?r.x-40:p-120)+'" y="'+(r.vertical?p-120:r.y-40)+'" width="'+(r.vertical?r.w+80:240)+'" height="'+(r.vertical?240:r.h+80)+'" rx="20" fill="#f3d7ad" stroke="#fff5da" stroke-width="12"/>').join('');
  return `<svg viewBox="0 0 3600 2400" role="img" aria-label="${world.name}：五个区域、两座云朵桥和五枚星糖果"><rect width="3600" height="2400" fill="#fff8ec"/>${world.regions.map(r=>`<rect x="${r.x+15}" y="${r.y+15}" width="${r.w-30}" height="${r.h-30}" rx="100" fill="${r.color}" stroke="#fffdf6" stroke-width="18"/><text x="${r.x+r.w/2}" y="${r.y+(r.id==='meadow'?1100:150)}" text-anchor="middle" fill="${r.ink}" font-size="80">${r.name}</text>`).join('')}${river}${world.paths.map(line=>`<polyline points="${line.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#fff4d6" stroke-width="70" stroke-linecap="round"/>`).join('')}${world.walls.filter(w=>w.kind==='wall').map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="25" fill="#a2ce89"/>`).join('')}${bridges}${world.charms.map(c=>`<text x="${c.x}" y="${c.y}" text-anchor="middle" font-size="95" fill="${claimed.has(c.id)?'#9eae9c':'#c18e27'}">${claimed.has(c.id)?'✓':'☆'}</text>`).join('')}${[...world.sites,shop].map(s=>`<circle cx="${s.x}" cy="${s.y}" r="70" fill="#fffaf0" stroke="${state.track===s.id?'#ab7350':s.color}" stroke-width="12"/><text x="${s.x}" y="${s.y+25}" text-anchor="middle" font-size="72" fill="#614e43">${completed.has(s.id)?'✓':s.symbol}</text><text x="${s.x}" y="${s.y+150}" text-anchor="middle" font-size="65" fill="#614e43">${s.name}</text>`).join('')}<rect x="${view.x}" y="${view.y}" width="${view.w}" height="${view.h}" rx="12" fill="none" stroke="#bf9548" stroke-width="10" stroke-dasharray="30 15"/><circle cx="${player.x}" cy="${player.y}" r="36" fill="#fff" stroke="#614e43" stroke-width="12"/></svg>`;
 }
 return {types,names,instructions,colors,totals,finished,asset,create,step,interact,movePuzzle,undo,resetPuzzle,target,status,drawProp,drawLandmark,drawEnemy,drawActivity,mapSvg,star,label};
})();
