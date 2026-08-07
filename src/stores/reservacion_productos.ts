import { defineStore } from 'pinia'
import { reservacionProductosApi } from '@/api/reservacionProductosApi'
import type {
  Reservacion_productos,
  Reservacion_productos_create,
  Reservacion_productos_update,
} from '@/types/reservacion_productos'

interface ReservacionProductosState {
  reservacion_productos: Reservacion_productos[]
  loading: boolean
  error: string | null
}

export const useReservacionProductosStore = defineStore('reservacion_productos', {
  state: (): ReservacionProductosState => ({
    reservacion_productos: [],
    loading: false,
    error: null,
  }),
  getters: {},
  actions: {
    async fetchReservacionProductos(reservacion_id: string) {
      this.loading = true
      this.error = null
      try {
        this.reservacion_productos =
          await reservacionProductosApi.listarPorReservacion(reservacion_id)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar productos de la reservación'
      } finally {
        this.loading = false
      }
    },
    async crearReservacionProducto(body: Reservacion_productos_create) {
      const nuevo = await reservacionProductosApi.crear(body)
      this.reservacion_productos.push(nuevo)
      return nuevo
    },
    async actualizarReservacionProducto(id: string, body: Reservacion_productos_update) {
      const actualizado = await reservacionProductosApi.actualizar(id, body)
      const idx = this.reservacion_productos.findIndex((p) => p.id === id)
      if (idx !== -1) this.reservacion_productos[idx] = actualizado
      return actualizado
    },
    async eliminarReservacionProducto(id: string) {
      await reservacionProductosApi.eliminar(id)
      this.reservacion_productos = this.reservacion_productos.filter((p) => p.id !== id)
    },
  },
})
