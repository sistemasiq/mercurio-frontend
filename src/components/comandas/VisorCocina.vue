<template>
  <div class="page-content kds">
    <header class="kds__head">
      <h1 class="kds__title">Cocina</h1>
      <span class="kds__live" :class="`kds__live--${socket.estado.value}`">
        <span class="kds__live-dot" />
        {{
          socket.estado.value === 'conectado'
            ? 'En vivo'
            : socket.estado.value === 'caido'
              ? 'Sin conexión en vivo · actualizando cada 10 s'
              : 'Conectando…'
        }}
      </span>
      <q-btn
        outline
        :icon="enPantallaCompleta ? 'fullscreen_exit' : 'fullscreen'"
        :label="enPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'"
        @click="alternarPantallaCompleta"
      />
    </header>

    <div v-if="error" class="kds__error"><q-icon name="cloud_off" size="19px" />{{ error }}</div>

    <div v-if="!loading && comandasEnCocina.length === 0" class="kds__empty">
      <StateBlock
        variant="empty"
        title="¡Cocina despejada!"
        body="No hay pedidos pendientes por preparar."
      />
    </div>

    <div v-else class="kds__board">
      <section v-for="col in columnas" :key="col.key" class="kds-col">
        <header class="kds-col__head">
          <span class="kds-col__dot" :class="`kds-col__dot--${col.tono}`" />
          <span class="kds-col__title">{{ col.titulo }}</span>
          <span class="kds-col__count">{{ col.items.length }}</span>
        </header>
        <TransitionGroup name="card-list" tag="div" class="kds-col__list">
          <ComandaCard
            v-for="comanda in col.items"
            :key="comanda.id"
            :comanda="comanda"
            @cambiar-estado="onCambiarEstado"
            @ver-detalle="onVerDetalle"
          />
        </TransitionGroup>
      </section>
    </div>

    <q-inner-loading :showing="loading && comandas.length === 0">
      <q-spinner size="40px" color="primary" />
    </q-inner-loading>

    <!-- Siempre montado: la apertura/cierre y el cambio de comanda se animan
         sin desmontar el DOM. -->
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
import StateBlock from '@/components/ui/StateBlock.vue'

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

const columnas = computed(() => [
  {
    key: 'P',
    titulo: 'Nuevas',
    tono: 'pink',
    items: comandas.value.filter((c) => c.estado_actual === 'P'),
  },
  {
    key: 'E',
    titulo: 'En preparación',
    tono: 'warn',
    items: comandas.value.filter((c) => c.estado_actual === 'E'),
  },
  {
    key: 'L',
    titulo: 'Listas para entregar',
    tono: 'ok',
    items: comandas.value.filter((c) => c.estado_actual === 'L'),
  },
])

// Pantalla completa del tablero (pensado para la pantalla de cocina).
const enPantallaCompleta = ref(false)
const onFullscreenChange = () => {
  enPantallaCompleta.value = !!document.fullscreenElement
}
async function alternarPantallaCompleta() {
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
}

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

onMounted(() => {
  void fetchComandas()
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  limpiarRequestActiva()
  if (fallbackIntervalId.value !== null) {
    window.clearInterval(fallbackIntervalId.value)
    fallbackIntervalId.value = null
  }
})
</script>

<style scoped lang="scss">
.kds {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100vh - var(--header-height));

  &__head {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 26px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }

  &__live {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);

    &--caido .kds__live-dot {
      background: var(--tone-warn-dot);
    }

    &--conectando .kds__live-dot,
    &--reconectando .kds__live-dot {
      background: var(--text-muted);
    }
  }

  &__live-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: var(--tone-ok-dot);
  }

  &__error {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    font-size: 13.5px;
    font-weight: 600;
  }

  &__empty {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  &__board {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    align-items: start;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

.kds-col {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;

    &--pink {
      background: var(--q-secondary);
    }
    &--warn {
      background: var(--tone-warn-dot);
    }
    &--ok {
      background: var(--tone-ok-dot);
    }
  }

  &__title {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__count {
    min-width: 22px;
    height: 20px;
    padding: 0 7px;
    border-radius: 10px;
    background: #eef1f5;
    color: var(--text-body);
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.25s ease;
}

.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
