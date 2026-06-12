import type { UserRole } from '@/types/auth'

const ROLE_HOME_MAP: Record<UserRole, string> = {
  AdministradorSistema: 'sysadmin-dashboard',
  Administrador: 'home-admin',
  Cajero: 'home-cashier',
  Cocina: 'home-kitchen',
}

export function getRoleHome(roles: UserRole[]): string {
  return ROLE_HOME_MAP[roles[0]] ?? 'login'
}
