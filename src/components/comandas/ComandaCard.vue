<script setup lang="ts">
import { computed } from 'vue'
import type { Comanda, EstadoActualComanda } from '@/types/comanda'

const props = defineProps<{
  comanda: Comanda
}>()

const emit = defineEmits<{
  (e: 'cambiar-estado', comandaId: string, nuevoEstado: Exclude<EstadoActualComanda, 'P'>): void
}>()

const configEstilo = computed(() => {
  const estadoActual = props.comanda.estado_actual

  if (estadoActual === 'P') {
    return {
      cardBg: '#ffffff',
      statusBar: 'bg-grey-5',
      labelUpper: 'PENDIENTE',
      badgeColor: 'grey-3',
      badgeTextColor: 'grey-9',
      badgeLabel: 'Pendiente',
      actionLabel: 'Comenzar Preparación',
      actionIcon: 'play_arrow',
      actionColor: 'grey-3',
      actionTextColor: 'text-grey-9',
      targetState: 'E' as Exclude<EstadoActualComanda, 'P'>,
      showBadge: false,
      showAction: true,
    }
  }

  if (estadoActual === 'E') {
    return {
      cardBg: '#fffaf7',
      statusBar: 'bg-orange-7',
      labelUpper: 'EN PREPARACIÓN',
      badgeColor: 'orange-1',
      badgeTextColor: 'orange-10',
      badgeLabel: 'En preparación',
      actionLabel: 'Marcar como Listo',
      actionIcon: 'check_circle',
      actionColor: 'primary',
      actionTextColor: 'text-white',
      targetState: 'L' as Exclude<EstadoActualComanda, 'P'>,
      showBadge: false,
      showAction: true,
    }
  }

  return {
    cardBg: '#f4fbf7',
    statusBar: 'bg-green-6',
    labelUpper: 'LISTO PARA ENTREGA',
    badgeColor: 'green-1',
    badgeTextColor: 'green-10',
    badgeLabel: 'Listo',
    actionLabel: '',
    actionIcon: '',
    actionColor: 'positive',
    actionTextColor: 'text-white',
    targetState: 'L' as Exclude<EstadoActualComanda, 'P'>,
    showBadge: true,
    showAction: false,
  }
})

const subtotal = computed(() => {
  return props.comanda.detalles_comanda.reduce(
    (suma, detalle) => suma + detalle.precio_unitario * detalle.cantidad,
    0,
  )
})

const tiempoTranscurrido = computed(() => {
  if (!props.comanda.notas_generales) return '1 min'
  return props.comanda.notas_generales.includes('•')
    ? props.comanda.notas_generales.split('•')[0].trim()
    : '1 min'
})

const tipoServicio = computed(() => {
  if (!props.comanda.notas_generales) return 'MOSTRADOR'
  return props.comanda.notas_generales.includes('•')
    ? props.comanda.notas_generales.split('•')[1].trim()
    : props.comanda.notas_generales
})

const tieneAccion = computed(() => configEstilo.value.showAction)
</script>

<template>
  <q-card class="kds-card flat bordered" :style="{ backgroundColor: configEstilo.cardBg }">
    <div class="status-bar" :class="configEstilo.statusBar"></div>

    <div class="full-width q-pa-md row column justify-between">
      <div>
        <div class="row justify-between items-start q-mb-sm">
          <div>
            <span
              class="text-caption text-weight-bolder text-grey-6 block uppercase tracking-wider"
            >
              {{ configEstilo.labelUpper }}
            </span>
            <div class="text-h5 text-weight-bolder text-dark">#{{ comanda.folio }}</div>
          </div>
          <div class="text-right">
            <div class="row items-center text-weight-bold text-grey-9 justify-end">
              <q-icon name="schedule" size="xs" class="q-mr-xs" />
              {{ tiempoTranscurrido }}
            </div>
            <span class="text-caption text-weight-bolder text-primary block text-uppercase">
              {{ tipoServicio }}
            </span>
          </div>
        </div>

        <div class="q-mt-md order-items-container">
          <div v-for="item in comanda.detalles_comanda" :key="item.id" class="product-row q-py-sm">
            <div class="row items-start no-wrap">
              <div class="qty-box text-weight-bolder text-grey-8 text-center q-mr-md">
                {{ item.cantidad }}
              </div>

              <div class="full-width">
                <div class="text-subtitle1 text-weight-bold text-grey-9 lh-sm">
                  {{ item.nombre }}
                </div>

                <div class="text-caption text-grey-6 q-mt-xs">
                  ${{ (item.precio_unitario * item.cantidad).toFixed(2) }}
                </div>

                <div v-if="item.observaciones" class="q-mt-xs">
                  <q-badge
                    outline
                    color="negative"
                    class="observacion-badge q-pa-xs text-weight-bold"
                  >
                    <q-icon name="report_problem" size="10px" class="q-mr-xs" />
                    {{ item.observaciones }}
                  </q-badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="q-mt-md text-right text-caption text-grey-7">
          Subtotal: ${{ subtotal.toFixed(2) }}
        </div>
      </div>

      <div class="q-mt-lg">
        <q-badge
          v-if="configEstilo.showBadge"
          rounded
          :color="configEstilo.badgeColor"
          :text-color="configEstilo.badgeTextColor"
          class="q-pa-sm text-weight-bold full-width justify-center"
        >
          {{ configEstilo.badgeLabel }}
        </q-badge>

        <q-btn
          v-else-if="tieneAccion"
          class="full-width text-weight-bold action-btn"
          :color="configEstilo.actionColor"
          :class="configEstilo.actionTextColor"
          unelevated
          no-caps
          @click="emit('cambiar-estado', comanda.id, configEstilo.targetState)"
        >
          <q-icon :name="configEstilo.actionIcon" class="q-mr-xs" size="xs" />
          {{ configEstilo.actionLabel }}
        </q-btn>
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.kds-card {
  width: 100%;
  max-width: 360px;
  min-width: 300px;
  height: 400px;
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
