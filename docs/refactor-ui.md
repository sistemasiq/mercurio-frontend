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
- **6 · 04 Inventario**: pendiente.
- **7 · 05 Lealtad · 06 Administración**: pendiente.

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

- **"Tus puntos Woow"** (portal de padres): el tutor no trae saldo de lealtad.
- **"Cargo extra"** en visita excedida: no viene en `NinoActivo`.
- **Importe y puntos de visita finalizada**: `NinoActivo` no los trae; se
  muestra duración y pulsera.
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
- **Hora de entrada real** (Control de Acceso): `ActivoDto` trae minutos
  transcurridos; la hora se deriva.
- **"Cliente frecuente · pts" y tiempo de juego por niño** (Registro): el
  registro no consulta lealtad y define un solo tiempo para todo el registro.
- **Checklist "Quien recoge coincide"** (Checkout): sería una validación nueva;
  se deja el acceso a las fotos para comparar.
- **Cargo excedente antes de confirmar** (Checkout): la cotización se pide al
  confirmar la salida.
- **UID RFID y "Asignada a"** (Pulseras): `PulseraAdmin` no los trae.
- **Filtros por método y caja; Exportar** (historiales): sin soporte en el
  endpoint.
- **KPIs de arqueos**: el historial se pagina en el servidor; los KPIs cubren
  la página cargada.

### 02 Eventos

- **Botón "Filtrar"** (Resumen): no había filtros implementados; se reemplazó
  por acceso a Reservaciones.
- **Folio de reservación (R-0418)**: `Reservaciones` no tiene folio legible.
- **Tipo de evento como chips y bloques de horario ocupados/libres**
  (Nueva reservación): se conserva el selector y las horas libres; la
  disponibilidad por bloque requiere endpoint.
- **Montos sugeridos de anticipo (30 %, 50 %, total)**: se conserva el campo
  con mínimo sugerido.
- **Vistas Semana / Día y "horario libre"** (Calendario): solo existe la vista
  mensual.
- **KPI "Anticipos" y filtros por método / mes** (Pagos): el modelo no
  distingue anticipo de liquidación.

### 03 Catálogo

- **Duración, tipos de evento, anticipo y "destacado" del paquete** (3b.1): el
  modelo de paquete no tiene esos campos.
- **Duplicar paquete** (3b): no existe la acción en el backend.
- **Conteo de paquetes por tipo de evento** (3c): no hay relación expuesta.
- **Comisión y "solicitar referencia"** (3d.1): el método de pago solo tiene
  nombre, descripción, tipo y activo.

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
- Calendario: la semana empieza en lunes y el panel lateral muestra hoy por
  defecto.
- Etiquetas de campo en formato de oración (antes en MAYÚSCULAS).
