<script setup lang="ts">
import { computed } from 'vue';
import type { IComanda } from '../../types/comanda';

const props = defineProps<{
  comanda: IComanda
}>();

const emit = defineEmits<{
  (e: 'avanzarEstado', id: string): void
}>();

// Mapeo exacto de estilos según la captura de pantalla
const esPendiente = computed(() => props.comanda.estado === 'pendiente');

const estiloTarjeta = computed(() => {
  if (props.comanda.estado === 'en_proceso') {
    return {
      borderTop: 'border-orange-5',
      badgeColor: 'orange-1',
      badgeTextColor: 'orange-10',
      labelBadge: 'EN PREPARACIÓN',
      btnColor: 'primary',
      btnLabel: 'Listo para Entregar',
      btnIcon: 'check_circle'
    };
  }
  return {
    borderTop: 'border-grey-4',
    badgeColor: 'grey-2',
    badgeTextColor: 'grey-7',
    labelBadge: 'PENDIENTE',
    btnColor: 'grey-3',
    btnTextColor: 'grey-9',
    btnLabel: 'Comenzar Preparación',
    btnIcon: 'play_arrow'
  };
});
</script>

<template>
  <q-card class="kds-card flat bordered" :class="esPendiente ? 'pendiente-style' : 'preparacion-style'">
    <div class="status-bar" :class="!esPendiente ? 'bg-orange-7' : 'bg-grey-5'"></div>

    <div class="full-width q-pa-md">
      <div class="row justify-between items-center q-mb-sm">
        <div>
          <span class="text-caption text-weight-bold text-uppercase text-grey-6 block">
            {{ !esPendiente ? 'EN PREPARACIÓN' : 'PENDIENTE' }}
          </span>
          <div class="text-h5 text-weight-bolder text-dark">#{{ comanda.folio.split('-')[1] || comanda.folio }}</div>
        </div>
        <div class="text-right">
          <div class="row items-center text-weight-bold text-grey-8">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            {{ comanda.notasGenerales?.split('•')[0] || '1 min' }}
          </div>
          <span class="text-caption text-weight-bolder text-primary block text-uppercase">
            {{ comanda.notasGenerales?.split('•')[1] || 'MOSTRADOR' }}
          </span>
        </div>
      </div>

      <div class="q-mt-md">
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
                <q-badge outline color="negative" class="observacion-badge q-pa-xs">
                  <q-icon name="warning" size="10px" class="q-mr-xs" />
                  {{ item.observaciones }}
                </q-badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="q-mt-lg">
        <q-btn
          class="full-width text-weight-bold text-capitalize action-btn"
          :color="estiloTarjeta.btnColor"
          :text-color="estiloTarjeta.btnTextColor || 'white'"
          unevaluated
          no-caps
          @click="emit('avanzarEstado', comanda.id)"
        >
          <q-icon :name="estiloTarjeta.btnIcon" class="q-mr-sm" size="sm" />
          {{ estiloTarjeta.btnLabel }}
        </q-btn>
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.kds-card {
  width: 100%;
  max-width: 380px;
  min-width: 300px;
  border-radius: 12px;
  background-color: #ffffff;
  display: flex;
  position: relative;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

/* Colores de fondo suaves según el estado para simular la captura */
.preparacion-style {
  background-color: #fffaf7;
}
.pendiente-style {
  background-color: #ffffff;
}

.status-bar {
  width: 6px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.qty-box {
  background-color: #f0f2f5;
  padding: 4px 10px;
  border-radius: 6px;
  min-width: 32px;
}

.observacion-badge {
  background-color: #fff0f0 !important;
  border: 1px solid #ffcdd2;
  font-weight: 700;
  font-size: 11px;
}

.action-btn {
  border-radius: 8px;
  padding: 10px 0;
  font-size: 15px;
}
</style>