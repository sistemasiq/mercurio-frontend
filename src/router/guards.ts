import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccessControlStore } from '@/stores/accessControl'

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      const refreshed = await auth.tryRefresh()
      if (!refreshed) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }

    if (to.meta.publicOnly && auth.isAuthenticated) {
      return { name: 'home' }
    }

    if (to.meta.permissions?.length && auth.currentUser) {
      const allowed = to.meta.permissions.some((p) => auth.hasPermission(p))
      if (!allowed) {
        return { name: 'home' }
      }
    }

    // El Administrador de sucursal no opera la caja directamente (apertura/cierre/venta):
    // su única vista de este módulo es el historial de arqueos. AdministradorSistema sí puede.
    const esAdminDeSucursal = auth.hasRole('Administrador') && !auth.hasRole('AdministradorSistema')
    if (esAdminDeSucursal && (to.name === 'pos-cierre' || to.name === 'pos-caja')) {
      return { name: 'pos-historial-arqueos' }
    }

    if (to.name === 'estancias-registro-infantes') {
      const accessControlStore = useAccessControlStore()
      // El Cajero no tiene el permiso "pulseras:listar" — nunca puede saber el
      // conteo real, así que este guard no aplica para él (quedaría en 0 para
      // siempre y lo bloquearía sin importar el inventario real). Solo se
      // exige el mínimo de 2 libres a roles que sí pueden verlo.
      if (
        accessControlStore.puedeVerPulseras &&
        (!accessControlStore.lastUpdated || accessControlStore.pulserasLibres < 2)
      ) {
        return { name: 'estancias-control-acceso' }
      }
    }

    if (to.name === 'estancias-checkout') {
      const accessControlStore = useAccessControlStore()
      if (!accessControlStore.checkoutChild) {
        return { name: 'estancias-control-acceso' }
      }
    }
  })
}
