import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webb.teamhub',
  appName: 'Webb Team Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
