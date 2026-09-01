export interface MetodoPagoResumen {
  metodo_pago_id: string
  metodo_pago_nombre: string
  monto: number
  notas_pago: string | null
}

export interface ITransaccion {
  tipo_origen: 'comanda' | 'estancia' | 'reservacion'
  referencia_id: string
  titulo: string
  total_final: number
  estado_actual: string
  sucursal_id: string
  creado: string
  creado_por: string | null
  metodos_pago: MetodoPagoResumen[]
  comanda_id: string | null
  ticket_numero: string | null
}
