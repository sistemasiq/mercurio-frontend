export interface ConfiguracionLealtad {
  sucursal_id: string
  porcentaje_retorno: number
  dias_caducidad: number
  valor_punto: number
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export interface ConfiguracionLealtadInput {
  porcentaje_retorno: number
  dias_caducidad: number
  valor_punto: number
  activo: boolean
}
