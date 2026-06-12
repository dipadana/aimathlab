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

function getPageState() {
  const state = {};
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    state._activeTab = activeTab.id;
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
  return state;
}

function applyPageState(state) {
  if (state._activeTab) {
    const tabEl = document.getElementById(state._activeTab);
    if (tabEl) {
      tabEl.click();
    }
  }
  Object.keys(state).forEach(id => {
    if (id.startsWith('_')) return;
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.value = state[id];
      el.dispatchEvent(new Event('change'));
    } else if (el.tagName === 'INPUT') {
      if (el.type === 'checkbox') {
        el.checked = state[id];
        el.dispatchEvent(new Event('change'));
      } else {
        el.value = state[id];
        el.dispatchEvent(new Event('input'));
        el.dispatchEvent(new Event('change'));
      }
    }
  });
}

async function saveStateToSupabase() {
  if (!currentUser || !supabaseInstance) return;
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  if (pageName === 'index.html' || pageName === 'references.html') return;
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
    console.error(err);
  }
}

function triggerDebouncedSave() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(saveStateToSupabase, 1000);
}

async function loadStateFromSupabase() {
  if (!currentUser || !supabaseInstance) return;
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  if (pageName === 'index.html' || pageName === 'references.html') return;
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
    console.error(err);
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
  info.textContent = currentUser.email;
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
    dropdown.remove();
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
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-fill';
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Log In';
  const toggleLink = document.createElement('a');
  toggleLink.className = 'auth-toggle-link';
  toggleLink.textContent = 'Need an account? Sign Up';
  const forgotLink = document.createElement('a');
  forgotLink.className = 'auth-toggle-link';
  forgotLink.textContent = 'Forgot Password?';
  forgotLink.style.fontSize = '12px';
  forgotLink.style.textAlign = 'right';
  forgotLink.style.marginTop = '-8px';
  form.appendChild(forgotLink);
  form.appendChild(msg);
  form.appendChild(submitBtn);
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
    const email = emailGroup.querySelector('input').value;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    msg.className = 'auth-msg';
    msg.innerHTML = '';
    try {
      if (mode === 'signup') {
        const password = passGroup.querySelector('input').value;
        const firstName = firstNameGroup.querySelector('input').value;
        const lastName = lastNameGroup.querySelector('input').value;
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
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Check your email!';
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
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Reset link sent!';
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
  title.textContent = 'Update Password';
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
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleUserDropdown(supabase);
    };
  } else {
    btn.className = 'auth-btn-icon';
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i>';
    btn.onclick = () => {
      showLoginModal(supabase);
    };
  }
}

function setupStateAutoSync() {
  document.addEventListener('input', (e) => {
    if (e.target.matches('input')) {
      triggerDebouncedSave();
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('select, input')) {
      triggerDebouncedSave();
    }
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-btn')) {
      triggerDebouncedSave();
    }
  });
}

async function initSupabaseAnalytics() {
  injectStyles();
  try {
    await loadScript('config.js');
    if (!window.aimlConfig) return;
    const config = window.aimlConfig;
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return;
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
    console.error(e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabaseAnalytics);
} else {
  initSupabaseAnalytics();
}
