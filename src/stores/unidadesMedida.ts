import { defineStore } from 'pinia'
import { mensajeDeError } from '@/utils/errorHandler'
import { listarUnidadesMedida } from '@/services/unidadMedidaService'
import type { UnidadMedida } from '@/types/unidadMedida'

interface UnidadesMedidaState {
  unidades: UnidadMedida[]
  loading: boolean
  error: string | null
}

export const useUnidadesMedidaStore = defineStore('unidadesMedida', {
  state: (): UnidadesMedidaState => ({
    unidades: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.unidades = await listarUnidadesMedida()
      } catch (error: unknown) {
        this.error = mensajeDeError(error, 'Error al cargar las unidades de medida')
      } finally {
        this.loading = false
      }
    },
  },
})
