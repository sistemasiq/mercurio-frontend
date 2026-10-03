<template>
  <section class="methods-card">
    <header class="methods-card__head">
      <h3 class="methods-card__title">Otros métodos</h3>
    </header>
    <div class="methods-card__body">
      <div v-for="(fila, idx) in modelValue" :key="fila.id" class="methods-card__field">
        <span class="field-label">
          {{ fila.metodo }}
          <span v-if="fila.origen === 'sistema'" class="methods-card__tag">con ventas</span>
        </span>
        <div class="methods-card__input-row">
          <q-input
            v-model.number="fila.monto"
            type="text"
            inputmode="decimal"
            outlined
            dense
            prefix="$"
            placeholder="0.00"
            class="methods-card__input"
            :aria-label="`Monto ${fila.metodo}`"
            :readonly="readonly"
            :disable="readonly"
            :rules="[reglaDecimal]"
            hide-bottom-space
            @keydown="filtrarTeclaDecimal"
          />
          <q-btn
            v-if="!readonly && fila.origen === 'manual'"
            flat
            round
            dense
            icon="delete"
            class="action-btn"
            aria-label="Quitar método"
            @click="eliminarFila(idx)"
          />
        </div>
      </div>

      <p v-if="modelValue.length === 0" class="methods-card__empty">
        No se registraron movimientos con otros métodos de pago en este turno.
      </p>

      <q-select
        v-if="!readonly"
        v-model="metodoSeleccionado"
        :options="opcionesDisponibles"
        option-label="nombre"
        option-value="id"
        display-value="Agregar método de pago…"
        class="methods-card__add"
        dense
        outlined
        emit-value
        map-options
        clearable
        :loading="metodosPagoStore.loading"
        no-options-label="No hay más métodos disponibles en el catálogo"
        @update:model-value="agregarFila"
      >
        <template #prepend><q-icon name="add" size="19px" /></template>
      </q-select>

      <div class="methods-card__callout">
        <q-icon name="visibility_off" size="19px" />
        Conteo ciego: el total esperado se muestra al enviar.
      </div>
    </div>
  </section>
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

<style scoped lang="scss">
.methods-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  &__head {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__field {
    display: flex;
    flex-direction: column;
  }

  &__tag {
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 5px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 10.5px;
    font-weight: 700;
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__input {
    flex: 1;
  }

  &__add :deep(.q-field__native) {
    color: var(--text-secondary);
  }

  &__empty {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__callout {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
  }
}
</style>
