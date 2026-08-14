import AuditFields from '@/types/shared'

// E = Efectivo | T = Tarjeta (crédito/débito/wallets) | C = Cupón | L = Lealtad
// O = Otro (método sin botón dedicado hoy en el modal de pago)
export type TipoMetodoPago = 'E' | 'T' | 'C' | 'L' | 'O'

export interface MetodosPago extends AuditFields {
  nombre: string
  descripcion: string | null
  tipo: TipoMetodoPago
  // Resuelto por el backend contra la sucursal del usuario autenticado --
  // no es un campo libre del catálogo global.
  activo: boolean
}

// Catálogo global fijo (5 filas) -- solo AdministradorSistema edita
// nombre/descripción. El `tipo` no es editable, es la identidad de la fila.
export interface MetodosPagoUpdate {
  nombre?: string
  descripcion?: string
}

export interface MetodosPagoActivacion {
  activo: boolean
}

// Categorías fijas que muestra el modal de pago (icono, color, teclado
// especial). El `id` real del método de pago usado se resuelve por `tipo`
// contra el catálogo de la sucursal, nunca por coincidencia de `nombre` --
// cada sucursal puede nombrar su método como quiera.
export interface CategoriaMetodoPago {
  nombre: string
  valor: string
  tipo: Exclude<TipoMetodoPago, 'O'>
  icon: string
  color: string
}

export const CATEGORIAS_METODO_PAGO: CategoriaMetodoPago[] = [
  { nombre: 'Efectivo', valor: 'Efectivo', tipo: 'E', icon: 'payments', color: 'green' },
  { nombre: 'Crédito/Débito', valor: 'Tarjeta', tipo: 'T', icon: 'credit_card', color: 'blue' },
  { nombre: 'Cupones', valor: 'Cupones', tipo: 'C', icon: 'redeem', color: 'orange' },
  { nombre: 'Lealtad', valor: 'Lealtad', tipo: 'L', icon: 'loyalty', color: 'purple' },
]
