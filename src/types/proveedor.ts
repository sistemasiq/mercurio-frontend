export interface Proveedor {
  id: string
  sucursal_id: string
  nombre: string
  contacto_nombre: string | null
  telefono: string | null
  email: string | null
  notas: string | null
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
}

export interface ProveedorUpdate {
  nombre?: string
  contacto_nombre?: string | null
  telefono?: string | null
  email?: string | null
  notas?: string | null
  activo?: boolean
}
