import type { InsumoRecetaInversa } from '@/types/insumo'

export interface RindeDesglose {
  producto: string
  unidades: number
}

export interface RindeResultado {
  min: number
  producto: string
  desglose: RindeDesglose[]
}

/**
 * Rinde de un insumo: por cada producto que lo consume, cuántas unidades cubre
 * el stock actual (floor(stock / cantidad de receta)). Devuelve el desglado y el
 * mínimo (el producto que primero se queda sin este insumo).
 */
export function calcularRindePorInsumo(
  stockActual: number,
  recetas: InsumoRecetaInversa[] | undefined,
): RindeResultado | null {
  if (!recetas || recetas.length === 0) return null
  const desglose = recetas
    .map((r) => ({
      producto: r.producto_nombre,
      unidades: Number(r.cantidad) > 0 ? Math.floor(stockActual / Number(r.cantidad)) : 0,
    }))
    .sort((a, b) => a.unidades - b.unidades)
  return { min: desglose[0]!.unidades, producto: desglose[0]!.producto, desglose }
}

/**
 * Rinde por producto A/B: cuántas unidades se pueden preparar ahora, limitado
 * por el insumo más escaso de su receta. `estimaciones` es la receta inversa
 * de todos los insumos de la sucursal (GET /api/insumos/estimaciones).
 */
export function calcularRindePorProducto(
  insumos: ReadonlyArray<{ id: string; stock_actual: string }>,
  estimaciones: readonly InsumoRecetaInversa[],
): Map<string, number> {
  const stockPorInsumo = new Map(insumos.map((i) => [i.id, Number(i.stock_actual)]))
  const porProducto = new Map<string, number>()
  for (const r of estimaciones) {
    const stock = stockPorInsumo.get(r.insumo_id) ?? 0
    const rinde = Number(r.cantidad) > 0 ? Math.floor(stock / Number(r.cantidad)) : 0
    const actual = porProducto.get(r.producto_id)
    porProducto.set(r.producto_id, actual === undefined ? rinde : Math.min(actual, rinde))
  }
  return porProducto
}
