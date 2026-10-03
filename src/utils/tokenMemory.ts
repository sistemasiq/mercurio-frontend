// QA #32 / C3: el access token ya no se persiste en ningún storage del
// navegador (localStorage es legible por cualquier XSS). Vive solo en una
// variable de módulo, en memoria de la pestaña, y se pierde al recargar --
// `authStore.restoreSession()` lo repone con un refresh vía la cookie
// HttpOnly `refresh_token`. El interceptor de axios y los dos sockets
// (comandas, estancias) lo leen de aquí.
let accessToken: string | null = null

export const tokenMemory = {
  get(): string | null {
    return accessToken
  },
  set(token: string): void {
    accessToken = token
  },
  clear(): void {
    accessToken = null
  },
}
