import { defineStore } from 'pinia'
import { cancelarCompra, crearCompra, listarCompras, recibirCompra } from '@/services/compraService'
import type { Compra, CompraCreate } from '@/types/compra'

export interface LineaPrefill {
  insumo_id: string
  unidad_medida_id: string
  cantidad: number
  costo_unitario: number
}

export interface BorradorCompraPrefill {
  proveedor_id: string
  lineas: LineaPrefill[]
}

interface ComprasState {
  compras: Compra[]
  loading: boolean
  error: string | null
  /** Borrador de compra armado desde el Reporte de Stock; ComprasPage lo consume
   * al montar y lo limpia. */
  borradorPrefill: BorradorCompraPrefill | null
}

export const useComprasStore = defineStore('compras', {
  state: (): ComprasState => ({
    compras: [],
    loading: false,
    error: null,
    borradorPrefill: null,
  }),
  actions: {
    setBorradorPrefill(borrador: BorradorCompraPrefill) {
      this.borradorPrefill = borrador
    },
    consumirBorradorPrefill(): BorradorCompraPrefill | null {
      const b = this.borradorPrefill
      this.borradorPrefill = null
      return b
    },
    async cargar(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.compras = await listarCompras(sucursalId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar las compras'
      } finally {
        this.loading = false
      }
    },
    async crear(body: CompraCreate) {
      const nueva = await crearCompra(body)
      this.compras.unshift(nueva)
      return nueva
    },
    async recibir(compraId: string) {
      const actualizada = await recibirCompra(compraId)
      const idx = this.compras.findIndex((c) => c.id === compraId)
      if (idx !== -1) this.compras[idx] = actualizada
      return actualizada
    },
    async cancelar(compraId: string) {
      const actualizada = await cancelarCompra(compraId)
      const idx = this.compras.findIndex((c) => c.id === compraId)
      if (idx !== -1) this.compras[idx] = actualizada
      return actualizada
    },
  },
})
