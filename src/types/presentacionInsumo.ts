export interface PresentacionInsumo {
  id: string
  insumo_id: string
  nombre: string
  equivalencia_base: string
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export interface PresentacionInsumoCreate {
  nombre: string
  equivalencia_base: string
}

export interface PresentacionInsumoUpdate {
  nombre?: string
  equivalencia_base?: string
  activo?: boolean
}
