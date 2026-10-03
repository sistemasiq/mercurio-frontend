<template>
  <div class="caja-root">
    <section class="caja-col">
      <!-- El catálogo y el armado del pedido se pueden usar sin turno abierto;
           lo único que se bloquea es el cobro (ver abrirModalPago), que redirige
           a Apertura de Caja en vez de dejar pagar sin turno. -->
      <div class="caja-top">
        <q-input
          v-model="busqueda"
          outlined
          clearable
          placeholder="Buscar producto"
          class="caja-search"
          aria-label="Buscar producto"
        >
          <template #prepend><q-icon name="search" size="20px" /></template>
        </q-input>
        <div class="caja-cats" role="tablist">
          <button
            v-for="cat in listaCategorias"
            :key="cat.value"
            type="button"
            role="tab"
            class="cat-pill"
            :class="{ 'cat-pill--active': categoriaSeleccionada === cat.value }"
            :aria-selected="categoriaSeleccionada === cat.value"
            @click="seleccionarCategoria(cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div class="caja-productos">
        <div v-if="loading" class="caja-grid">
          <q-skeleton v-for="n in 8" :key="n" type="rect" height="150px" class="caja-skeleton" />
        </div>

        <StateBlock
          v-else-if="error"
          variant="error"
          body="No se pudieron cargar los productos. Intenta de nuevo."
          action-label="Reintentar"
          @action="cargarProductos"
        />

        <StateBlock
          v-else-if="!productosFiltrados.length"
          variant="no-results"
          :title="busqueda ? `Sin resultados para &quot;${busqueda}&quot;` : 'Sin productos'"
          :body="
            busqueda
              ? 'Prueba con otro término o cambia de categoría.'
              : 'No hay productos en esta categoría.'
          "
        />

        <div v-else class="caja-grid">
          <ProductoCard
            v-for="producto in productosFiltrados"
            :key="producto.id"
            :producto="producto"
            :rinde="rindePorProducto.get(producto.id) ?? null"
            @agregar="agregarAlTicket"
          />
        </div>
      </div>

      <footer v-if="comandasEnCurso.length" class="caja-comandas">
        <span class="caja-comandas__label">Comandas en curso</span>
        <div class="caja-comandas__list">
          <router-link
            v-for="c in comandasEnCurso"
            :key="c.id"
            :to="{ name: 'pos-cocina' }"
            class="comanda-chip"
            :class="c.estado_actual === 'L' ? 'comanda-chip--ok' : 'comanda-chip--warn'"
          >
            <span class="comanda-chip__dot" />
            {{ etiquetaComanda(c) }} · {{ c.estado_actual === 'L' ? 'Lista' : 'En cocina' }}
          </router-link>
        </div>
      </footer>
    </section>

    <TicketPanel
      v-if="ticketAbierto"
      :items="itemsTicket"
      :enviando="enviando"
      :nombre-cliente="nombreCliente"
      @cancelar="cancelarTicket"
      @cambiar-cantidad="cambiarCantidad"
      @editar-notas="abrirNotasDialog"
      @split-combo="handleSplitCombo"
      @pagar="abrirModalPago"
      @actualizar-nombre="actualizarNombreCliente"
    />
    <aside v-else class="caja-idle">
      <span class="caja-idle__icon"><q-icon name="receipt_long" size="28px" /></span>
      <span class="caja-idle__title">Sin pedido abierto</span>
      <span class="caja-idle__text">Inicia un pedido o toca un producto para empezar.</span>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nuevo pedido"
        @click="iniciarNuevoPedido"
      />
    </aside>

    <PaymentModal
      v-model="modalPagoAbierto"
      titulo="Cobrar pedido"
      :subtitulo="nombreCliente"
      :total-to-pay="totalTicket"
      :metodos-pago="metodosPagoDisponibles"
      @pago-exitoso="onPagoExitoso"
    />

    <q-dialog
      v-model="ticketPostPagoAbierto"
      persistent
      full-width
      full-height
      no-route-dismiss
      class="ticket-dialog"
    >
      <DetalleOrdenPagada
        v-if="comandaPagadaId"
        :comanda-id="comandaPagadaId"
        :pos-mode="true"
        @close="onCerrarTicket"
      />
    </q-dialog>

    <ProductNoteModal v-model="notasDialog" :item="itemEditando" @guardar="guardarNotasLocal" />

    <BaseDialog
      v-model="splitDialog"
      title="Dividir combo"
      :subtitle="splitItem ? `${splitItem.producto.nombre} × ${splitItem.cantidad}` : ''"
      icon="call_split"
      tone="amber"
      :width="460"
      secondary-label="No, mantener"
      primary-label="Dividir"
      @confirm="confirmarSplit"
    >
      Este combo tiene cantidad {{ splitItem?.cantidad }}. ¿Quieres dividirlo para personalizar una
      unidad independiente?
    </BaseDialog>

    <!-- MODAL DE INGRESO DE EFECTIVO PREVENTIVO -->
    <IngresoEfectivoModal
      v-if="pagosPendientes"
      v-model="mostrarModalIngreso"
      :cambio-requerido="pagosPendientes.cambio"
      @ingreso-exitoso="onIngresoExitoso"
      @cancelar="onCancelarIngreso"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import ProductoCard from '@/components/comandas/ProductoCard.vue'
import TicketPanel from '@/components/comandas/TicketPanel.vue'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import IngresoEfectivoModal from '@/components/shared/payments/IngresoEfectivoModal.vue'
import ProductNoteModal from '@/components/comandas/ProductNoteModal.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import DetalleOrdenPagada from '@/components/historial/DetalleOrdenPagada.vue'
import type { ItemTicket } from '@/components/comandas/TicketItem.vue'
import { pagosApi } from '@/api/pagosApi'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import { useComandasSocket } from '@/composables/useComandasSocket'
import { useTicketComanda } from '@/composables/useTicketComanda'
import { useCajaMetrics } from '@/composables/useCajaMetrics'
import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useInsumosStore } from '@/stores/insumos'
import { calcularRindePorProducto } from '@/utils/estimacionRinde'
import { isTimeoutError, resolveErrorMessage } from '@/utils/errorHandler'
import { redondear2 } from '@/utils/dinero'
import type { ApiError } from '@/types/auth'
import type { TipoProducto } from '@/types/producto'
import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'
import type { AppliedPayment, PagoCompletoRequest } from '@/types/payments'
import type { Comanda, ComandaWsMessage } from '@/types/comanda'
import BaseDialog from '@/components/ui/BaseDialog.vue'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const turno = useTurnoCajaStore()

const modalPagoAbierto = ref(false)
// Clave de idempotencia del ticket en curso: se genera al abrir el cobro y se
// reutiliza en cada reintento; solo se regenera al iniciar un ticket nuevo.
let idempotencyKey: string | null = null
const comandaPagadaId = ref<string | null>(null)
const ticketPostPagoAbierto = ref(false)

interface PagosPendientes {
  pagos: AppliedPayment[]
  celularCliente: string | null
  puntosARedimir: number
  descuentoPuntos: number
  cambio: number
}
const mostrarModalIngreso = ref(false)
const pagosPendientes = ref<PagosPendientes | null>(null)
const abrirModalPago = () => {
  if (itemsTicket.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Agrega productos al pedido antes de cobrar.',
      position: 'top',
      timeout: 3000,
    })
    return
  }
  // El turno pudo haberse cerrado entre "Nuevo Pedido" y este punto — mismo
  // redirect silencioso, sin bloquear ni avisar, como defensa adicional.
  if (!turno.estaOperando) {
    void router.push('/pos/cierre')
    return
  }
  if (!nombreCliente.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Debes ingresar un nombre para el pedido antes de cobrar.',
      position: 'top',
      timeout: 3000,
    })
    return
  }
  idempotencyKey ??= crypto.randomUUID()
  modalPagoAbierto.value = true
}
const props = defineProps<{ searchTerm?: string }>()
const abortController = new AbortController()

const {
  itemsTicket,
  agregarProducto,
  splitCombo,
  cambiarCantidad,
  cancelarOrden,
  guardarNotas,
  detallesParaEnvio,
  nombreCliente,
} = useTicketComanda()

const { comandasActivas, productos, refrescarComandas } = useCajaMetrics()

const insumosStore = useInsumosStore()

// Rinde estimado por producto A/B (unidades preparables con el stock actual),
// para avisar en el catálogo antes de cobrar. El bloqueo duro real sigue en el
// backend al crear la comanda; esto solo evita el camino de cobrar-y-fallar.
const rindePorProducto = computed(() =>
  calcularRindePorProducto(insumosStore.insumos, insumosStore.estimaciones),
)

const loading = ref(false)
const error = ref<string | null>(null)
const enviando = ref(false)
const ticketAbierto = ref(false)
const metodosPagoDisponibles = ref<MetodosPago[]>([])

const iniciarNuevoPedido = () => {
  // Se valida al hacer clic en "Nuevo Pedido", no hasta el cobro: sin turno
  // abierto no tiene sentido dejar armar todo el ticket para enterarse hasta
  // el final. Redirige de inmediato, sin bloquear ni avisar.
  if (!turno.estaOperando) {
    void router.push('/pos/cierre')
    return
  }
  ticketAbierto.value = true
}

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

const busqueda = ref('')

const productosFiltrados = computed(() => {
  const term = (busqueda.value || props.searchTerm || '').trim().toLowerCase()
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

// Barra inferior "Comandas en curso": pendientes, en preparación y listas.
const comandasEnCurso = computed(() =>
  comandasActivas.value.filter((c) => ['P', 'E', 'L'].includes(c.estado_actual)),
)

function etiquetaComanda(c: Comanda): string {
  const folio = c.ticket_numero ?? c.folio ?? ''
  const destino = c.mesa ? `Mesa ${c.mesa}` : (c.nombre_cliente ?? '')
  return [folio && `#${folio}`, destino].filter(Boolean).join(' ')
}

const totalTicket = computed(() => {
  return redondear2(
    itemsTicket.value.reduce(
      (suma, item) => suma + redondear2(item.producto.precio_unitario * item.cantidad),
      0,
    ),
  )
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
  if (rindePorProducto.value.get(producto.id) === 0) {
    $q.notify({
      type: 'warning',
      message: `Sin stock para «${(producto as { nombre?: string }).nombre ?? 'este producto'}»`,
      caption: 'Falta algún insumo de su receta. Revisa inventario antes de venderlo.',
      position: 'top-right',
      timeout: 4000,
    })
    return
  }
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
  idempotencyKey = null
  cancelarOrden()
  ticketAbierto.value = false
  nombreCliente.value = ''
}

const actualizarNombreCliente = (nombre: string) => {
  nombreCliente.value = nombre
}

const onCerrarTicket = () => {
  ticketPostPagoAbierto.value = false
  comandaPagadaId.value = null
  cancelarTicket()
}

const notificarErrorSplit = (err: unknown) => {
  console.error('[CajaComponent] splitCombo:', err)
  $q.notify({
    type: 'negative',
    message: 'No se pudo separar el combo.',
    caption: resolveErrorMessage(err as ApiError),
    position: 'top-right',
  })
}

const handleSplitCombo = async (item: ItemTicket) => {
  try {
    await splitCombo(item)
  } catch (err) {
    notificarErrorSplit(err)
  }
}

const splitDialog = ref(false)
const splitItem = ref<ItemTicket | null>(null)

function promptSplitThenEdit(item: ItemTicket) {
  splitItem.value = item
  splitDialog.value = true
}

async function confirmarSplit() {
  const item = splitItem.value
  splitDialog.value = false
  if (!item) return
  let nuevo: ItemTicket | null
  try {
    nuevo = await splitCombo(item)
  } catch (err) {
    notificarErrorSplit(err)
    return
  }
  if (nuevo) {
    itemEditando.value = nuevo
    notasDialog.value = true
  }
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
const onPagoExitoso = (
  pagos: AppliedPayment[],
  celularCliente: string | null,
  puntosARedimir: number,
  descuentoPuntos: number,
  cambio: number,
) => {
  if (cambio > 0 && cambio > turno.efectivoDisponible) {
    pagosPendientes.value = { pagos, celularCliente, puntosARedimir, descuentoPuntos, cambio }
    modalPagoAbierto.value = false
    mostrarModalIngreso.value = true
    return
  }
  void procesarPago(pagos, celularCliente, puntosARedimir, descuentoPuntos, cambio)
}

const onIngresoExitoso = () => {
  if (!pagosPendientes.value) return
  const p = pagosPendientes.value
  if (p.cambio > turno.efectivoDisponible) return
  mostrarModalIngreso.value = false
  pagosPendientes.value = null
  void procesarPago(p.pagos, p.celularCliente, p.puntosARedimir, p.descuentoPuntos, p.cambio)
}

const onCancelarIngreso = () => {
  mostrarModalIngreso.value = false
  pagosPendientes.value = null
}

const mapearMetodoPago = (categoriaSeleccionada: string): string => {
  if (!metodosPagoDisponibles.value || metodosPagoDisponibles.value.length === 0) {
    throw new Error('Los métodos de pago no se han cargado correctamente desde el servidor.')
  }
  const categoria = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoriaSeleccionada)
  const metodo = metodosPagoDisponibles.value.find((m) => m.activo && m.tipo === categoria?.tipo)
  if (!metodo) {
    const detalle = `No hay un método de pago activo de tipo "${categoriaSeleccionada}" configurado para esta sucursal.`
    console.error(`[mapearMetodoPago] ${detalle}`)
    throw new Error(detalle)
  }
  return metodo.id
}

// Pago
const procesarPago = async (
  pagos: AppliedPayment[],
  celularCliente: string | null,
  puntosARedimir: number,
  descuentoPuntos: number,
  cambio: number,
) => {
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
    const detalles = detallesParaEnvio()

    const totalBruto = itemsTicket.value
      .filter((i) => !i.es_hijo_combo)
      .reduce((s, i) => s + redondear2(i.producto.precio_unitario * i.cantidad), 0)
    const totalFinal = redondear2(totalBruto - descuentoPuntos)

    const payload: PagoCompletoRequest = {
      // TODO backend: folio secuencial por sucursal
      ticket_numero: `TICK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      total_final: totalFinal,
      detalles_comanda: detalles,
      pagos: pagos.map((p) => ({
        metodo_pago_id: mapearMetodoPago(p.method),
        monto: p.amount,
        notas_pago: p.cardType ? `${p.cardType} - Folio: ${p.authCode ?? ''}` : '',
      })),
      ...(celularCliente ? { celular_cliente: celularCliente } : {}),
      ...(puntosARedimir > 0 ? { puntos_a_redimir: puntosARedimir } : {}),
      ...(cambio > 0 ? { cambio } : {}),
      ...(nombreCliente.value.trim() ? { nombre_cliente: nombreCliente.value.trim() } : {}),
    }

    const comanda = await pagosApi.completarPago(payload, undefined, idempotencyKey ?? undefined)

    $q.notify({
      type: 'positive',
      message: '¡Pedido enviado a cocina!',
      caption: `${itemsTicket.value.length} producto(s) en camino`,
      position: 'top-right',
      timeout: 2500,
      icon: 'check_circle',
    })

    comandaPagadaId.value = comanda.id
    ticketPostPagoAbierto.value = true
    // Un pago exitoso consume la clave: si el cajero inicia otro ticket, debe
    // generarse una nueva al abrir el cobro, nunca reutilizar esta.
    idempotencyKey = null

    // Actualización optimista: refrescar comandas de inmediato
    void refrescarComandas()
    // Mantener efectivoDisponible actualizado con las ventas en efectivo del turno
    void turno.cargarTurnoActivo()
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      console.error(
        '[CajaComponent] backend error detail:',
        err.response.data.detail ?? err.response.data,
      )
    }
    const esTimeout = isTimeoutError(err)
    $q.notify({
      type: 'negative',
      message: 'Error al procesar el pago',
      caption: esTimeout
        ? 'No se confirmó el cobro. Verifica en el historial antes de reintentar.'
        : resolveErrorMessage(err as ApiError),
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

// refrescarTodo se llama en mount para initial load a través del composable
// pero productos se cargan por separado (no están en el composable)
void cargarProductos()
void cargarMetodosPago()
// El polling de useCajaMetrics tarda 15 s en su primera vuelta; la barra de
// "Comandas en curso" necesita datos desde el inicio.
void refrescarComandas()
void turno.cargarTurnoActivo(authStore.currentBranchId)
if (authStore.currentBranchId) {
  void insumosStore.cargar(authStore.currentBranchId)
  void insumosStore.cargarEstimaciones(authStore.currentBranchId)
}

onBeforeUnmount(() => abortController.abort())
</script>

<style scoped lang="scss">
.caja-root {
  display: flex;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
  background: var(--bg-main);
}

.caja-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.caja-top {
  padding: 24px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.caja-search {
  :deep(.q-field__control) {
    height: 44px;
    min-height: 44px;
    border-radius: 12px;
  }

  :deep(.q-field__marginal) {
    height: 44px;
    color: var(--text-secondary);
  }
}

.caja-cats {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.cat-pill {
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--border-input);
  background: #fff;
  color: var(--text-body);
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--bg-subtle);
  }

  &--active,
  &--active:hover {
    background: var(--text-strong);
    border-color: var(--text-strong);
    color: #fff;
  }
}

.caja-productos {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 24px;
}

.caja-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}

.caja-skeleton {
  border-radius: 12px;
}

.caja-comandas {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: #fff;
  border-top: 1px solid var(--border-color);

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }
}

.comanda-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  text-decoration: none;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
  }

  &--ok {
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);

    .comanda-chip__dot {
      background: var(--tone-ok-dot);
    }
  }

  &--warn {
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);

    .comanda-chip__dot {
      background: var(--tone-warn-dot);
    }
  }
}

.caja-idle {
  width: 380px;
  min-width: 380px;
  background: #fff;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: var(--tone-info-bg);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    max-width: 240px;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-secondary);
  }
}

@media (max-width: 900px) {
  .caja-idle {
    display: none;
  }
}

:deep(.ticket-dialog) {
  z-index: 3000 !important;
}
:deep(.ticket-dialog .q-dialog__inner) {
  background: transparent;
  padding: 0;
  align-items: stretch;
}
:deep(.ticket-dialog .q-card) {
  background: transparent;
  box-shadow: none;
  max-height: none;
  height: 100%;
  width: 100%;
  border-radius: 0;
}
</style>
