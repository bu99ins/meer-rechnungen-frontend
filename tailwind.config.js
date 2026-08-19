/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deutsch und Meer brand palette (docs/visual-identity.md), sampled from the business
        // card artwork. `deep` is the primary action colour; `sky` is an accent only — never the
        // primary action colour, never the sole carrier of a meaning, never small text on white
        // (see the spec). `gray` is the muted text tone. `-dark` variants are hover/active states
        // for the two blues; `tint` is a light deep-blue wash for subtle backgrounds (e.g. icon
        // circles) that used to carry the old scaffold's purple-blue tint.
        brand: {
          deep: '#1066A4',
          'deep-dark': '#0C4F80',
          sky: '#1EABE2',
          'sky-dark': '#1789B7',
          gray: '#6A6B6D',
          tint: '#EAF3FA',
        },
      },
    },
  },
  plugins: [],
}
