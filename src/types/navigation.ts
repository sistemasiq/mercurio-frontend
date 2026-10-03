export type NavBadgeTone = 'warn' | 'bad'

export interface NavItem {
  label: string
  icon: string
  routeName: string
  permission?: string
}

export interface NavGroup {
  /** null = grupo raíz sin encabezado (Inicio). */
  label: string | null
  items: NavItem[]
}

export interface NavBadge {
  count: number
  tone: NavBadgeTone
}
