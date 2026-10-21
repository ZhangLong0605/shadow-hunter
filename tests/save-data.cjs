'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
for (const name of ['expedition-data.js', 'journey-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist', name), 'utf8'), context);
}
const expedition = context.window.HUNTER_EXPEDITION;
const journey = context.window.HUNTER_JOURNEY;
const shadowIds = ['wolf', 'fire', 'shield', 'giant', 'ghost', 'archer', 'mirror', 'swarm'];
const plain = value => JSON.parse(JSON.stringify(value));

function checkpoint() {
  // Version 0.5 camp saves predate journey data and omit optional scout flags
  // on ordinary enemies. Keep that on-disk shape as the compatibility fixture.
  return {
    version: 1, savedAt: 1792022400000,
    checkpoint: {
      run: {
        owned: ['wolf', 'fire', 'mirror'], slots: ['wolf', 'fire', 'mirror'],
        levels: Object.fromEntries(shadowIds.map(id => [id, 0])),
        xp: Object.fromEntries(shadowIds.map(id => [id, 0])),
        weapon: 'blade', stored: null, locked: false,
        time: 123.25, kills: 0, captures: 0, hits: 0, corruption: 0, nightmare: 0
      },
      player: { x: 520, y: 2010, hp: 100, focus: 0 },
      completed: [], restCharges: 1,
      enemies: [{
        id: 'forest-wolf', type: 'wolf', variant: null, x: 760, y: 1020,
        home: { x: 760, y: 1020 }, hp: 68, maxHp: 68,
        pressure: 56, maxPressure: 56, r: 16, dead: false, elite: false,
        cd: 1.5, telegraph: 0, exposed: 0, burn: 0, bleed: 0, hit: 0,
        slow: 0, dash: 0, dx: 0, dy: 0, trail: 0, facing: 1.57, patrol: 0.2
      }]
    },
    world: { visited: ['forest'], claimed: [], seen: [], trailCaptured: false, track: 'trail-cache' }
  };
}

function memory() {
  const values = new Map();
  return {
    values,
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value)
  };
}

function changed(change) {
  const data = checkpoint();
  change(data);
  return data;
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

test('Legacy camps and current journey data roundtrip without changing resources', () => {
  for (const data of [checkpoint(), changed(s => {
    s.checkpoint.run.journey = { perks: ['ward', 'clarity'], flasks: 1, bestStreak: 8 };
    s.checkpoint.run.slots = ['wolf', 'wolf', 'wolf'];
    s.checkpoint.run.stored = 'ghost';
    s.checkpoint.run.locked = true;
    s.checkpoint.run.corruption = 25;
    s.checkpoint.completed = ['defend'];
  })]) {
    const storage = memory();
    assert.equal(expedition.valid(data), true);
    assert.equal(expedition.write(storage, data), true);
    const saved = expedition.read(storage);
    assert.equal(saved.status, 'ready');
    assert.deepEqual(plain(saved.data), data);
    const normalized = journey.normalize(saved.data.checkpoint.run.journey);
    assert.equal(normalized.flasks, data.checkpoint.run.journey ? 1 : 2);
  }
  // Keep previously accepted in-progress nightmare checkpoints loadable.
  assert.equal(expedition.valid(changed(s => { s.checkpoint.run.nightmare = 3.75; })), true);
});

test('A living hunter below one HP can save; zero and invalid health cannot', () => {
  for (const hp of [0.05, 0.999, 1, 100]) {
    const storage = memory();
    assert.equal(expedition.write(storage, changed(s => { s.checkpoint.player.hp = hp; })), true);
    assert.equal(expedition.read(storage).data.checkpoint.player.hp, hp);
  }
  for (const hp of [0, -0.1, 100.1, NaN, Infinity, '0.5']) {
    assert.equal(expedition.valid(changed(s => { s.checkpoint.player.hp = hp; })), false);
  }
});

test('Missing storage, corrupt JSON, incompatible data and inaccessible storage stay distinct', () => {
  const storage = memory();
  assert.equal(expedition.read(storage).status, 'empty');
  for (const raw of ['', '{broken', 'null', 'false', '[]', '1e999', JSON.stringify({ ...checkpoint(), version: 99 }), ' '.repeat(200001)]) {
    storage.setItem(expedition.key, raw);
    assert.equal(expedition.read(storage).status, 'invalid', raw.slice(0, 30));
  }
  for (const unavailable of [null, {}, { getItem() { throw Error('SecurityError'); } }]) {
    assert.equal(expedition.read(unavailable).status, 'unavailable');
  }
});

test('Unknown enemy references and variant/type mismatches cannot become a resumed entity', () => {
  for (const [variant, type] of [['cinder', 'fire'], ['stalker', 'ghost'], ['sentinel', 'shield']]) {
    assert.equal(expedition.valid(changed(s => { Object.assign(s.checkpoint.enemies[0], { variant, type }); })), true);
    assert.equal(expedition.valid(changed(s => { s.checkpoint.enemies[0].variant = variant; })), false);
  }
  for (const variant of ['missing', '__proto__', 'constructor', ['cinder'], { toString: null, valueOf: null }]) {
    assert.equal(expedition.valid(changed(s => { s.checkpoint.enemies[0].variant = variant; })), false);
  }
  for (const type of ['missing', '__proto__', null]) {
    assert.equal(expedition.valid(changed(s => { s.checkpoint.enemies[0].type = type; })), false);
  }
});

test('Scouts cannot load into an unattackable and uncapturable negative exposure state', () => {
  const scout = changed(s => { Object.assign(s.checkpoint.enemies[0], { type: 'archer', scout: true, exposed: 7 }); });
  assert.equal(expedition.valid(scout), true);
  scout.checkpoint.enemies[0].exposed = -0.01;
  assert.equal(expedition.valid(scout), false);
  scout.checkpoint.enemies[0].dead = true;
  assert.equal(expedition.valid(scout), true, 'dead enemies may retain an expired timer in older checkpoints');
  scout.checkpoint.enemies[0].scout = 'true';
  assert.equal(expedition.valid(scout), false);
});

test('Sparse collections and non-record stats are rejected before JSON can drop their fields', () => {
  for (const mutate of [
    s => { delete s.checkpoint.run.slots[1]; },
    s => { s.world.visited = new Array(1); },
    s => { s.checkpoint.completed = new Array(1); },
    s => { s.checkpoint.run.levels = Object.assign([], s.checkpoint.run.levels); },
    s => { s.checkpoint.run.xp = Object.assign([], s.checkpoint.run.xp); },
    s => { s.checkpoint.enemies.push(plain(s.checkpoint.enemies[0])); },
    s => { s.checkpoint.run.slots[0] = 'archer'; }
  ]) {
    const data = changed(mutate);
    assert.equal(expedition.valid(data), false);
    assert.equal(expedition.write(memory(), data), false);
  }
});

test('Failed serialization, oversize saves and storage quota errors preserve the last good camp', () => {
  const storage = memory();
  assert.equal(expedition.write(storage, checkpoint()), true);
  const original = storage.getItem(expedition.key);
  for (const mutate of [
    s => { s.extra = 'x'.repeat(200000); },
    s => { s.extra = 1n; },
    s => { s.extra = s; },
    s => { s.toJSON = () => ({ version: 999 }); }
  ]) {
    assert.equal(expedition.write(storage, changed(mutate)), false);
    assert.equal(storage.getItem(expedition.key), original);
    assert.equal(expedition.read(storage).status, 'ready');
  }
  const unavailable = { ...storage, setItem() { throw Error('QuotaExceededError'); } };
  assert.equal(expedition.write(unavailable, checkpoint()), false);
  assert.equal(storage.getItem(expedition.key), original);
});

console.log(`Camp save rules: ${passed} groups passed.`);
