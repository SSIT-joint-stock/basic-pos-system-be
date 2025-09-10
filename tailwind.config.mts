// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './views/**/*.hbs',           // if you use Handlebars
    './views/**/*.ejs',           // or EJS
    './src/docs/**/*.hbs',        // Handlebars templates in docs
    './src/docs/templates/**/*.hbs', // Specific templates folder
    './src/**/*.ts',              // class tailwind generated in ts (string template, etc.)
    './public/**/*.html',         // if you have static html files
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
