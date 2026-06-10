/* ════════════════════════════════════════════════════════════
   ENGINE.JS — Core Game Engine · THE SYSTEM v3
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'sl_system_v3';
  const DAY = 86400000;

  /* ── Helpers ──────────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  };

  const daysBetween = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return Math.round(Math.abs(da - db) / DAY);
  };

  /* ── XP formula ──────────────────────────────────────────── */
  const need = (level) => 100 + (level - 1) * 50;

  /* ── Ranks ───────────────────────────────────────────────── */
  const RANKS = [['S', 20], ['A', 15], ['B', 10], ['C', 6], ['D', 3], ['E', 0]];
  const RANK_COLORS = {
    E: '#6b7280', D: '#22c55e', C: '#3b82f6',
    B: '#8b5cf6', A: '#f59e0b', S: '#ef4444'
  };

  /* ── Default State ───────────────────────────────────────── */
  function defaults() {
    const today = todayStr();
    return {
      version: 3,
      name: 'Hunter',
      created: today,
      lastReset: today,
      streak: 0,
      best: 0,
      updatedAt: Date.now(),
      awakened: false,
      activeTitle: 'player',
      unlockedTitles: ['player'],
      shadowArmy: [],
      notifyTime: null,
      stats: [
        { id: 'str', icon: '⚔️', name: 'Strength',     level: 1, xp: 0 },
        { id: 'vit', icon: '❤️', name: 'Vitality',      level: 1, xp: 0 },
        { id: 'int', icon: '🧠', name: 'Intelligence',  level: 1, xp: 0 },
        { id: 'per', icon: '👁️', name: 'Perception',    level: 1, xp: 0 },
        { id: 'cha', icon: '🗣️', name: 'Charisma',      level: 1, xp: 0 },
        { id: 'res', icon: '🛡️', name: 'Resolve',       level: 1, xp: 0 },
      ],
      quests: [
        { id: uid(), name: 'Train — 1h intense workout',              stat: 'str', xp: 35, done: false },
        { id: uid(), name: 'Deep Work — 2h focused creation',         stat: 'int', xp: 40, done: false },
        { id: uid(), name: 'Ship / Sell — 1 revenue or growth action',stat: 'per', xp: 35, done: false },
        { id: uid(), name: 'Skill Rep — 30m deliberate practice',     stat: 'int', xp: 25, done: false },
        { id: uid(), name: 'Strategic Outreach — 1 meaningful connection', stat: 'cha', xp: 30, done: false },
        { id: uid(), name: 'Sleep Protocol — 7h+ quality rest',       stat: 'vit', xp: 25, done: false },
        { id: uid(), name: 'Mind Reset — morning plan + no phone 1st hour', stat: 'res', xp: 20, done: false },
      ],
      bosses: (() => {
        const dl = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
        return [
          { id: uid(), name: 'Hit $____ monthly revenue',         stat: 'per', deadline: dl, progress: 0, reward: '+300 Perception XP · Level surge', done: false },
          { id: uid(), name: 'Body recomp target / strength PR',  stat: 'str', deadline: dl, progress: 0, reward: '+300 Strength XP', done: false },
          { id: uid(), name: 'Ship 1 leverage asset to market',   stat: 'int', deadline: dl, progress: 0, reward: '+300 Intelligence XP', done: false },
          { id: uid(), name: '90-day no-zero-day streak',          stat: 'res', deadline: dl, progress: 0, reward: '+500 Resolve XP · Rank up', done: false },
        ];
      })(),
      log: []
    };
  }

  /* ── Migration from v2 ───────────────────────────────────── */
  function migrate(data) {
    if (data.version === 3) return data;
    const idMap = { biz: 'per', hp: 'vit', wlt: 'per', skl: 'int', net: 'cha', dsc: 'res' };
    if (data.stats) {
      data.stats.forEach(s => {
        if (idMap[s.id]) s.id = idMap[s.id];
      });
      // Deduplicate if migration created duplicates — keep highest level
      const seen = {};
      data.stats = data.stats.filter(s => {
        if (seen[s.id]) {
          if (s.level > seen[s.id].level) { seen[s.id].level = s.level; seen[s.id].xp = s.xp; }
          return false;
        }
        seen[s.id] = s;
        return true;
      });
    }
    if (data.quests) {
      data.quests.forEach(q => {
        if (idMap[q.stat]) q.stat = idMap[q.stat];
      });
    }
    if (data.bosses) {
      data.bosses.forEach(b => {
        if (idMap[b.stat]) b.stat = idMap[b.stat];
      });
    }
    data.version = 3;
    if (!data.awakened && data.awakened !== false) data.awakened = true;
    if (!data.activeTitle) data.activeTitle = 'player';
    if (!data.unlockedTitles) data.unlockedTitles = ['player'];
    if (!data.shadowArmy) data.shadowArmy = [];
    if (!data.notifyTime) data.notifyTime = null;
    return data;
  }

  /* ── State ───────────────────────────────────────────────── */
  let S = {};

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        S = migrate(JSON.parse(raw));
      } else {
        S = defaults();
      }
    } catch (e) {
      console.error('Load failed, resetting', e);
      S = defaults();
    }
    return S;
  }

  function save() {
    S.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(S));
  }

  /* ── XP System ───────────────────────────────────────────── */
  function addXp(statId, amount) {
    const stat = S.stats.find(s => s.id === statId);
    if (!stat) return;
    stat.xp += amount;

    // Level up
    while (stat.xp >= need(stat.level)) {
      stat.xp -= need(stat.level);
      stat.level++;
      showLevelUp(stat.name, stat.level);
      toast(`${stat.icon} ${stat.name} reached Level ${stat.level}!`);
    }

    // Level down (penalty)
    while (stat.xp < 0 && stat.level > 1) {
      stat.level--;
      stat.xp += need(stat.level);
    }
    if (stat.xp < 0) stat.xp = 0;
  }

  /* ── Computed Stats ──────────────────────────────────────── */
  function totalXp() {
    return S.stats.reduce((sum, s) => sum + (s.level - 1) * 200 + s.xp, 0);
  }

  function sumLevel() {
    return S.stats.reduce((sum, s) => sum + s.level, 0);
  }

  function avgLevel() {
    return S.stats.length ? sumLevel() / S.stats.length : 1;
  }

  function rank() {
    const avg = avgLevel();
    for (const [r, min] of RANKS) {
      if (avg >= min) return r;
    }
    return 'E';
  }

  function nextRank() {
    const avg = avgLevel();
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (avg < RANKS[i][1]) {
        return `Avg Lv ${RANKS[i][1]} → Rank ${RANKS[i][0]}`;
      }
    }
    return 'MAX RANK';
  }

  /* ── Daily Rollover ──────────────────────────────────────── */
  function rollover() {
    const today = todayStr();
    if (S.lastReset === today) return;

    // Evaluate yesterday
    const done = S.quests.filter(q => q.done);
    const missed = S.quests.filter(q => !q.done);
    const allDone = missed.length === 0 && S.quests.length > 0;

    if (allDone) {
      S.streak++;
      if (S.streak > S.best) S.best = S.streak;
      showAlert('win', `🔥 All quests cleared! Streak: ${S.streak}`);
    } else if (missed.length > 0) {
      // Penalty: drain 75% of missed quest XP
      missed.forEach(q => {
        const penalty = -Math.round(q.xp * 0.75);
        addXp(q.stat, penalty);
      });
      S.streak = 0;
      showAlert('pen', `💀 ${missed.length} quest(s) failed. XP drained.`);
    }

    // Log the day
    S.log.unshift({
      date: S.lastReset,
      done: done.length,
      total: S.quests.length,
      pass: allDone
    });
    if (S.log.length > 90) S.log.length = 90;

    // Reset quests
    S.quests.forEach(q => q.done = false);
    S.lastReset = today;
    save();
  }

  /* ── UI Utilities ────────────────────────────────────────── */
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2500);
  }

  function showAlert(type, msg) {
    const el = $('alert');
    if (!el) return;
    el.className = 'alert on ' + type;
    el.textContent = msg;
  }

  let levelTimer = null;
  function showLevelUp(name, level) {
    const overlay = $('levelUpOverlay');
    const text = $('levelUpText');
    const sub = document.getElementById('levelUpSub');
    if (!overlay || !text) return;
    text.textContent = 'LEVEL UP';
    if (sub) sub.textContent = `${name} → Lv ${level}`;
    overlay.classList.add('on');
    clearTimeout(levelTimer);
    levelTimer = setTimeout(() => overlay.classList.remove('on'), 2200);
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.Engine = {
    get S() { return S; },
    set S(v) { S = v; },
    KEY, DAY,
    save, load, defaults,
    addXp, totalXp, sumLevel, avgLevel,
    rank, nextRank, need,
    rollover, todayStr, uid, daysBetween,
    $, esc, toast, showAlert, showLevelUp,
    RANKS, RANK_COLORS
  };

  // Initialize state
  load();

})();
