<script setup lang="ts">
import { computed } from 'vue'
import type { DetalleOrden, DetalleProducto } from '@/api/historialApi'
import { ticketContentWidth, type TicketWidth } from '@/utils/ticketPrinting'

const props = defineProps<{ orden: DetalleOrden; anchoMm: TicketWidth }>()
const esCancelado = computed(() => {
  const estado = props.orden?.estado_actual
  if (!estado) return false
  if (props.orden?.tipo_origen === 'reservacion') return estado === 'cancelada'
  return estado === 'C'
})

const detallesAgrupados = computed(() => {
  if (!props.orden?.detalles) return []

  // Separamos los productos normales/padres de los que son contenido de combo
  const principales = props.orden.detalles.filter((item) => !item.nombre_combo_padre)
  const hijos = props.orden.detalles.filter((item) => item.nombre_combo_padre)

  const resultado: DetalleProducto[] = []

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
</script>

<template>
  <div class="ticket-receipt" :style="{ width: ticketContentWidth(anchoMm) }">
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
          <span v-else style="font-size: 10px; color: #333"
            >- {{ item.cantidad }}x {{ item.producto_nombre }}</span
          >
          <div v-if="item.notas_especiales" class="ticket-note">* {{ item.notas_especiales }}</div>
          <div v-if="item.cantidad > 1 && !item.nombre_combo_padre" class="ticket-note">
            ${{ Number(item.precio_unitario).toFixed(2) }} c/u
          </div>
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
</template>

<style scoped>
/* ── DISEÑO ESTRICTO DEL TICKET — ancho dinámico 58/80mm — */
.ticket-receipt {
  font-family: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  width: 100%;
  max-width: none;
  flex: none;
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

/* Same responsive layout for screen preview and the printed document. */
.ticket-row,
.ticket-table-header {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) max-content;
}
.col-cant,
.col-desc,
.col-imp {
  width: auto;
  min-width: 0;
}
.col-desc {
  overflow-wrap: anywhere;
}
.ticket-info {
  gap: 8px;
  flex-wrap: wrap;
  overflow-wrap: anywhere;
}
.ticket-totals-row,
.ticket-grand-total {
  gap: 8px;
}
.ticket-totals-row > span:last-child,
.ticket-grand-total > span:last-child {
  white-space: nowrap;
}
</style>
