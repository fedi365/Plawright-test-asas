import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';


dotenv.config();   // lit le fichier .env (en local) et remplit process.env

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,              // CHANGÉ : tes tests créent des données en base
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,   // CHANGÉ : 1 relance suffit
  workers: 1,                        // CHANGÉ : un test à la fois, en local et sur GitHub

  reporter: [['html', { open: 'never' }]],   // CHANGÉ : ne bloque pas le terminal

  use: {
    baseURL: process.env.BASE_URL,   // CHANGÉ : plus de valeur en dur
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});