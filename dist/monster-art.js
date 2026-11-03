/* Per-enemy appearance preferences and rendering, independent of combat/save data. */
'use strict';
window.HUNTER_MONSTERS=(()=>{
 const catalog=window.HUNTER_MONSTER_CATALOG||[],key='shadow-hunter-monster-appearances-v1';
 const styles=['standard','soft','original'],byId=new Map(catalog.map(e=>[e.id,e])),sprites=new Map();
 const clean=value=>Object.fromEntries(catalog.map(e=>[e.id,styles.includes(value?.[e.id])?value[e.id]:'standard']));
 let choices=clean(null);
 try{choices=clean(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
 function entryFor(enemy,world='forest'){
  if(enemy.boss)return catalog.find(e=>e.world===world)||catalog.find(e=>e.world&&e.type===enemy.type);
  if(enemy.variant){const match=catalog.find(e=>e.variant===enemy.variant);if(match)return match;}
  return byId.get('mob-'+enemy.type);
 }
 function source(id,style=choices[id]){const e=byId.get(id);return e&&['standard','soft'].includes(style)?e[style]:null;}
 function imageFor(src){
  if(!src||typeof window.Image!=='function')return null;
  if(!sprites.has(src)){const image=new window.Image();image.src=src;sprites.set(src,image);}
  return sprites.get(src);
 }
 function apply(value){
  choices=clean(value);for(const e of catalog)imageFor(source(e.id));
  try{localStorage.setItem(key,JSON.stringify(choices));return true;}catch{return false;}
 }
 function size(e){return e.boss?204:e.type==='giant'?142:e.elite?136:118;}
 function height(e,world){const entry=entryFor(e,world);return entry&&source(entry.id)?size(e)*.78:0;}
 function labelY(e,world){return e.y-Math.max(0,height(e,world)-e.r-22);}
 function draw(g,e,player,time,world='forest',animate=true){
  const entry=entryFor(e,world),sprite=entry&&imageFor(source(entry.id));
  if(!sprite?.complete||!sprite.naturalWidth)return false;
  const s=size(e),active=animate&&!e.exposed&&!e.stun;
  const walk=active&&(e.aggro||e.dash>0)?Math.sin(time*9+(e.patrol||0)):0;
  const direction=player.x<e.x?-1:1,lean=active&&e.telegraph>0?.06:walk*.018;
  g.save();g.translate(e.x,e.y+12-Math.abs(walk)*2);g.scale(direction,1);g.rotate(lean);
  g.imageSmoothingEnabled=true;g.drawImage(sprite,-s/2,-s*.88,s,s);g.restore();
  return true;
 }
 for(const e of catalog)imageFor(source(e.id));
 return {catalog,key,styles,entryFor,source,size,height,labelY,draw,apply,preferences:()=>({...choices})};
})();
