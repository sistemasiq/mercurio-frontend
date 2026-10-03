<template>
  <div class="applied">
    <span class="applied__title">Pagos aplicados</span>
    <div v-if="pagos.length === 0" class="applied__empty">Aún no hay pagos aplicados.</div>
    <div v-for="pago in pagos" :key="pago.id" class="applied__row">
      <q-icon :name="getIcon(pago.method)" size="20px" :style="{ color: getColor(pago.method) }" />
      <div class="applied__info">
        <span class="applied__name">{{ formatMethodName(pago) }}</span>
        <span v-if="esTarjeta(pago.method) && pago.authCode" class="applied__meta">
          Aut. {{ pago.authCode }}
        </span>
      </div>
      <span class="applied__amount">${{ pago.amount.toFixed(2) }}</span>
      <button
        type="button"
        class="applied__remove"
        aria-label="Quitar pago"
        @click="$emit('remove-payment', pago.id)"
      >
        <q-icon name="close" size="18px" />
      </button>
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
  efectivo: { icon: 'payments', color: '#246b1d' },
  tarjeta: { icon: 'credit_card', color: '#c40f47' },
  cupones: { icon: 'redeem', color: '#8a5a00' },
  lealtad: { icon: 'loyalty', color: '#025fe0' },
  otro: { icon: 'account_balance_wallet', color: '#64748b' },
}

const getMeta = (method: string) => {
  const key = method.trim().toLowerCase()
  for (const [pattern, meta] of Object.entries(METHOD_META)) {
    if (key.includes(pattern)) return meta
  }
  return { icon: 'payment', color: '#64748b' }
}

const getIcon = (method: string) => getMeta(method).icon
const getColor = (method: string) => getMeta(method).color

const esTarjeta = (method: string) => {
  const n = method.trim().toLowerCase()
  return (
    n.includes('tarjeta') ||
    n.includes('crédito') ||
    n.includes('débito') ||
    n.includes('credito') ||
    n.includes('debito')
  )
}

const formatMethodName = (pago: AppliedPayment) => {
  if (esTarjeta(pago.method) && pago.cardType) {
    return `Tarjeta ${pago.cardType === 'DEBITO' ? 'Débito' : 'Crédito'}`
  }
  return pago.method
}
</script>

<style scoped lang="scss">
.applied {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__title {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  &__empty {
    font-size: 13px;
    color: var(--text-muted);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
  }

  &__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__meta {
    font-size: 11.5px;
    color: var(--text-secondary);
  }

  &__amount {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__remove {
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }
}
</style>
