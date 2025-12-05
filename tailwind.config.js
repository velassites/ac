/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Principal (Teal/Cian): #0BBCDA
        primary: {
          50: '#e0fbfd',
          100: '#bdf4fa',
          200: '#8bebf6',
          300: '#4cdff0',
          400: '#0bbcda', // MAIN
          500: '#099dbd',
          600: '#0b7d9b',
        },
        // Secundario (Coral/Rojo suave): #FF675E
        secondary: {
          50: '#fff0ef',
          100: '#ffe0de',
          400: '#FF675E', // MAIN
          500: '#e04f46',
          600: '#c93b32',
        },
        // Fondo Oscuro (Dark/Negro suave): #1E1C1C
        dark: {
          DEFAULT: '#1E1C1C',
          800: '#2d2a2a',
          900: '#1E1C1C', // MAIN
        },
        // Acento Crema (Cream): #FFF0D2
        cream: {
          100: '#FFF0D2', // MAIN
          200: '#ffe6b3',
        }
      }
    },
  },
  plugins: [],
}