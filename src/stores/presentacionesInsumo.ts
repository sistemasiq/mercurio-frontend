import { defineStore } from 'pinia'
import {
  actualizarPresentacionInsumo,
  crearPresentacionInsumo,
  eliminarPresentacionInsumo,
  listarPresentacionesPorInsumo,
} from '@/services/presentacionInsumoService'
import type {
  PresentacionInsumo,
  PresentacionInsumoCreate,
  PresentacionInsumoUpdate,
} from '@/types/presentacionInsumo'

interface PresentacionesInsumoState {
  items: PresentacionInsumo[]
  loading: boolean
  error: string | null
}

export const usePresentacionesInsumoStore = defineStore('presentacionesInsumo', {
  state: (): PresentacionesInsumoState => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargarPorInsumo(insumoId: string) {
      this.loading = true
      this.error = null
      try {
        this.items = await listarPresentacionesPorInsumo(insumoId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar las presentaciones'
      } finally {
        this.loading = false
      }
    },
    async crear(insumoId: string, body: PresentacionInsumoCreate) {
      const nueva = await crearPresentacionInsumo(insumoId, body)
      this.items.unshift(nueva)
      return nueva
    },
    async actualizar(insumoId: string, presentacionId: string, body: PresentacionInsumoUpdate) {
      const actualizada = await actualizarPresentacionInsumo(insumoId, presentacionId, body)
      const idx = this.items.findIndex((p) => p.id === presentacionId)
      if (idx !== -1) this.items[idx] = actualizada
      return actualizada
    },
    async eliminar(insumoId: string, presentacionId: string) {
      await eliminarPresentacionInsumo(insumoId, presentacionId)
      const idx = this.items.findIndex((p) => p.id === presentacionId)
      if (idx !== -1) this.items[idx] = { ...this.items[idx]!, activo: false }
    },
  },
})
