<template>
  <div class="rp-wrap">
    <button type="button" class="rp-volver" @click="$emit('volver')">
      <q-icon name="arrow_back" size="18px" />
      VOLVER A OPERACIONES
    </button>

    <div class="rp-card">
      <div class="rp-header">
        <div class="rp-icon-badge">
          <q-icon name="credit_card" size="24px" color="primary" />
        </div>
        <div>
          <h2 class="rp-title">Registrar Retiro Parcial</h2>
          <p class="rp-subtitle">Extraer fondos de la caja actual para operaciones específicas.</p>
        </div>
      </div>

      <div class="rp-body">
        <div class="form-group q-mb-md">
          <label class="field-label">Monto a retirar *</label>
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

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <label class="field-label">Concepto / Tipo de retiro *</label>
            <q-select
              v-model="concepto"
              outlined
              dense
              :options="opcionesConcepto"
              emit-value
              map-options
              placeholder="Seleccione concepto"
            />
          </div>
          <div class="col-12 col-sm-6">
            <label class="field-label">Persona que recibe *</label>
            <q-select
              v-model="tipoDestinatario"
              outlined
              dense
              :options="opcionesDestinatario"
              emit-value
              map-options
              placeholder="Seleccione rol"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">Observaciones</label>
          <q-input
            v-model="observaciones"
            outlined
            dense
            type="textarea"
            rows="3"
            placeholder="Detalles adicionales sobre este retiro..."
          />
        </div>

        <q-banner v-if="turno.error" rounded class="bg-negative text-white q-mt-md">
          <template #avatar><q-icon name="error" /></template>
          {{ turno.error }}
        </q-banner>
      </div>

      <div class="rp-footer">
        <q-btn
          unelevated
          no-caps
          color="primary"
          size="lg"
          class="rp-btn-registrar"
          icon="save"
          label="Registrar retiro"
          :loading="turno.cargando"
          :disable="!puedeRegistrar"
          @click="registrar"
        />
      </div>
    </div>

    <div class="rp-info-banner">
      <q-icon name="info" size="18px" color="primary" class="q-mr-sm" />
      <span
        >El retiro parcial afectará inmediatamente el saldo en caja. Asegúrese de imprimir el ticket
        de comprobante y recabar la firma de quien recibe el efectivo.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import type { ConceptoRetiro, TipoDestinatario } from '@/types/turnoCaja'

const emit = defineEmits<{
  (e: 'volver'): void
  (e: 'retiro-exitoso'): void
}>()

const $q = useQuasar()
const turno = useTurnoCajaStore()

const monto = ref<number | null>(null)
const concepto = ref<ConceptoRetiro | null>(null)
const tipoDestinatario = ref<TipoDestinatario | null>(null)
const observaciones = ref('')

const opcionesConcepto: { label: string; value: ConceptoRetiro }[] = [
  { label: 'Pago a proveedor', value: 'Pago a proveedor' },
  { label: 'Compra de insumos', value: 'Compra de insumos' },
  { label: 'Depósito bancario', value: 'Depósito bancario' },
  { label: 'Resguardo de efectivo', value: 'Resguardo de efectivo' },
  { label: 'Pago de servicios', value: 'Pago de servicios' },
  { label: 'Gastos administrativos', value: 'Gastos administrativos' },
  { label: 'Gastos varios', value: 'Gastos varios' },
]

const opcionesDestinatario: { label: string; value: TipoDestinatario }[] = [
  { label: 'Proveedor', value: 'Proveedor' },
  { label: 'Empleado', value: 'Empleado' },
  { label: 'Administrador', value: 'Administrador' },
]

const puedeRegistrar = computed(
  () => (monto.value ?? 0) > 0 && !!concepto.value && !!tipoDestinatario.value,
)

async function registrar() {
  if (!concepto.value || !tipoDestinatario.value || !monto.value) return
  const ok = await turno.registrarRetiro(
    concepto.value,
    tipoDestinatario.value,
    monto.value,
    observaciones.value || undefined,
  )
  if (ok) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Retiro de $${monto.value.toLocaleString('es-MX')} registrado correctamente.`,
    })
    emit('retiro-exitoso')
  }
}
</script>

<style scoped>
.rp-wrap {
  max-width: 620px;
  margin: 0 auto;
}

.rp-volver {
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
.rp-volver:hover {
  color: #025fe0;
}

.rp-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.rp-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 28px;
  border-bottom: 1px solid var(--bg-main);
}

.rp-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(2, 95, 224, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rp-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.rp-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
}

.rp-body {
  padding: 28px;
}

.rp-footer {
  padding: 20px 28px;
  border-top: 1px solid var(--bg-main);
  background: var(--bg-main);
}

.rp-btn-registrar {
  width: 100%;
  border-radius: 8px;
  font-weight: 700;
}

.rp-info-banner {
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
