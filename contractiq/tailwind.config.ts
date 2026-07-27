import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          900: '#082A5E',
          800: '#0A367B',
          700: '#0D469E',
          600: '#0044AE',
          500: '#115ACB',
          400: '#89B7FF',
          300: '#6196EA',
          200: '#92B7F0',
          100: '#B6CFF5',
          50: '#E7EFFC',
        },
        grey: {
          900: '#070A0E',
          800: '#151719',
          700: '#25272B',
          600: '#2C2F32',
          500: '#4A4C4F',
          400: '#5E6062',
          300: '#8F9193',
          200: '#C1C2C3',
          100: '#DADADB',
          50: '#F0F0F1',
          25: '#FAFAFA',
        },
        success: {
          900: '#084406',
          500: '#13A10E',
          200: '#92D490',
          50: '#E7F6E7',
        },
        warning: {
          900: '#854D00',
          500: '#FFAA33',
          200: '#FFE3BD',
          50: '#FFF9F0',
        },
        danger: {
          900: '#581618',
          700: '#942528',
          500: '#D13438',
          200: '#EAA2A3',
          50: '#FAEBEB',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
        '28': '112px',
      },
    },
  },
  plugins: [],
}

export default config
