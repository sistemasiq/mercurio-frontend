<template>
  <div class="flex no-wrap bg-grey-2" style="min-height: 100vh; overflow: hidden">
    <div class="flex-1 column">
      <div
        class="bg-white q-px-xl q-py-md row items-center justify-between"
        style="border-bottom: 1px solid #e1e3e4"
      >
        <div>
          <h1
            class="text-h5 text-weight-bold text-primary q-my-none"
            style="font-family: 'Plus Jakarta Sans', sans-serif"
          >
            Estación Principal
          </h1>
          <div class="text-caption text-grey-6 text-weight-medium">Terminal #01</div>
        </div>
      </div>

      <div
        class="bg-white q-px-lg q-py-sm row items-center q-gutter-sm no-wrap overflow-auto shadow-1"
        style="border-bottom: 1px solid #e1e3e4; z-index: 2"
      >
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
          @click="seleccionarCategoria(categoria)"
        />
      </div>

      <div class="col row no-wrap overflow-hidden">
        <div :class="ticketAbierto ? 'col-8' : 'col-12'" class="column h-full">
          <div class="col overflow-auto q-pa-lg">
            <div v-if="loading" class="row q-col-gutter-lg">
              <div
                v-for="skeleton in 8"
                :key="skeleton"
                class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card
                  flat
                  bordered
                  class="bg-white"
                  style="border-radius: 16px; border-color: #e1e3e4; min-height: 260px"
                >
                  <q-card-section>
                    <q-skeleton type="rect" height="150px" class="q-mb-md" />
                    <q-skeleton type="text" width="70%" class="q-mb-sm" />
                    <q-skeleton type="text" width="90%" />
                    <q-skeleton type="text" width="60%" class="q-mt-sm" />
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <q-banner v-else-if="error" class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              No se pudieron cargar los productos.
            </q-banner>

            <div v-else class="row q-col-gutter-lg">
              <div
                v-for="producto in productosFiltrados"
                :key="producto.id"
                class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
              >
                <ProductoCard :producto="producto" @agregar="agregarAlTicket" />
              </div>
            </div>
          </div>

          <div
            class="bg-white row items-center justify-between q-px-xl q-py-md"
            style="border-top: 1px solid #e1e3e4; z-index: 5"
          >
            <div class="row items-center q-gutter-xl">
              <div>
                <div
                  class="text-overline text-grey-6 text-weight-bold"
                  style="line-height: 1; font-size: 10px"
                >
                  PRODUCTOS TOTALES
                </div>
                <div class="text-h6 text-weight-bold text-primary" style="line-height: 1.2">
                  {{ totalProductos }}
                </div>
              </div>
              <div style="width: 1px; height: 30px; background-color: #e1e3e4"></div>
              <div>
                <div
                  class="text-overline text-grey-6 text-weight-bold"
                  style="line-height: 1; font-size: 10px"
                >
                  ÓRDENES EN COCINA
                </div>
                <div class="text-h6 text-weight-bold text-orange-9" style="line-height: 1.2">
                  {{ totalComandasActivas }}
                </div>
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
                style="border-radius: 12px"
                @click="abrirTicket"
              />
            </div>
          </div>
        </div>

        <div
          v-if="ticketAbierto"
          class="col-4 bg-white column shadow-4"
          style="border-left: 1px solid #e1e3e4; z-index: 10; height: 100%"
        >
          <div
            class="q-pa-lg row justify-between items-start"
            style="border-bottom: 1px solid #e1e3e4"
          >
            <div>
              <h2 class="text-h6 text-weight-bold text-dark q-my-none">Pedido Nuevo</h2>
              <p class="text-caption text-grey-6 q-my-none">Mostrador • Para llevar</p>
            </div>
            <q-btn flat round dense icon="more_vert" color="grey-6">
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item v-close-popup clickable @click="ticketAbierto = false">
                    <q-item-section class="text-red">Cancelar Orden</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <div class="col overflow-auto q-pa-md q-gutter-y-sm bg-grey-1">
            <div
              v-if="itemsTicket.length === 0"
              class="text-center text-grey-5 q-pa-xl column items-center"
            >
              <q-icon name="receipt_long" size="48px" class="q-mb-sm opacity-50" />
              <div class="text-weight-medium">El ticket está vacío.</div>
              <div class="text-caption">Selecciona productos a la izquierda.</div>
            </div>

            <div
              v-for="(item, index) in itemsTicket"
              :key="index"
              class="bg-white q-pa-sm"
              style="border: 1px solid #e1e3e4; border-radius: 12px"
            >
              <div class="row justify-between items-start q-mb-sm">
                <div class="col">
                  <div class="text-weight-bold text-dark">{{ item.producto.nombre }}</div>
                  <div class="text-primary text-weight-bold">
                    ${{ (item.producto.precio_unitario * item.cantidad).toFixed(2) }}
                  </div>
                </div>
                <div
                  class="row items-center q-gutter-x-sm bg-grey-2 q-pa-xs"
                  style="border-radius: 8px"
                >
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="remove"
                    color="grey-8"
                    @click="cambiarCantidad(item, -1)"
                  />
                  <span
                    class="text-weight-bold text-dark"
                    style="min-width: 12px; text-align: center"
                    >{{ item.cantidad }}</span
                  >
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="add"
                    color="grey-8"
                    @click="cambiarCantidad(item, 1)"
                  />
                </div>
              </div>
              <div
                class="bg-orange-1 q-px-sm q-py-xs"
                style="border-radius: 8px; border: 1px solid #ffe3b3"
              >
                <q-input
                  v-model="item.notas"
                  borderless
                  dense
                  placeholder="Agregar notas especiales..."
                  input-style="font-size: 12px; font-style: italic; color: #b06100;"
                />
              </div>
            </div>
          </div>

          <div class="q-pa-lg bg-grey-2" style="border-top: 1px solid #e1e3e4">
            <div class="row justify-between text-sm text-grey-7 q-mb-xs">
              <span>Subtotal</span>
              <span class="text-weight-bold text-dark">${{ total.toFixed(2) }}</span>
            </div>
            <div
              class="row justify-between items-center q-pt-sm q-mt-sm"
              style="border-top: 1px solid #e1e3e4"
            >
              <span class="text-subtitle1 text-weight-bold text-dark">Total</span>
              <span class="text-h4 text-weight-bold text-primary">${{ total.toFixed(2) }}</span>
            </div>
            <q-btn
              unelevated
              class="full-width q-mt-md text-weight-bold transition-all"
              style="
                border-radius: 12px;
                background-color: #008645;
                color: white;
                padding: 14px 0;
                font-size: 16px;
              "
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { useComandasStore } from '@/stores/comandaStore'
import ProductoCard from '@/components/comandas/ProductoCard.vue'
import { obtenerProductos } from '@/services/productoService'
import { crearComanda } from '@/services/comandaService'
import type { Producto } from '@/types/producto'
import type { CrearComandaRequest, DetalleComandaRequest } from '@/types/comanda'

// === INICIALIZACIÓN ===
const store = useComandasStore()
const $q = useQuasar()

// Props
const props = defineProps<{ searchTerm?: string }>()

// === ESTADO LOCAL ===
const ticketAbierto = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const abortController = new AbortController()

const listaCategorias = [
  'Todos',
  'Hamburguesas',
  'Alitas',
  'Bebidas',
  'Complementos',
  'Postres',
  'Promociones',
]
const categoriaSeleccionada = ref('Todos')

const productos = ref<Producto[]>([])

// === ESTADO DEL TICKET ===
interface ItemTicket {
  producto: Producto
  cantidad: number
  notas: string
}

const itemsTicket = ref<ItemTicket[]>([])

// === LÓGICA REACTIVA ===
const productosFiltrados = computed(() => {
  const term = (props.searchTerm || '').trim().toLowerCase()
  let base = productos.value
  if (categoriaSeleccionada.value !== 'Todos') {
    base = base.filter((p) => p.tipo === categoriaSeleccionada.value)
  }
  if (!term) return base
  return base.filter(
    (p) =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.descripcion || '').toLowerCase().includes(term),
  )
})

const totalProductos = computed(() => productos.value.length)
const totalComandasActivas = computed(() => store.comandasActivas.length)

// Total directo
const total = computed(() => {
  return itemsTicket.value.reduce(
    (suma, item) => suma + item.producto.precio_unitario * item.cantidad,
    0,
  )
})

const construirDetallesComanda = (): DetalleComandaRequest[] => {
  return itemsTicket.value.map((item) => ({
    producto_id: item.producto.id,
    nombre: item.producto.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.producto.precio_unitario,
    subtotal: item.producto.precio_unitario * item.cantidad,
    observaciones: item.notas || undefined,
  }))
}

const generarTicketNumero = () => {
  const sufijo = String(Date.now() % 1000).padStart(3, '0')
  return `TICK-${sufijo}`
}

const obtenerDetalleError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string | string[]; message?: string; error?: string }
      | undefined

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      return data.detail.join(', ')
    }

    if (data?.message) {
      return data.message
    }

    if (data?.error) {
      return data.error
    }

    if (err.response?.status) {
      return `Error HTTP ${err.response.status}`
    }
  }

  return err instanceof Error ? err.message : 'No se pudo enviar la comanda.'
}

// === FUNCIONES ===
const seleccionarCategoria = (categoria: string) => {
  categoriaSeleccionada.value = categoria
}

const abrirTicket = () => {
  ticketAbierto.value = true
}

const cargarProductos = async () => {
  loading.value = true
  error.value = null

  try {
    const resultado = await obtenerProductos(abortController.signal)
    if (abortController.signal.aborted) {
      return
    }

    productos.value = resultado
  } catch (err) {
    if (abortController.signal.aborted) {
      return
    }

    error.value = 'No se pudieron cargar los productos.'
    console.error('[CajaComponent] Error al cargar productos:', err)
  } finally {
    if (!abortController.signal.aborted) {
      loading.value = false
    }
  }
}

const agregarAlTicket = (producto: Producto) => {
  ticketAbierto.value = true

  const itemExistente = itemsTicket.value.find((item) => item.producto.id === producto.id)

  if (itemExistente) {
    itemExistente.cantidad++
  } else {
    itemsTicket.value.push({
      producto: producto,
      cantidad: 1,
      notas: '',
    })
  }
}

const cambiarCantidad = (item: ItemTicket, cantidad: number) => {
  item.cantidad += cantidad
  if (item.cantidad <= 0) {
    itemsTicket.value = itemsTicket.value.filter((i) => i.producto.id !== item.producto.id)
  }
}

const procesarPago = async () => {
  if (itemsTicket.value.length === 0) {
    return
  }

  const payload: CrearComandaRequest = {
    ticket_numero: generarTicketNumero(),
    total_final: total.value,
    sucursal_id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
    estado_actual: 'P',
    detalles_comanda: construirDetallesComanda(),
  }

  try {
    await crearComanda(payload)

    $q.notify({
      type: 'positive',
      message: 'Comanda enviada a cocina',
      position: 'top-right',
      timeout: 2500,
    })

    itemsTicket.value = []
    ticketAbierto.value = false
  } catch (err) {
    const mensajeError = obtenerDetalleError(err)

    $q.notify({
      type: 'negative',
      message: 'No se pudo procesar el pago',
      caption: mensajeError,
      position: 'top-right',
      timeout: 4000,
    })

    console.error('[CajaComponent] Error al procesar el pago:', err)
  }
}

onMounted(() => {
  void cargarProductos()
})

onBeforeUnmount(() => {
  abortController.abort()
})
</script>
