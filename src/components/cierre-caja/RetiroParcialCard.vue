<template>
  <BaseDialog
    v-model="open"
    title="Retiro parcial"
    subtitle="Extrae efectivo de la caja del turno actual"
    icon="savings"
    tone="amber"
    :width="480"
    primary-label="Registrar retiro"
    :loading="turno.cargando"
    :primary-disabled="!puedeRegistrar"
    @confirm="registrar"
  >
    <div class="retiro-form">
      <div class="retiro-form__field retiro-form__field--full">
        <span class="field-label">Monto a retirar</span>
        <q-input
          v-model.number="monto"
          type="text"
          inputmode="decimal"
          outlined
          dense
          prefix="$"
          placeholder="0.00"
          autofocus
          :rules="[reglaDecimal]"
          hide-bottom-space
          @keydown="filtrarTeclaDecimal"
        />
      </div>
      <div class="retiro-form__field">
        <span class="field-label">Motivo</span>
        <q-select
          v-model="concepto"
          outlined
          dense
          :options="opcionesConcepto"
          emit-value
          map-options
          placeholder="Selecciona"
        />
      </div>
      <div class="retiro-form__field">
        <span class="field-label">Recibe</span>
        <q-select
          v-model="tipoDestinatario"
          outlined
          dense
          :options="opcionesDestinatario"
          emit-value
          map-options
          placeholder="Selecciona"
        />
      </div>
      <div class="retiro-form__field retiro-form__field--full">
        <span class="field-label">Observaciones</span>
        <q-input v-model="observaciones" outlined type="textarea" rows="2" placeholder="Opcional" />
      </div>
    </div>
    <div v-if="turno.error" class="retiro-form__callout retiro-form__callout--bad">
      <q-icon name="error" size="19px" />{{ turno.error }}
    </div>
    <div class="retiro-form__callout">
      <q-icon name="info" size="19px" />
      El retiro afecta de inmediato el saldo en caja. Recaba la firma de quien recibe el efectivo.
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import type { ConceptoRetiro, TipoDestinatario } from '@/types/turnoCaja'

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
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

// Cada apertura del diálogo empieza en blanco.
watch(open, (visible) => {
  if (!visible) return
  monto.value = null
  concepto.value = null
  tipoDestinatario.value = null
  observaciones.value = ''
})

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
    open.value = false
  }
}
</script>

<style scoped lang="scss">
.retiro-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__callout {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }
}
</style>
