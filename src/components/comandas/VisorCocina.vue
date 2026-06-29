<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { cambiarEstadoComanda, obtenerComandas } from '@/services/comandaService'
import type { Comanda, EstadoActualComanda } from '@/types/comanda'

const $q = useQuasar()

const comandas = ref<Comanda[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const intervaloId = ref<ReturnType<typeof setInterval> | null>(null)
const requestController = ref<AbortController | null>(null)

const totalPendientes = computed(
  () => comandas.value.filter((comanda) => comanda.estado_actual === 'P').length,
)
const totalEnProceso = computed(
  () => comandas.value.filter((comanda) => comanda.estado_actual === 'E').length,
)
const totalListos = computed(
  () => comandas.value.filter((comanda) => comanda.estado_actual === 'L').length,
)

const obtenerDetallesComanda = (comanda: Comanda) => {
  return (
    comanda.detalles_comanda ??
    (comanda as Comanda & { detalles?: Comanda['detalles_comanda'] }).detalles ??
    []
  )
}

const obtenerNombreDetalle = (detalle: Comanda['detalles_comanda'][number]) => {
  return detalle.nombre || detalle.producto?.nombre || 'Producto sin nombre'
}

const obtenerNotasDetalle = (detalle: Comanda['detalles_comanda'][number]) => {
  return detalle.notas_especiales || detalle.observaciones || ''
}

const limpiarRequestActiva = () => {
  requestController.value?.abort()
  requestController.value = null
}

const fetchComandas = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  error.value = null
  limpiarRequestActiva()

  const controller = new AbortController()
  requestController.value = controller

  try {
    const resultado = await obtenerComandas(controller.signal)

    if (controller.signal.aborted) {
      return
    }

    comandas.value = resultado
  } catch (err) {
    if (controller.signal.aborted) {
      return
    }

    error.value = 'No fue posible actualizar la cocina.'
    console.error('[VisorCocina] Error al obtener comandas:', err)
  } finally {
    if (!controller.signal.aborted) {
      loading.value = false
    }
  }
}

const cambiarEstado = async (comandaId: string, nuevoEstado: Exclude<EstadoActualComanda, 'P'>) => {
  const controller = new AbortController()

  try {
    await cambiarEstadoComanda(comandaId, nuevoEstado, controller.signal)
    await fetchComandas()
  } catch (err) {
    console.error('[VisorCocina] Error al cambiar estado:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo actualizar el estado de la orden.',
      caption: 'Intenta nuevamente en unos segundos.',
      position: 'top-right',
      timeout: 3000,
    })
  }
}

onMounted(() => {
  void fetchComandas()
  intervaloId.value = window.setInterval(() => {
    void fetchComandas()
  }, 10000)
})

onBeforeUnmount(() => {
  limpiarRequestActiva()

  if (intervaloId.value !== null) {
    window.clearInterval(intervaloId.value)
    intervaloId.value = null
  }
})
</script>

<template>
  <div class="q-pa-xl bg-grey-1">
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h4 text-weight-bolder q-my-none text-grey-9">Visor de Cocina</h1>
        <p class="text-caption text-grey-6 q-ma-none">Órdenes activas para preparación</p>
      </div>

      <div class="row q-gutter-sm">
        <q-badge
          rounded
          color="grey-3"
          text-color="grey-9"
          class="q-pa-md text-subtitle2 text-weight-bold"
        >
          <span class="dot bg-grey-7 q-mr-sm"></span> {{ totalPendientes }} Pendientes
        </q-badge>
        <q-badge
          rounded
          color="orange-1"
          text-color="orange-10"
          class="q-pa-md text-subtitle2 text-weight-bold"
        >
          <span class="dot bg-orange-5 q-mr-sm"></span> {{ totalEnProceso }} En Preparación
        </q-badge>
        <q-badge
          rounded
          color="green-1"
          text-color="green-10"
          class="q-pa-md text-subtitle2 text-weight-bold"
        >
          <span class="dot bg-green-5 q-mr-sm"></span> {{ totalListos }} Listos
        </q-badge>
      </div>
    </div>

    <q-inner-loading :showing="loading" class="q-mb-lg">
      <q-spinner size="40px" color="primary" />
    </q-inner-loading>

    <q-banner v-if="error" class="bg-orange-1 text-orange-10 q-mb-lg" rounded>
      {{ error }}
    </q-banner>

    <div v-if="!loading && comandas.length === 0" class="absolute-center text-center text-grey-5">
      <q-icon name="celebration" size="80px" color="grey-4" />
      <div class="text-h5 text-weight-bold q-mt-sm">¡Cocina despejada!</div>
      <p class="text-caption">No hay pedidos pendientes en Mercurio.</p>
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div
        v-for="comanda in comandas"
        :key="comanda.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3 row justify-center"
      >
        <q-card
          class="kds-card flat bordered"
          :class="{
            'bg-white': comanda.estado_actual === 'P',
            'bg-orange-1': comanda.estado_actual === 'E',
            'bg-green-1': comanda.estado_actual === 'L',
          }"
        >
          <div
            class="status-bar"
            :class="{
              'bg-grey-5': comanda.estado_actual === 'P',
              'bg-orange-7': comanda.estado_actual === 'E',
              'bg-green-6': comanda.estado_actual === 'L',
            }"
          ></div>

          <div class="full-width q-pa-md row column justify-between">
            <div>
              <div class="row justify-between items-start q-mb-sm">
                <div>
                  <span
                    class="text-caption text-weight-bolder text-grey-6 block uppercase tracking-wider"
                  >
                    {{
                      comanda.estado_actual === 'P'
                        ? 'PENDIENTE'
                        : comanda.estado_actual === 'E'
                          ? 'EN PREPARACIÓN'
                          : 'LISTO PARA ENTREGA'
                    }}
                  </span>
                  <div class="text-h5 text-weight-bolder text-dark">
                    {{ comanda.ticket_numero || `#${comanda.id}` }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="row items-center text-weight-bold text-grey-9 justify-end">
                    <q-icon name="payments" size="xs" class="q-mr-xs" />
                    ${{ Number(comanda.total_final || 0).toFixed(2) }}
                  </div>
                  <span class="text-caption text-weight-bolder text-primary block text-uppercase">
                    {{ comanda.mesa || 'MOSTRADOR' }}
                  </span>
                </div>
              </div>

              <div class="q-mt-md order-items-container">
                <div
                  v-for="detalle in obtenerDetallesComanda(comanda)"
                  :key="detalle.id"
                  class="product-row q-py-sm"
                >
                  <div class="row items-start no-wrap q-gutter-sm">
                    <q-avatar
                      size="30px"
                      color="grey-2"
                      text-color="grey-8"
                      class="text-weight-bold"
                    >
                      {{ detalle.cantidad }}
                    </q-avatar>

                    <div class="full-width">
                      <div class="text-subtitle1 text-weight-bold text-grey-9 lh-sm">
                        {{ obtenerNombreDetalle(detalle) }}
                      </div>

                      <div class="text-caption text-grey-6 q-mt-xs">
                        ${{ (detalle.precio_unitario * detalle.cantidad).toFixed(2) }}
                      </div>

                      <div
                        v-if="obtenerNotasDetalle(detalle)"
                        class="q-mt-xs text-caption text-red"
                      >
                        {{ obtenerNotasDetalle(detalle) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-lg">
              <q-badge
                v-if="comanda.estado_actual === 'L'"
                rounded
                color="green-1"
                text-color="green-10"
                class="q-pa-sm text-weight-bold full-width justify-center"
              >
                Listo
              </q-badge>

              <q-btn
                v-else-if="comanda.estado_actual === 'P'"
                class="full-width text-weight-bold action-btn"
                color="grey-3"
                text-color="grey-9"
                unelevated
                no-caps
                @click="cambiarEstado(comanda.id, 'E')"
              >
                <q-icon name="play_arrow" class="q-mr-xs" size="xs" />
                Comenzar Preparación
              </q-btn>

              <q-btn
                v-else
                class="full-width text-weight-bold action-btn"
                color="primary"
                text-color="white"
                unelevated
                no-caps
                @click="cambiarEstado(comanda.id, 'L')"
              >
                <q-icon name="check_circle" class="q-mr-xs" size="xs" />
                Marcar como Listo
              </q-btn>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.kds-card {
  width: 100%;
  max-width: 360px;
  min-width: 300px;
  min-height: 400px;
  border-radius: 12px;
  display: flex;
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.status-bar {
  width: 6px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.qty-box {
  background-color: #f1f5f9;
  padding: 4px 12px;
  border-radius: 6px;
  min-width: 36px;
}

.observacion-badge {
  background-color: #fef2f2 !important;
  border: 1px solid #fee2e2;
}

.action-btn {
  border-radius: 8px;
  padding: 12px 0;
  font-size: 15px;
}

.order-items-container {
  max-height: 230px;
  overflow-y: auto;
}
</style>
