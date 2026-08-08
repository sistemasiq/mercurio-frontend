<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSucursalesStore } from '@/stores/sucursales'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { getInitials, getAvatarColor } from '@/utils/avatar'

interface NavItem {
  label: string
  icon: string
  routeName: string
  permission?: string
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const auth = useAuthStore()
const turno = useTurnoCajaStore()
const sucursalesStore = useSucursalesStore()
const router = useRouter()
const route = useRoute()

const leftOpen = ref(true)

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')

watch(sidebarCollapsed, (collapsed) => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
})

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

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
    label: 'OPERACIÓN',
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
        label: 'Historial de Arqueos',
        icon: 'receipt_long',
        routeName: 'pos-historial-arqueos',
        permission: 'turnos_caja:historial',
      },
      {
        label: 'Historial de Ventas',
        icon: 'receipt',
        routeName: 'pos-historial',
        permission: 'restaurante:registrar_pago',
      },
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
    ],
  },
  {
    label: 'EVENTOS',
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
        icon: 'payment',
        routeName: 'eventos-pagos',
        permission: 'reservaciones:gestionar_pagos',
      },
    ],
  },
  {
    label: 'CATÁLOGO',
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
    label: 'INVENTARIO',
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
    ],
  },
  {
    label: 'LEALTAD',
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
    label: 'ADMINISTRACIÓN',
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

const userInitials = computed(() => getInitials(auth.currentUser?.name ?? ''))
const userColor = computed(() => getAvatarColor(auth.currentUser?.name ?? ''))
const userName = computed(() => auth.currentUser?.name ?? auth.currentUser?.email ?? '')
const userRole = computed(() => auth.primaryRole ?? '')
const branchName = computed(() => auth.currentBranchName ?? '')

// ── Selector de sucursal para AdministradorSistema ──────────────────────────
// No tiene sucursal propia; este selector le permite "pararse" en una para
// ver sus catálogos/listados (reservaciones, inventario, etc.) sin tener que
// cerrar sesión y volver a entrar como si fuera de esa sucursal.
const sucursalOptions = computed(() =>
  sucursalesStore.activas.map((s) => ({ label: s.nombre, value: s.id })),
)

function onSucursalVistaChange(sucursalId: string | null): void {
  auth.setViewingBranch(sucursalId)
}

// Estado de apertura de caja visible en cualquier pantalla, no solo dentro del
// módulo de caja — solo aplica al Cajero, que es a quien RN-CIE-001 bloquea de
// vender/cobrar (comandas, check-in/checkout, eventos) sin turno OPERANDO.
const mostrarEstadoTurno = computed(() => auth.hasRole('Cajero'))

const estadoTurnoInfo = computed(() => {
  if (turno.estaOperando) {
    return { label: 'Caja Abierta', clase: 'estado-turno--abierta', icon: 'lock_open' }
  }
  if (turno.sinTurno) {
    return { label: 'Sin Apertura de Caja', clase: 'estado-turno--cerrada', icon: 'lock' }
  }
  // EN_CONTEO / ESPERANDO_REVISION / BALANCE_REVELADO / CERRADO: hay un turno,
  // pero tampoco se puede vender mientras no vuelva a OPERANDO.
  return { label: 'En Corte de Caja', clase: 'estado-turno--corte', icon: 'hourglass_empty' }
})

onMounted(() => {
  if (mostrarEstadoTurno.value) {
    turno.cargarTurnoActivo()
  }
  if (auth.isSistema) {
    sucursalesStore.cargar()
  }
})

function isActive(routeName: string): boolean {
  return route.name === routeName
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <q-drawer
      v-model="leftOpen"
      side="left"
      :width="230"
      :mini="sidebarCollapsed"
      :mini-width="64"
      :breakpoint="0"
      show-if-above
      class="sb-drawer"
      :class="{ 'sb-drawer--collapsed': sidebarCollapsed }"
    >
      <div class="sb-root">
        <!-- Nav -->
        <div class="sb-nav-scroll">
          <template v-for="group in visibleGroups" :key="group.label ?? 'root'">
            <div v-if="group.label && !sidebarCollapsed" class="sb-section-label">
              {{ group.label }}
            </div>
            <q-list class="sb-nav" padding>
              <q-item
                v-for="item in group.items"
                :key="item.routeName"
                v-ripple
                clickable
                class="sb-item"
                :class="{ 'sb-item--active': isActive(item.routeName) }"
                @click="router.push({ name: item.routeName })"
              >
                <q-item-section avatar>
                  <q-icon :name="item.icon" size="18px" />
                </q-item-section>
                <q-item-section v-if="!sidebarCollapsed">{{ item.label }}</q-item-section>
                <q-tooltip v-if="sidebarCollapsed" anchor="center right" self="center left">
                  {{ item.label }}
                </q-tooltip>
              </q-item>
            </q-list>
          </template>
        </div>

        <!-- Colapsar/expandir -->
        <div class="sb-collapse-toggle">
          <q-btn
            flat
            dense
            round
            :icon="sidebarCollapsed ? 'chevron_right' : 'chevron_left'"
            size="sm"
            class="sb-collapse-btn"
            :aria-label="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
            @click="toggleSidebar"
          >
            <q-tooltip anchor="center right" self="center left">
              {{ sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú' }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-drawer>

    <!-- ── Header ─────────────────────────────────────────── -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-toolbar-title class="header-brand">
          <img src="/woow-kids-mascot.png" alt="Woow Kids" class="header-brand-img" />
          Woow Kids
        </q-toolbar-title>

        <q-space />

        <div class="header-actions">
          <q-select
            v-if="auth.isSistema"
            :model-value="auth.viewingBranchId"
            :options="sucursalOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            dense
            outlined
            options-dense
            behavior="menu"
            placeholder="Ver todas las sucursales"
            class="header-branch-select"
            @update:model-value="onSucursalVistaChange"
          >
            <template #prepend>
              <q-icon name="store" size="18px" />
            </template>
          </q-select>
          <div v-else-if="branchName" class="header-branch">
            <q-icon name="store" size="18px" />
            <span>{{ branchName }}</span>
          </div>

          <div v-if="mostrarEstadoTurno" class="header-branch" :class="estadoTurnoInfo.clase">
            <q-icon :name="estadoTurnoInfo.icon" size="18px" />
            <span>{{ estadoTurnoInfo.label }}</span>
          </div>

          <div class="header-divider" />

          <div class="header-user">
            <div class="header-avatar" :style="{ background: userColor }">
              {{ userInitials }}
            </div>
            <div class="header-user-info">
              <div class="header-user-name">{{ userName }}</div>
              <div class="header-user-role">{{ userRole }}</div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            class="action-btn action-btn--logout"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            @click="handleLogout"
          >
            <q-icon name="logout" size="20px" />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ── Contenido ──────────────────────────────────────── -->
    <q-page-container class="page-bg">
      <!-- key por sucursal: la mayoría de las páginas piden sus datos una sola
           vez en onMounted. Cuando AdministradorSistema cambia de sucursal en
           el selector del header, esto fuerza a Vue a destruir y volver a
           montar la página activa (vuelve a correr onMounted) en vez de
           necesitar un refresh manual del navegador. -->
      <router-view :key="auth.currentBranchId ?? 'todas'" />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* ── Sidebar ─────────────────────────────────────────────── */
.sb-drawer :deep(.q-drawer) {
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
}

.sb-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sb-drawer :deep(.q-drawer) {
  transition: width 0.15s ease;
}

.sb-collapse-toggle {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  border-top: 1px solid #e2e8f0;
}

.sb-drawer--collapsed .sb-collapse-toggle {
  justify-content: center;
}

.sb-collapse-btn {
  color: #94a3b8 !important;
}

.sb-collapse-btn:hover {
  color: #1e293b !important;
  background: #f8fafc !important;
}

.sb-nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
}

.sb-section-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.08em;
  padding: 16px 20px 6px;
}

.sb-nav {
  padding: 0 8px !important;
}

.sb-item {
  border-radius: 8px !important;
  margin-bottom: 2px;
  min-height: 40px !important;
  padding: 0 10px !important;
  color: #475569 !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  transition:
    background 0.12s,
    color 0.12s;
}

.sb-item :deep(.q-icon) {
  color: #94a3b8 !important;
  transition: color 0.12s;
}

.sb-item:hover {
  background: #f8fafc !important;
  color: #1e293b !important;
}

.sb-item:hover :deep(.q-icon) {
  color: #64748b !important;
}

.sb-item--active {
  background: #eff6ff !important;
  color: #025fe0 !important;
  font-weight: 600 !important;
  border-left: 3px solid #025fe0;
  padding-left: 7px !important;
}

.sb-item--active :deep(.q-icon) {
  color: #025fe0 !important;
}

.sb-drawer--collapsed .sb-item {
  justify-content: center;
  padding: 0 !important;
}

.sb-drawer--collapsed .sb-item--active {
  border-left: none;
  border-radius: 8px !important;
}

.sb-drawer--collapsed .sb-item :deep(.q-item__section--avatar) {
  min-width: 0;
  padding: 0;
}

/* ── Header ─────────────────────────────────────────────── */
.app-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05) !important;
  color: #1e293b !important;
}

.app-toolbar {
  min-height: 54px;
  padding: 0 20px;
}

.header-brand {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  flex: 0 0 auto;
  gap: 8px;
}

.header-brand-img {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: cover;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-branch {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.header-branch-select {
  width: 220px;
  font-size: 12.5px;
}

.header-branch-select :deep(.q-field__control) {
  min-height: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
}

.header-branch-select :deep(.q-field__marginal) {
  height: 32px;
}

.estado-turno--abierta {
  background: #dcfce7;
  color: #15803d;
}

.estado-turno--cerrada {
  background: #fee2e2;
  color: #b91c1c;
}

.estado-turno--corte {
  background: #fef3c7;
  color: #b45309;
}

.action-btn {
  color: #64748b !important;
  transition:
    color 0.12s,
    background 0.12s;
}

.action-btn:hover {
  color: #1e293b !important;
  background: #f1f5f9 !important;
}

.action-btn--logout:hover {
  color: #dc2626 !important;
  background: #fff1f2 !important;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  margin: 0 8px;
  flex-shrink: 0;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: default;
}

.header-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.header-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
}

.header-user-role {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.2;
}

/* ── Page container ──────────────────────────────────────── */
.page-bg {
  background: #f1f5f9;
}
</style>
