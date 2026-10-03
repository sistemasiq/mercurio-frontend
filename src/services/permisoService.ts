import { permisosApi } from '@/api/permisosApi'
import type { Permiso, RolConPermisos, RolCreate, RolUpdateMetadata } from '@/types/permission'

export async function listarRoles(): Promise<RolConPermisos[]> {
  return permisosApi.listarRoles()
}

export async function listarCatalogoPermisos(): Promise<Permiso[]> {
  return permisosApi.listarCatalogo()
}

export async function crearRol(body: RolCreate): Promise<RolConPermisos> {
  return permisosApi.crear(body)
}

export async function actualizarMetadataRol(
  rolId: number,
  body: RolUpdateMetadata,
): Promise<RolConPermisos> {
  return permisosApi.actualizarMetadata(rolId, body)
}

export async function actualizarPermisosRol(
  rolId: number,
  permisoIds: number[],
): Promise<RolConPermisos> {
  return permisosApi.actualizarPermisos(rolId, permisoIds)
}
