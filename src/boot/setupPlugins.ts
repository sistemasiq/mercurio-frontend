import type { App } from 'vue'
import type { Router } from 'vue-router'
import { Quasar, Notify, Loading, Dialog } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { setupRouterGuards } from '@/router/guards'
import { inactivityTimer } from '@/utils/inactivityTimer'

const INACTIVITY_MS = 15 * 60 * 1000

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

  inactivityTimer.init(() => {
    auth.logout().then(() => {
      Notify.create({
        type: 'warning',
        message: 'Sesión cerrada por inactividad.',
        icon: 'timer_off',
      })
      router.push({ name: 'login' })
    })
  }, INACTIVITY_MS)

  if (auth.restoreSession()) {
    inactivityTimer.start()
  }

  setupRouterGuards(router)

  window.addEventListener('auth:refreshed', (e: Event) => {
    const detail = (e as CustomEvent<{ token: string }>).detail
    auth.updateToken(detail.token)
  })

  let handlingUnauthorized = false
  window.addEventListener('auth:unauthorized', () => {
    if (handlingUnauthorized) return
    handlingUnauthorized = true
    auth
      .logout()
      .then(() => {
        Notify.create({
          type: 'warning',
          message: 'Tu sesión expiró. Por favor inicia sesión nuevamente.',
          icon: 'lock',
        })
        router.push({ name: 'login' })
      })
      .finally(() => {
        handlingUnauthorized = false
      })
  })
}
