import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'https://private-hris.pages.dev',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed
      return config
    },
  },
})
