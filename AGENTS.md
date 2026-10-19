# Funpabia

Website and admin panel for Funpabia (animal welfare foundation, Cipolletti, Argentina). TanStack Start + React on Cloudflare Workers, with D1 (data) and R2 (files).

Reference skills: `codebase-design` for module vocabulary (module, interface, depth, seam); `writing-for-agents` when editing this file or `CLAUDE.md`.

## Language

English is the standard for everything that is not user-facing: code, identifiers, comments, database schema, enum values, commit messages, and this file. User-facing copy is Spanish (es-AR). The spec and the foundation speak Spanish; `docs/glossary.md` maps each Spanish term to its English name. Add a row there when you introduce a domain term.

## Commands

- Package manager: pnpm only.
- `pnpm check` runs typecheck and lint. Run it before calling anything done.
- `pnpm format` formats with oxfmt.
- The pre-commit hook (husky) runs lint-staged and `pnpm check`. Fix a red commit; do not bypass it.

## Stack

One tool per job. Before writing something by hand, check whether it is already on this list.

| Job                        | Tool                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| Framework and routing      | TanStack Start, TanStack Router (file-based)                             |
| Runtime and deploy         | Cloudflare Workers                                                       |
| Database                   | D1                                                                       |
| Files and images           | R2                                                                       |
| Type validation            | zod, at every boundary: forms, server functions, bindings, external data |
| Server state on the client | TanStack Query, only when the router loader is not enough                |
| Styling                    | Tailwind CSS with the tokens in `src/styles/tokens.css`                  |
| Reusable components        | shadcn/ui, added with its CLI and adapted to the tokens                  |
| Lint and format            | oxlint (with anti-slop), oxfmt                                           |

Installing a new dependency requires the user's approval.

Everything runs on Cloudflare free plans. D1 is SQLite: proximity search for lost and found animals (spec 6.6) uses a bounding box or geohash.

### Cloudflare

- Bindings in `wrangler.jsonc`: `DB` (D1 `funpabia`) and `BUCKET` (R2 `funpabia`), in the user's personal account. Run `pnpm cf-typegen` after changing `wrangler.jsonc`.
- `pnpm run deploy` builds and publishes. Plain `pnpm deploy` fails because it is a built-in pnpm command. Production: https://funpabia.lucasan-videla.workers.dev.
- `PUBLIC_SITE_URL` (plain var in `wrangler.jsonc`) is the public origin: canonical, Open Graph, sitemap and robots.txt use it. While it is a `*.workers.dev` address the whole site is `noindex` (header, meta tag and `Disallow: /`). When the real domain arrives, change it and `BETTER_AUTH_URL` together, then add `Strict-Transport-Security` in `src/lib/response-headers`.
- `src/start.ts` registers `responseHeaders` (`src/lib/response-headers`): CSP, frame, referrer, permissions and nosniff on every Worker response, production only. Static files never reach the Worker: their headers live in `public/_headers` (long immutable cache for `/assets/*`). A new external origin (maps, analytics, fonts) needs its entry in the CSP.
- `ANALYTICS_TOKEN` (plain var, empty by default) turns on Cloudflare Web Analytics on the public pages only: the script and its two CSP entries appear when it is set. Mention it in the privacy policy when you turn it on.
- Site icons, manifest and the default share image (`public/og/default.png`) come from `tools/brand-assets/gen.py` (`python3 -I tools/brand-assets/gen.py`); edit the script, not the images.
- Remote changes (`--remote`, deploy, dropping or creating resources) need the user's approval each time.

### Database

- The schema lives in `migrations/` as numbered SQL. Once a migration is applied to the remote database, add a new one instead of editing it.
- Apply with `pnpm exec wrangler d1 migrations apply funpabia --local`, then `--remote` with approval.
- Backups: D1 keeps 30 days of point-in-time history on its own (`pnpm exec wrangler d1 time-travel info funpabia`; restoring is a remote change and needs approval). For a copy outside Cloudflare, `pnpm db:export` writes the whole remote database to `backups/` (gitignored). It holds adopters' personal data: keep it off shared drives and delete old ones. R2 (photos) has no backup.
- A nightly cron (`triggers` in `wrangler.jsonc`, handled in `src/server.ts`) deletes R2 photos nothing points at (`src/lib/photo-cleanup`). A new table that stores an R2 key must be added to its `referencedKeys` query, or the cron will delete those photos.
- `tools/dev-seed/seed.sql` loads fictional animals, a goal and agenda events into the local database. Local only, never `--remote`.
- Enums are `CHECK` constraints: adding a value means rebuilding the table, so follow the spec's lists.
- The app sets `updated_at`, not the database.

### Auth

- Better Auth with email + password, sessions in D1 through Kysely (`kysely-d1`). Server config: `src/lib/auth/server.ts`; client: `src/lib/auth/client.ts`; session helper for routes: `getSession` in `src/lib/auth/session.ts`. Better Auth's names are mapped to this schema in `src/lib/auth/lib/schema-map.ts`; keep it in sync with `migrations/0002_auth.sql`.
- Sign-up is closed. Create panel users with `pnpm create-admin --email … --name … [--role admin] [--remote]`; the password is typed in the terminal, never passed through chat.
- `_private` calls `getSession` in `beforeLoad` and redirects to `/login`. Soft-deleted users (`discarded_at`) count as signed out. Check the role in `beforeLoad` and in the server function before any role-restricted action; the session only proves who the user is. Panel server functions declare `.middleware([userMiddleware])` or `.middleware([adminMiddleware])` (`src/lib/auth/session.ts`) **before** `.validator()`: middleware runs first, so a caller without access gets `Forbidden` and never sees the input schema. The user is `context.user` in the handler.
- Secrets: `BETTER_AUTH_SECRET` is a Worker secret, loaded with `hush` and never read or printed. `BETTER_AUTH_URL` is a plain var in `wrangler.jsonc`. Local dev needs a gitignored `.dev.vars` with `BETTER_AUTH_URL=""`: Better Auth falls back to that env var when `baseURL` is unset, and the production value makes local sign-in fail with "Invalid origin". Empty, the origin is derived from the request.
- Sign-in is limited to 5 attempts per minute per IP, counted in D1 (`rate_limit`).
- `src/routes/api/**` holds endpoints, not pages, so it sits outside the layouts.

## Structure

```
src/
  routes/          # routes and layouts only; logic lives in modules
    _public.tsx    # public layout: site header and footer
    _private.tsx   # private layout: admin panel, beforeLoad requires a session
  components/      # site/, panel/, shared/ (both audiences) and ui/ (shadcn); the site never imports panel/
  lib/<module>/    # one module per responsibility
    index.ts       # entry point: the only file the rest of the code imports
    ...            # implementation, hidden behind the index
```

- Every page hangs under `_public` or `_private`. A route without a layout is a design error.
- Every `lib/` module is **deep**: a small interface in `index.ts`, the implementation behind it. Import modules only through their `index.ts`. Exception: `search.ts`, the URL-filter schema a panel route uses in `validateSearch`. That code stays in the router bundle, so it lives apart from `index.ts` to keep the module's server functions out of the public pages' preloads (`seo/server.ts` is the other second entry).
- A new module earns its place with the deletion test: if deleting it makes no complexity reappear in the callers, it was not needed.

## Code rules

- **File names** in kebab-case (`pet-card.tsx`); the exported component is PascalCase. oxlint enforces it.
- **File size**: aim for 200 lines; 300 is the hard cap (oxlint `max-lines`, blank lines and comments excluded). Near the cap, extract a module or a component.
- **Types**: `unknown` does not cross interfaces. Validate with zod at the boundary and derive the type with `z.infer`. The anti-slop rules in `.oxlintrc.json` apply to all owned code.
- **Logging**: every log goes through `src/lib/logger` (structured JSON, one event per line, which is what Workers Logs indexes). `console.*` exists only inside that module. Never log adopters' personal data or secrets.
- **Bindings**: D1 and R2 are accessed only from `lib/` modules, never from components.
- **Visual design**: follow `docs/design-system/design-system.md`. Colors come from semantic classes (`bg-primary`, `text-muted-foreground`) or the palette (`bg-teal-700`), never loose hex values. Color is never the only status indicator: pair it with text or an icon.
- **No dark mode**: the site and the panel are always light. When adding a shadcn component, delete its `dark:` classes.
- **Tokens**: `src/styles/tokens.css` is generated. To change a color, edit `tools/design-tokens/gen.py` and run `python3 -I tools/design-tokens/gen.py`; the script fails when a pair drops below its minimum contrast.

## Assets

| What                                 | Where                                            |
| ------------------------------------ | ------------------------------------------------ |
| Logo and static brand files          | `public/brand/`                                  |
| Images imported by code              | `src/assets/`                                    |
| Animal photos, attachments, receipts | R2, never in the repo                            |
| Icons                                | Lucide (SVG), never emoji                        |
| Fonts                                | Fraunces and Figtree, self-hosted via Fontsource |
| Reference screenshots                | `docs/refs/*.png`, local only (gitignored)       |

## Documentation

- `docs/spec/funpabia-spec.md`: product spec with modules, data model, flows, and phases. Read it before creating an entity, route, or form.
- The repository is public. Never commit personal data of the committee, adopters or donors, bank aliases, or working notes with the foundation: those live in `docs/private/` (gitignored), with the spec PDF and the reference screenshots.
- `docs/glossary.md`: Spanish domain terms and their English names, including enum values.
- `docs/routes.md`: every URL of the site and the panel, its file, who can open it and its phase. Read it before adding a route.
- `docs/design-system/`: palette, tokens, typography, and key components.
- `docs/refs/refs.md`: the analysis of the reference sites. Their screenshots stay local.
- `tools/oxlint/anti-slop/`: vendored plugin; owned code in this repo. Update it with the `install-anti-slop` skill and record the change in its `UPSTREAM.md`.
