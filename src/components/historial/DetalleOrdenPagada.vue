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
      ejecutarImpresion()
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

const TICKET_PRINT_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; width: 80mm; }
  body { font-family: 'Courier New', Courier, monospace; }
  .ticket-print-root {
    width: 80mm;
    padding: 4mm;
    background: #fff;
    color: #000;
    font-size: 12px;
    line-height: 1.5;
  }
  .ticket-print-root h1 { font-size: 20px; font-weight: 900; margin: 0 0 2mm; letter-spacing: 1px; text-align: center; }
  .ticket-print-root .t-header { text-align: center; margin-bottom: 2mm; }
  .ticket-print-root .t-header p { margin: 1mm 0; font-size: 10px; }
  .ticket-print-root .t-divider { border-bottom: 1px dashed #000; margin: 3mm 0; }
  .ticket-print-root .t-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2mm; }
  .ticket-print-root .t-row strong { font-weight: 700; }
  .ticket-print-root .t-table-head { display: flex; font-weight: 700; font-size: 10px; border-bottom: 1px solid #000; padding-bottom: 2mm; margin-bottom: 2mm; }
  .ticket-print-root .t-product { display: flex; align-items: flex-start; margin-bottom: 3mm; font-size: 10px; }
  .ticket-print-root .t-product .c-cant { width: 12%; text-align: left; }
  .ticket-print-root .t-product .c-desc { width: 60%; padding-right: 2mm; word-wrap: break-word; }
  .ticket-print-root .t-product .c-desc strong { font-weight: 700; }
  .ticket-print-root .t-product .c-imp { width: 28%; text-align: right; }
  .ticket-print-root .t-product .t-note { font-size: 9px; color: #555; margin-top: 1mm; }
  .ticket-print-root .t-cancelado { text-align: center; color: red; font-weight: 700; border: 1px solid red; padding: 2mm; margin: 3mm 0; }
  .ticket-print-root .t-totals-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2mm; text-transform: uppercase; }
  .ticket-print-root .t-grand-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 3mm; border-top: 2px solid #000; padding-top: 2mm; }
  .ticket-print-root .t-footer { text-align: center; font-size: 9px; font-weight: 700; margin-top: 5mm; }
  .ticket-print-root .t-footer p { margin: 1mm 0; }
`

function getTicketHtml(): string {
  const el = document.querySelector('.ticket-receipt')
  if (!el) return ''
  return el.outerHTML
}

function ejecutarImpresion() {
  const html = getTicketHtml()
  if (!html) return

  const ticketWidth = 302
  const ticketHeight = 600
  const left = (screen.width - ticketWidth) / 2
  const top = (screen.height - ticketHeight) / 2

  const printWin = window.open(
    '',
    '_blank',
    `width=${ticketWidth},height=${ticketHeight},left=${left},top=${top},scrollbars=no`,
  )
  if (!printWin) return

  printWin.document.write(`<!DOCTYPE html>
<html><head><title>Ticket</title></head><body>
<div class="ticket-print-root">${html}</div>
<style>${TICKET_PRINT_CSS}</style>
</body></html>`)
  printWin.document.close()

  printWin.onload = () => {
    setTimeout(() => {
      printWin.print()
      printWin.close()
    }, 250)
  }
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
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

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

  .print-hide,
  .pos-header,
  .pos-actions,
  .close-styled-btn {
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
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .ticket-receipt {
    width: 80mm !important;
    max-width: 80mm !important;
    padding: 4mm !important;
    margin: 0 !important;
    font-family: 'Courier New', Courier, monospace !important;
  }

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
