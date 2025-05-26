import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import fbtCommon from './common_strings.json' with { type: 'json' };

 
export default defineConfig({
  plugins: [tsconfigPaths(), react({babel:{

	presets: [['@nkzw/babel-preset-fbtee', { fbtCommon }],],
  }})],
  test: {
    coverage: {
      provider: 'v8', 
      reporter: ['text', 'json-summary', 'json'], // 'json-summary' is crucial for some reporters
      reportsDirectory: './coverage', // Optional: specify the output directory
    },
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
  },
})
