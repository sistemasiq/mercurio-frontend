import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import type { NavBadge, NavGroup, NavItem } from '@/types/navigation'

interface AppNavigation {
  visibleGroups: ComputedRef<NavGroup[]>
  badgeFor: (routeName: string) => NavBadge | null
  sectionFor: (routeName: string | null, path: string) => string | null
}

/**
 * Menú lateral de la app (Sidebar del diseño) filtrado por permisos, más
 * helpers para los contadores y la miga de pan del Topbar.
 */
export function useAppNavigation(): AppNavigation {
  const auth = useAuthStore()
  const alertasInventario = useAlertasInventarioStore()
  const router = useRouter()

  // El Administrador de sucursal no opera la caja directamente (apertura/cierre/venta) —
  // solo el AdministradorSistema y el Cajero. Su única vista de este módulo es el historial.
  const esAdminDeSucursal = computed(
    () => auth.hasRole('Administrador') && !auth.hasRole('AdministradorSistema'),
  )

  const navGroups = computed<NavGroup[]>(() => [
    {
      label: null,
      items: [{ label: 'Inicio', icon: 'home', routeName: 'home' }],
    },
    {
      label: 'Operación',
      items: [
        ...(esAdminDeSucursal.value
          ? []
          : [
              {
                label: 'Caja (POS)',
                icon: 'point_of_sale',
                routeName: 'pos-caja',
                permission: 'pos:acceder',
              },
              {
                label: 'Apertura y Cierre',
                icon: 'key',
                routeName: 'pos-cierre',
                permission: 'pos:acceder',
              },
            ]),
        {
          label: 'Cocina',
          icon: 'restaurant',
          routeName: 'pos-cocina',
          permission: 'restaurante:gestionar_cocina',
        },
        {
          label: 'Control de Acceso',
          icon: 'badge',
          routeName: 'estancias-control-acceso',
          permission: 'estancias:ver_activos',
        },
        {
          label: 'Pulseras',
          icon: 'sensors',
          routeName: 'estancias-pulseras',
          permission: 'pulseras:listar',
        },
        {
          label: 'Historial de Ventas',
          icon: 'receipt',
          routeName: 'pos-historial',
          permission: 'restaurante:registrar_pago',
        },
        {
          label: 'Historial de Arqueos',
          icon: 'receipt_long',
          routeName: 'pos-historial-arqueos',
          permission: 'turnos_caja:historial',
        },
      ],
    },
    {
      label: 'Eventos',
      items: [
        {
          label: 'Resumen',
          icon: 'dashboard',
          routeName: 'eventos-resumen',
          permission: 'reservaciones:listar',
        },
        {
          label: 'Reservaciones',
          icon: 'event_note',
          routeName: 'eventos-reservaciones',
          permission: 'reservaciones:listar',
        },
        {
          label: 'Calendario',
          icon: 'calendar_today',
          routeName: 'eventos-calendario',
          permission: 'reservaciones:listar',
        },
        {
          label: 'Pagos',
          icon: 'payments',
          routeName: 'eventos-pagos',
          permission: 'reservaciones:gestionar_pagos',
        },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        {
          label: 'Extras',
          icon: 'add_box',
          routeName: 'extras-listar',
          // :crear (no :listar): esta pantalla administra el catálogo. Cajero
          // tiene :listar solo para leerlo al hacer una reservación, no debe
          // ver esta sección de gestión.
          permission: 'extras:crear',
        },
        {
          label: 'Paquetes',
          icon: 'card_giftcard',
          routeName: 'paquetes-listar',
          permission: 'paquetes:crear',
        },
        {
          label: 'Tipos de Evento',
          icon: 'category',
          routeName: 'tipos-evento-listar',
          permission: 'tipos_evento:crear',
        },
        {
          label: 'Métodos de Pago',
          icon: 'credit_card',
          routeName: 'metodos-pago-listar',
          permission: 'metodos_pago:crear',
        },
      ],
    },
    {
      label: 'Inventario',
      items: [
        {
          label: 'Productos',
          icon: 'liquor',
          routeName: 'productos-listar',
          permission: 'inventario:gestionar_productos',
        },
        {
          label: 'Insumos',
          icon: 'inventory_2',
          routeName: 'insumos-listar',
          permission: 'inventario:gestionar_insumos',
        },
        {
          label: 'Proveedores',
          icon: 'local_shipping',
          routeName: 'proveedores-listar',
          permission: 'inventario:gestionar_proveedores',
        },
        {
          label: 'Compras',
          icon: 'shopping_cart',
          routeName: 'compras-listar',
          permission: 'inventario:gestionar_compras',
        },
        {
          label: 'Reporte de Stock',
          icon: 'bar_chart',
          routeName: 'reportes-inventario',
          permission: 'reportes:inventario',
        },
        {
          label: 'Costo de Ventas',
          icon: 'request_quote',
          routeName: 'reportes-inventario-cogs',
          permission: 'reportes:inventario',
        },
      ],
    },
    {
      label: 'Lealtad',
      items: [
        {
          label: 'Configuración',
          icon: 'loyalty',
          routeName: 'lealtad-configuracion',
          permission: 'lealtad:gestionar_configuracion',
        },
        {
          label: 'Kardex',
          icon: 'history',
          routeName: 'lealtad-kardex',
          permission: 'lealtad:ver_saldo',
        },
        {
          label: 'Reporte',
          icon: 'insights',
          routeName: 'lealtad-reporte',
          permission: 'lealtad:ver_reporte',
        },
      ],
    },
    {
      label: 'Administración',
      items: [
        {
          label: 'Sucursales',
          icon: 'store',
          routeName: 'sucursales-listar',
          permission: 'sucursales:listar',
        },
        {
          label: 'Usuarios',
          icon: 'group',
          routeName: 'usuarios-listar',
          permission: 'usuarios:listar',
        },
        {
          label: 'Roles',
          icon: 'admin_panel_settings',
          routeName: 'roles-listar',
          permission: 'permisos:ver',
        },
        {
          label: 'Horarios',
          icon: 'schedule',
          routeName: 'admin-horarios',
          permission: 'horarios:listar',
        },
        {
          label: 'Cajas',
          icon: 'point_of_sale',
          routeName: 'admin-cajas',
          permission: 'cajas:crear',
        },
        {
          label: 'Reportes',
          icon: 'analytics',
          routeName: 'reportes-dashboard',
          permission: 'reportes:dashboard',
        },
      ],
    },
  ])

  function isVisible(item: NavItem): boolean {
    return !item.permission || auth.hasPermission(item.permission)
  }

  const visibleGroups = computed(() =>
    navGroups.value
      .map((group) => ({ ...group, items: group.items.filter(isVisible) }))
      .filter((group) => group.items.length > 0),
  )

  // Solo los contadores con dato real en un store. Cocina y Control de Acceso
  // tienen contador en el diseño pero aún no hay fuente (ver docs/refactor-ui.md).
  function badgeFor(routeName: string): NavBadge | null {
    if (routeName === 'insumos-listar' || routeName === 'reportes-inventario') {
      const count = alertasInventario.totalAlertas
      return count > 0 ? { count, tone: 'warn' } : null
    }
    return null
  }

  // Sección para la miga de pan: el grupo del ítem actual o, para rutas que no
  // están en el menú (p. ej. /eventos/reservaciones/nueva), el grupo del ítem
  // cuya ruta es prefijo de la actual.
  function sectionFor(routeName: string | null, path: string): string | null {
    let best: { label: string; length: number } | null = null
    for (const group of navGroups.value) {
      for (const item of group.items) {
        if (item.routeName === routeName) return group.label ?? 'Inicio'
        const itemPath = router.resolve({ name: item.routeName }).path
        if (path.startsWith(itemPath + '/') && (!best || itemPath.length > best.length)) {
          best = { label: group.label ?? 'Inicio', length: itemPath.length }
        }
      }
    }
    return best?.label ?? null
  }

  return { visibleGroups, badgeFor, sectionFor }
}
