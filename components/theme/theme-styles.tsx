"use client";

import { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeStyles() {
  const { theme } = useTheme();

  useEffect(() => {
    // Force application of dark theme
    const root = document.documentElement;
    
    // Always apply dark theme
    root.classList.add('dark');
    root.classList.remove('light');
    
    // Force a style recalculation
    root.style.display = 'none';
    void root.offsetHeight; // Trigger reflow
    root.style.display = '';
    
  }, [theme]);

  return null;
} 