import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTicketComanda } from '../useTicketComanda'
import { obtenerComboHijos } from '@/services/productoService'
import type { Producto } from '@/types/producto'

vi.mock('@/services/productoService', () => ({ obtenerComboHijos: vi.fn() }))

const combo = {
  id: 'combo-1',
  nombre: 'Combo Kids',
  precio_unitario: 100,
  tipo: 'C',
  imagen: null,
  sucursal_id: 's1',
  descripcion: null,
  es_combo: true,
} as Producto

const HIJOS = [
  { producto_id: 'h1', nombre: 'Hamburguesa', cantidad: 1 },
  { producto_id: 'h2', nombre: 'Refresco', cantidad: 2 },
]

const mockHijos = vi.mocked(obtenerComboHijos)

describe('useTicketComanda', () => {
  beforeEach(() => {
    mockHijos.mockReset()
  })

  it('crea un solo padre ante dos agregarCombo concurrentes', async () => {
    mockHijos.mockResolvedValue(HIJOS as never)
    const { itemsTicket, agregarProducto } = useTicketComanda()

    await Promise.all([agregarProducto(combo), agregarProducto(combo)])

    const padres = itemsTicket.value.filter((i) => !i.es_hijo_combo)
    expect(padres).toHaveLength(1)
    expect(itemsTicket.value.filter((i) => i.es_hijo_combo)).toHaveLength(HIJOS.length)
    expect(mockHijos).toHaveBeenCalledTimes(1)
  })

  it('incrementa la cantidad en un clic posterior a la expansión', async () => {
    mockHijos.mockResolvedValue(HIJOS as never)
    const { itemsTicket, agregarProducto } = useTicketComanda()

    await agregarProducto(combo)
    await agregarProducto(combo)

    const padres = itemsTicket.value.filter((i) => !i.es_hijo_combo)
    expect(padres).toHaveLength(1)
    expect(padres[0]?.cantidad).toBe(2)
  })

  it('no altera la cantidad si splitCombo falla al pedir los hijos', async () => {
    mockHijos.mockResolvedValueOnce(HIJOS as never)
    const { itemsTicket, agregarProducto, splitCombo } = useTicketComanda()
    await agregarProducto(combo)
    await agregarProducto(combo)
    const padre = itemsTicket.value.find((i) => !i.es_hijo_combo)!
    const totalAntes = itemsTicket.value.length

    mockHijos.mockRejectedValueOnce(new Error('red caída'))
    await expect(splitCombo(padre)).rejects.toThrow('red caída')

    expect(padre.cantidad).toBe(2)
    expect(itemsTicket.value).toHaveLength(totalAntes)
  })

  it('splitCombo exitoso decrementa el original y crea una instancia nueva', async () => {
    mockHijos.mockResolvedValue(HIJOS as never)
    const { itemsTicket, agregarProducto, splitCombo } = useTicketComanda()
    await agregarProducto(combo)
    await agregarProducto(combo)
    const padre = itemsTicket.value.find((i) => !i.es_hijo_combo)!

    const nuevo = await splitCombo(padre)

    expect(nuevo).not.toBeNull()
    expect(padre.cantidad).toBe(1)
    expect(itemsTicket.value.filter((i) => !i.es_hijo_combo)).toHaveLength(2)
  })
})
