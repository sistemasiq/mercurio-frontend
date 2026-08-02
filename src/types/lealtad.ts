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

export interface SaldoPuntos {
  sucursal_id: string
  celular: string
  saldo: number
}

export type TipoMovimientoPuntos = 'O' | 'R' | 'C' | 'A'

export interface ReporteLealtad {
  sucursal_id: string
  total_otorgado: number
  total_redimido: number
  total_caducado: number
  saldo_vigente: number
  clientes_con_saldo: number
}

export interface MovimientoPuntos {
  id: string
  sucursal_id: string
  celular: string
  lote_id: string | null
  comanda_id: string | null
  tipo: TipoMovimientoPuntos
  puntos: number
  saldo_resultante: number
  notas: string | null
  creado: string
  creado_por: string | null
}
