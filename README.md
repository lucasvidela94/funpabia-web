# Funpabia

Sitio y panel para Funpabia, la Fundación Patagónica para el Bienestar Animal (Cipolletti, Río Negro). En producción: https://funpabia.lucasan-videla.workers.dev. Reglas y convenciones del repo: [AGENTS.md](./AGENTS.md).

Stack: TanStack Start (React 19, TypeScript) en Cloudflare Workers, con D1 para los datos y R2 para las fotos. Desarrollo: [lucasvidela94](https://github.com/lucasvidela94).

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # typecheck + lint
pnpm build
```

Este proyecto solo soporta [pnpm](https://pnpm.io); instalar con npm o yarn está bloqueado.

Documentación de diseño en [`docs/`](./docs).
