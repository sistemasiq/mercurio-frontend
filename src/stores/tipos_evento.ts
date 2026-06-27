import { defineStore } from 'pinia'
import { tiposEventoApi } from '@/api/tipos_evento'
import type { Tipos_evento, Tipos_evento_create, Tipos_evento_update } from '@/types/tipos_evento'

interface TiposEventoState {
    tipos: Tipos_evento[]
    loading: boolean
    error: string | null
}

export const useTiposEventoStore = defineStore('tipos_evento', {
    state: (): TiposEventoState => ({
        tipos: [],
        loading: false,
        error: null,
    }),
    getters: {
        activos: (state) => state.tipos.filter((t) => t.activo),
    },
    actions: {
        async cargar() {
            this.loading = true
            this.error = null
            try {
                this.tipos = await tiposEventoApi.listar()
            } catch (error: unknown) {
                this.error = (error as Error).message ?? 'Error al cargar tipos de evento'
            } finally {
                this.loading = false
            }
        },
        async crearTipoEvento(body: Tipos_evento_create) {
            const nuevo = await tiposEventoApi.crear(body)
            this.tipos.push(nuevo)
            return nuevo
        },
        async actualizarTipoEvento(id: string, body: Tipos_evento_update) {
            const actualizado = await tiposEventoApi.actualizar(id, body)
            const idx = this.tipos.findIndex((t) => t.id === id)
            if (idx !== -1) this.tipos[idx] = actualizado
            return actualizado
        },
        async eliminarTipoEvento(id: string) {
            await tiposEventoApi.eliminar(id)
            this.tipos = this.tipos.filter((t) => t.id !== id)
        },
    },
})
