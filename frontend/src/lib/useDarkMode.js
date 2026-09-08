import { useState, useEffect } from 'react';

/**
 * Dark mode hook — body'ye 'dark' class ekler/kaldırır,
 * localStorage'da 'fizyo_dark_mode' key'inde saklar.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('fizyo_dark_mode');
      if (saved !== null) return saved === 'true';
      // Sistem tercihine bak
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDark) {
      body.classList.add('dark');
      root.classList.add('dark');
    } else {
      body.classList.remove('dark');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('fizyo_dark_mode', String(isDark));
    } catch {}
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return { isDark, toggle };
}
