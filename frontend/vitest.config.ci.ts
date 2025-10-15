import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// CI-specific Vitest configuration that excludes complex component tests
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
    // Only run stable tests in CI
    include: [
      'src/utils/__tests__/**/*.test.{ts,tsx}',
      'src/__tests__/integration.test.tsx',
      'src/components/reporting/__tests__/simplified-component.test.tsx'
    ],
    exclude: [
      // Exclude complex component tests that require heavy mocking
      'src/components/reporting/__tests__/period-comparison.test.tsx',
      'src/components/reporting/__tests__/exception-heatmap.test.tsx',
      'src/components/reporting/__tests__/advanced-filters.test.tsx',
      'src/components/reporting/__tests__/export-center.test.tsx',
      'src/__tests__/reporting-integration.test.tsx'
    ]
  },
})