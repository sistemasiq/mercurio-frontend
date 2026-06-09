<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useComandasStore } from '../../stores/comandaStore'; 
import ComandaCard from '../../components/comandas/ComandaCard.vue';
const store = useComandasStore();

const manejarCambioEstado = (id: string) => {
  const comanda = store.comandasActivas.find(c => c.id === id);
  if (comanda) {
    if (comanda.estado === 'pendiente') {
      store.actualizarEstado(id, 'en_proceso');
    } else if (comanda.estado === 'en_proceso') {
      store.actualizarEstado(id, 'listo');
    }
  }
};

// Contadores en tiempo real basados en los datos del Store
const totalPendientes = computed(() => store.comandasActivas.filter(c => c.estado === 'pendiente').length);
const totalEnProceso = computed(() => store.comandasActivas.filter(c => c.estado === 'en_proceso').length);
const totalListos = computed(() => store.comandasActivas.filter(c => c.estado === 'listo').length);

onMounted(() => {
  if (store.comandasActivas.length === 0) {
    // Orden #0038
    store.crearComanda('Mesa 4', [
      { id: '1', nombre: 'Hamburguesa Doble Queso', cantidad: 2, precioUnitario: 85, observaciones: 'Sin cebolla, extra pepinillos' },
      { id: '2', nombre: 'Papas Fritas Grandes', cantidad: 1, precioUnitario: 45 },
      { id: '3', nombre: 'Refresco de Cola', cantidad: 2, precioUnitario: 25 }
    ], '12 min • PARA LLEVAR');
    
    // Forzamos que la primera ya esté en preparación para clonar la UI exacta
    const dePrueba = store.comandasActivas[0];
    if (dePrueba) store.actualizarEstado(dePrueba.id, 'en_proceso');

    // Orden #0042
    store.crearComanda('Mesa 12', [
      { id: '4', nombre: 'Pizza Margarita Familiar', cantidad: 1, precioUnitario: 180, observaciones: 'Masa delgada' },
      { id: '5', nombre: 'Ensalada César', cantidad: 1, precioUnitario: 90, observaciones: 'Alergia: Sin crutones' }
    ], '5 min • PENDIENTE');

    // Orden #0043
    store.crearComanda('Mostrador', [
      { id: '6', nombre: 'Helado de Vainilla', cantidad: 4, precioUnitario: 20 },
      { id: '7', nombre: 'Café Americano', cantidad: 2, precioUnitario: 30 }
    ], '1 min • MOSTRADOR');
  }
});
</script>

<template>
  <q-page class="q-pa-xl bg-grey-1 text-dark">
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h4 text-weight-bolder q-my-none text-grey-9">Visor de Cocina</h1>
        <p class="text-caption text-grey-6 q-ma-none">Órdenes activas para preparación</p>
      </div>
      
      <div class="row q-gutter-sm">
        <q-badge rounded color="grey-3" text-color="grey-9" class="q-pa-sm text-weight-bold">
          <span class="dot bg-grey-7 q-mr-xs"></span> {{ totalPendientes }} Pendientes
        </q-badge>
        <q-badge rounded color="orange-1" text-color="orange-10" class="q-pa-sm text-weight-bold">
          <span class="dot bg-orange-5 q-mr-xs"></span> {{ totalEnProceso }} En Preparación
        </q-badge>
        <q-badge rounded color="green-1" text-color="green-10" class="q-pa-sm text-weight-bold">
          <span class="dot bg-green-5 q-mr-xs"></span> {{ totalListos }} Listos
        </q-badge>
      </div>
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
  </q-page>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>