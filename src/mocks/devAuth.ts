/**
 * @file devAuth.ts
 * @description Inyecta una sesión falsa en el auth store para desarrollo local.
 *
 * ⚠️  SOLO PARA DESARROLLO — nunca importar desde código de producción.
 *
 * Uso:
 *   import { inyectarSesionDev } from '@/mocks/devAuth'
 *   await inyectarSesionDev()
 */

import type { User } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { sessionStorage as appSession } from '@/utils/session'

/** Usuario mock con todos los permisos. */
export const MOCK_USER: User = {
  id: 'dev-user-001',
  name: 'Dev Admin (mock)',
  email: 'dev@mercurio.local',
  roles: ['Administrador'],
  branchId: 'suc-001',
  branchName: 'Sucursal Centro (DEV)',
  permissions: [
    'pos:acceder',
    'restaurante:gestionar_cocina',
    'estancias:ver_activos',
    'pulseras:listar',
    'reservaciones:listar',
    'reservaciones:crear',
    'reservaciones:gestionar_pagos',
    'extras:crear',
    'paquetes:crear',
    'tipos_evento:crear',
    'metodos_pago:crear',
    'inventario:gestionar_productos',
    'sucursales:listar',
    'sucursales:ver',
    'sucursales:crear',
    'sucursales:editar',
    'usuarios:listar',
    'usuarios:crear',
    'usuarios:editar',
    'reportes:dashboard',
    'caja:ver_historial',
  ],
}

/**
 * Inyecta directamente un token JWT fake y el usuario mock en el auth store,
 * saltándose completamente el login y el backend.
 *
 * El token tiene exp +8h — suficiente para una sesión de diseño.
 * NO funcionará contra ningún endpoint autenticado real.
 */
export async function inyectarSesionDev(): Promise<void> {
  if (!import.meta.env.DEV) return

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 8 * 60 * 60

  // JWT sintéticamente válido para que isTokenExpired() lo acepte
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payload = btoa(
    JSON.stringify({
      sub: MOCK_USER.id,
      email: MOCK_USER.email,
      role: MOCK_USER.roles[0],
      branch_id: MOCK_USER.branchId,
      permissions: MOCK_USER.permissions,
      iat: now,
      exp,
    }),
  ).replace(/=/g, '')
  const fakeToken = `${header}.${payload}.dev-sig-not-valid`

  // Persiste en session para que los guards no redirijan
  appSession.save(fakeToken, 'dev-refresh-not-valid', MOCK_USER)

  // Inyecta en el store usando el helper DEV expuesto en el return
  const auth = useAuthStore()
  const store = auth as ReturnType<typeof useAuthStore> & {
    _setDevSession?: (user: User, token: string) => void
  }
  store._setDevSession?.(MOCK_USER, fakeToken)
}
