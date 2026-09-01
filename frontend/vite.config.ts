import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_INITIAL_ENTRY_BUDGET_KIB = 750
const configuredBudget = process.env.INITIAL_ENTRY_BUDGET_KIB
const initialEntryBudgetKib = configuredBudget
  ? Number(configuredBudget)
  : DEFAULT_INITIAL_ENTRY_BUDGET_KIB

if (!Number.isFinite(initialEntryBudgetKib) || initialEntryBudgetKib <= 0) {
  throw new Error('INITIAL_ENTRY_BUDGET_KIB must be a positive number.')
}

const initialEntryBudgetBytes = initialEntryBudgetKib * 1024
const djangoProxyTarget = process.env.DJANGO_PROXY_TARGET ?? 'http://localhost:8000'

const reportInitialEntrySize = (): Plugin => ({
  name: 'report-initial-entry-size',
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter(
      (output) => output.type === 'chunk',
    )
    const entry = chunks.find((output) => output.isEntry)

    if (!entry) {
      this.error('Could not find the initial JavaScript entry in the production build.')
      return
    }

    const chunksByFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
    const initialChunks = new Map<string, (typeof chunks)[number]>()
    const addChunkAndStaticImports = (chunk: (typeof chunks)[number]) => {
      if (initialChunks.has(chunk.fileName)) {
        return
      }

      initialChunks.set(chunk.fileName, chunk)
      chunk.imports.forEach((importedFileName) => {
        const importedChunk = chunksByFileName.get(importedFileName)
        if (importedChunk) {
          addChunkAndStaticImports(importedChunk)
        }
      })
    }

    addChunkAndStaticImports(entry)

    const initialBundleSizeBytes = Array.from(initialChunks.values()).reduce(
      (total, chunk) => total + Buffer.byteLength(chunk.code),
      0,
    )
    const initialBundleSizeKib = (initialBundleSizeBytes / 1024).toFixed(2)
    const budgetKib = initialEntryBudgetKib.toFixed(0)

    console.log(
      `Initial JavaScript bundle (${initialChunks.size} static chunks): ${initialBundleSizeKib} KiB (budget: ${budgetKib} KiB)`,
    )

    if (initialBundleSizeBytes > initialEntryBudgetBytes) {
      this.error(
        `Initial JavaScript bundle is ${initialBundleSizeKib} KiB, exceeding the ${budgetKib} KiB budget. Keep page routes lazy-loaded or split shared dependencies before release.`,
      )
    }
  },
})

export default defineConfig({
  plugins: [react(), reportInitialEntrySize()],
  build: {
    chunkSizeWarningLimit: initialEntryBudgetKib,
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      '/media': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      '/admin': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      '/accounts': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      '/ckeditor5': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      // Flutterwave redirects donors to this legacy Django callback URL.
      // Keep the public /donate page handled by the React app.
      '/donation/verify': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
      '/static': {
        target: djangoProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
