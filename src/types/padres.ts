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
  minutosTranscurridos: number
  minutosPagados: number
  pulsera: string
  // Solo si la visita sigue activa: excedente estimado en este momento.
  cargoExtra?: number
  // Solo si la visita ya terminó: lo que costó la estancia y los puntos de
  // lealtad otorgados (por el registro completo, no por niño).
  importe?: number | null
  puntosGanados?: number | null
}

export interface PadreDashboardResponse {
  token: string
  token_type: string
  expires_in: number
  tutor: Tutor
  ninosActivos: NinoActivo[]
}

// QA #31: respuesta del polling autenticado (GET /padres/ninos-activos con
// el token de la sesión), sin volver a mandar el código.
export interface PadreNinosActivosResponse {
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
