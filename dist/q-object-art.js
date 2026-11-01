/* Original ObjectDesign PNGs. */
window.HUNTER_Q_ART=(()=>{
 const sources={
  "camp-tent": "assets/qmap/camp-tent.png",
  "camp-fire": "assets/qmap/camp-fire.png",
  "camp-lantern": "assets/qmap/camp-lantern.png",
  "sheep": "assets/qmap/sheep.png",
  "star-fish": "assets/qmap/star-fish.png",
  "fishing-rod": "assets/qmap/fishing-rod.png",
  "float-bobber": "assets/qmap/float-bobber.png",
  "sugar-flower": "assets/qmap/sugar-flower.png",
  "honey-windmill": "assets/qmap/honey-windmill.png",
  "candy-block": "assets/qmap/candy-block.png",
  "mirror-frame": "assets/qmap/mirror-frame.png",
  "candy-tree": "assets/qmap/candy-tree.png",
  "candy-fruit": "assets/qmap/candy-fruit.png",
  "chick": "assets/qmap/chick.png",
  "chicken-coop": "assets/qmap/chicken-coop.png",
  "finish-flag": "assets/qmap/finish-flag.png",
  "shovel": "assets/qmap/shovel.png",
  "treasure-jar": "assets/qmap/treasure-jar.png",
  "flower": "assets/qmap/flower.png",
  "watering-can": "assets/qmap/watering-can.png",
  "bubble-mob": "assets/qmap/bubble-mob.png",
  "nightmare-marshmallow": "assets/qmap/nightmare-marshmallow.png",
  "mob-bunny": "assets/qmap/mob-bunny.png",
  "mob-drop": "assets/qmap/mob-drop.png",
  "mob-bee": "assets/qmap/mob-bee.png",
  "mob-giant": "assets/qmap/mob-giant.png",
  "mob-mirror": "assets/qmap/mob-mirror.png",
  "mob-ghost": "assets/qmap/mob-ghost.png",
  "mob-nightmare": "assets/qmap/mob-nightmare.png",
  "hero-shadow-hunter": "assets/qmap/hero-shadow-hunter.png",
  "hero-shadow-hunter-f": "assets/qmap/hero-shadow-hunter-f.png",
  "star-candy": "assets/qmap/star-candy.png",
  "sugar-shard": "assets/qmap/sugar-shard.png"
};
 const images={};
 function draw(g,id,x,y,size=100){
  if(!sources[id])return false;
  if(!images[id]){const im=new Image();im.src=sources[id];images[id]=im;}
  const im=images[id];if(!im.complete||!im.naturalWidth)return false;
  g.drawImage(im,x-size/2,y-size*.88,size,size);return true;
 }
 return {sources,draw};
})();
