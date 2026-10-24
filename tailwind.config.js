/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: { bg: '#050B18', bg2: '#071426', side: '#06111F', card: '#081A2E' },
        neon: { cyan: '#00E5FF', blue: '#00AEEF', pln: '#0072CE' },
        ok: '#00D26A', warn: '#FFB800', alert: '#FF8A00', crit: '#FF3B3B',
        gold: { DEFAULT: '#FFC940', soft: '#FFD978', deep: '#E8A900' },
      },
      fontFamily: { sans: ['Inter', '"Plus Jakarta Sans"', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
