import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    supportFile: false,
    video: false,
    defaultCommandTimeout: 12000,
    requestTimeout: 12000,
    pageLoadTimeout: 120000,
    env: {
      API_URL: process.env.CYPRESS_API_URL || process.env.API_URL || 'http://localhost:3001', // Preferimos variable Cypress en CI
    },
  },
})