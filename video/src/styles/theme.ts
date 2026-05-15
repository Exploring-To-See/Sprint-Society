export const colors = {
  bg: {
    primary: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A2E',
  },
  accent: {
    green: '#39FF14',
    blue: '#00D4FF',
    pink: '#FF1493',
    gold: '#FFD700',
    orange: '#FF4D00',
    red: '#FF1744',
    ember: '#FF6B35',
  },
  tier: {
    beginner: '#39FF14',
    intermediate: '#00D4FF',
    advanced: '#FFD700',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0C0',
    muted: '#6B6B80',
  },
} as const;

export const fonts = {
  heading: 'Space Grotesk',
  body: 'Inter',
  mono: 'JetBrains Mono',
} as const;

export const aspectRatios = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
} as const;

export type AspectRatio = keyof typeof aspectRatios;

export const fps = 30;
