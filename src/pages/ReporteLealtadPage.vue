<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 1100px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Reporte de Lealtad
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Resumen del programa de puntos de la sucursal.
          </div>
        </div>
      </div>

      <!-- Sin sucursal activa -->
      <q-banner
        v-if="!authStore.currentBranchId"
        dense
        rounded
        class="bg-orange-1 text-orange-9 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="info" color="orange-9" /></template>
        No hay una sucursal activa en la sesión.
      </q-banner>

      <!-- Error -->
      <q-banner
        v-if="store.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ store.error }}
      </q-banner>

      <!-- KPIs -->
      <div class="kpi-row">
        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #0083001a; color: #008300">
            <q-icon name="redeem" size="20px" />
          </div>
          <div class="kpi-value">{{ store.reporte?.total_otorgado ?? 0 }}</div>
          <div class="kpi-label">Puntos otorgados</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #2a78d61a; color: #2a78d6">
            <q-icon name="shopping_bag" size="20px" />
          </div>
          <div class="kpi-value">{{ store.reporte?.total_redimido ?? 0 }}</div>
          <div class="kpi-label">Puntos redimidos</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #fab2191a; color: #c98d10">
            <q-icon name="event_busy" size="20px" />
          </div>
          <div class="kpi-value">{{ store.reporte?.total_caducado ?? 0 }}</div>
          <div class="kpi-label">Puntos caducados</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #4a3aa71a; color: #4a3aa7">
            <q-icon name="account_balance_wallet" size="20px" />
          </div>
          <div class="kpi-value">{{ store.reporte?.saldo_vigente ?? 0 }}</div>
          <div class="kpi-label">Saldo vigente total</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #1baf7a1a; color: #1baf7a">
            <q-icon name="groups" size="20px" />
          </div>
          <div class="kpi-value">{{ store.reporte?.clientes_con_saldo ?? 0 }}</div>
          <div class="kpi-label">Clientes con saldo</div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'

const authStore = useAuthStore()
const store = useLealtadStore()

onMounted(() => {
  if (authStore.currentBranchId) store.cargarReporte(authStore.currentBranchId)
})
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi-tile {
  border-radius: 12px;
  padding: 16px;
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.kpi-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
</style>
