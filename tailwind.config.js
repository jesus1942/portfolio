/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        hand: ['Caveat', 'cursive'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'draw': 'draw 1.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        draw: {
          '0%': { 'stroke-dashoffset': '1000' },
          '100%': { 'stroke-dashoffset': '0' },
        },
      },
    },
  },
  plugins: [],
};
