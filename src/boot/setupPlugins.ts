import type { App } from 'vue'
import type { Router } from 'vue-router'
import { Quasar, Notify, Loading, Dialog } from 'quasar'
import langEs from 'quasar/lang/es'
import iconSet from 'quasar/icon-set/material-icons-outlined'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import '@quasar/extras/material-symbols-outlined/material-symbols-outlined.css'
import 'quasar/src/css/index.sass'
import '@/css/app.scss'
import { createPinia } from 'pinia'
import { configurarRefresh } from '@/api/axiosClient'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/auth'
import { setupRouterGuards } from '@/router/guards'
import { resetPlugin } from '@/utils/piniaReset'
import { inactivityTimer } from '@/utils/inactivityTimer'

const INACTIVITY_MS = 15 * 60 * 1000

export function setupPlugins(app: App, router: Router): void {
  configurarRefresh((refreshToken) => authService.refresh(refreshToken))
  const pinia = createPinia()
  pinia.use(resetPlugin)

  app.use(pinia)
  app.use(router)
  app.use(Quasar, {
    plugins: { Notify, Loading, Dialog },
    iconSet,
    lang: { ...langEs, table: { ...langEs.table, recordsPerPage: 'Registros por página:' } },
    config: {
      // Toast del diseño (07b Sistema): el estilo vive en .wk-toast (app.scss).
      notify: {
        position: 'top-right',
        timeout: 4000,
        classes: 'wk-toast',
        multiLine: false,
        // Quasar concatena estas acciones con las de cada llamada: no repetir
        // el botón de cerrar al pasar `actions`.
        actions: [{ icon: 'close', round: true, dense: true, flat: true, 'aria-label': 'Cerrar' }],
      },
    },
  })

  // Íconos de cada tono según el catálogo de notificaciones del diseño.
  Notify.registerType('positive', { color: 'positive', icon: 'check_circle' })
  Notify.registerType('negative', { color: 'negative', icon: 'error' })
  Notify.registerType('warning', { color: 'warning', icon: 'warning' })
  Notify.registerType('info', { color: 'info', icon: 'info' })

  const auth = useAuthStore()

  inactivityTimer.init(() => {
    auth.logout().then(() => {
      try {
        window.sessionStorage.setItem('mercury:logout-motivo', 'inactividad')
      } catch {
        // sin sessionStorage solo se pierde el aviso
      }
      // Recarga completa (no router.push): descarta toda la memoria de la
      // app, incluidos estados que ningún store sabe resetear.
      window.location.assign(router.resolve({ name: 'login' }).href)
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
