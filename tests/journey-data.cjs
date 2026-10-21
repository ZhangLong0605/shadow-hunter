'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist/journey-data.js'), 'utf8'), context);
const journey = context.window.HUNTER_JOURNEY;
const plain = value => JSON.parse(JSON.stringify(value));
const defaults = {
  perks: [], flasks: 2, maxFlasks: 2, flaskCd: 0,
  recall: 0, streak: 0, streakTime: 0, bestStreak: 0
};

assert.deepEqual(plain(journey.create()), defaults);
const fresh = journey.create();
fresh.perks.push('keen');
assert.equal(journey.create().perks.length, 0, 'new journeys must not share arrays');
assert.equal(journey.perks.length, 6);
assert.equal(new Set(journey.perks.map(perk => perk.id)).size, 6);
for (const perk of journey.perks) {
  for (const key of ['id', 'name', 'symbol', 'description']) assert.equal(typeof perk[key], 'string');
}

for (const invalid of [undefined, null, false, 5, 'bad', [], {}]) {
  assert.deepEqual(plain(journey.normalize(invalid)), defaults, 'old or invalid save should use defaults');
}
const raw = {
  perks: ['keen', 'keen', 'arcane', 'unknown', null, {}, '__proto__', 'renewal'],
  flasks: 1.9, maxFlasks: 999, flaskCd: 50, recall: 12,
  streak: 20, streakTime: 4, bestStreak: 35.8, unrelated: 'discard'
};
const before = JSON.stringify(raw);
assert.deepEqual(plain(journey.normalize(raw)), {
  ...defaults, perks: ['keen', 'arcane', 'renewal'], flasks: 1, bestStreak: 35
});
assert.equal(JSON.stringify(raw), before, 'normalization must not alter source save');
for (const value of [NaN, Infinity, -Infinity, '1', null, true, {}, []]) {
  const normalized = journey.normalize({ perks: value, flasks: value, bestStreak: value });
  assert.deepEqual(plain(normalized), defaults, 'invalid field types must not be coerced');
}
assert.equal(journey.normalize({ flasks: -9 }).flasks, 0);
assert.equal(journey.normalize({ flasks: 9 }).flasks, 2);
assert.equal(journey.normalize({ bestStreak: -9 }).bestStreak, 0);
assert.equal(journey.normalize({ bestStreak: 1e100 }).bestStreak, Number.MAX_SAFE_INTEGER);

const allIds = journey.perks.map(perk => perk.id);
for (let stage = 1; stage <= 12; stage++) {
  const owned = Object.freeze(['keen', 'keen', 'invalid']);
  const options = journey.offers(owned, stage);
  const optionIds = options.map(perk => perk.id);
  assert.equal(options.length, 3);
  assert.equal(new Set(optionIds).size, 3);
  assert.ok(optionIds.every(id => id !== 'keen' && allIds.includes(id)));
  assert.deepEqual(plain(options), plain(journey.offers(owned, stage)), 'offers must be deterministic');
}
assert.notDeepEqual(plain(journey.offers([], 1)), plain(journey.offers([], 2)), 'stage should rotate offers');
assert.deepEqual(plain(journey.offers(allIds, 4)), []);
assert.deepEqual(plain(journey.offers(allIds.slice(0, 5), 4)).map(perk => perk.id), ['renewal']);
assert.equal(journey.offers(allIds.slice(0, 4), 1).length, 2);
for (const invalid of [undefined, null, NaN, Infinity, '2', -5]) {
  assert.deepEqual(plain(journey.offers(null, invalid)), plain(journey.offers([], 1)));
}

const baseline = { attack: 1, skill: 1, incoming: 1, dash: 1, corruption: 0, heal: 0, focus: 0 };
assert.deepEqual(plain(journey.modifiers()), baseline);
assert.deepEqual(plain(journey.modifiers(['unknown', '__proto__'])), baseline);
const expected = {
  keen: { attack: 1.18 }, arcane: { skill: 1.18 }, ward: { incoming: 0.85 },
  stride: { dash: 0.8 }, clarity: { corruption: -2 }, renewal: { heal: 15, focus: 3 }
};
for (const [id, effect] of Object.entries(expected)) {
  assert.deepEqual(plain(journey.modifiers([id, id])), { ...baseline, ...effect }, 'duplicate perks must not stack');
}
assert.deepEqual(plain(journey.modifiers(allIds)), {
  attack: 1.18, skill: 1.18, incoming: 0.85, dash: 0.8, corruption: -2, heal: 15, focus: 3
});
console.log('Journey rules: all checks passed.');
