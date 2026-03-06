/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nordic clean color palette
        primary: {
          50: '#EBF4FB',
          100: '#D6E9F7',
          200: '#ADD3EF',
          300: '#84BCE7',
          400: '#5BA6DF',
          500: '#4A90D9', // Primary blue
          600: '#2E7DC8',
          700: '#2366A4',
          800: '#1A4E81',
          900: '#11365E',
        },
        secondary: {
          50: '#EDFAF3',
          100: '#D3F4E3',
          200: '#A8E8C8',
          300: '#7DDCAD',
          400: '#6BBF8A', // Secondary green
          500: '#52A872',
          600: '#3E8E5A',
          700: '#2D7244',
          800: '#1E5530',
          900: '#10391F',
        },
        accent: {
          50: '#FEF9EC',
          100: '#FEF2D0',
          200: '#FCE4A1',
          300: '#FAD572',
          400: '#F8C643',
          500: '#F5A623', // Accent amber
          600: '#E08910',
          700: '#B96C0C',
          800: '#924F09',
          900: '#6B3306',
        },
        concern: {
          50: '#FDECEC',
          100: '#FAD0D0',
          200: '#F5A1A1',
          300: '#EF7272',
          400: '#EA4343',
          500: '#E74C3C', // Concern red
          600: '#C8362D',
          700: '#A52722',
          800: '#821A17',
          900: '#5E100E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
