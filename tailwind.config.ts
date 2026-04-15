import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8e8',
          100: '#faefc5',
          200: '#f5df8e',
          300: '#f0c94d',
          400: '#e8b620',
          500: '#d4a017',
          600: '#a67c12',
          700: '#7a5b10',
          800: '#534014',
          900: '#2d2310',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b0b0b0',
          300: '#808080',
          400: '#505050',
          500: '#303030',
          600: '#252525',
          700: '#1a1a1a',
          800: '#121212',
          900: '#0a0a0a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
