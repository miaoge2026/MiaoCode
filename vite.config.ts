import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    target: 'es2020',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MiaoCode',
      fileName: (format) => `miao-code.${format}.js`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@anthropic-ai/sdk',
        '@modelcontextprotocol/sdk',
        'ink',
        'zod',
        'lodash-es',
        'p-map',
        'uuid'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@anthropic-ai/sdk': 'Anthropic',
          '@modelcontextprotocol/sdk': 'MCP',
          'ink': 'Ink',
          'zod': 'Zod',
          'lodash-es': 'Lodash',
          'p-map': 'PMap',
          'uuid': 'UUID'
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@anthropic-ai/sdk',
      '@modelcontextprotocol/sdk',
      'ink',
      'zod',
      'lodash-es',
      'p-map',
      'uuid'
    ]
  },
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  preview: {
    port: 3001,
    strictPort: true
  }
})