import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// CI-specific Vitest configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    // Better test isolation and cleanup
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    // Pool options for better memory management in CI
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 2, // Limit forks in CI to prevent OOM
        minForks: 1,
      }
    },
    // Timeouts
    testTimeout: 15000, // Longer timeout for CI
    hookTimeout: 15000,
    // Run all tests - the browser API mocks should handle everything now
    include: [
      'src/**/__tests__/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}'
    ],
  },
})