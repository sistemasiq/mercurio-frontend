export interface PaymentProps {
  totalToPay: number
}

export interface AppliedPayment {
  id: string
  method: string
  amount: number
  timestamp: Date
  cardType?: 'DEBITO' | 'CREDITO'
  authCode?: string
}
