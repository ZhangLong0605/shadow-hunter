/* Shared journey rules. Loaded directly by the offline game. */
window.HUNTER_JOURNEY = (() => {
  'use strict';

  const perks = Object.freeze([
    Object.freeze({ id: 'keen', name: '锋锐猎刃', symbol: '刃', description: '普通攻击伤害提高 18%。' }),
    Object.freeze({ id: 'arcane', name: '暗影共鸣', symbol: '影', description: '影技伤害提高 18%。' }),
    Object.freeze({ id: 'ward', name: '月光护佑', symbol: '盾', description: '受到的伤害降低 15%。' }),
    Object.freeze({ id: 'stride', name: '轻灵步伐', symbol: '步', description: '闪避冷却时间缩短 20%。' }),
    Object.freeze({ id: 'clarity', name: '清明心志', symbol: '明', description: '每次施放 Q 影技少增加 2 点梦蚀。' }),
    Object.freeze({ id: 'renewal', name: '生息回流', symbol: '生', description: '药剂额外恢复 15 点生命，收割额外获得 3 点专注。' })
  ]);
  const ids = new Set(perks.map(perk => perk.id));
  const effects = {
    keen: { attack: 1.18 },
    arcane: { skill: 1.18 },
    ward: { incoming: 0.85 },
    stride: { dash: 0.8 },
    clarity: { corruption: -2 },
    renewal: { heal: 15, focus: 3 }
  };

  function validPerks(value) {
    return Array.isArray(value) ? [...new Set(value.filter(id => ids.has(id)))] : [];
  }

  function integer(value, fallback, min, max) {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, Math.floor(value)))
      : fallback;
  }

  function create() {
    return {
      perks: [], flasks: 2, maxFlasks: 2, flaskCd: 0,
      recall: 0, streak: 0, streakTime: 0, bestStreak: 0
    };
  }

  function normalize(raw) {
    const result = create();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    result.perks = validPerks(raw.perks);
    result.flasks = integer(raw.flasks, result.flasks, 0, result.maxFlasks);
    result.bestStreak = integer(raw.bestStreak, 0, 0, Number.MAX_SAFE_INTEGER);
    return result;
  }

  function offers(owned, stage) {
    const acquired = new Set(validPerks(owned));
    const offset = (integer(stage, 1, 1, Number.MAX_SAFE_INTEGER) - 1) % perks.length;
    return perks.slice(offset).concat(perks.slice(0, offset))
      .filter(perk => !acquired.has(perk.id)).slice(0, 3);
  }

  function modifiers(owned) {
    const result = { attack: 1, skill: 1, incoming: 1, dash: 1, corruption: 0, heal: 0, focus: 0 };
    for (const id of validPerks(owned)) Object.assign(result, effects[id]);
    return result;
  }

  return Object.freeze({ perks, create, normalize, offers, modifiers });
})();
