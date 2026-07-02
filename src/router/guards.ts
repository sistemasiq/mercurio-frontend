import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  })
}
