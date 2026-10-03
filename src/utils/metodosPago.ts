import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'

/**
 * Resuelve el id del método de pago de la sucursal a partir de la categoría
 * que emite el PaymentModal ('Efectivo', 'Tarjeta', ...). Se resuelve por
 * `tipo` contra el catálogo, nunca por coincidencia de `nombre`.
 */
export function resolverMetodoPagoId(
  categoriaSeleccionada: string,
  metodos: MetodosPago[],
): string {
  if (!metodos || metodos.length === 0) {
    throw new Error('Los métodos de pago no se han cargado correctamente desde el servidor.')
  }

  const categoria = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoriaSeleccionada)
  const metodo = metodos.find((m) => m.activo && m.tipo === categoria?.tipo)

  if (!metodo) {
    throw new Error(
      `No hay un método de pago activo de tipo "${categoriaSeleccionada}" configurado para esta sucursal.`,
    )
  }
  return metodo.id
}
