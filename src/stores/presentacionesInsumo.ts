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
  /** Insumo al que pertenece `items` (ultima carga aplicada). */
  insumoIdCargado: string | null
  loading: boolean
  error: string | null
}

// Id de la ultima solicitud de carga; permite descartar respuestas obsoletas.
let ultimaSolicitud = 0

export const usePresentacionesInsumoStore = defineStore('presentacionesInsumo', {
  state: (): PresentacionesInsumoState => ({
    items: [],
    insumoIdCargado: null,
    loading: false,
    error: null,
  }),
  actions: {
    async cargarPorInsumo(insumoId: string) {
      const solicitud = ++ultimaSolicitud
      this.loading = true
      this.error = null
      if (this.insumoIdCargado !== insumoId) {
        this.items = []
        this.insumoIdCargado = insumoId
      }
      try {
        const items = await listarPresentacionesPorInsumo(insumoId)
        if (solicitud !== ultimaSolicitud) return
        this.items = items
      } catch (error: unknown) {
        if (solicitud !== ultimaSolicitud) return
        this.items = []
        this.error = (error as Error).message ?? 'Error al cargar las presentaciones'
      } finally {
        if (solicitud === ultimaSolicitud) this.loading = false
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
