# API REST pública (especificación técnica)

**Estado:** borrador 0.1, 17/10/2026. Es una propuesta de Lucas Videla, no está en el spec de producto. Lo marcado **[SUPUESTO]** hay que validarlo; lo marcado **[DECIDIR]** es una pregunta abierta (sección 10).
**Fase:** F3, junto con el usuario "Municipio" (`funpabia-spec.md` 6.7).

## 1. Objetivo

Exponer una API REST versionada para que un tercero cargue o lea datos sin usar el panel. El primer caso es el Municipio de Cipolletti o Zoonosis cargando eventos de agenda (castraciones, vacunaciones). La API no reemplaza al panel ni a las server functions.

Fuera de alcance:

- Exponer solicitudes, seguimientos, donaciones o datos de adoptantes. Son datos personales o dinero y el panel los cubre. La lectura pública de animales, metas y noticias queda a pedido (sección 4, "Qué entidades se exponen").
- Escritura desde un navegador de terceros (el CORS de la sección 6 es solo de lectura).
- Webhooks, paginación por cursor y SDKs de cliente.

## 2. Qué hay hoy

- La lógica vive en `src/lib/*` (`animals`, `applications`, `goals`, `agenda`, `follow-ups`), con schemas zod en el borde. Un endpoint REST es otra puerta a las mismas funciones.
- `src/routes/api/**` ya aloja endpoints con `server.handlers`: `api/auth/$`, `api/photos/$` y `api/uploads/photo`. Quedan fuera de los layouts.
- Las server functions (`createServerFn`) son RPC interno de TanStack. Sus URLs no son estables, así que no sirven como API pública.
- La autenticación actual es la cookie de sesión de Better Auth, verificada con `requireUser` (`src/lib/auth/session.ts`).
- El rol `municipality` ya existe en `app_user.role` (`docs/glossary.md`). Hoy no tiene permisos propios.
- La tabla `rate_limit` ya existe y cuenta los intentos de login por IP.

## 3. Principios

1. **Una sola lógica.** Los endpoints no duplican reglas: llaman a las funciones del módulo de `lib/` y comparten sus schemas zod. Si una regla cambia, cambia en un lugar.
2. **El módulo sigue siendo el único dueño de D1 y R2.** Los handlers de `routes/api/v1/` no tocan bindings (regla de `AGENTS.md`).
3. **Superficie mínima.** Solo se expone lo que un integrador necesita. Cada endpoint nuevo se agrega a propósito.
4. **Contrato estable.** Lo que sale en `/api/v1` no cambia de forma incompatible; los cambios rompientes van a `/api/v2`.

## 4. Endpoints v1

Base: `/api/v1`. JSON en ambos sentidos, `Content-Type: application/json`.

Son 5 endpoints sobre un solo recurso, con el patrón REST estándar de colección y recurso: sin acciones en la URL ni rutas anidadas.

```
/api/v1
└── /agenda-events             colección
    ├── GET     lista de eventos próximos       público
    ├── POST    crea un evento                  token
    └── /agenda-events/:id     recurso
        ├── GET     un evento                   público
        ├── PATCH   edita                       token
        └── DELETE  descarta (borrado lógico)   token
```

| Método | Ruta                | Auth                               | Qué hace                                    |
| ------ | ------------------- | ---------------------------------- | ------------------------------------------- |
| GET    | `/agenda-events`     | pública                            | Eventos próximos. Query: `limit` (1 a 100). |
| GET    | `/agenda-events/:id` | pública                            | Un evento.                                  |
| POST   | `/agenda-events`     | token, scope `agenda-events:write` | Crea un evento.                             |
| PATCH  | `/agenda-events/:id` | token, scope `agenda-events:write` | Edita un evento propio.                     |
| DELETE | `/agenda-events/:id` | token, scope `agenda-events:write` | Descarta un evento propio.                  |

Un recurso nuevo (metas, animales) se agrega solo a pedido y con esta misma forma.

### Idioma

La documentación del proyecto está en español, pero todo lo que ve un sistema va en inglés, igual que el código y la base (`AGENTS.md`). El nombre de cada recurso sale del glosario (`docs/glossary.md`).

| Parte de la API                                     | Idioma | Ejemplo                                              |
| --------------------------------------------------- | ------ | ---------------------------------------------------- |
| Rutas: sustantivo plural en kebab-case              | inglés | `/agenda-events` (glosario: `agenda_event`)          |
| Campos del JSON: camelCase, los del módulo          | inglés | `startsAt`, `venue`, `appointmentUrl`                |
| Enums                                               | inglés | `neutering`, `municipality`                          |
| Scopes: `<recurso>:<acción>`                        | inglés | `agenda-events:write`                                |
| Códigos y mensajes de error                         | inglés | `validation_failed`                                  |
| Las páginas del sitio y del panel                   | español | `/agenda`, `/panel/agenda` (las ve la gente)         |

La API no devuelve textos para mostrar. Las etiquetas en español (`Castración`, `Municipalidad de Cipolletti`) las pone el sitio. Filtros extra en la lista (`from`, `type`) y el documento OpenAPI también quedan a pedido.

"Propio" significa creado por el mismo usuario dueño del token (`created_by`). Un token del Municipio no edita eventos de Funpabia. **[DECIDIDO 17/10/2026]** se mide por usuario, no por `organizer`: el organizador lo declara el cuerpo del pedido y no es una barrera.

Los campos del evento son los de `agendaInputSchema` y del tipo `AgendaEvent` en `src/lib/agenda` (`type`, `title`, `startsAt`, `endsAt`, `venue`, `address`, `neighborhood`, `organizer`, `requirements`, `appointmentUrl`, `appointmentPhone`, `source`), no los nombres en español de `funpabia-spec.md` sección 9.

### Qué entidades se exponen

Sí, v1 son solo esos 5 endpoints. El resto de las entidades (`docs/glossary.md`, `migrations/`) se clasifica en tres niveles. El criterio: una entidad solo puede ser pública si el sitio ya muestra ese dato a cualquier visitante; todo lo demás es privado y queda en el panel.

**Nivel 1. Expuesto en v1**

| Entidad        | Recurso         | Lectura | Escritura                  |
| -------------- | --------------- | ------- | -------------------------- |
| `agenda_event` | `agenda-events` | pública | token (`municipality`, `admin`) |

**Nivel 2. Pública de lectura, solo a pedido.** El sitio ya la muestra, así que exponerla no filtra nada nuevo. No se crea hasta que un integrador la pida, y siempre de solo lectura.

| Entidad     | Recurso                | Qué se devuelve                                                                 | Qué nunca sale                                                    |
| ----------- | ---------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `animal`    | `animals`              | Solo `status = available`, con los campos de la ficha pública y sus `photo`     | Historia clínica, gastos, motivo de ingreso, notas internas, origen |
| `goal`      | `goals`                | Metas activas y cumplidas: título, descripción, objetivo, recaudado, porcentaje | Donaciones una por una, medios de pago, quién donó                |
| `news_post` | `news-posts`           | Noticias publicadas                                                             | Borradores                                                        |

**Nivel 3. Privadas, nunca por la API pública.** Tienen datos personales o dinero (Ley 25.326), o son internas. Se manejan solo desde el panel, con sesión y rol.

| Entidad                                          | Por qué es privada                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `person`                                         | Datos personales de adoptantes, tránsitos y donantes                |
| `application`, `application_stage_history`       | Respuestas y decisiones sobre personas                              |
| `adoption`, `foster_placement`, `follow_up`      | Vinculan a una persona con un animal y su seguimiento               |
| `donation`                                       | Montos y medios por persona; el público ve solo el total de la meta |
| `animal_status_history`                          | Registro interno de cambios                                         |
| `app_user`, `session`, `account`, `verification` | Autenticación                                                       |
| `rate_limit`, `audit_log`, `setting`             | Internas; de `setting` el sitio publica solo alias, CBU y redes por sus propias páginas |

En fases futuras (F2, F3) rige el mismo criterio: reportes de perdidos y encontrados pueden tener un listado público (sin ubicación exacta ni contacto, que son privados); denuncias, voluntarios, socios y cuotas son privados.

Tres reglas para todos los niveles:

- **Escritura:** ninguna entidad fuera de `agenda-events` se escribe por la API. Las solicitudes de adopción y tránsito entran por los formularios del sitio, no por tokens.
- **Un campo privado de una entidad pública sigue siendo privado.** Cada recurso nivel 2 devuelve una lista fija de campos (la ficha pública), no la fila entera.
- **Pasar de nivel exige decisión explícita.** Mover una entidad al nivel 1 o 2 se registra en este documento antes de escribir el endpoint.

### Convenciones

- Fechas en ISO 8601 con zona (`2026-11-03T09:00:00-03:00`).
- Lista: `{ "data": [...] }`. Un recurso: `{ "data": {...} }`. Sin paginación: la lista es corta y se limita con `limit`.
- Error: `{ "error": { "code": "validation_failed", "message": "...", "details": [...] } }` con el status HTTP que corresponda (400, 401, 403, 404, 409, 429).
- `message` es una frase corta en inglés. `details` es una lista de `{ "path": "startsAt", "code": "invalid_format" }` armada con el `path` y el `code` de cada issue de zod. Los mensajes de zod están en español porque son los del panel, así que no se reenvían. Tampoco se incluye ningún dato interno.
- Cada evento guarda `created_by` (el usuario dueño del token). `audit_log` no admite todavía la entidad `agenda_event`; sumarla exige reconstruir la tabla y queda a pedido.

## 5. Autenticación

Token Bearer: `Authorization: Bearer fnp_...`.

Dos opciones:

| Opción                          | A favor                                       | En contra                                  |
| ------------------------------- | --------------------------------------------- | ------------------------------------------ |
| Plugin de API keys de Better Auth | Ya está en el stack; hashing y expiración resueltos | Hay que verificar que funcione con `kysely-d1` y el schema mapeado |
| Tabla propia `api_token`        | Control total del scope y del esquema         | Más código que mantener                    |

**[DECIDIDO 17/10/2026]** Tabla propia `api_token` (migración `0005`). El better-auth instalado (1.7.10) no trae plugin de API keys, así que la recomendación del plugin no aplica; además el scope propio queda bajo control. Instalar el plugin no agrega una dependencia nueva, pero igual requiere tu aprobación si cambia `package.json`.

Reglas, valgan para cualquiera de las dos:

- El token se muestra una sola vez al crearlo. En la base se guarda solo el hash.
- Cada token pertenece a un usuario del panel con rol `municipality` y tiene scopes explícitos (`agenda-events:write`). El rol sigue siendo la barrera: un token no puede dar más permisos que el rol del usuario.
- Los tokens se crean y revocan desde el panel (solo `admin` y `superadmin`) y se pueden descartar sin borrar historial. Vencen a los 12 meses **[SUPUESTO]**.
- Un usuario descartado (`discarded_at`) invalida sus tokens, igual que invalida su sesión.
- El token nunca se loguea ni se imprime. Los logs registran el id del token, no el valor (`src/lib/logger`).

## 6. Seguridad y límites

- **Rate limit:** reutiliza `rate_limit` en D1. 60 pedidos por minuto por token en lecturas y 20 en escrituras; 30 por minuto por IP para pedidos sin token **[SUPUESTO]**. Excedido: `429` con `Retry-After`.
- **CORS:** los GET públicos responden `Access-Control-Allow-Origin: *`. Los métodos con token no habilitan CORS, porque lo usa un servidor del Municipio y no un navegador.
- **Validación:** zod en cada borde. Lo que no pasa el schema devuelve `400`, nunca llega al módulo.
- **Tamaño:** el cuerpo se limita a 16 KB.
- **Datos personales:** ningún endpoint v1 devuelve datos de adoptantes ni de personas. El teléfono de turno de un evento es público por diseño.
- **Cierre del registro:** crear un token no abre el sign-up. Sigue cerrado.

## 7. Estructura en el código

```
src/routes/api/v1/
  agenda-events.ts     # GET (lista) y POST
  agenda-events.$id.ts # GET, PATCH, DELETE
src/lib/api/           # módulo nuevo (pasa el test de borrado: concentra auth, errores y rate limit)
  index.ts             # server functions de tokens para el panel, newTokenSchema
  server.ts            # withApi({ scope, rateLimit }, handler), readJsonBody(), ApiError
  lib/token.ts         # verificación del token
  lib/tokens.ts        # alta, listado y revocación
  lib/errors.ts        # ApiError y ZodError -> forma de error de la API
  lib/rate.ts          # ventana fija sobre la tabla rate_limit
```

`server.ts` existe porque los handlers lo cargan con `import()` dinámico desde `server.handlers` (igual que `@/lib/photos/server`): lo que toca D1 nunca llega al bundle del navegador. Por la misma razón `agenda` expone sus lecturas y escrituras para la API desde `server.ts`, y `AgendaError` vive en `lib/errors.ts`, sin dependencias de servidor.

`withApi` envuelve cada handler: resuelve el token, comprueba rol y scope, aplica el rate limit (reutiliza `src/lib/rate-limit`), convierte excepciones en la forma de error de la sección 4 y registra un evento por pedido.

**Hecho (paso 1):** el módulo `agenda` ya tiene el schema de entrada (`agendaInputSchema`), las escrituras (`lib/panel.ts`: insertar, editar, descartar) y la migración `0004_agenda_write.sql`. El panel `/panel/agenda` las usa. Los handlers de la API llamarán a las mismas funciones de `lib/panel.ts`, que hoy solo se exponen como server functions; hay que exponerlas también para `withApi` desde el `index.ts` del módulo.

## 8. Documentación

- Para empezar alcanza con una página en `docs/` con los 5 endpoints, un ejemplo de pedido y los errores.
- A pedido: un `GET /api/v1/openapi.json` generado con el JSON Schema de zod 4 (`z.toJSONSchema`) desde los mismos schemas que validan, para que contrato y validación no se desincronicen.
- `docs/routes.md` suma las rutas `/api/v1/*` con su auth y su fase.
- El `docs/glossary.md` suma `api_token` y `scope` si se crea la tabla.

## 9. Acoplamiento a Cloudflare

> Esta sección está a medias: el texto fuente se cortó antes de listar los puntos de acoplamiento. Lo siguiente sale del repo y hay que confirmarlo.

- **Bindings:** `DB` (D1) y `BUCKET` (R2) se usan solo desde módulos de `lib/`. Es el límite de portabilidad: cambiar de proveedor implica reimplementar esas capas, no los handlers.
- **Better Auth sobre Kysely:** usa `kysely-d1`. El SQL es SQLite estándar, así que una base distinta que hable SQLite o Postgres con un dialecto de Kysely es viable.
- **Rate limit:** vive en D1. Es portable, pero con más escritura que un contador en KV o en Durable Objects. En el plan gratuito alcanza para este volumen **[SUPUESTO]**.
- **Runtime:** los handlers usan `Request` y `Response` estándar, sin APIs propias de Workers fuera de los bindings.
- **Despliegue:** `wrangler.jsonc` y `pnpm run deploy`.

La API v1 no agrega acoplamiento nuevo: reutiliza D1 y no suma colas, KV ni Durable Objects.

## 10. Preguntas abiertas

1. **[DECIDIR]** ¿El Municipio quiere cargar agenda por sí mismo? Si prefiere que la cargue la fundación (`funpabia-spec.md`, pregunta 11), esta spec no se implementa. El panel con rol `municipality` (sin API) cubre el caso con menos trabajo.
2. **[DECIDIR]** Plugin de Better Auth o tabla propia (sección 5).
3. **[DECIDIR]** Alcance de "propio" en PATCH y DELETE (sección 4).
4. ¿Hace falta algún GET público más (metas de donación, mascotas perdidas)? Cada uno es una decisión de privacidad; ver la sección 6.7 del spec de producto.
5. Vencimiento de tokens y quién los administra del lado del Municipio.

## 11. Pasos de implementación

1. ~~Escritura y borrado lógico en el módulo `agenda`, usados primero por el panel.~~ Hecho.
2. ~~Módulo `lib/api` (`withApi`, errores, rate limit).~~ Hecho, sin tests: el repo no tiene runner (agregarlo es una dependencia nueva y requiere aprobación); verificado con `pnpm check`, `pnpm build` y curl contra el dev local (los 5 endpoints, 401/403/404/400/429, ownership cruzado y CORS).
3. ~~Autenticación por token y su pantalla en el panel (`/panel/api`).~~ Hecho.
4. ~~Los 5 endpoints de `/api/v1/agenda-events`.~~ Hecho.
5. ~~Página de documentación (`docs/api.md`) y actualización de `docs/routes.md` y `docs/glossary.md`.~~ Hecho.
6. Prueba con el Municipio en el entorno local antes de `--remote`. Pendiente: también falta aplicar `0005` en `--remote` y el deploy, que requieren aprobación.
