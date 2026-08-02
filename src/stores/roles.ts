import { defineStore } from 'pinia'
import {
  actualizarMetadataRol,
  actualizarPermisosRol,
  crearRol,
  listarCatalogoPermisos,
  listarRoles,
} from '@/services/permisoService'
import type { Permiso, RolConPermisos, RolCreate, RolUpdateMetadata } from '@/types/permission'

interface RolesState {
  roles: RolConPermisos[]
  catalogoPermisos: Permiso[]
  loading: boolean
  error: string | null
}

export const useRolesStore = defineStore('roles', {
  state: (): RolesState => ({
    roles: [],
    catalogoPermisos: [],
    loading: false,
    error: null,
  }),
  actions: {
    async cargar() {
      this.loading = true
      this.error = null
      try {
        this.roles = await listarRoles()
      } catch (error: unknown) {
        this.error = (error as Error).message ?? 'Error al cargar los roles'
      } finally {
        this.loading = false
      }
    },
    async cargarCatalogo() {
      this.catalogoPermisos = await listarCatalogoPermisos()
    },
    async crear(body: RolCreate) {
      const nuevo = await crearRol(body)
      this.roles.unshift(nuevo)
      return nuevo
    },
    async actualizarMetadata(rolId: number, body: RolUpdateMetadata) {
      const actualizado = await actualizarMetadataRol(rolId, body)
      const idx = this.roles.findIndex((r) => r.id === rolId)
      if (idx !== -1) this.roles.splice(idx, 1, actualizado)
      return actualizado
    },
    async actualizarPermisos(rolId: number, permisoIds: number[]) {
      const actualizado = await actualizarPermisosRol(rolId, permisoIds)
      const idx = this.roles.findIndex((r) => r.id === rolId)
      if (idx !== -1) this.roles.splice(idx, 1, actualizado)
      return actualizado
    },
    async desactivar(rolId: number) {
      return this.actualizarMetadata(rolId, { activo: false })
    },
    async reactivar(rolId: number) {
      return this.actualizarMetadata(rolId, { activo: true })
    },
  },
})
