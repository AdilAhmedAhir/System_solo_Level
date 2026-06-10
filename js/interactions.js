/* ════════════════════════════════════════════════════════════
   INTERACTIONS.JS — Event Handlers & Boot · THE SYSTEM v3
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const { $, esc, uid, toast, save } = Engine;
  const S = Engine.S;

  /* ══════════════════════════════════════════════════════════
     Modal System
     ══════════════════════════════════════════════════════════ */
  let modalSaveFn = null;

  function modal(title, bodyHtml, saveFn) {
    $('mTitle').textContent = title;
    $('mBody').innerHTML = bodyHtml;
    modalSaveFn = saveFn;
    $('ov').classList.add('on');
    // Focus first input
    const firstInput = $('mBody').querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  function closeModal() {
    $('ov').classList.remove('on');
    modalSaveFn = null;
  }

  $('mCancel').addEventListener('click', closeModal);
  $('mSave').addEventListener('click', () => {
    if (modalSaveFn) modalSaveFn();
    closeModal();
    Engine.save();
    Render.render();
    window.Sync?.push?.();
  });

  // Close modal on overlay click
  $('ov').addEventListener('click', (e) => {
    if (e.target === $('ov')) closeModal();
  });

  /* ══════════════════════════════════════════════════════════
     Stat Options Builder
     ══════════════════════════════════════════════════════════ */
  function statOptions(selected) {
    return Engine.S.stats.map(s =>
      `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${s.icon} ${esc(s.name)}</option>`
    ).join('');
  }

  /* ══════════════════════════════════════════════════════════
     Event Delegation
     ══════════════════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    switch (act) {
      /* ── AI System Terminal ──────────────────────────── */
      case 'aisetkey': {
        modal('System AI Setting', `
          <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 12px;">Enter your free Google Gemini API Key to enable AI task generation.</div>
          <div class="fld"><label>Gemini API Key</label><input id="mApiKey" type="password" value="${window.AI ? window.AI.getKey() : ''}" placeholder="AIzaSy..."></div>
        `, () => {
          if (window.AI) window.AI.setKey(Engine.$('mApiKey').value);
          Engine.toast('🔑 System Admin Key updated');
        });
        break;
      }

      case 'aigenerate': {
        if (!window.AI || !window.AI.hasKey()) {
          Engine.toast('❌ API Key required. Click "API Key" to set it.');
          return;
        }
        
        const goal = Engine.$('aiGoal').value.trim();
        const deadline = Engine.$('aiDeadline').value.trim() || '7d';
        
        if (!goal) {
          Engine.toast('❌ Enter a Raid goal first.');
          return;
        }

        const loading = Engine.$('aiLoading');
        loading.style.display = 'block';
        Engine.$('aiGenerateBtn').disabled = true;

        window.AI.generateQuests(goal, deadline).then(quests => {
          loading.style.display = 'none';
          Engine.$('aiGenerateBtn').disabled = false;
          
          if (!Array.isArray(quests) || quests.length === 0) throw new Error('Invalid AI response');

          // Create the Boss/Raid
          const raidId = Engine.uid();
          const mainStat = quests[0]?.stat || 'int';
          
          Engine.S.bosses.unshift({
            id: raidId,
            name: goal,
            stat: mainStat,
            deadline: deadline,
            progress: 0,
            reward: '+' + (quests.length * 50) + ' ' + mainStat.toUpperCase() + ' XP',
            done: false
          });

          // Create the associated quests
          quests.forEach(q => {
            Engine.S.quests.unshift({
              id: Engine.uid(),
              name: '[RAID] ' + q.name,
              stat: q.stat || 'int',
              xp: q.xp || 25,
              done: false
            });
          });

          Engine.$('aiGoal').value = '';
          Engine.$('aiDeadline').value = '';
          
          Engine.save();
          Render.render();
          Engine.toast('⚡ Raid generated successfully!');
          window.Sync?.push?.();

        }).catch(err => {
          loading.style.display = 'none';
          Engine.$('aiGenerateBtn').disabled = false;
          Engine.toast('❌ ' + err.message);
        });

        break;
      }

      /* ── Toggle Quest ────────────────────────────────── */
      case 'tquest': {
        const q = Engine.S.quests.find(q => q.id === id);
        if (!q) return;
        q.done = !q.done;
        if (q.done) {
          Engine.addXp(q.stat, q.xp);
          toast(`✓ ${q.name} — +${q.xp} XP`);
        } else {
          Engine.addXp(q.stat, -q.xp);
          toast(`↩ ${q.name} undone`);
        }
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }

      /* ── Edit Mode Toggle ────────────────────────────── */
      case 'editmode': {
        Render.editMode = !Render.editMode;
        Render.render();
        break;
      }

      /* ── Add Quest ───────────────────────────────────── */
      case 'addquest': {
        modal('Add Quest', `
          <div class="fld"><label>Quest Name</label><input id="mqName" placeholder="Daily quest name"></div>
          <div class="fld"><label>Stat</label><select id="mqStat">${statOptions('str')}</select></div>
          <div class="fld"><label>XP Reward</label><input id="mqXp" type="number" value="25" min="1" max="500"></div>
        `, () => {
          const name = $('mqName').value.trim();
          if (!name) return;
          Engine.S.quests.push({
            id: uid(),
            name,
            stat: $('mqStat').value,
            xp: parseInt($('mqXp').value) || 25,
            done: false
          });
        });
        break;
      }

      /* ── Edit Quest ──────────────────────────────────── */
      case 'equest': {
        const q = Engine.S.quests.find(q => q.id === id);
        if (!q) return;
        modal('Edit Quest', `
          <div class="fld"><label>Quest Name</label><input id="mqName" value="${esc(q.name)}"></div>
          <div class="fld"><label>Stat</label><select id="mqStat">${statOptions(q.stat)}</select></div>
          <div class="fld"><label>XP Reward</label><input id="mqXp" type="number" value="${q.xp}" min="1" max="500"></div>
        `, () => {
          q.name = $('mqName').value.trim() || q.name;
          q.stat = $('mqStat').value;
          q.xp = parseInt($('mqXp').value) || q.xp;
        });
        break;
      }

      /* ── Delete Quest ────────────────────────────────── */
      case 'dquest': {
        Engine.S.quests = Engine.S.quests.filter(q => q.id !== id);
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }

      /* ── Add Stat ────────────────────────────────────── */
      case 'addstat': {
        modal('Add Stat', `
          <div class="fld"><label>Stat Name</label><input id="msName" placeholder="New stat"></div>
          <div class="fld"><label>Icon</label><input id="msIcon" placeholder="emoji" value="⭐" maxlength="4"></div>
        `, () => {
          const name = $('msName').value.trim();
          if (!name) return;
          const sId = name.toLowerCase().slice(0, 3);
          Engine.S.stats.push({
            id: sId + '_' + uid().slice(0, 4),
            icon: $('msIcon').value || '⭐',
            name,
            level: 1,
            xp: 0
          });
        });
        break;
      }

      /* ── Edit Stat ───────────────────────────────────── */
      case 'estat': {
        const s = Engine.S.stats.find(s => s.id === id);
        if (!s) return;
        modal('Edit Stat', `
          <div class="fld"><label>Stat Name</label><input id="msName" value="${esc(s.name)}"></div>
          <div class="fld"><label>Icon</label><input id="msIcon" value="${s.icon}" maxlength="4"></div>
        `, () => {
          s.name = $('msName').value.trim() || s.name;
          s.icon = $('msIcon').value || s.icon;
        });
        break;
      }

      /* ── Delete Stat ─────────────────────────────────── */
      case 'dstat': {
        if (!confirm('Delete this stat? This cannot be undone.')) return;
        Engine.S.stats = Engine.S.stats.filter(s => s.id !== id);
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }

      /* ── Add Boss ────────────────────────────────────── */
      case 'addboss': {
        modal('Add Boss Fight', `
          <div class="fld"><label>Boss Name</label><input id="mbName" placeholder="Boss objective"></div>
          <div class="fld"><label>Stat</label><select id="mbStat">${statOptions('str')}</select></div>
          <div class="fld"><label>Deadline</label><input id="mbDeadline" placeholder="e.g. 90d, 2026-09-01" value="90d"></div>
          <div class="fld"><label>Reward Description</label><input id="mbReward" placeholder="+300 XP · etc" value="+300 XP"></div>
        `, () => {
          const name = $('mbName').value.trim();
          if (!name) return;
          Engine.S.bosses.push({
            id: uid(),
            name,
            stat: $('mbStat').value,
            deadline: $('mbDeadline').value || '90d',
            progress: 0,
            reward: $('mbReward').value || '+300 XP',
            done: false
          });
        });
        break;
      }

      /* ── Edit Boss ───────────────────────────────────── */
      case 'eboss': {
        const b = Engine.S.bosses.find(b => b.id === id);
        if (!b) return;
        modal('Edit Boss', `
          <div class="fld"><label>Boss Name</label><input id="mbName" value="${esc(b.name)}"></div>
          <div class="fld"><label>Stat</label><select id="mbStat">${statOptions(b.stat)}</select></div>
          <div class="fld"><label>Deadline</label><input id="mbDeadline" value="${esc(b.deadline)}"></div>
          <div class="fld"><label>Reward</label><input id="mbReward" value="${esc(b.reward)}"></div>
        `, () => {
          b.name = $('mbName').value.trim() || b.name;
          b.stat = $('mbStat').value;
          b.deadline = $('mbDeadline').value || b.deadline;
          b.reward = $('mbReward').value || b.reward;
        });
        break;
      }

      /* ── Delete Boss ─────────────────────────────────── */
      case 'xboss': {
        Engine.S.bosses = Engine.S.bosses.filter(b => b.id !== id);
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }

      /* ── Defeat Boss ─────────────────────────────────── */
      case 'winboss': {
        const b = Engine.S.bosses.find(b => b.id === id);
        if (!b) return;
        b.done = true;
        b.progress = 100;

        // Add to shadow army
        const xpEarned = b.reward.match(/\d+/)?.[0] ? parseInt(b.reward.match(/\d+/)[0]) : 300;
        Engine.S.shadowArmy.push({
          name: b.name,
          stat: b.stat,
          defeatedDate: Engine.todayStr(),
          xpEarned
        });

        // Award XP
        Engine.addXp(b.stat, xpEarned);
        Engine.showAlert('win', `⚔️ BOSS DEFEATED: ${b.name}! Shadow extracted. +${xpEarned} XP`);
        toast(`👤 Shadow extracted: ${b.name}`);
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }

      /* ── Reset Today ─────────────────────────────────── */
      case 'clearday': {
        // Undo XP from today's completed quests
        Engine.S.quests.forEach(q => {
          if (q.done) {
            Engine.addXp(q.stat, -q.xp);
            q.done = false;
          }
        });
        toast('↩ Today reset');
        Engine.save();
        Render.render();
        window.Sync?.push?.();
        break;
      }
    }
  });

  /* ══════════════════════════════════════════════════════════
     Boss Progress Slider (input event)
     ══════════════════════════════════════════════════════════ */
  document.addEventListener('input', (e) => {
    if (e.target.dataset.act === 'bprog') {
      const b = Engine.S.bosses.find(b => b.id === e.target.dataset.id);
      if (!b) return;
      b.progress = parseInt(e.target.value);
      Engine.save();
      Render.render();
      window.Sync?.push?.();
    }
  });

  /* ══════════════════════════════════════════════════════════
     Player Name Change
     ══════════════════════════════════════════════════════════ */
  const pnameEl = $('pname');
  if (pnameEl) {
    pnameEl.addEventListener('change', () => {
      const v = pnameEl.value.trim();
      if (v) {
        Engine.S.name = v;
        Engine.save();
        toast(`Name updated: ${v}`);
        window.Sync?.push?.();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     Export / Import / Reset
     ══════════════════════════════════════════════════════════ */
  $('exportBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify(Engine.S, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_backup_${Engine.todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('📦 Backup exported');
  });

  $('importBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('importFile')?.click();
  });

  $('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.stats && data.quests) {
          Engine.S = data;
          Engine.save();
          Render.render();
          toast('📥 Data imported successfully');
          window.Sync?.push?.();
        } else {
          toast('❌ Invalid backup file');
        }
      } catch (err) {
        toast('❌ Failed to parse file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('resetAll')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!confirm('⚠️ Reset ALL data? This cannot be undone!')) return;
    if (!confirm('Are you SURE? All progress will be lost.')) return;
    localStorage.removeItem(Engine.KEY);
    Engine.S = Engine.defaults();
    Engine.save();
    Render.render();
    toast('🗑️ All data reset');
  });

  /* ══════════════════════════════════════════════════════════
     PWA Install
     ══════════════════════════════════════════════════════════ */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const wrap = $('installWrap');
    if (wrap) wrap.style.display = 'inline';
  });

  $('installBtn')?.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        const wrap = $('installWrap');
        if (wrap) wrap.style.display = 'none';
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     Midnight Penalty Countdown
     ══════════════════════════════════════════════════════════ */
  function updateCountdown() {
    const el = $('penaltyTimer');
    if (!el) return;

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent = `⏳ ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} until penalty`;

    if (h < 1) {
      el.classList.add('urgent');
    } else {
      el.classList.remove('urgent');
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  /* ══════════════════════════════════════════════════════════
     Awakening Sequence
     ══════════════════════════════════════════════════════════ */
  function runAwakening() {
    const overlay = $('awakening');
    if (!overlay) return;

    const nameInput = $('awNameInput');
    const confirmBtn = $('awConfirm');
    const statsReveal = $('awStats');
    const completeEl = $('awComplete');
    const ariseEl = $('awArise');

    function confirmName() {
      const name = nameInput.value.trim() || 'Hunter';
      Engine.S.name = name;

      // Hide name section
      overlay.querySelector('.aw-name-section').style.display = 'none';

      // Show stats one by one
      statsReveal.innerHTML = '';
      Engine.S.stats.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'aw-stat-item';
        el.textContent = `${s.icon} ${s.name} — Lv 1`;
        statsReveal.appendChild(el);
        setTimeout(() => el.classList.add('show'), i * 300);
      });
      statsReveal.classList.add('show');

      // After stats reveal
      const totalDelay = Engine.S.stats.length * 300 + 600;
      setTimeout(() => {
        completeEl.classList.add('show');
      }, totalDelay);

      setTimeout(() => {
        ariseEl.classList.add('show');
      }, totalDelay + 800);

      // Fade out overlay
      setTimeout(() => {
        overlay.classList.add('hide');
        setTimeout(() => {
          overlay.style.display = 'none';
          Engine.S.awakened = true;
          Engine.save();
          Render.render();
        }, 800);
      }, totalDelay + 2800);
    }

    confirmBtn.addEventListener('click', confirmName);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmName();
    });
  }

  /* ══════════════════════════════════════════════════════════
     Keyboard Shortcuts
     ══════════════════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  /* ══════════════════════════════════════════════════════════
     Boot Sequence
     ══════════════════════════════════════════════════════════ */
  (function boot() {
    // Rollover check
    Engine.rollover();

    // Initial render
    Render.render();

    // Initialize feature modules
    window.Particles?.init?.('particleCanvas');
    window.Notify?.init?.();
    window.Sync?.init?.();

    // Awakening check
    if (!Engine.S.awakened) {
      runAwakening();
    } else {
      const overlay = $('awakening');
      if (overlay) overlay.style.display = 'none';
    }
  })();

})();
