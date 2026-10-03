<template>
  <BaseDialog
    v-model="open"
    title="Ingreso de efectivo requerido"
    subtitle="Fondos insuficientes para dar cambio"
    icon="payments"
    tone="amber"
    :width="480"
    persistent
    :loading="turno.cargando"
    primary-label="Confirmar ingreso"
    secondary-label="Cancelar venta"
    :primary-disabled="!puedeConfirmar"
    @confirm="confirmar"
    @cancel="emit('cancelar')"
  >
    <div class="ie-modal-callout ie-modal-callout--warn">
      <q-icon name="warning_amber" size="19px" />
      <span>
        El cambio a devolver es <strong>${{ cambioRequerido.toFixed(2) }}</strong> y el efectivo
        disponible en caja es <strong>${{ turno.efectivoDisponible.toFixed(2) }}</strong
        >. Registra un ingreso de al menos <strong>${{ faltante.toFixed(2) }}</strong> para
        continuar.
      </span>
    </div>

    <div class="ie-modal-field">
      <span class="field-label">Monto a ingresar</span>
      <q-input
        v-model.number="monto"
        type="text"
        inputmode="decimal"
        outlined
        dense
        prefix="$"
        placeholder="0.00"
        :rules="[reglaDecimal]"
        :disable="turno.cargando"
        hide-bottom-space
        @keydown="filtrarTeclaDecimal"
      />
    </div>

    <div v-if="errorPostIngreso" class="ie-modal-callout ie-modal-callout--bad">
      <q-icon name="error" size="19px" />
      <span>{{ errorPostIngreso }}</span>
    </div>

    <div class="ie-modal-callout ie-modal-callout--info">
      <q-icon name="info" size="19px" />
      <span>El ingreso afectará de inmediato el saldo esperado en caja. No se contará como venta.</span>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import BaseDialog from '@/components/ui/BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  cambioRequerido: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'ingreso-exitoso'): void
  (e: 'cancelar'): void
}>()

const turno = useTurnoCajaStore()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const monto = ref<number | null>(null)
const errorPostIngreso = ref<string | null>(null)

const faltante = computed(() => Math.max(0, props.cambioRequerido - turno.efectivoDisponible))

const puedeConfirmar = computed(() => (monto.value ?? 0) > 0)

async function confirmar() {
  if (!monto.value) return
  errorPostIngreso.value = null

  const ok = await turno.registrarIngreso(monto.value)
  if (!ok) return

  // registrarIngreso llama cargarTurnoActivo() internamente → efectivoDisponible actualizado
  if (turno.efectivoDisponible >= props.cambioRequerido) {
    monto.value = null
    emit('ingreso-exitoso')
  } else {
    errorPostIngreso.value = `El efectivo en caja ($${turno.efectivoDisponible.toFixed(2)}) sigue siendo insuficiente para el cambio de $${props.cambioRequerido.toFixed(2)}. Ingresa al menos $${(props.cambioRequerido - turno.efectivoDisponible).toFixed(2)} más.`
    monto.value = null
  }
}
</script>

<style scoped lang="scss">
.ie-modal-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ie-modal-callout {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  background: var(--tone-warn-bg);
  color: var(--tone-warn-fg);

  &--warn {
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
  }

  &--bad {
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
  }

  &--info {
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
  }
}
</style>
