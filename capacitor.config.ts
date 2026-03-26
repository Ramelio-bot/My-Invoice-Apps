import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramelio.myinvoice',
  appName: 'My Invoice',
  webDir: 'dist',
  // PT. Ramelio Berkah Abadi - Enterprise Edition
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      statsUrl: ''
    }
  }
};

export default config;
