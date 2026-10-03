export interface RecetaItem {
  producto_id: string
  insumo_id: string
  cantidad: string
  insumo_nombre: string
  unidad_base_codigo: string
}

export interface RecetaItemUpdate {
  cantidad: string
}
