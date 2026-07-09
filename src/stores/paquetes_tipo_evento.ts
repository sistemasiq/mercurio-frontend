import { defineStore } from 'pinia'
import { paquetesTipoEventoApi } from '@/api/paquetesTipoEventoApi'
import type {
  Paquetes_tipo_evento,
  Paquetes_tipo_evento_create,
} from '@/types/paquetes_tipo_evento'

interface PaquetesTipoEventoState {
  paquetes_tipo_evento: Paquetes_tipo_evento[]
  loading: boolean
  error: string | null
}

export const usePaquetesTipoEventoStore = defineStore('paquetes_tipo_evento', {
  state: (): PaquetesTipoEventoState => ({
    paquetes_tipo_evento: [],
    loading: false,
    error: null,
  }),
  getters: {},
  actions: {
    async fetchPorPaquete(paquete_id: string) {
      this.loading = true
      this.error = null
      try {
        this.paquetes_tipo_evento = await paquetesTipoEventoApi.listar(paquete_id)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar tipos de evento del paquete'
      } finally {
        this.loading = false
      }
    },
    async crearPaqueteTipoEvento(body: Paquetes_tipo_evento_create) {
      const nuevo = await paquetesTipoEventoApi.crear(body)
      this.paquetes_tipo_evento.push(nuevo)
      return nuevo
    },
    async eliminarPaqueteTipoEvento(paquete_id: string, tipo_evento_id: string) {
      await paquetesTipoEventoApi.eliminar(paquete_id, tipo_evento_id)
      this.paquetes_tipo_evento = this.paquetes_tipo_evento.filter(
        (p) => !(p.paquete_id === paquete_id && p.tipo_evento_id === tipo_evento_id),
      )
    },
  },
})
