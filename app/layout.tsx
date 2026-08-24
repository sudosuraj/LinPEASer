import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ThemeSync } from '@/components/ThemeSync';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinPEASer',
  description: 'Turn raw LinPEAS output into organized, searchable privilege-escalation intelligence — entirely in your browser.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

// Applies the persisted theme before first paint so there's no flash of the
// wrong theme while React hydrates. Defaults to light — the app never
// infers dark from system preference on its own, only from an explicit
// prior choice, matching the toggle's default.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('linpeaser-ui-prefs');
    var theme = 'light';
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.theme === 'dark') theme = 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
