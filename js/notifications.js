/* ── notifications.js — Browser Notifications & Reminders ──────────── */
window.Notify = (() => {

  let penaltyTimer = null;
  let reminderTimer = null;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function hasSupport() {
    return 'Notification' in window;
  }

  function isGranted() {
    return hasSupport() && Notification.permission === 'granted';
  }

  function requestPermission() {
    if (!hasSupport()) return Promise.resolve(false);
    return Notification.requestPermission().then(p => p === 'granted');
  }

  function fire(title, body) {
    if (!isGranted()) return;
    try {
      new Notification(title, {
        body: body,
        icon: '⚔️',
        badge: '⚔️',
        tag: 'system-solo-' + Date.now(),
      });
    } catch (_) { /* mobile / restricted env */ }
  }

  /* Schedule penalty warning at 23:00 today (or tomorrow if past) */
  function schedulePenaltyWarning() {
    if (penaltyTimer) clearTimeout(penaltyTimer);

    const now = new Date();
    const target = new Date(now);
    target.setHours(23, 0, 0, 0);

    let ms = target.getTime() - now.getTime();
    if (ms <= 0) ms += DAY_MS; /* already past 23:00, schedule for tomorrow */

    penaltyTimer = setTimeout(() => {
      fire(
        'THE SYSTEM',
        '1 hour until penalty evaluation. Complete your quests.'
      );
      /* re-schedule for next day */
      penaltyTimer = null;
      schedulePenaltyWarning();
    }, ms);
  }

  /* Schedule custom daily reminder at HH:MM */
  function scheduleReminder(timeStr) {
    if (reminderTimer) clearTimeout(reminderTimer);
    if (!timeStr) return;

    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return;

    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);

    let ms = target.getTime() - now.getTime();
    if (ms <= 0) ms += DAY_MS;

    reminderTimer = setTimeout(() => {
      fire(
        'THE SYSTEM',
        'Time to grind. Your quests await.'
      );
      reminderTimer = null;
      scheduleReminder(timeStr);
    }, ms);
  }

  function init() {
    if (!hasSupport()) return;

    /* schedule penalty warning */
    if (isGranted()) {
      schedulePenaltyWarning();
    }

    /* schedule custom reminder if set */
    if (window.Engine && Engine.S && Engine.S.notifyTime) {
      if (isGranted()) {
        scheduleReminder(Engine.S.notifyTime);
      }
    }
  }

  return { init, requestPermission, scheduleReminder };
})();
