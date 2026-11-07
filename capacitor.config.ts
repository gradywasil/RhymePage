import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rhymepage.app',
  appName: 'RhymePage',
  webDir: 'dist-android',
  // MainActivity supplies CSS insets so older WebViews can also paint behind the gesture bar.
  plugins: {
    SystemBars: { insetsHandling: 'disable' },
    // iOS: shrink the web view above the keyboard so the suggestion sheet stays
    // visible while writing. Android keeps MainActivity's own IME padding.
    Keyboard: { resize: 'native', resizeOnFullScreen: false },
  },
  server: process.env.RHYMEPAGE_EMULATOR === 'true' ? { androidScheme: 'http' } : undefined,
};

export default config;
