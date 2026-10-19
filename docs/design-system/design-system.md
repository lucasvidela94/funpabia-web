# Funpabia: base de design system (borrador)

Proyecto personal de Lucas Videla: sitio y panel gratis para Funpabia. Es un borrador del 17/10/2026, para charlarlo con la fundación antes de cerrarlo.

Archivos:
- `tokens.css`: variables CSS planas (para `preview.html`).
- `tokens.json`: los mismos tokens más el chequeo de contraste.
- `palette-and-components.png`: vista previa. **Desactualizada** respecto de la revisión de la sección 8 (gris-500 y borde de input); regenerarla desde `preview.html`.
- `preview.html`: fuente de la vista previa.
- `../../tools/design-tokens/gen.py`: fuente única de los tokens. Genera `tokens.json`, `tokens.css` y `src/styles/tokens.css` (el que usa la app, con `@theme` de Tailwind y las variables de shadcn/ui), y falla si un par obligatorio baja del contraste mínimo. Se corre con `python3 -I tools/design-tokens/gen.py`.
- `../../public/brand/logo-ref.jpg`: logo de referencia (320 px).

### Nombres de los tokens: español → inglés

El código usa los nombres en inglés (`bg-ink`, `text-gray-500`, `border-line-strong`). Este documento conserva los nombres en español en la prosa; esta tabla es el puente. `tokens.css` de esta carpeta mantiene los nombres viejos como alias solo para `preview.html`.

| Español | Inglés | | Español | Inglés |
|---|---|---|---|---|
| `tinta`, `tinta-2` | `ink`, `ink-2` | | `turquesa-500`, `-100` | `turquoise-500`, `-100` |
| `gris-500` | `gray-500` | | `amarillo-400`, `-100` | `yellow-400`, `-100` |
| `borde-fuerte` | `line-strong` | | `lila-400`, `-700`, `-100` | `lilac-400`, `-700`, `-100` |
| `borde` | `line` | | `exito-adoptado`, `exito-bg` | `adopted`, `adopted-soft` |
| `arena` | `sand` | | `aviso-urgente`, `aviso-bg` | `urgent`, `urgent-soft` |
| `papel` | `paper` | | `error-perdido`, `error-bg` | `lost`, `lost-soft` |
| `blanco` | `white` | | `info-encontrado`, `info-bg` | `found`, `found-soft` |

Los tonos `teal-*` ya estaban en inglés. Tipografías: `font-heading` (Fraunces) y `font-sans` (Figtree).

## 1. De dónde salen los colores

**Logo real.** Lo bajé de la foto de perfil pública de Facebook ([facebook.com/funpabiacipolletti](https://www.facebook.com/funpabiacipolletti)), 320×320. En Instagram (@funpabiacipolletti) está el mismo logo, a 100×100. Esas copias no están en este repo; la única es `public/brand/logo-ref.jpg`.

El logo es una roseta o escarapela de premio con un gato y un perro abrazados, sobre fondo negro, con el texto "FUN.PA.BI.A · Fundación para el Bienestar Animal" en blanco y letra fina tipo dibujada a mano.

### Colores reales de la marca (sacados del logo con k-means y después la mediana de cada zona)
| Elemento del logo | Hex | Peso aprox. (sin el negro) |
|---|---|---|
| Fondo negro | `#010102` | ~62 % de la imagen entera |
| Perro turquesa | `#5CC2C2` | ~29 % |
| Roseta amarilla pálida | `#EEED91` | ~20 % |
| Cinta verde azulado | `#04847C` | ~16 % |
| Gato lila / rosa | `#BE8AB7` | ~15 % |
| Texto blanco | `#FFFFFF` | — |

Las sombras grises (`#666D6F`, `#2B3D3C`) son ruido del JPG y los bordes, no son colores de marca.

### Qué **no** encontré
- No encontré el logo en vectores ni en alta resolución, ni la foto de portada de Facebook: sin login no aparece.
- No conseguí flyers propios. Las imágenes de las notas de LM Cipolletti y Mejor Informado son fotos de perros, no piezas gráficas.
- De esas fotos solo salen tonos de contexto: tierra y caramelo (`#8A704A`, `#A2967F`), gris cemento (`#A9A6A2`) y un celeste de cucha (`#40A6BF`). **No son marca.** Inspiraron los neutros cálidos de la propuesta, nada más.
- No hay manual de marca ni tipografía oficial. La letra del logo parece manuscrita y condensada, y no la identifiqué.

## 2. Propuesta de paleta

La idea es salir del logo pero hacerlo usable en una web. El negro del logo queda para el logo y algún bloque de contraste. La base es papel cálido con un **verde azulado** como color principal. Nada de degradados violetas ni brillos: todo plano.

**Marca** (derivada del logo):
- `teal-600 #04847C`: el verde de la cinta tal cual. Para fondos y botones grandes.
- `teal-700 #04665F`: **primario** para botones y links, porque contrasta mejor.
- `teal-900 #053F3B`: bloques oscuros (CTA de tránsito) y hover.
- `teal-100 #D5EFEC`: fondo suave.
- `turquesa-500 #5CC2C2`: el del perro. Para rellenos, ilustraciones y la etiqueta "Perro". **Nunca con texto blanco encima.**
- `turquesa-100 #E3F5F4`: fondo suave.
- `amarillo-400 #EEED91`: la roseta. Acento para botones secundarios llamativos y resaltados, siempre con texto oscuro.
- `amarillo-100 #FBFAE0`: fondo suave.
- `lila-400 #BE8AB7`: el gato. Acento chico, por ejemplo la etiqueta "Gato". Se usa plano y poco, no como degradado.
- `lila-700 #7D4A76`: texto sobre `lila-100`.
- `lila-100 #F3E8F1`: fondo suave.

**Neutros cálidos:**
- `tinta #1C1B19`: texto.
- `tinta-2 #4A4642`: texto suave.
- `gris-500 #736D66`: notas al pie y `muted-foreground`. Era `#7A746D`, que fallaba sobre `arena` (4.14:1); ahora da 4.58:1 sobre `arena` y 5.03:1 sobre `papel`.
- `borde-fuerte #8A8379`: borde de inputs, selects y controles. 3.36:1 o más sobre `papel`, `arena` y `blanco`.
- `borde #E6DFD3`: solo divisores decorativos (1.3:1), nunca el límite de un control.
- `arena #F7F2E9`: fondo alternado.
- `papel #FFFDF9`: fondo base.
- `blanco #FFFFFF`.

**Estados** (cada uno con su fondo `-bg`):
- **Adoptado / éxito:** `#2F7A47` sobre `#E3F2E6`.
- **Urgente / aviso:** `#9A4508` sobre `#FDEBD7`. Lo usamos para tránsito urgente y casos médicos.
- **Perdido / error:** `#B3261E` sobre `#FBE4E1`.
- **Encontrado / info:** `#1F5F8B` sobre `#E1EEF7`. También sirve para avisos del municipio, como castraciones y vacunación.

## 3. Contraste (WCAG 2.1 AA: 4.5:1 texto normal, 3:1 texto grande)
| Par | Ratio | ¿Sirve? |
|---|---|---|
| tinta / papel | 16.9 | AA |
| tinta-2 / papel | 9.2 | AA |
| gris-500 / papel · arena | 5.03 · 4.58 | AA |
| borde-fuerte / papel · arena · blanco (inputs) | 3.68 · 3.36 · 3.74 | AA no-texto (3:1) |
| blanco / teal-700 (botón primario) | 6.84 | AA |
| teal-700 / papel (links) | 6.73 | AA |
| blanco / teal-600 | 4.56 | AA (justo); mejor en botones grandes |
| teal-600 / papel | 4.49 | **No** para texto chico, solo títulos o íconos |
| tinta / turquesa-500 | 8.16 | AA |
| blanco / turquesa-500 | 2.11 | **No** |
| tinta / amarillo-400 | 14.06 | AA |
| blanco / lila-400 | 2.79 | **No** |
| tinta / lila-400 | 6.15 | AA |
| lila-700 / lila-100 | 5.66 | AA |
| adoptado / su bg | 4.53 | AA |
| urgente / su bg | 5.59 | AA |
| perdido / su bg | 5.38 | AA |
| encontrado / su bg | 5.79 | AA |
| blanco / perdido · adoptado · urgente | 6.54 · 5.26 · 6.50 | AA |

Regla corta: **sobre turquesa, amarillo o lila, el texto va siempre oscuro.**

## 4. Tipografía (Google Fonts, gratis, con tildes y ñ)
- **Títulos: Fraunces** (500 y 700). Es una serif suave con personalidad: cálida, nada corporativa y lejos del look "IA genérica".
- **Texto: Figtree** (400, 600 y 700). Es una sans redondeada, muy legible en el celular y en el panel.
- **Escala (rem):** xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.375 · 2xl 1.75 · 3xl 2.25 · 4xl 3.
- **Interlineado:** 1.15 en títulos y 1.55 en texto.
- **Otras opciones** si Fraunces les resulta muy "editorial": *Baloo 2* (más juguetona) o *Bricolage Grotesque*.

## 5. Espaciado, bordes y sombra
- **Espaciado:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px (`--space-1` a `--space-8`).
- **Bordes redondeados:** sm 6 · md 12 (botones e inputs) · lg 20 (tarjetas) · pill 999 (etiquetas).
- **Sombra de tarjeta:** muy suave y cálida, `0 1px 2px` + `0 4px 12px` con la tinta al 6 %.

## 6. Componentes clave
- **Tarjeta de mascota**
  - Foto grande arriba, 4:3 o 1:1, con una etiqueta de estado arriba a la izquierda (Urgente, Adoptado).
  - Debajo: el nombre en Fraunces, la línea "sexo · edad · tamaño · zona" y etiquetas de salud o convivencia (Castrado, Vacunado, Con perros).
  - Un solo botón primario: "Quiero adoptarlo/a".
- **CTA de adopción o tránsito**
  - Bloque `teal-900` con título blanco y botón amarillo ("Ofrecer tránsito"), más un botón secundario con borde blanco.
  - Mensaje: "vos ponés el cariño, la fundación cubre la veterinaria". Eso sale de lo que dicen ellos en la prensa.
- **Barra de meta de donación**
  - Título de la meta (por ejemplo "Deuda veterinaria") y una barra `teal-600` sobre `arena`.
  - Debajo: "$X de $Y", el porcentaje y la cantidad de aportes, con los botones "Donar" y "Alias y CBU".
  - Es para que cada crisis sea una meta visible y no un posteo suelto.
- **Etiquetas de perdido o encontrado:** pastillas con su color de estado y un punto o ícono. Perdido en rojo, Encontrado en azul, Adoptado en verde, Urgente en naranja. Las de especie: Gato en lila, Perro en turquesa.
- **Banner de alerta:** fondo del estado, borde izquierdo de 6 px con el color fuerte y título en negrita. Casos de uso: "Tránsito urgente", "Castración gratuita el sábado…" (agenda municipal) y "¡Fue adoptada!".

En la vista previa, los nombres, montos y fechas de los componentes son de ejemplo. La foto de la tarjeta es de una nota de LM Cipolletti y solo sirve para ilustrar; no hay que usarla en producción sin permiso.

## 7. Dudas abiertas
- Conviene pedirle a la fundación el logo original (vector o PNG grande) y preguntar si tienen colores o tipografía definidos. Los hex de arriba salen de un JPG de 320 px, así que pueden variar ±3–5 en cada canal.
- Hay que confirmar que les guste que el verde azulado sea el principal y no el negro del logo.
- No usé ningún asset de Facebook o Instagram más allá de bajarlos como referencia. Para publicarlos hace falta su OK.

## 8. Revisión UX/UI (17/10/2026)

Pasada con la skill `ui-ux-pro-max` (prioridades 1 a 6: accesibilidad, interacción, rendimiento, estilo, layout, tipografía y color) más el chequeo de contraste de `tools/design-tokens/gen.py`, que ahora cubre 30 pares obligatorios.

### Qué se mantuvo y por qué
- **Estilo plano y cálido.** La skill sugirió Claymorphism (sombras dobles, bordes gruesos, aspecto de juguete). Se descartó: pesa más, su riesgo de accesibilidad es "condicional" y el sitio tiene que transmitir seriedad en donaciones y rendición de cuentas. La skill sí confirmó la dirección de color: teal más un acento cálido es lo que recomienda para veterinarias y mascotas.
- **Fraunces + Figtree.** La skill propone pares redondeados (Varela Round + Nunito Sans). Se mantiene el par actual: Fraunces da calidez con personalidad y Figtree es muy legible en celular. Los dos tienen tildes y ñ.
- **Amarillo como botón secundario, con texto oscuro** (14:1), en lugar del naranja que sugiere la skill. El naranja queda para el estado "urgente".

### Qué se cambió
| Hallazgo | Ajuste |
|---|---|
| `gris-500` daba 4.14:1 sobre `arena` | Pasó a `#736D66` (4.58:1 sobre `arena`) |
| No había borde de control con 3:1 (el `borde` da 1.3:1) | Token nuevo `borde-fuerte #8A8379` para inputs, selects y controles; `borde` queda solo para divisores |
| El foco no estaba definido | Anillo de 2 px en `teal-700` con 2 px de separación; en bloques `teal-900` se usa `amarillo-400` (9.6:1), con la clase `.on-dark` |
| Los tokens no eran utilizables desde Tailwind ni shadcn/ui | `src/styles/tokens.css` define `@theme` y las variables semánticas de shadcn (`background`, `primary`, `muted-foreground`, `input`, `ring`, etc.) apuntando a la paleta |
| `prefers-reduced-motion` no estaba contemplado | Regla global en `src/styles.css` |
| Los tokens vivían en tres lugares | Un solo generador (`gen.py`) escribe los tres archivos |

### Reglas que quedan
- **Color nunca solo.** Perdido, Encontrado, Adoptado y Urgente llevan texto y punto o ícono además del color.
- **Turquesa, amarillo y lila son rellenos.** Dan 1.2 a 2.8:1 sobre `papel`: sirven de fondo de etiquetas con texto oscuro, no como borde, ícono o texto que lleve significado.
- **Texto sobre turquesa, amarillo o lila: siempre `tinta`.**
- **Botones y links:** `teal-700` (texto blanco 6.8:1). `teal-600` solo para barras de meta, títulos grandes e íconos.
- **Controles táctiles de 44 px o más** y 8 px de separación, sobre todo en el panel mobile.
- **Íconos en SVG** (Lucide, el set de shadcn/ui); sin emojis como íconos.
- **Fotos:** WebP o AVIF con `srcset`, tamaño reservado para no mover el layout (CLS < 0,1) y `alt` obligatorio.

### Estados del animal sin color propio todavía
La paleta tiene 4 estados (adoptado, urgente, perdido, encontrado) y la spec define más (sección 6.3). Propuesta de mapeo, a validar:

| Estado | Etiqueta |
|---|---|
| `en_adopcion` | `teal-100` con texto `teal-900` |
| `reservado` | `amarillo-100` con texto `tinta` |
| `en_tratamiento`, `en_transito` | `info-bg` con texto `info-encontrado` |
| `ingresado`, `no_adoptable`, `devuelto` | `arena` con texto `tinta-2` |
| `adoptado` | `exito-bg` con texto `exito-adoptado` |
| `fallecido` | `arena` con texto `tinta-2` y ícono de vela |

### Decisiones abiertas
- **Modo oscuro:** descartado (17/10/2026). El sitio y el panel son siempre claros, aunque el sistema del visitante esté en oscuro: `color-scheme: light` en `src/styles.css` y en el `<head>`. Los componentes de shadcn no llevan clases `dark:`; si un componente nuevo las trae, se borran al agregarlo (igual quedan inertes, porque la variante `dark` solo responde a una clase `.dark` que nadie pone).
- **Fuentes:** resuelto. La app las autoaloja con `@fontsource-variable/fraunces` y `@fontsource-variable/figtree` (menos requests y sin enviar la IP de los visitantes a Google). Solo `preview.html` sigue cargando Google Fonts.
- **Logo:** el de referencia es un JPG de 320 px sobre negro. Hay que pedir el vector a la fundación; hasta entonces no sirve de favicon ni de logo del header.
