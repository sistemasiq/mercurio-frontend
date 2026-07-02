import { defineStore } from 'pinia'
import { branchesApi } from '@/api/branchesApi'
import type { Branch } from '@/types/branch'
import type { Sucursales, SucursalCreate, SucursalUpdate } from '@/types/sucursales'

function mapToSucursal(branch: Branch): Sucursales {
  return {
    id: branch.id,
    activo: branch.isActive,
    creado: branch.creado ?? undefined,
    creado_por: branch.creadoPor,
    modificado: branch.modificado,
    modificado_por: branch.modificadoPor,
    nombre: branch.nombre,
    direccion: branch.direccion,
    telefono: branch.telefono,
  }
}

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
        const branches = await branchesApi.list()
        this.sucursales = branches.map(mapToSucursal)
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar sucursales'
      } finally {
        this.loading = false
      }
    },
    async crearSucursal(body: SucursalCreate) {
      const branch = await branchesApi.create(body)
      const nueva = mapToSucursal(branch)
      this.sucursales.push(nueva)
      return nueva
    },
    async actualizarSucursal(id: string, body: SucursalUpdate) {
      const actual = this.sucursales.find((s) => s.id === id)
      const nombre = body.nombre ?? actual?.nombre
      if (!nombre) {
        throw new Error('El nombre es requerido para actualizar la sucursal.')
      }
      const branch = await branchesApi.update(id, {
        nombre,
        direccion: body.direccion,
        telefono: body.telefono,
      })
      const actualizada = mapToSucursal(branch)
      const idx = this.sucursales.findIndex((s) => s.id === id)
      if (idx !== -1) this.sucursales[idx] = actualizada
      return actualizada
    },
    async eliminarSucursal(id: string) {
      await branchesApi.remove(id)
      this.sucursales = this.sucursales.filter((s) => s.id !== id)
    },
  },
})
