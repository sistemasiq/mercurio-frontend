export type TipoUnidad = 'masa' | 'volumen' | 'pieza'

export interface UnidadMedida {
  id: string
  codigo: string
  nombre: string
  tipo: TipoUnidad
  factor_a_base: string
  activo: boolean
}
