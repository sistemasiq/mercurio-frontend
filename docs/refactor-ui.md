# Refactor UI — Woow Kids

Implementación del diseño "Refactor UI Woow Kids" (claude.ai/design, proyecto
`69c16682-c47b-4738-b34c-caa209a401da`). Todo se trabaja en la rama
`refactor/UI`, con commits por módulo.

## Fases

- **0 · Base** (Sidebar, Topbar, TablePage, Dialog, 07 Sistema): hecha.
- **1 · 00 Acceso**: hecha.
- **2 · 01a Operación · Caja**: hecha.
- **3 · 01b Operación · Estancias e historiales**: hecha.
- **4 · 02 Eventos**: hecha.
- **5 · 03 Catálogo**: hecha.
- **6 · 04 Inventario**: hecha.
- **7 · 05 Lealtad · 06 Administración**: hecha.

## Base disponible (fase 0)

- **Tokens** en `src/css/app.scss` (`:root`): superficies, texto, bordes,
  tonos semánticos `--tone-{ok,warn,bad,info,off,pink}-{bg,fg,dot}`, radios
  y sombras. Tipografía Plus Jakarta Sans e íconos Material Icons Outlined
  (los nombres planos de `q-icon` se resuelven a outlined en `App.vue`).
- **Quasar global:** botones, campos, `q-table`, `q-dialog`, `q-card`,
  `q-banner`, `q-stepper`, tipografía (`text-h4`…`text-caption`) y `Notify`
  ya tienen el estilo del diseño sin tocar cada página.
- **Layout:** `components/layout/AppSidebar.vue`, `AppTopbar.vue`; menú y
  migas de pan en `composables/useAppNavigation.ts` (`meta.section` en la ruta
  para pantallas fuera del menú).
- **Componentes** (`components/ui/`): `PageHeader`, `KpiCard`,
  `StatusBadge` (`shared/EstadoBadge` lo envuelve), `DataTableCard`,
  `TablePager`, `StateBlock` (cargando / sin datos / sin resultados / error) y
  `BaseDialog`.
- **Clases globales de listado:** `.list-page`, `.list-page__note`,
  `.code-chip`, `.cell-sub`, `.cell-muted`.
- **Dev:** `/dev` (7a) y `/dev/ui` (kit con tabla, toasts, estados y
  diálogos de ejemplo).

## Pendientes

Sin pendientes: todos los elementos del mockup tienen fuente de datos o una
decisión de diseño registrada abajo.

## Cambios de comportamiento

- Panel del login: la imagen del mockup es el logo de la marca
  (`public/woow-kids-logo.png`).

- Método de pago: no se elige en el panel del pedido; se elige dentro del
  cobro multimétodo (decisión de diseño final).

- Se quitó el modo "mini" del sidebar; debajo de 1024 px pasa a overlay con
  botón de menú en el Topbar.
- El selector de sucursal del AdministradorSistema se movió del header al
  sidebar.
- Las notificaciones salen arriba a la derecha (antes arriba al centro).
- Inicio pasó de una rejilla de accesos a un tablero operativo (pendientes,
  eventos del día, pulseras), cada bloque condicionado a su permiso.
- Caja: se quitó un diálogo de notas duplicado que se abría junto al modal de
  notas; la barra de comandas en curso carga al entrar (antes, a los 15 s).
- Apertura y Cierre: el retiro parcial y la cancelación del conteo son
  diálogos; "Terminal en espera" tiene botón para abrir el acceso del
  administrador.
- Visor de cocina: tablero por columnas y botón de pantalla completa del
  navegador.
- Detalle de comanda en pantalla completa: usa los nombres, tonos y acciones
  del tablero ("Iniciar preparación", "Marcar lista", "Entregada") y marca el
  retraso a los 10 min, igual que la tarjeta (antes, a los 45 min).
- Calendario: la semana empieza en lunes y el panel lateral muestra hoy por
  defecto.
- Etiquetas de campo en formato de oración (antes en MAYÚSCULAS).
- Sucursales y Usuarios: el alta y la edición son diálogos del listado; las
  rutas `/sucursales/nueva`, `/sucursales/:id/editar`, `/usuarios/nuevo` y
  `/usuarios/:id/editar` redirigen al listado y abren el diálogo.
- Desactivar una sucursal pide escribir su nombre para confirmar.
- Roles: los permisos se editan en su propio diálogo (acción "Permisos"),
  separados del nombre y la descripción.
- El tablero del AdministradorSistema (`/reportes/dashboard`) pasó al formato
  de Reportes y ya no tiene accesos rápidos de alta (están en cada listado).
- El sidebar marca el ítem padre en pantallas fuera del menú (detalle de
  sucursal, kardex de insumo, etc.).
