/** @type {import('tailwindcss').Config} */
module.exports = {
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
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--brand-strong) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        'luxury': '1.4rem',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'sans-serif'],
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
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease both',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
