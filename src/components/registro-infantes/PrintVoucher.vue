<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'

const store = useRegistrationStore()

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
  window.print()
}
</script>

<template>
  <div class="voucher-wrapper">
    <div id="printable-voucher" class="voucher">
      <!-- Header -->
      <div class="voucher-header text-center q-mb-md">
        <div class="text-h6 text-weight-bold">KidCenter Pro</div>
        <div class="text-caption text-grey-7">Downtown Branch</div>
      </div>

      <q-separator class="q-mb-sm" />

      <!-- Folio + Date -->
      <div class="row justify-between q-mb-md">
        <div>
          <div class="voucher-label">DATE &amp; TIME</div>
          <div class="voucher-value">{{ formatDate() }}</div>
        </div>
        <div class="text-right">
          <div class="voucher-label">FOLIO ID</div>
          <div class="voucher-value text-weight-bold">{{ store.folioId }}</div>
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

      <q-separator class="q-mb-sm" />

      <!-- Children -->
      <div class="voucher-section-title q-mb-xs">NIÑOS REGISTRADOS</div>
      <div class="row text-caption text-grey-7 q-mb-xs">
        <div class="col">Nombre</div>
        <div style="width: 50px" class="text-center">Edad</div>
        <div style="width: 80px" class="text-right">RFID Bracelet</div>
      </div>
      <div v-for="child in store.savedChildren" :key="child.id" class="row items-center q-mb-xs">
        <div class="col text-weight-medium" style="font-size: 14px">{{ child.name }}</div>
        <div style="width: 50px" class="text-center text-body2">{{ child.age }}</div>
        <div style="width: 80px" class="text-right">
          <q-chip dense color="blue-2" text-color="blue-9" :label="child.rfidBracelet" size="sm" />
        </div>
      </div>

      <q-separator class="q-my-md" />

      <!-- Stay details -->
      <div class="stay-box q-pa-sm q-mb-md">
        <div class="voucher-section-title q-mb-sm">DETALLES DE ESTANCIA</div>
        <div class="row justify-between q-mb-xs">
          <span class="text-body2">Tiempo Prepagado:</span>
          <span class="text-weight-bold text-primary">{{ store.tutor.estimatedTime }} 00 min</span>
        </div>
        <div class="row justify-between">
          <span class="text-body2">Salida Programada:</span>
          <q-chip dense color="orange-2" text-color="orange-9" :label="scheduledExit()" size="sm" />
        </div>
      </div>

      <!-- Payment details -->
      <div class="voucher-section-title q-mb-sm">DETALLES DE PAGO</div>
      <div class="row justify-between q-mb-xs">
        <span class="text-body2">Subtotal:</span>
        <span class="text-body2">${{ store.subtotal.toFixed(2) }}</span>
      </div>
      <div class="row justify-between q-mb-sm">
        <span class="text-body2">IVA (16%):</span>
        <span class="text-body2">${{ store.iva.toFixed(2) }}</span>
      </div>
      <div class="row justify-between q-mb-md">
        <span class="text-subtitle1 text-weight-bold">TOTAL:</span>
        <span class="text-subtitle1 text-weight-bold">${{ store.total.toFixed(2) }}</span>
      </div>

      <q-separator class="q-mb-md" />

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
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
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

@media print {
  .print-hide {
    display: none !important;
  }
}
</style>
