function getSavedTheme() {
  return localStorage.getItem('aiml-theme');
}

function saveTheme(theme) {
  if (theme) {
    localStorage.setItem('aiml-theme', theme);
  } else {
    localStorage.removeItem('aiml-theme');
  }
}

window.isDark = function() {
  const theme = getSavedTheme();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

function applyTheme() {
  const theme = getSavedTheme();
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeIcon();
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: window.isDark() ? 'dark' : 'light' } }));
}

function toggleTheme() {
  const current = getSavedTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let next;
  if (!current) {
    next = prefersDark ? 'light' : 'dark';
  } else if (current === 'dark') {
    next = 'light';
  } else {
    next = 'dark';
  }
  saveTheme(next);
  applyTheme();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (!icon) return;
  icon.className = window.isDark() ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!getSavedTheme()) applyTheme();
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

function injectAuthStyles() {
  if (document.getElementById('auth-style')) return;
  const style = document.createElement('style');
  style.id = 'auth-style';
  style.textContent = `
    .auth-btn-icon {
      background: var(--surface2);
      border: 1px solid var(--border2);
      color: var(--ink3);
      font-size: 15px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      padding: 0;
      flex-shrink: 0;
    }
    .auth-btn-icon:hover { color: var(--ink); background: var(--surface); }
    .auth-btn-icon.logged-in { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
    .auth-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    }
    .auth-card {
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: min(360px, 92vw);
      padding: 28px;
      display: flex; flex-direction: column; gap: 14px;
      position: relative;
    }
    .auth-card-close {
      position: absolute; top: 14px; right: 14px;
      background: none; border: none;
      color: var(--ink3); font-size: 16px; cursor: pointer;
    }
    .auth-card-title { font-size: 18px; font-weight: 600; color: var(--ink); }
    .auth-field { display: flex; flex-direction: column; gap: 5px; }
    .auth-field label { font-size: 12px; color: var(--ink3); font-family: 'JetBrains Mono', monospace; }
    .auth-field input {
      background: var(--surface2);
      border: 1px solid var(--border2);
      color: var(--ink);
      border-radius: 5px;
      padding: 9px 12px;
      font-size: 14px;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
      outline: none;
    }
    .auth-field input:focus { border-color: var(--accent); }
    .auth-name-row { display: flex; gap: 10px; }
    .auth-name-row .auth-field { flex: 1; }
    .auth-msg { font-size: 13px; display: flex; align-items: center; gap: 6px; min-height: 16px; }
    .auth-msg.err { color: var(--accent2, #b84040); }
    .auth-msg.ok { color: var(--accent3, #2e7d52); }
    .auth-link { font-size: 13px; color: var(--accent); cursor: pointer; text-align: center; text-decoration: none; }
    .auth-link:hover { text-decoration: underline; }
    .auth-small-link { font-size: 12px; color: var(--accent); cursor: pointer; text-align: right; text-decoration: none; }
    .auth-small-link:hover { text-decoration: underline; }
    .auth-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      min-width: 200px;
      z-index: 1000;
      overflow: hidden;
    }
    .auth-dropdown-header {
      padding: 10px 16px;
      font-size: 13px;
      color: var(--ink3);
      border-bottom: 1px solid var(--border);
      word-break: break-all;
    }
    .auth-dropdown-header strong { display: block; color: var(--ink); margin-bottom: 2px; }
    .auth-dropdown-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px;
      font-size: 14px;
      color: var(--ink2);
      background: none; border: none;
      width: 100%; text-align: left; cursor: pointer;
    }
    .auth-dropdown-btn:hover { background: var(--surface2); color: var(--ink); }
    .save-indicator {
      position: fixed; bottom: 16px; right: 16px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--ink3);
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 4px;
      padding: 5px 10px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 5000;
    }
    .save-indicator.visible { opacity: 1; }
  `;
  document.head.appendChild(style);
}

let _supabase = null;
let _user = null;
let _saveTimer = null;
let _saveIndicator = null;

function getPageKey() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

const SKIP_PAGES = new Set(['index.html', 'references.html', '']);

function captureState() {
  const page = getPageKey();
  const s = { _page: page, _ts: Date.now() };

  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab && activeTab.id) s._activeTab = activeTab.id;

  document.querySelectorAll('select[id]').forEach(el => {
    s[el.id] = el.value;
  });

  document.querySelectorAll('input[id]').forEach(el => {
    if (el.type === 'checkbox') s[el.id] = el.checked;
    else if (el.type === 'range' || el.type === 'number' || el.type === 'text') s[el.id] = el.value;
  });

  if (page === 'vector.html') {
    const btn3d = document.getElementById('btn3d');
    s._mode = btn3d && btn3d.classList.contains('active') ? '3d' : '2d';
    if (window.vectors && window.vectors.length > 0) {
      s._vectors = JSON.parse(JSON.stringify(window.vectors));
    }
    if (window.lcCoeffs && window.lcCoeffs.length > 0) {
      s._lcCoeffs = JSON.parse(JSON.stringify(window.lcCoeffs));
    }
  }

  if (page === 'matrix.html') {
    const mA = document.getElementById('m-a');
    const mB = document.getElementById('m-b');
    const mC = document.getElementById('m-c');
    const mD = document.getElementById('m-d');
    if (mA && mB && mC && mD) {
      s._mat = [
        parseFloat(mA.value) || 0,
        parseFloat(mB.value) || 0,
        parseFloat(mC.value) || 0,
        parseFloat(mD.value) || 0
      ];
    }
    const lmeX = document.getElementById('lme-x');
    const lmeY = document.getElementById('lme-y');
    if (lmeX && lmeY) {
      s._lmeVec = { x: parseFloat(lmeX.value) || 0, y: parseFloat(lmeY.value) || 0 };
    }
  }

  return s;
}

async function persistState() {
  if (!_supabase || !_user) return;
  const page = getPageKey();
  if (SKIP_PAGES.has(page)) return;
  const state = captureState();
  try {
    await _supabase.from('user_states').upsert({
      user_id: _user.id,
      page_name: page,
      state: state,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,page_name' });
    flashSaveIndicator();
  } catch (e) {
    console.warn('State save failed:', e.message);
  }
}

function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(persistState, 1200);
}

function flashSaveIndicator() {
  if (!_saveIndicator) {
    _saveIndicator = document.createElement('div');
    _saveIndicator.className = 'save-indicator';
    _saveIndicator.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="margin-right:5px"></i>Saved';
    document.body.appendChild(_saveIndicator);
  }
  _saveIndicator.classList.add('visible');
  clearTimeout(_saveIndicator._timer);
  _saveIndicator._timer = setTimeout(() => _saveIndicator.classList.remove('visible'), 1800);
}

async function restoreState() {
  if (!_supabase || !_user) return;
  const page = getPageKey();
  if (SKIP_PAGES.has(page)) return;
  try {
    const { data } = await _supabase
      .from('user_states')
      .select('state')
      .eq('user_id', _user.id)
      .eq('page_name', page)
      .maybeSingle();
    if (data && data.state) {
      applyState(data.state);
    }
  } catch (e) {
    console.warn('State load failed:', e.message);
  }
}

function applyState(s) {
  const page = getPageKey();

  if (s._activeTab) {
    const tabEl = document.getElementById(s._activeTab);
    if (tabEl) tabEl.click();
  }

  if (page === 'vector.html') {
    scheduleVectorRestore(s);
    return;
  }

  if (page === 'matrix.html') {
    scheduleMatrixRestore(s);
    return;
  }

  scheduleGenericRestore(s);
}

function scheduleGenericRestore(s) {
  function attempt(tries) {
    const ready = typeof window.render === 'function' &&
                  typeof window.W !== 'undefined' && window.W > 0;
    if (!ready) {
      if (tries > 0) setTimeout(() => attempt(tries - 1), 200);
      return;
    }
    Object.keys(s).forEach(id => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = s[id];
      else if (el.type === 'checkbox') el.checked = !!s[id];
      else el.value = s[id];
    });
    window.render();
  }
  setTimeout(() => attempt(20), 300);
}

function scheduleMatrixRestore(s) {
  function attempt(tries) {
    const ready = typeof window.render === 'function' &&
                  typeof window.W !== 'undefined' && window.W > 0 &&
                  typeof updateMatrix === 'function' &&
                  typeof updateLME === 'function';
    if (!ready) {
      if (tries > 0) setTimeout(() => attempt(tries - 1), 200);
      return;
    }

    if (s._mat && Array.isArray(s._mat)) {
      const ids = ['m-a', 'm-b', 'm-c', 'm-d'];
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.value = s._mat[i];
      });
      updateMatrix();
    }

    if (s._lmeVec) {
      const lx = document.getElementById('lme-x');
      const ly = document.getElementById('lme-y');
      if (lx) lx.value = s._lmeVec.x;
      if (ly) ly.value = s._lmeVec.y;
      updateLME();
    }

    Object.keys(s).forEach(id => {
      if (id.startsWith('_') || ['m-a','m-b','m-c','m-d','lme-x','lme-y'].includes(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = s[id];
      else if (el.type === 'checkbox') {
        el.checked = !!s[id];
        if (id === 'tgl-grid') window.showGrid = el.checked;
        if (id === 'tgl-eigen') window.showEigen = el.checked;
        if (id === 'tgl-lme') window.showLME = el.checked;
      } else el.value = s[id];
    });

    window.render();
  }
  setTimeout(() => attempt(20), 300);
}

function scheduleVectorRestore(s) {
  function attempt(tries) {
    const ready = typeof recalculateVectors === 'function' &&
                  typeof updateList === 'function' &&
                  typeof updatePanels === 'function' &&
                  typeof window.render === 'function' &&
                  typeof animateZoom === 'function' &&
                  typeof computeTargetUnit === 'function' &&
                  typeof window.W !== 'undefined' && window.W > 0;
    if (!ready) {
      if (tries > 0) setTimeout(() => attempt(tries - 1), 200);
      return;
    }

    if (s._mode) {
      const is3d = s._mode === '3d';
      if (typeof window.currentMode !== 'undefined' && window.currentMode !== s._mode) {
        window.currentMode = s._mode;
        document.body.classList.toggle('mode3d', is3d);
        const c = document.getElementById('canvas');
        const b2 = document.getElementById('btn2d');
        const b3 = document.getElementById('btn3d');
        if (c) c.classList.toggle('mode3d', is3d);
        if (b2) b2.classList.toggle('active', !is3d);
        if (b3) b3.classList.toggle('active', is3d);
      }
    }

    if (s._vectors && s._vectors.length > 0) {
      window.vectors = JSON.parse(JSON.stringify(s._vectors));
      window.animState = window.vectors.map(() => 1);
    }

    if (s._lcCoeffs && s._lcCoeffs.length > 0) {
      window.lcCoeffs = JSON.parse(JSON.stringify(s._lcCoeffs));
    } else if (window.vectors) {
      window.lcCoeffs = window.vectors.map(() => 1);
    }

    Object.keys(s).forEach(id => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = s[id];
      else if (el.type === 'checkbox') {
        el.checked = !!s[id];
        if (id === 'toggle-resultant') window.showResultant = el.checked;
        if (id === 'toggle-lc') window.lcShowOnCanvas = el.checked;
        if (id === 'toggle-span') window.showSpan = el.checked;
        if (id === 'toggle-dot') window.showProjection = el.checked;
        if (id === 'toggle-cross') window.showCross = el.checked;
        if (id === 'auto-orbit') {
          if (typeof window.toggleOrbit === 'function') window.toggleOrbit(el.checked);
        }
      } else el.value = s[id];
    });

    if (window.vectors && window.vectors.length > 0) {
      recalculateVectors();
      updateList();
      updatePanels();
      const target = computeTargetUnit();
      animateZoom(target);
    }
    window.render();
  }
  setTimeout(() => attempt(25), 350);
}

function wireAutoSave() {
  const page = getPageKey();
  if (SKIP_PAGES.has(page)) return;

  document.addEventListener('input', e => {
    if (e.target.closest && e.target.closest('.auth-card')) return;
    scheduleSave();
  }, true);

  document.addEventListener('change', e => {
    if (e.target.closest && e.target.closest('.auth-card')) return;
    scheduleSave();
  }, true);

  document.addEventListener('click', e => {
    if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
      setTimeout(scheduleSave, 80);
    }
    if (e.target.matches('.btn-mode') || e.target.closest('.btn-mode')) {
      setTimeout(scheduleSave, 80);
    }
  }, true);

  if (page === 'vector.html') {
    const _origAdd = window.addVector;
    const _origClear = window.clearAll;
    const _origRemove = window.removeVector;
    const _origScale = window.applyScale;

    if (typeof _origAdd === 'function') {
      window.addVector = function() {
        const r = _origAdd.apply(this, arguments);
        setTimeout(scheduleSave, 700);
        return r;
      };
    }
    if (typeof _origClear === 'function') {
      window.clearAll = function() {
        const r = _origClear.apply(this, arguments);
        setTimeout(scheduleSave, 100);
        return r;
      };
    }
    if (typeof _origRemove === 'function') {
      window.removeVector = function() {
        const r = _origRemove.apply(this, arguments);
        setTimeout(scheduleSave, 400);
        return r;
      };
    }
    if (typeof _origScale === 'function') {
      window.applyScale = function() {
        const r = _origScale.apply(this, arguments);
        setTimeout(scheduleSave, 700);
        return r;
      };
    }
  }
}

function buildAuthBtn(supabase) {
  const container = document.querySelector('.header-actions');
  if (!container) return;
  let btn = document.getElementById('auth-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'auth-btn';
    btn.className = 'auth-btn-icon';
    container.insertBefore(btn, container.firstChild);
  }
  document.querySelector('.auth-dropdown')?.remove();

  if (_user) {
    btn.className = 'auth-btn-icon logged-in';
    btn.innerHTML = '<i class="fa-solid fa-user"></i>';
    btn.title = _user.email;
    btn.onclick = e => { e.stopPropagation(); openUserDropdown(supabase, btn); };
  } else {
    btn.className = 'auth-btn-icon';
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i>';
    btn.title = 'Sign In';
    btn.onclick = () => openAuthModal(supabase);
  }
}

function openUserDropdown(supabase, anchor) {
  document.querySelector('.auth-dropdown')?.remove();
  const drop = document.createElement('div');
  drop.className = 'auth-dropdown';
  const meta = _user.user_metadata || {};
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ') || '';
  drop.innerHTML = `
    <div class="auth-dropdown-header">
      ${name ? `<strong>${name}</strong>` : ''}
      ${_user.email}
    </div>
    <button class="auth-dropdown-btn" id="auth-signout-btn">
      <i class="fa-solid fa-right-from-bracket"></i> Sign Out
    </button>
  `;
  anchor.parentElement.style.position = 'relative';
  anchor.parentElement.appendChild(drop);
  drop.querySelector('#auth-signout-btn').onclick = async () => {
    drop.remove();
    await supabase.auth.signOut();
  };
  const dismiss = e => {
    if (!drop.contains(e.target) && e.target !== anchor) {
      drop.remove();
      document.removeEventListener('click', dismiss);
    }
  };
  setTimeout(() => document.addEventListener('click', dismiss), 0);
}

function openAuthModal(supabase) {
  document.querySelector('.auth-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const card = document.createElement('div');
  card.className = 'auth-card';
  overlay.appendChild(card);

  let mode = 'signin';

  function render() {
    card.innerHTML = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'auth-card-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.onclick = () => overlay.remove();
    card.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'auth-card-title';
    title.textContent = mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password';
    card.appendChild(title);

    const form = document.createElement('form');
    form.style.display = 'contents';
    card.appendChild(form);

    if (mode === 'signup') {
      const nameRow = document.createElement('div');
      nameRow.className = 'auth-name-row';
      nameRow.innerHTML = `
        <div class="auth-field"><label>First Name</label><input id="af-first" type="text" required></div>
        <div class="auth-field"><label>Last Name</label><input id="af-last" type="text"></div>
      `;
      form.appendChild(nameRow);
    }

    const emailField = document.createElement('div');
    emailField.className = 'auth-field';
    emailField.innerHTML = '<label>Email</label><input id="af-email" type="email" required autocomplete="email">';
    form.appendChild(emailField);

    if (mode !== 'forgot') {
      const passField = document.createElement('div');
      passField.className = 'auth-field';
      passField.innerHTML = `<label>Password</label><input id="af-pass" type="password" required minlength="6" autocomplete="${mode === 'signin' ? 'current-password' : 'new-password'}">`;
      form.appendChild(passField);
    }

    if (mode === 'signin') {
      const forgotLink = document.createElement('a');
      forgotLink.className = 'auth-small-link';
      forgotLink.textContent = 'Forgot password?';
      forgotLink.onclick = () => { mode = 'forgot'; render(); };
      form.appendChild(forgotLink);
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'auth-msg';
    form.appendChild(msgEl);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-fill';
    submitBtn.type = 'submit';
    submitBtn.textContent = mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link';
    form.appendChild(submitBtn);

    const toggleLink = document.createElement('a');
    toggleLink.className = 'auth-link';
    if (mode === 'signin') {
      toggleLink.textContent = 'Need an account? Sign Up';
      toggleLink.onclick = () => { mode = 'signup'; render(); };
    } else if (mode === 'signup') {
      toggleLink.textContent = 'Already have an account? Sign In';
      toggleLink.onclick = () => { mode = 'signin'; render(); };
    } else {
      toggleLink.textContent = 'Back to Sign In';
      toggleLink.onclick = () => { mode = 'signin'; render(); };
    }
    form.appendChild(toggleLink);

    form.onsubmit = async e => {
      e.preventDefault();
      const email = card.querySelector('#af-email')?.value.trim();
      const pass = card.querySelector('#af-pass')?.value;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      msgEl.className = 'auth-msg';
      msgEl.innerHTML = '';
      try {
        if (mode === 'signup') {
          const first = card.querySelector('#af-first')?.value.trim();
          const last = card.querySelector('#af-last')?.value.trim();
          const { error } = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { first_name: first, last_name: last } }
          });
          if (error) throw error;
          msgEl.className = 'auth-msg ok';
          msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Check your email to confirm your account.';
        } else if (mode === 'signin') {
          const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          overlay.remove();
        } else {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href
          });
          if (error) throw error;
          msgEl.className = 'auth-msg ok';
          msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Reset link sent. Check your inbox.';
        }
      } catch (err) {
        msgEl.className = 'auth-msg err';
        msgEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${err.message}`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link';
      }
    };
  }

  render();
  document.body.appendChild(overlay);
  setTimeout(() => card.querySelector('#af-email')?.focus(), 50);
}

function openUpdatePasswordModal(supabase) {
  document.querySelector('.auth-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  const card = document.createElement('div');
  card.className = 'auth-card';
  card.innerHTML = '<div class="auth-card-title">Set New Password</div>';
  const form = document.createElement('form');
  form.style.display = 'contents';
  card.appendChild(form);
  const field = document.createElement('div');
  field.className = 'auth-field';
  field.innerHTML = '<label>New Password</label><input id="af-newpass" type="password" required minlength="6" autocomplete="new-password">';
  form.appendChild(field);
  const msgEl = document.createElement('div');
  msgEl.className = 'auth-msg';
  form.appendChild(msgEl);
  const btn = document.createElement('button');
  btn.className = 'btn btn-fill';
  btn.type = 'submit';
  btn.textContent = 'Update Password';
  form.appendChild(btn);
  form.onsubmit = async e => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
      const { error } = await supabase.auth.updateUser({ password: card.querySelector('#af-newpass').value });
      if (error) throw error;
      msgEl.className = 'auth-msg ok';
      msgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Password updated!';
      setTimeout(() => overlay.remove(), 1500);
    } catch (err) {
      msgEl.className = 'auth-msg err';
      msgEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${err.message}`;
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  };
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  setTimeout(() => card.querySelector('#af-newpass')?.focus(), 50);
}

async function bootAuth() {
  injectAuthStyles();
  let config = window.aimlConfig;
  if (!config) {
    try {
      const r = await fetch('config.json');
      if (r.ok) config = await r.json();
    } catch (_) {}
  }
  if (!config) {
    try {
      await loadScript('config.json');
      config = window.aimlConfig;
    } catch (_) {}
  }
  if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return;

  await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  _supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  const { data: { session } } = await _supabase.auth.getSession();
  _user = session?.user ?? null;
  buildAuthBtn(_supabase);

  if (_user) {
    await restoreState();
  }

  wireAutoSave();

  _supabase.auth.onAuthStateChange(async (event, session) => {
    const prevUser = _user;
    _user = session?.user ?? null;
    buildAuthBtn(_supabase);
    if (event === 'PASSWORD_RECOVERY') {
      openUpdatePasswordModal(_supabase);
    } else if (_user && !prevUser) {
      await restoreState();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAuth);
} else {
  bootAuth();
}
