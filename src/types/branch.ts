export interface Branch {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  clave: string | null
  administradorId: string | null
  administradorName: string | null
  isActive: boolean
  creado: string | null
  creadoPor: string | null
  creadorName: string | null
  modificado: string | null
  modificadoPor: string | null
  modificadorName: string | null
}

export interface CreateBranchPayload {
  nombre: string
  direccion?: string | null
  telefono?: string | null
  correo?: string | null
  clave?: string | null
  administrador_id?: string | null
}

export interface UpdateBranchPayload {
  nombre: string
  direccion?: string | null
  telefono?: string | null
  correo?: string | null
  clave?: string | null
  administrador_id?: string | null
}
