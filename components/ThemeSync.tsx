'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/lib/store/uiStore';

/**
 * Keeps <html data-theme> in sync with the persisted theme preference —
 * covers both the initial rehydration-from-localStorage and later toggles.
 * The inline script in the root layout handles the very first paint (before
 * this component can mount) so there's no flash of the wrong theme.
 */
export function ThemeSync() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
