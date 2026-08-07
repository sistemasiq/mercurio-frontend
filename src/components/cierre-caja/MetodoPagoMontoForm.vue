<template>
  <div class="rs-form-block">
    <span class="rs-block-label">BLOQUE B: MÉTODOS DE PAGO</span>

    <div class="rs-metodo-list">
      <div v-for="(fila, idx) in modelValue" :key="fila.id" class="rs-metodo-fila">
        <!-- Icono + nombre (fijo, no editable — viene del sistema o se eligió al agregar) -->
        <div class="rs-metodo-info">
          <q-icon
            :name="fila.origen === 'sistema' ? 'point_of_sale' : 'confirmation_number'"
            color="primary"
            size="20px"
            class="q-mr-xs"
          />
          <span class="rs-metodo-nombre">{{ fila.metodo }}</span>
          <span v-if="fila.origen === 'sistema'" class="rs-tag-sistema"
            >registrado en el sistema</span
          >
        </div>

        <!-- Input con prefijo $ -->
        <div class="rs-monto-wrap">
          <span class="rs-monto-prefix">$</span>
          <q-input
            v-model.number="fila.monto"
            type="text"
            inputmode="decimal"
            dense
            outlined
            placeholder="0.00"
            class="rs-monto-input"
            input-class="text-right"
            :readonly="readonly"
            :disable="readonly"
            :rules="[reglaDecimal]"
            :class="{ 'rs-input--readonly': readonly }"
            @keydown="filtrarTeclaDecimal"
          />
        </div>

        <!-- Eliminar (solo filas manuales, en modo edición) -->
        <q-btn
          v-if="!readonly && fila.origen === 'manual'"
          flat
          round
          dense
          icon="delete_outline"
          size="sm"
          class="rs-btn-delete"
          @click="eliminarFila(idx)"
        />
        <div v-else-if="!readonly" class="rs-btn-delete-spacer" />
      </div>

      <div v-if="modelValue.length === 0" class="rs-sin-metodos">
        No se registraron movimientos con métodos de pago en este turno.
      </div>

      <!-- Agregar método de pago del catálogo real -->
      <q-select
        v-if="!readonly"
        v-model="metodoSeleccionado"
        :options="opcionesDisponibles"
        option-label="nombre"
        option-value="id"
        label="Agregar método de pago…"
        dense
        outlined
        emit-value
        map-options
        clearable
        class="rs-select-agregar"
        :loading="metodosPagoStore.loading"
        no-options-label="No hay más métodos disponibles en el catálogo"
        @update:model-value="agregarFila"
      >
        <template #prepend>
          <q-icon name="add_circle" color="primary" size="18px" />
        </template>
      </q-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import type { FilaMetodoPago } from '@/types/turnoCaja'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const modelValue = defineModel<FilaMetodoPago[]>({ default: () => [] })

const metodosPagoStore = useMetodosPagoStore()
const metodoSeleccionado = ref<string | null>(null)

onMounted(() => {
  if (metodosPagoStore.metodos.length === 0) {
    metodosPagoStore.cargar()
  }
})

// Métodos del catálogo real, activos, que aún no aparecen como fila (ni de sistema ni agregados).
// "Efectivo" nunca se ofrece aquí: ya tiene su propio bloque (EfectivoDesgloseForm). El catálogo
// puede tener varias filas con el mismo nombre (duplicados de captura) — se deja solo una por nombre.
const opcionesDisponibles = computed(() => {
  const nombresEnUso = new Set(modelValue.value.map((f) => f.metodo.trim().toLowerCase()))
  const vistos = new Set<string>()
  const disponibles: typeof metodosPagoStore.activos = []

  for (const m of metodosPagoStore.activos) {
    const nombre = m.nombre.trim().toLowerCase()
    if (nombre === 'efectivo') continue
    if (nombresEnUso.has(nombre)) continue
    if (vistos.has(nombre)) continue
    vistos.add(nombre)
    disponibles.push(m)
  }
  return disponibles
})

let nextId = 1

function agregarFila(metodoId: string | null) {
  if (!metodoId) return
  const metodo = metodosPagoStore.activos.find((m) => m.id === metodoId)
  if (!metodo) return

  modelValue.value.push({
    id: nextId++,
    metodo: metodo.nombre,
    monto: null,
    origen: 'manual',
  })
  metodoSeleccionado.value = null
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
.rs-metodo-nombre {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #0b1c30;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rs-tag-sistema {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
}
.rs-sin-metodos {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #767683;
  padding: 8px 4px;
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
.rs-btn-delete-spacer {
  width: 32px;
  flex-shrink: 0;
}

/* ── Select de agregar ──────────────────────────────────────────────── */
.rs-select-agregar {
  margin-top: 4px;
}
.rs-select-agregar :deep(.q-field__control) {
  border-radius: 8px;
}
</style>
