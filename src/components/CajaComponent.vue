<template>
  <div class="row items-stretch bg-grey-2" style="min-height: 88vh; overflow: hidden;">
    
    <div :class="ticketAbierto ? 'col-8' : 'col-12'" class="column">
      
      <div class="bg-white q-px-xl q-py-md row items-center justify-between" style="border-bottom: 1px solid #e1e3e4;">
        <div>
          <h1 class="text-h5 text-weight-bold text-primary q-my-none" style="font-family: 'Plus Jakarta Sans', sans-serif;">Estación Principal</h1>
          <div class="text-caption text-grey-6 text-weight-medium">Terminal #01</div>
        </div>
        <q-btn flat color="grey-8" icon="restaurant" label="Ver Cocina en Pantalla Completa" class="text-weight-bold" @click="irACocina" />
      </div>

      <div class="bg-white q-px-lg q-py-sm row items-center q-gutter-sm no-wrap overflow-auto shadow-1" style="border-bottom: 1px solid #e1e3e4; z-index: 2;">
        <q-btn
          v-for="categoria in listaCategorias"
          :key="categoria"
          :label="categoria"
          :color="categoriaSeleccionada === categoria ? 'primary' : 'grey-2'"
          :text-color="categoriaSeleccionada === categoria ? 'white' : 'grey-8'"
          rounded
          unelevated
          no-caps
          class="text-weight-bold q-px-md"
          @click="categoriaSeleccionada = categoria"
        />
      </div>

      <div class="col overflow-auto q-pa-lg">
        <div class="row q-col-gutter-lg">
          <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3" v-for="producto in productosFiltrados" :key="producto.id">
            
            <q-card flat bordered class="column full-height bg-white relative-position" style="border-radius: 16px; border-color: #e1e3e4;">
              <div class="relative-position">
                <q-img :src="producto.imagen" height="150px" style="border-top-left-radius: 16px; border-top-right-radius: 16px; object-fit: cover;" />
                
                <div class="absolute-top-right bg-primary text-white q-px-sm q-py-xs text-weight-bold shadow-1" style="border-radius: 8px; margin: 8px; font-size: 13px;">
                  ${{ producto.precio.toFixed(2) }}
                </div>
              </div>

              <q-card-section class="col column q-pb-xl">
                <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs" style="line-height: 1.2;">{{ producto.nombre }}</div>
                <div class="text-caption text-grey-6" style="line-height: 1.4;">{{ producto.descripcion || 'Sin descripción...' }}</div>
              </q-card-section>
              
              <q-btn 
                unelevated 
                color="orange-9" 
                text-color="white" 
                icon="add" 
                class="absolute-bottom-right transition-all"
                style="border-radius: 8px; width: 40px; height: 40px; margin-right: 16px; margin-bottom: -16px; z-index: 10; box-shadow: 0 4px 10px rgba(253, 139, 0, 0.4);" 
                @click="agregarAlTicket(producto)" 
              />
            </q-card>
            
          </div>
        </div>
      </div>

      <div class="bg-white row items-center justify-between q-px-xl q-py-md" style="border-top: 1px solid #e1e3e4; z-index: 5;">
        <div class="row items-center q-gutter-xl">
          <div>
            <div class="text-overline text-grey-6 text-weight-bold" style="line-height: 1; font-size: 10px;">PRODUCTOS TOTALES</div>
            <div class="text-h6 text-weight-bold text-primary" style="line-height: 1.2;">{{ productos.length }}</div>
          </div>
          <div style="width: 1px; height: 30px; background-color: #e1e3e4;"></div>
          <div>
            <div class="text-overline text-grey-6 text-weight-bold" style="line-height: 1; font-size: 10px;">ÓRDENES EN COCINA</div>
            <div class="text-h6 text-weight-bold text-orange-9" style="line-height: 1.2;">{{ store.comandasActivas.length }}</div>
          </div>
        </div>
        <div>
          <q-btn 
            v-if="!ticketAbierto" 
            unelevated 
            color="primary" 
            icon="add_circle" 
            label="Nuevo Pedido" 
            class="text-weight-bold q-px-lg q-py-sm" 
            style="border-radius: 12px;" 
            @click="abrirTicket" 
          />
        </div>
      </div>

    </div>

    <div v-if="ticketAbierto" class="col-4 bg-white column shadow-4" style="border-left: 1px solid #e1e3e4; z-index: 10;">
      
      <div class="q-pa-lg row justify-between items-start" style="border-bottom: 1px solid #e1e3e4;">
        <div>
          <h2 class="text-h6 text-weight-bold text-dark q-my-none">Pedido Nuevo</h2>
          <p class="text-caption text-grey-6 q-my-none">Mesa 5 • Para llevar</p>
        </div>
        <q-btn flat round dense icon="more_vert" color="grey-6">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="ticketAbierto = false">
                <q-item-section class="text-red">Cancelar Orden</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      
      <div class="col overflow-auto q-pa-md q-gutter-y-sm bg-grey-1">
        
        <div v-if="itemsTicket.length === 0" class="text-center text-grey-5 q-pa-xl column items-center">
          <q-icon name="receipt_long" size="48px" class="q-mb-sm opacity-50" />
          <div class="text-weight-medium">El ticket está vacío.</div>
          <div class="text-caption">Selecciona productos a la izquierda.</div>
        </div>
        
        <div v-for="(item, index) in itemsTicket" :key="index" class="bg-white q-pa-sm" style="border: 1px solid #e1e3e4; border-radius: 12px;">
          <div class="row justify-between items-start q-mb-sm">
            <div class="col">
              <div class="text-weight-bold text-dark">{{ item.producto.nombre }}</div>
              <div class="text-primary text-weight-bold">${{ (item.producto.precio * item.cantidad).toFixed(2) }}</div>
            </div>
            
            <div class="row items-center q-gutter-x-sm bg-grey-2 q-pa-xs" style="border-radius: 8px;">
              <q-btn flat dense round size="sm" icon="remove" color="grey-8" @click="cambiarCantidad(item, -1)" />
              <span class="text-weight-bold text-dark" style="min-width: 12px; text-align: center;">{{ item.cantidad }}</span>
              <q-btn flat dense round size="sm" icon="add" color="grey-8" @click="cambiarCantidad(item, 1)" />
            </div>
          </div>
          
          <div class="bg-orange-1 q-px-sm q-py-xs" style="border-radius: 8px; border: 1px solid #ffe3b3;">
            <q-input v-model="item.notas" borderless dense placeholder="Agregar notas especiales..." input-style="font-size: 12px; font-style: italic; color: #b06100;" />
          </div>
        </div>
      </div>
      
      <div class="q-pa-lg bg-grey-2" style="border-top: 1px solid #e1e3e4;">
        <div class="row justify-between text-sm text-grey-7 q-mb-xs">
          <span>Subtotal</span>
          <span class="text-weight-bold text-dark">${{ total.toFixed(2) }}</span>
        </div>
        
        <div class="row justify-between items-center q-pt-sm q-mt-sm" style="border-top: 1px solid #e1e3e4;">
          <span class="text-subtitle1 text-weight-bold text-dark">Total</span>
          <span class="text-h4 text-weight-bold text-primary">${{ total.toFixed(2) }}</span>
        </div>
        
        <q-btn 
          unelevated
          class="full-width q-mt-md text-weight-bold transition-all"
          style="border-radius: 12px; background-color: #008645; color: white; padding: 14px 0; font-size: 16px;"
          :disable="itemsTicket.length === 0"
          @click="procesarPago" 
        >
          <div class="row items-center justify-center q-gutter-sm">
            <span>Pagar</span>
            <q-icon name="send" />
          </div>
        </q-btn>
      </div>

    </div>
  </div>
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
  { id: 1, nombre: 'Hamburguesa Clásica', precio: 12.50, categoria: 'Hamburguesas', descripcion: 'Carne de res premium, queso cheddar, lechuga y tomate.', imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
  { id: 2, nombre: 'Hamburguesa Doble Tocino', precio: 15.90, categoria: 'Hamburguesas', descripcion: 'Doble carne, tocino crocante, queso y salsa especial BBQ.', imagen: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80' },
  { id: 3, nombre: 'Alitas Picantes', precio: 10.00, categoria: 'Alitas', descripcion: '12 alitas picantes acompañadas de aderezo blue cheese.', imagen: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=500&q=80' },
  { id: 4, nombre: 'Papas Fritas Grandes', precio: 5.50, categoria: 'Complementos', descripcion: 'Papas fritas grandes con sal marina y especias de la casa.', imagen: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80' },
  { id: 5, nombre: 'Refresco Grande', precio: 2.50, categoria: 'Bebidas', descripcion: 'Bebida grande, sabores variados a elección.', imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' }
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

// Total directo
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