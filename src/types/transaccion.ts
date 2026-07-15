export interface ITransaccion {
  id: string
  comanda_id: string
  ticket_numero: string
  total_final: number
  estado_actual: string
  metodo_pago_id: string
  metodo_pago_nombre: string
  monto: number
  notas_pago: string | null
  sucursal_id: string
  creado: string
  creado_por: string | null
}
