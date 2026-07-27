<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function irARetiro(): void {
  router.push({ name: 'caja-retiro' })
}

function irACierre(): void {
  router.push({ name: 'pos-cierre' })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="page-center">
      <div class="page-header">
        <div class="page-title">Gestión de Caja Activa</div>
        <div class="page-subtitle">
          Selecciona la operación que deseas realizar en el turno actual.
        </div>
      </div>

      <div class="cards-row">
        <!-- Registrar Retiro Parcial -->
        <q-card v-ripple flat bordered class="action-card" clickable @click="irARetiro">
          <q-card-section class="card-body">
            <div class="action-icon-wrap" style="background: #e8eaf6">
              <q-icon name="payments" size="28px" style="color: #3949ab" />
            </div>
            <div class="action-title">Registrar Retiro Parcial</div>
            <div class="action-subtitle">Extraer fondos para operaciones específicas.</div>
          </q-card-section>
        </q-card>

        <!-- Cierre de Caja -->
        <q-card v-ripple flat bordered class="action-card" clickable @click="irACierre">
          <q-card-section class="card-body">
            <div class="action-icon-wrap" style="background: #ffebee">
              <q-icon name="receipt_long" size="28px" style="color: #e53935" />
            </div>
            <div class="action-title">Cierre de Caja</div>
            <div class="action-subtitle">Finalizar tu turno y hacer el corte.</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.page-center {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  font-size: 13px;
  color: #5c6bc0;
  margin-top: 4px;
}

.cards-row {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-card {
  border-radius: 12px;
  width: 240px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.action-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px;
  gap: 12px;
}

.action-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.action-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.action-subtitle {
  font-size: 12.5px;
  color: #64748b;
  text-align: center;
  line-height: 1.4;
}
</style>
