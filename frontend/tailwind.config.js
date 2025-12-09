/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-indigo': '#4F46E5',
        'accent-green': '#10B981',
        'dark-bg': '#0F172A',
        'dark-card': '#1E293B',
      },
    },
  },
  plugins: [],
}