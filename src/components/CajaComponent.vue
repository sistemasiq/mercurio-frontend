<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row q-col-gutter-md">
      
      <div :class="ticketAbierto ? 'col-8' : 'col-12'">
        
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center q-gutter-md">
            <h1 class="text-h5 text-weight-bold q-my-none">Estación Principal</h1>
            <q-btn flat color="secondary" label="Ver Cocina" icon="restaurant" @click="irACocina" />
          </div>
          <q-btn 
            v-if="!ticketAbierto"
            color="primary" 
            label="+ Nuevo Pedido" 
            @click="abrirTicket" 
          />
        </div>

        <div class="q-mb-lg flex items-center justify-between">
          <div class="flex q-gutter-sm">
            <q-btn
              v-for="categoria in listaCategorias"
              :key="categoria"
              :label="categoria"
              :color="categoriaSeleccionada === categoria ? 'primary' : 'white'"
              :text-color="categoriaSeleccionada === categoria ? 'white' : 'grey-8'"
              rounded
              unelevated
              class="shadow-1"
              @click="categoriaSeleccionada = categoria"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3" v-for="producto in productosFiltrados" :key="producto.id">
            <q-card class="column full-height relative-position shadow-2">
              
              <q-badge color="primary" class="q-pa-sm text-subtitle2 absolute-top-right q-ma-sm" style="z-index: 1">
                ${{ producto.precio.toFixed(2) }}
              </q-badge>

              <q-img src="https://cdn.quasar.dev/img/parallax2.jpg" height="140px" />
              
              <q-card-section class="col column justify-between">
                <div>
                  <div class="text-subtitle1 text-weight-bold">{{ producto.nombre }}</div>
                  <div class="text-caption text-grey-6">{{ producto.descripcion || 'Sin descripción...' }}</div>
                </div>
                
                <div class="row justify-end q-mt-sm">
                  <q-btn round color="orange" icon="add" size="sm" @click="agregarAlTicket(producto)" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div v-if="ticketAbierto" class="col-4">
        <q-card class="full-height q-pa-md column justify-between" style="min-height: 80vh;">
          <div class="col column">
            <div class="row justify-between items-center q-mb-md">
              <h2 class="text-h6 text-weight-bold q-my-none">Pedido Nuevo</h2>
              <q-btn flat round dense icon="close" color="grey" @click="ticketAbierto = false" />
            </div>
            
            <q-separator class="q-mb-md" />
            
            <div class="col overflow-auto">
              <div v-if="itemsTicket.length === 0" class="text-center text-grey-5 q-pa-lg">
                Aún no hay productos en el pedido.
              </div>

              <div v-for="(item, index) in itemsTicket" :key="index" class="q-mb-md bg-grey-2 q-pa-sm rounded-borders">
                <div class="row justify-between items-center">
                  <div class="text-subtitle2 text-weight-bold">{{ item.producto.nombre }}</div>
                  <div class="text-subtitle2">${{ (item.producto.precio * item.cantidad).toFixed(2) }}</div>
                </div>
                
                <div class="row justify-between items-center q-mt-sm">
                  <q-input v-model="item.notas" dense filled placeholder="Ej. Sin cebolla..." class="col-6" />
                  
                  <div class="row items-center q-gutter-x-sm">
                    <q-btn round dense color="white" text-color="black" icon="remove" size="xs" @click="cambiarCantidad(item, -1)" />
                    <span class="text-weight-bold">{{ item.cantidad }}</span>
                    <q-btn round dense color="white" text-color="black" icon="add" size="xs" @click="cambiarCantidad(item, 1)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="q-mt-md">
            <q-separator class="q-mb-md" />
            <div class="row justify-between text-h6 text-weight-bold q-mb-md">
              <span>Total:</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
            <q-btn 
              color="positive" 
              size="lg"
              label="Pagar" 
              class="full-width" 
              :disable="itemsTicket.length === 0"
              @click="procesarPago" 
            />
          </div>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useComandasStore } from '@/stores/comandaStore';

// === INICIALIZACIÓN ===
const store = useComandasStore();
const emit = defineEmits(['cambiar-vista']);

// === ESTADO LOCAL ===
const ticketAbierto = ref(false);

const listaCategorias = [
  'Todos', 
  'Hamburguesas', 
  'Alitas', 
  'Bebidas', 
  'Complementos', 
  'Postres', 
  'Promociones'
];
const categoriaSeleccionada = ref('Todos');

// === DATOS FALSOS (MOCK) ===
const productos = ref([
  { id: 1, nombre: 'Classic Burger', precio: 8.50, categoria: 'Hamburguesas', descripcion: 'Doble carne de res con queso' },
  { id: 2, nombre: 'Double Bacon', precio: 10.50, categoria: 'Hamburguesas', descripcion: 'Doble tocino y salsa BBQ' },
  { id: 3, nombre: 'Spicy Wings', precio: 12.00, categoria: 'Alitas', descripcion: 'Bañadas en salsa picante especial' },
  { id: 4, nombre: 'Fountain Drink', precio: 2.50, categoria: 'Bebidas', descripcion: 'Refresco de máquina rellenable' },
  { id: 5, nombre: 'Large Fries', precio: 4.50, categoria: 'Complementos', descripcion: 'Papas fritas corte grueso' },
  { id: 6, nombre: 'Duo Donuts', precio: 3.00, categoria: 'Postres', descripcion: 'Dos donas glaseadas clásicas' }
]);

// === ESTADO DEL TICKET ===
const itemsTicket = ref<any[]>([]); 

// === LÓGICA REACTIVA ===
const productosFiltrados = computed(() => {
  if (categoriaSeleccionada.value === 'Todos') {
    return productos.value;
  }
  return productos.value.filter(p => p.categoria === categoriaSeleccionada.value);
});

// Total directo (sin IVA desglosado)
const total = computed(() => {
  return itemsTicket.value.reduce((suma, item) => suma + (item.producto.precio * item.cantidad), 0);
});

// === FUNCIONES ===
const irACocina = () => {
  emit('cambiar-vista', 'cocina');
};

const abrirTicket = () => {
  ticketAbierto.value = true;
};

const agregarAlTicket = (producto: any) => {
  ticketAbierto.value = true; 
  
  const itemExistente = itemsTicket.value.find(item => item.producto.id === producto.id);
  
  if (itemExistente) {
    itemExistente.cantidad++; 
  } else {
    itemsTicket.value.push({
      producto: producto,
      cantidad: 1,
      notas: ''
    });
  }
};

const cambiarCantidad = (item: any, cantidad: number) => {
  item.cantidad += cantidad;
  if (item.cantidad <= 0) {
    itemsTicket.value = itemsTicket.value.filter(i => i.producto.id !== item.producto.id);
  }
};

const procesarPago = () => {
  store.crearComanda(
    'Mesa 5', 
    itemsTicket.value, 
    '1 min • PARA LLEVAR'
  );

  itemsTicket.value = [];
  ticketAbierto.value = false;
  alert('¡Comanda enviada a cocina con éxito!');
};
</script>