import type { App } from 'vue'
import type { Router } from 'vue-router'
import { Quasar, Notify, Loading, Dialog } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { setupRouterGuards } from '@/router/guards'

export function setupPlugins(app: App, router: Router): void {
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(Quasar, {
    plugins: { Notify, Loading, Dialog },
    config: {
      notify: { position: 'top', timeout: 4000 },
    },
  })

  const auth = useAuthStore()
  auth.restoreSession()
  setupRouterGuards(router)

  window.addEventListener('auth:unauthorized', () => {
    auth.logout().then(() => router.push({ name: 'login' }))
  })
}
