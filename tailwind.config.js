/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    zIndex: {
      'max': '2147483647',
    },
  },
  plugins: [],
}

