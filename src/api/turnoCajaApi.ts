import { apiClient } from '@/api/axiosClient'
import type {
  TurnoActivoResponse,
  AbrirTurnoPayload,
  TurnoItem,
  CajaItem,
  ConteoPayload,
  RevisionAdminPayload,
  RevisionAdminResponse,
  ConfirmarCierrePayload,
  ConfirmarCierreResponse,
  FiltrosHistorial,
  HistorialArqueosResponse,
  DetalleArqueo,
  RetiroParcialPayload,
  RetiroParcialResponse,
} from '@/types/turnoCaja'

// ─────────────────────────────────────────────────────────────────────────────
// Prefijo de la ruta del módulo en el backend
// ─────────────────────────────────────────────────────────────────────────────
const BASE = '/turnos-caja'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers snake_case → camelCase
// (el backend devuelve snake_case; el frontend usa camelCase)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTurnoActivo(raw: any): TurnoActivoResponse {
  return {
    id: raw.id,
    sucursalId: raw.sucursal_id,
    sucursalNombre: raw.sucursal_nombre,
    cajeroId: raw.cajero_id,
    cajeroNombre: raw.cajero_nombre,
    terminal: raw.terminal,
    estado: raw.estado,
    fondoInicial: raw.fondo_inicial,
    fechaApertura: raw.fecha_apertura,
    totalVentas: raw.total_ventas ?? 0,
    totalRetiros: raw.total_retiros ?? 0,
    movimientos: (raw.movimientos ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => ({ metodo: m.metodo, totalVentas: m.total_ventas }),
    ),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRevisionAdmin(raw: any): RevisionAdminResponse {
  return {
    autorizado: raw.autorizado,
    adminNombre: raw.admin_nombre,
    totalEsperado: raw.total_esperado,
    totalDeclarado: raw.total_declarado,
    diferenciaNeta: raw.diferencia_neta,
    balancePorMetodo: (raw.balance_por_metodo ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => ({
        metodo: f.metodo,
        label: f.label,
        declarado: f.declarado,
        esperado: f.esperado,
        diferencia: f.diferencia,
      }),
    ),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArqueoResumen(raw: any) {
  return {
    id: raw.id,
    cajeroNombre: raw.cajero_nombre,
    terminal: raw.terminal,
    sucursalNombre: raw.sucursal_nombre,
    fechaApertura: raw.fecha_apertura,
    fechaCierre: raw.fecha_cierre,
    fondoInicial: raw.fondo_inicial,
    totalDeclarado: raw.total_declarado,
    totalEsperado: raw.total_esperado,
    diferenciaNeta: raw.diferencia_neta,
    tieneObservaciones: raw.tiene_observaciones ?? false,
    pdfUrl: raw.pdf_url ?? null,
    adminNombre: raw.admin_nombre ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API object — patrón del proyecto: objeto literal con métodos async
// ─────────────────────────────────────────────────────────────────────────────

export const turnoCajaApi = {
  /**
   * GET /turnos-caja/turnos
   * Lista los turnos de la BD.
   */
  async obtenerTurnos(): Promise<TurnoItem[]> {
    const { data } = await apiClient.get(`${BASE}/turnos`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      horaInicio: t.hora_inicio,
      horaFin: t.hora_fin,
    }))
  },

  /**
   * GET /turnos-caja/cajas
   * Lista las cajas de la BD, filtradas a la sucursal del usuario si se especifica.
   */
  async obtenerCajas(sucursalId?: string | null): Promise<CajaItem[]> {
    const { data } = await apiClient.get(`${BASE}/cajas`, {
      params: sucursalId ? { sucursal_id: sucursalId } : undefined,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((c: any) => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
    }))
  },

  /**
   * POST /turnos-caja/abrir
   * Transición SIN_TURNO → OPERANDO.
   * Abre un nuevo turno de caja con el fondo inicial especificado.
   */
  async abrirTurno(payload: AbrirTurnoPayload): Promise<TurnoActivoResponse> {
    const body = {
      fondo_inicial: payload.fondoInicial,
      terminal: payload.terminal ?? 'CAJA 01',
      observaciones_apertura: payload.observacionesApertura,
      id_turno: payload.idTurno,
      sucursal_id: payload.sucursalId,
    }
    const { data } = await apiClient.post(`${BASE}/abrir`, body)
    return mapTurnoActivo(data)
  },

  /**
   * GET /turnos-caja/activo
   * Devuelve el turno activo del cajero autenticado (determinado por el JWT).
   * 404 si no existe turno activo.
   */
  async obtenerActivo(): Promise<TurnoActivoResponse> {
    const { data } = await apiClient.get(`${BASE}/activo`)
    return mapTurnoActivo(data)
  },

  /**
   * POST /turnos-caja/iniciar-conteo
   * Transición OPERANDO → EN_CONTEO.
   * Cuerpo: { turno_id }
   */
  async iniciarConteo(turnoId: string): Promise<TurnoActivoResponse> {
    const { data } = await apiClient.post(`${BASE}/iniciar-conteo`, { turno_id: turnoId })
    return mapTurnoActivo(data)
  },

  /**
   * POST /turnos-caja/conteo
   * Transición EN_CONTEO → ESPERANDO_REVISION.
   * Envía el desglose completo declarado por el cajero.
   */
  async enviarConteo(payload: ConteoPayload): Promise<TurnoActivoResponse> {
    const body = {
      turno_id: payload.turnoId,
      desglose_efectivo: {
        billetes: payload.desgloseEfectivo.billetes.map((b) => ({
          denominacion: b.denominacion,
          cantidad: b.cantidad,
        })),
        monedas: payload.desgloseEfectivo.monedas.map((m) => ({
          denominacion: m.denominacion,
          cantidad: m.cantidad,
        })),
        total: payload.desgloseEfectivo.total,
      },
      metodos_pago: payload.metodosPago.map((m) => ({
        metodo: m.metodo,
        monto: m.monto,
      })),
      total_declarado: payload.totalDeclarado,
    }
    const { data } = await apiClient.post(`${BASE}/conteo`, body)
    return mapTurnoActivo(data)
  },

  /**
   * POST /turnos-caja/revision-admin
   * Transición ESPERANDO_REVISION → BALANCE_REVELADO.
   * Valida credenciales del administrador y devuelve el balance comparativo.
   */
  async autenticarRevisionAdmin(payload: RevisionAdminPayload): Promise<RevisionAdminResponse> {
    const body = {
      turno_id: payload.turnoId,
      admin_email: payload.adminEmail,
      admin_password: payload.adminPassword,
    }
    const { data } = await apiClient.post(`${BASE}/revision-admin`, body)
    return mapRevisionAdmin(data)
  },

  async validarPinCajero(turnoId: string, pin: string): Promise<{ ok: boolean; mensaje: string }> {
    const { data } = await apiClient.post(`${BASE}/validar-pin-cajero`, { turno_id: turnoId, pin })
    return data
  },

  async validarPinAdmin(
    turnoId: string,
    adminEmail: string,
    pin: string,
  ): Promise<{ ok: boolean; mensaje: string }> {
    const { data } = await apiClient.post(`${BASE}/validar-pin-admin`, {
      turno_id: turnoId,
      admin_email: adminEmail,
      pin,
    })
    return data
  },

  /**
   * POST /turnos-caja/confirmar
   * Transición BALANCE_REVELADO → CERRADO.
   * Confirma el cierre y genera el PDF de comprobante.
   */
  async confirmarCierre(payload: ConfirmarCierrePayload): Promise<ConfirmarCierreResponse> {
    const { data } = await apiClient.post(`${BASE}/confirmar`, {
      turno_id: payload.turnoId,
      observaciones: payload.observaciones,
      tipo_cierre: payload.tipoCierre ?? 'NORMAL',
    })
    return {
      arqueoId: data.arqueo_id,
      estado: data.estado,
      pdfUrl: data.pdf_url ?? null,
      mensaje: data.mensaje ?? 'Cierre confirmado.',
    }
  },

  /**
   * POST /turnos-caja/cancelar
   * Revierte a OPERANDO desde EN_CONTEO o ESPERANDO_REVISION.
   */
  async cancelarConteo(turnoId: string): Promise<TurnoActivoResponse> {
    const { data } = await apiClient.post(`${BASE}/cancelar`, { turno_id: turnoId })
    return mapTurnoActivo(data)
  },

  /**
   * POST /turnos-caja/retiro
   * Registra un retiro parcial sobre el turno activo (solo en estado OPERANDO).
   */
  async registrarRetiro(payload: RetiroParcialPayload): Promise<RetiroParcialResponse> {
    const { data } = await apiClient.post(`${BASE}/retiro`, {
      id_apertura_caja: payload.turnoId,
      concepto: payload.concepto,
      tipo_destinatario: payload.tipoDestinatario,
      monto: payload.monto,
      observaciones: payload.observaciones,
    })
    return {
      id: data.id,
      turnoId: data.id_apertura_caja,
      concepto: data.concepto,
      tipoDestinatario: data.tipo_destinatario,
      monto: data.monto,
      observaciones: data.observaciones ?? null,
      creado: data.creado,
    }
  },

  /**
   * GET /turnos-caja/historial
   * Lista paginada de arqueos con filtros opcionales.
   * Solo accesible para roles con permiso `caja:ver_historial`.
   */
  async listarHistorial(filtros: FiltrosHistorial = {}): Promise<HistorialArqueosResponse> {
    const params: Record<string, string | number> = {}
    if (filtros.sucursalId) params.sucursal_id = filtros.sucursalId
    if (filtros.cajeroId) params.cajero_id = filtros.cajeroId
    if (filtros.fechaDesde) params.fecha_desde = filtros.fechaDesde
    if (filtros.fechaHasta) params.fecha_hasta = filtros.fechaHasta
    if (filtros.page) params.page = filtros.page
    if (filtros.pageSize) params.page_size = filtros.pageSize ?? 20

    const { data } = await apiClient.get(`${BASE}/historial`, { params })
    return {
      items: (data.items ?? []).map(mapArqueoResumen),
      total: data.total,
      page: data.page,
      pageSize: data.page_size,
    }
  },

  /**
   * GET /turnos-caja/historial/:id
   * Detalle completo de un arqueo (incluye desglose de efectivo).
   */
  async obtenerDetalleArqueo(id: string): Promise<DetalleArqueo> {
    const { data } = await apiClient.get(`${BASE}/historial/${id}`)
    return {
      ...mapArqueoResumen(data),
      desgloseEfectivo: {
        billetes: (data.desglose_efectivo?.billetes ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => ({
            denominacion: b.denominacion,
            cantidad: b.cantidad,
            subtotal: b.denominacion * b.cantidad,
          }),
        ),
        monedas: (data.desglose_efectivo?.monedas ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) => ({
            denominacion: m.denominacion,
            cantidad: m.cantidad,
            subtotal: m.denominacion * m.cantidad,
          }),
        ),
        totalEfectivo: data.desglose_efectivo?.total ?? 0,
      },
      balancePorMetodo: (data.balance_por_metodo ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => ({
          metodo: f.metodo,
          label: f.label,
          declarado: f.declarado,
          esperado: f.esperado,
          diferencia: f.diferencia,
        }),
      ),
      observaciones: data.observaciones ?? '',
      adminNombre: data.admin_nombre ?? '',
    }
  },

  /**
   * GET /turnos-caja/historial/:id/pdf
   * Devuelve el PDF del arqueo como Blob.
   */
  async descargarPdf(id: string): Promise<Blob> {
    const { data } = await apiClient.get(`${BASE}/historial/${id}/pdf`, {
      responseType: 'blob',
    })
    return data as Blob
  },
}
