<template>
  <div class="applied-list-container">
    <h4 class="title">
      <q-icon name="account_balance_wallet" color="primary" size="sm" /> Pagos Aplicados
    </h4>

    <div v-if="pagos.length === 0" class="empty-state">No hay pagos aplicados aún.</div>

    <div class="payments-scroll">
      <div v-for="pago in pagos" :key="pago.id" class="payment-card">
        <div class="payment-info">
          <q-avatar
            :color="getColor(pago.method)"
            text-color="white"
            :icon="getIcon(pago.method)"
            size="md"
          />
          <div>
            <div class="row items-center q-gutter-x-sm">
              <span class="payment-name">{{ formatMethodName(pago) }}</span>
              <q-badge color="positive" label="Completado" rounded />
            </div>
            <div v-if="esTarjeta(pago.method)" class="payment-meta">Auth: {{ pago.authCode }}</div>
          </div>
        </div>

        <div class="payment-actions">
          <span class="payment-amount">${{ pago.amount.toFixed(2) }}</span>
          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="$emit('remove-payment', pago.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppliedPayment } from '@/types/payments'

defineProps<{
  pagos: AppliedPayment[]
}>()

defineEmits<{
  (e: 'remove-payment', id: string): void
}>()

const METHOD_META: Record<string, { icon: string; color: string }> = {
  efectivo: { icon: 'payments', color: 'green' },
  tarjeta: { icon: 'credit_card', color: 'blue' },
  cupones: { icon: 'redeem', color: 'orange' },
  lealtad: { icon: 'loyalty', color: 'purple' },
}

const getMeta = (method: string) => {
  const key = method.trim().toLowerCase()
  for (const [pattern, meta] of Object.entries(METHOD_META)) {
    if (key.includes(pattern)) return meta
  }
  return { icon: 'payment', color: 'grey' }
}

const getIcon = (method: string) => getMeta(method).icon
const getColor = (method: string) => getMeta(method).color

const esTarjeta = (method: string) => method.trim().toLowerCase().includes('tarjeta')

const formatMethodName = (pago: AppliedPayment) => {
  if (esTarjeta(pago.method)) return `Tarjeta ${pago.cardType === 'DEBITO' ? 'Débito' : 'Crédito'}`
  return pago.method
}
</script>

<style scoped>
.applied-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: #191c1d;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.empty-state {
  text-align: center;
  color: #717786;
  padding: 32px 0;
}
.payments-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.payment-card {
  background: #ffffff;
  border: 1px solid #e1e3e4;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.payment-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.payment-name {
  font-size: 16px;
  font-weight: 600;
  color: #191c1d;
}
.payment-meta {
  font-size: 14px;
  color: #414754;
}
.payment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.payment-amount {
  font-size: 20px;
  font-weight: 700;
  color: #191c1d;
}
</style>
