import { defineStore } from 'pinia'
import { extrasApi } from '@/api/extrasApi'
import type { Extras, ExtrasUpdate, ExtrasCreate } from '@/types/extras.ts'

interface ExtrasState {
  extras: Extras[]
  loading: boolean
  error: string | null
}

export const useExtrasStore = defineStore('extras', {
  state: (): ExtrasState => ({
    extras: [],
    loading: false,
    error: null,
  }),
  getters: {
    activos: (state) => state.extras.filter((e) => e.activo),
  },
  actions: {
    async cargar(sucursal_id?: string) {
      this.loading = true
      this.error = null
      try {
        this.extras = await extrasApi.listar(sucursal_id)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los extras'
      } finally {
        this.loading = false
      }
    },
    async createExtras(body: ExtrasCreate) {
      const nuevo = await extrasApi.crear(body)
      this.extras.push(nuevo)
      return nuevo
    },
    async updateExtras(id: string, body: ExtrasUpdate) {
      const actualizado = await extrasApi.actualizar(id, body)
      const idx = this.extras.findIndex((e) => e.id === id)
      if (idx !== -1) this.extras[idx] = actualizado
      return actualizado
    },
    async deleteExtras(id: string) {
      await extrasApi.eliminar(id)
      this.extras = this.extras.filter((e) => e.id !== id)
    },
  },
})
