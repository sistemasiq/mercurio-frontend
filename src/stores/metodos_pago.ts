import { defineStore } from 'pinia'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import type { MetodosPago, MetodosPagoUpdate } from '@/types/metodos_pago'

interface MetodosPagoState {
  metodos: MetodosPago[]
  loading: boolean
  error: string | null
}

export const useMetodosPagoStore = defineStore('metodos_pago', {
  state: (): MetodosPagoState => ({
    metodos: [],
    loading: false,
    error: null,
  }),
  getters: {
    activos: (state) => state.metodos.filter((m) => m.activo),
  },
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.metodos = await metodosPagoApi.listar()
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar métodos de pago'
      } finally {
        this.loading = false
      }
    },
    // Edita nombre/descripción del catálogo global -- solo AdministradorSistema.
    async actualizarMetodoPago(id: string, body: MetodosPagoUpdate) {
      const actualizado = await metodosPagoApi.actualizar(id, body)
      const idx = this.metodos.findIndex((m) => m.id === id)
      if (idx !== -1) this.metodos[idx] = actualizado
      return actualizado
    },
    // Activa/desactiva el método solo para la sucursal del usuario autenticado.
    async toggleActivo(id: string, activo: boolean) {
      const actualizado = await metodosPagoApi.activar(id, { activo })
      const idx = this.metodos.findIndex((m) => m.id === id)
      if (idx !== -1) this.metodos[idx] = actualizado
      return actualizado
    },
  },
})
