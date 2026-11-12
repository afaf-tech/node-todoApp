(() => {
  const storageKey = 'todo-theme';
  let storedTheme;

  try {
    storedTheme = localStorage.getItem(storageKey);
  } catch {
    storedTheme = null;
  }

  const prefersLight = window.matchMedia?.(
    '(prefers-color-scheme: light)',
  ).matches;
  const theme =
    storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : prefersLight
        ? 'light'
        : 'dark';

  document.documentElement.dataset.theme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = theme === 'light' ? '#f3f5fb' : '#0b0f17';
  }
})();
