/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F1117',
        surface: '#1A1D27',
        'surface-2': '#232636',
        'surface-3': '#2D3047',
        border: '#2D3047',
        primary: {
          DEFAULT: '#4F7EFF',
          hover: '#3A6AEE',
          muted: '#1E3A7A',
        },
        success: {
          DEFAULT: '#3ECF6B',
          muted: '#1A4D2E',
        },
        warning: {
          DEFAULT: '#F5A623',
          muted: '#4D3400',
        },
        danger: {
          DEFAULT: '#FF5757',
          muted: '#4D1A1A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8B8FA8',
          muted: '#5A5E77',
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
