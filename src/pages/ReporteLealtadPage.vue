<template>
  <q-page class="page-content list-page">
    <PageHeader title="Reporte de Lealtad" subtitle="Uso del programa de puntos en la sucursal." />

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div v-if="store.error" class="state-card">
      <StateBlock
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="authStore.currentBranchId && store.cargarReporte(authStore.currentBranchId)"
      />
    </div>

    <div v-else class="kpi-row">
      <KpiCard
        label="Clientes con saldo"
        icon="groups"
        :value="fmt(store.reporte?.clientes_con_saldo)"
      />
      <KpiCard label="Puntos otorgados" icon="redeem" :value="fmt(store.reporte?.total_otorgado)" />
      <KpiCard
        label="Puntos redimidos"
        icon="shopping_bag"
        :value="fmt(store.reporte?.total_redimido)"
      />
      <KpiCard
        label="Puntos caducados"
        icon="event_busy"
        :value="fmt(store.reporte?.total_caducado)"
      />
      <KpiCard
        label="Saldo vigente total"
        icon="account_balance_wallet"
        :value="fmt(store.reporte?.saldo_vigente)"
        note="pasivo del programa"
        note-tone="warn"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'

const authStore = useAuthStore()
const store = useLealtadStore()

onMounted(() => {
  if (authStore.currentBranchId) store.cargarReporte(authStore.currentBranchId)
})

const fmt = (n?: number): string => (n ?? 0).toLocaleString('es-MX')
</script>

<style scoped lang="scss">
.state-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
</style>
