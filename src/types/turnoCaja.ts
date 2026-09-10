// ─────────────────────────────────────────────────────────────────────────────
// Módulo: Cierre de Caja — Tipos estrictos
// Espejo 1-a-1 del modelo del backend (FastAPI / PostgreSQL)
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Máquina de estados
// ---------------------------------------------------------------------------

/** Estados del ciclo de vida de un turno de caja. */
export type EstadoTurno =
  | 'SIN_TURNO' // no hay turno activo / listo para apertura de caja
  | 'OPERANDO' // turno activo, aún no se inicia el conteo
  | 'EN_CONTEO' // cajero registrando denominaciones
  | 'ESPERANDO_REVISION' // conteo enviado, esperando autenticación del admin
  | 'BALANCE_REVELADO' // admin autenticado, diferencias visibles
  | 'CERRADO' // cierre confirmado y persistido

export interface TurnoItem {
  id: string
  nombre: string
  horaInicio?: string
  horaFin?: string
}

export interface CajaItem {
  id: string
  codigo: string
  nombre: string
}

export interface AbrirTurnoPayload {
  fondoInicial: number
  terminal?: string
  observacionesApertura?: string
  turnoId?: string
  cajaId?: string
  /** Solo relevante para AdministradorSistema, que no tiene sucursal propia en el JWT. */
  sucursalId?: string
}

// ---------------------------------------------------------------------------
// Denominaciones de efectivo
// ---------------------------------------------------------------------------

export interface DenominacionBillete {
  value: 1000 | 500 | 200 | 100 | 50 | 20
  amount: number | null
}

export interface DenominacionMoneda {
  value: 20 | 10 | 5 | 2 | 1 | 0.5
  label: string
  amount: number | null
}

export interface DesgloseEfectivo {
  billetes: DenominacionBillete[]
  monedas: DenominacionMoneda[]
  /** Calculado reactivamente; no se serializa al backend */
  total: number
}

// ---------------------------------------------------------------------------
// Métodos de pago
// ---------------------------------------------------------------------------

/** Una fila del formulario de declaración de métodos. `metodo` es el nombre real
 *  del catálogo de la BD (metodos_pago.nombre) — no hay claves fijas. */
export interface FilaMetodoPago {
  /** ID local (generado en frontend) para key de v-for */
  id: number
  metodo: string
  monto: number | null
  /** 'sistema': detectado automáticamente por tener movimientos reales en el turno (nombre fijo).
   *  'manual': agregado por el cajero eligiendo del catálogo. */
  origen: 'sistema' | 'manual'
}

/** Movimiento real del turno — viene del backend al cargar el turno activo */
export interface MovimientoTurno {
  metodo: string
  /** Total de ventas procesadas por este método durante el turno */
  totalVentas: number
}

// ---------------------------------------------------------------------------
// Balance comparativo (admin)
// ---------------------------------------------------------------------------

export interface FilaBalance {
  metodo: string
  label: string
  /** Monto declarado por el cajero */
  declarado: number
  /** Monto esperado según el sistema */
  esperado: number
  /** declarado − esperado (positivo = sobrante, negativo = faltante) */
  diferencia: number
}

// ---------------------------------------------------------------------------
// Turno activo — respuesta del backend al montar la página
// ---------------------------------------------------------------------------

export interface TurnoActivoResponse {
  id: string
  sucursalId: string
  sucursalNombre: string
  cajeroId: string
  cajeroNombre: string
  terminal: string
  estado: EstadoTurno
  fondoInicial: number
  fechaApertura: string // ISO 8601
  totalVentas: number // solo visible para el admin post-BALANCE_REVELADO
  totalRetiros: number
  totalIngresos: number
  movimientos: MovimientoTurno[]
}

// ---------------------------------------------------------------------------
// Payload de conteo del cajero → POST /conteo
// ---------------------------------------------------------------------------

export interface ConteoPayload {
  turnoId: string
  desgloseEfectivo: {
    billetes: Array<{ denominacion: number; cantidad: number }>
    monedas: Array<{ denominacion: number; cantidad: number }>
    total: number
  }
  metodosPago: Array<{ metodo: string; monto: number }>
  totalDeclarado: number
}

// ---------------------------------------------------------------------------
// Payload de autenticación del administrador → POST /revision-admin
// ---------------------------------------------------------------------------

export interface RevisionAdminPayload {
  turnoId: string
  adminEmail: string
  adminPassword: string
}

export interface RevisionAdminResponse {
  autorizado: boolean
  adminNombre: string
  balancePorMetodo: FilaBalance[]
  totalEsperado: number
  totalDeclarado: number
  diferenciaNeta: number
}

// ---------------------------------------------------------------------------
// Payload de confirmación final → POST /confirmar
// ---------------------------------------------------------------------------

export type TipoCierre = 'NORMAL' | 'EXTRAORDINARIO'

export interface ConfirmarCierrePayload {
  turnoId: string
  observaciones: string
  tipoCierre?: TipoCierre
}

export interface ConfirmarCierreResponse {
  arqueoId: string
  estado: 'CERRADO'
  pdfUrl: string | null
  mensaje: string
}

// ---------------------------------------------------------------------------
// Retiros parciales (RN-RET)
// ---------------------------------------------------------------------------

/** Valores reales del enum conceptos_retiro en BD */
export type ConceptoRetiro =
  | 'Pago a proveedor'
  | 'Compra de insumos'
  | 'Depósito bancario'
  | 'Resguardo de efectivo'
  | 'Pago de servicios'
  | 'Gastos administrativos'
  | 'Gastos varios'
  | 'Devolución'

/** Valores reales del enum tipos_destinatario en BD */
export type TipoDestinatario = 'Proveedor' | 'Empleado' | 'Administrador' | 'Cliente'

export interface RetiroParcialPayload {
  turnoId: string
  concepto: ConceptoRetiro
  tipoDestinatario: TipoDestinatario
  monto: number
  observaciones?: string
}

export interface RetiroParcialResponse {
  id: string
  turnoId: string
  concepto: string
  tipoDestinatario: string
  monto: number
  observaciones: string | null
  creado: string
}

export interface IngresoEfectivoPayload {
  turnoId: string
  monto: number
}

export interface IngresoEfectivoResponse {
  id: string
  turnoId: string
  monto: number
  creado: string
}

// ---------------------------------------------------------------------------
// Historial de arqueos
// ---------------------------------------------------------------------------

export interface FiltrosHistorial {
  sucursalId?: string
  cajeroId?: string
  fechaDesde?: string // YYYY-MM-DD
  fechaHasta?: string
  page?: number
  pageSize?: number
}

export interface ArqueoResumen {
  id: string
  cajeroNombre: string
  terminal: string
  sucursalNombre: string
  fechaApertura: string
  fechaCierre: string
  fondoInicial: number
  totalDeclarado: number
  totalEsperado: number
  diferenciaNeta: number
  tieneObservaciones: boolean
  pdfUrl: string | null
  adminNombre?: string | null
}

export interface HistorialArqueosResponse {
  items: ArqueoResumen[]
  total: number
  page: number
  pageSize: number
}

export interface DetalleArqueo extends ArqueoResumen {
  desgloseEfectivo: {
    billetes: Array<{ denominacion: number; cantidad: number; subtotal: number }>
    monedas: Array<{ denominacion: number; cantidad: number; subtotal: number }>
    totalEfectivo: number
  }
  balancePorMetodo: FilaBalance[]
  observaciones: string
  adminNombre: string
}
