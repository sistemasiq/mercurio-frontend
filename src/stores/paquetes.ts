import { defineStore } from 'pinia'
import { paquetesApi } from '@/api/paquetesApi'
import type { Paquetes, PaquetesCreate, PaquetesUpdate } from '@/types/paquetes.ts'

interface PaquetesState {
  paquetes: Paquetes[]
  loading: boolean
  error: string | null
}

export const usePaquetesStore = defineStore('paquetes', {
  state: (): PaquetesState => ({
    paquetes: [],
    loading: false,
    error: null,
  }),
  getters: {
    activos: (state) => state.paquetes.filter((p) => p.activo),
  },
  actions: {
    async cargar(sucursal_id?: string) {
      this.loading = true
      this.error = null
      try {
        this.paquetes = await paquetesApi.listar(sucursal_id)
      } catch (e: unknown) {
        this.error = (e as Error).message ?? 'Error al cargar paquetes'
      } finally {
        this.loading = false
      }
    },
    async crearPaquete(body: PaquetesCreate) {
      const nuevo = await paquetesApi.crear(body)
      this.paquetes.push(nuevo)
      return nuevo
    },
    async editarPaquete(id: string, body: PaquetesUpdate) {
      const actualizado = await paquetesApi.actualizar(id, body)
      const idx = this.paquetes.findIndex((p) => p.id === id)
      if (idx !== -1) this.paquetes[idx] = actualizado
      return actualizado
    },
    async eliminarPaquete(id: string) {
      await paquetesApi.eliminar(id)
      this.paquetes = this.paquetes.filter((p) => p.id !== id)
    },
  },
})
