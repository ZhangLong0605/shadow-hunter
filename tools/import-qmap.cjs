/* Import the authored five-map theme without modifying its design source. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../QMap');
let data=fs.readFileSync(path.join(source,'q-map-data.js'),'utf8');
data=data.replace('return {width, height, regions, sites, charms, bridges, walls, terrain, paths, packs, variants,',`const riverWalls=[];
  let edge=0;
  for(const bridge of [...bridges, (river.vertical?height:width)+120]){
   const end=bridge-120;
   if(end>edge)riverWalls.push(river.vertical?{x:river.x,y:edge,w:river.w,h:end-edge,kind:'river'}:{x:edge,y:river.y,w:end-edge,h:river.h,kind:'river'});
   edge=bridge+120;
  }
  sites.forEach(s=>s.symbol=({camp:'⌂',herd:'♧',fish:'≈',rhythm:'♫',puzzle:'◇',boss:'♛',gather:'✿',escort:'➤',race:'⚑',dig:'⛏',water:'❀',bubble:'◉'})[s.kind]);
  const safeWalls=walls.filter(w=>![...sites,...charms].some(s=>Math.hypot(Math.max(w.x-s.x,0,s.x-w.x-w.w),Math.max(w.y-s.y,0,s.y-w.y-w.h))<310));
  const make=create;
  function runtimeCreate(){const v=make();v.props.forEach(p=>p.kind=world.decor);v.rocks=v.rocks.filter(r=>![...sites,...charms].some(s=>Math.hypot(s.x-r.x,s.y-r.y)<330));return v;}
  return {id:world.id, name:world.name, decor:world.decor, discoveries:[], width, height, regions, sites, charms, bridges, walls:[...safeWalls,...riverWalls], terrain, paths, packs, variants,`);
data=data.replace('create, drawGround};','create:runtimeCreate, drawGround};');
data=data.replace('for(const w of walls){\n    g.fillStyle', 'for(const w of safeWalls){\n    g.fillStyle');
if(!data.includes('function runtimeCreate()'))throw Error('QMap import anchor changed');
fs.writeFileSync(path.join(root,'dist/q-map-data.js'),data);
const manifest=JSON.parse(fs.readFileSync(path.join(source,'ObjectDesign/manifest.json'),'utf8'));
fs.mkdirSync(path.join(root,'dist/assets/qmap'),{recursive:true});
for(const entry of manifest)fs.copyFileSync(path.join(source,'ObjectDesign',entry.svg.replace(/\.svg$/,'.png')),path.join(root,'dist/assets/qmap',entry.id+'.png'));
fs.writeFileSync(path.join(root,'dist/q-object-art.js'),`/* Original ObjectDesign PNGs. */
window.HUNTER_Q_ART=(()=>{
 const sources=${JSON.stringify(Object.fromEntries(manifest.map(e=>[e.id,'assets/qmap/'+e.id+'.png'])),null,2)};
 const images={};
 function draw(g,id,x,y,size=100){
  if(!sources[id])return false;
  if(!images[id]){const im=new Image();im.src=sources[id];images[id]=im;}
  const im=images[id];if(!im.complete||!im.naturalWidth)return false;
  g.drawImage(im,x-size/2,y-size*.88,size,size);return true;
 }
 return {sources,draw};
})();\n`);
console.log('Imported 5 maps / 25 regions / 67 activities / 33 original PNGs.');
