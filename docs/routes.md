# Routes

The route map for the public site and the admin panel. URLs are user-facing, so they are Spanish (spec section 12: "URLs en español con slug"); route params and code stay English. File-based routing with TanStack Router: one file per URL under `src/routes/`.

## Rules

- Every page hangs under a layout: `_public` (site header and footer) or `_private` (panel with sidebar). `src/routes/api/**` holds endpoints, not pages.
- Filters and pagination live in the URL as search params, validated with zod in `validateSearch`. A filtered catalog can be shared as a link (spec 6.1).
- Public detail pages use a slug (`/adopta/lobito-1234`); panel detail pages use the id (`/panel/animales/<uuid>`), because panel links are never shared outside.
- A static segment wins over a dynamic one: `/adopta/solicitud` never collides with `/adopta/$slug`, since every animal slug ends in a number.
- Role checks live in pathless layouts, not in each page: `_admin` wraps every panel route an editor may not open (spec 4: the editor sees no adopter data and no accounting).
- A route exists only when its phase starts. The tables below list later phases so the map stays whole, but their files are not created yet.

## Public site (`_public`)

| URL | File | What it is | Phase |
| --- | --- | --- | --- |
| `/` | `_public/index.tsx` | Home | MVP |
| `/adopta` | `_public/adopta/index.tsx` | Catalog. Search: `especie`, `sexo`, `edad`, `tamano`, `convive` | MVP |
| `/adopta/$slug` | `_public/adopta/$slug.tsx` | Animal profile, with OG tags | MVP |
| `/adopta/solicitud` | `_public/adopta/solicitud.tsx` | Adoption form in steps. Search: `animal` (slug, optional) | MVP |
| `/como-adoptar` | `_public/como-adoptar.tsx` | Requirements and steps | MVP |
| `/transito` | `_public/transito/index.tsx` | Fostering: what it means | MVP |
| `/transito/solicitud` | `_public/transito/solicitud.tsx` | Foster form | MVP |
| `/dona` | `_public/dona/index.tsx` | Active goals, alias, CBU, Mercado Pago | MVP |
| `/dona/$slug` | `_public/dona/$slug.tsx` | One goal, with OG tags | MVP |
| `/agenda` | `_public/agenda.tsx` | Neutering, vaccination and events. Search: `tipo`, `barrio` | MVP |
| `/noticias` | `_public/noticias/index.tsx` | News and campaigns | MVP (simple) |
| `/noticias/$slug` | `_public/noticias/$slug.tsx` | One post | MVP (simple) |
| `/quienes-somos` | `_public/quienes-somos.tsx` | About the foundation | MVP |
| `/contacto` | `_public/contacto.tsx` | Phone, WhatsApp, email, social links | MVP |
| `/privacidad` | `_public/privacidad.tsx` | Privacy policy (Ley 25.326) | MVP |
| `/preguntas` | `_public/preguntas.tsx` | Frequent questions, plus how the site is built: stack, infrastructure, data care, developer contact | MVP |
| `/login` | `_public/login.tsx` | Panel sign-in | MVP |
| `/$` (any other URL) | `_public/$.tsx` | 404 inside the public layout | MVP |
| `/dona/transparencia` | `_public/dona/transparencia.tsx` | Fulfilled goals and monthly vet spending | F2, if the foundation agrees |
| `/perdidos` | `_public/perdidos/index.tsx` | Lost and found: list by zone. Search: `tipo`, `especie`, `zona`, `cerca`, `dias`. The map is still to do | F2 |
| `/perdidos/reportar` | `_public/perdidos/reportar.tsx` | Report a lost or found animal, no account. Search: `tipo` | F2 |
| `/perdidos/$reportId` | `_public/perdidos/$reportId.tsx` | One report, with OG tags. Search: `token` (the owner's edit link) | F2 |
| `/denunciar` | `_public/denunciar.tsx` | Abuse report (never published) | F2 |
| `/sumate` | `_public/sumate.tsx` | Volunteering and monthly sponsors | F2 |

Header navigation: Adoptá, Cómo adoptar, Sé tránsito, Agenda, Quiénes somos, and the "Doná" button. Everything else is linked from the footer.

## Panel (`_private`, under `/panel`)

`_private` requires a session (`beforeLoad`, redirects to `/login`). `_private/panel/_admin.tsx` is a pathless layout that also requires the `admin` or `superadmin` role; an editor who opens one of its URLs is sent back to `/panel`.

| URL | File | What it is | Who | Phase |
| --- | --- | --- | --- | --- |
| `/panel` | `_private/panel/index.tsx` | Dashboard: counts by status, urgent, new requests, overdue follow-ups | all | MVP |
| `/panel/animales` | `_private/panel/animales/index.tsx` | Animal list. Search: `estado`, `q` | all | MVP |
| `/panel/animales/nuevo` | `_private/panel/animales/nuevo.tsx` | Quick intake from the phone | all | MVP |
| `/panel/animales/$animalId` | `_private/panel/animales/$animalId.tsx` | Edit, photos, status history | all | MVP |
| `/panel/agenda` | `_private/panel/agenda.tsx` | Agenda events | all | MVP |
| `/panel/noticias` | `_private/panel/noticias/index.tsx` | News posts | all | MVP (simple) |
| `/panel/solicitudes` | `_private/panel/_admin/solicitudes/index.tsx` | Requests: list on the phone, kanban on desktop. Search: `etapa`, `tipo` | admin | MVP |
| `/panel/solicitudes/$applicationId` | `_private/panel/_admin/solicitudes/$applicationId.tsx` | One request, notes, WhatsApp button | admin | MVP |
| `/panel/transitos` | `_private/panel/_admin/transitos.tsx` | Foster placements | admin | MVP (basic) |
| `/panel/seguimientos` | `_private/panel/_admin/seguimientos.tsx` | Pending and overdue follow-ups | admin | MVP (basic) |
| `/panel/personas` | `_private/panel/_admin/personas/index.tsx` | Adopters, fosters, donors | admin | MVP |
| `/panel/personas/$personId` | `_private/panel/_admin/personas/$personId.tsx` | One person, anonymize action | admin | MVP |
| `/panel/metas` | `_private/panel/_admin/metas/index.tsx` | Goals | admin | MVP |
| `/panel/metas/nueva` | `_private/panel/_admin/metas/nueva.tsx` | New goal | admin | MVP |
| `/panel/metas/$goalId` | `_private/panel/_admin/metas/$goalId.tsx` | One goal and its donations | admin | MVP |
| `/panel/rifas` | `_private/panel/_admin/rifas/index.tsx` | Raffles: the ledger of who has each number | admin | F3 (pulled forward) |
| `/panel/rifas/nueva` | `_private/panel/_admin/rifas/nueva.tsx` | New raffle (starts as a draft) | admin | F3 (pulled forward) |
| `/panel/rifas/$raffleId` | `_private/panel/_admin/rifas/$raffleId.tsx` | Number grid, accounts per seller, status, winner, proceeds to the goal | admin | F3 (pulled forward) |
| `/panel/usuarios` | `_private/panel/_admin/usuarios.tsx` | Panel users and roles | admin | MVP |
| `/panel/api` | `_private/panel/_admin/api.tsx` | API tokens for the Municipality | admin | F3 |
| `/panel/configuracion` | `_private/panel/_admin/configuracion.tsx` | Alias, CBU, texts, social links | admin | MVP |
| `/panel/clinica` | `_private/panel/_admin/clinica.tsx` | Clinical events and expenses | admin | F2 |
| `/panel/perdidos` | `_private/panel/perdidos.tsx` | Lost and found moderation: approve, hide, mark reunited | all | F2 |
| `/panel/denuncias` | `_private/panel/_admin/denuncias.tsx` | Abuse reports | admin | F2 |
| `/panel/voluntarios` | `_private/panel/_admin/voluntarios.tsx` | Volunteers and shifts | admin | F2 |
| `/panel/socios` | `_private/panel/_admin/socios.tsx` | Sponsors and dues | admin | F3 |
| `/panel/eventos` | `_private/panel/_admin/eventos.tsx` | Events (bingos, fairs) beyond the agenda | admin | F3 |

### Sidebar

The sidebar reads one list (`src/components/panel/nav.ts`) and hides the items the user's role cannot open, so the menu and the `_admin` guard never disagree. Groups, in order:

1. Tablero
2. Animales: Animales
3. Adopciones: Solicitudes, Tránsitos, Seguimientos, Personas
4. Donaciones: Metas, Rifas
5. Contenido: Agenda, Noticias
6. Administración: Usuarios, API, Configuración

On the phone the sidebar opens as a sheet from the top bar, and "+ Animal" stays one tap away (spec 8.4).

## Public API (`src/routes/api/v1/`)

Endpoints, not pages, versioned under `/api/v1` (contract in `docs/api.md`, spec in `docs/spec/api-rest.md`).

| Route | File | Auth | Phase |
| ----- | ---- | ---- | ----- |
| `GET /api/v1/agenda-events` | `api/v1/agenda-events.ts` | public | F3 |
| `POST /api/v1/agenda-events` | `api/v1/agenda-events.ts` | token (`agenda-events:write`) | F3 |
| `GET /api/v1/agenda-events/:id` | `api/v1/agenda-events.$id.ts` | public | F3 |
| `PATCH /api/v1/agenda-events/:id` | `api/v1/agenda-events.$id.ts` | token (`agenda-events:write`) | F3 |
| `DELETE /api/v1/agenda-events/:id` | `api/v1/agenda-events.$id.ts` | token (`agenda-events:write`) | F3 |
