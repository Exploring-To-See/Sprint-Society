import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.sprintsociety.app',
  appName: 'Sprint Society',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#09090B',
  },
  ios: {
    backgroundColor: '#09090B',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#09090B',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090B',
      overlaysWebView: false,
    },
  },
};

export default config;
