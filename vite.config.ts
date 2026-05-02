import { defineConfig } from 'vite'
import path from 'path'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
      strictOutput: true,
      insertTypesEntry: true,
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'package.json',
          dest: '.'
        },
      ]
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TTControls',
      fileName: (format) => `ttcontrols.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
       // 🔥 关键：将 three 和 lit 标记为外部依赖
      // 这样它们不会被打包进产物，而是保留 import 语句
      external: [
        'three'
      ],
      output: {
        globals: {
          'three': 'THREE',
        },
        // 保留原始目录结构，方便 tree-shaking
        preserveModules: false,
      }
    },
    outDir: 'dist',
    minify: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  publicDir: 'public',
    // 确保开发时依赖不会被意外内联
  optimizeDeps: {
    exclude: ['three']  // 不预构建这些依赖
  }
})
