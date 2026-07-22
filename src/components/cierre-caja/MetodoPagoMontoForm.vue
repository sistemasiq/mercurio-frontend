<template>
  <div class="rs-form-block">
    <span class="rs-block-label">BLOQUE B: VOUCHERS / TICKETS</span>

    <div class="rs-metodo-list">
      <div v-for="(fila, idx) in modelValue" :key="fila.id" class="rs-metodo-fila">
        <!-- Icono + etiqueta -->
        <div class="rs-metodo-info">
          <span class="rs-icon material-symbols-outlined">confirmation_number</span>
          <span v-if="readonly" class="rs-metodo-nombre">{{ etiquetaMetodo(fila.metodo) }}</span>
          <q-select
            v-else
            v-model="fila.metodo"
            :options="opcionesMetodo"
            dense
            borderless
            emit-value
            map-options
            class="rs-metodo-select"
            no-options-label="Sin opciones"
          />
        </div>

        <!-- Input con prefijo $ -->
        <div class="rs-monto-wrap">
          <span class="rs-monto-prefix">$</span>
          <q-input
            v-model.number="fila.monto"
            type="number"
            min="0"
            dense
            outlined
            placeholder="0.00"
            class="rs-monto-input"
            input-class="text-right"
            :readonly="readonly"
            :disable="readonly"
            :class="{ 'rs-input--readonly': readonly }"
          />
        </div>

        <!-- Eliminar (solo editable, >1 fila) -->
        <q-btn
          v-if="!readonly && modelValue.length > 1"
          flat
          round
          dense
          icon="delete_outline"
          size="sm"
          class="rs-btn-delete"
          @click="eliminarFila(idx)"
        />
      </div>

      <!-- Agregar nueva fila -->
      <button v-if="!readonly" type="button" class="rs-btn-add" @click="agregarFila">
        <span class="material-symbols-outlined rs-icon-sm">add_circle</span>
        Agregar método de pago
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilaMetodoPago, MetodoPagoClave } from '@/types/turnoCaja'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const modelValue = defineModel<FilaMetodoPago[]>({ default: () => [] })

const ETIQUETAS_METODO: Record<MetodoPagoClave, string> = {
  vouchers: 'Total Vouchers / Tickets',
  tarjeta: 'Tarjeta de crédito/débito',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const opcionesMetodo = Object.entries(ETIQUETAS_METODO).map(([value, label]) => ({ label, value }))

function etiquetaMetodo(clave: MetodoPagoClave): string {
  return ETIQUETAS_METODO[clave] ?? clave
}

let nextId = modelValue.value.length + 1

function agregarFila() {
  modelValue.value.push({ id: nextId++, metodo: 'vouchers', monto: null })
}

function eliminarFila(idx: number) {
  modelValue.value.splice(idx, 1)
}
</script>

<style scoped>
/* ── Contenedor ─────────────────────────────────────────────────────── */
.rs-form-block {
  position: relative;
  border: 1px solid #c6c5d4;
  border-radius: 12px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.05);
}

/* ── Etiqueta flotante ─────────────────────────────────────────────── */
.rs-block-label {
  position: absolute;
  top: -11px;
  left: 16px;
  background: #ffffff;
  padding: 0 8px;
  color: #000666;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── Lista de filas ─────────────────────────────────────────────────── */
.rs-metodo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  max-width: 600px;
}

/* ── Fila de método ─────────────────────────────────────────────────── */
.rs-metodo-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8f9ff;
  border: 1px solid #e5eeff;
  border-radius: 8px;
  padding: 10px 14px;
}

/* ── Info del método (icono + nombre) ────────────────────────────────── */
.rs-metodo-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.rs-icon {
  font-size: 20px;
  color: #767683;
  flex-shrink: 0;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-metodo-nombre {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #0b1c30;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rs-metodo-select {
  flex: 1;
  min-width: 0;
}
.rs-metodo-select :deep(.q-field__native) {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #0b1c30;
  padding: 0;
}

/* ── Input de monto con prefijo ──────────────────────────────────────── */
.rs-monto-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.rs-monto-prefix {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #767683;
  margin-right: 2px;
}
.rs-monto-input {
  width: 120px;
}
.rs-monto-input :deep(.q-field__control) {
  background: #ffffff;
  border-radius: 8px;
}
.rs-monto-input :deep(.q-field--focused .q-field__control:before) {
  border-color: #b7131a !important;
}
.rs-monto-input :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.12);
}
.rs-monto-input :deep(input) {
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}
.rs-input--readonly :deep(.q-field__control) {
  background: #eff4ff;
}

/* ── Botón eliminar ─────────────────────────────────────────────────── */
.rs-btn-delete {
  color: #767683 !important;
  flex-shrink: 0;
}
.rs-btn-delete:hover {
  color: #b7131a !important;
}

/* ── Botón agregar ──────────────────────────────────────────────────── */
.rs-btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: #000666;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 4px;
  transition: opacity 0.15s ease;
}
.rs-btn-add:hover {
  opacity: 0.75;
}
.rs-icon-sm {
  font-size: 18px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
