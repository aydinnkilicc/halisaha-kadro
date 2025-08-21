/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          purple: '#7c3aed',
          pink: '#ec4899',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(59,130,246,0.35)',
      },
    },
  },
  plugins: [],
}
