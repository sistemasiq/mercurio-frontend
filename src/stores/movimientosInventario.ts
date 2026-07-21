import { defineStore } from 'pinia'
import {
  listarMovimientosPorInsumo,
  registrarMovimiento,
} from '@/services/movimientoInventarioService'
import type { MovimientoInventario, MovimientoManualCreate } from '@/types/movimientoInventario'

interface MovimientosInventarioState {
  items: MovimientoInventario[]
  loading: boolean
  error: string | null
}

export const useMovimientosInventarioStore = defineStore('movimientosInventario', {
  state: (): MovimientosInventarioState => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargarPorInsumo(insumoId: string, desde?: string, hasta?: string) {
      this.loading = true
      this.error = null
      try {
        this.items = await listarMovimientosPorInsumo(insumoId, desde, hasta)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los movimientos'
      } finally {
        this.loading = false
      }
    },
    async registrar(insumoId: string, body: MovimientoManualCreate) {
      const movimiento = await registrarMovimiento(insumoId, body)
      this.items.unshift(movimiento)
      return movimiento
    },
  },
})
