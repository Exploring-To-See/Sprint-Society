import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090B',
          secondary: '#18181B',
          tertiary: '#27272A',
        },
        accent: {
          DEFAULT: '#F97316',
          warm: '#FB923C',
          gold: '#FBBF24',
          green: '#10B981',
        },
        tier: {
          beginner: '#10B981',
          intermediate: '#F97316',
          advanced: '#FBBF24',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-up': 'slide-up 0.15s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
