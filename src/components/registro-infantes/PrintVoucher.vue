<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

const store = useRegistrationStore()
const authStore = useAuthStore()
const qrCodeUrl = ref('')

const branchName = computed(() => authStore.currentBranchName || 'Sucursal')

onMounted(async () => {
  if (store.registroId) {
    const url = `${window.location.origin}/padres/access?code=${store.registroId}`
    qrCodeUrl.value = await QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'L',
    })
  }
})

function formatDate() {
  const now = new Date()
  return (
    now.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) +
    ' | ' +
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

function getBraceletLabel(braceletId: string) {
  const bracelet = store.pulseras.find((p) => p.id === braceletId)
  return bracelet?.pulseraRfid ?? braceletId
}
</script>

<template>
  <div class="voucher-wrapper">
    <div id="printable-voucher" class="voucher">
      <!-- Header -->
      <div class="voucher-header text-center q-mb-md">
        <div class="text-h6 text-weight-bold">Woow Kids</div>
        <div class="text-caption text-grey-7">{{ branchName }}</div>
      </div>

      <q-separator class="q-mb-sm" />

      <!-- Date -->
      <div class="row justify-between q-mb-md">
        <div>
          <div class="voucher-label">FECHA &amp; HORA</div>
          <div class="voucher-value">{{ formatDate() }}</div>
        </div>
      </div>

      <q-separator class="q-mb-sm" />

      <!-- Tutor Data -->
      <div class="voucher-section-title q-mb-xs">DATOS DEL TUTOR</div>
      <div class="row justify-between q-mb-xs">
        <span class="text-body2">Nombre:</span>
        <span class="text-body2 text-weight-medium">{{ store.tutor.fullName }}</span>
      </div>
      <div class="row justify-between q-mb-md">
        <span class="text-body2">Teléfono:</span>
        <span class="text-body2 text-weight-medium">{{ store.tutor.phone }}</span>
      </div>

      <!-- Second Tutor -->
      <div v-if="store.tutor.secondaryGuardian" class="q-mb-md">
        <div class="row justify-between q-mb-xs">
          <span class="text-body2">Segundo Tutor:</span>
          <span class="text-body2 text-weight-medium">{{ store.tutor.secondaryGuardian }}</span>
        </div>
      </div>

      <q-separator class="q-mb-sm" />

      <!-- Children -->
      <div class="voucher-section-title q-mb-xs">NIÑOS REGISTRADOS</div>
      <div class="row text-caption text-grey-7 q-mb-xs">
        <div class="col">Nombre</div>
        <div style="width: 50px" class="text-center">Edad</div>
        <div style="width: 100px" class="text-right">Pulsera</div>
      </div>
      <div v-for="child in store.savedChildren" :key="child.id" class="row items-center q-mb-xs">
        <div class="col text-weight-medium" style="font-size: 14px">{{ child.name }}</div>
        <div style="width: 50px" class="text-center text-body2">{{ child.age }}</div>
        <div style="width: 100px" class="text-right">
          <span class="text-caption text-grey-7 bracelet-code">{{
            getBraceletLabel(child.rfidBracelet)
          }}</span>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <!-- Stay details -->
      <div class="stay-box q-pa-sm q-mb-md">
        <div class="voucher-section-title q-mb-sm">DETALLES DE ESTANCIA</div>
        <div class="row justify-between q-mb-xs">
          <span class="text-body2">Tiempo Prepagado:</span>
          <span class="text-weight-bold">{{ store.tutor.estimatedTime }}</span>
        </div>
        <div class="row justify-between">
          <span class="text-body2">Salida Programada:</span>
          <q-chip dense color="grey-3" text-color="grey-9" :label="scheduledExit()" size="md" />
        </div>
      </div>

      <!-- Payment details -->
      <div class="voucher-section-title q-mb-sm">DETALLES DE PAGO</div>
      <div class="row justify-between q-mb-md">
        <span class="text-subtitle1 text-weight-bold">TOTAL:</span>
        <span class="text-subtitle1 text-weight-bold">${{ store.total.toFixed(2) }}</span>
      </div>

      <q-separator class="q-mb-md" />

      <!-- QR Code -->
      <div v-if="qrCodeUrl" class="text-center q-mb-md">
        <img :src="qrCodeUrl" alt="QR del registro" class="qr-code" />
        <div class="text-caption text-grey-7 q-mt-xs">Escanea para ver detalles del registro</div>
      </div>

      <div class="text-center text-caption text-grey-7 q-mb-md">¡Gracias por visitarnos!</div>

      <q-btn
        unelevated
        color="primary"
        label="Imprimir"
        icon="print"
        class="full-width print-hide"
        @click="printVoucher"
      />
    </div>
  </div>
</template>

<style scoped>
.voucher-wrapper {
  background: rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  justify-content: center;
  border-radius: 12px;
}

.voucher {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.voucher-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #9e9e9e;
  text-transform: uppercase;
}

.voucher-value {
  font-size: 13px;
  color: #212121;
}

.voucher-section-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #9e9e9e;
  text-transform: uppercase;
}

.stay-box {
  background: #f5f9ff;
  border-radius: 8px;
  border: 1px solid #e3f0ff;
}

.qr-code {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.bracelet-code {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.5px;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>

<style>
@media print {
  @page {
    margin: 0;
  }

  body,
  #q-app,
  .q-layout,
  .q-page-container,
  .registration-page {
    background: none !important;
    background-color: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .voucher-wrapper,
  .voucher-wrapper * {
    visibility: visible !important;
  }

  .voucher-wrapper {
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

  .voucher {
    box-shadow: none !important;
    border: none !important;
    padding: 24px !important;
    max-width: 100% !important;
  }

  .print-hide,
  button,
  .q-btn {
    display: none !important;
  }
}
</style>
