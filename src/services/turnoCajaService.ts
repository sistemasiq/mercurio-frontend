import { turnoCajaApi } from '@/api/turnoCajaApi'
import { resolveErrorMessage } from '@/utils/errorHandler'
import { downloadBlob } from '@/utils/downloadBlob'
import type { ApiError } from '@/types/auth'
import type {
  TurnoActivoResponse,
  ConteoPayload,
  RevisionAdminPayload,
  RevisionAdminResponse,
  ConfirmarCierrePayload,
  ConfirmarCierreResponse,
  FiltrosHistorial,
  HistorialArqueosResponse,
  DetalleArqueo,
} from '@/types/turnoCaja'

// ─────────────────────────────────────────────────────────────────────────────
// Errores de dominio — el store los captura y muestra al usuario
// ─────────────────────────────────────────────────────────────────────────────

export class TurnoNoEncontradoError extends Error {
  constructor() {
    super('No se encontró un turno activo para esta sesión.')
    this.name = 'TurnoNoEncontradoError'
  }
}

export class TransicionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'TransicionInvalidaError'
  }
}

export class CredencialesAdminInvalidasError extends Error {
  constructor() {
    super('Credenciales de administrador incorrectas. Verifica usuario y contraseña.')
    this.name = 'CredencialesAdminInvalidasError'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper interno — convierte cualquier error a mensaje de usuario
// ─────────────────────────────────────────────────────────────────────────────

function toMensajeError(err: unknown): string {
  // Errores de dominio propios: mensaje ya es legible
  if (err instanceof Error && err.name !== 'Error') return err.message

  // Errores HTTP del axiosClient
  return resolveErrorMessage(err as ApiError)
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicio — objeto literal (patrón del proyecto)
// ─────────────────────────────────────────────────────────────────────────────

export const turnoCajaService = {
  /**
   * Carga el turno activo del cajero.
   * Lanza TurnoNoEncontradoError si el backend responde 404.
   */
  async cargarTurnoActivo(): Promise<TurnoActivoResponse> {
    try {
      return await turnoCajaApi.obtenerActivo()
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.statusCode === 404) throw new TurnoNoEncontradoError()
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Inicia el proceso de conteo.
   * Transición: OPERANDO → EN_CONTEO
   */
  async iniciarConteo(turnoId: string): Promise<TurnoActivoResponse> {
    try {
      return await turnoCajaApi.iniciarConteo(turnoId)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.statusCode === 409)
        throw new TransicionInvalidaError('El turno ya tiene un conteo en progreso.')
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Envía el conteo declarado por el cajero.
   * Transición: EN_CONTEO → ESPERANDO_REVISION
   */
  async enviarConteo(payload: ConteoPayload): Promise<TurnoActivoResponse> {
    try {
      return await turnoCajaApi.enviarConteo(payload)
    } catch (err) {
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Valida las credenciales del administrador y revela el balance.
   * Transición: ESPERANDO_REVISION → BALANCE_REVELADO
   * Lanza CredencialesAdminInvalidasError en caso de 401/403 del backend.
   */
  async autenticarAdmin(payload: RevisionAdminPayload): Promise<RevisionAdminResponse> {
    try {
      return await turnoCajaApi.autenticarRevisionAdmin(payload)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.statusCode === 401 || apiErr.statusCode === 403) {
        throw new CredencialesAdminInvalidasError()
      }
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Confirma el cierre del turno y genera el PDF de arqueo.
   * Transición: BALANCE_REVELADO → CERRADO
   */
  async confirmarCierre(payload: ConfirmarCierrePayload): Promise<ConfirmarCierreResponse> {
    try {
      return await turnoCajaApi.confirmarCierre(payload)
    } catch (err) {
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Cancela el conteo en curso y regresa a OPERANDO.
   */
  async cancelarConteo(turnoId: string): Promise<TurnoActivoResponse> {
    try {
      return await turnoCajaApi.cancelarConteo(turnoId)
    } catch (err) {
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Carga el historial de arqueos con filtros opcionales.
   */
  async listarHistorial(filtros: FiltrosHistorial = {}): Promise<HistorialArqueosResponse> {
    try {
      return await turnoCajaApi.listarHistorial(filtros)
    } catch (err) {
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Carga el detalle completo de un arqueo para el modal de auditoría.
   */
  async obtenerDetalle(id: string): Promise<DetalleArqueo> {
    try {
      return await turnoCajaApi.obtenerDetalleArqueo(id)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.statusCode === 404)
        throw new Error('El arqueo solicitado no existe o fue eliminado.', { cause: err })
      throw new Error(toMensajeError(err), { cause: err })
    }
  },

  /**
   * Descarga el PDF de comprobante de un arqueo.
   * Usa downloadBlob para la descarga silenciosa sin abrir nueva pestaña.
   */
  async descargarPdfArqueo(id: string, nombreArchivo = `arqueo_${id}.pdf`): Promise<void> {
    try {
      const blob = await turnoCajaApi.descargarPdf(id)
      downloadBlob(blob, nombreArchivo)
    } catch (err) {
      throw new Error(toMensajeError(err), { cause: err })
    }
  },
}
