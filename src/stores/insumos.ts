import { defineStore } from 'pinia'
import {
  actualizarInsumo,
  crearInsumo,
  eliminarInsumo,
  listarEstimaciones,
  listarInsumos,
} from '@/services/insumoService'
import type { Insumo, InsumoCreate, InsumoRecetaInversa, InsumoUpdate } from '@/types/insumo'

interface InsumosState {
  insumos: Insumo[]
  estimaciones: InsumoRecetaInversa[]
  loading: boolean
  error: string | null
}

export const useInsumosStore = defineStore('insumos', {
  state: (): InsumosState => ({
    insumos: [],
    estimaciones: [],
    loading: false,
    error: null,
  }),
  getters: {
    recetasPorInsumo(state): Map<string, InsumoRecetaInversa[]> {
      const mapa = new Map<string, InsumoRecetaInversa[]>()
      for (const fila of state.estimaciones) {
        const lista = mapa.get(fila.insumo_id)
        if (lista) lista.push(fila)
        else mapa.set(fila.insumo_id, [fila])
      }
      return mapa
    },
  },
  actions: {
    async cargar(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.insumos = await listarInsumos(sucursalId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los insumos'
      } finally {
        this.loading = false
      }
    },
    async cargarEstimaciones(sucursalId: string) {
      try {
        this.estimaciones = await listarEstimaciones(sucursalId)
      } catch {
        this.estimaciones = []
      }
    },
    async crear(body: InsumoCreate) {
      const nuevo = await crearInsumo(body)
      this.insumos.unshift(nuevo)
      return nuevo
    },
    async actualizar(id: string, body: InsumoUpdate) {
      const actualizado = await actualizarInsumo(id, body)
      const idx = this.insumos.findIndex((i) => i.id === id)
      if (idx !== -1) this.insumos[idx] = actualizado
      return actualizado
    },
    async eliminar(id: string) {
      await eliminarInsumo(id)
      const idx = this.insumos.findIndex((i) => i.id === id)
      if (idx !== -1) this.insumos[idx] = { ...this.insumos[idx]!, activo: false }
    },
  },
})
