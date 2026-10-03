/** Tonos semánticos del diseño (badges, KPIs, avisos, toasts). */
export type UiTone = 'ok' | 'warn' | 'bad' | 'info' | 'off' | 'pink'

/** Tonos del ícono de encabezado en diálogos. */
export type DialogTone = 'blue' | 'red' | 'green' | 'amber' | 'pink'

export type StateVariant = 'loading' | 'empty' | 'no-results' | 'error'

export interface FilterChip<T extends string = string> {
  label: string
  value: T
}
