export interface Insumo {
  id: string
  sucursal_id: string
  nombre: string
  descripcion: string | null
  unidad_base_id: string
  unidad_compra_id: string
  stock_actual: string
  stock_minimo: string
  costo_unitario: string | null
  proveedor_principal_id: string | null
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export interface InsumoCreate {
  sucursal_id: string
  nombre: string
  descripcion?: string | null
  unidad_base_id: string
  unidad_compra_id: string
  stock_inicial?: string
  stock_minimo?: string
  costo_unitario?: string | null
  proveedor_principal_id?: string | null
}

export interface InsumoRecetaInversa {
  insumo_id: string
  producto_id: string
  producto_nombre: string
  cantidad: string
}

export interface InsumoUpdate {
  nombre?: string
  descripcion?: string | null
  stock_minimo?: string
  costo_unitario?: string | null
  proveedor_principal_id?: string | null
  activo?: boolean
}
