/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dragon: {
          950: '#0a0a0c',
          900: '#121214',
          800: '#1a1a1e',
          700: '#25252b',
          600: '#34343d',
          500: '#4a4a58',
          400: '#717181',
          300: '#a1a1af',
          200: '#d1d1d6',
          100: '#e5e5e7',
          50: '#f4f4f5',
        },
        health: {
          base: '#10b981',
          dark: '#065f46',
          light: '#34d399',
        },
        damage: {
          base: '#f43f5e',
          dark: '#9f1239',
          light: '#fb7185',
        },
        player: {
          base: '#6366f1',
          dark: '#3730a3',
          light: '#818cf8',
        },
        warning: {
          base: '#f59e0b',
          dark: '#92400e',
          light: '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
