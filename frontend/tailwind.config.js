/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0f19',
          800: '#111827',
          700: '#1f293d',
          600: '#374151'
        },
        aqi: {
          good: '#10B981',
          moderate: '#F59E0B',
          sensitive: '#F97316',
          unhealthy: '#EF4444',
          veryUnhealthy: '#8B5CF6',
          hazardous: '#881337'
        }
      }
    },
  },
  plugins: [],
}
