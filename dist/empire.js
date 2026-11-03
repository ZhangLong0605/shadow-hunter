/* Standalone vertical dream chapter: no changes to five-world save identities. */
window.HUNTER_EMPIRE=(()=>{
 'use strict';
 const TOP=443,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function flagMessage(value){return [...String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,12).join('')||'此夜之后皆是黎明';}
 function create({hp=100,maxHp=100,incoming=1}={}){maxHp=Number.isFinite(maxHp)?clamp(maxHp,1,1000):100;hp=Number.isFinite(hp)?clamp(hp,0,maxHp):maxHp;incoming=Number.isFinite(incoming)?clamp(incoming,.1,5):1;return {hp,maxHp,incoming,stage:hp>0?'panorama':'failed',time:0,stageTime:0,height:0,x:.5,grip:100,hits:0,invincible:0,accelerating:false,objects:[],spawn:0,serial:0,windows:[],windowSpawn:2,notice:'那盏失落的归途灯，正在城市最高处闪烁。',noticeTime:7,paused:false};}
 function announce(s,text){s.notice=text;s.noticeTime=5;}
 function step(s,dt,input={},random=Math.random){
  if(s.paused||['won','failed'].includes(s.stage))return;
  dt=clamp(dt,0,.05);s.time+=dt;s.stageTime+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);
  if(s.stage==='panorama'&&s.stageTime>=5){s.stage='turn';s.stageTime=0;}
  else if(s.stage==='turn'&&s.stageTime>=2.4){s.stage='climb';s.stageTime=0;announce(s,'W / ↑ 向上攀爬 · A D 横移 · 按住空格持续加速 · 松开 W 恢复抓握');}
  else if(s.stage==='summit'&&s.stageTime>=11){s.stage='won';return;}
  if(s.stage!=='climb')return;
  s.invincible=Math.max(0,s.invincible-dt);
  s.accelerating=!!input.dash&&!!input.up&&!input.down&&s.grip>0;
  const moving=input.up&&!input.down;
  s.x=clamp(s.x+((input.right?1:0)-(input.left?1:0))*dt*(s.accelerating?.65:.42),.08,.92);
  if(moving&&s.grip>0){s.height+=dt*(s.accelerating?18:7.5);s.grip=Math.max(0,s.grip-dt*(s.accelerating?4.8:3.2));}else s.grip=Math.min(100,s.grip+dt*17);
  if(input.down)s.height=Math.max(0,s.height-dt*4);
  if((s.time>=30||s.height>=110)&&!s.media){s.media=true;announce(s,'城市快讯：有人正在攀登帝国大厦！街头人群高喊：加油，别放弃！');}
  if((s.time>=55||s.height>=230)&&!s.police){s.police=true;announce(s,'警方广播：请停在安全位置！上方开始布置拦截网。');}
  if((s.time>=80||s.height>=330)&&!s.heli){s.heli=true;announce(s,'直升机抵达！金色光束即将扫过外墙，横移避开。');}
  // Lit windows have a warning phase before their collision area becomes active.
  s.windowSpawn-=dt;
  for(const light of s.windows)light.age+=dt;
  s.windows=s.windows.filter(light=>light.age<7.3&&light.h>s.height-12);
  if(s.windowSpawn<=0){
   s.windowSpawn=3.2+random()*1.8;
   const floor=Math.round((s.height+(s.accelerating?45:22)+random()*6)/5)*5,first=Math.floor(random()*8),count=s.police?3:2;
   for(let i=0;i<count;i++){const col=(first+i*3)%8;if(s.windows.filter(l=>l.h===floor&&!l.hit).length>=6||s.windows.some(l=>l.h===floor&&l.col===col&&!l.hit))continue;s.windows.push({kind:'window',col,x:windowLane(col),h:floor,w:.085,age:0,hit:false});}
   if(!s.windowIntro){s.windowIntro=true;announce(s,'窗户闪烁是开灯预警！金色常亮区域会暴露行踪，横移绕开或等灯熄灭。');}
  }
  s.spawn-=dt;
  if(s.spawn<=0){s.spawn=s.heli?2.5:3.5;const n=s.serial++,kind=s.heli&&n%3===0?'beam':s.police&&n%3===1?'net':n%4===1?'worker':n%3===0?'ledge':'vent';s.objects.push({id:n,kind,x:.16+((n*37)%70)/100,h:s.height+38,w:kind==='net'?.22:kind==='ledge'?.24:kind==='beam'?.19:.13,hit:false});}
  for(const o of [...s.objects,...s.windows]){if(o.kind==='window'&&o.age<1.8)continue;if(o.hit||Math.abs(o.h-s.height)>1.5)continue;if(Math.abs(s.x-o.x)<o.w/2+.035&&s.invincible<=0){o.hit=true;s.hits++;const damage=16*s.incoming;s.hp=Math.max(0,s.hp-damage);s.height=Math.max(0,s.height-4);s.invincible=1.6;announce(s,o.kind==='window'?'被亮窗里的人发现！生命受损，赶快换到暗窗一侧。':o.kind==='worker'?'工作人员拦住去路！换一列窗格绕行。':o.kind==='beam'?'被探照灯锁定，避让时失去了一些抓握。':'撞到障碍，生命受损！横移避开后继续攀爬。');if(s.hp<=0){s.stage='failed';s.accelerating=false;announce(s,'生命耗尽，安全绳接住了你。调整路线，再试一次。');}}}
  s.objects=s.objects.filter(o=>o.h>s.height-12);
  if(s.height>=TOP&&s.hp>0&&s.stage==='climb'){s.height=TOP;s.stage='summit';s.stageTime=0;announce(s,'你跨过最后一道护栏。风声渐远，整座城市在脚下展开。');}
 }
 function windowLane(col){return (25.2+22+col*(640-50.4)/8+9)/640;}
 let active=null;
 function open({appearance='shade',flagText='',hp=100,maxHp=100,incoming=1,onHealthChange=()=>{},onExit=()=>{},onWin=()=>''}={}){
  if(active)return;const banner=flagMessage(flagText);const root=document.createElement('section');root.id='empire-chapter';root.innerHTML='<canvas tabindex="0" aria-label="帝国之巅攀爬关卡"></canvas><div class="empire-top"><div><small>WORLD 02 / 第二盏归途灯</small><h2>帝国之巅</h2></div><button data-action="pause">暂停 Esc</button><button data-action="exit">返回星图</button></div><div class="empire-status"></div><div class="empire-dialogue" role="status"></div><div class="empire-controls"><button data-hold="left">A ←</button><button data-hold="up">W ↑ 攀爬</button><button data-hold="right">D →</button><button data-hold="down">S ↓</button><button data-hold="dash">按住空格 · 加速</button></div><div class="empire-end" hidden></div>';
  document.body.appendChild(root);const canvas=root.querySelector('canvas'),g=canvas.getContext('2d'),status=root.querySelector('.empire-status'),dialogue=root.querySelector('.empire-dialogue'),end=root.querySelector('.empire-end');let s=create({hp,maxHp,incoming}),keys={},last=0,raf=0,rewarded=false,visualTime=0;
  const heroMotion={...(window.HUNTER_ART?.createMotion()||{}),appearance};
  function exit(){cancelAnimationFrame(raf);window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);root.remove();active=null;onExit({hp:s.hp,maxHp:s.maxHp,stage:s.stage});}
  function pause(){if(!['won','failed'].includes(s.stage)){s.paused=!s.paused;keys={};root.querySelector('[data-action="pause"]').textContent=s.paused?'继续 Esc':'暂停 Esc';}}
  function blur(){keys={};if(!s.paused&&!['won','failed'].includes(s.stage))pause();}
  function visibility(){if(document.hidden)blur();}
  const codes={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'dash'};
  function key(e){if(!active)return;if(codes[e.code]||e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape'){if(e.type==='keydown'&&!e.repeat)pause();}else keys[codes[e.code]]=e.type==='keydown';}}
  window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  root.querySelector('[data-action="pause"]').onclick=pause;root.querySelector('[data-action="exit"]').onclick=exit;
  root.querySelectorAll('[data-hold]').forEach(b=>{b.onpointerdown=e=>{keys[b.dataset.hold]=true;b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.hold]=false;});
  function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
  function poly(points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
  function text(t,x,y,size=15,color='#dcece6'){g.font=size+'px "Shadow Interface",sans-serif';g.textAlign='center';g.fillStyle=color;g.fillText(t,x,y);}
  function city(){const grad=g.createLinearGradient(0,0,0,720);grad.addColorStop(0,'#0a1832');grad.addColorStop(1,'#7e7777');g.fillStyle=grad;g.fillRect(0,0,1100,720);for(let i=0;i<45;i++){const x=i*27-20,h=40+(i*67)%190;rect(x,720-h,24,h,i%2?'#243b4e':'#1b3041');for(let j=0;j<5;j++)rect(x+7,730-h+j*25,3,6,'#dfc38177');}g.fillStyle='#ffe7b9';g.beginPath();g.arc(885,100,30,0,Math.PI*2);g.fill();}
  function building(){rect(375,310,350,410,'#727d88');rect(405,230,290,490,'#8a949b');rect(435,170,230,550,'#9ba5a7');rect(470,120,160,600,'#b3b5af');rect(495,85,110,635,'#c5c6b9');rect(535,54,30,35,'#d8d5bd');rect(548,12,4,43,'#e4e6db');for(let i=0;i<17;i++)for(let j=0;j<28;j++){const x=384+i*20,y=160+j*20;if(x>470&&x<630||y>310||y>230&&x>405&&x<695)rect(x,y,5,9,j%4===0?'#e7c88c':'#304657');}text('EMPIRE STATE BUILDING',550,690,14,'#fae9c6');}
  function hero(x,y,scale=1){
   // Reuse the same appearance and renderer as the main map, including the original hunter.
   const climbing=s.stage==='climb',moving=climbing&&!s.paused&&!!(keys.up||keys.left||keys.right||keys.down);
   const heading=climbing?-Math.PI/2:.8;
   Object.assign(heroMotion,{appearance,moveBlend:moving?1:0,moveHeading:heading,motionTime:s.time,stridePhase:s.time*8});
   g.save();g.translate(x,y);g.scale(scale,scale);
   window.HUNTER_ART?.hunter(g,0,-22,heading,'#beffe0',.9,false,s.time,moving,'blade',heroMotion);
   g.restore();
  }

  function wall(){const left=230,right=870;poly([[left,720],[right,720],[760,-80],[340,-80]],'#75858c');// Every window is anchored to a fixed floor, matching the collision height.
  const floorBase=Math.floor(s.height/5);
  for(let floor=floorBase-4;floor<=floorBase+10;floor++){
   const h=floor*5,y=510-(h-s.height)*13,inset=(720-y)*.12;
   rect(left+inset,y+30,right-left-inset*2,3,'#c0c0ad');
   for(let col=0;col<8;col++){
    const x=left+inset+22+col*(right-left-inset*2)/8;
    const light=s.windows.find(l=>l.col===col&&l.h===h&&!l.hit),warning=light&&light.age<1.8,on=light&&(!warning||Math.sin(light.age*18)>0);
    if(on){const halo=g.createRadialGradient(x+9,y,2,x+9,y,46);halo.addColorStop(0,warning?'#ffe4a455':'#ffc857aa');halo.addColorStop(1,'#ffc85700');g.fillStyle=halo;g.fillRect(x-37,y-46,92,92);}
    rect(x,y-17,18,35,on?(warning?'#eac97b':'#ffe0a0'):'#1c3b51');rect(x+2,y-15,4,31,on?'#fff3c9':'#a6d8dd55');rect(x+8,y-17,2,35,'#35434d');
    if(on&&!warning){rect(x+7,y-3,5,10,'#7d5e42');text('!',x+9,y-24,16,'#ffe5a4');}
   }
  }
  const hy=510;for(const o of s.objects){const y=hy-(o.h-s.height)*13,x=left+o.x*(right-left),w=o.w*(right-left);if(y<-70||y>760)continue;if(o.kind==='beam'){poly([[1040,65],[x-w/2,y],[x+w/2,y]],'#ffe3a23a');rect(x-w/2,y-8,w,16,'#ffdea780');text('探照灯',x,y-17,12);}else{rect(x-w/2,y-14,w,24,o.kind==='net'?'#bca581':o.kind==='worker'?'#c6a65e':'#354c5c');if(o.kind==='net'){g.strokeStyle='#e3cd9a';for(let n=0;n<5;n++){g.beginPath();g.moveTo(x-w/2+n*w/4,y-14);g.lineTo(x+w/2-n*w/4,y+10);g.stroke();}}text({worker:'工作人员 · 绕行',net:'拦截网',vent:'通风设备',ledge:'外挑檐口'}[o.kind],x,y-23,12,'#fff0cd');}}
   if(s.heli){const x=970+Math.sin(s.time)*25;rect(x-44,62,80,24,'#20394d');poly([[x-20,62],[x+28,62],[x+12,47]],'#9bc3ce');rect(x-76,70,36,5,'#5c7b90');g.strokeStyle='#d1e3e5';g.lineWidth=3;g.beginPath();g.moveTo(x-65,42);g.lineTo(x+65,42);g.moveTo(x,42);g.lineTo(x,62);g.stroke();text('NYPD',x,80,10);}
   if(s.invincible<=0||Math.sin(s.time*25)>0)hero(left+s.x*(right-left),hy,1.1);
   text('↑ 天线 / 443 m',550,105,18,'#d7f5e6');
  }
  function victoryCG(){
   const t=s.stageTime,turn=clamp(t/2.5,0,1),reveal=clamp((t-2)/2,0,1);
   const sunrise=g.createLinearGradient(0,0,0,720);sunrise.addColorStop(0,'#111e40');sunrise.addColorStop(.6,'#675b70');sunrise.addColorStop(1,'#e7aa77');g.fillStyle=sunrise;g.fillRect(0,0,1100,720);
   const light=g.createRadialGradient(770,350,5,770,350,480);light.addColorStop(0,'#fff0c685');light.addColorStop(1,'#f5ca8b00');g.fillStyle=light;g.fillRect(0,0,1100,720);
   // Distant avenues converge under the tower; warm windows echo the climb.
   for(let i=0;i<52;i++){const x=i*25-80,h=45+(i*71)%180,y=590+(i%3)*30;rect(x,y-h,22,h+150,i%3?'#233347':'#354558');for(let j=0;j<8;j++)rect(x+6,y-h+12+j*20,3,5,'#edcd9555');}
   poly([[0,720],[720,455],[1100,720]],'#edc69520');
   g.save();g.translate(550,450);g.rotate((1-turn)*-.24);g.scale(.65+.35*turn,.35+.65*turn);g.translate(-550,-450);
   poly([[340,720],[400,485],[550,424],[700,485],[760,720]],'#263e4e');poly([[400,485],[550,424],[700,485],[550,547]],'#819b9d');poly([[400,485],[550,547],[550,720],[340,720]],'#3a5966');poly([[550,547],[700,485],[760,720],[550,720]],'#203946');
   for(let i=0;i<6;i++){rect(383+i*23,560+i*4,7,145,'#b7d4c72a');rect(580+i*23,580-i*6,6,140,'#93b8b42a');}
   hero(535,466,2.3);
   // Pole pivots at the selected character's hand; cloth is a continuous waving mesh.
   g.save();g.translate(573,397);g.rotate(-.1+Math.sin(visualTime*2.5)*.12*reveal);g.strokeStyle='#f0d9a7';g.lineWidth=5;g.beginPath();g.moveTo(0,45);g.lineTo(0,-224);g.stroke();
   g.fillStyle='#fff1ba';g.beginPath();g.arc(0,-228,6,0,Math.PI*2);g.fill();
   const fw=285*reveal,fh=106,wave=x=>Math.sin(x*.024-visualTime*5)*(x/285)*15;
   for(let i=0;i<24;i++){const x=i*fw/24,nx=(i+1)*fw/24,y=-215+wave(x),ny=-215+wave(nx);poly([[x,y],[nx,ny],[nx,ny+fh],[x,y+fh]],i%3===0?'#a5dfcb':'#bcebd4');}
   if(reveal>.8){g.textAlign='center';g.font='25px "Shadow Interface",sans-serif';g.fillStyle='#173f48';const chars=[...banner],split=Math.ceil(chars.length/2),lines=chars.length<=6?[banner]:[chars.slice(0,split).join(''),chars.slice(split).join('')];for(const [row,line] of lines.entries()){const letters=[...line],spacing=Math.min(40,165/Math.max(1,letters.length-1)),start=177-(letters.length-1)*spacing/2;letters.forEach((ch,i)=>{const x=start+i*spacing;g.fillText(ch,x,(lines.length===1?-159:-176+row*36)+wave(x));});}
    g.strokeStyle='#285c60';g.lineWidth=2;g.beginPath();g.arc(43,-162+wave(43),21,.5,5.7);g.stroke();g.beginPath();g.moveTo(40,-188);g.lineTo(46,-144);g.stroke();}
   g.restore();g.restore();
   for(let i=0;i<35;i++){const x=(i*173+visualTime*(12+i%4))%1100,y=120+(i*97-visualTime*18)%480;rect(x,y,2,2,'#ffe9bd88');}
   // Letterboxing and delayed title leave the character and banner unobstructed.
   rect(0,0,1100,65,'#081521');rect(0,655,1100,65,'#081521');
   if(t>3){g.save();g.globalAlpha=clamp(t-3,0,1);text('ABOVE THE CITY · BEYOND THE NIGHT',275,155,12,'#e9d6af');text('长夜之上',275,205,46,'#fff0cd');text('443 METRES / 帝国之巅',275,242,16,'#c9e7db');g.restore();}
   if(t>7)text('把旗帜交给风，把黎明带回人间。',550,635,20,'#f3e8cb');
  }
  function render(){const dpr=Math.min(window.devicePixelRatio||1,2);const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}g.setTransform(canvas.width/1100,0,0,canvas.height/720,0,0);city();
   if(s.stage==='panorama'){const zoom=1+s.stageTime*.025;g.save();g.translate(550,400);g.scale(zoom,zoom);g.translate(-550,-400);building();g.restore();text('一座城市，一场逆风而上的旅程。',550,610,23);}
   else if(s.stage==='turn'){g.save();const p=s.stageTime/2.4;g.translate(550,360);g.rotate(-p*Math.PI*.08);g.scale(1+p*2,1+p*2);g.translate(-550,-360);building();g.restore();rect(0,0,1100,720,'rgba(8,22,34,'+(Math.sin(p*Math.PI)*.5)+')');}
   else if(s.stage==='summit'||s.stage==='won')victoryCG();
   else wall();
   root.classList.toggle('empire-victory',['summit','won'].includes(s.stage));
   status.innerHTML='<b>'+Math.floor(s.height)+' <small>/ 443 m</small></b><span>生命 '+Math.ceil(s.hp)+' / '+s.maxHp+'</span><div class="empire-health"><i style="width:'+s.hp/s.maxHp*100+'%"></i></div><span>抓握 '+Math.ceil(s.grip)+'% · 碰撞 '+s.hits+' 次</span><div class="empire-meter"><i style="width:'+s.height/TOP*100+'%"></i></div><span>'+(['summit','won'].includes(s.stage)?'登顶':s.heli?'直升机介入':s.police?'警方布防':s.media?'媒体直播 · 街头声援':'未被发现')+' · '+(s.accelerating?'↑↑ 加速中 · 18 m/s':'按住空格加速 · 7.5 m/s')+'</span>';
   dialogue.textContent=s.paused?'已暂停 · 按 Esc 或点击继续':s.noticeTime>0?s.notice:s.stage==='climb'?'避开金色亮窗；闪烁时提前换道，熄灭后可安全通过。松开 W 恢复抓握。':'';
   if(['won','failed'].includes(s.stage)&&end.hidden){end.hidden=false;let result='';if(s.stage==='won'&&!rewarded){rewarded=true;result=onWin();}end.innerHTML='<small>'+ (s.stage==='won'?'CHAPTER COMPLETE':'SAFETY LINE ACTIVATED')+'</small><h2>'+(s.stage==='won'?'城市，在你脚下醒来。':'先喘口气，再向上。')+'</h2><p>'+(s.stage==='won'?'登顶帝国大厦 · '+Math.floor(s.time)+' 秒 · 失误 '+s.hits+' 次。 '+result:'生命已耗尽，安全绳将你送回地面。重新挑战会恢复入场时的生命；休息只恢复抓握，不恢复生命。')+'</p><button data-retry>再爬一次</button><button data-return>返回星图</button>';end.querySelector('[data-retry]').onclick=()=>{s=create({hp,maxHp,incoming});onHealthChange(s.hp);keys={};rewarded=false;end.hidden=true;};end.querySelector('[data-return]').onclick=exit;}
  }
  function frame(t){if(!active)return;if(!s.paused)visualTime+=Math.min(.05,(t-last)/1000||0);const previousHp=s.hp;step(s,Math.min(.05,(t-last)/1000||0),{...keys,left:keys.left?1:0,right:keys.right?1:0});if(s.hp!==previousHp)onHealthChange(s.hp);last=t;render();raf=requestAnimationFrame(frame);}
  active={exit};canvas.focus();raf=requestAnimationFrame(frame);
 }
 return {create,step,open,flagMessage};
})();
