<template>
  <div class="kds-layout">
    <header class="kds-header">
      <div>
        <h2 class="kds-title">Visor de Cocina</h2>
        <p class="kds-subtitle">Órdenes activas para preparación</p>
      </div>
      <div class="kds-pills-container">
        <div class="kds-pill pill-pendientes">
          <span class="dot dot-pendientes"></span>
          <span>{{ totalPendientes }} Pendientes</span>
        </div>
        <div class="kds-pill pill-proceso">
          <span class="dot dot-proceso"></span>
          <span>{{ totalEnProceso }} En Preparación</span>
        </div>
        <div class="kds-pill pill-listos">
          <span class="dot dot-listos"></span>
          <span>{{ totalListos }} Listos</span>
        </div>
      </div>
    </header>

    <q-inner-loading :showing="loading">
      <q-spinner size="40px" color="primary" />
    </q-inner-loading>

    <q-banner v-if="error" class="bg-orange-1 text-orange-10 q-mb-lg" rounded>
      {{ error }}
    </q-banner>

    <div v-if="!loading && comandasEnCocina.length === 0" class="empty-state">
      <q-icon name="celebration" size="80px" color="grey-4" />
      <div class="empty-title">¡Cocina despejada!</div>
      <p class="empty-subtitle">No hay pedidos pendientes por preparar.</p>
    </div>

    <div v-else class="kds-grid">
      <TransitionGroup name="card-list" tag="div" class="kds-grid-inner">
        <ComandaCard
          v-for="comanda in comandasEnCocina"
          :key="comanda.id"
          :comanda="comanda"
          @cambiar-estado="onCambiarEstado"
          @ver-detalle="onVerDetalle"
        />
      </TransitionGroup>
    </div>

    <!-- Componente siempre montado: la apertura/cierre (v-show) y el cambio de
         comanda (cross-fade interno) se animan sin desmontar el DOM. -->
    <ComandaFullScreen
      :comanda="comandaSeleccionada"
      @close="cerrarDetalle"
      @cambiar-estado="onCambiarEstadoDesdeDetalle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { cambiarEstadoComanda, obtenerComandas } from '@/services/comandaService'
import { useComandasSocket } from '@/composables/useComandasSocket'
import type { Comanda, ComandaWsMessage, EstadoActualComanda } from '@/types/comanda'
import ComandaCard from './ComandaCard.vue'
import ComandaFullScreen from './ComandaFullScreen.vue'

const POLLING_FALLBACK_MS = 10000

const $q = useQuasar()
const comandas = ref<Comanda[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const requestController = ref<AbortController | null>(null)
const fallbackIntervalId = ref<number | null>(null)
const comandaSeleccionadaId = ref<string | null>(null)

const comandasEnCocina = computed(() =>
  comandas.value.filter((c) => ['P', 'E', 'L'].includes(c.estado_actual)),
)
const totalPendientes = computed(() => comandas.value.filter((c) => c.estado_actual === 'P').length)
const totalEnProceso = computed(() => comandas.value.filter((c) => c.estado_actual === 'E').length)
const totalListos = computed(() => comandas.value.filter((c) => c.estado_actual === 'L').length)

const comandaSeleccionada = computed(
  () => comandas.value.find((c) => c.id === comandaSeleccionadaId.value) ?? null,
)

const onVerDetalle = (comanda: Comanda) => {
  comandaSeleccionadaId.value = comanda.id
}

const cerrarDetalle = () => {
  comandaSeleccionadaId.value = null
}

// Cuando la comanda seleccionada sale del flujo de cocina (entregada/cancelada),
// se cierra la vista de pantalla completa automáticamente.
watch(comandaSeleccionada, (comanda) => {
  if (comanda && ['T', 'C'].includes(comanda.estado_actual)) cerrarDetalle()
})

const limpiarRequestActiva = () => {
  requestController.value?.abort()
  requestController.value = null
}

const fetchComandas = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  limpiarRequestActiva()

  const controller = new AbortController()
  requestController.value = controller

  try {
    const resultado = await obtenerComandas(controller.signal)
    if (!controller.signal.aborted) comandas.value = resultado
  } catch (err) {
    if (!controller.signal.aborted) {
      error.value = 'No fue posible actualizar la cocina.'
      console.error('[VisorCocina] fetchComandas:', err)
    }
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

const aplicarEstadoLocal = (comandaId: string, nuevoEstado: EstadoActualComanda) => {
  comandas.value = comandas.value.map((c) =>
    c.id === comandaId ? { ...c, estado_actual: nuevoEstado } : c,
  )
}

const onCambiarEstado = async (
  comandaId: string,
  nuevoEstado: EstadoActualComanda,
): Promise<boolean> => {
  // Retroceder a 'P' no tiene sentido de negocio; la guardia va en el cuerpo
  // para ser compatible con el emit de ComandaCard (contravarianza TS).
  if (nuevoEstado === 'P') return false

  try {
    await cambiarEstadoComanda(comandaId, nuevoEstado)
    // Actualización optimista: la comanda sale de la cola de cocina al instante.
    aplicarEstadoLocal(comandaId, nuevoEstado)
    return true
  } catch (err) {
    console.error('[VisorCocina] onCambiarEstado:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo actualizar el estado de la orden.',
      caption: 'Intenta nuevamente en unos segundos.',
      position: 'top-right',
      timeout: 3000,
    })
    return false
  }
}

// Flujo continuo desde la vista a pantalla completa: al entregar, salta a la
// siguiente comanda de la cola de cocina; si ya no hay más, regresa al tablero.
const onCambiarEstadoDesdeDetalle = async (
  comandaId: string,
  nuevoEstado: EstadoActualComanda,
): Promise<void> => {
  const cola = comandasEnCocina.value
  const idx = cola.findIndex((c) => c.id === comandaId)
  const siguiente = idx !== -1 && idx + 1 < cola.length ? cola[idx + 1] : null

  const ok = await onCambiarEstado(comandaId, nuevoEstado)
  if (!ok) return

  if (nuevoEstado === 'T') {
    if (siguiente) {
      comandaSeleccionadaId.value = siguiente.id
    } else {
      cerrarDetalle()
    }
  }
}

function handleMensajeSocket(msg: ComandaWsMessage) {
  const idx = comandas.value.findIndex((c) => c.id === msg.comanda.id)
  if (idx === -1) {
    comandas.value = [...comandas.value, msg.comanda]
  } else {
    const anterior = comandas.value[idx]
    const detallesPrevios = new Map(
      (anterior.detalles ?? []).map((detalle) => [detalle.id, detalle]),
    )

    const comandaFusionada = {
      ...msg.comanda,
      detalles: (msg.comanda.detalles ?? []).map((detalle) => ({
        ...detallesPrevios.get(detalle.id),
        ...detalle,
      })),
    }

    comandas.value = comandas.value.map((c) => (c.id === msg.comanda.id ? comandaFusionada : c))
  }
}

const socket = useComandasSocket(handleMensajeSocket)

watch(socket.estado, (estado) => {
  if (estado === 'caido' && fallbackIntervalId.value === null) {
    fallbackIntervalId.value = window.setInterval(() => void fetchComandas(), POLLING_FALLBACK_MS)
  } else if (estado !== 'caido' && fallbackIntervalId.value !== null) {
    window.clearInterval(fallbackIntervalId.value)
    fallbackIntervalId.value = null
  }
})

onMounted(() => void fetchComandas())

onBeforeUnmount(() => {
  limpiarRequestActiva()
  if (fallbackIntervalId.value !== null) {
    window.clearInterval(fallbackIntervalId.value)
    fallbackIntervalId.value = null
  }
})
</script>

<style lang="scss" scoped>
.kds-layout {
  background-color: var(--bg-main);
  min-height: calc(100vh - 64px);
  padding: 32px;
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
}

.kds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.kds-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}
.kds-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.kds-pills-container {
  display: flex;
  gap: 16px;
}
.kds-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-radius: 9999px;
  font-size: 20px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.pill-pendientes {
  background-color: var(--bg-card);
  color: var(--text-primary);
}
.dot-pendientes {
  background-color: var(--text-muted);
}
.pill-proceso {
  background-color: rgba(255, 193, 7, 0.16);
  color: #b45309;
}
.dot-proceso {
  background-color: #ffc107;
}
.pill-listos {
  background-color: rgba(63, 168, 52, 0.16);
  color: #2f7d27;
}
.dot-listos {
  background-color: #3fa834;
}

.kds-grid {
  flex: 1;
}
.kds-grid-inner {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 1440px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.card-list-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-list-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}
.card-list-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.card-list-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.empty-title {
  font-size: 24px;
  font-weight: 700;
  margin-top: 16px;
}
.empty-subtitle {
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
