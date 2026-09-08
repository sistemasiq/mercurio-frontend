<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

const store = useRegistrationStore()
const authStore = useAuthStore()
const qrCodeUrl = ref('')

const branchName = computed(() => authStore.currentBranchName || 'Sucursal')
const cashierName = computed(() => authStore.currentUser?.name || 'Cajero')

onMounted(async () => {
  if (store.registroId) {
    const url = `${window.location.origin}/padres/access?code=${store.registroId}`
    qrCodeUrl.value = await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
  }
})

function formatDate() {
  const now = new Date()
  return (
    now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }) +
    ' ' +
    now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

function scheduledExit() {
  const time = store.tutor.estimatedTime
  const hours = parseInt(time) || 8
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function printVoucher() {
  const originalTitle = document.title
  document.title = 'Ticket_Registro'
  window.print()
  document.title = originalTitle
}
</script>

<template>
  <div class="voucher-wrapper">
    <div id="printable-voucher" class="voucher">
      <!-- Encabezado -->
      <div class="text-center">
        <div class="ticket-brand">Woow Kids</div>
        <div class="ticket-sub">{{ branchName }}</div>
        <div class="ticket-sub">Cajero: {{ cashierName }}</div>
      </div>

      <div class="ticket-divider">--------------------------------</div>

      <!-- Fecha y Tutor Compactos -->
      <div class="ticket-row">
        <span>Fecha:</span>
        <span class="text-weight-bold">{{ formatDate() }}</span>
      </div>
      <div class="ticket-row">
        <span>Tutor:</span>
        <span class="text-ellipsis">{{ store.tutor.fullName }}</span>
      </div>
      <div v-if="store.tutor.phone" class="ticket-row">
        <span>Tel:</span>
        <span>{{ store.tutor.phone }}</span>
      </div>

      <div class="ticket-divider">--------------------------------</div>

      <!-- Niños Registrados -->
      <div class="ticket-section-title">NIÑOS REGISTRADOS</div>
      <div
        v-for="child in store.savedChildren"
        :key="child.id"
        class="ticket-row items-center q-my-xs"
      >
        <span class="text-weight-bold text-ellipsis">{{ child.name }}</span>
        <span>{{ child.age }} años</span>
      </div>

      <div class="ticket-divider">--------------------------------</div>

      <!-- Salida y Pago -->
      <div class="ticket-box q-my-xs text-center">
        Salida Estimada: <strong>{{ scheduledExit() }}</strong>
      </div>

      <div class="ticket-row text-weight-bold q-mt-xs" style="font-size: 13px">
        <span>TOTAL:</span>
        <span>${{ store.total.toFixed(2) }}</span>
      </div>

      <!-- QR -->
      <div v-if="qrCodeUrl" class="text-center q-mt-sm">
        <img :src="qrCodeUrl" alt="QR" class="qr-code" />
        <div class="ticket-caption">Escanea para ver tu registro</div>
      </div>

      <div class="text-center ticket-footer q-mt-xs">¡Gracias por visitarnos!</div>

      <!-- Botón de pantalla (oculto al imprimir) -->
      <q-btn
        unelevated
        no-caps
        color="primary"
        label="Imprimir Ticket"
        icon="print"
        class="full-width print-hide q-mt-md"
        @click="printVoucher"
      />
    </div>
  </div>
</template>

<style scoped>
/* Vista en pantalla */
.voucher-wrapper {
  background: rgba(0, 0, 0, 0.05);
  padding: 16px;
  display: flex;
  justify-content: center;
}

.voucher {
  background: #fff;
  border-radius: 8px;
  padding: 14px 10px;
  width: 100%;
  max-width: 260px; /* Tamaño visual cercano a 58mm en pantalla */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', Courier, monospace;
  color: #000;
  font-size: 11px;
  line-height: 1.25;
}

.ticket-brand {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.ticket-sub {
  font-size: 10px;
  color: #444;
}

.ticket-divider {
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: -1px;
  color: #666;
  margin: 4px 0;
}

.ticket-section-title {
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2px;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-box {
  border: 1px dashed #000;
  padding: 4px;
  font-size: 11px;
}

.qr-code {
  width: 95px;
  height: 95px;
  display: inline-block;
}

.ticket-caption {
  font-size: 9px;
  color: #555;
  margin-top: 2px;
}

.ticket-footer {
  font-size: 10px;
}
</style>

<style>
@media print {
  @page {
    /* auto se adapta tanto a rollo térmico como a hojas estándar (A5, Carta) */
    size: auto;
    margin: 0;
  }

  /* 1. Ocultar visualmente todo el árbol de la app */
  body * {
    visibility: hidden;
  }

  /* 2. Colapsar el contenedor principal para que no mida altura y no cree páginas extra */
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    overflow: hidden !important;
  }

  /* 3. Hacer visible ÚNICAMENTE el ticket y sus descendientes */
  #printable-voucher,
  #printable-voucher * {
    visibility: visible;
  }

  /* 4. Anclar el ticket como fixed al inicio de la página 1 */
  #printable-voucher {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 72mm !important; /* Ancho legible en A5 o térmico */
    max-width: 100% !important;
    margin: 0 !important;
    padding: 6mm 8mm !important;
    background: #fff !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    color: #000 !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .ticket-sub,
  .ticket-caption,
  .ticket-divider {
    color: #000 !important;
  }

  /* 5. Asegurar que el botón desaparezca completamente */
  .print-hide {
    display: none !important;
  }
}
</style>
