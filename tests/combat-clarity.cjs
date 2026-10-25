/* Combat readability regressions against the real game and a stateful Canvas recorder. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),noop=()=>{},records=[];
let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(error){console.error('FAIL '+name);throw error;}}
function makeContext(name){
 const initial={globalAlpha:1,globalCompositeOperation:'source-over',strokeStyle:'#000000',fillStyle:'#000000',lineWidth:1,lineCap:'butt',lineJoin:'miter',font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',shadowBlur:0,shadowColor:'rgba(0,0,0,0)',shadowOffsetX:0,shadowOffsetY:0,lineDashOffset:0,filter:'none',dash:[],transform:[1,0,0,1,0,0]};
 let state={...initial},stack=[],currentPath=[];
 const copy=()=>({...state,dash:[...state.dash],transform:[...state.transform]});
 const record=(op,args=[])=>{assert.ok(args.filter(v=>typeof v==='number').every(Number.isFinite),'Finite '+name+'.'+op);records.push({canvas:name,op,args,state:copy(),path:[...currentPath]});};
 const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 const methods={
  snapshot:copy,depth:()=>stack.length,
  save(){stack.push(copy());record('save');},restore(){assert.ok(stack.length,'Canvas restore has matching save');state=stack.pop();record('restore');},
  setLineDash(values){state.dash=[...values];},getLineDash(){return [...state.dash];},
  setTransform(...values){state.transform=values;record('setTransform',values);},resetTransform(){state.transform=[1,0,0,1,0,0];},getTransform(){const [a,b,c,d,e,f]=state.transform;return {a,b,c,d,e,f};},
  translate(x,y){state.transform=multiply(state.transform,[1,0,0,1,x,y]);record('translate',[x,y]);},
  scale(x,y){state.transform=multiply(state.transform,[x,0,0,y,0,0]);record('scale',[x,y]);},
  rotate(a){state.transform=multiply(state.transform,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);record('rotate',[a]);},
  transform(...values){state.transform=multiply(state.transform,values);record('transform',values);},
  beginPath(){currentPath=[];},closePath(){currentPath.push({op:'closePath',args:[]});},
  createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),
  measureText:text=>({width:String(text).length*7}),
 };
 for(const op of ['moveTo','lineTo','arc','ellipse','rect','roundRect','bezierCurveTo','quadraticCurveTo'])methods[op]=(...args)=>{currentPath.push({op,args});record(op,args);};
 for(const op of ['fill','stroke','fillRect','strokeRect','clearRect','fillText','strokeText','drawImage','clip'])methods[op]=(...args)=>record(op,args);
 return new Proxy(methods,{get:(target,key)=>key in target?target[key]:state[key],set:(_,key,value)=>(state[key]=value,true)});
}
const elements=new Map(),contexts=new Map();
class Element{
 constructor(id='scratch'){this.id=id;this.dataset={};this.style={setProperty(k,v){this[k]=v;}};this.children=[];this.clientWidth=1200;this.clientHeight=780;this.width=1200;this.height=780;const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)};}
 set innerHTML(html){this.html=html;this.children=[];for(const m of html.matchAll(/<button\b([^>]*)>/g)){const e=new Element();e.disabled=m[1].includes('disabled');for(const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='id')elements.set(a[2],e);if(a[1].startsWith('data-'))e.dataset[a[1].slice(5)]=a[2];}this.children.push(e);}}
 get innerHTML(){return this.html||'';}querySelectorAll(s){if(s==='button')return this.children;const key=s.match(/data-([\w-]+)/)?.[1];return this.children.filter(c=>key in c.dataset);}querySelector(s){return this.querySelectorAll(s)[0]||null;}
 addEventListener(){}focus(){}setAttribute(k,v){this[k]=v;}setPointerCapture(){}
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
 getContext(){if(!this.context){this.context=makeContext(this.id);contexts.set(this.id,this.context);}return this.context;}
}
const el=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
const motion={matches:false,addEventListener:noop},window={devicePixelRatio:1,addEventListener:noop,matchMedia:()=>motion},storage=new Map();
const document={getElementById:el,createElement:()=>new Element(),addEventListener:noop,documentElement:new Element('document'),body:new Element('body')};
const sandbox={window,document,requestAnimationFrame:noop,console,Math,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
for(const name of ['release-data.js','art.js','feedback.js','scene-fx.js','combat-cues.js','guide-data.js','world-data.js','expedition-data.js','journey-data.js','campaign-data.js'])vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),sandbox);
const code=fs.readFileSync(path.join(root,'game.js'),'utf8');
const hook=`window.clarityTest={get state(){return state},get player(){return player},get enemies(){return enemies},get projectiles(){return projectiles},get hazards(){return hazards},get effects(){return effects},get camera(){return camera},reset,enterRoom,enterWorld,closeModal,spawnEnemy,telegraphInfo,performEnemyAttack,drawHazard,draw,drawFeedback,frame,updateCamera,setViewRange,updateReleaseSettings,releaseSettings,update,hitPlayer,shoot};`;
assert.ok(code.includes('makeGround();reset();requestAnimationFrame(frame);'),'Test hook must replace startup loop');
vm.runInNewContext(code.replace('makeGround();reset();requestAnimationFrame(frame);',hook+'makeGround();reset();'),sandbox);
const g=window.clarityTest,ctx=el('game').getContext();
function start(){g.reset();g.enterRoom(0,'hunt');g.enemies.length=0;g.projectiles.length=0;g.hazards.length=0;g.effects.length=0;g.player.invincible=0;g.player.dash=0;g.player.shield=0;g.player.hp=100;g.updateReleaseSettings({sound:false,shake:false});records.length=0;}
function enemy(attack,options={}){return Object.assign(g.spawnEnemy(options.type||'wolf',600,390,!!options.elite,!!options.boss),{attack,telegraph:.5,windup:1,target:{x:780,y:410},...options});}
function close(a,b,message){assert.ok(Math.abs(a-b)<1e-8,message||`${a} ≈ ${b}`);}

test('Circular warning centres and radii agree with actual impact/hazard geometry',()=>{
 for(const spec of [{attack:'slam',type:'wolf',radius:85},{attack:'slam',type:'giant',radius:110},{attack:'slam',boss:true,radius:160},{attack:'shieldBash',radius:145},{attack:'meteor',radius:88,targetBound:true},{attack:'venom',radius:72,targetBound:true},{attack:'curse',radius:135,targetBound:true}]){
  start();const e=enemy(spec.attack,spec),info=g.telegraphInfo(e),centre=spec.targetBound?e.target:e;
  assert.equal(info.radius,spec.radius);assert.equal(info.x,centre.x);assert.equal(info.y,centre.y);
  if(spec.attack!=='curse'){
   g.player.x=centre.x+spec.radius+g.player.r+.01;g.player.y=centre.y;g.performEnemyAttack(e);assert.equal(g.player.hp,100,'Outside impact stays safe: '+spec.attack);
   g.player.x=centre.x+spec.radius+g.player.r-.01;g.performEnemyAttack(e);assert.ok(g.player.hp<100,'Inside impact hits: '+spec.attack);
  }else g.performEnemyAttack(e);
  if(spec.targetBound)for(const h of g.hazards){assert.equal(h.r,spec.radius);assert.equal(h.x,e.target.x);assert.equal(h.y,e.target.y);assert.equal(h.purple===true,spec.attack==='curse');}
 }
});

test('Lunge and shot telegraphs preserve the attacks actual reach and spread',()=>{
 for(const boss of [false,true]){start();const e=enemy('lunge',{boss}),info=g.telegraphInfo(e);g.performEnemyAttack(e);close(info.length,e.dash*650);close(Math.hypot(e.dx,e.dy),1);assert.equal(info.halfWidth,e.r+g.player.r+8);}
 for(const [type,count,speed] of [['fire',1,200],['archer',1,260],['swarm',3,200],['mirror',5,200]]){
  start();const e=enemy('shot',{type}),info=g.telegraphInfo(e);g.performEnemyAttack(e);assert.equal(g.projectiles.length,count);
  const a=Math.atan2(e.target.y-e.y,e.target.x-e.x);
  g.projectiles.forEach((p,i)=>{close(Math.hypot(p.vx,p.vy),speed);close(Math.atan2(p.vy,p.vx),a+(i-(count-1)/2)*.19);assert.equal(p.r,6);assert.equal(p.life,3);assert.equal(p.enemy,true);});
  assert.equal(info.length,speed*3,'Warning reaches full projectile lifetime for '+type);assert.equal(info.count,count);close(info.angle,a);
 }
});

test('Only curse hazards bypass a normal invincibility window',()=>{
 for(const purple of [false,true]){start();g.player.invincible=1;g.hitPlayer(9,purple);assert.equal(g.player.hp,purple?91:100);}
});

const combat=window.HUNTER_COMBAT,paints=()=>records.filter(r=>['stroke','fill','fillRect','strokeRect','fillText','strokeText'].includes(r.op));
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze);}return value;};
function cue(e){return {...g.telegraphInfo(e),enemy:e,progress:.5};}
function view(options={}){return {enemies:[],cues:[],hazards:[],projectiles:[],player:{x:600,y:390,r:15},time:2,scale:1,rich:true,...options};}
function capture(fn){records.length=0;fn();return paints();}

test('Danger colors encode dodgeable, unavoidable and objective attacks consistently',()=>{
 assert.equal(combat.palette.danger,'#ff785e');assert.equal(combat.palette.unavoidable,'#d69bff');assert.equal(combat.palette.friendly,'#ffe3a1');assert.equal(combat.palette.target,'#f3cf81');
 start();for(const attack of ['slam','shieldBash','meteor','venom','lunge','shot'])assert.equal(g.telegraphInfo(enemy(attack)).color,combat.palette.danger,attack+' uses danger orange');
 assert.equal(g.telegraphInfo(enemy('curse')).color,combat.palette.unavoidable);
 assert.equal(g.telegraphInfo(enemy('lantern')).kind,'objective','Dream-lamp attack is not a player damage circle');
});

test('Hazard boundaries stay circular, exact and inside the collision radius',()=>{
 for(const scale of [.5,1,2])for(const r of [72,88,135])for(const purple of [false,true]){
  const h=deepFreeze({x:300,y:200,r,life:2,friendly:false,purple,color:'#84c8a3'});
  capture(()=>combat.hazard(ctx,h,{outline:true,scale}));
  const arcs=records.filter(v=>v.op==='arc');assert.ok(arcs.length);assert.equal(arcs[0].args[2],r,'First boundary is exact');
  assert.ok(arcs.every(v=>v.args[2]<=r),'No ornamental hazard circle exceeds damage radius');
  assert.ok(!records.some(v=>v.op==='ellipse'),'Hazard is not foreshortened');
  assert.ok(!paints().some(v=>v.op==='fill'&&v.path.some(p=>p.op==='arc'&&p.args[2]>=r*.5)),'Top hazard contains no opaque area fill');
  assert.ok(paints().some(v=>v.op==='stroke'&&v.state.strokeStyle===(purple?combat.palette.unavoidable:combat.palette.danger)),'Readable danger-colored outline');
 }
});

test('Expired hazards and friendly upper-layer hazards cannot produce danger outlines',()=>{
 for(const h of [{life:0},{life:-1},{life:3,friendly:true}])assert.equal(capture(()=>combat.hazard(ctx,{x:100,y:100,r:72,...h},{outline:true})).length,0);
 const friendly=capture(()=>combat.hazard(ctx,{x:100,y:100,r:72,life:2,friendly:true},{outline:false}));assert.ok(friendly.length,'Friendly ground effect remains visible');
 assert.ok(!friendly.some(r=>r.state.strokeStyle===combat.palette.danger||r.state.strokeStyle===combat.palette.unavoidable));
});

test('Essential outlines and attack directions survive low effects and every zoom',()=>{
 start();const all=['slam','lunge','shot','curse','lantern'].map((a,i)=>enemy(a,{x:200+i*220,y:350,type:a==='shot'?'mirror':'wolf'}));
 for(const rich of [false,true])for(const scale of [.5,1,2]){
  const draws=capture(()=>combat.render(ctx,view({enemies:all,cues:all.map(cue),rich,scale})));
  assert.ok(draws.some(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.danger),'Dodgeable outline remains');
  assert.ok(draws.some(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.unavoidable),'Unavoidable outline remains');
  const cueArc=draws.find(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.danger&&r.path.some(p=>p.op==='arc'&&p.args[2]===85));assert.ok(cueArc,'Slam radius survives zoom');
  assert.ok(cueArc.state.lineWidth*scale>=1.5&&cueArc.state.lineWidth*scale<=5,'Danger edge stays legible in screen pixels');
  assert.ok(draws.some(r=>r.path.filter(p=>p.op==='lineTo').length>=2),'Directional arrow geometry remains');
  assert.ok(!draws.some(r=>r.op==='fill'&&r.path.some(p=>p.op==='arc'&&p.args[2]>30)),'Overlay does not fill a large warning disk');
 }
});

test('Dead, exposed and completed attacks lose their telegraph',()=>{
 for(const patch of [{dead:true},{exposed:2},{telegraph:0},{telegraph:-.02}]){
  start();const e=enemy('slam',patch),draws=capture(()=>combat.render(ctx,view({enemies:[e],cues:[cue(e)]})));
  assert.ok(!draws.some(r=>r.op==='stroke'&&r.path.some(p=>p.op==='arc'&&p.args[2]===85)),'No stale slam circle for '+JSON.stringify(patch));
 }
});

test('A running charge keeps its remaining capsule and committed direction',()=>{
 start();const e=enemy('lunge',{telegraph:0,dash:.12,dx:0,dy:1,target:{x:1000,y:390}}),c=g.telegraphInfo(e);close(c.length,.12*650);close(c.angle,Math.PI/2);
 const draws=capture(()=>combat.render(ctx,view({enemies:[e],cues:[c]})));
 const outline=draws.find(v=>v.op==='stroke'&&v.state.strokeStyle===combat.palette.danger&&v.path.filter(p=>p.op==='arc').length===2);assert.ok(outline,'Active charge outline persists after windup');
 const ends=outline.path.filter(p=>p.op==='arc');close(ends[0].args[0],c.length);close(ends[1].args[0],0);assert.ok(ends.every(p=>p.args[2]===e.r+g.player.r+8),'Both caps use the true contact distance');
 close(outline.state.transform[0],0);close(outline.state.transform[1],1);
});

test('Crowded attacks retain all boundaries while instruction labels stay bounded',()=>{
 start();const enemies=Array.from({length:14},(_,i)=>enemy('slam',{x:220+i*50,y:360}));
 const draws=capture(()=>combat.render(ctx,view({enemies,cues:enemies.map(cue)})));
 const circles=draws.filter(v=>v.op==='stroke'&&v.state.strokeStyle===combat.palette.danger&&v.path.some(p=>p.op==='arc'&&p.args[2]===85));assert.equal(circles.length,enemies.length,'Label budget never suppresses a dangerous boundary');
 assert.ok(draws.filter(v=>v.op==='fillText').length<=6,'At most six instruction labels');
});

test('Enemy projectile markers have their own danger outline at all visual settings',()=>{
 for(const rich of [false,true])for(const scale of [.5,1,2]){
  const p=deepFreeze({x:260,y:270,vx:200,vy:0,r:6,life:2,enemy:true,color:'#84c8a3'});
  const draws=capture(()=>combat.render(ctx,view({projectiles:[p],rich,scale})));
  assert.ok(draws.some(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.danger),'Enemy tint cannot disguise hostile projectile');
  const friendly=capture(()=>combat.render(ctx,view({projectiles:[{...p,enemy:false}],rich,scale})));
  assert.ok(!friendly.some(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.danger),'Friendly projectile does not get hostile outline');
  const expired=capture(()=>combat.render(ctx,view({projectiles:[{...p,life:0}],rich,scale})));
  assert.ok(!expired.some(r=>r.op==='stroke'&&r.state.strokeStyle===combat.palette.danger),'Expired projectile is not outlined');
 }
});

test('Rendering leaves gameplay objects and the caller canvas state intact',()=>{
 start();const e=enemy('curse'),v=deepFreeze(view({enemies:[e],cues:[cue(e)],hazards:[{x:400,y:300,r:135,life:2,purple:true,friendly:false}],projectiles:[{x:500,y:300,vx:200,vy:20,r:6,life:2,enemy:true}]}));
 const before=JSON.stringify(v);ctx.globalAlpha=.37;ctx.globalCompositeOperation='multiply';ctx.lineWidth=7;ctx.strokeStyle='#123456';ctx.fillStyle='#654321';ctx.setLineDash([3,8]);ctx.translate(11,19);const canvasBefore=ctx.snapshot(),depth=ctx.depth();
 combat.render(ctx,v);assert.deepEqual(ctx.snapshot(),canvasBefore);assert.equal(ctx.depth(),depth);assert.equal(JSON.stringify(v),before);
 combat.hazard(ctx,v.hazards[0],{outline:true,scale:.5});assert.deepEqual(ctx.snapshot(),canvasBefore);assert.equal(ctx.depth(),depth);assert.equal(JSON.stringify(v),before);
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.resetTransform();
});

test('Game composes atmosphere and skill feedback before its final danger overlay',()=>{
 const order=[],originalCombat=window.HUNTER_COMBAT,originalFeedback=window.HUNTER_FEEDBACK,originalScene=window.HUNTER_SCENE;
 window.HUNTER_COMBAT={...originalCombat,render(context,input){order.push({kind:'cues',context,input});return originalCombat.render(context,input);}};
 window.HUNTER_FEEDBACK={...originalFeedback,render(canvas,input){order.push({kind:'feedback',input});return originalFeedback.render(canvas,input);}};
 window.HUNTER_SCENE={...originalScene,atmosphere(context,input){order.push({kind:'atmosphere'});return originalScene.atmosphere(context,input);}};
 try{
  for(const world of [false,true]){
   start();if(world){g.enterWorld('forest');g.closeModal('playing');}g.enemies.length=0;enemy('slam');order.length=0;
   g.draw();g.drawFeedback(.016);const names=order.map(v=>v.kind);assert.equal(names.at(-1),'cues');assert.ok(names.indexOf('feedback')<names.indexOf('cues'));if(world)assert.ok(names.indexOf('atmosphere')<names.indexOf('feedback'));
   assert.ok(order.find(v=>v.kind==='feedback').input.occluders.length>=1,'Feedback receives character readability masks');
   for(const phase of ['paused','intro','settlement','end']){g.state.phase=phase;order.length=0;g.drawFeedback(.016);assert.ok(!order.some(v=>v.kind==='cues'),'No stale overlay in '+phase);}
  }
 }finally{window.HUNTER_COMBAT=originalCombat;window.HUNTER_FEEDBACK=originalFeedback;window.HUNTER_SCENE=originalScene;}
});

test('Overlay projection matches skill feedback through view range, DPR and low effects',()=>{
 const originalCombat=window.HUNTER_COMBAT,originalFeedback=window.HUNTER_FEEDBACK;let projection,feedbackView;
 window.HUNTER_COMBAT={...originalCombat,render(context,input){projection={transform:context.snapshot().transform,input};return originalCombat.render(context,input);}};
 window.HUNTER_FEEDBACK={...originalFeedback,render(canvas,input){feedbackView=input;return originalFeedback.render(canvas,input);}};
 try{
  start();g.enterWorld('forest');g.closeModal('playing');g.enemies.length=0;const e=enemy('shot',{x:g.player.x+700,y:g.player.y,type:'archer'});
  for(const range of [50,100,200])for(const rich of [false,true])for(const dpr of [1,2]){
   window.devicePixelRatio=dpr;g.updateReleaseSettings({atmosphere:rich,shake:false});g.setViewRange(range);g.updateCamera(0,true);g.draw();g.drawFeedback(.016);
   const [a,b,c,d,tx,ty]=projection.transform,overlay=el('feedback-canvas');
   for(const point of [g.player,e,e.target]){const feedbackPoint=feedbackView.screenPoint(point);close((a*point.x+c*point.y+tx)/overlay.width,feedbackPoint.x);close((b*point.x+d*point.y+ty)/overlay.height,feedbackPoint.y);}
   close(projection.input.scale,el('game').clientWidth/g.camera.w);assert.ok(projection.input.cues.some(c=>c.enemy===e),'Offscreen shooter still supplies the incoming attack direction');
  }
 }finally{window.HUNTER_COMBAT=originalCombat;window.HUNTER_FEEDBACK=originalFeedback;window.devicePixelRatio=1;}
});

test('Feedback gently clears character silhouettes after bright skill effects',()=>{
 const fx=window.HUNTER_FEEDBACK,canvas=el('feedback-canvas');fx.clear();fx.emit('cast',{skill:'fire',x:600,y:390,angle:0,color:'#ff0000'});
 const occluders=deepFreeze([{x:600,y:390,rx:22,ry:32,offsetY:-18}]),before=JSON.stringify(occluders);
 capture(()=>fx.render(canvas,{dt:.02,screenPoint:p=>({x:p.x/1200,y:p.y/780}),player:{x:600,y:390},phase:'playing',capture:0,rich:true,dpr:1,scale:1,occluders}));
 const mask=paints().filter(v=>v.state.globalCompositeOperation==='destination-out');assert.ok(mask.length,'Character overlap has a clearing pass');
 assert.equal(JSON.stringify(occluders),before);assert.equal(canvas.getContext().globalCompositeOperation,'source-over','Mask composition cannot leak');
});

test('Warning labels cannot cover enemy health and pressure bars',()=>{
 for(const scale of [.5,1,2])for(const attack of ['lunge','shot','slam','lantern']){
  start();const e=enemy(attack,{x:600,y:600,hp:40,maxHp:68});
  const draws=capture(()=>combat.render(ctx,view({enemies:[e],cues:[cue(e)],scale})));
  const labels=draws.filter(r=>r.op==='fillRect'&&r.state.fillStyle==='#07151ff0');assert.equal(labels.length,1);
  const bar={x:e.x-20,y:e.y-e.r-29,w:40,h:10};
  for(const box of labels){const [x,y,w,h]=box.args;assert.ok(x+w<=bar.x||x>=bar.x+bar.w||y+h<=bar.y||y>=bar.y+bar.h,'Warning must not hide health or pressure');}
 }
});

test('Wolf trail endpoint matches world position in a nonuniform practice canvas',()=>{
 const canvas=el('feedback-canvas'),fx=window.HUNTER_FEEDBACK,oldSize={w:canvas.clientWidth,h:canvas.clientHeight};
 try{
  canvas.clientWidth=900;canvas.clientHeight=390;
  for(const dpr of [1,2]){
   fx.clear();fx.emit('cast',{skill:'wolf',x:600,y:390,tx:760,ty:510});
   const draws=capture(()=>fx.render(canvas,{dt:.02,screenPoint:p=>({x:p.x/1200,y:p.y/780}),player:{x:600,y:390},phase:'playing',capture:0,rich:true,dpr,scale:.75,scaleY:.5}));
   const central=draws.find(r=>r.op==='stroke'&&r.state.strokeStyle==='#dafff1'&&r.state.lineWidth===3);assert.ok(central);
   const end=central.path.find(p=>p.op==='lineTo').args,[a,b,c,d,x,y]=central.state.transform;
   close(a*end[0]+c*end[1]+x,760*.75*dpr);close(b*end[0]+d*end[1]+y,510*.5*dpr);
  }
 }finally{canvas.clientWidth=oldSize.w;canvas.clientHeight=oldSize.h;fx.clear();}
});

console.log(`Combat clarity: ${passed} regression groups passed.`);
