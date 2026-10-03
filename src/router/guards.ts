import type { Router } from 'vue-router'
import { Notify } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useAccessControlStore } from '@/stores/accessControl'
import { useTurnoCajaStore } from '@/stores/turnoCaja'

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

    if (to.meta.requiresTurno) {
      const turno = useTurnoCajaStore()
      // `asegurarTurnoCargado` nunca lanza: distingue "turno cargado" (resultado.ok)
      // de "no se pudo cargar" (red/5xx/403), que no debe expulsar a nadie (#13, #17).
      const resultado = await turno.asegurarTurnoCargado()
      if (resultado.ok && !turno.estaOperando) {
        if (auth.hasPermission('pos:acceder')) {
          return { name: 'pos-cierre' }
        }
        Notify.create({
          type: 'warning',
          message: 'Se requiere un turno de caja abierto para continuar.',
          position: 'top-right',
        })
        return false
      }
      // resultado.ok === false: la carga falló por red/5xx/403. Se deja pasar;
      // la página debe mostrar turno.error en vez de expulsar sin motivo.
    }

    // El Administrador de sucursal no vende en mostrador (pos-caja), pero sí abre y
    // cierra su propio turno en pos-cierre: lo necesita para cobrar reservaciones y
    // eventos (#13). AdministradorSistema puede ambas.
    const esAdminDeSucursal = auth.hasRole('Administrador') && !auth.hasRole('AdministradorSistema')
    if (esAdminDeSucursal && to.name === 'pos-caja') {
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

    if (to.name === 'estancias-registro-infantes') {
      const turno = useTurnoCajaStore()
      if (!turno.estaOperando) {
        return { name: 'pos-cierre' }
      }
    }
  })
}
