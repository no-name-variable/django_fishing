/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основные цвета темы
        primary: {
          50: '#eef9ff',
          100: '#d9f2ff',
          200: '#bce8ff',
          300: '#8edaff',
          400: '#58c3ff',
          500: '#32a5ff',
          600: '#1a87f5',
          700: '#146fe1',
          800: '#1759b6',
          900: '#194c8f',
          950: '#142f57',
        },
        // Фоновые цвета (подводная тема)
        deep: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7cd4fd',
          400: '#36bffa',
          500: '#0ca5eb',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Цвета воды
        water: {
          light: '#a8d8ea',
          DEFAULT: '#62b6cb',
          dark: '#1b4965',
          deeper: '#0d2d4a',
          abyss: '#071a2e',
        },
        // Редкость предметов/рыбы
        rarity: {
          common: '#9ca3af',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f97316',
        },
        // UI цвета
        card: {
          DEFAULT: 'rgba(13, 45, 74, 0.8)',
          hover: 'rgba(13, 45, 74, 0.95)',
          border: 'rgba(98, 182, 203, 0.3)',
        },
        // Акцентные цвета
        accent: {
          gold: '#fbbf24',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
        },
      },
      backgroundImage: {
        // Градиенты
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-underwater': 'linear-gradient(180deg, #0c4a6e 0%, #082f49 50%, #071a2e 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(13, 45, 74, 0.9) 0%, rgba(7, 26, 46, 0.9) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(98, 182, 203, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(98, 182, 203, 0.3)',
        'glow-sm': '0 0 10px rgba(98, 182, 203, 0.2)',
        'glow-lg': '0 0 40px rgba(98, 182, 203, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(98, 182, 203, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'bubble': 'bubble 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bubble: {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(98, 182, 203, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(98, 182, 203, 0.5)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      scale: {
        '98': '0.98',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
