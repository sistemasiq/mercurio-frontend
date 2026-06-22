// src/types/checkout.ts
export type MetodoPago = 'Efectivo' | 'Crédito/Débito' | 'Cupones' | 'Saldo de Lealtad' | 'Cortesía';

export interface IPagoAplicado {
  id: string;
  metodo: MetodoPago;
  monto: number;
  detalles?: string;
}