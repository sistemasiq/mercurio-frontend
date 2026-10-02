<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useSucursalesStore } from '@/stores/sucursales'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const $q = useQuasar()
const auth = useAuthStore()
const turno = useTurnoCajaStore()
const sucursalesStore = useSucursalesStore()
const alertasInventario = useAlertasInventarioStore()

// Debajo de este ancho el sidebar pasa a overlay y se abre desde el Topbar.
const DRAWER_BREAKPOINT = 1024
const drawerOpen = ref(true)
const isOverlay = computed(() => $q.screen.width < DRAWER_BREAKPOINT)

const INTERVALO_ALERTAS_MS = 3 * 60 * 1000
let alertasIntervalId: ReturnType<typeof setInterval> | undefined

const refrescarAlertasInventario = (avisar = true) => {
  if (auth.hasPermission('inventario:ver') && auth.currentBranchId) {
    void alertasInventario.refrescar(auth.currentBranchId, avisar)
  }
}

onMounted(() => {
  // El estado de caja del sidebar solo aplica al Cajero (RN-CIE-001).
  if (auth.hasRole('Cajero')) {
    turno.cargarTurnoActivo()
  }
  if (auth.isSistema) {
    sucursalesStore.cargar()
  }
  refrescarAlertasInventario(false)
  alertasIntervalId = setInterval(() => refrescarAlertasInventario(true), INTERVALO_ALERTAS_MS)
})

onBeforeUnmount(() => {
  if (alertasIntervalId) clearInterval(alertasIntervalId)
})

watch(
  () => auth.currentBranchId,
  () => {
    alertasInventario.limpiar()
    refrescarAlertasInventario(false)
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
