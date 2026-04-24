/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fa-bg-page': 'var(--fa-bg-page)',
        'fa-bg-shell': 'var(--fa-bg-shell)',
        'fa-bg-card': 'var(--fa-bg-card)',
        'fa-bg-hover': 'var(--fa-bg-hover)',
        'fa-brand': 'var(--fa-brand)',
        'fa-text-primary': 'var(--fa-text-primary)',
        'fa-text-secondary': 'var(--fa-text-secondary)',
        'fa-text-muted': 'var(--fa-text-muted)',
        'fa-border': 'var(--fa-border)',
        'fa-state-focused': 'var(--fa-state-focused)',
        'fa-state-distracted': 'var(--fa-state-distracted)',
        'fa-state-stressed': 'var(--fa-state-stressed)',
        'fa-state-fatigued': 'var(--fa-state-fatigued)',
        'fa-state-away': 'var(--fa-state-away)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
