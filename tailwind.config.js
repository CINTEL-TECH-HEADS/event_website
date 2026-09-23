/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        'background-soft': 'rgb(var(--background-soft) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        'foreground-soft': 'rgb(var(--foreground-soft) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        'panel-muted': 'rgb(var(--panel-muted) / <alpha-value>)',
        muted: 'rgb(var(--panel-muted) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--brand-strong) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        // Raw retro-poster primaries — fixed hex, identical in both themes.
        // Reach for these for full-bleed poster-panel backgrounds and
        // illustration fills (asteroids, starbursts, badges); prefer the
        // semantic tokens above for interactive UI so it still adapts
        // per theme.
        'primary-red': '#D6294C',
        'primary-blue': '#14120F',
        'primary-yellow': '#F2C230',
        cream: '#F5F0E3',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        none: '0px',
        poster: '1.75rem',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        display: ['var(--font-bungee)', 'sans-serif'],
        tech: ['var(--font-space-mono)', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
      keyframes: {
        'fade-in': {
          'from': {
            'opacity': '0',
            'transform': 'translateY(12px)',
          },
          'to': {
            'opacity': '1',
            'transform': 'translateY(0)',
          },
        },
        'shimmer': {
          'to': {
            'background-position': '-200% 0',
          },
        },
        'spin-slow': {
          'to': {
            'transform': 'rotate(360deg)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease both',
        'shimmer': 'shimmer 1.8s linear infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
}
