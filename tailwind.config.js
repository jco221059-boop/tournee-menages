/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        surface: '#FFFFFF',
        'surface-2': '#F5F0EA',
        'surface-3': '#EDE0D0',
        border: '#EDE0D0',
        primary: {
          DEFAULT: '#6B9E78',
          hover: '#5A8A67',
          muted: '#EEF4EF',
        },
        success: {
          DEFAULT: '#6B9E78',
          muted: '#EEF4EF',
        },
        warning: {
          DEFAULT: '#D97706',
          muted: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          muted: '#FEF2F2',
        },
        text: {
          primary: '#2C1F0E',
          secondary: '#A8937A',
          muted: '#C4A882',
        },
        worker: {
          jc: '#4F7EFF',
          madame: '#A855F7',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(79, 126, 255, 0.3)',
        'glow-success': '0 0 20px rgba(62, 207, 107, 0.3)',
        card: '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
