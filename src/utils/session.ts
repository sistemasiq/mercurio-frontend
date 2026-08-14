import type { StoredSession, User } from '@/types/auth'
import { decodeToken } from '@/utils/tokenUtils'

const SESSION_KEY = 'auth_session'
const VIEWING_BRANCH_KEY = 'auth_viewing_branch'

export const sessionStorage = {
  save(token: string, refreshToken: string, user: User): void {
    const payload = decodeToken(token)
    const session: StoredSession = {
      token,
      tokenExpiry: payload?.exp ? payload.exp * 1000 : 0,
      refreshToken,
      user,
    }
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
