import { defineStore } from 'pinia'
import { sucursalesApi } from '@/api/sucursales'
import type { Sucursales, SucursalCreate, SucursalUpdate } from '@/types/sucursales'

interface SucursalesState {
  sucursales: Sucursales[]
  loading: boolean
  error: string | null
}

export const useSucursalesStore = defineStore('sucursales', {
  state: (): SucursalesState => ({
    sucursales: [],
    loading: false,
    error: null,
  }),
  getters: {
    activas: (state) => state.sucursales.filter((s) => s.activo),
  },
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.sucursales = await sucursalesApi.listar()
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar sucursales'
      } finally {
        this.loading = false
      }
    },
    async crearSucursal(body: SucursalCreate) {
      const nueva = await sucursalesApi.crear(body)
      this.sucursales.push(nueva)
      return nueva
    },
    async actualizarSucursal(id: string, body: SucursalUpdate) {
      const actualizada = await sucursalesApi.actualizar(id, body)
      const idx = this.sucursales.findIndex((s) => s.id === id)
      if (idx !== -1) this.sucursales[idx] = actualizada
      return actualizada
    },
    async eliminarSucursal(id: string) {
      await sucursalesApi.eliminar(id)
      this.sucursales = this.sucursales.filter((s) => s.id !== id)
    },
  },
})
