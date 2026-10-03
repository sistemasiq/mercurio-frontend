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

## Pendientes (elementos del mockup sin dato o sin soporte)

No se muestran valores inventados; estos elementos se ocultan o se
simplifican hasta que exista la fuente.

### Shell

- **Buscador "Buscar o ir a… ⌘K"** (Sidebar): paleta de comandos por definir.
- **Campana de notificaciones** (Topbar): hoy solo aparece con alertas de
  inventario y lleva al Reporte de Stock; falta un centro de notificaciones.
- **Botón de ayuda** (Topbar): destino por definir.
- **Contadores de Cocina y Control de Acceso** (Sidebar): no hay una fuente
  compartida fuera de cada pantalla.
- **"Vendido en turno"** (tarjeta de caja) y **KPI "Ventas del turno"**
  (Inicio): el backend solo expone `totalVentas` al admin después de
  `BALANCE_REVELADO`.

### 00 Acceso

- **Foto del panel de login**: el mockup deja un placeholder; se usa la
  ilustración del logo.

### 01 Operación

- **Paquete en "Eventos de hoy"** (Inicio): se resuelve con el catálogo de
  paquetes solo donde ya está cargado.
- **Desglose Subtotal / IVA 16 %** (panel del pedido): requiere confirmar la
  regla fiscal antes de mostrarlo.
- **Método de pago en el panel del pedido**: se elige dentro del cobro
  multimodal.
- **Número de pedido y mesa antes de cobrar**: el folio lo asigna el backend;
  el POS no captura mesa.
- **Stock en piezas ("48 pzas")**: solo existe el "rinde" calculado por receta.
- **Últimos 4 dígitos de tarjeta** (1b.5): `AppliedPayment` solo guarda tipo y
  autorización.
- **Puntos ganados en el ticket** (1b.2): el detalle de orden no los regresa.
- **Checklist "Quien recoge coincide"** (Checkout): sería una validación nueva;
  se deja el acceso a las fotos para comparar.
- **Filtros por método y caja; Exportar** (historiales): sin soporte en el
  endpoint.
- **KPIs de arqueos**: el historial se pagina en el servidor; los KPIs cubren
  la página cargada.

### 02 Eventos

- **Botón "Filtrar"** (Resumen): no había filtros implementados; se reemplazó
  por acceso a Reservaciones.
- **Montos sugeridos de anticipo (30 %, 50 %, total)**: se conserva el campo
  con mínimo sugerido.
- **Vistas Semana / Día** (Calendario): solo existe la vista mensual; el
  endpoint por rango (`GET /reservaciones?desde&hasta`) ya existe.

### 03 Catálogo

- **Tipo de evento como chips** (Nueva reservación): se conserva el selector.

### 04 Inventario

- **Imagen 1:1 del producto** (4a.1): se conserva el selector de imagen
  existente.
- **Presentaciones dentro del diálogo de insumo** (4b.1): se gestionan en su
  propio diálogo.
- **Exportar** (kardex, stock, costo de ventas): sin endpoint.
- **KPIs de ventas, margen y merma** (4f): el reporte solo regresa costo por
  insumo.

### 05 Lealtad

- **"Mínimo para canjear"** (configuración): la configuración no tiene ese
  campo.
- **Ajuste manual de puntos** (kardex): no hay endpoint de ajuste.
- **Búsqueda por nombre del cliente** (kardex): el saldo se consulta solo por
  celular.
- **KPI "Por vencer"** (kardex): los movimientos no traen la caducidad por lote.
- **Top de clientes, periodo y Exportar** (reporte): el reporte solo regresa
  totales de la sucursal.

### 06 Administración

- **Pestañas Cajas / Horarios en el detalle de sucursal**: sin dato (no forma
  parte de este endpoint).
- **PIN de caja** (usuario): su semántica es una decisión de negocio
  pendiente; el usuario no trae ese campo.
- **Filtro de periodo y Exportar** (Reportes): sin endpoint (el filtro de
  periodo para indicadores por sucursal ya existe).

## Cambios de comportamiento

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
