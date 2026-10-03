<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px; overflow: hidden">
      <!-- Encabezado -->
      <q-card-section style="padding: 24px 24px 16px">
        <div class="row items-center q-gutter-sm">
          <div
            style="
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: rgba(2, 95, 224, 0.08);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
          >
            <q-icon name="payments" size="22px" color="primary" />
          </div>
          <div>
            <div class="text-h6 text-weight-bold" style="line-height: 1.2">
              Ingreso de Efectivo Requerido
            </div>
            <div class="text-caption" style="color: var(--text-secondary)">
              Fondos insuficientes para dar cambio
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section style="padding: 0 24px 20px">
        <!-- Aviso contextual -->
        <div
          style="
            background: rgba(248, 148, 6, 0.1);
            border: 1px solid rgba(248, 148, 6, 0.4);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
          "
          class="row items-start q-gutter-sm"
        >
          <q-icon
            name="warning_amber"
            color="warning"
            size="20px"
            style="margin-top: 1px; flex-shrink: 0"
          />
          <div class="text-body2" style="flex: 1">
            El cambio a devolver es <strong>${{ cambioRequerido.toFixed(2) }}</strong> y el efectivo
            disponible en caja es <strong>${{ turno.efectivoDisponible.toFixed(2) }}</strong
            >. Registra un ingreso de al menos <strong>${{ faltante.toFixed(2) }}</strong> para
            continuar.
          </div>
        </div>

        <!-- Input de monto -->
        <div
          class="q-mb-xs"
          style="
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          "
        >
          Monto a ingresar *
        </div>
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
          :disable="turno.cargando"
          @keydown="filtrarTeclaDecimal"
        />

        <!-- Error post-ingreso cuando sigue siendo insuficiente -->
        <div
          v-if="errorPostIngreso"
          style="
            background: rgba(229, 57, 53, 0.08);
            border: 1px solid rgba(229, 57, 53, 0.3);
            border-radius: 8px;
            padding: 10px 12px;
            margin-top: 8px;
          "
          class="row items-center q-gutter-sm"
        >
          <q-icon name="error_outline" color="negative" size="18px" style="flex-shrink: 0" />
          <span class="text-body2 text-negative">{{ errorPostIngreso }}</span>
        </div>

        <!-- Banner informativo -->
        <div
          style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 14px;
            padding: 12px 14px;
            background: rgba(2, 95, 224, 0.06);
            border: 1px solid rgba(2, 95, 224, 0.2);
            border-radius: 10px;
            font-size: 13px;
            color: var(--text-secondary);
          "
        >
          <q-icon name="info" size="16px" color="primary" style="margin-top: 1px; flex-shrink: 0" />
          <span
            >El ingreso afectará de inmediato el saldo esperado en caja. No se contará como
            venta.</span
          >
        </div>
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions
        align="right"
        style="
          padding: 12px 24px 20px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-main);
        "
      >
        <q-btn
          flat
          no-caps
          label="Cancelar venta"
          color="grey-7"
          :disable="turno.cargando"
          @click="$emit('cancelar')"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="save"
          label="Confirmar ingreso"
          style="border-radius: 8px; font-weight: 700; min-width: 160px"
          :loading="turno.cargando"
          :disable="!puedeConfirmar"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'

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
