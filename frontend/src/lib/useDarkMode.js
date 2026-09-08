import { useState, useEffect } from 'react';

/**
 * Dark mode hook — body'ye 'dark' class ekler/kaldırır,
 * localStorage'da 'fizyo_dark_mode' key'inde saklar.
 * enabled: false ise (örn. landing/login sayfasındayken) dark mode devre dışı kalır.
 */
export function useDarkMode(enabled = true) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('fizyo_dark_mode');
      if (saved !== null) return saved === 'true';
      // Varsayılan olarak aydınlık modda başla (kullanıcı isterse panelden açabilir)
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (enabled && isDark) {
      body.classList.add('dark');
      root.classList.add('dark');
    } else {
      body.classList.remove('dark');
      root.classList.remove('dark');
    }
  }, [isDark, enabled]);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fizyo_dark_mode', String(next));
      } catch {}
      return next;
    });
  };

  return { isDark: enabled ? isDark : false, toggle };
}
