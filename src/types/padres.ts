export interface SucursalTutor {
  id: string
  nombre: string
}

export interface Tutor {
  id: string
  nombreCompleto: string
  telefono: string
  sucursal: SucursalTutor
}

export interface NinoActivo {
  id: string
  nombreCompleto: string
  edad: number
  estadoVisita: string
  horaEntrada: string
  horaSalidaEsperada: string
  'minutos Transcurridos': number
  'minutos Pagados': number
  pulsera: string
}

export interface PadreDashboardResponse {
  token: string
  token_type: string
  expires_in: number
  tutor: Tutor
  ninosActivos: NinoActivo[]
}

export interface PadresAuthState {
  token: string | null
  tokenType: string | null
  expiresIn: number | null
  tutor: Tutor | null
  ninosActivos: NinoActivo[]
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
