<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSucursalesStore } from '@/stores/sucursales'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { useShellIndicadoresStore } from '@/stores/shellIndicadores'
import { useReservacionesStore } from '@/stores/reservaciones'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const $q = useQuasar()
const route = useRoute()
const auth = useAuthStore()
const turno = useTurnoCajaStore()
const sucursalesStore = useSucursalesStore()
const alertasInventario = useAlertasInventarioStore()
const shellIndicadores = useShellIndicadoresStore()
const reservacionesStore = useReservacionesStore()

// Debajo de este ancho el sidebar pasa a overlay y se abre desde el Topbar.
const DRAWER_BREAKPOINT = 1024
const drawerOpen = ref(window.innerWidth >= DRAWER_BREAKPOINT)
const isOverlay = computed(() => $q.screen.width < DRAWER_BREAKPOINT)

// En modo overlay, cerrar el menú al navegar.
watch(
  () => route.fullPath,
  () => {
    if (isOverlay.value) drawerOpen.value = false
  },
)

const INTERVALO_ALERTAS_MS = 3 * 60 * 1000
let alertasIntervalId: ReturnType<typeof setInterval> | undefined

const refrescarAlertasInventario = (avisar = true) => {
  if (auth.hasPermission('inventario:ver') && auth.currentBranchId) {
    void alertasInventario.refrescar(auth.currentBranchId, avisar)
  }
}

// Contadores del Sidebar (Cocina y Control de Acceso): polling cada 30 s,
// independiente de qué pantalla esté montada. Cada uno solo se pide si el
// usuario tiene el permiso del módulo.
const INTERVALO_INDICADORES_MS = 30 * 1000
let indicadoresIntervalId: ReturnType<typeof setInterval> | undefined
const abortIndicadoresComandas = new AbortController()
let notifIntervalId: ReturnType<typeof setInterval> | undefined

const refrescarIndicadoresSidebar = () => {
  if (auth.hasPermission('restaurante:gestionar_cocina')) {
    void shellIndicadores.refrescarComandas(abortIndicadoresComandas.signal)
  }
  if (auth.hasPermission('estancias:ver_activos') && auth.currentBranchId) {
    void shellIndicadores.refrescarNinosActivos(auth.currentBranchId)
  }
}

// Centro de notificaciones (campana): necesita el catálogo de reservaciones
// disponible fuera de Inicio/Calendario para listar "eventos de hoy por
// iniciar" desde cualquier pantalla.
const refrescarReservacionesParaNotificaciones = () => {
  if (auth.hasPermission('reservaciones:listar') && auth.currentBranchId) {
    void reservacionesStore.cargar(auth.currentBranchId)
  }
}

onMounted(() => {
  // Hipótesis de roles (Bug QA #13): el turno aplica a cualquier usuario que
  // pueda cobrar, no solo al Cajero — un Administrador con
  // "reservaciones:gestionar_pagos" también necesita saber si hay turno
  // abierto antes de registrar un pago. Se usa el memo del store
  // (`asegurarTurnoCargado`) en vez de `cargarTurnoActivo` directo para
  // compartir la misma carga con el guard de ruta.
  if (auth.hasPermission('pos:acceder') || auth.hasPermission('reservaciones:gestionar_pagos')) {
    void turno.asegurarTurnoCargado()
  }
  if (auth.isSistema) {
    sucursalesStore.cargar()
  }
  refrescarAlertasInventario(false)
  alertasIntervalId = setInterval(() => refrescarAlertasInventario(true), INTERVALO_ALERTAS_MS)

  refrescarIndicadoresSidebar()
  indicadoresIntervalId = setInterval(refrescarIndicadoresSidebar, INTERVALO_INDICADORES_MS)

  refrescarReservacionesParaNotificaciones()
  notifIntervalId = setInterval(refrescarReservacionesParaNotificaciones, INTERVALO_ALERTAS_MS)
})

onBeforeUnmount(() => {
  if (alertasIntervalId) clearInterval(alertasIntervalId)
  if (indicadoresIntervalId) clearInterval(indicadoresIntervalId)
  if (notifIntervalId) clearInterval(notifIntervalId)
  abortIndicadoresComandas.abort()
})

watch(
  () => auth.currentBranchId,
  () => {
    alertasInventario.limpiar()
    refrescarAlertasInventario(false)
    shellIndicadores.limpiar()
    refrescarIndicadoresSidebar()
    refrescarReservacionesParaNotificaciones()
  },
)
</script>

<template>
  <q-layout view="lHh LpR fFf">
    <q-drawer
      v-model="drawerOpen"
      side="left"
      :width="248"
      :breakpoint="DRAWER_BREAKPOINT"
      show-if-above
      bordered
      class="app-drawer"
    >
      <AppSidebar />
    </q-drawer>

    <q-header class="app-header">
      <AppTopbar :show-menu-button="isOverlay" @toggle-menu="drawerOpen = !drawerOpen" />
    </q-header>

    <q-page-container class="page-bg">
      <!-- key por sucursal: la mayoría de las páginas piden sus datos una sola
           vez en onMounted. Cuando AdministradorSistema cambia de sucursal en
           el selector del sidebar, esto fuerza a Vue a destruir y volver a
           montar la página activa (vuelve a correr onMounted) en vez de
           necesitar un refresh manual del navegador. -->
      <router-view :key="auth.currentBranchId ?? 'todas'" />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.app-drawer :deep(.q-drawer) {
  background: #fff;
}

.app-drawer :deep(.q-drawer--bordered) {
  border-right-color: var(--border-color);
}

.app-header {
  background: #fff;
  color: var(--text-primary);
  box-shadow: none;
}

.page-bg {
  background: var(--bg-main);
}
</style>

<style>
@media print {
  .q-drawer,
  .q-header,
  .q-footer {
    display: none !important;
  }

  body,
  .q-layout,
  .q-page-container {
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    height: auto !important;
  }

  .q-page {
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
