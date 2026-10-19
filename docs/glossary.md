# Glossary

The spec (`docs/spec/funpabia-spec.md`) and the foundation speak Spanish; the code and the schema speak English. This table is the bridge: use the English term in code, the Spanish term in user-facing copy (es-AR).

## Entities

| Spanish (spec, UI) | English (code, schema) |
| --- | --- |
| Animal | `animal` |
| Foto | `photo` |
| Persona | `person` |
| Solicitud de adopción o tránsito | `application` (`type`: `adoption` or `foster`) |
| Adopción | `adoption` |
| Tránsito | `foster_placement` |
| Seguimiento | `follow_up` |
| Meta (campaña de recaudación) | `goal` |
| Donación | `donation` |
| Rifa | `raffle` |
| Número de la rifa | `raffle_ticket` |
| Noticia | `news_post` |
| Evento de agenda | `agenda_event` |
| Reporte de perdido o encontrado | `lost_found_report` (`kind`: `lost` or `found`) |
| Zona (localidad del reporte) | `zone` |
| Usuario del panel | `app_user` |
| Token de API | `api_token` |
| Configuración | `setting` |
| Auditoría | `audit_log` |

## Enum values

| Field | Spanish | English |
| --- | --- | --- |
| `animal.species` | perro, gato, otro | `dog`, `cat`, `other` |
| `animal.sex` | macho, hembra, desconocido | `male`, `female`, `unknown` |
| `animal.age_category` | cachorro, joven, adulto, senior | `baby`, `young`, `adult`, `senior` |
| `animal.size` | chico, mediano, grande | `small`, `medium`, `large` |
| `animal.status` | ingresado | `intake` |
| | en tratamiento | `under_treatment` |
| | en adopción | `available` |
| | reservado | `reserved` |
| | adoptado | `adopted` |
| | en tránsito | `fostered` |
| | fallecido | `deceased` |
| | devuelto | `returned` |
| | no adoptable | `not_adoptable` |
| `animal.intake_reason` | rescate, allanamiento, abandono, entrega | `rescue`, `raid`, `abandonment`, `surrender` |
| `animal.current_location` | refugio, tránsito, veterinaria | `shelter`, `foster`, `vet` |
| `application.stage` | nueva, en revisión, entrevista, aprobada, entregado, rechazada, retirada | `new`, `in_review`, `interview`, `approved`, `delivered`, `rejected`, `withdrawn` |
| `application.prescreen_result` | apta, a revisar, excluida | `eligible`, `review`, `ineligible` |
| `follow_up.type` | 7 días, 30 días, 6 meses, castración, otro | `day_7`, `day_30`, `month_6`, `neutering`, `other` |
| `follow_up.result` | ok, con problemas, sin respuesta, devuelto | `ok`, `problems`, `no_response`, `returned` |
| `goal.status` | activa, cumplida, cerrada | `active`, `fulfilled`, `closed` |
| `donation.method` | alias, CBU, link de MP, API de MP, efectivo | `alias`, `cbu`, `mp_link`, `mp_api`, `cash` |
| `raffle.status` | borrador, en venta, cerrada, sorteada | `draft`, `selling`, `closed`, `drawn` |
| `raffle_ticket.status` | reservado, pagado (sin fila: libre) | `reserved`, `paid` |
| `agenda_event.type` | castración, vacunación, desparasitación, jornada de adopción, feria, bingo | `neutering`, `vaccination`, `deworming`, `adoption_day`, `fair`, `bingo` |
| `agenda_event.organizer` | Funpabia, municipio, Zoonosis, otro | `funpabia`, `municipality`, `zoonosis`, `other` |
| `lost_found_report.kind` | perdido, encontrado | `lost`, `found` |
| `lost_found_report.status` | por revisar, publicado, reencontrado, oculto | `pending`, `active`, `reunited`, `hidden` |
| `person.tags` | adoptante, transitante, voluntario, socio, donante | `adopter`, `foster`, `volunteer`, `member`, `donor` |
| `news_post.tags` | adopción, concientización, rescate, comunicado, campaña | `adoption`, `awareness`, `rescue`, `statement`, `campaign` |
| `app_user.role` | superadmin, admin, editor, veterinaria, municipio | `superadmin`, `admin`, `editor`, `veterinarian`, `municipality` |

Terms with no good English equivalent stay as proper nouns: `alias` and `cbu` (Argentine bank identifiers), `mercado_pago`, `zoonosis` (the municipal office).

## API

| Spanish | English (code) |
| --- | --- |
| Alcance (permiso de un token) | `scope`, shape `<resource>:<action>` (today only `agenda-events:write`) |
