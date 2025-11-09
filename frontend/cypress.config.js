import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    supportFile: false,
    video: false,
    defaultCommandTimeout: 8000,
    env: {
      API_URL: process.env.API_URL || 'http://localhost:3001', // URL de backend local o de Render
    },
  },
})