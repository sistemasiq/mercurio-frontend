import { defineStore } from 'pinia'
import { pagosReservacionApi } from '@/api/pagos_reservacion.ts'
import type {
  Pagos_reservacion,
  Pagos_reservacion_update,
  Pagos_reservacion_create,
} from '@/types/pagos_reservacion.ts'

interface Pagos_reservacionState {
  pagos_reservacion: Pagos_reservacion[]
  loading: boolean
  error: string | null
}

export const usePagosReservacionesStore = defineStore('pagos_reservacion', {
  state: (): Pagos_reservacionState => ({
    pagos_reservacion: [],
    loading: false,
    error: null,
  }),
  getters: {},
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.pagos_reservacion = await pagosReservacionApi.listar()
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar pagos'
      } finally {
        this.loading = false
      }
    },
    async fetchPagosReservacion(reservacion_id: string) {
      this.loading = true
      this.error = null
      try {
        this.pagos_reservacion = await pagosReservacionApi.listarPorReservacion(reservacion_id)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar pagos'
      } finally {
        this.loading = false
      }
    },
    async crearPagosReservacion(body: Pagos_reservacion_create) {
      const nuevo = await pagosReservacionApi.crear(body)
      this.pagos_reservacion.push(nuevo)
      return nuevo
    },
    async actualizarPagosReservacion(id: string, body: Pagos_reservacion_update) {
      const actualizado = await pagosReservacionApi.actualizar(id, body)
      const idx = this.pagos_reservacion.findIndex((pago) => pago.id === id)
      if (idx !== -1) this.pagos_reservacion[idx] = actualizado
      return actualizado
    },
    async borrarPagosReservacion(id: string) {
      await pagosReservacionApi.eliminar(id)
      this.pagos_reservacion = this.pagos_reservacion.filter((pago) => pago.id !== id)
    },
  },
})
