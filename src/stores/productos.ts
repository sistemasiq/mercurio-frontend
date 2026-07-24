import { defineStore } from 'pinia'
import { productosApi } from '@/api/productosApi'
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  reactivarProducto,
} from '@/services/productoService'
import type { ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

interface ProductosState {
  productos: ProductoAdmin[]
  loading: boolean
  error: string | null
}

export const useProductosStore = defineStore('productos', {
  state: (): ProductosState => ({
    productos: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar(signal?: AbortSignal) {
      this.loading = true
      this.error = null
      try {
        this.productos = await productosApi.listarAdmin(signal)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los productos'
      } finally {
        this.loading = false
      }
    },
    async crear(body: ProductoCreate, imagen?: File | null) {
      const nuevo = await crearProducto(body, imagen)
      this.productos.unshift(nuevo)
      return nuevo
    },
    async actualizar(id: string, body: ProductoUpdate, imagen?: File | null) {
      const actualizado = await actualizarProducto(id, body, imagen)
      const idx = this.productos.findIndex((p) => p.id === id)
      if (idx !== -1) this.productos.splice(idx, 1, actualizado)
      return actualizado
    },
    async eliminar(id: string) {
      await eliminarProducto(id)
      const idx = this.productos.findIndex((p) => p.id === id)
      if (idx !== -1) this.productos[idx] = { ...this.productos[idx]!, activo: false }
    },
    async reactivar(id: string) {
      const reactivado = await reactivarProducto(id)
      const idx = this.productos.findIndex((p) => p.id === id)
      if (idx !== -1) this.productos.splice(idx, 1, reactivado)
      return reactivado
    },
  },
})
