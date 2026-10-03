<template>
  <button
    type="button"
    class="producto-card"
    :class="{ 'producto-card--agotado': sinStock }"
    @click="$emit('agregar', producto)"
  >
    <div class="producto-card__media">
      <q-img v-if="imagenSrc" :src="imagenSrc" class="producto-card__img" fit="cover">
        <template #error>
          <div class="producto-card__placeholder">
            <q-icon :name="producto.es_combo ? 'lunch_dining' : 'fastfood'" size="26px" />
          </div>
        </template>
      </q-img>
      <div v-else class="producto-card__placeholder">
        <q-icon :name="producto.es_combo ? 'lunch_dining' : 'fastfood'" size="26px" />
      </div>
      <span v-if="producto.es_combo" class="producto-card__tag">Combo</span>
    </div>
    <div class="producto-card__body">
      <span class="producto-card__nombre">{{ producto.nombre }}</span>
      <div class="producto-card__row">
        <span class="producto-card__precio">${{ producto.precio_unitario.toFixed(2) }}</span>
        <span v-if="sinStock" class="producto-card__stock producto-card__stock--out"
          >Sin stock</span
        >
        <span
          v-else-if="rinde !== null"
          class="producto-card__stock"
          :class="{ 'producto-card__stock--low': stockBajo }"
        >
          ≈ {{ rinde }} disponibles (estimado)
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getProductoImagenUrl } from '@/api/productosApi'
import type { Producto } from '@/types/producto'

const props = withDefaults(
  defineProps<{
    producto: Producto
    /** Unidades estimadas que se pueden preparar con el stock actual. null = sin receta / sin dato. */
    rinde?: number | null
  }>(),
  { rinde: null },
)
defineEmits<{ (e: 'agregar', producto: Producto): void }>()

const UMBRAL_STOCK_BAJO = 6

const imagenSrc = computed(() => getProductoImagenUrl(props.producto.imagen))
const sinStock = computed(() => props.rinde === 0)
const stockBajo = computed(
  () => props.rinde !== null && props.rinde > 0 && props.rinde <= UMBRAL_STOCK_BAJO,
)
</script>

<style scoped lang="scss">
.producto-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.12s,
    box-shadow 0.12s;

  &:hover {
    border-color: #cbd2de;
    box-shadow: var(--shadow-md);
  }

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
  }

  &--agotado {
    opacity: 0.6;
  }

  &__media {
    position: relative;
    height: 84px;
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    background: repeating-linear-gradient(135deg, #f5f7fb 0 8px, #eef1f6 8px 16px);
  }

  &__tag {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--text-strong);
    color: #fff;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px 12px;
    flex: 1;
  }

  &__nombre {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--text-primary);
  }

  &__row {
    margin-top: auto;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
  }

  &__precio {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__stock {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;

    &--low {
      font-weight: 700;
      color: #c2410c;
    }

    &--out {
      font-weight: 800;
      color: var(--tone-bad-fg);
    }
  }
}
</style>
