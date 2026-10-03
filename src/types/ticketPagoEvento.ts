/**
 * Datos que se imprimen en el comprobante de un pago registrado sobre una
 * reservación ya existente (abono o liquidación desde Pagos o Cierre de Evento).
 *
 * Se pasan como valores planos, ya calculados, igual que TicketReservacionProps:
 * el ticket debe reflejar lo que se cobró en ESTA transacción, congelado en el
 * momento de confirmar, sin depender de estado que ya podría haber cambiado.
 */
export interface TicketPagoEventoProps {
  folio: string
  sucursal: string
  clienteNombre: string
  tipoEvento: string
  fechaEvento: string
  /** Precio total del evento. */
  totalEvento: number
  /** Monto cobrado en esta transacción (ya descontado el cambio). */
  montoPagado: number
  /** Suma de todos los pagos del evento, incluyendo este. */
  totalPagadoAcumulado: number
  /** Lo que falta por cobrar después de este pago. Nunca negativo. */
  saldoPendiente: number
  /** Métodos usados en esta transacción, ya resumidos ("Efectivo, Tarjeta Crédito"). */
  metodosPago: string
  notas?: string | null
}
