/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#0a0a0f',
          card: '#0f0f1a',
          border: '#1a1a2e',
          hover: '#141428',
        },
        neon: {
          green: '#00ff88',
          cyan: '#00d4ff',
          blue: '#0066ff',
        },
        risk: {
          low: '#00ff88',
          medium: '#ffd700',
          high: '#ff6b35',
          critical: '#ff0040',
        },
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #ff0040, 0 0 10px #ff0040' },
          '100%': { boxShadow: '0 0 15px #ff0040, 0 0 30px #ff0040, 0 0 50px #ff0040' },
        },
      },
    },
  },
  plugins: [],
}
