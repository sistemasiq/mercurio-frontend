export interface Branch {
  id: string
  nombre: string
  direccion: string | null
  ciudad: string | null
  estado: string | null
  codigoPostal: string | null
  zonaHoraria: string
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
  ciudad?: string | null
  estado?: string | null
  codigo_postal?: string | null
  zona_horaria?: string
  telefono?: string | null
  correo?: string | null
  clave?: string | null
  administrador_id?: string | null
}

export interface IndicadoresSucursal {
  ventas: number
  ninosAtendidos: number
  eventos: number
  cajasAbiertas: number
}

export interface UpdateBranchPayload {
  nombre: string
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
  codigo_postal?: string | null
  zona_horaria?: string
  telefono?: string | null
  correo?: string | null
  clave?: string | null
  administrador_id?: string | null
}
