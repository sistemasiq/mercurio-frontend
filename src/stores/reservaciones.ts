import { defineStore } from 'pinia'
import { reservacionesApi } from '@/api/reservacionesApi'
import type { Reservaciones, ReservacionesCreate, ReservacionesUpdate } from '@/types/reservaciones'

interface ReservacionesState {
  reservaciones: Reservaciones[]
  loading: boolean
  error: string | null
}

export const useReservacionesStore = defineStore('reservaciones', {
  state: (): ReservacionesState => ({
    reservaciones: [],
    loading: false,
    error: null,
  }),
  getters: {
    activas: (state) => state.reservaciones.filter((r) => r.activo),
  },
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.reservaciones = await reservacionesApi.listar()
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar reservaciones'
      } finally {
        this.loading = false
      }
    },
    async crearReservacion(body: ReservacionesCreate) {
      const nueva = await reservacionesApi.crear(body)
      this.reservaciones.push(nueva)
      return nueva
    },
    async actualizarReservacion(id: string, body: ReservacionesUpdate) {
      const actualizada = await reservacionesApi.actualizar(id, body)
      const idx = this.reservaciones.findIndex((r) => r.id === id)
      if (idx !== -1) this.reservaciones[idx] = actualizada
      return actualizada
    },
    async eliminarReservacion(id: string) {
      await reservacionesApi.eliminar(id)
      this.reservaciones = this.reservaciones.filter((r) => r.id !== id)
    },
  },
})
