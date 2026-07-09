import { defineStore } from 'pinia'
import { pulserasApi } from '@/api/pulserasApi'
import type { PulseraAdmin, PulseraCreate, PulseraUpdate } from '@/types/pulsera'

interface PulserasState {
  pulseras: PulseraAdmin[]
  loading: boolean
  error: string | null
}

export const usePulserasStore = defineStore('pulseras', {
  state: (): PulserasState => ({
    pulseras: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.pulseras = await pulserasApi.listarAdmin(sucursalId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar las pulseras'
      } finally {
        this.loading = false
      }
    },
    async crear(body: PulseraCreate) {
      const nueva = await pulserasApi.crear(body)
      this.pulseras.unshift(nueva)
      return nueva
    },
    async actualizar(id: string, body: PulseraUpdate) {
      const actualizada = await pulserasApi.actualizar(id, body)
      const idx = this.pulseras.findIndex((p) => p.id === id)
      if (idx !== -1) this.pulseras[idx] = actualizada
      return actualizada
    },
    async eliminar(id: string) {
      await pulserasApi.eliminar(id)
      const idx = this.pulseras.findIndex((p) => p.id === id)
      if (idx !== -1) this.pulseras[idx] = { ...this.pulseras[idx]!, activo: false }
    },
  },
})
