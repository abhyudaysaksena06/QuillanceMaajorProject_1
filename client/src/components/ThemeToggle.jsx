import { useState } from 'react';
import { applyTheme } from '../theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };
  return (
    <button className="icon-btn theme-toggle" onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle dark mode">
      {theme === 'dark' ? '☼' : '☾'}
    </button>
  );
}
