<template>
  <div class="caja-root">
    <!-- Columna izquierda: catálogo -->
    <div class="caja-col">
      <div class="caja-header">
        <h1 class="caja-header__titulo">Estación Principal</h1>
        <div class="caja-header__sub">Terminal #01</div>
      </div>

      <div class="caja-cats hide-scrollbar">
        <button
          v-for="cat in listaCategorias"
          :key="cat.value"
          class="cat-pill"
          :class="{ 'cat-pill--active': categoriaSeleccionada === cat.value }"
          @click="seleccionarCategoria(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="caja-productos hide-scrollbar">
        <div v-if="loading" class="caja-grid">
          <q-card v-for="n in 8" :key="n" flat bordered class="skeleton-card">
            <q-skeleton type="rect" height="100px" />
            <q-card-section>
              <q-skeleton type="text" width="65%" class="q-mb-xs" />
              <q-skeleton type="text" width="85%" />
            </q-card-section>
          </q-card>
        </div>

        <q-banner v-else-if="error" class="bg-orange-1 text-orange-10" rounded>
          No se pudieron cargar los productos. Intenta de nuevo.
        </q-banner>

        <div v-else class="caja-grid">
          <ProductoCard
            v-for="producto in productosFiltrados"
            :key="producto.id"
            :producto="producto"
            @agregar="agregarAlTicket"
          />
        </div>
      </div>

      <div class="caja-footer">
        <div class="caja-footer__stats">
          <div class="stat-block">
            <span class="stat-label">PRODUCTOS TOTALES</span>
            <span class="stat-value text-primary">{{ totalProductos }}</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat-block">
            <span class="stat-label">PEDIDOS</span>
            <span class="stat-value text-orange-9">{{ totalComandasActivas }}</span>
          </div>
        </div>

        <q-btn
          v-if="!ticketAbierto"
          unelevated
          color="primary"
          icon="add_circle"
          label="Nuevo Pedido"
          class="text-weight-bold"
          style="border-radius: 12px"
          @click="ticketAbierto = true"
        />
      </div>
    </div>

    <!-- Columna derecha: panel del ticket -->
    <transition name="slide-ticket">
      <TicketPanel
        v-if="ticketAbierto"
        :items="itemsTicket"
        :enviando="enviando"
        @cancelar="cancelarOrden"
        @cambiar-cantidad="cambiarCantidad"
        @editar-notas="abrirNotasDialog"
        @pagar="abrirModalPago"
      />
    </transition>

    <!-- Dialog de notas especiales -->
    <q-dialog v-model="notasDialog">
      <q-card style="min-width: 320px; border-radius: 16px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Notas especiales</div>
          <div class="text-grey-6 text-caption">{{ itemEditando?.producto.nombre }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="notasTemp"
            outlined
            autofocus
            placeholder="Ej: Sin cebolla, extra salsa..."
            type="textarea"
            rows="3"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            label="Guardar"
            color="primary"
            style="border-radius: 8px"
            @click="guardarNotas"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL DE PAGO MULTIMODAL CON EL TOTAL REAL -->
    <PaymentModal
      v-model="modalPagoAbierto"
      :total-to-pay="totalTicket"
      @pago-exitoso="limpiarCaja"
    />
  </div>
</template>

<script setup lang="ts">
// 1. IMPORTACIONES FUSIONADAS Y LIMPIAS
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

// Componentes
import ProductoCard from '@/components/comandas/ProductoCard.vue'
import TicketPanel from '@/components/comandas/TicketPanel.vue'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'

// Types, Stores y Services
import { type ItemTicket } from '@/components/comandas/TicketItem.vue'
import { obtenerProductos } from '@/services/productoService'
import { crearComanda, obtenerComandas } from '@/services/comandaService'
import { useComandasSocket } from '@/composables/useComandasSocket'
import { useAuthStore } from '@/stores/auth'
import type { Producto, TipoProducto } from '@/types/producto'
import type {
  Comanda,
  ComandaWsMessage,
  CrearComandaRequest,
  DetalleComandaRequest,
} from '@/types/comanda'

// 2. ESTADO DEL MODAL DE PAGO
const modalPagoAbierto = ref(false)

const abrirModalPago = () => {
  modalPagoAbierto.value = true
}

const $q = useQuasar()
const authStore = useAuthStore()
const props = defineProps<{ searchTerm?: string }>()
const abortController = new AbortController()

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
const enviando = ref(false)
const ticketAbierto = ref(false)
const productos = ref<Producto[]>([])
const comandasActivas = ref<Comanda[]>([])
const itemsTicket = ref<ItemTicket[]>([])

// Dialog de notas
const notasDialog = ref(false)
const notasTemp = ref('')
const itemEditando = ref<ItemTicket | null>(null)

// La caja solo muestra A (Alimento) y B (Bebida).
const listaCategorias: { value: TipoProducto | 'Todos'; label: string }[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'A', label: 'Alimentos' },
  { value: 'B', label: 'Bebidas' },
]
const categoriaSeleccionada = ref<TipoProducto | 'Todos'>('Todos')

const productosFiltrados = computed(() => {
  const term = (props.searchTerm ?? '').trim().toLowerCase()
  let base = productos.value.filter((p) => p.tipo === 'A' || p.tipo === 'B' || p.es_combo)
  if (categoriaSeleccionada.value !== 'Todos') {
    base = base.filter((p) => p.tipo === categoriaSeleccionada.value)
  }
  if (term) {
    base = base.filter(
      (p) =>
        (p.nombre ?? '').toLowerCase().includes(term) ||
        (p.descripcion ?? '').toLowerCase().includes(term),
    )
  }
  return base
})

const totalProductos = computed(
  () => productos.value.filter((p) => p.tipo === 'A' || p.tipo === 'B' || p.es_combo).length,
)
const totalComandasActivas = computed(() => comandasActivas.value.length)

// Calcula el total sumando el precio por la cantidad de cada producto en el ticket
const totalTicket = computed(() => {
  return itemsTicket.value.reduce(
    (suma, item) => suma + item.producto.precio_unitario * item.cantidad,
    0,
  )
})

const limpiarCaja = () => {
  // Vaciamos la lista de lo que se le cobró al cliente
  itemsTicket.value = []

  // Opcional: Si usas esta variable para saber si hay una venta activa, la regresamos a falso
  ticketAbierto.value = false
}

// WebSocket
function handleMensajeSocket(msg: ComandaWsMessage) {
  const idx = comandasActivas.value.findIndex((c) => c.id === msg.comanda.id)
  if (idx === -1) {
    comandasActivas.value = [...comandasActivas.value, msg.comanda]
  } else {
    comandasActivas.value = comandasActivas.value.map((c) =>
      c.id === msg.comanda.id ? msg.comanda : c,
    )
  }
}
useComandasSocket(handleMensajeSocket)

// Acciones del catálogo
const seleccionarCategoria = (cat: TipoProducto | 'Todos') => {
  categoriaSeleccionada.value = cat
}

const agregarAlTicket = (producto: Producto) => {
  ticketAbierto.value = true
  const existente = itemsTicket.value.find((i) => i.producto.id === producto.id)
  if (existente) {
    existente.cantidad++
  } else {
    itemsTicket.value.push({ producto, cantidad: 1, notas: '' })
  }
}

// Acciones del ticket
const cancelarOrden = () => {
  itemsTicket.value = []
  ticketAbierto.value = false
}

const cambiarCantidad = (item: ItemTicket, delta: number) => {
  item.cantidad += delta
  if (item.cantidad <= 0) {
    itemsTicket.value = itemsTicket.value.filter((i) => i.producto.id !== item.producto.id)
    if (itemsTicket.value.length === 0) ticketAbierto.value = false
  }
}

const abrirNotasDialog = (item: ItemTicket) => {
  itemEditando.value = item
  notasTemp.value = item.notas
  notasDialog.value = true
}

const guardarNotas = () => {
  if (itemEditando.value) itemEditando.value.notas = notasTemp.value
  notasDialog.value = false
}

// Pago Original (Para enviar a cocina)
const obtenerMensajeError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      { detail?: string | string[]; message?: string; error?: string } | undefined
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) return data.detail.join(', ')
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (err.response?.status) return `Error HTTP ${err.response.status}`
  }
  return err instanceof Error ? err.message : 'No se pudo enviar la comanda.'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const procesarPago = async () => {
  if (itemsTicket.value.length === 0 || enviando.value) return

  if (!authStore.currentBranchId) {
    $q.notify({
      type: 'negative',
      message: 'No hay una sucursal activa en la sesión.',
      position: 'top-right',
    })
    return
  }

  enviando.value = true

  const detalles: DetalleComandaRequest[] = itemsTicket.value.map((item) => ({
    producto_id: item.producto.id,
    nombre: item.producto.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.producto.precio_unitario,
    subtotal: item.producto.precio_unitario * item.cantidad,
    notas_especiales: item.notas || undefined,
  }))

  const payload: CrearComandaRequest = {
    ticket_numero: `TICK-${String(Date.now() % 10000).padStart(4, '0')}`,
    total_final: itemsTicket.value.reduce((s, i) => s + i.producto.precio_unitario * i.cantidad, 0),
    //sucursal_id: authStore.currentBranchId,
    estado_actual: 'P',
    detalles_comanda: detalles,
  }

  try {
    await crearComanda(payload)
    $q.notify({
      type: 'positive',
      message: '¡Pedido enviado a cocina!',
      caption: `${itemsTicket.value.length} producto(s) en camino`,
      position: 'top-right',
      timeout: 2500,
      icon: 'check_circle',
    })
    cancelarOrden()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error al enviar el pedido',
      caption: obtenerMensajeError(err),
      position: 'top-right',
      timeout: 4000,
    })
    console.error('[CajaComponent] procesarPago:', err)
  } finally {
    enviando.value = false
  }
}

// Carga inicial
const cargarProductos = async () => {
  if (!authStore.currentBranchId) {
    error.value = 'No hay una sucursal activa en la sesión.'
    return
  }
  loading.value = true
  error.value = null
  try {
    const resultado = await obtenerProductos(abortController.signal)
    if (!abortController.signal.aborted) productos.value = resultado
  } catch (err) {
    if (!abortController.signal.aborted) {
      error.value = 'No se pudieron cargar los productos.'
      console.error('[CajaComponent] cargarProductos:', err)
    }
  } finally {
    if (!abortController.signal.aborted) loading.value = false
  }
}

const cargarComandasActivas = async () => {
  try {
    comandasActivas.value = await obtenerComandas(abortController.signal)
  } catch (err) {
    if (!abortController.signal.aborted)
      console.error('[CajaComponent] cargarComandasActivas:', err)
  }
}

onMounted(() => {
  void cargarProductos()
  void cargarComandasActivas()
})
onBeforeUnmount(() => abortController.abort())
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.caja-root {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
  background-color: #f5f6f7;
}

.caja-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.caja-header {
  background: #fff;
  padding: 14px 32px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.caja-header__titulo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-primary);
  margin: 0;
}
.caja-header__sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.caja-cats {
  display: flex;
  gap: 8px;
  padding: 12px 32px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  flex-shrink: 0;
}
.cat-pill {
  background-color: #e2e8f0;
  color: #64748b;
  border: none;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.cat-pill:hover {
  background-color: #cbd5e1;
}
.cat-pill--active {
  background-color: #0059bb;
  color: #fff;
}

.caja-productos {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px;
}

.caja-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}

.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
}

.caja-footer {
  background: #fff;
  border-top: 1px solid #e2e8f0;
  padding: 10px 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.caja-footer__stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}
.stat-sep {
  width: 1px;
  height: 28px;
  background-color: #e2e8f0;
}

.slide-ticket-enter-active,
.slide-ticket-leave-active {
  transition: all 0.25s ease;
}
.slide-ticket-enter-from,
.slide-ticket-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
