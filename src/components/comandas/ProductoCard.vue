<template>
  <div
    class="producto-card"
    :class="{ 'producto-card--combo': producto.es_combo }"
    @click="$emit('agregar', producto)"
  >
    <div class="producto-card__img-wrap">
      <q-img :src="producto.imagen ?? undefined" height="100px" class="producto-card__img">
        <template #error>
          <div class="absolute-full flex flex-center bg-grey-3">
            <q-icon
              :name="producto.es_combo ? 'inventory_2' : 'fastfood'"
              size="28px"
              color="grey-5"
            />
          </div>
        </template>
      </q-img>
      <span class="producto-card__badge">${{ producto.precio_unitario.toFixed(2) }}</span>
      <span v-if="producto.es_combo" class="producto-card__combo-badge">COMBO</span>
    </div>

    <div class="producto-card__body">
      <p class="producto-card__nombre">{{ producto.nombre }}</p>
      <p class="producto-card__desc">{{ producto.descripcion || 'Sin descripción...' }}</p>
      <div class="producto-card__add">
        <q-btn
          unelevated
          :color="producto.es_combo ? 'green-8' : 'orange-8'"
          icon="add"
          size="xs"
          style="border-radius: 8px; width: 30px; height: 30px; min-width: 30px"
          @click.stop="$emit('agregar', producto)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Producto } from '@/types/producto'

defineProps<{ producto: Producto }>()
defineEmits<{ (e: 'agregar', producto: Producto): void }>()
</script>

<style scoped>
.producto-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.producto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.producto-card__img-wrap {
  position: relative;
}
.producto-card__img {
  display: block;
  width: 100%;
}

.producto-card__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--q-primary, #1976d2);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.producto-card__combo-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #2e7d32;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.producto-card--combo {
  border-color: #a5d6a7;
  border-width: 1.5px;
}

.producto-card__body {
  padding: 10px 12px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.producto-card__nombre {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.2;
}
.producto-card__desc {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.producto-card__add {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
