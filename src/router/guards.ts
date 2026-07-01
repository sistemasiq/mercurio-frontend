import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getRoleHome } from '@/utils/roleHome'

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
      return { name: getRoleHome(auth.currentUser?.roles ?? []) }
    }

    if (to.meta.roles?.length && auth.currentUser) {
      const allowed = to.meta.roles.some((r) => auth.hasRole(r))
      if (!allowed) {
        return { name: getRoleHome(auth.currentUser.roles) }
      }
    }
  })
}
