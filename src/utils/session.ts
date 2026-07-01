import type { StoredSession, User } from '@/types/auth'
import { decodeToken } from '@/utils/tokenUtils'

const SESSION_KEY = 'auth_session'

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
  },
}
