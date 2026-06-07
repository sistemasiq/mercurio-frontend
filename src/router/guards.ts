import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from) => {
    const auth = useAuthStore()

    const requiresAuth = to.meta.requiresAuth === true
    const isPublicOnly = to.meta.publicOnly === true

    if (requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (isPublicOnly && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
  })
}
