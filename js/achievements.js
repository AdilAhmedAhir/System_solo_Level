/* ── achievements.js — Titles & Achievement System ─────────────────── */
window.Achievements = (() => {

  function avgLevel(S) {
    if (!S.stats || S.stats.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < S.stats.length; i++) sum += S.stats[i].level;
    return sum / S.stats.length;
  }

  function allStatsMin(S, minLvl) {
    if (!S.stats) return false;
    return S.stats.every(s => s.level >= minLvl);
  }

  const TITLES = [
    { id: 'player',          name: 'Player',              icon: '🎮', desc: 'Begin your journey',         condition: () => true },
    { id: 'first_blood',     name: 'First Blood',         icon: '🗡️', desc: 'Complete your first quest',   condition: S => S.log.length > 0 || S.quests.some(q => q.done) },
    { id: 'iron_will',       name: 'Iron Will',           icon: '🔥', desc: 'Maintain a 7-day streak',     condition: S => S.streak >= 7 || S.best >= 7 },
    { id: 'unbreakable',     name: 'Unbreakable',         icon: '⛓️', desc: 'Maintain a 30-day streak',    condition: S => S.streak >= 30 || S.best >= 30 },
    { id: 'the_indomitable', name: 'The Indomitable',     icon: '👑', desc: 'Maintain a 90-day streak',    condition: S => S.streak >= 90 || S.best >= 90 },
    { id: 'gate_breaker',    name: 'Gate Breaker',        icon: '🚪', desc: 'Defeat your first boss',      condition: S => S.shadowArmy.length >= 1 },
    { id: 'raid_leader',     name: 'Raid Leader',         icon: '⚔️', desc: 'Defeat 5 bosses',             condition: S => S.shadowArmy.length >= 5 },
    { id: 'shadow_monarch',  name: 'Shadow Monarch',      icon: '👤', desc: 'Reach S-Rank',                condition: S => avgLevel(S) >= 20 },
    { id: 'awakened',        name: 'Awakened One',         icon: '✨', desc: 'All stats Level 5+',          condition: S => allStatsMin(S, 5) },
    { id: 'monarch',         name: 'Monarch of Shadows',  icon: '🌑', desc: 'All stats Level 10+',         condition: S => allStatsMin(S, 10) },
    { id: 'd_rank',          name: 'D-Rank Hunter',       icon: '🟢', desc: 'Reach D-Rank',                condition: S => avgLevel(S) >= 3 },
    { id: 'c_rank',          name: 'C-Rank Hunter',       icon: '🔵', desc: 'Reach C-Rank',                condition: S => avgLevel(S) >= 6 },
    { id: 'b_rank',          name: 'B-Rank Hunter',       icon: '🟣', desc: 'Reach B-Rank',                condition: S => avgLevel(S) >= 10 },
    { id: 'a_rank',          name: 'A-Rank Hunter',       icon: '🟡', desc: 'Reach A-Rank',                condition: S => avgLevel(S) >= 15 },
    { id: 'century',         name: 'Century',             icon: '💯', desc: 'Log 100 days',                condition: S => S.log.length >= 100 },
  ];

  /* Check all titles, unlock new ones, toast & return newly unlocked IDs */
  function check(S) {
    const newly = [];
    TITLES.forEach(t => {
      if (S.unlockedTitles.indexOf(t.id) === -1 && t.condition(S)) {
        S.unlockedTitles.push(t.id);
        newly.push(t.id);
        if (window.Engine && Engine.toast) {
          Engine.toast('🏆 Title unlocked: ' + t.name);
        }
      }
    });
    return newly;
  }

  /* Return TITLE objects that are unlocked */
  function getUnlocked(S) {
    return TITLES.filter(t => S.unlockedTitles.indexOf(t.id) !== -1);
  }

  /* Return the active TITLE object */
  function getActive(S) {
    const active = TITLES.find(t => t.id === S.activeTitle);
    return active || TITLES[0];
  }

  /* Render achievements into a container */
  function renderAchievements(containerId, S) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const unlocked = S.unlockedTitles || [];

    /* sort: unlocked first */
    const sorted = TITLES.slice().sort((a, b) => {
      const aU = unlocked.indexOf(a.id) !== -1 ? 0 : 1;
      const bU = unlocked.indexOf(b.id) !== -1 ? 0 : 1;
      return aU - bU;
    });

    sorted.forEach(t => {
      const isUnlocked = unlocked.indexOf(t.id) !== -1;
      const isActive = S.activeTitle === t.id;
      const div = document.createElement('div');
      div.className = 'achievement' + (isUnlocked ? '' : ' locked') + (isActive ? ' active' : '');

      const icon = document.createElement('span');
      icon.className = 'ach-icon';
      icon.textContent = isUnlocked ? t.icon : '🔒';

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:2px;';

      const name = document.createElement('span');
      name.className = 'ach-name';
      name.textContent = t.name;

      const desc = document.createElement('span');
      desc.className = 'ach-desc';
      desc.textContent = t.desc;

      info.appendChild(name);
      info.appendChild(desc);
      div.appendChild(icon);
      div.appendChild(info);

      if (isActive) {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:0.6rem;color:#f59e0b;font-weight:700;letter-spacing:0.1em;';
        badge.textContent = 'ACTIVE';
        div.appendChild(badge);
      }

      if (isUnlocked && !isActive) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          Engine.S.activeTitle = t.id;
          Engine.save();
          renderAchievements(containerId, Engine.S);
        });
      }

      container.appendChild(div);
    });
  }

  return { TITLES, check, getUnlocked, getActive, renderAchievements };
})();
