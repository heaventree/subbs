/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0E14',
        surface: '#141926',
        raised: '#1A2030',
        line: '#232B3B',
        ink: '#E6E9EF',
        muted: '#8A93A6',
        dimmed: '#5B6373',
        accent: { DEFAULT: '#6366F1', hover: '#818CF8' },
        income: '#34D399',
        expense: '#F87171',
        warn: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
