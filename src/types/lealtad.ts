export interface ConfiguracionLealtad {
  sucursal_id: string
  porcentaje_retorno: number
  dias_caducidad: number
  valor_punto: number
  activo: boolean
  otorga_puntos_comandas: boolean
  otorga_puntos_reservaciones: boolean
  otorga_puntos_checkin: boolean
  minimo_canje: number
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
  otorga_puntos_comandas: boolean
  otorga_puntos_reservaciones: boolean
  otorga_puntos_checkin: boolean
  minimo_canje: number
}

export interface SaldoPuntos {
  sucursal_id: string
  celular: string
  saldo: number
  por_vencer: number
}

export type TipoMovimientoPuntos = 'O' | 'R' | 'C' | 'A'

export interface TopClienteLealtad {
  celular: string
  nombre: string | null
  puntos_otorgados: number
}

export interface ReporteLealtad {
  sucursal_id: string
  total_otorgado: number
  total_redimido: number
  total_caducado: number
  saldo_vigente: number
  clientes_con_saldo: number
  top_clientes: TopClienteLealtad[]
}

export interface ClienteLealtad {
  celular: string
  nombre: string | null
  saldo: number
}

export interface AjustePuntosInput {
  celular: string
  puntos: number
  motivo: string
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
