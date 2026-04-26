/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        scout: {
          bg: '#0A0A0F',
          surface: '#12121A',
          card: '#1A1A26',
          border: '#252535',
          accent: '#6C63FF',
          glow: '#8B5CF6',
          gold: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
          text: '#E8E8F0',
          muted: '#6B6B8A',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 40% 20%, hsla(256,80%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,80%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,80%,60%,0.08) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}