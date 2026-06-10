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
