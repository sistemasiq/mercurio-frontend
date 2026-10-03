export interface Proveedor {
  id: string
  sucursal_id: string
  nombre: string
  contacto_nombre: string | null
  telefono: string | null
  email: string | null
  notas: string | null
  /** RFC: 12 caracteres (persona moral) o 13 (física). */
  rfc: string | null
  /** Días hábiles que tarda en entregar un pedido. */
  dias_entrega: number | null
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export interface ProveedorCreate {
  sucursal_id: string
  nombre: string
  contacto_nombre?: string | null
  telefono?: string | null
  email?: string | null
  notas?: string | null
  rfc?: string | null
  dias_entrega?: number | null
}

export interface ProveedorUpdate {
  nombre?: string
  contacto_nombre?: string | null
  telefono?: string | null
  email?: string | null
  notas?: string | null
  rfc?: string | null
  dias_entrega?: number | null
  activo?: boolean
}
