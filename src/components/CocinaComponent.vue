<script setup lang="ts">
import { useComandasStore } from '@/stores/comandaStore';
import ComandaCard from '@/components/comandas/ComandaCard.vue';

const store = useComandasStore();

// Avanzar el flujo del estado de forma completamente reactiva
const manejarCambioEstado = (id: string) => {
  // Buscamos la comanda directamente en la lista reactiva del Store
  const comanda = store.comandasActivas.find(c => c.id === id);
  
  if (comanda) {
    if (comanda.estado === 'pendiente') {
      store.actualizarEstado(id, 'en_proceso');
    } else if (comanda.estado === 'en_proceso') {
      store.actualizarEstado(id, 'listo');
    } else if (comanda.estado === 'listo') {
      store.actualizarEstado(id, 'entregado');
    }
  }
};
</script>

<template>
  <div class="q-pa-xl bg-grey-1">
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h4 text-weight-bolder q-my-none text-grey-9">Visor de Cocina</h1>
        <p class="text-caption text-grey-6 q-ma-none">Órdenes activas para preparación</p>
      </div>
      
      <div class="row q-gutter-sm">
        <q-badge rounded color="grey-3" text-color="grey-9" class="q-pa-md text-subtitle2 text-weight-bold">
          <span class="dot bg-grey-7 q-mr-sm"></span> {{ store.totalPendientes }} Pendientes
        </q-badge>
        <q-badge rounded color="orange-1" text-color="orange-10" class="q-pa-md text-subtitle2 text-weight-bold">
          <span class="dot bg-orange-5 q-mr-sm"></span> {{ store.totalEnProceso }} En Preparación
        </q-badge>
        <q-badge rounded color="green-1" text-color="green-10" class="q-pa-md text-subtitle2 text-weight-bold">
          <span class="dot bg-green-5 q-mr-sm"></span> {{ store.totalListos }} Listos
        </q-badge>
      </div>
    </div>

    <div v-if="store.comandasEnCocina.length === 0" class="absolute-center text-center text-grey-5">
      <q-icon name="celebration" size="80px" color="grey-4" />
      <div class="text-h5 text-weight-bold q-mt-sm">¡Cocina despejada!</div>
      <p class="text-caption">No hay pedidos pendientes en Mercurio.</p>
    </div>

    <div class="row q-col-gutter-lg">
      <div 
        v-for="comanda in store.comandasEnCocina" 
        :key="comanda.id" 
        class="col-12 col-sm-6 col-md-4 col-lg-3 row justify-center"
      >
        <ComandaCard 
          :comanda="comanda" 
          @avanzar-estado="manejarCambioEstado" 
        />
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
</style>