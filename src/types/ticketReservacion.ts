/** Un renglón del desglose impreso en el ticket de reservación. */
export interface TicketConcepto {
  descripcion: string
  importe: number
}

/**
 * Datos que se imprimen en el comprobante de una reservación.
 *
 * Se pasan como valores planos, ya calculados, en vez de ids que el componente
 * tendría que resolver: el ticket debe reflejar lo que se cobró en ese momento,
 * aunque después cambien los catálogos.
 */
export interface TicketReservacionProps {
  folio: string
  sucursal: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail?: string | null
  tipoEvento: string
  fechaEvento: string
  horario: string
  numeroNinos: number
  paqueteNombre: string
  conceptos: TicketConcepto[]
  total: number
  anticipo: number
  metodosPago: string
}
