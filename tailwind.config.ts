import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        gold: {
          50: '#fef9e7',
          100: '#fdf0b9',
          200: '#fbe17e',
          300: '#f7cc3f',
          400: '#ecb318',
          500: '#d49a0e',
          600: '#a3760a',
          700: '#785608',
          800: '#503a08',
          900: '#2a1e04',
        },
        copper: {
          50: '#fff5ec',
          100: '#ffe6cf',
          200: '#fdc89e',
          300: '#fba462',
          400: '#f78135',
          500: '#e25c12',
          600: '#c2410c',
          700: '#9a3412',
          800: '#7c2d12',
          900: '#431407',
        },
        dark: {
          50: '#f6f4f1',
          100: '#e7e3dc',
          200: '#bdb6ab',
          300: '#857d72',
          400: '#5a5249',
          500: '#3a342d',
          600: '#28231f',
          700: '#1d1916',
          800: '#15120f',
          900: '#0b0a08',
        },
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(212,154,14,0.07) 1px, transparent 1px), linear-gradient(to right, rgba(212,154,14,0.07) 1px, transparent 1px)',
        'gold-warm':
          'radial-gradient(60% 60% at 50% 0%, rgba(212,154,14,0.25), transparent 70%)',
        'copper-glow':
          'radial-gradient(50% 50% at 80% 100%, rgba(226,92,18,0.22), transparent 70%)',
      },
      boxShadow: {
        'gold-glow': '0 0 0 1px rgba(212,154,14,0.20), 0 25px 50px -20px rgba(212,154,14,0.35)',
        'copper-glow': '0 0 0 1px rgba(226,92,18,0.25), 0 25px 50px -20px rgba(226,92,18,0.35)',
        'card': '0 1px 0 rgba(255,255,255,0.02) inset, 0 30px 60px -30px rgba(0,0,0,0.6)',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-12px,0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 8s ease-in-out infinite',
        pulseDot: 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
