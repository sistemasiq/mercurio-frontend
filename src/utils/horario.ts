/** Horas facturables entre dos horarios "HH:mm" o "HH:mm:ss". Toda fracción de
 * hora se factura como hora completa, con un mínimo de 1 hora.
 *
 * Si la hora de fin es igual o anterior a la de inicio se asume que cruza la
 * medianoche (22:00 → 01:00 = 3 h). Con entradas vacías o mal formadas devuelve
 * el mínimo (1) en lugar de NaN, para que nunca llegue un NaN a un payload. */
export function horasFacturables(horaInicio: string, horaFin: string): number {
  const partes = (hora: string | null | undefined): [number, number] => {
    if (!hora || !hora.includes(':')) return [NaN, NaN]
    const [h, m] = hora.split(':')
    return [h ? Number(h) : NaN, m ? Number(m) : NaN]
  }
  const [h1, m1] = partes(horaInicio)
  const [h2, m2] = partes(horaFin)
  if (![h1, m1, h2, m2].every((n) => Number.isFinite(n))) return 1
  let minutos = h2! * 60 + m2! - (h1! * 60 + m1!)
  if (minutos <= 0) minutos += 24 * 60
  return Math.max(1, Math.ceil(minutos / 60))
}
