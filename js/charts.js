/* ── charts.js — Stat Radar · Quest Ring · Weekly Bars · Heatmap ──── */
window.Charts = (() => {

  const TAU = Math.PI * 2;
  const HALF_PI = Math.PI / 0.5;

  /* ── helper ─────────────────────────────────────────────────────── */
  function dpr() { return window.devicePixelRatio || 1; }

  function prepCanvas(id, w, h) {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = dpr();
    el.width = w * r;
    el.height = h * r;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    const c = el.getContext('2d', { willReadFrequently: false });
    c.scale(r, r);
    return c;
  }

  /* ── Radar / Spider ────────────────────────────────────────────── */
  function drawRadar(canvasId, stats) {
    const SIZE = 280, cx = SIZE / 2, cy = SIZE / 2, R = 100;
    const ctx = prepCanvas(canvasId, SIZE, SIZE);
    if (!ctx) return;
    const n = stats.length;
    const MAX_LVL = 20;

    /* concentric hex grid */
    [0.33, 0.66, 1].forEach(scale => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (TAU / n) * i - Math.PI / 2;
        const px = cx + Math.cos(a) * R * scale;
        const py = cy + Math.sin(a) * R * scale;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(59,130,246,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* spokes */
    for (let i = 0; i < n; i++) {
      const a = (TAU / n) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = 'rgba(59,130,246,0.08)';
      ctx.stroke();
    }

    /* data polygon */
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (TAU / n) * i - Math.PI / 2;
      const val = Math.min(stats[i].level / MAX_LVL, 1);
      const px = cx + Math.cos(a) * R * val;
      const py = cy + Math.sin(a) * R * val;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(59,130,246,0.2)';
    ctx.fill();
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* data dots */
    for (let i = 0; i < n; i++) {
      const a = (TAU / n) * i - Math.PI / 2;
      const val = Math.min(stats[i].level / MAX_LVL, 1);
      const px = cx + Math.cos(a) * R * val;
      const py = cy + Math.sin(a) * R * val;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, TAU);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }

    /* labels */
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const LABEL_R = R + 28;
    for (let i = 0; i < n; i++) {
      const a = (TAU / n) * i - Math.PI / 2;
      const lx = cx + Math.cos(a) * LABEL_R;
      const ly = cy + Math.sin(a) * LABEL_R;
      ctx.fillText(stats[i].icon + ' ' + stats[i].name, lx, ly);
    }
  }

  /* ── Quest Ring ────────────────────────────────────────────────── */
  function drawQuestRing(canvasId, done, total) {
    const SIZE = 60, cx = 30, cy = 30, r = 23, lw = 5;
    const ctx = prepCanvas(canvasId, SIZE, SIZE);
    if (!ctx) return;
    const pct = total === 0 ? 0 : done / total;
    const allDone = total > 0 && done >= total;

    /* bg ring */
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = 'rgba(59,130,246,0.15)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* progress arc */
    if (pct > 0) {
      const startA = -Math.PI / 2;
      const endA = startA + TAU * pct;
      const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      if (allDone) {
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(1, '#22c55e');
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;
      } else {
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#3b82f6');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    /* center text */
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = allDone ? '#22c55e' : '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(done + '/' + total, cx, cy);
  }

  /* ── Weekly Bar Chart ──────────────────────────────────────────── */
  function drawWeekly(canvasId, log) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const W = el.parentElement ? Math.min(el.parentElement.clientWidth, 400) : 320;
    const H = 140;
    const ctx = prepCanvas(canvasId, W, H);
    if (!ctx) return;

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const PAD_LEFT = 8, PAD_RIGHT = 8, PAD_TOP = 10, PAD_BOT = 24;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOT;

    /* horizontal grid */
    [0.25, 0.5, 0.75, 1].forEach(pct => {
      const y = PAD_TOP + chartH * (1 - pct);
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* gather last 7 days */
    const today = new Date();
    const entries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const entry = log.find(l => l.date === ds);
      entries.push({ date: ds, day: DAYS[d.getDay()], entry });
    }

    const barW = Math.floor(chartW / 7) - 6;

    entries.forEach((e, i) => {
      const bx = PAD_LEFT + (chartW / 7) * i + (chartW / 7 - barW) / 2;
      let ratio = 0, hasPenalty = false;
      if (e.entry) {
        ratio = e.entry.total > 0 ? e.entry.done / e.entry.total : 0;
        hasPenalty = (e.entry.pen || 0) > 0;
      }
      const bh = Math.max(ratio * chartH, ratio > 0 ? 3 : 0);
      const by = PAD_TOP + chartH - bh;

      if (bh > 0) {
        ctx.beginPath();
        const rr = Math.min(3, bh / 2);
        ctx.moveTo(bx + rr, by);
        ctx.lineTo(bx + barW - rr, by);
        ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + rr);
        ctx.lineTo(bx + barW, by + bh);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx, by + rr);
        ctx.quadraticCurveTo(bx, by, bx + rr, by);
        ctx.closePath();
        ctx.fillStyle = hasPenalty ? '#ef4444' : '#22c55e';
        ctx.globalAlpha = hasPenalty ? 0.75 : 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      /* label */
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(e.day, bx + barW / 2, H - 6);
    });
  }

  /* ── Heatmap (DOM-based) ───────────────────────────────────────── */
  function drawHeatmap(containerId, log) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const CELL = 16, GAP = 3;
    const COLS = 5, ROWS = 7;

    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(' + COLS + ',' + CELL + 'px);' +
      'grid-template-rows:repeat(' + ROWS + ',' + CELL + 'px);gap:' + GAP + 'px;';

    const today = new Date();
    const cells = [];
    /* fill 35 slots (5 weeks × 7 days), most recent in bottom-right */
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const entry = log.find(l => l.date === ds);
      cells.push({ date: ds, entry });
    }

    /* render column-first (week-major) */
    /* CSS grid fills row by row, so we need to reorder for column-major */
    const ordered = new Array(35);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        ordered[r * COLS + c] = cells[c * ROWS + r];
      }
    }

    ordered.forEach(cell => {
      if (!cell) {
        const empty = document.createElement('div');
        empty.style.cssText = 'width:' + CELL + 'px;height:' + CELL + 'px;border-radius:3px;background:rgba(255,255,255,0.03);';
        grid.appendChild(empty);
        return;
      }
      const el = document.createElement('div');
      let bg = 'rgba(255,255,255,0.03)';
      let tip = cell.date + ': No data';

      if (cell.entry) {
        const e = cell.entry;
        const hasPen = (e.pen || 0) > 0;
        const ratio = e.total > 0 ? e.done / e.total : 0;
        if (hasPen) {
          bg = 'rgba(239,68,68,0.5)';
        } else if (ratio >= 1) {
          bg = 'rgba(59,130,246,0.7)';
        } else if (ratio > 0) {
          bg = 'rgba(59,130,246,0.3)';
        }
        tip = window.Engine
          ? Engine.esc(cell.date + ': ' + e.done + '/' + e.total + ' quests' + (hasPen ? ' (penalty)' : ''))
          : cell.date;
      }

      el.style.cssText =
        'width:' + CELL + 'px;height:' + CELL + 'px;border-radius:3px;' +
        'background:' + bg + ';cursor:pointer;transition:transform .15s;';
      el.title = tip;
      el.addEventListener('mouseenter', function () { this.style.transform = 'scale(1.3)'; });
      el.addEventListener('mouseleave', function () { this.style.transform = 'scale(1)'; });
      grid.appendChild(el);
    });

    container.appendChild(grid);
  }

  return { drawRadar, drawQuestRing, drawWeekly, drawHeatmap };
})();
