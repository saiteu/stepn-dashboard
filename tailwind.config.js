/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00e5a0',
        bg: '#0a0e0d',
        bg2: '#111714',
        bg3: '#181f1c',
      },
    },
  },
  plugins: [],
}
