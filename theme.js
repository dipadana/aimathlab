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
  let newTheme;
  if (!current) {
    newTheme = prefersDark ? 'light' : 'dark';
  } else if (current === 'dark') {
    newTheme = 'light';
  } else {
    newTheme = 'dark';
  }
  saveTheme(newTheme);
  applyTheme();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const isCurrentlyDark = window.isDark();
  const icon = btn.querySelector('i');
  if (isCurrentlyDark) {
    icon.className = 'fa-solid fa-moon';
  } else {
    icon.className = 'fa-solid fa-sun';
  }
}

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!getSavedTheme()) {
    applyTheme();
  }
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(src));
    document.head.appendChild(script);
  });
}

function injectStyles() {
  const style = document.createElement('style');
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
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      padding: 0;
    }
    .auth-btn-icon:hover {
      color: var(--ink);
      background: var(--surface);
      border-color: var(--border2);
    }
    .auth-btn-icon.active-user {
      color: var(--accent);
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 8%, transparent);
    }
    .auth-modal-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-modal-card {
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 8px;
      box-shadow: var(--shadow);
      width: 340px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }
    .auth-modal-close {
      position: absolute;
      top: 12px; right: 12px;
      background: none;
      border: none;
      color: var(--ink3);
      font-size: 16px;
      cursor: pointer;
    }
    .auth-modal-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--ink);
      margin-bottom: 4px;
    }
    .auth-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .auth-input-group label {
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--ink3);
    }
    .auth-input-group input {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border2);
      color: var(--ink);
      border-radius: 4px;
      padding: 8px 12px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }
    .auth-input-group input:focus {
      border-color: var(--accent);
    }
    .auth-msg {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .auth-msg.error {
      color: var(--accent2);
    }
    .auth-msg.success {
      color: var(--accent3);
    }
    .auth-toggle-link {
      font-size: 13px;
      color: var(--accent);
      text-decoration: none;
      cursor: pointer;
      text-align: center;
    }
    .auth-toggle-link:hover {
      text-decoration: underline;
    }
    .auth-user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 6px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 6px;
      box-shadow: var(--shadow);
      padding: 8px 0;
      min-width: 180px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    .auth-user-info {
      padding: 8px 16px;
      font-size: 13px;
      color: var(--ink3);
      border-bottom: 1px solid var(--border);
      word-break: break-all;
    }
    .auth-dropdown-item {
      padding: 8px 16px;
      font-size: 14px;
      color: var(--ink2);
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .auth-dropdown-item:hover {
      background: var(--surface2);
      color: var(--ink);
    }
    .auth-name-row {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    .auth-name-row .auth-input-group {
      flex: 1;
    }
  `;
  document.head.appendChild(style);
}

let currentUser = null;
let supabaseInstance = null;
let saveDebounceTimer = null;

function getPageName() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function getPageState() {
  const state = {};
  const pageName = getPageName();

  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    state._activeTab = activeTab.id;
  }

  const mode2d = document.getElementById('btn2d');
  const mode3d = document.getElementById('btn3d');
  if (mode2d && mode3d) {
    state._vectorMode = mode3d.classList.contains('active') ? '3d' : '2d';
  }

  document.querySelectorAll('select').forEach(el => {
    if (el.id) state[el.id] = el.value;
  });

  document.querySelectorAll('input').forEach(el => {
    if (!el.id) return;
    if (el.type === 'checkbox') {
      state[el.id] = el.checked;
    } else if (el.type === 'range' || el.type === 'number' || el.type === 'text') {
      state[el.id] = el.value;
    }
  });

  if (pageName === 'vector.html') {
    if (window.vectors && window.vectors.length > 0) {
      state._vectors = JSON.parse(JSON.stringify(window.vectors));
    }
    if (window.lcCoeffs && window.lcCoeffs.length > 0) {
      state._lcCoeffs = JSON.parse(JSON.stringify(window.lcCoeffs));
    }
    if (typeof window.lcShowOnCanvas !== 'undefined') {
      state._lcShowOnCanvas = window.lcShowOnCanvas;
    }
    if (typeof window.showSpan !== 'undefined') {
      state._showSpan = window.showSpan;
    }
    if (typeof window.showResultant !== 'undefined') {
      state._showResultant = window.showResultant;
    }
  }

  if (pageName === 'matrix.html') {
    if (window.mat) {
      state._mat = window.mat;
    }
    if (window.lmeVec) {
      state._lmeVec = window.lmeVec;
    }
  }

  return state;
}

function applyPageState(state) {
  const pageName = getPageName();

  if (state._activeTab) {
    const tabEl = document.getElementById(state._activeTab);
    if (tabEl) {
      tabEl.click();
    }
  }

  if (pageName === 'vector.html') {
    restoreVectorPageState(state);
    return;
  }

  if (pageName === 'matrix.html') {
    Object.keys(state).forEach(id => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'INPUT') {
        if (el.type === 'checkbox') {
          el.checked = !!state[id];
        } else {
          el.value = state[id];
        }
      }
    });
    restoreMatrixPageState(state);
    return;
  }

  function doRestore(attemptsLeft) {
    const canRestore = typeof window.render === 'function' &&
                       typeof window.W !== 'undefined' && window.W > 0;
    if (!canRestore) {
      if (attemptsLeft > 0) setTimeout(() => doRestore(attemptsLeft - 1), 200);
      return;
    }
    Object.keys(state).forEach(id => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') {
        el.value = state[id];
      } else if (el.tagName === 'INPUT') {
        if (el.type === 'checkbox') {
          el.checked = !!state[id];
        } else {
          el.value = state[id];
        }
      }
    });
    window.render();
  }

  setTimeout(() => doRestore(15), 300);
}

function restoreVectorPageState(state) {
  function attemptRestore(attemptsLeft) {
    const canRestore = typeof window.updateList === 'function' &&
                       typeof window.updatePanels === 'function' &&
                       typeof window.render === 'function' &&
                       typeof window.recalculateVectors === 'function' &&
                       typeof window.animateZoom === 'function' &&
                       typeof window.computeTargetUnit === 'function' &&
                       typeof window.setMode === 'function' &&
                       typeof window.W !== 'undefined' && window.W > 0;

    if (!canRestore) {
      if (attemptsLeft > 0) {
        setTimeout(() => attemptRestore(attemptsLeft - 1), 200);
      }
      return;
    }

    if (state._vectorMode && state._vectorMode !== window.currentMode) {
      window.currentMode = state._vectorMode;
      document.body.classList.toggle('mode3d', state._vectorMode === '3d');
      const btn2d = document.getElementById('btn2d');
      const btn3d = document.getElementById('btn3d');
      const canvas = document.getElementById('canvas');
      if (btn2d) btn2d.classList.toggle('active', state._vectorMode === '2d');
      if (btn3d) btn3d.classList.toggle('active', state._vectorMode === '3d');
      if (canvas) canvas.classList.toggle('mode3d', state._vectorMode === '3d');
    }

    if (state._vectors && state._vectors.length > 0) {
      window.vectors = JSON.parse(JSON.stringify(state._vectors));
      window.animState = window.vectors.map(() => 1);

      if (state._lcCoeffs && state._lcCoeffs.length > 0) {
        window.lcCoeffs = JSON.parse(JSON.stringify(state._lcCoeffs));
      } else {
        window.lcCoeffs = window.vectors.map(() => 1);
      }

      const lcToggle = document.getElementById('toggle-lc');
      if (lcToggle) {
        const lcVal = typeof state['toggle-lc'] !== 'undefined' ? !!state['toggle-lc'] : (typeof state._lcShowOnCanvas !== 'undefined' ? !!state._lcShowOnCanvas : false);
        window.lcShowOnCanvas = lcVal;
        lcToggle.checked = lcVal;
      }

      const spanToggle = document.getElementById('toggle-span');
      if (spanToggle) {
        const spanVal = typeof state['toggle-span'] !== 'undefined' ? !!state['toggle-span'] : (typeof state._showSpan !== 'undefined' ? !!state._showSpan : false);
        window.showSpan = spanVal;
        spanToggle.checked = spanVal;
      }

      const resToggle = document.getElementById('toggle-resultant');
      if (resToggle) {
        const resVal = typeof state['toggle-resultant'] !== 'undefined' ? !!state['toggle-resultant'] : (typeof state._showResultant !== 'undefined' ? !!state._showResultant : false);
        window.showResultant = resVal;
        resToggle.checked = resVal;
      }

      window.recalculateVectors();
      window.updateList();
      window.updatePanels();
      const target = window.computeTargetUnit();
      window.animateZoom(target);
      window.render();
    }
  }

  setTimeout(() => attemptRestore(20), 400);
}

function restoreMatrixPageState(state) {
  function attemptRestore(attemptsLeft) {
    const canRestore = typeof window.updateMatrix === 'function' &&
                       typeof window.updateLME === 'function';

    if (!canRestore) {
      if (attemptsLeft > 0) {
        setTimeout(() => attemptRestore(attemptsLeft - 1), 200);
      }
      return;
    }

    if (state._mat && window.mat) {
      window.mat = state._mat;
      const ids = ['m-a', 'm-b', 'm-c', 'm-d'];
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.value = state._mat[i];
      });
      window.animT = 1;
    }

    if (state._lmeVec && window.lmeVec) {
      window.lmeVec = state._lmeVec;
      const lmeX = document.getElementById('lme-x');
      const lmeY = document.getElementById('lme-y');
      if (lmeX) lmeX.value = state._lmeVec.x;
      if (lmeY) lmeY.value = state._lmeVec.y;
    }

    if (typeof window.refreshLMEPanel === 'function') window.refreshLMEPanel();
    if (typeof window.render === 'function') window.render();
  }

  setTimeout(() => attemptRestore(15), 300);
}

async function saveStateToSupabase() {
  if (!currentUser || !supabaseInstance) return;
  const pageName = getPageName();
  if (pageName === 'index.html' || pageName === 'references.html' || pageName === '') return;
  const state = getPageState();
  try {
    await supabaseInstance
      .from('user_states')
      .upsert({
        user_id: currentUser.id,
        page_name: pageName,
        state: state,
        updated_at: new Date().toISOString()
      });
  } catch (err) {
    console.error('State save error:', err);
  }
}

function triggerDebouncedSave() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(saveStateToSupabase, 1500);
}

async function loadStateFromSupabase() {
  if (!currentUser || !supabaseInstance) return;
  const pageName = getPageName();
  if (pageName === 'index.html' || pageName === 'references.html' || pageName === '') return;
  try {
    const { data, error } = await supabaseInstance
      .from('user_states')
      .select('state')
      .eq('user_id', currentUser.id)
      .eq('page_name', pageName)
      .maybeSingle();
    if (data && data.state) {
      applyPageState(data.state);
    }
  } catch (err) {
    console.error('State load error:', err);
  }
}

function toggleUserDropdown(supabase) {
  let dropdown = document.querySelector('.auth-user-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  dropdown = document.createElement('div');
  dropdown.className = 'auth-user-dropdown';
  const info = document.createElement('div');
  info.className = 'auth-user-info';
  const meta = currentUser.user_metadata || {};
  const displayName = (meta.first_name || meta.last_name)
    ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim()
    : currentUser.email;
  info.textContent = displayName;
  const emailLine = document.createElement('div');
  emailLine.style.cssText = 'font-size:11px;color:var(--ink3);margin-top:2px;word-break:break-all';
  if (meta.first_name || meta.last_name) {
    emailLine.textContent = currentUser.email;
    info.appendChild(emailLine);
  }
  dropdown.appendChild(info);
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'auth-dropdown-item';
  logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Log Out';
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    dropdown.remove();
  };
  dropdown.appendChild(logoutBtn);
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(dropdown);
  const closeDropdown = () => {
    if (dropdown.parentElement) dropdown.remove();
    document.removeEventListener('click', closeDropdown);
  };
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 0);
  dropdown.onclick = (e) => e.stopPropagation();
}

function showLoginModal(supabase) {
  let modal = document.querySelector('.auth-modal-overlay');
  if (modal) return;
  modal = document.createElement('div');
  modal.className = 'auth-modal-overlay';
  const card = document.createElement('div');
  card.className = 'auth-modal-card';
  modal.appendChild(card);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'auth-modal-close';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeBtn.onclick = () => modal.remove();
  card.appendChild(closeBtn);
  const title = document.createElement('h2');
  title.className = 'auth-modal-title';
  title.textContent = 'Sign In';
  card.appendChild(title);
  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '12px';
  card.appendChild(form);
  const nameRow = document.createElement('div');
  nameRow.className = 'auth-name-row';
  nameRow.style.display = 'none';
  form.appendChild(nameRow);
  const firstNameGroup = document.createElement('div');
  firstNameGroup.className = 'auth-input-group';
  firstNameGroup.innerHTML = '<label>First Name</label><input type="text">';
  nameRow.appendChild(firstNameGroup);
  const lastNameGroup = document.createElement('div');
  lastNameGroup.className = 'auth-input-group';
  lastNameGroup.innerHTML = '<label>Last Name</label><input type="text">';
  nameRow.appendChild(lastNameGroup);
  const emailGroup = document.createElement('div');
  emailGroup.className = 'auth-input-group';
  emailGroup.innerHTML = '<label>Email</label><input type="email" required>';
  form.appendChild(emailGroup);
  const passGroup = document.createElement('div');
  passGroup.className = 'auth-input-group';
  passGroup.innerHTML = '<label>Password</label><input type="password" required minlength="6">';
  form.appendChild(passGroup);
  const msg = document.createElement('div');
  msg.className = 'auth-msg';
  const forgotLink = document.createElement('a');
  forgotLink.className = 'auth-toggle-link';
  forgotLink.textContent = 'Forgot Password?';
  forgotLink.style.fontSize = '12px';
  forgotLink.style.textAlign = 'right';
  forgotLink.style.marginTop = '-4px';
  form.appendChild(forgotLink);
  form.appendChild(msg);
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-fill';
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Log In';
  form.appendChild(submitBtn);
  const toggleLink = document.createElement('a');
  toggleLink.className = 'auth-toggle-link';
  toggleLink.textContent = 'Need an account? Sign Up';
  form.appendChild(toggleLink);
  let mode = 'signin';
  const updateMode = (newMode) => {
    mode = newMode;
    msg.className = 'auth-msg';
    msg.innerHTML = '';
    if (mode === 'signin') {
      title.textContent = 'Sign In';
      nameRow.style.display = 'none';
      passGroup.style.display = 'flex';
      submitBtn.textContent = 'Log In';
      toggleLink.textContent = 'Need an account? Sign Up';
      toggleLink.style.display = 'block';
      forgotLink.style.display = 'block';
      firstNameGroup.querySelector('input').required = false;
      lastNameGroup.querySelector('input').required = false;
      passGroup.querySelector('input').required = true;
    } else if (mode === 'signup') {
      title.textContent = 'Sign Up';
      nameRow.style.display = 'flex';
      passGroup.style.display = 'flex';
      submitBtn.textContent = 'Sign Up';
      toggleLink.textContent = 'Already have an account? Log In';
      toggleLink.style.display = 'block';
      forgotLink.style.display = 'none';
      firstNameGroup.querySelector('input').required = true;
      lastNameGroup.querySelector('input').required = true;
      passGroup.querySelector('input').required = true;
    } else if (mode === 'forgot') {
      title.textContent = 'Reset Password';
      nameRow.style.display = 'none';
      passGroup.style.display = 'none';
      submitBtn.textContent = 'Send Reset Link';
      toggleLink.textContent = 'Back to Sign In';
      toggleLink.style.display = 'block';
      forgotLink.style.display = 'none';
      firstNameGroup.querySelector('input').required = false;
      lastNameGroup.querySelector('input').required = false;
      passGroup.querySelector('input').required = false;
    }
  };
  toggleLink.onclick = () => {
    if (mode === 'signin') updateMode('signup');
    else updateMode('signin');
  };
  forgotLink.onclick = () => {
    updateMode('forgot');
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = emailGroup.querySelector('input').value.trim();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    msg.className = 'auth-msg';
    msg.innerHTML = '';
    try {
      if (mode === 'signup') {
        const password = passGroup.querySelector('input').value;
        const firstName = firstNameGroup.querySelector('input').value.trim();
        const lastName = lastNameGroup.querySelector('input').value.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        if (error) throw error;
        msg.className = 'auth-msg success';
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Check your email to confirm!';
      } else if (mode === 'signin') {
        const password = passGroup.querySelector('input').value;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        modal.remove();
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href
        });
        if (error) throw error;
        msg.className = 'auth-msg success';
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Reset link sent to your email!';
      }
    } catch (err) {
      msg.className = 'auth-msg error';
      msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      if (mode === 'signup') submitBtn.textContent = 'Sign Up';
      else if (mode === 'signin') submitBtn.textContent = 'Log In';
      else if (mode === 'forgot') submitBtn.textContent = 'Send Reset Link';
    }
  };
  document.body.appendChild(modal);
}

function showUpdatePasswordModal(supabase) {
  let modal = document.querySelector('.auth-modal-overlay');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.className = 'auth-modal-overlay';
  const card = document.createElement('div');
  card.className = 'auth-modal-card';
  modal.appendChild(card);
  const title = document.createElement('h2');
  title.className = 'auth-modal-title';
  title.textContent = 'Set New Password';
  card.appendChild(title);
  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '12px';
  card.appendChild(form);
  const passGroup = document.createElement('div');
  passGroup.className = 'auth-input-group';
  passGroup.innerHTML = '<label>New Password</label><input type="password" required minlength="6">';
  form.appendChild(passGroup);
  const msg = document.createElement('div');
  msg.className = 'auth-msg';
  form.appendChild(msg);
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-fill';
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Update Password';
  form.appendChild(submitBtn);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const password = passGroup.querySelector('input').value;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    msg.className = 'auth-msg';
    msg.innerHTML = '';
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      msg.className = 'auth-msg success';
      msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Password updated!';
      setTimeout(() => modal.remove(), 1500);
    } catch (err) {
      msg.className = 'auth-msg error';
      msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${err.message}`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Password';
    }
  };
  document.body.appendChild(modal);
}

function renderAuthUI(supabase) {
  const container = document.querySelector('.header-actions');
  if (!container) return;
  let btn = document.getElementById('auth-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'auth-btn';
    btn.className = 'auth-btn-icon';
    container.insertBefore(btn, container.firstChild);
  }
  const existingDropdown = document.querySelector('.auth-user-dropdown');
  if (existingDropdown) existingDropdown.remove();
  if (currentUser) {
    btn.className = 'auth-btn-icon active-user';
    btn.innerHTML = '<i class="fa-solid fa-user"></i>';
    btn.title = currentUser.email;
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleUserDropdown(supabase);
    };
  } else {
    btn.className = 'auth-btn-icon';
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i>';
    btn.title = 'Sign In';
    btn.onclick = () => {
      showLoginModal(supabase);
    };
  }
}

function setupStateAutoSync() {
  const pageName = getPageName();
  if (pageName === 'index.html' || pageName === 'references.html') return;

  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
      triggerDebouncedSave();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('select, input')) {
      triggerDebouncedSave();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-btn') || e.target.closest('.btn-mode')) {
      setTimeout(triggerDebouncedSave, 50);
    }
  });

  if (pageName === 'vector.html') {
    const originalAddVector = window.addVector;
    const originalClearAll = window.clearAll;
    const originalRemoveVector = window.removeVector;
    const originalApplyScale = window.applyScale;

    if (typeof originalAddVector === 'function') {
      window.addVector = function() {
        originalAddVector.apply(this, arguments);
        setTimeout(triggerDebouncedSave, 600);
      };
    }
    if (typeof originalClearAll === 'function') {
      window.clearAll = function() {
        originalClearAll.apply(this, arguments);
        setTimeout(triggerDebouncedSave, 100);
      };
    }
    if (typeof originalRemoveVector === 'function') {
      window.removeVector = function() {
        originalRemoveVector.apply(this, arguments);
        setTimeout(triggerDebouncedSave, 300);
      };
    }
    if (typeof originalApplyScale === 'function') {
      window.applyScale = function() {
        originalApplyScale.apply(this, arguments);
        setTimeout(triggerDebouncedSave, 700);
      };
    }
  }
}

async function initSupabaseAnalytics() {
  injectStyles();
  try {
    let config = window.aimlConfig;
    if (!config) {
      try {
        const resp = await fetch('config.json');
        if (resp.ok) {
          config = await resp.json();
        }
      } catch (_) {}
    }
    if (!config) {
      try {
        await loadScript('config.js');
        config = window.aimlConfig;
      } catch (_) {}
    }
    if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return;
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    supabaseInstance = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    const { data: { session } } = await supabaseInstance.auth.getSession();
    currentUser = session ? session.user : null;
    renderAuthUI(supabaseInstance);
    if (currentUser) {
      await loadStateFromSupabase();
    }
    setupStateAutoSync();
    supabaseInstance.auth.onAuthStateChange(async (event, session) => {
      const oldUser = currentUser;
      currentUser = session ? session.user : null;
      renderAuthUI(supabaseInstance);
      if (event === 'PASSWORD_RECOVERY') {
        showUpdatePasswordModal(supabaseInstance);
      } else if (currentUser && !oldUser) {
        await loadStateFromSupabase();
      }
    });
  } catch (e) {
    console.error('Supabase init error:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabaseAnalytics);
} else {
  initSupabaseAnalytics();
}
