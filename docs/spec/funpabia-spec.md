# Funpabia: sitio y panel de adopciones (especificación de producto)

**Versión:** borrador 0.1, 17/10/2026
**Autor:** Lucas Videla. Es un proyecto personal y gratuito; Lucas también paga el dominio.
**Estado:** para revisar con Funpabia. Todo lo marcado **[SUPUESTO]** está por validar con la fundación, y lo marcado **[PROPUESTA]** es una idea mía, no un dato.

Documentos relacionados:

- Datos de la fundación: `../funpabia-info.md`
- Referencias visuales: `../refs/refs.md` y `../refs/board.png`
- Base de diseño: `../design-system/design-system.md`, `tokens.css` y `palette-and-components.png`

---

## 1. Qué es

Un sitio público y un panel de gestión, gratis para la **Fundación Patagónica para el Bienestar Animal (FUN.PA.BI.A)** de Cipolletti, Río Negro.

El sitio muestra los animales en adopción con ficha propia y link para compartir. Permite pedir una adopción u ofrecerse como tránsito con un formulario y donar a metas concretas con avance visible. También permite reportar mascotas perdidas o encontradas por zona y enterarse de las castraciones, vacunaciones y campañas.

El panel, pensado para usar desde el celular, le permite a la comisión cargar animales en minutos. También sirve para llevar la historia clínica y los gastos de cada uno, revisar solicitudes y hacer el seguimiento post-adopción.

## 2. Qué problema resuelve

Lo que sigue sale de notas públicas y de sus redes (fuentes en `funpabia-info.md`):

- **Trabajan a pulmón.**
  - Un grupo chico de voluntarias sostiene el refugio de La Falda: una chacra cedida en comodato desde 2016, con alrededor de 13 caniles y unos 50 perros.
  - En la campaña municipal de agosto de 2026 había más de 50 perros y gatos en tránsito.
- **Todo pasa por Facebook, Instagram y el teléfono.**
  - Las adopciones se piden por mensaje privado o al 299-456-4530.
  - No tienen sitio web, catálogo ni formulario.
  - Los animales "viven" en posteos que se pierden en el feed. Instagram tiene unos 15 mil seguidores y 2.782 posteos; Facebook, unos 19.900 seguidores.
- **Hay deuda veterinaria recurrente.**
  - En 2025 gastaron $87.721.828 en veterinaria.
  - En septiembre de 2025 debían más de $7M.
  - En enero de 2026 suspendieron la atención por una deuda de unos $5M. La retomaron gracias a los vecinos, que bajaron la deuda a la mitad.
  - Las donaciones van a alias a nombre de una persona, sin una meta visible.
- **La información está dispersa.** Las solicitudes, los tránsitos, la castración de cachorros a los 6 meses, el seguimiento y los gastos por animal **[SUPUESTO]** hoy se llevan en chats, papeles o la memoria de cada voluntaria.
- **Volumen de 2025** (publicado por ellos): 80 rescates, 230 adopciones y 342 animales con atención veterinaria. Es mucho trabajo de coordinación para hacerlo a mano.

## 3. Objetivos y métricas de éxito

No hay línea de base medida. Las metas son **[PROPUESTA]** y se ajustan después de los primeros 3 meses con datos reales.

| Objetivo                                                  | Métrica                                                                                                                | Meta [PROPUESTA]                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Que cada animal en adopción sea encontrable y compartible | % de animales "en adopción" con ficha publicada y foto                                                                 | ≥ 90 % a 2 meses del lanzamiento                                                 |
| Ordenar las solicitudes                                   | % de solicitudes que entran por formulario (contra mensajes privados)                                                  | Medir el 1er mes; meta a definir con la fundación                                |
| Responder más rápido                                      | Tiempo mediano entre solicitud y primera respuesta                                                                     | Medir; meta a definir (por ejemplo, < 72 h)                                      |
| Adopciones responsables                                   | Adopciones por mes registradas en el sistema; % de seguimientos hechos a tiempo (por ejemplo, castración de cachorros) | Que el 100 % de las adopciones queden registradas; ≥ 80 % de seguimientos al día |
| Donaciones transparentes                                  | Monto donado declarado por meta; cantidad de aportes; metas cumplidas                                                  | Publicar el 100 % de las metas con avance actualizado al menos cada semana       |
| Reencuentros                                              | Reportes de perdidos o encontrados cerrados como "reencontrado"                                                        | Medir                                                                            |
| Facilidad de uso                                          | Tiempo para cargar un animal desde el celular                                                                          | < 3 minutos                                                                      |
| Sostenibilidad                                            | Costo mensual de infraestructura                                                                                       | Lo más bajo posible; ver la sección 14                                           |

Las métricas se miden con datos propios del sistema (estados, timestamps) y analítica respetuosa de la privacidad (por ejemplo Plausible o Umami). **[PROPUESTA]**

## 4. Usuarios y roles

| Rol                        | Quién es                                                                            | Qué puede hacer                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Visitante**              | Cualquier persona, sin cuenta                                                       | Ver el catálogo, las fichas, las noticias, la agenda, las metas y el mapa de perdidos y encontrados. Compartir. Donar. Reportar un encontrado. Mandar una denuncia |
| **Adoptante**              | Persona que pide adoptar                                                            | Completar el formulario de adopción y recibir el estado por email o WhatsApp. No necesita cuenta en el MVP **[PROPUESTA]**                                         |
| **Transitante**            | Hogar de tránsito                                                                   | Postularse. Una vez aprobado, el panel lo registra con su animal asignado. En Fase 2 puede reportar novedades                                                      |
| **Afiliado / socio**       | Persona que aporta una cuota                                                        | Darse de alta, ver el estado de su cuota y recibir novedades. _Hay que definir si la fundación quiere un esquema de socios_ **[SUPUESTO]**                         |
| **Voluntario**             | Persona que ayuda en el refugio o en eventos                                        | Postularse e inscribirse a turnos (Fase 2)                                                                                                                         |
| **Comisión / admin**       | Presidenta y equipo                                                                 | Todo el panel: animales, solicitudes, gastos, metas, noticias, reportes y usuarios                                                                                 |
| **Editor**                 | Voluntaria que carga contenido                                                      | Cargar y editar animales, fotos, noticias y agenda. Sin acceso a datos sensibles de adoptantes ni a la contabilidad                                                |
| **Veterinaria (opcional)** | La veterinaria con la que trabajan                                                  | Cargar eventos clínicos y costos de los animales asignados (Fase 3, **[SUPUESTO]**: ver si les interesa)                                                           |
| **Super admin técnico**    | Lucas                                                                               | Mantenimiento, backups y soporte                                                                                                                                   |

## 5. Alcance: sitio público y panel

**Sitio público:**

- Inicio
- Adoptá: catálogo y ficha de cada animal
- Cómo adoptar: requisitos y pasos
- Formulario de adopción
- Sé tránsito: info y formulario
- Doná: metas, alias y transparencia
- Perdidos y encontrados: mapa y listado
- Agenda: castración y vacunación
- Noticias y campañas
- Sumate: voluntariado y socios
- Denunciar maltrato
- Quiénes somos
- Contacto
- Privacidad

**Panel (con login, mobile first):**

- Tablero
- Animales
- Solicitudes
- Tránsitos
- Seguimientos
- Clínica y gastos
- Metas y donaciones
- Perdidos y encontrados (moderación)
- Noticias y agenda
- Personas
- Socios y cuotas
- Voluntarios y turnos
- Denuncias
- Rifas y eventos
- Usuarios y roles
- Configuración (alias, textos, redes)

**Fuera de alcance por ahora:**

- App nativa: el sitio es una PWA.
- Cobros recurrentes automáticos (Fase 3, ver la sección 11).
- Manejo de la contabilidad formal de la fundación.
- Turnos online de castración del municipio, salvo que el municipio lo pida.

## 6. Módulos funcionales

Prioridades: **MVP** (lanzamiento), **F2** (Fase 2) y **F3** (Fase 3).

### 6.1 Catálogo de adopción y ficha del animal (MVP)

**Historias de usuario:**

- Como visitante, quiero ver los animales en adopción y filtrar por especie, sexo, edad, tamaño y convivencia (con perros, gatos o chicos), para encontrar uno que se adapte a mi casa.
- Como visitante, quiero una ficha con fotos, historia, salud (castrado, vacunado, desparasitado) y requisitos, para decidir con información.
- Como visitante, quiero compartir la ficha por WhatsApp, Instagram o Facebook con una vista previa linda, para ayudar a difundir.
- Como comisión, quiero marcar un animal como "urgente" para que aparezca primero.

**Criterios de aceptación:**

- El listado muestra solo los animales con estado `en_adopcion` o `reservado`, ordenados primero por urgente y después por más antiguo en adopción.
- Los filtros se combinan y quedan en la URL, así que un filtro se puede compartir.
- La ficha tiene una URL linda (`/adopta/lobito-1234`), etiquetas OG y Twitter con la foto principal, el nombre y una línea de descripción, y JSON-LD básico.
- Botones: "Quiero adoptarlo/a" (lleva al formulario con el animal precargado), "Compartir por WhatsApp" (link `wa.me/?text=`) y "Copiar link".
- Los animales adoptados salen del catálogo pero su ficha sigue accesible con la etiqueta "Adoptado/a" y su historia feliz, si la fundación quiere.
- La ficha carga en menos de 2,5 s en 4G (LCP), con fotos optimizadas.
- Nunca se muestra la ubicación exacta del tránsito ni del refugio. Se muestra solo "Cipolletti" o la zona.

### 6.2 Formulario de adopción con pre-filtro (MVP)

**Historias de usuario:**

- Como adoptante, quiero un formulario corto por pasos que me diga qué piden, para no perder tiempo si no cumplo los requisitos.
- Como comisión, quiero que las solicitudes lleguen ordenadas con la info clave, para responder rápido y descartar las que no encajan.

**Criterios de aceptación:**

- **Paso 1 (pre-filtro):** edad (≥ 18 o el mínimo que definan **[SUPUESTO]**), localidad, vivienda (casa o depto, propia o alquilada, permiso), patio o cerramiento, otros animales y si están castrados, compromiso de castración si es cachorro, y aceptación del seguimiento.
  - Si alguna respuesta es excluyente según las reglas configurables, se le explica amablemente por qué y se le sugiere otra forma de ayudar (tránsito, donación, difusión).
- **Paso 2:** datos de contacto (nombre, WhatsApp, email), convivientes y rutina (horas solo, quién lo cuida en vacaciones).
- **Paso 3:** motivación, experiencia previa, fotos opcionales del espacio y consentimiento de datos personales (checkbox con link a la política).
- Hay barra de progreso, guardado parcial en el dispositivo (localStorage) y validación clara en español.
- Al enviar se crea una `SolicitudAdopcion` en estado `nueva` y se notifica a la comisión (email y, si se configura, aviso por WhatsApp manual, ver la sección 11). El adoptante recibe una confirmación con los próximos pasos.
- Hay anti-spam con honeypot y límite de envíos por IP, sin captchas molestos.
- Las preguntas y las reglas de pre-filtro se editan desde el panel, sin tocar código (F2; en el MVP quedan en una configuración).

### 6.3 Panel de animales: carga desde el celular (MVP)

**Historias de usuario:**

- Como voluntaria en el refugio, quiero sacar fotos y dar de alta un animal desde el celular en menos de 3 minutos.
- Como comisión, quiero ver de un vistazo cuántos animales hay en cada estado.

**Criterios de aceptación:**

- El alta mínima pide nombre, especie, sexo, edad aproximada, tamaño y al menos 1 foto. Todo lo demás es opcional y se completa después.
- Las fotos se suben desde la cámara o la galería. Se comprimen en el cliente antes de subir y se generan miniaturas en el servidor. Se pueden reordenar y elegir la principal.
- Estados: `ingresado` → `en_tratamiento` → `en_adopcion` → `reservado` → `adoptado`. Otros estados posibles: `en_transito`, `fallecido`, `devuelto` y `no_adoptable` (por ejemplo, permanencia en el refugio).
  - Cada cambio de estado queda en el historial, con quién lo hizo y cuándo.
- El tablero muestra conteos por estado, urgentes, solicitudes nuevas y seguimientos vencidos.
- Si se cae la conexión mientras se carga, no se pierde lo cargado: borrador local y reintento (ver la sección 9).

### 6.4 Solicitudes y seguimiento de adopciones y tránsitos (MVP básico, F2 completo)

**Historias de usuario:**

- Como comisión, quiero mover cada solicitud por etapas, para saber en qué está cada una.
- Como comisión, quiero que el sistema me recuerde la castración de los cachorros a los 6 meses y los controles post-adopción.

**Criterios de aceptación:**

- **Etapas de la solicitud:** `nueva` → `en_revision` → `entrevista` → `aprobada` → `entregado` (crea la `Adopcion`). También `rechazada` o `retirada`, con motivo.
- Se ve como lista en el celular y como tablero kanban en la compu. Tiene notas internas y botón "Escribir por WhatsApp" que abre `wa.me/<número>` con un mensaje armado.
- Al marcar `entregado`:
  - El animal pasa a `adoptado`.
  - Se generan seguimientos automáticos **[PROPUESTA]**: a los 7 días, a los 30 días y a los 6 meses. Si es cachorro, se agrega el control de castración a los 6 meses de edad.
  - Se puede registrar el contrato firmado (PDF o foto).
- **Seguimientos:** lista de pendientes y vencidos, cada uno con resultado (`ok`, `con_problemas`, `sin_respuesta`, `devuelto`) y notas.
- **Tránsitos:** asignar un animal a un transitante con fecha de inicio y fin. Los gastos del tránsito los cubre la fundación, como hacen hoy.

### 6.5 Donaciones transparentes con metas (MVP)

**Historias de usuario:**

- Como vecino, quiero saber para qué es mi aporte y cuánto falta, para donar con confianza.
- Como comisión, quiero publicar una meta (por ejemplo "Deuda veterinaria de enero") y actualizar el avance sin depender de un posteo.

**Criterios de aceptación:**

- **Meta / campaña:** título, descripción, monto objetivo, fecha límite opcional, imagen y animal o animales asociados (opcional). Estado `activa`, `cumplida` o `cerrada`.
- Barra de avance con "$X de $Y", porcentaje y cantidad de aportes, más la fecha de la última actualización.
- **Medios de pago en el MVP:** alias y CBU con botón de copiar, QR, y un link de pago de Mercado Pago por meta (creado a mano en Mercado Pago).
  - Con alias o transferencia **no hay confirmación automática**. El avance se carga a mano desde el panel, con un registro del aporte (monto, fecha, medio, donante opcional o anónimo).
- Página de transparencia: metas cumplidas y gastos veterinarios agregados por mes, si la fundación lo aprueba **[SUPUESTO]**.
- Sin datos personales de donantes en público. A lo sumo un nombre de pila o "Anónimo", y solo con su consentimiento.
- **[A definir]** la cuenta que recibe. Conviene una cuenta a nombre de la fundación. Los alias y el CBU se cargan desde el panel (Configuración), no en el código.
- F2: integración con la API de Mercado Pago (Checkout Pro y webhooks) para sumar los pagos con tarjeta o MP a la meta de forma automática.

### 6.6 Perdidos y encontrados por zona, con mapa (F2; MVP opcional si sobra tiempo)

**Historias de usuario:**

- Como vecino que encontró un perro, quiero reportarlo en 1 minuto, sin crear cuenta, con foto y la zona donde lo vi.
- Como dueño de un perro perdido, quiero ver en un mapa los encontrados cerca de donde se perdió.
- Como comisión, quiero moderar los reportes y cerrarlos cuando hay reencuentro.

**Criterios de aceptación:**

- **Reporte:** tipo (`perdido` o `encontrado`), especie, foto o fotos, color, tamaño, sexo si se sabe, collar o chapita, fecha, descripción y contacto (WhatsApp).
  - La ubicación se elige con un pin en el mapa o con el barrio, y **se guarda exacta pero se publica aproximada**: se redondea a unos 300–500 m o se muestra el centro del barrio **[PROPUESTA]**.
- **Mapa** (Leaflet y OpenStreetMap) con filtros de tipo, especie y fecha (últimos 7, 30 o 90 días). También hay una vista de lista para quien no quiera el mapa.
- **Búsqueda por cercanía:** "encontrados a menos de N km de este punto" (bounding box o geohash sobre D1).
- Cada reporte tiene una ficha compartible con OG. Vence a los 60 días **[PROPUESTA]** si no se renueva. Estados: `activo`, `reencontrado`, `vencido` y `oculto`.
- Para los perdidos se pide verificar el teléfono o el email (código o magic link) para evitar spam **[PROPUESTA]**. Los encontrados se publican sin cuenta, pero pasan por moderación o un filtro anti-spam.
- **Zonas:** se cargan como polígonos o como una lista de barrios de Cipolletti y alrededores (Fernández Oro, Allen, Neuquén capital...) **[SUPUESTO: cuáles cubre la fundación]**.

### 6.7 Agenda municipal de castración y vacunación y portal de noticias (MVP simple, F2 completo)

**Historias de usuario:**

- Como vecino, quiero saber cuándo y dónde hay castración o vacunación gratuita en mi barrio.
- Como comisión, quiero publicar noticias, campañas de concientización y comunicados rápido.

**Criterios de aceptación:**

- **Evento de agenda:** tipo (castración, vacunación antirrábica, desparasitación, jornada de adopción, feria, bingo), fecha y hora, lugar (dirección pública del evento), barrio, organizador (Funpabia, Municipio o Zoonosis), requisitos (turno, ayuno, edad mínima) y link o teléfono para el turno.
- Se ven como lista de próximos eventos, con filtro por barrio y tipo. Se puede agregar al calendario (archivo .ics) y compartir por WhatsApp.
- **Noticias:** título, foto, texto enriquecido, etiquetas (adopción, concientización, rescate, comunicado) y animales vinculados. Tienen su página y feed RSS.
- **[SUPUESTO]** Los datos de castración o vacunación del municipio los carga la fundación copiando del sitio o las redes del Municipio de Cipolletti y Zoonosis. Si el municipio quiere, en F3 se le puede dar un usuario "Municipio" que solo carga agenda.

### 6.8 Historia clínica y gastos por animal (F2)

**Historias de usuario:**

- Como comisión, quiero ver todo lo médico de un animal (vacunas, castración, tratamientos, cirugías) y cuánto costó, para planificar y rendir cuentas.

**Criterios de aceptación:**

- **Evento clínico:** fecha, tipo (vacuna, desparasitación, castración, consulta, cirugía, estudio, medicación, internación), descripción, veterinaria o profesional, adjuntos (receta o estudio) y próximo control.
- **Gasto:** fecha, monto, categoría (veterinaria, alimento, medicación, traslado, insumos), proveedor, comprobante (foto) y animal (opcional, porque hay gastos generales). Se puede vincular a una meta.
- **Reportes:** gasto por animal, por mes y por categoría, y deuda pendiente con proveedores (gastos `impagos`). Se exporta a CSV.
- En la ficha pública solo se ven las etiquetas resumidas (castrado, vacunado, desparasitado). Nunca los montos individuales ni los detalles médicos sensibles.

### 6.9 Denuncias de maltrato (F2)

**Historias de usuario:**

- Como vecino, quiero avisar de un caso de maltrato o abandono con foto y ubicación, sabiendo que mis datos no se publican.

**Criterios de aceptación:**

- **Formulario:** tipo (maltrato, abandono, animal herido o agusanado, acumulación), descripción, fotos o videos, ubicación (exacta, **solo visible para la comisión**), fecha, y contacto opcional con la opción de quedar anónimo.
- No se publica nada. Llega al panel en estado `nueva` → `en_evaluacion` → `derivada` (Zoonosis o Fiscalía) → `cerrada`.
- El formulario aclara con un texto visible que **no reemplaza la denuncia formal** y muestra los canales oficiales.
  - **[SUPUESTO]** Hay que validar cuáles son esos canales oficiales y si la fundación quiere recibir denuncias, porque puede saturarlas.

### 6.10 Voluntariado y turnos (F2)

**Historias de usuario:**

- Como persona que quiere ayudar, quiero postularme y elegir qué puedo hacer (limpieza de caniles, traslados, difusión, eventos, tránsito).
- Como comisión, quiero armar turnos (mañana o tarde en el refugio) y ver quién viene.

**Criterios de aceptación:**

- **Postulación:** datos, disponibilidad, habilidades, si tiene auto y localidad.
- **Turnos:** fecha, franja, tarea y cupo. El voluntario se anota con un link personal (magic link) y recibe un recordatorio por email.
- **[SUPUESTO]** La rutina actual es ir dos veces por día a limpiar y alimentar (dato de 2019); hay que confirmarlo.

### 6.11 Socios / afiliados y cuotas (F2–F3)

**Historias de usuario:**

- Como vecino, quiero hacerme socio con una cuota mensual para ayudar de forma fija.
- Como comisión, quiero ver quién está al día.

**Criterios de aceptación:**

- **Alta de socio:** datos, monto elegido (por ejemplo 3 opciones más un "otro") y medio de pago. En F2 se paga por transferencia o link de Mercado Pago, con registro manual; en F3, con suscripción de Mercado Pago.
- **Estados:** `activo`, `atrasado` y `baja`, con historial de cuotas pagadas.
- Comunicación: newsletter por email con novedades y adopciones del mes.
- **[SUPUESTO]** Que la fundación quiera socios formales. Si es una fundación (no una asociación civil), "socio" sería más bien "padrino o madrina mensual", sin derechos estatutarios. Hay que definir el nombre.

### 6.12 Rifas, bingos y eventos (F3)

- Página del evento con fecha, lugar y cómo colaborar (premios, buffet), vinculada a una meta.
- **Rifas:** solo la difusión y la lista de números vendidos cargada a mano **[PROPUESTA]**. Vender rifas online tiene implicancias legales (en Río Negro puede requerir autorización), así que hay que validarlo antes.

### 6.13 Contenido institucional (MVP)

- Quiénes somos, cómo adoptar, sé tránsito, cómo ayudar, contacto, redes, política de privacidad y términos.
- Todos los textos se pueden editar desde el panel (bloques simples).

## 7. Modelo de datos (entidades principales)

Son sugerencias de campos. Los nombres se pueden adaptar a convenciones del código (ver la sección 10). Todas las entidades llevan `id`, `created_at`, `updated_at`, auditoría de cambios donde aplica, y _soft delete_ (`discarded_at`) en las entidades con datos personales.

- **Animal**
  - nombre, slug, especie (perro, gato, otro), sexo, fecha_nacimiento_aprox, edad_categoria (cachorro, joven, adulto, senior), tamaño, color, raza_aprox
  - historia (texto), personalidad (etiquetas), convive_con_perros, convive_con_gatos, apto_ninos (sí, no o desconocido)
  - castrado, vacunado, desparasitado, microchip
  - estado (ver 6.3), urgente (bool), fecha_ingreso, motivo_ingreso (rescate, allanamiento, abandono, entrega)
  - ubicacion_actual (refugio, transito o veterinaria; sin dirección pública), transito_id, publicado (bool), requisitos_especiales
  - foto_principal_id
- **Foto:** animal_id (o polimórfica para reportes, noticias y metas), archivo, orden, alt_text, ancho, alto, consentimiento_uso (si muestra personas)
- **EventoClinico:** animal_id, fecha, tipo, descripcion, profesional, veterinaria, proximo_control, adjuntos, cargado_por
- **Gasto:** fecha, monto, moneda, categoria, proveedor, comprobante, estado_pago (pagado o impago), animal_id (opcional), meta_id (opcional), evento_clinico_id (opcional)
- **Persona:** nombre, apellido, telefono_whatsapp, email, localidad, barrio, direccion (privada), dni (opcional y privado, **solo si hace falta para el contrato**), consentimiento_datos (fecha y versión), canal_preferido, notas_internas, etiquetas (adoptante, transitante, voluntario, socio, donante)
- **SolicitudAdopcion:** persona_id, animal_id (opcional, si es "cualquiera que se adapte"), tipo (adopcion o transito), respuestas (JSON), resultado_prefiltro, etapa, motivo_rechazo, asignada_a (usuario), fechas por etapa
- **Adopcion:** animal_id, persona_id, solicitud_id, fecha_entrega, contrato (archivo), compromiso_castracion_fecha, devuelta (bool), fecha_devolucion
- **Transito:** animal_id, persona_id, desde, hasta, notas
- **Seguimiento:** adopcion_id o transito_id, tipo (7 días, 30 días, 6 meses, castración, otro), fecha_programada, fecha_realizada, resultado, notas, realizado_por
- **Afiliado (Socio / Padrino):** persona_id, monto, frecuencia, medio_pago, estado, fecha_alta, fecha_baja
- **Cuota:** afiliado_id, periodo, monto, fecha_pago, medio, comprobante
- **Meta (Campaña de recaudación):** titulo, slug, descripcion, monto_objetivo, monto_actual (calculado), fecha_limite, estado, imagen, link_mercado_pago, animales (relación muchos a muchos)
- **Donacion:** meta_id (opcional), monto, fecha, medio (alias, CBU, MP link, MP API, efectivo), donante_persona_id (opcional), nombre_publico (opcional), anonimo (bool), referencia_externa (id de MP), registrada_por
- **ReportePerdidoEncontrado:** tipo, especie, descripcion, color, tamaño, sexo, fecha_evento
  - ubicacion_exacta (latitud y longitud, privadas), ubicacion_publica (punto redondeado o centro del barrio), zona_id
  - contacto_nombre, contacto_telefono, contacto_verificado, estado, vence_el, token_edicion (para editar sin cuenta)
- **Zona:** nombre, localidad, centro (latitud y longitud) y radio aproximado
- **Noticia:** titulo, slug, cuerpo, imagen, etiquetas, publicada_el, autor, animales relacionados
- **EventoAgenda:** tipo, titulo, inicio, fin, lugar_nombre, direccion_publica, ubicacion (punto), zona_id, organizador, requisitos, link_turno, telefono_turno, fuente (por ejemplo "Municipalidad de Cipolletti")
- **Campaña de concientización:** se puede modelar como una Noticia con la etiqueta "campaña" y una galería de piezas **[PROPUESTA]**.
- **Voluntario:** persona_id, habilidades, disponibilidad, tiene_auto, estado
- **Turno:** fecha, franja, tarea, cupo, inscriptos (relación muchos a muchos con Voluntario)
- **Denuncia:** tipo, descripcion, ubicacion_exacta (privada), adjuntos, fecha_hecho, contacto (opcional), anonima, estado, derivada_a, notas
- **Usuario (panel):** email, nombre, rol (admin, editor, veterinaria, municipio, superadmin), 2FA opcional, último acceso
- **Auditoría:** quién cambió qué y cuándo, en Animal, Solicitud, Donación y Gasto.

## 8. Flujos principales

### 8.1 Adopción, de punta a punta

1. La voluntaria carga el animal desde el celular (alta mínima y fotos) y lo publica como `en_adopcion`.
2. Comparte la ficha en Instagram, Facebook y estados de WhatsApp. El link muestra una vista previa con la foto y el nombre.
3. La persona entra, lee los requisitos y toca "Quiero adoptarlo/a".
4. Completa el formulario por pasos. El pre-filtro le avisa si algo no encaja y le ofrece otras formas de ayudar.
5. Le llega la confirmación ("Recibimos tu solicitud, te escribimos en X días"). La comisión recibe un aviso.
6. La comisión revisa en el panel, pasa la solicitud a `en_revision` y le escribe por WhatsApp desde el botón. Pide fotos o videos del lugar.
7. Entrevista o visita: la solicitud pasa a `entrevista` y después a `aprobada` (o a `rechazada` con motivo). Las otras solicitudes del mismo animal reciben un mensaje amable.
8. Entrega: firman el contrato, se adjunta en el panel, la solicitud pasa a `entregado` y el animal a `adoptado`. Se generan los seguimientos.
9. Seguimientos a los 7 días, 30 días y 6 meses, más la castración si es cachorro, con recordatorios en el tablero y por email a la comisión.
10. Opcional: historia feliz publicada con foto del adoptante, con su permiso.

### 8.2 Perdido o encontrado

1. Un vecino encuentra un perro y toca "Encontré un animal".
2. Sube foto, marca la zona en el mapa y deja su WhatsApp. No necesita cuenta.
3. El reporte queda `activo` (o pendiente de moderación, según la configuración) y se publica con la ubicación aproximada.
4. El sistema muestra al vecino los "perdidos parecidos cerca" (misma especie, a menos de N km, últimos 30 días). En F3 se puede sumar coincidencia por foto.
5. El dueño ve el reporte, contacta por WhatsApp y se reencuentran.
6. Cualquiera de los dos marca "reencontrado" con su link de edición, o lo hace la comisión. Si nadie lo renueva, vence a los 60 días.

### 8.3 Donación a una meta

1. La comisión crea la meta "Deuda veterinaria $5.000.000" con su link de Mercado Pago, alias y CBU.
2. Se comparte la meta, que tiene su propia vista previa OG con la barra de avance dibujada en la imagen **[PROPUESTA]**.
3. El vecino dona por MP, alias o transferencia.
4. En el MVP, la comisión registra los aportes recibidos desde el panel (o importa un CSV de movimientos) y la barra se actualiza. En F2, los pagos por Mercado Pago entran solos por webhook.
5. Al llegar al 100 % la meta pasa a `cumplida` y se publica un "¡Gracias!" con el detalle de en qué se usó.

### 8.4 Cargar un animal desde el celular, en el refugio

1. Login. La sesión dura mucho y la app se puede instalar en el inicio (PWA).
2. Botón grande "+ Animal". Saca 1 a 5 fotos con la cámara.
3. Completa nombre, especie, sexo, edad aproximada y tamaño con botones grandes, sin teclado salvo para el nombre.
4. Guarda. Si no hay señal, queda en "pendiente de subir" y se sube sola cuando vuelve la conexión.
5. Después, desde la compu o el celular, se completa la historia y se publica.

## 9. Requisitos no funcionales

- **Mobile first:** la mayoría de las visitas y de las cargas van a ser desde el celular **[SUPUESTO razonable]**. Botones de al menos 44 px y formularios de una columna.
- **Funciona con mala conexión:**
  - Páginas livianas: menos de 200 KB de JS en el sitio público y fotos en WebP o AVIF con `srcset`.
  - Cache con service worker para el catálogo.
  - En el panel, cola de subida offline para el alta de animales y fotos, con compresión en el cliente.
- **Rendimiento:** LCP < 2,5 s y CLS < 0,1 en 4G medio.
- **Costo bajo:** todo en el plan gratuito de Cloudflare (Workers, D1 y R2), sin servidor propio (ver las secciones 10 y 14).
- **Accesibilidad WCAG 2.1 AA:**
  - Contrastes ya chequeados en el design system.
  - Navegación por teclado, `alt` en todas las fotos (el formulario de carga lo pide), labels en los formularios y foco visible.
  - Sin depender solo del color para el estado: cada estado lleva texto o ícono.
- **Privacidad (Ley 25.326 de Protección de Datos Personales):**
  - Se pide solo lo necesario. El DNI, solo si hace falta para el contrato.
  - Consentimiento explícito e informado en cada formulario, con fecha y versión de la política guardadas.
  - Derechos de acceso, rectificación y supresión: un email de contacto y, en el panel, la acción "anonimizar persona".
  - **Direcciones exactas nunca públicas.** El mapa de perdidos y encontrados muestra la ubicación aproximada. Las denuncias tienen la ubicación solo visible para la comisión. El refugio y los tránsitos no tienen dirección pública.
  - Roles con mínimo privilegio: el editor no ve los datos de adoptantes.
  - **[A VALIDAR]** Si corresponde inscribir la base en el registro de la AAIP. Hay que consultar con la fundación o un abogado.
  - Fotos con personas (adoptantes, voluntarios): solo con su permiso.
- **Seguridad:**
  - HTTPS, contraseñas robustas y 2FA opcional para admins.
  - Rate limiting en los formularios públicos y protección CSRF.
  - Backups periódicos de D1 y R2 fuera de Cloudflare, con prueba de restauración mensual.
- **Mantenibilidad:** lo debería poder mantener una sola persona (Lucas): pocas dependencias, deploy simple y logs claros.
- **Idioma:** español rioplatense, con formato de moneda y fecha `es-AR` y zona horaria America/Argentina/Buenos_Aires.

## 10. Stack (decidido)

Todo corre en el plan gratuito de Cloudflare, sin servidor propio. Los límites vigentes de cada plan se verifican antes de lanzar.

- **TanStack Start + React:** SSR y rutas con tipos. Un solo lenguaje (TypeScript) para sitio y panel.
- **Cloudflare Workers:** hosting y runtime del sitio y del panel.
- **D1 (SQLite):** base de datos. No tiene PostGIS: la búsqueda por cercanía usa bounding box o geohash sobre coordenadas, y las zonas son una lista de barrios en vez de polígonos.
- **R2:** fotos y adjuntos. Las miniaturas se generan al subir o con Cloudflare Images, a evaluar.
- **zod:** validación de todo dato que cruza un borde (formularios, server functions, respuestas externas).
- **TanStack Query:** solo si el loader del router no alcanza.
- **Tailwind CSS y shadcn/ui:** estilos con los tokens del design system y componentes reutilizables.
- **Autenticación:** sesiones propias para el panel, más magic links para voluntarios y reportes. La librería se elige al implementarla.
- **Mapas:** Leaflet con tiles de OpenStreetMap, respetando su política de uso y la atribución.
- **PWA:** manifest y service worker propios.
- **Recordatorios y tareas programadas:** Cron Triggers de Workers.
- **Convenciones del código:** `AGENTS.md` en la raíz del repo.

## 11. Integraciones

- **Mercado Pago:**
  - MVP: links de pago creados en la cuenta de la fundación, más alias y CBU con botón de copiar y QR.
  - F2: Checkout Pro y webhooks para sumar automáticamente a la meta.
  - F3: suscripciones para socios y padrinos.
  - **Requiere que la fundación tenga su cuenta** y decida quién es el titular.
- **WhatsApp:**
  - Links `wa.me/<número>?text=` (click-to-chat) para contactar a la fundación y a los adoptantes, y `wa.me/?text=` para compartir fichas.
  - Sin API de WhatsApp Business en el MVP: es paga y tiene trámites. **[PROPUESTA]** evaluarla en F3 para avisos automáticos.
- **Instagram y Facebook:**
  - Compartir con buenas etiquetas OG.
  - Generar una "placa" automática por animal (imagen 1080×1350 con foto, nombre y "Adoptame", con la paleta de la marca) para que la voluntaria la descargue y la suba a Instagram **[PROPUESTA]**.
  - Publicar automático vía Graph API queda para F3 (requiere app y permisos de Meta).
- **Mapas:** OpenStreetMap y Leaflet. La geocodificación de direcciones con Nominatim respeta su política de uso (bajo volumen y cache), o se usa un pin manual, que es lo más simple.
- **Email:** un proveedor transaccional con plan gratis o barato (a elegir: Postmark, Resend, Brevo, SES...) **[a verificar los precios]**.
- **Calendario:** archivos .ics por evento.
- **Analítica:** Plausible o Umami (o la analítica web de Cloudflare) o similar, sin cookies de terceros.

## 12. Contenido y SEO

- **Páginas clave** con títulos claros:
  - "Adoptá un perro en Cipolletti"
  - "Adoptá un gato en Cipolletti"
  - "Castración gratuita en Cipolletti: agenda"
  - "Perros perdidos y encontrados en Cipolletti y el Alto Valle"
- **Fichas indexables:** cada animal y cada reporte con título, descripción y OG. JSON-LD `Organization` (NGO) en el sitio y `Event` en la agenda.
- `sitemap.xml`, `robots.txt` y URLs en español con slug.
- Las fichas de animales adoptados quedan como historias, sin desindexar de golpe, para no perder links compartidos.
- Perfil de Google Business del refugio, si la fundación quiere y sin dirección exacta pública: Google permite ocultarla en negocios de área de servicio **[a verificar]**.
- **Contenido de concientización:** tenencia responsable, castración, qué hacer si encontrás un perro, cómo ser tránsito. Textos cortos y útiles, en criollo.
- Link al sitio desde la bio de Instagram y Facebook.
- **[SUPUESTO]** La fundación revisa y aprueba los textos institucionales.

## 13. Diseño

- **Base:** `../design-system/design-system.md`, `tokens.css` y `tokens.json`. Vista previa en `palette-and-components.png`.
  - Paleta derivada del logo real: verde azulado de la cinta como color principal (`#04665F` / `#04847C`), turquesa del perro, amarillo de la roseta, lila del gato como acento, neutros cálidos y estados (adoptado, urgente, perdido, encontrado).
  - Tipografías: Fraunces (títulos) y Figtree (texto). Plano y cálido, sin degradados ni brillos.
- **Referencias de UX:** `../refs/refs.md` y `../refs/board.png`.
  - Battersea: ficha con galería.
  - Adoptá un Camperito: catálogo y "¡Adoptame!".
  - Best Friends: bloque de donación.
  - Red Mascotas y JOPET: mapa de perdidos y encontrados.
  - Furever Homes: formulario por pasos con progreso.
- Fotos reales de los animales como protagonistas: más fotos y menos ilustración.
- **[A VALIDAR]** Pedir el logo original en vector o alta resolución, y que aprueben la paleta.

## 14. Hosting y costos (aproximados, **a verificar** al momento de contratar)

| Concepto            | Opción                                                                                                                   | Costo aprox.                                        | Fuente / nota                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------ |
| Dominio `.com.ar`   | NIC Argentina, a nombre de Lucas (CUIT y clave fiscal)                                                                   | $8.500 ARS por año (alta y renovación)              | [nic.ar aranceles](https://nic.ar/es/dominios/aranceles), Res. 5/2024    |
| Dominio `.org.ar`   | Solo **personas jurídicas sin fines de lucro** con habilitación previa (estatuto). Lo tendría que registrar la fundación | $8.500 ARS por año                                  | [nic.ar .org.ar](http://nic.ar/es/node/14)                               |
| Hosting             | Cloudflare Workers, plan gratis                                                                                          | $0                                                  | **A verificar** los límites vigentes                                     |
| Base de datos       | Cloudflare D1, plan gratis                                                                                               | $0                                                  | **A verificar** los límites vigentes                                     |
| Fotos               | Cloudflare R2, plan gratis                                                                                               | $0 con poco volumen                                 | **A verificar** los planes vigentes                                      |
| DNS / CDN           | Cloudflare plan gratis                                                                                                   | $0                                                  | **A verificar**                                                          |
| Email transaccional | Plan gratis de algún proveedor                                                                                           | $0 si el volumen es bajo                            | **A verificar**                                                          |
| Mercado Pago        | Sin costo fijo; comisión por cobro                                                                                       | Según la tarifa vigente de MP                       | **A verificar** con la fundación                                         |

Total estimado: **$0 de infraestructura más $8.500 ARS por año de dominio.** Es una estimación a confirmar, y depende de que el uso se mantenga dentro de los planes gratuitos.

## 15. Roadmap por fases

**MVP (objetivo [PROPUESTA]: 6–8 semanas de trabajo en ratos libres; no es un compromiso):**

- Sitio público: inicio, catálogo con filtros, ficha con compartir y OG, cómo adoptar, formulario de adopción y de tránsito con pre-filtro, doná (metas con barra, alias, CBU y link de MP), quiénes somos, contacto y privacidad.
- Panel mobile first: animales (alta rápida con fotos, estados), solicitudes (etapas, botón de WhatsApp), metas y registro manual de donaciones, y usuarios con 2 roles (admin y editor).
- Agenda simple, cargada a mano.
- Infra: dominio, deploy, backups y analítica.

**Fase 2:**

- Seguimientos automáticos y tránsitos completos.
- Historia clínica y gastos por animal, con reportes y CSV.
- Perdidos y encontrados con mapa, zonas y cercanía.
- Noticias y campañas completas.
- Denuncias.
- Voluntarios y turnos.
- Mercado Pago con webhooks.
- Preguntas del formulario editables.
- Placas automáticas para Instagram.

**Fase 3:**

- Socios y padrinos con suscripción de MP.
- Rifas y eventos.
- Usuario para la veterinaria y para el municipio.
- Coincidencias de perdidos y encontrados por foto o atributos.
- Publicación automática en redes.
- Avisos por WhatsApp Business.
- Multi-refugio, si otros refugios del Alto Valle lo piden; por ejemplo, el Refugio Chuliber, al que Funpabia ayudó.

## 16. Riesgos

- **Adopción interna:** si nadie de la fundación carga datos, el sitio muere. Mitigación: alta ultra rápida desde el celular, capacitación corta y arrancar con los 10–20 animales más urgentes.
- **Datos personales sensibles** (adoptantes, denuncias): cumplir la Ley 25.326 y aplicar mínimo privilegio. Un error puede exponer a gente.
- **Cuenta de cobro:** las donaciones deberían entrar a una cuenta institucional.
- **Spam o mal uso** de perdidos y encontrados o de denuncias: moderación, vencimiento y verificación.
- **Bus factor:** Lucas mantiene solo. Mitigación: documentación, backups probados, stack simple, y la fundación como dueña del dominio o de las cuentas, o con acceso.
- **Expectativas:** que no se espere una app nativa ni automatizaciones de redes en el MVP.
- **Dependencia de terceros:** cambios en Mercado Pago o Meta.

## 17. Preguntas abiertas con la fundación

Las preguntas y pedidos pendientes con la comisión se llevan fuera del repositorio, porque son notas de trabajo con datos de personas. Los puntos marcados **[SUPUESTO]** y **[A VALIDAR]** en este documento son los que dependen de esas respuestas.

---

_Lo verificado sobre Funpabia sale de notas de prensa (LM Cipolletti, Diario Río Negro, Mejor Informado y Cipo360), del Municipio de Cipolletti y de sus perfiles públicos de Facebook e Instagram, consultados el 17/10/2026. Todo lo demás es propuesta o supuesto a validar._
