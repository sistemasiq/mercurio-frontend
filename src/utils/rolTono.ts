import type { UiTone } from '@/types/ui'

/**
 * Tono del badge de rol según el diseño: administradores en azul, cajeros en
 * rosa y el resto en gris. Los roles son un catálogo dinámico, así que se
 * reconocen por nombre y cualquier otro cae en el tono neutro.
 */
export function rolTono(rol: string | null | undefined): UiTone {
  const n = (rol ?? '').toLowerCase().replace(/\s+/g, '')
  if (n.startsWith('administrador')) return 'info'
  if (n === 'cajero') return 'pink'
  return 'off'
}
