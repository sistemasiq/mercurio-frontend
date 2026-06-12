export interface Branch {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  isActive: boolean
}

export interface CreateBranchPayload {
  nombre: string
  direccion?: string | null
  telefono?: string | null
}

export interface UpdateBranchPayload {
  nombre: string
  direccion?: string | null
  telefono?: string | null
}
