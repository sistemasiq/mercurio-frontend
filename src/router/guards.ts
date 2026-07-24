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

    if (to.name === 'estancias-registro-infantes') {
      const accessControlStore = useAccessControlStore()
      if (!accessControlStore.lastUpdated || accessControlStore.pulserasLibres < 2) {
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
