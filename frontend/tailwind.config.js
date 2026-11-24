/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        panel: '#0d1a2b',
        line: '#1d3047',
        signal: '#39e6b0',
        cyan: '#5cc8ff',
      },
      boxShadow: {
        panel: '0 18px 55px rgba(0, 0, 0, 0.24)',
        signal: '0 0 30px rgba(57, 230, 176, 0.16)',
      },
    },
  },
  plugins: [],
}
