# Refactor UI — Woow Kids

Implementación del diseño "Refactor UI Woow Kids" (claude.ai/design, proyecto
`69c16682-c47b-4738-b34c-caa209a401da`). Todo se trabaja en la rama
`refactor/UI`, con commits por módulo.

## Fases

| Fase     | Diseño                                         | Estado    |
| -------- | ---------------------------------------------- | --------- |
| 0 · Base | Sidebar, Topbar, TablePage, Dialog, 07 Sistema | Hecha     |
| 1        | 00 Acceso                                      | Pendiente |
| 2        | 01a Operación · Caja                           | Pendiente |
| 3        | 01b Operación · Estancias                      | Pendiente |
| 4        | 02 Eventos                                     | Pendiente |
| 5        | 03 Catálogo                                    | Pendiente |
| 6        | 04 Inventario                                  | Pendiente |
| 7        | 05 Lealtad · 06 Administración                 | Pendiente |

## Base disponible (fase 0)

- **Tokens** en `src/css/app.scss` (`:root`): superficies, texto, bordes,
  tonos semánticos `--tone-{ok,warn,bad,info,off,pink}-{bg,fg,dot}`, radios
  y sombras. Tipografía Plus Jakarta Sans e íconos Material Icons Outlined
  (los nombres planos de `q-icon` se resuelven a outlined en `App.vue`).
- **Quasar global:** botones, campos, `q-table`, `q-dialog` y `Notify` ya
  tienen el estilo del diseño sin tocar cada página.
- **Layout:** `components/layout/AppSidebar.vue`, `AppTopbar.vue`; menú y
  migas de pan en `composables/useAppNavigation.ts`.
- **Componentes** (`components/ui/`): `PageHeader`, `KpiCard`,
  `StatusBadge` (`shared/EstadoBadge` lo envuelve), `DataTableCard`,
  `StateBlock` (cargando / sin datos / sin resultados / error) y
  `BaseDialog`.
- **Dev:** `/dev` (7a) y `/dev/ui` (kit con tabla, toasts, estados y
  diálogos de ejemplo).

## Pendientes (elementos del mockup sin dato en el backend)

Se ocultan hasta que exista la fuente; no se muestran valores inventados.

| Elemento                      | Dónde                       | Qué falta                                                                                                          |
| ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Buscador "Buscar o ir a… ⌘K"  | Sidebar                     | Paleta de comandos / búsqueda global (solo frontend, por definir alcance).                                         |
| Campana de notificaciones     | Topbar                      | Hoy solo aparece con alertas de inventario y lleva al Reporte de Stock. Falta un centro de notificaciones general. |
| Botón de ayuda                | Topbar                      | Destino (manual, soporte) por definir.                                                                             |
| Contador de Cocina            | Sidebar                     | Número de comandas pendientes en una fuente compartida (hoy vive en `useComandasSocket`, solo dentro del visor).   |
| Contador de Control de Acceso | Sidebar                     | Número de estancias por vencer/excedidas fuera de la página.                                                       |
| "Vendido en turno"            | Tarjeta de caja del sidebar | El backend solo expone `totalVentas` al admin después de `BALANCE_REVELADO`.                                       |

## Cambios de comportamiento

- Se quitó el modo "mini" (colapsar el sidebar a íconos): el diseño no lo
  contempla. Debajo de 1024 px el sidebar pasa a overlay con botón de menú en
  el Topbar.
- El selector de sucursal del AdministradorSistema se movió del header al
  sidebar.
- Las notificaciones salen arriba a la derecha (antes arriba al centro).
