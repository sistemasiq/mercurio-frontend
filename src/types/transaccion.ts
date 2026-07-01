export interface ITransaccion {
  id: string
  fechaHora: string
  clienteMesa: {
    ubicacion: string
    referencia: string
  }
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Wallet'
  estado: 'Pagado' | 'Cancelado' | 'Reembolsado'
  total: number
}
