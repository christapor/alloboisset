/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'azure-blue': '#4A86B4',
        'nature-green': '#5B8C4E',
      },
    },
  },
  plugins: [],
}
