import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090B',
          secondary: '#131316',
          tertiary: '#1E1E22',
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
      fontSize: {
        'display': ['28px', { lineHeight: '1.1', fontWeight: '800' }],
        'h1': ['22px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['10px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '10px',
        'badge': '8px',
        'pill': '9999px',
      },
      spacing: {
        'card-pad': '16px',
        'section-gap': '16px',
        'page-x': '16px',
      },
      animation: {
        'slide-up': 'slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
