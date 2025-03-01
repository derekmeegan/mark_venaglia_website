/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#333333',
        cream: '#FDF6E3',
        gold: '#f4b305',
      },
      letterSpacing: {
        'extra': '0.15em',
      },
    },
  },
  plugins: [],
};