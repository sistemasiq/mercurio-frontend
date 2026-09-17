<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'
import { printTicketDirecto } from '@/api/printerApi'
import { usePrinterFallback } from '@/composables/usePrinterFallback'
import { usePrinterStore } from '@/stores/printer'

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

const $q = useQuasar()
const { printPdfBase64ViaIframe } = usePrinterFallback()
const printerStore = usePrinterStore()

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)
const isPrinting = ref(false)
const ticketRef = ref<HTMLElement | null>(null)

// Ancho del ticket desde configuración desacoplada (58/80) — unificado PDF y HTML
const ticketAncho = computed(() => {
  const cfg = printerStore.configPorTipo('ticket')
  const w = cfg?.ancho_mm
  if (w === 58 || w === 80 || w === 210) return w
  return 80
})
const ticketWidthMm = computed(() => `${ticketAncho.value}mm`)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

const onBackdropClick = () => {
  if (!props.posMode) emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  try { await printerStore.cargarConfig() } catch {}
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

function getTicketHtmlForPrint(): string {
  const el = (ticketRef.value as HTMLElement | null) || (document.querySelector('.ticket-receipt') as HTMLElement | null)
  if (el?.outerHTML) return el.outerHTML
  if (!orden.value) return ''
  const o = orden.value
  const fecha = formatearFecha(o.fecha_hora)
  const filas = detallesAgrupados.value
    .map((item) => {
      if (item.nombre_combo_padre) return `<div class="ticket-row" style="margin-bottom:2px;"><div class="col-cant"></div><div class="col-desc" style="padding-left:12px;"><span style="font-size:10px;color:#333">- ${item.cantidad}x ${item.producto_nombre}</span></div><div class="col-imp"></div></div>`
      return `<div class="ticket-row"><div class="col-cant">${item.cantidad}</div><div class="col-desc"><strong>${item.producto_nombre}</strong>${item.notas_especiales ? `<div class="ticket-note">* ${item.notas_especiales}</div>` : ''}${item.cantidad > 1 ? `<div class="ticket-note">$${Number(item.precio_unitario).toFixed(2)} c/u</div>` : ''}</div><div class="col-imp">$${Number(item.importe).toFixed(2)}</div></div>`
    })
    .join('')
  const pagosHtml = (o.metodos_pago || []).map((mp) => `<div class="ticket-totals-row"><span>PAGO ${String(mp.metodo_pago_nombre).toUpperCase()}</span><span>$${Number(mp.monto).toFixed(2)}</span></div>`).join('')
  const canceladoHtml = esCancelado.value ? `<div class="ticket-cancelado">*** TICKET CANCELADO ***<br><small>${o.motivo_cancelacion || ''}</small></div>` : ''
  return `<div class="ticket-receipt">
    <div class="ticket-header"><h1>WOOW KIDS</h1><p>Nigromante 391, Peña</p><p>59375 La Piedad de Cabadas, Michoacán.</p></div>
    <div class="ticket-divider-dashed"></div>
    <div class="ticket-info"><span><strong>TICKET:</strong> ${o.titulo}</span><span><strong>FECHA:</strong> ${fecha.split(',')[0] || ''}</span></div>
    <div class="ticket-info"><span><strong>CAJERO:</strong> ${(o.creado_por_nombre || 'N/A').split(' ')[0]}</span><span><strong>HORA:</strong> ${fecha.split(',')[1] || ''}</span></div>
    ${o.nombre_cliente ? `<div class="ticket-info"><span><strong>CLIENTE:</strong> ${o.nombre_cliente}</span></div>` : ''}
    ${canceladoHtml}
    <div class="ticket-divider-dashed"></div>
    <div class="ticket-table-header"><div class="col-cant">CANT</div><div class="col-desc">DESCRIPCIÓN</div><div class="col-imp">Importe</div></div>
    <div class="ticket-divider-solid"></div>
    <div class="ticket-products">${filas}</div>
    <div class="ticket-divider-dashed-thin"></div>
    <div class="ticket-totals">${pagosHtml}</div>
    <div class="ticket-divider-solid-thick"></div>
    <div class="ticket-grand-total"><span>TOTAL VENTA</span><span>$${Number(o.total_final).toFixed(2)}</span></div>
    <div class="ticket-divider-solid-thick"></div>
    <div class="ticket-footer"><p>*** GRACIAS POR SU COMPRA ***</p><p>ESTE NO ES UN COMPROBANTE FISCAL</p></div>
  </div>`
}

function printHtmlViaIframe(html: string): void {
  // WYSIWYG unificado: ancho dinámico 58/80mm — mismo que PDF backend
  const w = ticketWidthMm.value
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = w
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    window.print()
    return
  }
  // Clonar estilos del documento actual (incluye scoped de .ticket-receipt)
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n')
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${headStyles}
    <style>
      @page { size: ${w} auto; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .ticket-receipt { width: ${w} !important; max-width: ${w} !important; margin: 0 auto !important; padding: 15px !important; box-sizing: border-box !important; }
    </style>
  </head><body>${html}</body></html>`)
  doc.close()
  const doPrint = () => {
    try {
      const body = doc.body
      if (body) iframe.style.height = `${Math.max(body.scrollHeight, 400) + 20}px`
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 1500)
    }
  }
  setTimeout(doPrint, 400)
}

async function ejecutarImpresion() {
  if (!orden.value || isPrinting.value) return
  isPrinting.value = true
  try {
    // Literal como te gustaba: imprime exactamente el preview general (WOOW KIDS, Importe, 58/80mm)
    const html = getTicketHtmlForPrint()
    if (!html) throw new Error('No se pudo capturar el ticket')
    await nextTick()
    printHtmlViaIframe(html)
    $q.notify({ type: 'positive', message: `Impresión lista (${ticketAncho.value}mm) — revisa el diálogo` })
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message || 'Error al imprimir' })
  } finally {
    isPrinting.value = false
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

          <!-- TICKET TÉRMICO — ancho dinámico 58/80mm unificado con PDF -->
          <div v-else-if="orden" ref="ticketRef" class="ticket-receipt" :style="{ width: ticketWidthMm, maxWidth: ticketWidthMm }">
            <!-- Encabezado fijo WOOW KIDS -->
            <div class="ticket-header">
              <h1>WOOW KIDS</h1>
              <p>Nigromante 391, Peña</p>
              <p>59375 La Piedad de Cabadas, Michoacán.</p>
            </div>

            <div class="ticket-divider-dashed"></div>

            <!-- Sección de Datos (Dos columnas) -->
            <div class="ticket-info">
              <span><strong>TICKET:</strong> {{ orden.titulo }}</span>
              <span><strong>FECHA:</strong> {{ formatearFecha(orden.fecha_hora).split(',')[0] }}</span>
            </div>
            <div class="ticket-info">
              <span><strong>CAJERO:</strong> {{ orden.creado_por_nombre?.split(' ')[0] || 'N/A' }}</span>
              <span><strong>HORA:</strong> {{ formatearFecha(orden.fecha_hora).split(',')[1] || '' }}</span>
            </div>
            <div v-if="orden.nombre_cliente" class="ticket-info">
              <span><strong>CLIENTE:</strong> {{ orden.nombre_cliente }}</span>
            </div>

            <div v-if="esCancelado" class="ticket-cancelado">
              *** TICKET CANCELADO ***<br />
              <small>{{ orden.motivo_cancelacion }}</small>
            </div>

            <div class="ticket-divider-dashed"></div>

            <!-- Detalle de Productos -->
            <div class="ticket-table-header">
              <div class="col-cant">CANT</div>
              <div class="col-desc">DESCRIPCIÓN</div>
              <div class="col-imp">Importe</div>
            </div>
            <div class="ticket-divider-solid"></div>

            <div class="ticket-products">
              <div
                v-for="(item, idx) in detallesAgrupados"
                :key="idx"
                class="ticket-row"
                :style="item.nombre_combo_padre ? 'margin-bottom: 2px;' : ''"
              >
                <div class="col-cant">
                  <span v-if="!item.nombre_combo_padre">{{ item.cantidad }}</span>
                </div>
                <div class="col-desc" :style="item.nombre_combo_padre ? 'padding-left: 12px;' : ''">
                  <strong v-if="!item.nombre_combo_padre">{{ item.producto_nombre }}</strong>
                  <span v-else style="font-size: 10px; color: #333">- {{ item.cantidad }}x {{ item.producto_nombre }}</span>
                  <div v-if="item.notas_especiales" class="ticket-note">* {{ item.notas_especiales }}</div>
                  <div v-if="item.cantidad > 1 && !item.nombre_combo_padre" class="ticket-note">${{ Number(item.precio_unitario).toFixed(2) }} c/u</div>
                </div>
                <div class="col-imp">
                  <span v-if="!item.nombre_combo_padre">${{ Number(item.importe).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="ticket-divider-dashed-thin"></div>

            <!-- Totales y Pagos -->
            <div class="ticket-totals">
              <div v-for="(mp, idx) in orden.metodos_pago" :key="idx" class="ticket-totals-row">
                <span>PAGO {{ String(mp.metodo_pago_nombre).toUpperCase() }}</span>
                <span>${{ Number(mp.monto).toFixed(2) }}</span>
              </div>
            </div>

            <div class="ticket-divider-solid-thick"></div>

            <div class="ticket-grand-total">
              <span>TOTAL VENTA</span>
              <span>${{ Number(orden.total_final).toFixed(2) }}</span>
            </div>

            <div class="ticket-divider-solid-thick"></div>

            <!-- Pie de Página fijo -->
            <div class="ticket-footer">
              <p>*** GRACIAS POR SU COMPRA ***</p>
              <p>ESTE NO ES UN COMPROBANTE FISCAL</p>
            </div>
          </div>

          <!-- Botones de Acción (Ocultos al imprimir) -->
          <div v-if="orden" class="pos-actions print-hide">
            <button type="button" class="btn-pos-print" :disabled="isPrinting" @click="ejecutarImpresion()">
              <q-icon name="print" size="sm" class="q-mr-xs" />
              {{ isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket' }}
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

/* ── DISEÑO ESTRICTO DEL TICKET — ancho dinámico 58/80mm — */
.ticket-receipt {
  font-family: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  width: 100%;
  max-width: 80mm; /* default, sobreescrito por :style inline según config */
  margin: 0 auto;
  background: white;
  color: black;
  font-size: 12px;
  line-height: 1.6;
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
.ticket-divider,
.ticket-divider-dashed {
  border-bottom: 1px dashed black;
  margin: 14px 0;
}
.ticket-divider-solid {
  border-bottom: 1px solid black;
  margin: 0 0 12px 0;
}
.ticket-divider-dashed-thin {
  border-bottom: 1px dashed #888;
  margin: 12px 0;
}
.ticket-divider-solid-thick {
  border-bottom: 2px solid black;
  margin: 12px 0;
}
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
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-weight: bold;
  font-size: 11px;
  border-bottom: 1px solid black;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.ticket-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 11px;
} /* Separación clara entre cada producto */
.col-cant {
  flex: 0 0 15%;
  width: 15%;
  text-align: left;
  box-sizing: border-box;
}
.col-desc {
  flex: 1 1 60%;
  width: 60%;
  padding-right: 5px;
  word-wrap: break-word;
  box-sizing: border-box;
}
.col-imp {
  flex: 0 0 22%;
  width: 22%;
  text-align: right;
  box-sizing: border-box;
  white-space: nowrap;
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
    max-height: none !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    flex: none !important;
  }

  .ticket-receipt {
    display: block !important;
    visibility: visible !important;
    width: 80mm !important;
    max-width: 80mm !important;
    padding: 15px !important;
    margin: 0 auto !important;
    font-family: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
    font-size: 12px !important;
    line-height: 1.6 !important;
    background: #fff !important;
    color: #000 !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }

  .ticket-receipt * {
    visibility: visible !important;
  }

  .ticket-header,
  .ticket-info,
  .ticket-table-header,
  .ticket-products,
  .ticket-row,
  .ticket-totals,
  .ticket-totals-row,
  .ticket-grand-total,
  .ticket-footer,
  .ticket-divider,
  .ticket-cancelado {
    display: flex !important;
    visibility: visible !important;
    overflow: visible !important;
    page-break-inside: avoid !important;
  }

  .ticket-header {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .ticket-products {
    flex-direction: column !important;
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
