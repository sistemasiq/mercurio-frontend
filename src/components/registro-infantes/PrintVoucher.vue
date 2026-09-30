<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'
import { printTicketElement } from '@/utils/ticketPrinting'

const store = useRegistrationStore()
const authStore = useAuthStore()
const $q = useQuasar()
const qrCodeUrl = ref('')
const voucherRef = ref<HTMLElement | null>(null)
const isPrinting = ref(false)
const issuedAt = new Date()

const branchName = computed(() => authStore.currentBranchName || 'Sucursal')

const qrSize = 110

async function generarQR() {
  if (!store.registroId) return
  const url = `${window.location.origin}/padres/access?code=${store.registroId}`
  qrCodeUrl.value = await QRCode.toDataURL(url, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: 'L',
  })
}

onMounted(generarQR)

function formatDate() {
  const now = issuedAt
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
  const d = new Date(issuedAt)
  d.setHours(d.getHours() + hours)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

async function printVoucher() {
  if (isPrinting.value) return
  isPrinting.value = true
  try {
    await generarQR()
    await nextTick()
    await printTicketElement(voucherRef.value)
  } catch (e: unknown) {
    $q.notify({
      type: 'negative',
      message: (e as Error).message || 'No se pudo preparar el comprobante.',
    })
  } finally {
    isPrinting.value = false
  }
}

function getBraceletLabel(braceletId: string) {
  const bracelet = store.pulseras.find((p) => p.id === braceletId)
  return bracelet?.pulseraRfid ?? braceletId
}
</script>

<template>
  <div class="voucher-wrapper">
    <div class="voucher-controls print-hide">
      <q-btn
        color="primary"
        label="Imprimir comprobante"
        icon="print"
        :loading="isPrinting"
        :disable="!qrCodeUrl"
        @click="printVoucher"
      />
    </div>
    <div id="printable-voucher" ref="voucherRef" class="voucher" style="width: 80mm">
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
        <span class="text-subtitle1 text-weight-bold"
          >${{ Number(store.totalFromServer ?? store.total).toFixed(2) }}</span
        >
      </div>

      <q-separator class="q-mb-md" />

      <!-- QR del registro -->
      <div v-if="qrCodeUrl" class="text-center q-mb-md">
        <img
          :src="qrCodeUrl"
          alt="QR del registro"
          class="qr-code"
          :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
        />
        <div class="text-caption text-grey-7 q-mt-xs">Escanea para ver detalles del registro</div>
      </div>

      <div class="text-center text-caption text-grey-7 q-mb-md">¡Gracias por visitarnos!</div>
    </div>
  </div>
</template>

<style scoped>
.voucher-wrapper {
  background: rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
  border-radius: 12px;
}

.voucher {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  max-width: none;
  flex: none;
  box-sizing: border-box;
  color: #111;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.voucher-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #555;
  text-transform: uppercase;
}

.voucher-value {
  font-size: 13px;
  color: #111;
}

.voucher-section-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #555;
  text-transform: uppercase;
}

.stay-box {
  background: rgba(2, 95, 224, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(2, 95, 224, 0.15);
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
  background: var(--bg-main);
  padding: 2px 6px;
  border-radius: 4px;
}
.voucher-controls {
  width: min(100%, 420px);
}
.voucher-controls p {
  font-size: 12px;
  color: var(--text-muted);
}
.voucher .row {
  gap: 4px;
  overflow-wrap: anywhere;
}
.voucher .row > * {
  min-width: 0;
}
.voucher .row > [style*='100px'] {
  width: auto !important;
  max-width: 90px;
}
</style>
