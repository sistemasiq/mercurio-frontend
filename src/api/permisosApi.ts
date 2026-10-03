import { apiClient } from '@/api/axiosClient'
import type { Permiso, RolConPermisos, RolCreate, RolUpdateMetadata } from '@/types/permission'

export const permisosApi = {
  async listarRoles(): Promise<RolConPermisos[]> {
    const { data } = await apiClient.get<RolConPermisos[]>('/permisos/roles')
    return data
  },

  async obtenerRol(rolId: number): Promise<RolConPermisos> {
    const { data } = await apiClient.get<RolConPermisos>(`/permisos/roles/${rolId}`)
    return data
  },

  async listarCatalogo(): Promise<Permiso[]> {
    const { data } = await apiClient.get<Permiso[]>('/permisos/catalogo')
    return data
  },

  async crear(body: RolCreate): Promise<RolConPermisos> {
    const { data } = await apiClient.post<RolConPermisos>('/permisos/roles', body)
    return data
  },

  async actualizarMetadata(rolId: number, body: RolUpdateMetadata): Promise<RolConPermisos> {
    const { data } = await apiClient.patch<RolConPermisos>(`/permisos/roles/${rolId}`, body)
    return data
  },

  async actualizarPermisos(rolId: number, permisoIds: number[]): Promise<RolConPermisos> {
    const { data } = await apiClient.put<RolConPermisos>(`/permisos/roles/${rolId}`, {
      permiso_ids: permisoIds,
    })
    return data
  },
}
