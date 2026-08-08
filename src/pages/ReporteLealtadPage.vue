<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
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
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="redeem" size="20px" />
          </div>
          <div class="stat-card__value">{{ store.reporte?.total_otorgado ?? 0 }}</div>
          <div class="stat-card__label">Puntos otorgados</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="shopping_bag" size="20px" />
          </div>
          <div class="stat-card__value">{{ store.reporte?.total_redimido ?? 0 }}</div>
          <div class="stat-card__label">Puntos redimidos</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <q-icon name="event_busy" size="20px" />
          </div>
          <div class="stat-card__value">{{ store.reporte?.total_caducado ?? 0 }}</div>
          <div class="stat-card__label">Puntos caducados</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--pink">
            <q-icon name="account_balance_wallet" size="20px" />
          </div>
          <div class="stat-card__value">{{ store.reporte?.saldo_vigente ?? 0 }}</div>
          <div class="stat-card__label">Saldo vigente total</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="groups" size="20px" />
          </div>
          <div class="stat-card__value">{{ store.reporte?.clientes_con_saldo ?? 0 }}</div>
          <div class="stat-card__label">Clientes con saldo</div>
        </div>
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
