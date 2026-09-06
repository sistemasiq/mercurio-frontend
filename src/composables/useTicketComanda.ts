import { ref, watch, onBeforeUnmount } from 'vue'
import { obtenerComboHijos } from '@/services/productoService'
import type { Producto } from '@/types/producto'
import type { DetalleComandaRequest } from '@/types/comanda'
import type { ItemTicket } from '@/components/comandas/TicketItem.vue'

/**
 * Composable centralizado que orquesta el carrito de comandas.
 *
 * Responsabilidades:
 *  - Expansión Atómica: combos se expanden (padre + hijos) solo la primera
 *    vez. Clics subsecuentes en el mismo combo incrementan la cantidad del
 *    bloque existente. Productos sueltos se incrementan si ya existen.
 *  - Sincronización Estricta: un watcher reactivo mantiene la cantidad de
 *    cada hijo sincronizada con la de su padre. Las notas de los hijos
 *    se preservan intactas.
 *  - Split: permite separar una instancia de combo en dos, clonando hijos
 *    y notas para personalización independiente.
 *  - Tracking por instancia: cada grupo padre+hijos se rastrea con un
 *    Map para que la sincronización y eliminación sean precisas.
 */
export function useTicketComanda() {
  const itemsTicket = ref<ItemTicket[]>([])
  const nombreCliente = ref('')

  // ── Tracking de instancias ────────────────────────────────────────
  // padre TicketItem.id → Set de hijos TicketItem.id
  const comboInstances = new Map<string, Set<string>>()
  // Snapshot de cantidades de padres para detectar cambios
  const prevParentQty = new Map<string, number>()

  // ── Helpers internos ──────────────────────────────────────────────

  function buildHijoProducto(
    hijo: { producto_id: string; nombre: string },
    sucursalId: string,
  ): ItemTicket['producto'] {
    return {
      id: hijo.producto_id,
      nombre: hijo.nombre,
      precio_unitario: 0,
      tipo: 'A',
      imagen: null,
      sucursal_id: sucursalId,
      descripcion: null,
      es_combo: false,
    }
  }

  // ── Agregado Inteligente ──────────────────────────────────────────

  async function agregarProducto(producto: Producto): Promise<boolean> {
    if (producto.es_combo) {
      return agregarCombo(producto)
    }
    agregarProductoSuelto(producto)
    return true
  }

  function agregarProductoSuelto(producto: Producto) {
    const existente = itemsTicket.value.find(
      (i) => i.producto.id === producto.id && !i.es_hijo_combo,
    )
    if (existente) {
      existente.cantidad++
    } else {
      itemsTicket.value.push({
        id: crypto.randomUUID(),
        producto,
        cantidad: 1,
        notas: '',
      })
    }
  }

  async function agregarCombo(producto: Producto): Promise<boolean> {
    const existente = itemsTicket.value.find(
      (i) => i.producto.id === producto.id && !i.es_hijo_combo,
    )

    if (existente) {
      existente.cantidad++
      return true
    }

    return expandirCombo(producto)
  }

  async function expandirCombo(
    producto: Producto,
    notasPadre?: string,
    notasHijos?: Map<string, string>,
  ): Promise<boolean> {
    try {
      const hijos = await obtenerComboHijos(producto.id)
      const parentId = crypto.randomUUID()
      const childIds = new Set<string>()

      itemsTicket.value.push({
        id: parentId,
        producto,
        cantidad: 1,
        notas: notasPadre ?? '',
      })

      for (const hijo of hijos) {
        const childId = crypto.randomUUID()
        childIds.add(childId)
        itemsTicket.value.push({
          id: childId,
          producto: buildHijoProducto(hijo, producto.sucursal_id),
          cantidad: hijo.cantidad,
          notas: notasHijos?.get(hijo.producto_id) ?? '',
          es_hijo_de: producto.id,
          es_hijo_combo: true,
          nombre_combo_padre: producto.nombre,
          cantidad_base: hijo.cantidad,
          padreTicketId: parentId,
        })
      }

      comboInstances.set(parentId, childIds)
      prevParentQty.set(parentId, 1)
      return true
    } catch (err) {
      console.error('[useTicketComanda] Error al expandir combo:', err)
      return false
    }
  }

  // ── Split de combo ────────────────────────────────────────────────
  // Separa una instancia de combo: decrementa el original en -1 y crea
  // una nueva instancia independiente con hijos nuevos y notas clonadas.

  async function splitCombo(item: ItemTicket): Promise<ItemTicket | null> {
    if (item.cantidad <= 1 || item.es_hijo_combo || !item.producto.es_combo) return null

    item.cantidad--

    const notasHijos = new Map<string, string>()
    const childIds = comboInstances.get(item.id)
    if (childIds) {
      for (const child of itemsTicket.value) {
        if (childIds.has(child.id) && child.notas) {
          notasHijos.set(child.producto.id, child.notas)
        }
      }
    }

    const newParentId = crypto.randomUUID()
    const newChildIds = new Set<string>()

    const hijos = await obtenerComboHijos(item.producto.id)

    itemsTicket.value.push({
      id: newParentId,
      producto: item.producto,
      cantidad: 1,
      notas: item.notas,
    })

    for (const hijo of hijos) {
      const childId = crypto.randomUUID()
      newChildIds.add(childId)
      itemsTicket.value.push({
        id: childId,
        producto: buildHijoProducto(hijo, item.producto.sucursal_id),
        cantidad: hijo.cantidad,
        notas: notasHijos.get(hijo.producto_id) ?? '',
        es_hijo_de: item.producto.id,
        es_hijo_combo: true,
        nombre_combo_padre: item.producto.nombre,
        cantidad_base: hijo.cantidad,
        padreTicketId: newParentId,
      })
    }

    comboInstances.set(newParentId, newChildIds)
    prevParentQty.set(newParentId, 1)

    return itemsTicket.value.find((i) => i.id === newParentId) ?? null
  }

  // ── Watcher de Sincronización Estricta ────────────────────────────
  // Detecta cambios en la cantidad de un padre combo y actualiza todos
  // sus hijos para que coincidan exactamente. Las notas_especiales de
  // cada hijo se preservan intactas.

  watch(
    itemsTicket,
    (newItems) => {
      for (const item of newItems) {
        if (item.es_hijo_combo || !item.producto.es_combo) continue

        const childIds = comboInstances.get(item.id)
        if (!childIds) continue

        const oldQty = prevParentQty.get(item.id)
        if (oldQty !== undefined && oldQty !== item.cantidad && item.cantidad > 0) {
          for (const child of newItems) {
            if (childIds.has(child.id) && child.cantidad_base) {
              child.cantidad = child.cantidad_base * item.cantidad
            }
          }
        }

        if (item.cantidad > 0) {
          prevParentQty.set(item.id, item.cantidad)
        }
      }

      // Limpiar tracking de padres que ya no están en el ticket
      for (const parentId of prevParentQty.keys()) {
        if (!newItems.some((i) => i.id === parentId)) {
          prevParentQty.delete(parentId)
          comboInstances.delete(parentId)
        }
      }
    },
    { deep: true },
  )

  // ── Acciones del ticket ───────────────────────────────────────────

  function cambiarCantidad(item: ItemTicket, delta: number) {
    if (item.es_hijo_combo) return

    item.cantidad += delta
    if (item.cantidad <= 0) {
      const childIds = comboInstances.get(item.id)
      itemsTicket.value = itemsTicket.value.filter((i) => {
        if (i.id === item.id) return false
        if (childIds?.has(i.id)) return false
        return true
      })
      comboInstances.delete(item.id)
      prevParentQty.delete(item.id)
    }
  }

  function cancelarOrden() {
    itemsTicket.value = []
    comboInstances.clear()
    prevParentQty.clear()
  }

  function guardarNotas(item: ItemTicket, notas: string) {
    const target = itemsTicket.value.find((i) => i.id === item.id)
    if (target) target.notas = notas
  }

  // Payload para el backend. Cada combo padre (cantidad N) se expande en N
  // instancias independientes: el visor de cocina agrupa a los hijos por
  // id_combo_padre y muestra una unidad por tarjeta en vez de fusionarlas.
  // La línea del combo padre se conserva tal cual para que el backend
  // descuente stock de sus insumos; los hijos son líneas informativas
  // (es_hijo_combo = true) que el inventario ignora.
  function detallesParaEnvio(): DetalleComandaRequest[] {
    const detalles: DetalleComandaRequest[] = []

    for (const item of itemsTicket.value) {
      if (item.es_hijo_combo) continue

      const esCombo = Boolean(item.producto.es_combo)
      detalles.push({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_unitario,
        subtotal: item.producto.precio_unitario * item.cantidad,
        notas_especiales: item.notas || undefined,
        nombre_combo_padre: item.nombre_combo_padre || undefined,
        es_hijo_de: item.es_hijo_de || undefined,
        es_hijo_combo: item.es_hijo_combo || undefined,
      })

      if (!esCombo) continue

      const hijos = itemsTicket.value.filter((i) => i.padreTicketId === item.id)
      for (let unidad = 0; unidad < item.cantidad; unidad++) {
        const idInstancia = crypto.randomUUID()
        for (const hijo of hijos) {
          detalles.push({
            producto_id: hijo.producto.id,
            nombre: hijo.producto.nombre,
            cantidad: hijo.cantidad_base ?? 1,
            precio_unitario: 0,
            subtotal: 0,
            notas_especiales: hijo.notas || undefined,
            nombre_combo_padre: hijo.nombre_combo_padre || item.producto.nombre,
            es_hijo_de: hijo.es_hijo_de || item.producto.id,
            es_hijo_combo: true,
            id_combo_padre: idInstancia,
          })
        }
      }
    }

    return detalles
  }

  onBeforeUnmount(() => {
    comboInstances.clear()
    prevParentQty.clear()
  })

  return {
    itemsTicket,
    agregarProducto,
    splitCombo,
    cambiarCantidad,
    cancelarOrden,
    guardarNotas,
    detallesParaEnvio,
    nombreCliente,
  }
}
