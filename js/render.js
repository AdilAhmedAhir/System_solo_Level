/* ════════════════════════════════════════════════════════════
   RENDER.JS — DOM Rendering · THE SYSTEM v3
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const { $, esc, RANK_COLORS } = Engine;

  let editMode = false;

  /* ── Difficulty helper ───────────────────────────────────── */
  function difficulty(xp) {
    if (xp < 25) return 'easy';
    if (xp <= 40) return 'medium';
    return 'hard';
  }

  /* ── Render Hero ─────────────────────────────────────────── */
  function renderHero() {
    const S = Engine.S;
    const pname = $('pname');
    if (pname && pname !== document.activeElement) pname.value = S.name;

    const r = Engine.rank();
    const rc = RANK_COLORS[r] || RANK_COLORS.E;

    const badge = $('rankBadge');
    if (badge) {
      badge.style.setProperty('--rank-color', rc);
      badge.style.borderColor = rc;
    }

    const rankR = $('rankR');
    if (rankR) {
      rankR.textContent = r;
      rankR.style.color = rc;
    }

    const hLevel = $('hLevel');
    if (hLevel) hLevel.textContent = Engine.sumLevel();

    const hXp = $('hXp');
    if (hXp) hXp.textContent = Engine.totalXp().toLocaleString();

    const hStreak = $('hStreak');
    if (hStreak) hStreak.textContent = S.streak;

    const hBest = $('hBest');
    if (hBest) hBest.textContent = S.best;

    const hShadows = $('hShadows');
    if (hShadows) hShadows.textContent = S.shadowArmy.length;

    const hTitle = $('hTitle');
    if (hTitle) {
      if (window.Achievements?.getActive) {
        const title = Achievements.getActive(S);
        hTitle.textContent = title.icon + ' ' + title.name;
      } else {
        const titleId = S.activeTitle || 'player';
        hTitle.textContent = titleId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }
  }

  /* ── Render Stats ────────────────────────────────────────── */
  function renderStats() {
    const S = Engine.S;
    const container = $('stats');
    if (!container) return;

    let html = '';
    S.stats.forEach(s => {
      const pct = Math.min(100, (s.xp / Engine.need(s.level)) * 100);
      html += `
        <div class="stat">
          <span class="st-icon">${s.icon}</span>
          <span class="st-name">${esc(s.name)}</span>
          <span class="st-lv">Lv ${s.level}</span>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <span class="st-xp">${s.xp}/${Engine.need(s.level)}</span>
          <div class="statctl">
            <button class="btn sm gho" data-act="estat" data-id="${s.id}">✏️</button>
            <button class="btn sm danger" data-act="dstat" data-id="${s.id}">✕</button>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  }

  /* ── Render Quests ───────────────────────────────────────── */
  function renderQuests() {
    const S = Engine.S;
    const container = $('quests');
    if (!container) return;

    const done = S.quests.filter(q => q.done).length;
    const total = S.quests.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const questPct = $('questPct');
    if (questPct) questPct.textContent = pct + '%';

    const qSub = $('qSub');
    if (qSub) qSub.textContent = `${done} / ${total} cleared`;

    // Draw quest ring if Charts available
    if (window.Charts?.drawQuestRing) {
      window.Charts.drawQuestRing('questRing', done, total);
    }

    let html = '';
    S.quests.forEach(q => {
      const diff = difficulty(q.xp);
      const doneClass = q.done ? ' done' : '';
      const statObj = S.stats.find(s => s.id === q.stat);
      const statLabel = statObj ? statObj.icon : '❓';

      html += `
        <div class="quest${doneClass}" data-diff="${diff}" data-act="tquest" data-id="${q.id}">
          <div class="qcheck">${q.done ? '✓' : ''}</div>
          <span class="qname">${esc(q.name)}</span>
          <span class="qxp">${statLabel} +${q.xp}</span>
          <div class="qedit">
            <button class="btn sm gho" data-act="equest" data-id="${q.id}" onclick="event.stopPropagation()">✏️</button>
            <button class="btn sm danger" data-act="dquest" data-id="${q.id}" onclick="event.stopPropagation()">✕</button>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  }

  /* ── Render Bosses ───────────────────────────────────────── */
  function renderBosses() {
    const S = Engine.S;
    const container = $('bosses');
    if (!container) return;

    if (S.bosses.length === 0) {
      container.innerHTML = '<p class="shadow-empty">No boss fights active. Add one to begin your raid.</p>';
      return;
    }

    let html = '';
    S.bosses.forEach(b => {
      if (b.done) return; // Skip defeated bosses (they're in shadowArmy)
      const hpPct = Math.max(0, 100 - b.progress);
      const statObj = S.stats.find(s => s.id === b.stat);
      const statLabel = statObj ? `${statObj.icon} ${statObj.name}` : b.stat;

      html += `
        <div class="boss">
          <div class="boss-name">👹 ${esc(b.name)}</div>
          <div class="boss-meta">Stat: ${statLabel} · Deadline: ${esc(b.deadline)}</div>
          <div class="boss-reward">🎁 ${esc(b.reward)}</div>
          <div class="boss-hp"><i style="width:${hpPct}%"></i></div>
          <div class="boss-controls">
            <input type="range" class="boss-slider" min="0" max="100" value="${b.progress}" data-act="bprog" data-id="${b.id}">
            <span class="mono" style="font-size:0.75rem;min-width:36px;text-align:right">${b.progress}%</span>
            <button class="btn sm pri" data-act="winboss" data-id="${b.id}">⚔️ Defeat</button>
            <button class="btn sm gho" data-act="eboss" data-id="${b.id}">✏️</button>
            <button class="btn sm danger" data-act="xboss" data-id="${b.id}">✕</button>
          </div>
        </div>`;
    });

    if (!html) {
      html = '<p class="shadow-empty">All bosses defeated! Add new ones.</p>';
    }
    container.innerHTML = html;
  }

  /* ── Render Shadow Army ──────────────────────────────────── */
  function renderShadows() {
    const S = Engine.S;
    const container = $('shadows');
    if (!container) return;

    if (!S.shadowArmy || S.shadowArmy.length === 0) {
      container.innerHTML = '<p class="shadow-empty">No shadows yet. Defeat a boss to extract its shadow.</p>';
      return;
    }

    let html = '';
    S.shadowArmy.forEach(s => {
      html += `
        <div class="shadow-soldier">
          <span class="ss-icon">👤</span>
          <span class="ss-name">${esc(s.name)}</span>
          <span class="ss-meta">${esc(s.defeatedDate)} · +${s.xpEarned} XP</span>
        </div>`;
    });
    container.innerHTML = html;
  }

  /* ── Render Log ──────────────────────────────────────────── */
  function renderLog() {
    const S = Engine.S;
    const container = $('log');
    if (!container) return;

    if (!S.log || S.log.length === 0) {
      container.innerHTML = '<p class="shadow-empty">No history yet. Complete your first day.</p>';
      return;
    }

    let html = '';
    const entries = S.log.slice(0, 10);
    entries.forEach(e => {
      const cls = e.pass ? 'pass' : 'fail';
      const icon = e.pass ? '✅' : '❌';
      html += `
        <div class="log-entry">
          <span class="le-date">${esc(e.date)}</span>
          <span class="le-result ${cls}">${icon} ${e.done}/${e.total}</span>
        </div>`;
    });
    container.innerHTML = html;
  }

  /* ── Full Render ─────────────────────────────────────────── */
  function render() {
    const S = Engine.S;

    // Hero
    renderHero();

    // Stats
    renderStats();

    // Quests
    renderQuests();

    // Bosses
    renderBosses();

    // Shadow Army
    renderShadows();

    // Log
    renderLog();

    // Edit mode class
    document.body.classList.toggle('editing', editMode);

    // Feature modules (optional, loaded async)
    try {
      if (window.Charts?.drawRadar) {
        window.Charts.drawRadar('radarChart', S.stats);
      }
      if (window.Charts?.drawWeekly) {
        window.Charts.drawWeekly('weeklyChart', S.log);
      }
      if (window.Charts?.drawHeatmap) {
        window.Charts.drawHeatmap('heatmap', S.log);
      }
      if (window.Achievements?.check) {
        window.Achievements.check(S);
      }
      if (window.Achievements?.renderAchievements) {
        window.Achievements.renderAchievements('achievements', S);
      }
    } catch (e) {
      console.warn('Feature module error:', e);
    }

    // Save state
    Engine.save();
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.Render = {
    get editMode() { return editMode; },
    set editMode(v) { editMode = v; },
    render
  };

})();
