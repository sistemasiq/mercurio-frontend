<script setup lang="ts">
import { computed } from 'vue';
import type { IComanda } from '../../types/comanda';

const props = defineProps<{
  comanda: IComanda
}>();

const emit = defineEmits<{
  (e: 'avanzarEstado', id: string): void
}>();

// Configuración dinámica limpia y reactiva para cada estado
const configEstilo = computed(() => {
  const estadoActual = props.comanda.estado;

  if (estadoActual === 'pendiente') {
    return {
      cardBg: '#ffffff',
      statusBar: 'bg-grey-5',
      labelUpper: 'PENDIENTE',
      btnColor: 'grey-3',
      btnTextColor: 'text-grey-9',
      btnLabel: 'Comenzar Preparación',
      btnIcon: 'play_arrow'
    };
  }
  
  if (estadoActual === 'en_proceso') {
    return {
      cardBg: '#fffaf7',
      statusBar: 'bg-orange-7',
      labelUpper: 'EN PREPARACIÓN',
      btnColor: 'primary',
      btnTextColor: 'text-white',
      btnLabel: 'Listo Para Entregar',
      btnIcon: 'check_circle'
    };
  }
  
  if (estadoActual === 'listo') {
    return {
      cardBg: '#f4fbf7',
      statusBar: 'bg-green-6',
      labelUpper: 'LISTO PARA ENTREGA',
      btnColor: 'positive',
      btnTextColor: 'text-white',
      btnLabel: 'Entregar',
      btnIcon: 'local_shipping'
    };
  }

  return {
    cardBg: '#f1f5f9',
    statusBar: 'bg-grey-6',
    labelUpper: 'ENTREGADO',
    btnColor: 'grey-4',
    btnTextColor: 'text-grey-7',
    btnLabel: 'Finalizado',
    btnIcon: 'done_all'
  };
});

const tiempoTranscurrido = computed(() => {
  if (!props.comanda.notasGenerales) return '1 min';
  return props.comanda.notasGenerales.includes('•') 
    ? props.comanda.notasGenerales.split('•')[0].trim() 
    : '1 min';
});

const tipoServicio = computed(() => {
  if (!props.comanda.notasGenerales) return 'MOSTRADOR';
  return props.comanda.notasGenerales.includes('•') 
    ? props.comanda.notasGenerales.split('•')[1].trim() 
    : props.comanda.notasGenerales;
});
</script>

<template>
  <q-card class="kds-card flat bordered" :style="{ backgroundColor: configEstilo.cardBg }">
    <div class="status-bar" :class="configEstilo.statusBar"></div>

    <div class="full-width q-pa-md row column justify-between">
      <div>
        <div class="row justify-between items-start q-mb-sm">
          <div>
            <span class="text-caption text-weight-bolder text-grey-6 block uppercase tracking-wider">
              {{ configEstilo.labelUpper }}
            </span>
            <div class="text-h5 text-weight-bolder text-dark">
              #{{ comanda.folio }}
            </div>
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
          <div v-for="item in comanda.items" :key="item.id" class="product-row q-py-sm">
            <div class="row items-start no-wrap">
              <div class="qty-box text-weight-bolder text-grey-8 text-center q-mr-md">
                {{ item.cantidad }}
              </div>
              
              <div class="full-width">
                <div class="text-subtitle1 text-weight-bold text-grey-9 lh-sm">
                  {{ item.nombre }}
                </div>
                
                <div v-if="item.observaciones" class="q-mt-xs">
                  <q-badge outline color="negative" class="observacion-badge q-pa-xs text-weight-bold">
                    <q-icon name="report_problem" size="10px" class="q-mr-xs" />
                    {{ item.observaciones }}
                  </q-badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="q-mt-lg">
        <q-btn
          class="full-width text-weight-bold action-btn"
          :color="configEstilo.btnColor"
          :class="configEstilo.btnTextColor"
          unelevated
          no-caps
          @click="emit('avanzarEstado', comanda.id)"
        >
          <q-icon :name="configEstilo.btnIcon" class="q-mr-xs" size="xs" />
          {{ configEstilo.btnLabel }}
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