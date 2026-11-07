import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rhymepage.app',
  appName: 'RhymePage',
  webDir: 'dist-android',
  // MainActivity supplies CSS insets so older WebViews can also paint behind the gesture bar.
  plugins: { SystemBars: { insetsHandling: 'disable' } },
  server: process.env.RHYMEPAGE_EMULATOR === 'true' ? { androidScheme: 'http' } : undefined,
};

export default config;
