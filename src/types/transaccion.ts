export interface MetodoPagoResumen {
  metodo_pago_id: string
  metodo_pago_nombre: string
  monto: number
  notas_pago: string | null
}

export interface ITransaccion {
  /** Id de la comanda si es una orden; id del pago de reservación si es un evento. */
  comanda_id: string
  ticket_numero: string
  total_final: number
  estado_actual: string
  sucursal_id: string
  creado: string
  creado_por: string | null
  /**
   * Origen del ingreso. Solo las órdenes tienen detalle por comanda, así que
   * el modal de detalle no aplica a los eventos.
   */
  origen: 'orden' | 'evento'
  /** Concepto del cobro del evento (anticipo, liquidación...). Null en órdenes. */
  concepto: string | null
  metodos_pago: MetodoPagoResumen[]
}
