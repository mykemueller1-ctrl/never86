import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Apple-style neutral palette. ink-* = the new "dark" scale, but applied
        // to LIGHT mode (light bg, near-black text). Keeps existing `dark-*`
        // class usages working but maps them to a neutral grayscale that reads
        // professional + clean.
        ink: {
          50: '#fbfbfd',  // page bg (Apple's lightest)
          100: '#f5f5f7', // section bg (Apple's grouped table bg)
          200: '#e8e8ed', // card bg subtle
          300: '#d2d2d7', // borders
          400: '#a1a1a6', // disabled / muted
          500: '#86868b', // tertiary text
          600: '#515154', // secondary text
          700: '#2c2c2e', // dark surfaces
          800: '#1d1d1f', // primary text (Apple's exact)
          900: '#000000', // pure black (Apple uses this for CTAs)
        },
        // Brand identity color — kept for monogram + accents only. Restraint.
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
        // Single-restrained-accent color — Apple-finance navy. Used sparingly.
        accent: {
          50: '#f0f5ff',
          100: '#dde9fb',
          200: '#bdd3f7',
          300: '#8eb4f0',
          400: '#5a8de4',
          500: '#2e69d4',
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#1e3263',
          900: '#0a2540', // primary navy
        },
        // Compatibility shim — `dark-*` classes used across legacy components
        // remap to the light/neutral scale so the dark UI flips to light without
        // a per-file rename. dark-50 → near-black text on light; dark-800/900 → pure black surfaces.
        dark: {
          50: '#1d1d1f',  // was light text on dark; now: primary text
          100: '#2c2c2e', // secondary text
          200: '#515154',
          300: '#86868b',
          400: '#a1a1a6',
          500: '#d2d2d7',
          600: '#e8e8ed', // borders
          700: '#f5f5f7', // card bg
          800: '#fbfbfd', // page bg
          900: '#ffffff', // pure white
        },
        // Status colors — match Apple HIG
        success: { 500: '#34c759' },
        warning: { 500: '#ff9500' },
        danger: { 500: '#ff3b30' },
        info: { 500: '#0a84ff' },
      },
      boxShadow: {
        // Apple-style soft shadows — flat, no glow
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.08)',
        'btn': '0 1px 2px rgba(0,0,0,0.08)',
        'subtle': '0 1px 0 rgba(0,0,0,0.04)',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.022em', // Apple's heading tracking
      },
    },
  },
  plugins: [],
};

export default config;
