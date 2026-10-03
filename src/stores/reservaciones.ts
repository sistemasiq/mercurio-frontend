import { defineStore } from 'pinia'
import { mensajeDeError } from '@/utils/errorHandler'
import { reservacionesApi } from '@/api/reservacionesApi'
import type {
  Reservaciones,
  ReservacionesCreate,
  ReservacionesUpdate,
  Disponibilidad,
} from '@/types/reservaciones'
import type { ReservacionCompletaRequest } from '@/types/reservaciones_completa'

interface ReservacionesState {
  reservaciones: Reservaciones[]
  loading: boolean
  error: string | null
  disponibilidad: Disponibilidad | null
  disponibilidadLoading: boolean
}

export const useReservacionesStore = defineStore('reservaciones', {
  state: (): ReservacionesState => ({
    reservaciones: [],
    loading: false,
    error: null,
    disponibilidad: null,
    disponibilidadLoading: false,
  }),
  getters: {
    activas: (state) => state.reservaciones.filter((r) => r.activo),
  },
  actions: {
    async cargar(sucursal_id?: string) {
      this.loading = true
      this.error = null
      try {
        this.reservaciones = await reservacionesApi.listar(sucursal_id)
      } catch (error: unknown) {
        this.error = mensajeDeError(error, 'Error al cargar reservaciones')
      } finally {
        this.loading = false
      }
    },
    async crearReservacion(body: ReservacionesCreate) {
      const nueva = await reservacionesApi.crear(body)
      this.reservaciones.push(nueva)
      return nueva
    },
    /**
     * Alta atómica (QA #10): reservación + extras + productos + pagos en una
     * sola transacción vía POST /reservaciones/completa. Reemplaza al loop de
     * requests sueltos que usaba NuevaReservacionPage.vue.
     */
    async crearReservacionCompleta(body: ReservacionCompletaRequest) {
      const resultado = await reservacionesApi.crearCompleta(body)
      this.reservaciones.push(resultado.reservacion)
      return resultado
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
    /** Bloques de horario de la sucursal para una fecha, ocupados o libres
     * según las reservaciones no canceladas -- usado por el paso de fecha y
     * hora de NuevaReservacionPage.vue. */
    async cargarDisponibilidad(sucursalId: string, fecha: string) {
      this.disponibilidadLoading = true
      try {
        this.disponibilidad = await reservacionesApi.disponibilidad(sucursalId, fecha)
      } catch (error: unknown) {
        this.error = mensajeDeError(error, 'Error al cargar la disponibilidad')
        this.disponibilidad = null
      } finally {
        this.disponibilidadLoading = false
      }
    },
  },
})
