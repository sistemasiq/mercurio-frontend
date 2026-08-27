<script setup lang="ts">
/**
 * Comprobante imprimible de una reservación recién confirmada.
 *
 * Sigue el mismo lenguaje visual que PrintVoucher.vue (el ticket de estancias),
 * pero con clases propias: aquéllas viven en un bloque <style> sin `scoped`, así
 * que reutilizar sus nombres haría que ambas hojas de impresión se pisaran.
 *
 * Recibe todo por props en vez de leer los stores para que el ticket muestre
 * exactamente lo que se cobró, congelado en el momento de confirmar, sin
 * depender de estado que ya podría haber cambiado.
 */

import type { TicketReservacionProps } from '@/types/ticketReservacion'

const props = defineProps<TicketReservacionProps>()

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const saldo = () => Math.max(0, props.total - props.anticipo)
const liquidado = () => saldo() <= 0

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
  document.title = `Reservacion_${folioCorto()}`
  window.print()
  document.title = titulo
}
</script>

<template>
  <div class="ticket-wrapper">
    <div class="ticket">
      <!-- Encabezado -->
      <div class="text-center q-mb-md">
        <div class="text-h6 text-weight-bold">Woow Kids</div>
        <div class="text-caption text-grey-7">{{ sucursal }}</div>
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

      <!-- Cliente -->
      <div class="ticket-section-title q-mb-xs">Datos del cliente</div>
      <div class="ticket-row">
        <span>Nombre</span><span class="text-weight-medium">{{ clienteNombre }}</span>
      </div>
      <div class="ticket-row">
        <span>Teléfono</span><span class="text-weight-medium">{{ clienteTelefono }}</span>
      </div>
      <div v-if="clienteEmail" class="ticket-row">
        <span>Correo</span><span class="text-weight-medium">{{ clienteEmail }}</span>
      </div>

      <q-separator class="q-my-md" />

      <!-- Evento -->
      <div class="ticket-section-title q-mb-xs">Detalles del evento</div>
      <div class="ticket-row">
        <span>Tipo</span><span class="text-weight-medium">{{ tipoEvento }}</span>
      </div>
      <div class="ticket-row">
        <span>Fecha</span><span class="text-weight-medium">{{ fechaEvento }}</span>
      </div>
      <div class="ticket-row">
        <span>Horario</span><span class="text-weight-medium">{{ horario }}</span>
      </div>
      <div class="ticket-row">
        <span>Invitados</span><span class="text-weight-medium">{{ numeroNinos }}</span>
      </div>
      <div class="ticket-row">
        <span>Paquete</span><span class="text-weight-medium">{{ paqueteNombre }}</span>
      </div>

      <q-separator class="q-my-md" />

      <!-- Desglose -->
      <div class="ticket-section-title q-mb-xs">Desglose</div>
      <div v-for="(c, i) in conceptos" :key="i" class="ticket-row">
        <span>{{ c.descripcion }}</span>
        <span class="text-weight-medium">{{ fmt(c.importe) }}</span>
      </div>

      <div class="ticket-total q-mt-sm">
        <span>TOTAL</span><span>{{ fmt(total) }}</span>
      </div>

      <q-separator class="q-my-md" />

      <!-- Pago -->
      <div class="ticket-section-title q-mb-xs">Pago</div>
      <div class="ticket-row">
        <span>{{ liquidado() ? 'Liquidado' : 'Anticipo recibido' }}</span>
        <span class="text-weight-medium">{{ fmt(anticipo) }}</span>
      </div>
      <div v-if="metodosPago" class="ticket-row">
        <span>Método</span><span class="text-weight-medium">{{ metodosPago }}</span>
      </div>

      <div class="ticket-saldo" :class="{ 'ticket-saldo--liquidado': liquidado() }">
        <span>{{ liquidado() ? 'Sin saldo pendiente' : 'Saldo pendiente' }}</span>
        <span>{{ fmt(saldo()) }}</span>
      </div>

      <div v-if="!liquidado()" class="ticket-nota">El saldo se liquida el día del evento.</div>

      <div class="text-center text-caption text-grey-7 q-mt-md q-mb-md">
        ¡Gracias por celebrar con nosotros!
      </div>

      <q-btn
        unelevated
        no-caps
        color="primary"
        label="Imprimir ticket"
        icon="print"
        class="full-width ticket-print-hide"
        style="border-radius: 8px; font-weight: 600"
        @click="imprimir"
      />
    </div>
  </div>
</template>

<style scoped>
.ticket-wrapper {
  background: rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  justify-content: center;
  border-radius: 12px;
}

.ticket {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
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

.ticket-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 2px solid var(--border-color);
  padding-top: 8px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
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
   encabezado, asistente), y eso exige alcanzar elementos fuera de este componente. */
@media print {
  @page {
    margin: 0;
  }

  body,
  #q-app,
  .q-layout,
  .q-page-container,
  .q-page {
    background: none !important;
    background-color: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .ticket-wrapper,
  .ticket-wrapper * {
    visibility: visible !important;
  }

  .ticket-wrapper {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    justify-content: center !important;
    background: none !important;
  }

  .ticket {
    box-shadow: none !important;
    border: none !important;
    padding: 24px !important;
    max-width: 100% !important;
  }

  .ticket-print-hide {
    display: none !important;
  }
}
</style>
