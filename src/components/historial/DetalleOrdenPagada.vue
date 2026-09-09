<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'

const props = withDefaults(
  defineProps<{
    tipoOrigen?: 'comanda' | 'estancia' | 'reservacion'
    referenciaId?: string
    comandaId?: string
    posMode?: boolean
    autoPrint?: boolean
  }>(),
  { tipoOrigen: 'comanda', referenciaId: '', comandaId: '', posMode: false, autoPrint: false },
)
const emit = defineEmits(['close'])

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

const onBackdropClick = () => {
  if (!props.posMode) emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  try {
    orden.value = await obtenerDetalleOrden(props.tipoOrigen, props.referenciaId || props.comandaId)
    if (props.autoPrint) {
      await nextTick()
      window.print()
    }
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

const esCancelado = computed(() => {
  const estado = orden.value?.estado_actual
  if (!estado) return false
  if (orden.value?.tipo_origen === 'reservacion') return estado === 'cancelada'
  return estado === 'C'
})

const detallesAgrupados = computed(() => {
  if (!orden.value?.detalles) return []

  // Separamos los productos normales/padres de los que son contenido de combo
  const principales = orden.value.detalles.filter((item) => !item.nombre_combo_padre)
  const hijos = orden.value.detalles.filter((item) => item.nombre_combo_padre)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultado: any[] = []

  principales.forEach((padre) => {
    resultado.push(padre) // Metemos el producto principal a la lista final

    // Si este producto es un combo, buscamos sus hijos y los metemos justo debajo
    const susHijos = hijos.filter((h) => h.nombre_combo_padre === padre.producto_nombre)
    resultado.push(...susHijos)
  })

  return resultado
})

function formatearFecha(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ejecutarImpresion = () => {
  window.print()
}
</script>

<template>
  <div :class="posMode ? 'ticket-pos-root' : 'modal-backdrop-blur'" @click="onBackdropClick">
    <div class="order-detail-card" @click.stop>
      <!-- Header de la ventana (Oculto al imprimir) -->
      <header class="pos-header print-hide">
        <span v-if="orden" class="pos-header__title">Pago Registrado</span>
        <q-btn icon="close" round unelevated class="close-styled-btn" @click="emit('close')" />
      </header>

      <div class="detail-scroll-area">
        <div class="detail-content">
          <div v-if="isLoading" class="loading-state print-hide">
            <q-spinner size="32px" color="primary" />
            <p>Cargando detalle...</p>
          </div>

          <!-- TICKET TÉRMICO CON CSS PURO -->
          <div v-else-if="orden" class="ticket-receipt">
            <div class="ticket-header">
              <h1>WOOW KIDS</h1>
              <p>Nigromante 391, Peña</p>
              <p>59375 La Piedad de Cabadas, Mich.</p>
            </div>

            <div class="ticket-divider"></div>

            <div class="ticket-info">
              <span><strong>TICKET:</strong> {{ orden.titulo }}</span>
              <span
                ><strong>FECHA:</strong> {{ formatearFecha(orden.fecha_hora).split(',')[0] }}</span
              >
            </div>
            <div class="ticket-info">
              <span
                ><strong>CAJERO:</strong>
                {{ orden.creado_por_nombre?.split(' ')[0] || 'N/A' }}</span
              >
              <span
                ><strong>HORA:</strong>
                {{ formatearFecha(orden.fecha_hora).split(',')[1] || '' }}</span
              >
            </div>
            <div v-if="orden.nombre_cliente" class="ticket-info">
              <span><strong>CLIENTE:</strong> {{ orden.nombre_cliente }}</span>
            </div>

            <div v-if="esCancelado" class="ticket-cancelado">
              *** TICKET CANCELADO ***<br />
              <small>{{ orden.motivo_cancelacion }}</small>
            </div>

            <div class="ticket-divider"></div>

            <div class="ticket-table-header">
              <div class="col-cant">CANT</div>
              <div class="col-desc">DESCRIPCIÓN</div>
              <div class="col-imp">IMP</div>
            </div>

            <div class="ticket-products">
              <div
                v-for="(item, idx) in detallesAgrupados"
                :key="idx"
                class="ticket-row"
                :style="item.nombre_combo_padre ? 'margin-bottom: 2px;' : ''"
              >
                <!-- Columna Cantidad -->
                <div class="col-cant">
                  <!-- Solo mostramos el número grande si NO es hijo de un combo -->
                  <span v-if="!item.nombre_combo_padre">{{ item.cantidad }}</span>
                </div>

                <!-- Columna Descripción -->
                <div class="col-desc" :style="item.nombre_combo_padre ? 'padding-left: 12px;' : ''">
                  <!-- Nombre normal para productos y combos principales -->
                  <strong v-if="!item.nombre_combo_padre">{{ item.producto_nombre }}</strong>

                  <!-- Sub-elemento de combo (con sangría y viñeta) -->
                  <span v-else style="font-size: 10px; color: #333">
                    - {{ item.cantidad }}x {{ item.producto_nombre }}
                  </span>

                  <div v-if="item.notas_especiales" class="ticket-note">
                    * {{ item.notas_especiales }}
                  </div>
                  <div v-if="item.cantidad > 1 && !item.nombre_combo_padre" class="ticket-note">
                    ${{ Number(item.precio_unitario).toFixed(2) }} c/u
                  </div>
                </div>

                <!-- Columna Importe -->
                <div class="col-imp">
                  <!-- Ocultamos el precio si es parte de un combo -->
                  <span v-if="!item.nombre_combo_padre"
                    >${{ Number(item.importe).toFixed(2) }}</span
                  >
                </div>
              </div>
            </div>

            <div class="ticket-divider"></div>

            <div class="ticket-totals">
              <div v-for="(mp, idx) in orden.metodos_pago" :key="idx" class="ticket-totals-row">
                <span>PAGO {{ mp.metodo_pago_nombre }}</span>
                <span>${{ Number(mp.monto).toFixed(2) }}</span>
              </div>

              <div class="ticket-grand-total">
                <span>TOTAL VENTA</span>
                <span>${{ Number(orden.total_final).toFixed(2) }}</span>
              </div>
            </div>

            <div class="ticket-footer">
              <p>*** GRACIAS POR SU COMPRA ***</p>
              <p>ESTE NO ES UN COMPROBANTE FISCAL</p>
            </div>
          </div>

          <!-- Botones de Acción (Ocultos al imprimir) -->
          <div v-if="orden" class="pos-actions print-hide">
            <button type="button" class="btn-pos-print" @click="ejecutarImpresion()">
              <q-icon name="print" size="sm" class="q-mr-xs" /> Imprimir Ticket
            </button>
            <button type="button" class="btn-pos-close" @click="emit('close')">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── UI Del Modal ── */
.modal-backdrop-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 4000;
}
.order-detail-card {
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  background-color: #f8fafc;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ticket-pos-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ticket-pos-root .order-detail-card {
  max-width: 450px;
  margin: 0 auto;
  border-radius: 16px;
  flex: 1;
}
.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}
.pos-header__title {
  font-size: 16px;
  font-weight: bold;
  color: #0f172a;
}
.detail-scroll-area {
  flex: 1;
  overflow-y: auto;
}
.detail-content {
  padding: 20px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #64748b;
}
.pos-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-pos-print,
.btn-pos-close {
  flex: 1;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
}
.btn-pos-print {
  background: transparent;
  border: 1px solid #0059bb;
  color: #0059bb;
}
.btn-pos-close {
  background: #0059bb;
  border: none;
  color: white;
}

/* ── DISEÑO ESTRICTO DEL TICKET ── */
.ticket-receipt {
  font-family: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  background: white;
  color: black;
  font-size: 12px;
  line-height: 1.6; /* Mayor respiro general entre líneas de texto */
  padding: 15px;
  box-sizing: border-box;
}
.ticket-header {
  text-align: center;
  margin-bottom: 4px;
} /* Reducido para evitar el doble espacio */
.ticket-header h1 {
  font-size: 22px;
  font-weight: 900;
  margin: 0 0 4px 0;
  letter-spacing: 1px;
}
.ticket-header p {
  margin: 3px 0;
  font-size: 11px;
}
.ticket-divider {
  border-bottom: 1px dashed black;
  margin: 14px 0;
} /* Más espacio alrededor de separadores */
.ticket-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 8px;
} /* Aumentado de 4px a 8px */
.ticket-cancelado {
  text-align: center;
  color: red;
  font-weight: bold;
  border: 1px solid red;
  padding: 5px;
  margin: 12px 0;
}
.ticket-table-header {
  display: flex;
  font-weight: bold;
  font-size: 11px;
  border-bottom: 1px solid black;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.ticket-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
  font-size: 11px;
} /* Separación clara entre cada producto */
.col-cant {
  width: 15%;
  text-align: left;
}
.col-desc {
  width: 60%;
  padding-right: 5px;
  word-wrap: break-word;
}
.col-imp {
  width: 25%;
  text-align: right;
}
.ticket-note {
  font-size: 10px;
  color: #555;
  margin-top: 4px;
  font-weight: normal;
}
.ticket-totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 8px;
  text-transform: uppercase;
} /* Más aire entre pagos */
.ticket-grand-total {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: bold;
  margin-top: 14px;
  border-top: 2px solid black;
  padding-top: 12px;
} /* Gran respiro para el total final */
.ticket-footer {
  text-align: center;
  font-size: 10px;
  font-weight: bold;
  margin-top: 24px;
} /* Separado del cobro */
.ticket-footer p {
  margin: 4px 0;
}
</style>

<style>
/* Reglas globales inquebrantables para imprimir */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body,
  html {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
  .print-hide {
    display: none !important;
  }
  .modal-backdrop-blur,
  .ticket-pos-root,
  .order-detail-card,
  .detail-scroll-area,
  .detail-content {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  .ticket-receipt {
    padding: 0 !important;
    width: 72mm !important; /* Ajusta perfecto a impresoras térmicas */
  }
  @page {
    margin: 0mm;
  }
}
</style>

<style>
/* Reglas estrictas para exportación a PDF y ticketera */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body,
  html {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  .modal-backdrop-blur,
  .ticket-pos-root,
  .order-detail-card,
  .detail-scroll-area {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  /* Ajuste de márgenes predeterminados de impresión web */
  @page {
    margin: 0mm;
  }
}
</style>

<style>
/* ── Print styles ──────────────────────────────────────── */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .pos-header,
  .pos-actions,
  .close-styled-btn {
    display: none !important;
  }

  .modal-backdrop-blur,
  .ticket-pos-root {
    position: static !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    background: none !important;
    backdrop-filter: none !important;
    display: block !important;
    padding: 0 !important;
  }

  .order-detail-card {
    max-width: 340px !important;
    width: 100% !important;
    margin: 0 auto !important;
    background: #fff !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    height: auto !important;
  }

  .detail-scroll-area {
    overflow: visible !important;
    max-height: none !important;
  }

  .detail-content {
    padding: 24px 20px !important;
    font-family: 'Courier New', Courier, monospace !important;
  }

  /* Encabezado ticket */
  .pos-ticket-head {
    background: none !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin-bottom: 16px !important;
    gap: 6px !important;
  }

  .pos-ticket-head__row {
    display: flex !important;
    justify-content: space-between !important;
    padding: 3px 0 !important;
    border-bottom: 1px dotted #e2e8f0 !important;
  }

  .pos-ticket-head__row:last-child {
    border-bottom: none !important;
  }

  .pos-ticket-head__label {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #717786 !important;
    text-transform: uppercase !important;
  }

  .pos-ticket-head__value {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #191c1d !important;
  }

  .badge {
    font-size: 9px !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
  }

  /* Productos */
  .products-section {
    margin-bottom: 16px !important;
  }

  .section-subtitle {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #717786 !important;
    text-transform: uppercase !important;
    margin: 0 0 8px 0 !important;
    padding-bottom: 4px !important;
    border-bottom: 1px dashed #cbd5e1 !important;
  }

  .product-item {
    border: none !important;
    border-radius: 0 !important;
    border-bottom: 1px dotted #e2e8f0 !important;
    padding: 8px 0 !important;
    background: none !important;
  }

  .product-item:last-child {
    border-bottom: none !important;
  }

  .product-item--combo-child {
    background: none !important;
    border-left: none !important;
    padding-left: 24px !important;
  }

  .product-qty-box {
    background: #f1f5f9 !important;
    border-radius: 4px !important;
  }

  .product-qty-box--child {
    background: none !important;
    color: #717786 !important;
  }

  .product-name {
    color: #191c1d !important;
  }

  .product-total-price {
    color: #191c1d !important;
  }

  /* Métodos de pago */
  .summary-section {
    background: none !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }

  .payment-card-box {
    border: none !important;
    border-radius: 0 !important;
    border-bottom: 1px dotted #e2e8f0 !important;
    padding: 6px 0 !important;
    background: none !important;
  }

  .payment-card-box:last-child {
    border-bottom: none !important;
  }

  .card-amount {
    color: #191c1d !important;
  }

  /* Totales */
  .totals-breakdown {
    background: none !important;
    border: none !important;
    border-top: 2px dashed #191c1d !important;
    border-bottom: 2px dashed #191c1d !important;
    border-radius: 0 !important;
    padding: 12px 0 !important;
    margin-top: 8px !important;
  }

  .divider-dash {
    border-top: 1px dotted #cbd5e1 !important;
  }

  .final-val {
    font-size: 18px !important;
    font-weight: 800 !important;
    color: #191c1d !important;
  }
}
</style>

<style>
@media print {
  .historial-layout-wrapper > * {
    display: none !important;
  }
  .historial-layout-wrapper > .modal-backdrop-blur {
    display: block !important;
    position: static !important;
    background: none !important;
  }
}
</style>
