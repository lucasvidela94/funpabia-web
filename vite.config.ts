import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      router: {
        codeSplittingOptions: {
          // A panel page's loader and component load together, when someone opens the panel. Left
          // in the router bundle, the loaders drag every panel module (and its zod schemas) into
          // the preloads of the public pages.
          splitBehavior: ({ routeId }) =>
            routeId.startsWith('/_private/')
              ? [['loader', 'component', 'pendingComponent', 'errorComponent', 'notFoundComponent']]
              : undefined,
        },
      },
    }),
    viteReact(),
  ],
})

export default config
