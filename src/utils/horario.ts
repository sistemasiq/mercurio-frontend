/** Horas facturables entre dos horarios "HH:mm" o "HH:mm:ss". Toda fracción de
 * hora se factura como hora completa, con un mínimo de 1 hora. */
export function horasFacturables(horaInicio: string, horaFin: string): number {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFin.split(':').map(Number)
  const minutos = h2! * 60 + m2! - (h1! * 60 + m1!)
  return Math.max(1, Math.ceil(minutos / 60))
}
