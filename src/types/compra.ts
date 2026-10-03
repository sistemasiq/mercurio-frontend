export type EstadoCompra = 'P' | 'PARCIAL' | 'R' | 'C'

export interface DetalleCompraItem {
  insumo_id: string
  unidad_medida_id?: string | null
  presentacion_id?: string | null
  cantidad: string
  costo_unitario: string
}

export interface DetalleCompraOut {
  id: string
  insumo_id: string
  insumo_nombre: string
  unidad_medida_id: string | null
  unidad_medida_codigo: string | null
  presentacion_id: string | null
  presentacion_nombre: string | null
  cantidad: string
  cantidad_recibida: string
  costo_unitario: string
  subtotal: string
}

export interface CompraCreate {
  sucursal_id: string
  proveedor_id: string
  notas?: string | null
  /** Monto de IVA de la orden; el total sigue siendo la suma de las líneas. */
  iva?: string
  detalles: DetalleCompraItem[]
}

export interface CompraEditar {
  proveedor_id: string
  notas?: string | null
  /** Omitido conserva el IVA ya capturado. */
  iva?: string
  detalles: DetalleCompraItem[]
}

export interface LineaRecepcion {
  detalle_id: string
  cantidad: string
}

export interface RecibirCompraRequest {
  lineas?: LineaRecepcion[]
}

export interface Compra {
  id: string
  sucursal_id: string
  proveedor_id: string
  proveedor_nombre: string
  estado: EstadoCompra
  fecha_pedido: string
  fecha_recepcion: string | null
  total: string
  iva: string
  /** Folio de OC secuencial por sucursal (OC-0001). Null en compras previas. */
  folio: string | null
  notas: string | null
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
  detalles: DetalleCompraOut[]
}
