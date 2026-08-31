export type TipoMovimientoManual = 'E' | 'M'

export interface MovimientoManualCreate {
  tipo: TipoMovimientoManual
  cantidad: string
  notas?: string | null
}

export interface ConteoFisicoCreate {
  stock_contado: string
  notas?: string | null
}

export interface MovimientoInventario {
  id: string
  sucursal_id: string
  insumo_id: string
  insumo_nombre: string
  tipo: string
  cantidad: string
  stock_resultante: string
  motivo: string
  referencia_id: string | null
  notas: string | null
  costo_total: string | null
  creado: string
  creado_por: string | null
}

export interface CogsRenglon {
  insumo_id: string
  insumo_nombre: string
  cantidad_salida: string
  costo_total: string
}
