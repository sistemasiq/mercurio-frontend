import type { StoredSession, User } from '@/types/auth'

const SESSION_KEY = 'auth_session'

export const sessionStorage = {
  save(token: string, expiresIn: number, user: User): void {
    const session: StoredSession = {
      token,
      tokenExpiry: Date.now() + expiresIn * 1000,
      user,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null

      const session: StoredSession = JSON.parse(raw)
      if (Date.now() > session.tokenExpiry) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return session
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}
