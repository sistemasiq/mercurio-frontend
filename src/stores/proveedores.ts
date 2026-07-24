import { defineStore } from 'pinia'
import {
  actualizarProveedor,
  crearProveedor,
  eliminarProveedor,
  listarProveedores,
} from '@/services/proveedorService'
import type { Proveedor, ProveedorCreate, ProveedorUpdate } from '@/types/proveedor'

interface ProveedoresState {
  proveedores: Proveedor[]
  loading: boolean
  error: string | null
}

export const useProveedoresStore = defineStore('proveedores', {
  state: (): ProveedoresState => ({
    proveedores: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar(sucursalId: string) {
      this.loading = true
      this.error = null
      try {
        this.proveedores = await listarProveedores(sucursalId)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los proveedores'
      } finally {
        this.loading = false
      }
    },
    async crear(body: ProveedorCreate) {
      const nuevo = await crearProveedor(body)
      this.proveedores.unshift(nuevo)
      return nuevo
    },
    async actualizar(id: string, body: ProveedorUpdate) {
      const actualizado = await actualizarProveedor(id, body)
      const idx = this.proveedores.findIndex((p) => p.id === id)
      if (idx !== -1) this.proveedores[idx] = actualizado
      return actualizado
    },
    async eliminar(id: string) {
      await eliminarProveedor(id)
      const idx = this.proveedores.findIndex((p) => p.id === id)
      if (idx !== -1) this.proveedores[idx] = { ...this.proveedores[idx]!, activo: false }
    },
  },
})
