<script setup lang="ts">
import { usePadresAuthStore } from '@/stores/padres/padresAuthStore'
import HijoCard from '@/components/padres/HijoCard.vue'

const store = usePadresAuthStore()
</script>

<template>
  <q-page class="dashboard-padre">
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dash-header">
        <div class="dash-greeting">
          <h1 class="dash-title">Bienvenido, {{ store.currentTutor?.nombreCompleto }}</h1>
          <p class="dash-subtitle">
            <q-icon name="store" size="14px" class="q-mr-xs" />
            {{ store.currentTutor?.sucursal.nombre }}
          </p>
        </div>
      </header>

      <!-- Empty state -->
      <div v-if="store.activeChildren.length === 0" class="empty-state column items-center">
        <q-icon name="child_care" size="64px" color="grey-3" />
        <h2 class="text-h6 text-weight-semibold text-grey-7 q-mt-md q-mb-xs">
          Sin niños registrados
        </h2>
        <p class="text-body2 text-grey-5 text-center" style="max-width: 280px">
          Por el momento no hay ningún menor de edad registrado con esta cuenta.
        </p>
      </div>

      <!-- Children list -->
      <div v-else class="children-list">
        <HijoCard v-for="nino in store.activeChildren" :key="nino.id" :nino="nino" />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.dashboard-padre {
  min-height: 100%;
  background: #f8fafc;
  padding: 0;
}

.dashboard-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 16px 32px;
}

.dash-header {
  margin-bottom: 24px;
}

.dash-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.3;
}

.dash-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
