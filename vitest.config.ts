import { defineConfig } from 'vitest/config'

// The app's vite.config.ts loads the Cloudflare plugin, which starts workerd. The unit tests here
// are pure functions, so they run in plain Node instead.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
