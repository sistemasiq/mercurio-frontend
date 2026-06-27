import { defineStore } from 'pinia'
import { reservacionExtrasApi } from '@/api/reservacion_extras'
import type { Reservacion_extras, Reservacion_extras_create, Reservacion_extras_update } from '@/types/reservacion_extras'

interface ReservacionExtrasState {
    reservacion_extras: Reservacion_extras[]
    loading: boolean
    error: string | null
}

export const useReservacionExtrasStore = defineStore('reservacion_extras', {
    state: (): ReservacionExtrasState => ({
        reservacion_extras: [],
        loading: false,
        error: null,
    }),
    getters: {},
    actions: {
        async fetchReservacionExtras(reservacion_id: string) {
            this.loading = true
            this.error = null
            try {
                this.reservacion_extras = await reservacionExtrasApi.listarPorReservacion(reservacion_id)
            } catch (error: unknown) {
                this.error = (error as Error).message ?? 'Error al cargar extras de la reservación'
            } finally {
                this.loading = false
            }
        },
        async crearReservacionExtra(body: Reservacion_extras_create) {
            const nuevo = await reservacionExtrasApi.crear(body)
            this.reservacion_extras.push(nuevo)
            return nuevo
        },
        async actualizarReservacionExtra(id: string, body: Reservacion_extras_update) {
            const actualizado = await reservacionExtrasApi.actualizar(id, body)
            const idx = this.reservacion_extras.findIndex((e) => e.id === id)
            if (idx !== -1) this.reservacion_extras[idx] = actualizado
            return actualizado
        },
        async eliminarReservacionExtra(id: string) {
            await reservacionExtrasApi.eliminar(id)
            this.reservacion_extras = this.reservacion_extras.filter((e) => e.id !== id)
        },
    },
})
