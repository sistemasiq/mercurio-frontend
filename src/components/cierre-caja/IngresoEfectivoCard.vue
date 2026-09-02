<template>
  <div class="ie-wrap">
    <button type="button" class="ie-volver" @click="$emit('volver')">
      <q-icon name="arrow_back" size="18px" />
      VOLVER A OPERACIONES
    </button>

    <div class="ie-card">
      <div class="ie-header">
        <div class="ie-icon-badge">
          <q-icon name="payments" size="24px" color="primary" />
        </div>
        <div>
          <h2 class="ie-title">Registrar Ingreso de Efectivo</h2>
          <p class="ie-subtitle">
            Agregar dinero físico a la caja actual (reposición de cambio, fondo adicional, etc.).
          </p>
        </div>
      </div>

      <div class="ie-body">
        <div class="form-group">
          <label class="field-label">Monto a ingresar *</label>
          <q-input
            v-model.number="monto"
            type="text"
            inputmode="decimal"
            outlined
            dense
            prefix="$"
            placeholder="0.00"
            input-class="text-right text-h6"
            :rules="[reglaDecimal]"
            @keydown="filtrarTeclaDecimal"
          />
        </div>
      </div>

      <div class="ie-footer">
        <q-btn
          unelevated
          no-caps
          color="primary"
          size="lg"
          class="ie-btn-registrar"
          icon="save"
          label="Registrar ingreso"
          :loading="turno.cargando"
          :disable="!puedeRegistrar"
          @click="registrar"
        />
      </div>
    </div>

    <div class="ie-info-banner">
      <q-icon name="info" size="18px" color="primary" class="q-mr-sm" />
      <span
        >El ingreso de efectivo afectará inmediatamente el saldo esperado en caja. No se contará
        como venta.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'

const emit = defineEmits<{
  (e: 'volver'): void
  (e: 'ingreso-exitoso'): void
}>()

const $q = useQuasar()
const turno = useTurnoCajaStore()

const monto = ref<number | null>(null)

const puedeRegistrar = computed(() => (monto.value ?? 0) > 0)

async function registrar() {
  if (!monto.value) return
  const ok = await turno.registrarIngreso(monto.value)
  if (ok) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Ingreso de $${monto.value.toLocaleString('es-MX')} registrado correctamente.`,
    })
    emit('ingreso-exitoso')
  }
}
</script>

<style scoped>
.ie-wrap {
  max-width: 620px;
  margin: 0 auto;
}

.ie-volver {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 8px 0;
  margin-bottom: 16px;
}
.ie-volver:hover {
  color: #025fe0;
}

.ie-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.ie-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 28px;
  border-bottom: 1px solid var(--bg-main);
}

.ie-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(2, 95, 224, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ie-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.ie-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
}

.ie-body {
  padding: 28px;
}

.ie-footer {
  padding: 20px 28px;
  border-top: 1px solid var(--bg-main);
  background: var(--bg-main);
}

.ie-btn-registrar {
  width: 100%;
  border-radius: 8px;
  font-weight: 700;
}

.ie-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: 16px;
  padding: 14px 18px;
  background: rgba(2, 95, 224, 0.06);
  border: 1px solid rgba(2, 95, 224, 0.2);
  border-radius: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
