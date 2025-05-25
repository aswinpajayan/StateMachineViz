import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  console.log('[ThemeContext] ThemeProvider initializing.'); // Log for provider initialization
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        console.log(`[ThemeContext] Initial theme from localStorage: ${storedTheme}`);
        return storedTheme;
      }
      console.log('[ThemeContext] No valid theme in localStorage or not found.');
    }
    console.log('[ThemeContext] Defaulting to "system" theme.');
    return 'system'; // Default theme
  });

  const applyTheme = useCallback((themeToApply: Theme) => {
    console.log(`[ThemeContext] Attempting to apply theme: ${themeToApply}`);
    const root = window.document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(`[ThemeContext] System prefers dark: ${isDarkSystem}`);

    if (themeToApply === 'dark' || (themeToApply === 'system' && isDarkSystem)) {
      console.log('[ThemeContext] Adding "dark" class to HTML element.');
      root.classList.add('dark');
    } else {
      console.log('[ThemeContext] Removing "dark" class from HTML element.');
      root.classList.remove('dark');
    }
  }, []);

  // Effect to apply the theme whenever the 'theme' state changes.
  useEffect(() => {
    console.log(`[ThemeContext] Theme state changed to: ${theme}. Applying theme.`);
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Effect to listen for system theme changes IF the current theme is 'system'.
  useEffect(() => {
    if (theme !== 'system') {
      return; // Not in system mode, no listener needed.
    }

    console.log('[ThemeContext] Theme is "system", attaching system preference listener.');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      console.log(`[ThemeContext] System color scheme changed. New preference isDark: ${e.matches}. Re-applying system theme.`);
      applyTheme('system'); // Re-evaluate and apply based on new system preference
    };
    
    // Apply system theme once when listener is attached if theme is 'system'
    // This is covered by the previous effect, but ensures consistent application
    // if this effect runs after the theme is set to 'system'.
    // applyTheme('system'); // Already handled by the effect above that watches `theme`

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      console.log('[ThemeContext] Cleaning up system preference listener.');
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]); 

  const setTheme = (newTheme: Theme) => {
    console.log(`[ThemeContext] setTheme called with: ${newTheme}`);
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};