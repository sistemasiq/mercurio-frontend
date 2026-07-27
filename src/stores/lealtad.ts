import { defineStore } from 'pinia'
import {
  actualizarConfiguracionLealtad,
  obtenerConfiguracionLealtad,
} from '@/services/lealtadService'
import type { ApiError } from '@/types/auth'
import type { ConfiguracionLealtad, ConfiguracionLealtadInput } from '@/types/lealtad'

interface LealtadState {
  configuracion: ConfiguracionLealtad | null
  loading: boolean
  error: string | null
}

export const useLealtadStore = defineStore('lealtad', {
  state: (): LealtadState => ({
    configuracion: null,
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
  },
})
