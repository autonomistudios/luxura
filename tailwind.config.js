/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        glint: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        scan: {
          '0%': { top: '-100%' },
          '100%': { top: '100%' },
        },
      },
      animation: {
        glint: 'glint 4s linear infinite',
        scan: 'scan 2.5s ease-in-out infinite',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'Courier', 'monospace'],
      },
      colors: {
        background: '#FAF9F6',
        surface: '#F2EFE9',
        border: '#E5E0D8',
        text: '#1C1C1C',
        muted: '#6E6A60',
        obsidian: '#0B0B0B', 
        gold: {
          light: '#FDE68A',
          DEFAULT: '#D4AF37',
          hover: '#B5952F',
          dark: '#B5952F',
        },
        mercury: {
          light: '#FFFFFF',
          DEFAULT: '#E5E5E5',
          dark: '#A3A3A3',
        },
        anthracite: '#F2EFE9',
      }
    },
  },
  plugins: [],
}

