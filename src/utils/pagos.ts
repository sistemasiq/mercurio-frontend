import type { AppliedPayment } from '@/types/payments'
import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'

function esEfectivo(metodo: string): boolean {
  return metodo.trim().toLowerCase().includes('efectivo')
}

/**
 * Ajusta los pagos capturados a lo que realmente se queda en caja, descontando
 * el cambio devuelto al cliente.
 *
 * El teclado de cobro registra lo que el cliente ENTREGA. Si paga $6,000 por un
 * evento de $5,920, se le devuelven $80: el ingreso real es $5,920, no $6,000.
 * Sin este ajuste:
 *   - la reservación guardaba un anticipo mayor que su total, y la BD lo rechaza
 *     (`chk_reservaciones_anticipo`: anticipo <= precio_total);
 *   - el saldo pendiente salía en negativo (−$80) en vez de cero;
 *   - el movimiento de caja quedaba inflado por el cambio, así que el corte
 *     esperaba más dinero del que había físicamente en el cajón.
 *
 * El descuento se aplica solo al efectivo porque es el único método que admite
 * excedente: el modal de cobro impide que tarjeta, cupones o lealtad rebasen el
 * saldo, precisamente porque de esos no se puede dar cambio.
 */
export function descontarCambio(pagos: AppliedPayment[], total: number): AppliedPayment[] {
  const pagado = pagos.reduce((suma, p) => suma + p.amount, 0)
  let excedente = Math.max(0, pagado - total)

  if (excedente === 0) return pagos.map((p) => ({ ...p }))

  return (
    pagos
      .map((p) => {
        if (excedente <= 0 || !esEfectivo(p.method)) return { ...p }
        const descuento = Math.min(excedente, p.amount)
        excedente -= descuento
        return { ...p, amount: p.amount - descuento }
      })
      // Un pago que queda en cero era puro cambio: no representa ingreso alguno y
      // registrarlo dejaría un movimiento de caja de $0 sin significado.
      .filter((p) => p.amount > 0)
  )
}

/** Suma de los pagos, ya descontado el cambio si se pasó por descontarCambio(). */
export function totalPagado(pagos: AppliedPayment[]): number {
  return pagos.reduce((suma, p) => suma + p.amount, 0)
}

/**
 * Traduce la categoría que devuelve el teclado de cobro ("Efectivo", "Tarjeta"…)
 * al id del método de pago configurado.
 *
 * El modal trabaja con categorías genéricas, pero `pagos_reservacion` y
 * `pagos_ordenes` guardan el id de un método concreto del catálogo. Vive aquí
 * porque lo necesitan tanto el asistente de reservación como la pantalla de
 * Pagos, y tenerlo duplicado hacía que un cambio de reglas quedara aplicado a
 * medias.
 *
 * Lanza si la sucursal no tiene un método activo de esa categoría: registrar el
 * cobro contra un método equivocado descuadraría el corte por método de pago.
 */
export function resolverMetodoPagoId(categoria: string, metodos: MetodosPago[]): string {
  const cat = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoria)
  const metodo = metodos.find((m) => m.activo && m.tipo === cat?.tipo)
  if (!metodo) {
    throw new Error(
      `No hay un método de pago activo de tipo "${categoria}" configurado para esta sucursal.`,
    )
  }
  return metodo.id
}

function esTarjeta(metodo: string): boolean {
  const n = metodo.trim().toLowerCase()
  return (
    n.includes('tarjeta') ||
    n.includes('crédito') ||
    n.includes('débito') ||
    n.includes('credito') ||
    n.includes('debito')
  )
}

/**
 * Resume los métodos usados en un cobro para mostrarlos en un ticket
 * ("Efectivo, Tarjeta Crédito"), distinguiendo débito/crédito cuando aplica.
 *
 * Misma lógica que `metodosPagoResumen` en el asistente de reservación, para
 * que el texto se vea igual en cualquier ticket que muestre un pago.
 */
export function resumenMetodosPago(pagos: AppliedPayment[]): string {
  const nombres = pagos.map((p) =>
    esTarjeta(p.method) && p.cardType
      ? `Tarjeta ${p.cardType === 'DEBITO' ? 'Débito' : 'Crédito'}`
      : p.method,
  )
  return nombres.length ? [...new Set(nombres)].join(', ') : '—'
}
