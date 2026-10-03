import { defineStore } from 'pinia'
import {
  actualizarConfiguracionLealtad,
  listarMovimientosLealtad,
  obtenerConfiguracionLealtad,
  obtenerReporteLealtad,
  obtenerSaldoLealtad,
} from '@/services/lealtadService'
import { mensajeDeError } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import type {
  ConfiguracionLealtad,
  ConfiguracionLealtadInput,
  MovimientoPuntos,
  ReporteLealtad,
  SaldoPuntos,
} from '@/types/lealtad'

interface LealtadState {
  configuracion: ConfiguracionLealtad | null
  saldo: SaldoPuntos | null
  movimientos: MovimientoPuntos[]
  reporte: ReporteLealtad | null
  loading: boolean
  error: string | null
}

export const useLealtadStore = defineStore('lealtad', {
  state: (): LealtadState => ({
    configuracion: null,
    saldo: null,
    movimientos: [],
    reporte: null,
    loading: false,
    error: null,
  }),
  actions: {
    async cargarConfiguracion(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.configuracion = await obtenerConfiguracionLealtad(sucursalId)
      } catch (error: unknown) {
        const apiError = error as ApiError
        if (apiError.statusCode === 404) {
          this.configuracion = null
        } else {
          this.error = mensajeDeError(apiError, 'Error al cargar la configuración de lealtad')
        }
      } finally {
        this.loading = false
      }
    },
    async guardarConfiguracion(sucursalId: string, body: ConfiguracionLealtadInput) {
      this.configuracion = await actualizarConfiguracionLealtad(sucursalId, body)
      return this.configuracion
    },
    /**
     * Consulta el saldo de un celular y lo devuelve sin escribirlo en
     * `this.saldo`: ese estado pertenece al kardex y una consulta tardía desde
     * el modal de pago no debe pisar (ni dejar) el saldo de otro cliente.
     */
    async cargarSaldo(sucursalId: string, celular: string): Promise<SaldoPuntos> {
      return obtenerSaldoLealtad(sucursalId, celular)
    },
    async cargarMovimientos(sucursalId: string, celular: string, desde?: string, hasta?: string) {
      this.loading = true
      this.error = null
      try {
        this.movimientos = await listarMovimientosLealtad(sucursalId, celular, desde, hasta)
        this.saldo = await obtenerSaldoLealtad(sucursalId, celular)
      } catch (error: unknown) {
        this.error = mensajeDeError(error, 'Error al cargar el kardex de lealtad')
      } finally {
        this.loading = false
      }
    },
    async cargarReporte(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.reporte = await obtenerReporteLealtad(sucursalId)
      } catch (error: unknown) {
        this.error = mensajeDeError(error, 'Error al cargar el reporte de lealtad')
      } finally {
        this.loading = false
      }
    },
  },
})
