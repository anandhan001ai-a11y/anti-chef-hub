/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#3AA6FF',
          orange: '#FF8C42',
          green: '#61E294',
          violet: '#B46CFF',
          red: '#FF5757',
        },
        card: {
          bg: '#F4F6F8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '22': '22px',
        '24': '24px',
      },
      boxShadow: {
        'soft': '0px 10px 30px rgba(0, 0, 0, 0.06)',
        'neon-blue': '0 0 20px rgba(58, 166, 255, 0.5)',
        'neon-orange': '0 0 20px rgba(255, 140, 66, 0.5)',
        'neon-green': '0 0 20px rgba(97, 226, 148, 0.5)',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
    },
  },
  plugins: [],
};
