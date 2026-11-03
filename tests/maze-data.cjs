'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/maze-data.js'),'utf8'),{window,Date});
const maze=window.HUNTER_MAZE;
for(const density of [1,2,6]){
 const map=maze.generate(31,21,density,7781,5),walls=new Set(map.walls),reachable=maze.distancesFrom(map.start,walls,map.width,map.height);
 assert.ok(reachable.has(map.goal.join(',')),'generated route remains connected');
 assert.equal(map.enemies.length,5);assert.ok(map.enemies.every(p=>reachable.has(p.join(','))));assert.ok(map.enemies.every(p=>!walls.has(p.join(','))));
 assert.deepEqual(maze.generate(31,21,density,7781,5),map,'fixed seeds are reproducible');
}
const map=maze.generate(31,21,2,3,1),easy=maze.state(map,'easy'),hard=maze.state(map,'hard');
assert.equal(easy.enemies.length,1);assert.equal(hard.enemies.length,1);
const start=[...easy.player];let step=null;for(const [key,delta] of Object.entries(maze.directions)){if(!key.startsWith('Arrow'))continue;const next=[start[0]+delta[0],start[1]+delta[1]];if(!map.walls.includes(next.join(','))){step=delta;break;}}
assert.ok(step,'start has at least one legal move');maze.move(easy,step);maze.move(hard,step);assert.equal(easy.moves,1);assert.equal(hard.moves,1);
const goalState=maze.state({...map,start:[...map.goal],goal:[...map.goal],enemies:[]});goalState.player=[map.goal[0],map.goal[1]-1];maze.move(goalState,[0,1]);assert.ok(goalState.won);
const loss=maze.state({...map,enemies:[[map.start[0],map.start[1]+1]]});maze.move(loss,[0,1]);assert.ok(loss.lost);
console.log('Maze generation, connectivity, deterministic seeds, difficulty-driven pursuit and outcomes passed.');
