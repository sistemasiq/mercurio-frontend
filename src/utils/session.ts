import type { StoredSession, User } from '@/types/auth'
import { tokenMemory } from '@/utils/tokenMemory'

const SESSION_KEY = 'auth_session'
const VIEWING_BRANCH_KEY = 'auth_viewing_branch'

// C3 (cierra lo parcial de B8/QA #32): el access token ya no se guarda aquí
// -- vive solo en memoria (ver utils/tokenMemory.ts) y se pierde al recargar
// la página. El refresh token tampoco: vive en la cookie HttpOnly que puso
// el backend (ver api/axiosClient.ts, authApi.refresh()). Este storage ya
// no puede entregar ningún token a un XSS; solo conserva el usuario (dato
// no sensible) para poder mostrar la sesión cacheada mientras
// `authStore.restoreSession()` confirma con el backend vía esa cookie.
export const sessionStorage = {
  save(user: User): void {
    const session: StoredSession = { user }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw) as StoredSession
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(VIEWING_BRANCH_KEY)
    tokenMemory.clear()
  },
}

// Sucursal en la que "se paró" AdministradorSistema para ver catálogos y
// listados como los vería esa sucursal, sin reautenticarse -- el token en sí
// nunca cambia. Vive en su propia clave (no dentro de StoredSession) porque
// es una preferencia de navegación, no parte de la sesión; se limpia junto
// con ella al cerrar sesión para que no quede pegada a la siguiente cuenta
// que inicie sesión en este navegador.
export const viewingBranch = {
  load(): string | null {
    return localStorage.getItem(VIEWING_BRANCH_KEY)
  },
  save(sucursalId: string | null): void {
    if (sucursalId) {
      localStorage.setItem(VIEWING_BRANCH_KEY, sucursalId)
    } else {
      localStorage.removeItem(VIEWING_BRANCH_KEY)
    }
  },
}
