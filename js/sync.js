/* ── sync.js — Supabase Cloud Sync ─────────────────────────────────── */
window.Sync = (() => {

  let sb = null;       /* supabase client */
  let user = null;
  let pushDebounce = 0;
  const DEBOUNCE_MS = 1500;

  /* ── helpers ────────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return window.Engine ? Engine.esc(s) : s; }

  function setDot(cls) {
    const dot = $('syncDot');
    if (!dot) return;
    dot.className = 'sync-dot' + (cls ? ' ' + cls : '');
  }

  function setMsg(txt) {
    const el = $('syncMsg');
    if (el) el.textContent = txt;
  }

  function setCtl(html) {
    const el = $('syncCtl');
    if (el) el.innerHTML = html;
  }

  /* ── UI rendering ──────────────────────────────────────────────── */
  function renderNoConfig() {
    setDot('');
    setMsg('Local only · this device');
    setCtl('');
  }

  function renderSignedOut() {
    setDot('');
    setMsg('Not signed in');
    setCtl(
      '<input type="email" id="syncEmail" placeholder="email@example.com" ' +
      'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);' +
      'color:#e2e8f0;padding:4px 8px;border-radius:6px;font-size:12px;width:160px;margin-right:6px;" />' +
      '<button id="syncLoginBtn" style="background:#3b82f6;color:#fff;border:none;padding:4px 10px;' +
      'border-radius:6px;font-size:12px;cursor:pointer;">Send magic link</button>'
    );
    const btn = $('syncLoginBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const email = ($('syncEmail') || {}).value;
        if (!email) return;
        signIn(email);
      });
    }
  }

  function renderSignedIn(email) {
    setDot('ok');
    setMsg('Synced · ' + esc(email));
    setCtl(
      '<button id="syncLogoutBtn" style="background:rgba(255,255,255,0.08);color:#94a3b8;border:none;' +
      'padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">Sign out</button>'
    );
    const btn = $('syncLogoutBtn');
    if (btn) {
      btn.addEventListener('click', () => signOut());
    }
  }

  /* ── Auth ───────────────────────────────────────────────────────── */
  async function signIn(email) {
    if (!sb) return;
    setDot('busy');
    setMsg('Sending link…');
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin },
    });
    if (error) {
      setDot('err');
      setMsg('Error: ' + error.message);
    } else {
      setDot('');
      setMsg('Magic link sent — check email');
    }
  }

  async function signOut() {
    if (!sb) return;
    await sb.auth.signOut();
    user = null;
    renderSignedOut();
  }

  /* ── Pull / Push ───────────────────────────────────────────────── */
  async function pull() {
    if (!sb || !user) return;
    setDot('busy');
    try {
      const { data, error } = await sb
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.state) {
        const remote = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
        const localT = Engine.S.updatedAt || 0;
        const remoteT = remote.updatedAt || 0;
        if (remoteT > localT) {
          /* remote is newer — adopt it */
          Object.assign(Engine.S, remote);
          Engine.save();
          if (window.Render && Render.render) Render.render();
          setMsg('Pulled remote state');
        } else {
          /* local is newer or equal — push */
          await pushNow();
        }
      } else {
        /* no remote state — push local */
        await pushNow();
      }
      setDot('ok');
    } catch (e) {
      setDot('err');
      setMsg('Sync error');
      console.error('[Sync] pull error:', e);
    }
  }

  async function pushNow() {
    if (!sb || !user) return;
    setDot('busy');
    try {
      const { error } = await sb
        .from('system_state')
        .upsert({
          user_id: user.id,
          state: JSON.stringify(Engine.S),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setDot('ok');
    } catch (e) {
      setDot('err');
      console.error('[Sync] push error:', e);
    }
  }

  function push() {
    const now = Date.now();
    if (now - pushDebounce < DEBOUNCE_MS) return;
    pushDebounce = now;
    pushNow();
  }

  /* ── Init ──────────────────────────────────────────────────────── */
  async function init() {
    const cfg = window.SYSTEM_CONFIG;
    if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON) {
      renderNoConfig();
      return;
    }

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      renderNoConfig();
      return;
    }

    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON);

    /* check existing session */
    const { data: sessionData } = await sb.auth.getSession();
    if (sessionData && sessionData.session) {
      user = sessionData.session.user;
      renderSignedIn(user.email);
      pull();
    } else {
      renderSignedOut();
    }

    /* auth state changes */
    sb.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        user = session.user;
        renderSignedIn(user.email);
        pull();
      } else {
        user = null;
        renderSignedOut();
      }
    });
  }

  return { init, push, pull };
})();
