import type { LinkProps } from '@tanstack/react-router'
import { can, type Action } from '@/lib/auth/lib/permissions'

// How-to guides for the panel, by task rather than by screen: titled with what someone wants to
// do. Steps name buttons and fields exactly as the screens show them; when a label changes on a
// screen, change it here too. Each guide follows the same permission table as its screen.

export type HelpGuide = {
  slug: string
  title: string
  permission: Action
  steps: string[]
  action: { label: string; to: LinkProps['to'] }
}

const GUIDES: HelpGuide[] = [
  {
    slug: 'cargar-animal',
    title: 'Cargar un animal desde el celular',
    permission: 'animal:create',
    steps: [
      'Tocá "+ Animal", arriba a la derecha. Está en todas las pantallas del panel.',
      'Completá nombre, especie, sexo, edad aproximada y tamaño. Lo demás se puede sumar después.',
      'Sumá fotos. Se achican solas antes de subirse, así que sirven las de la cámara tal cual.',
      'Tocá "Guardar". El animal queda cargado, pero todavía no se ve en el sitio.',
      'Cuando esté listo para adoptar, en su ficha cambiá el estado a "En adopción" y tocá "Publicar".',
    ],
    action: { label: 'Cargar un animal', to: '/panel/animales/nuevo' },
  },
  {
    slug: 'responder-solicitud',
    title: 'Responder una solicitud de adopción',
    permission: 'users:manage',
    steps: [
      'En Solicitudes, abrí una que diga "Nueva". El pre-filtro ya marca si es Apta, A revisar o Excluida.',
      'Leé las respuestas y tocá "Escribir por WhatsApp": se abre con un mensaje armado, que podés cambiar antes de mandarlo.',
      'A medida que avanza, cambiá la etapa: En revisión, Entrevista, Aprobada. En las notas queda lo que hablaron.',
      'Si no sigue adelante, pasala a Rechazada o Retirada y escribí el motivo.',
      'Cuando el animal se va a su casa, pasala a Entregado. Los seguimientos aparecen en Seguimientos.',
    ],
    action: { label: 'Ver las solicitudes', to: '/panel/solicitudes' },
  },
  {
    slug: 'seguimiento',
    title: 'Hacer el seguimiento de una adopción',
    permission: 'users:manage',
    steps: [
      'En Seguimientos están los próximos, y los vencidos van primero.',
      'Escribile a la familia para saber cómo está el animal.',
      'Tocá "Registrar resultado", elegí cómo está y guardalo. Pasa a la lista de registrados.',
    ],
    action: { label: 'Ver los seguimientos', to: '/panel/seguimientos' },
  },
  {
    slug: 'registrar-donacion',
    title: 'Registrar una donación que llegó por alias o en efectivo',
    permission: 'users:manage',
    steps: [
      'En Metas, abrí la meta a la que fue la plata.',
      'En "Registrar un aporte", escribí el monto y la fecha, y elegí cómo llegó.',
      'El nombre público va solo si la persona pidió figurar, y solo el nombre de pila. Vacío es anónimo.',
      'Tocá "Registrar". La barra del sitio se actualiza en el momento, y al llegar al objetivo la meta pasa a Cumplida.',
      'Si te equivocaste, borrá el aporte desde la lista y cargalo de nuevo.',
    ],
    action: { label: 'Ver las metas', to: '/panel/metas' },
  },
  {
    slug: 'crear-meta',
    title: 'Crear una meta para juntar plata',
    permission: 'users:manage',
    steps: [
      'En Metas, tocá "Nueva meta".',
      'Poné un título que diga para qué es, el monto objetivo y, si querés, una fecha límite.',
      'Si armaste un link de pago en Mercado Pago, pegalo: aparece como botón Donar.',
      'Al guardarla se publica en Doná, con su barra de avance.',
    ],
    action: { label: 'Crear una meta', to: '/panel/metas/nueva' },
  },
  {
    slug: 'rifa',
    title: 'Vender y anotar los números de una rifa',
    permission: 'users:manage',
    steps: [
      'En Rifas, tocá "Nueva rifa" y cargá los premios, el precio, la cantidad de números y la meta.',
      'Revisá los datos y tocá "Abrir la venta". Desde ahí el precio y la cantidad no cambian.',
      'Cada vez que se vende un número, tocalo en la grilla y marcalo Reservado o Pagado. Quién compró y quién vendió es opcional.',
      '"Cuentas" muestra lo cobrado y lo que falta cobrar, también por vendedora. "Descargar planilla" baja todo en una tabla.',
      'Al terminar: "Cerrar la venta", cargá el número ganador y tocá "Registrar lo recaudado" para sumarlo a la meta.',
    ],
    action: { label: 'Ver las rifas', to: '/panel/rifas' },
  },
  {
    slug: 'perdidos',
    title: 'Revisar un reporte de perdido o encontrado',
    permission: 'lost-found:moderate',
    steps: [
      'Los reportes nuevos llegan a Perdidos como "Por revisar". Todavía no se ven en el sitio.',
      'Revisá que sea un animal de verdad y que el texto no tenga datos de más, como una dirección exacta.',
      '"Aprobar y publicar" lo pone en el sitio. "Ocultar" lo saca sin borrarlo.',
      'Cuando se reencuentran, tocá "Marcar reencontrado". Si nadie lo cierra, deja de verse solo a los 60 días.',
    ],
    action: { label: 'Ver los reportes', to: '/panel/perdidos' },
  },
  {
    slug: 'agenda',
    title: 'Publicar una castración o una jornada en la agenda',
    permission: 'agenda:write',
    steps: [
      'En Agenda, tocá "Nuevo evento" y elegí el tipo.',
      'Completá el título, cuándo empieza y, si se sabe, cuándo termina.',
      'Sumá el lugar, los requisitos y el link o el teléfono para sacar turno.',
      'Tocá "Publicar evento". Aparece en la agenda del sitio y desaparece solo cuando pasa.',
    ],
    action: { label: 'Ir a la agenda', to: '/panel/agenda' },
  },
  {
    slug: 'noticia',
    title: 'Publicar una noticia o una campaña',
    permission: 'news:write',
    steps: [
      'En Noticias, tocá "Nueva noticia".',
      'Escribí el título y el texto, elegí las etiquetas y, si querés, una foto de portada.',
      'Si habla de animales del refugio, vinculalos desde la misma noticia.',
      'Elegí si se publica ya o queda como borrador, y tocá "Guardar noticia".',
    ],
    action: { label: 'Ir a las noticias', to: '/panel/noticias' },
  },
  {
    slug: 'sumar-persona',
    title: 'Sumar a alguien al panel',
    permission: 'users:manage',
    steps: [
      'En Usuarios, tocá "Sumar una persona".',
      'Escribí su nombre y su email, y elegí el rol: Comisión ve todo, Editora carga animales, noticias y agenda, Veterinaria consulta las fichas y Municipio solo carga la agenda.',
      'Poné una contraseña inicial de al menos 12 caracteres y tocá "Crear la cuenta".',
      'Pasale la contraseña en persona o por un mensaje privado, nunca en un grupo.',
      'Si deja de colaborar, "Dar de baja" cierra su sesión en todos sus dispositivos.',
    ],
    action: { label: 'Ir a Usuarios', to: '/panel/usuarios' },
  },
  {
    slug: 'configuracion',
    title: 'Cargar los datos para donar y de contacto',
    permission: 'settings:manage',
    steps: [
      'En Configuración, cargá cada cuenta que recibe donaciones: banco o billetera, alias y, si querés, CBU y titular.',
      'Más abajo, el teléfono, el WhatsApp, el email y las redes que se muestran en el sitio.',
      'Tocá "Guardar". El sitio los muestra en Doná y en el pie de todas las páginas.',
    ],
    action: { label: 'Ir a Configuración', to: '/panel/configuracion' },
  },
]

export function guidesForRole(role: string) {
  return GUIDES.filter((guide) => can(role, guide.permission))
}
