import type { UserRole } from '@/types/auth'

const ROLE_HOME_MAP: Record<UserRole, string> = {
  AdministradorSistema: 'dashboard',
  Administrador: 'home-admin',
  Cajero: 'home-cashier',
  Cocina: 'home-kitchen',
}

export function getRoleHome(role: UserRole | null | undefined): string {
  return (role && ROLE_HOME_MAP[role]) || 'dashboard'
}
