/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {
    colors: { never86: { ink: '#0a0a0a', gold: '#d4a24c', bolt: '#111111' } },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
  }},
  plugins: [],
};
