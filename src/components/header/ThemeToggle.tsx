'use client';

import { FiMoon, FiSun } from 'react-icons/fi';

import { useTheme } from '@/providers/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const label = isDark ? 'Passer au thème clair' : 'Passer au thème sombre';

  return (
    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={label} title={label}>
      {isDark ? <FiSun /> : <FiMoon />}
    </button>
  );
}
