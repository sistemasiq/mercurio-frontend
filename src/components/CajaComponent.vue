<template>
  <div class="caja-root">
    <!-- Columna izquierda: catálogo -->
    <div class="caja-col">
      <div class="caja-header row items-center justify-between">
        <div>
          <h1 class="caja-header__titulo">Estación Principal</h1>
          <div class="caja-header__sub">Terminal #01 | Cajero: {{ turno.cajeroNombre || '—' }}</div>
        </div>

        <!-- Acciones y estado del turno -->
        <div class="row items-center q-gutter-x-sm">
          <q-chip
            v-if="turno.estaOperando"
            dense
            color="teal-1"
            text-color="teal-9"
            icon="check_circle"
            class="text-weight-bold"
          >
            Turno Activo (${{ turno.fondoInicial.toLocaleString('es-MX') }})
          </q-chip>
          <q-chip
            v-else
            dense
            color="amber-2"
            text-color="amber-10"
            icon="warning"
            class="text-weight-bold"
          >
            Sin Turno Activo
          </q-chip>

          <q-btn
            v-if="turno.estaOperando"
            outline
            dense
            no-caps
            color="primary"
            icon="point_of_sale"
            label="Cierre de Caja"
            class="q-px-sm"
            @click="router.push('/pos/cierre')"
          />
          <q-btn
            v-else
            unelevated
            dense
            no-caps
            color="positive"
            icon="key"
            label="Abrir Caja"
            class="q-px-sm"
            @click="router.push('/pos/cierre')"
          />
        </div>
      </div>

      <!-- Banner de aviso si no hay turno activo -->
      <q-banner v-if="turno.sinTurno" class="bg-amber-1 text-amber-10 q-mx-md q-mt-md" rounded>
        <template #avatar><q-icon name="info" color="amber-9" /></template>
        No hay un turno de caja activo. Es necesario realizar la
        <strong>Apertura de Caja</strong> antes de procesar comandas.
        <template #action>
          <q-btn
            flat
            no-caps
            color="primary"
            label="Ir a Apertura de Caja"
            @click="router.push('/pos/cierre')"
          />
        </template>
      </q-banner>

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
            <span class="stat-value text-primary" :class="{ 'stat-pulse': pulseProductos }">{{
              totalProductos
            }}</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat-block">
            <span class="stat-label">PEDIDOS</span>
            <span class="stat-value text-orange-9" :class="{ 'stat-pulse': pulsePedidos }">{{
              totalComandasActivas
            }}</span>
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
        @cancelar="cancelarTicket"
        @cambiar-cantidad="cambiarCantidad"
        @editar-notas="abrirNotasDialog"
        @split-combo="handleSplitCombo"
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
            @click="() => guardarNotas(itemEditando!, notasTemp)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL DE PAGO MULTIMODAL CON EL TOTAL REAL -->
    <PaymentModal
      v-model="modalPagoAbierto"
      :total-to-pay="totalTicket"
      @pago-exitoso="onPagoExitoso"
    />

    <!-- MODALES DE PERSONALIZACIÓN -->
    <ProductNoteModal v-model="notasDialog" :item="itemEditando" @guardar="guardarNotasLocal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import ProductoCard from '@/components/comandas/ProductoCard.vue'
import TicketPanel from '@/components/comandas/TicketPanel.vue'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import ProductNoteModal from '@/components/comandas/ProductNoteModal.vue'
import type { ItemTicket } from '@/components/comandas/TicketItem.vue'
import { pagosApi } from '@/api/pagosApi'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import { useComandasSocket } from '@/composables/useComandasSocket'
import { useTicketComanda } from '@/composables/useTicketComanda'
import { useCajaMetrics } from '@/composables/useCajaMetrics'
import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import type { TipoProducto } from '@/types/producto'
import type { MetodosPago } from '@/types/metodos_pago'
import type { AppliedPayment, PagoCompletoRequest } from '@/types/payments'
import type { ComandaWsMessage, DetalleComandaRequest } from '@/types/comanda'

const modalPagoAbierto = ref(false)
const abrirModalPago = () => {
  modalPagoAbierto.value = true
}

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const turno = useTurnoCajaStore()
const props = defineProps<{ searchTerm?: string }>()
const abortController = new AbortController()

const { itemsTicket, agregarProducto, splitCombo, cambiarCantidad, cancelarOrden, guardarNotas } =
  useTicketComanda()

const { comandasActivas, productos, refrescarComandas } = useCajaMetrics()

const loading = ref(false)
const error = ref<string | null>(null)
const enviando = ref(false)
const ticketAbierto = ref(false)
const metodosPagoDisponibles = ref<MetodosPago[]>([])

const notasDialog = ref(false)
const itemEditando = ref<ItemTicket | null>(null)
const notasTemp = ref('')

// La caja solo muestra A (Alimento), B (Bebida) y combos.
const listaCategorias: { value: TipoProducto | 'Todos'; label: string }[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'A', label: 'Alimentos' },
  { value: 'B', label: 'Bebidas' },
  { value: 'C', label: 'Combos' },
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

const totalTicket = computed(() => {
  return itemsTicket.value.reduce(
    (suma, item) => suma + item.producto.precio_unitario * item.cantidad,
    0,
  )
})

// ── Pulse animation on stat changes ────────────────────────────────
const pulseProductos = ref(false)
const pulsePedidos = ref(false)

watch(totalProductos, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    pulseProductos.value = true
    setTimeout(() => {
      pulseProductos.value = false
    }, 600)
  }
})
watch(totalComandasActivas, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    pulsePedidos.value = true
    setTimeout(() => {
      pulsePedidos.value = false
    }, 600)
  }
})

// ── WebSocket ──────────────────────────────────────────────────────
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

const seleccionarCategoria = (cat: TipoProducto | 'Todos') => {
  categoriaSeleccionada.value = cat
}

const agregarAlTicket = async (producto: ReturnType<typeof Object> & { id: string }) => {
  ticketAbierto.value = true
  const ok = await agregarProducto(producto as Parameters<typeof agregarProducto>[0])
  if (!ok) {
    $q.notify({
      type: 'negative',
      message: 'No se pudieron cargar los hijos del combo.',
      position: 'top-right',
    })
  }
}

const cancelarTicket = () => {
  cancelarOrden()
  ticketAbierto.value = false
}

const handleSplitCombo = async (item: ItemTicket) => {
  await splitCombo(item)
}

function promptSplitThenEdit(item: ItemTicket) {
  $q.dialog({
    title: 'Dividir combo',
    message: `Este combo tiene cantidad ${item.cantidad}. ¿Quieres dividirlo para personalizar una unidad independiente?`,
    cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
    ok: { label: 'Dividir y personalizar', color: 'blue-7' },
    persistent: true,
  }).onOk(async () => {
    const nuevo = await splitCombo(item)
    if (nuevo) {
      itemEditando.value = nuevo
      notasDialog.value = true
    }
  })
}

const abrirNotasDialog = (item: ItemTicket) => {
  const esComboConMultiples = item.producto.es_combo && !item.es_hijo_combo && item.cantidad > 1
  if (esComboConMultiples) {
    promptSplitThenEdit(item)
    return
  }
  itemEditando.value = item
  notasTemp.value = item.notas ?? ''
  notasDialog.value = true
}

const guardarNotasLocal = (item: ItemTicket, notas: string) => {
  guardarNotas(item, notas)
}

// ── Pago multimodal ────────────────────────────────────────────────
const onPagoExitoso = (pagos: AppliedPayment[]) => {
  void procesarPago(pagos)
}

const mapearMetodoPago = (nombreMetodo: string): string => {
  if (!metodosPagoDisponibles.value || metodosPagoDisponibles.value.length === 0) {
    throw new Error('Los métodos de pago no se han cargado correctamente desde el servidor.')
  }
  const metodo = metodosPagoDisponibles.value.find(
    (m) => m.nombre.trim().toLowerCase() === nombreMetodo.trim().toLowerCase() && m.activo,
  )
  if (!metodo) {
    const disponibles = metodosPagoDisponibles.value
      .map((m) => `${m.nombre.trim()} (${m.activo ? 'activo' : 'inactivo'})`)
      .join(', ')
    const detalle = `Método buscado: "${nombreMetodo}". Métodos disponibles: [${disponibles}]`
    console.error(`[mapearMetodoPago] ${detalle}`)
    throw new Error(
      `El método de pago "${nombreMetodo}" no está configurado o no está activo. ${detalle}`,
    )
  }
  return metodo.id
}

// Pago
const procesarPago = async (pagos: AppliedPayment[]) => {
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

  try {
    const detalles: DetalleComandaRequest[] = itemsTicket.value.map((item) => ({
      producto_id: item.producto.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio_unitario,
      subtotal: item.producto.precio_unitario * item.cantidad,
      notas_especiales: item.notas || undefined,
      nombre_combo_padre: item.nombre_combo_padre || undefined,
      es_hijo_de: item.es_hijo_de || undefined,
      es_hijo_combo: item.es_hijo_combo || undefined,
    }))

    const totalFinal = itemsTicket.value
      .filter((i) => !i.es_hijo_combo)
      .reduce((s, i) => s + i.producto.precio_unitario * i.cantidad, 0)

    const payload: PagoCompletoRequest = {
      ticket_numero: `TICK-${String(Date.now() % 10000).padStart(4, '0')}`,
      total_final: totalFinal,
      detalles_comanda: detalles,
      pagos: pagos.map((p) => ({
        metodo_pago_id: mapearMetodoPago(p.method),
        monto: p.amount,
        notas_pago: p.cardType ? `${p.cardType} - Folio: ${p.authCode ?? ''}` : '',
      })),
    }

    const comanda = await pagosApi.completarPago(payload)

    $q.notify({
      type: 'positive',
      message: '¡Pedido enviado a cocina!',
      caption: `Comanda ${comanda.id.slice(0, 8)} · ${itemsTicket.value.length} producto(s) en camino`,
      position: 'top-right',
      timeout: 2500,
      icon: 'check_circle',
    })

    cancelarTicket()

    // Actualización optimista: refrescar comandas de inmediato
    void refrescarComandas()
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      console.error(
        '[CajaComponent] backend error detail:',
        err.response.data.detail ?? err.response.data,
      )
    }
    $q.notify({
      type: 'negative',
      message: 'Error al procesar el pago',
      caption: resolveErrorMessage(err as ApiError),
      position: 'top-right',
      timeout: 4000,
    })
    console.error('[CajaComponent] procesarPago:', err)
  } finally {
    enviando.value = false
  }
}

// Carga inicial de productos (comandas ya las maneja useCajaMetrics)
const cargarProductos = async () => {
  if (!authStore.currentBranchId) {
    error.value = 'No hay una sucursal activa en la sesión.'
    return
  }
  loading.value = true
  error.value = null
  try {
    const resultado = await import('@/services/productoService').then((m) =>
      m.obtenerProductos(abortController.signal),
    )
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

const cargarMetodosPago = async () => {
  try {
    metodosPagoDisponibles.value = await metodosPagoApi.listar()
  } catch (err) {
    if (!abortController.signal.aborted) {
      console.error('[CajaComponent] cargarMetodosPago:', err)
      $q.notify({
        type: 'warning',
        message: 'No se pudieron cargar los métodos de pago.',
        caption: 'El cobro multimodal no estará disponible hasta recargar la página.',
        position: 'top-right',
        timeout: 6000,
      })
    }
  }
}

void cargarProductos()
void cargarMetodosPago()
void turno.cargarTurnoActivo()

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
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.stat-pulse {
  animation: stat-pulse-anim 0.6s ease;
}
@keyframes stat-pulse-anim {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.25);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
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
