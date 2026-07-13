export interface PaymentProps {
  totalToPay: number
}

export interface PaymentForm {
  method: 'EFECTIVO' | 'TARJETA' | 'LEALTAD' | 'CUPONES'
  amount: number
}

export interface AppliedPayment {
  id: string
  method: PaymentForm['method']
  amount: number
  timestamp: Date
  cardType?: 'DEBITO' | 'CREDITO'
  authCode?: string
}
