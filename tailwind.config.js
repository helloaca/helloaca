/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#E5E7EB',
        background: '#FFFFFF',
        foreground: '#111827',
        primary: {
          DEFAULT: '#4ECCA3',
          50: '#E8F9F5',
          100: '#D1F3EB',
          200: '#A3E7D7',
          300: '#75DBC3',
          400: '#4ECCA3',
          500: '#3DBB90',
          600: '#2E8F6D',
          700: '#1F634A',
          800: '#103727',
          900: '#081B14'
        },
        secondary: {
          DEFAULT: '#000000',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif']
      },
      borderRadius: {
        'card': '20px',
        'button': '12px'
      },
      boxShadow: {
        'card': '0px 6px 18px rgba(0,0,0,0.06)'
      },
      spacing: {
        'card': '24px'
      }
    },
  },
  plugins: [],
}