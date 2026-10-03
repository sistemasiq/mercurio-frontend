// Antes duplicado letra por letra en ReservacionesPage.vue y CalendarioPage.vue.
export const ESTADOS_RESERVACION = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

const COLORES: Record<string, string> = {
  pendiente: 'orange',
  confirmada: 'primary',
  en_curso: 'purple',
  completada: 'positive',
  cancelada: 'grey-5',
}

const LABELS: Record<string, string> = Object.fromEntries(
  ESTADOS_RESERVACION.map((e) => [e.value, e.label]),
)

export function estadoColorReservacion(estado: string): string {
  return COLORES[estado] ?? 'grey'
}

// Tono del badge del diseño (StatusBadge) por estado de reservación.
const TONOS: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'off' | 'pink'> = {
  pendiente: 'warn',
  confirmada: 'ok',
  en_curso: 'info',
  completada: 'off',
  cancelada: 'bad',
}

export function estadoTonoReservacion(
  estado: string,
): 'ok' | 'warn' | 'bad' | 'info' | 'off' | 'pink' {
  return TONOS[estado] ?? 'off'
}

export function estadoLabelReservacion(estado: string): string {
  return LABELS[estado] ?? estado
}
