import { defineStore } from 'pinia'
import {
  actualizarConfiguracionLealtad,
  listarMovimientosLealtad,
  obtenerConfiguracionLealtad,
  obtenerSaldoLealtad,
} from '@/services/lealtadService'
import type { ApiError } from '@/types/auth'
import type {
  ConfiguracionLealtad,
  ConfiguracionLealtadInput,
  MovimientoPuntos,
  SaldoPuntos,
} from '@/types/lealtad'

interface LealtadState {
  configuracion: ConfiguracionLealtad | null
  saldo: SaldoPuntos | null
  movimientos: MovimientoPuntos[]
  loading: boolean
  error: string | null
}

export const useLealtadStore = defineStore('lealtad', {
  state: (): LealtadState => ({
    configuracion: null,
    saldo: null,
    movimientos: [],
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
          this.error = apiError.message ?? 'Error al cargar la configuración de lealtad'
        }
      } finally {
        this.loading = false
      }
    },
    async guardarConfiguracion(sucursalId: string, body: ConfiguracionLealtadInput) {
      this.configuracion = await actualizarConfiguracionLealtad(sucursalId, body)
      return this.configuracion
    },
    async cargarSaldo(sucursalId: string, celular: string) {
      this.saldo = await obtenerSaldoLealtad(sucursalId, celular)
      return this.saldo
    },
    async cargarMovimientos(sucursalId: string, celular: string, desde?: string, hasta?: string) {
      this.loading = true
      this.error = null
      try {
        this.movimientos = await listarMovimientosLealtad(sucursalId, celular, desde, hasta)
        this.saldo = await obtenerSaldoLealtad(sucursalId, celular)
      } catch (error: unknown) {
        this.error = (error as ApiError).message ?? 'Error al cargar el kardex de lealtad'
      } finally {
        this.loading = false
      }
    },
  },
})
