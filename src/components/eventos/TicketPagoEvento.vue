<script setup lang="ts">
/**
 * Comprobante imprimible de un pago registrado sobre una reservación
 * (abono/liquidación desde Pagos o Cierre de Evento).
 *
 * Mismo lenguaje visual que TicketReservacion.vue, pero con clases propias en
 * el bloque de impresión sin `scoped`: reutilizar los nombres de ese
 * componente haría que ambas hojas de impresión (inyectadas globalmente por
 * Vue sin importar cuál esté montada) se pisaran entre sí.
 *
 * Se imprime a 2 pulgadas de ancho porque así está calibrada la impresora de
 * tickets del sistema.
 */

import type { TicketPagoEventoProps } from '@/types/ticketPagoEvento'

const props = defineProps<TicketPagoEventoProps>()
defineEmits<{ close: [] }>()

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const liquidado = () => props.saldoPendiente <= 0

/** Folio corto y legible para dictar por teléfono; el UUID completo no sirve para eso. */
const folioCorto = () => props.folio.slice(0, 8).toUpperCase()

function fechaEmision(): string {
  const now = new Date()
  return (
    now.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' | ' +
    now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

function imprimir() {
  const titulo = document.title
  // El navegador usa document.title como nombre sugerido al guardar como PDF.
  document.title = `Pago_${folioCorto()}`
  window.print()
  document.title = titulo
}
</script>

<template>
  <div class="tpe-wrapper">
    <div class="tpe-ticket">
      <!-- Encabezado -->
      <div class="text-center q-mb-md">
        <div class="text-h6 text-weight-bold">Woow Kids</div>
        <div class="text-caption text-grey-7">{{ sucursal }}</div>
        <div class="ticket-tipo q-mt-xs">Comprobante de pago</div>
      </div>

      <q-separator class="q-mb-sm" />

      <div class="row justify-between q-mb-md">
        <div>
          <div class="ticket-label">Folio</div>
          <div class="ticket-folio">{{ folioCorto() }}</div>
        </div>
        <div class="text-right">
          <div class="ticket-label">Emitido</div>
          <div class="ticket-value">{{ fechaEmision() }}</div>
        </div>
      </div>

      <q-separator class="q-mb-sm" />

      <!-- Evento -->
      <div class="ticket-section-title q-mb-xs">Datos del evento</div>
      <div class="ticket-row">
        <span>Cliente</span><span class="text-weight-medium">{{ clienteNombre }}</span>
      </div>
      <div class="ticket-row">
        <span>Evento</span><span class="text-weight-medium">{{ tipoEvento }}</span>
      </div>
      <div class="ticket-row">
        <span>Fecha</span><span class="text-weight-medium">{{ fechaEvento }}</span>
      </div>

      <q-separator class="q-my-md" />

      <!-- Pago -->
      <div class="ticket-section-title q-mb-xs">Pago recibido</div>
      <div class="ticket-row">
        <span>Monto pagado</span><span class="text-weight-medium">{{ fmt(montoPagado) }}</span>
      </div>
      <div class="ticket-row">
        <span>Método</span><span class="text-weight-medium">{{ metodosPago }}</span>
      </div>
      <div v-if="notas" class="ticket-row">
        <span>Notas</span><span class="text-weight-medium">{{ notas }}</span>
      </div>

      <q-separator class="q-my-md" />

      <!-- Totales -->
      <div class="ticket-row">
        <span>Total del evento</span><span class="text-weight-medium">{{ fmt(totalEvento) }}</span>
      </div>
      <div class="ticket-row">
        <span>Pagado a la fecha</span>
        <span class="text-weight-medium">{{ fmt(totalPagadoAcumulado) }}</span>
      </div>

      <div class="ticket-saldo" :class="{ 'ticket-saldo--liquidado': liquidado() }">
        <span>{{ liquidado() ? 'Sin saldo pendiente' : 'Saldo pendiente' }}</span>
        <span>{{ fmt(saldoPendiente) }}</span>
      </div>

      <div v-if="!liquidado()" class="ticket-nota">El saldo se liquida el día del evento.</div>

      <div class="text-center text-caption text-grey-7 q-mt-md q-mb-md">
        ¡Gracias por celebrar con nosotros!
      </div>

      <div class="row q-gutter-sm tpe-print-hide">
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Imprimir ticket"
          icon="print"
          class="col"
          style="border-radius: 8px; font-weight: 600"
          @click="imprimir"
        />
        <q-btn
          outline
          no-caps
          color="grey-8"
          label="Cerrar"
          class="col"
          style="border-radius: 8px; font-weight: 600"
          @click="$emit('close')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tpe-wrapper {
  background: rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  justify-content: center;
  border-radius: 12px;
}

.tpe-ticket {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.ticket-tipo {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--q-primary);
  text-transform: uppercase;
}

.ticket-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.ticket-value {
  font-size: 13px;
  color: var(--text-primary);
}

.ticket-folio {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-primary);
}

.ticket-section-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 3px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.ticket-row > span:last-child {
  color: var(--text-primary);
  text-align: right;
}

.ticket-saldo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  background: rgba(2, 95, 224, 0.08);
  color: var(--q-primary);
}

.ticket-saldo--liquidado {
  background: rgba(63, 168, 52, 0.12);
  color: #2e7d32;
}

.ticket-nota {
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
}
</style>

<style>
/* Sin `scoped`: al imprimir hay que ocultar TODO lo demás de la app (menú lateral,
   encabezado, diálogo), y eso exige alcanzar elementos fuera de este componente.
   Las clases de este bloque llevan el prefijo `tpe-` para no chocar con el
   bloque global equivalente de TicketReservacion.vue. */
@media print {
  /* Impresora de tickets del sistema: rollo de 2". */
  @page {
    size: 2in auto;
    margin: 0;
  }

  body,
  #q-app,
  .q-layout,
  .q-page-container,
  .q-page,
  .q-dialog__backdrop {
    background: none !important;
    background-color: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .tpe-wrapper,
  .tpe-wrapper * {
    visibility: visible !important;
  }

  .tpe-wrapper {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 2in !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    background: none !important;
  }

  .tpe-ticket {
    box-shadow: none !important;
    border: none !important;
    padding: 6px 8px !important;
    max-width: 2in !important;
    width: 2in !important;
    border-radius: 0 !important;
    font-size: 9px !important;
  }

  .tpe-ticket .text-h6 {
    font-size: 13px !important;
  }

  .tpe-ticket .ticket-row,
  .tpe-ticket .ticket-saldo,
  .tpe-ticket .ticket-label,
  .tpe-ticket .ticket-value,
  .tpe-ticket .ticket-section-title,
  .tpe-ticket .ticket-tipo,
  .tpe-ticket .text-caption {
    font-size: 8px !important;
  }

  .tpe-ticket .ticket-folio {
    font-size: 11px !important;
  }

  .tpe-print-hide {
    display: none !important;
  }
}
</style>
