import { defineStore } from 'pinia'
import {
  eliminarRecetaItem,
  listarReceta,
  upsertRecetaItem,
} from '@/services/recetaProductoService'
import type { RecetaItem, RecetaItemUpdate } from '@/types/recetaProducto'

interface RecetaProductoState {
  items: RecetaItem[]
  loading: boolean
  error: string | null
}

export const useRecetaProductoStore = defineStore('recetaProducto', {
  state: (): RecetaProductoState => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar(productoId: string) {
      this.loading = true
      this.error = null
      try {
        this.items = await listarReceta(productoId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar la receta'
      } finally {
        this.loading = false
      }
    },
    async upsert(productoId: string, insumoId: string, body: RecetaItemUpdate) {
      const item = await upsertRecetaItem(productoId, insumoId, body)
      const idx = this.items.findIndex((i) => i.insumo_id === insumoId)
      if (idx !== -1) this.items[idx] = item
      else this.items.push(item)
      return item
    },
    async eliminar(productoId: string, insumoId: string) {
      await eliminarRecetaItem(productoId, insumoId)
      this.items = this.items.filter((i) => i.insumo_id !== insumoId)
    },
  },
})
