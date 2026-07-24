import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.osadiagnostic.app',
  appName: 'OSA Diagnostic',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
