// Simple Playwright config for this repo
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: __dirname,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:17177',
    headless: true,
  },
  reporter: [['list']]
};

module.exports = config;

