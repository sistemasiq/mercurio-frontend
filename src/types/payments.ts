import type { DetalleComandaRequest } from './comanda'

export interface PaymentProps {
  totalToPay: number
  celularPrellenado?: string
}

export interface AppliedPayment {
  id: string
  method: string
  amount: number
  timestamp: Date
  cardType?: 'DEBITO' | 'CREDITO'
  authCode?: string
}

// ── Tipos para el endpoint POST /api/pagos/completar ────────────────────────

export interface PaymentItemRequest {
  metodo_pago_id: string
  monto: number
  notas_pago?: string
}

export interface PagoCompletoRequest {
  ticket_numero: string
  total_final: number
  detalles_comanda: DetalleComandaRequest[]
  notas_generales?: string
  pagos: PaymentItemRequest[]
  celular_cliente?: string
  puntos_a_redimir?: number
}
