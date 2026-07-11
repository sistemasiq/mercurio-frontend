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
      <ComandaCard
        v-for="comanda in comandasEnCocina"
        :key="comanda.id"
        :comanda="comanda"
        @cambiar-estado="onCambiarEstado"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { cambiarEstadoComanda, obtenerComandas } from '@/services/comandaService'
import { useComandasSocket } from '@/composables/useComandasSocket'
import type { Comanda, ComandaWsMessage, EstadoActualComanda } from '@/types/comanda'
import ComandaCard from './ComandaCard.vue'

const POLLING_FALLBACK_MS = 10000

const $q = useQuasar()
const comandas = ref<Comanda[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const requestController = ref<AbortController | null>(null)
const fallbackIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

const comandasEnCocina = computed(() =>
  comandas.value.filter((c) => ['P', 'E', 'L'].includes(c.estado_actual)),
)
const totalPendientes = computed(() => comandas.value.filter((c) => c.estado_actual === 'P').length)
const totalEnProceso = computed(() => comandas.value.filter((c) => c.estado_actual === 'E').length)
const totalListos = computed(() => comandas.value.filter((c) => c.estado_actual === 'L').length)

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

const onCambiarEstado = async (
  comandaId: string,
  nuevoEstado: EstadoActualComanda,
): Promise<void> => {
  // Retroceder a 'P' no tiene sentido de negocio; la guardia va en el cuerpo
  // para ser compatible con el emit de ComandaCard (contravarianza TS).
  if (nuevoEstado === 'P') return

  try {
    await cambiarEstadoComanda(comandaId, nuevoEstado)
  } catch (err) {
    console.error('[VisorCocina] onCambiarEstado:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo actualizar el estado de la orden.',
      caption: 'Intenta nuevamente en unos segundos.',
      position: 'top-right',
      timeout: 3000,
    })
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
  background-color: #f8f9fa;
  min-height: calc(100vh - 64px);
  padding: 32px;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: #191c1d;
}

.kds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.kds-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}
.kds-subtitle {
  font-size: 16px;
  color: #414754;
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
  background-color: #edeeef;
  color: #191c1d;
}
.dot-pendientes {
  background-color: #717786;
}
.pill-proceso {
  background-color: #ffdcc3;
  color: #6e3900;
}
.dot-proceso {
  background-color: #fd8b00;
}
.pill-listos {
  background-color: #6bfe9c;
  color: #00210c;
}
.dot-listos {
  background-color: #006a35;
}

.kds-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 24px;
  align-items: start;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 1440px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.empty-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  margin-top: 16px;
}
.empty-subtitle {
  color: #717786;
  margin-top: 4px;
}
</style>
