<template>
  <q-card 
    flat 
    bordered 
    class="column full-height bg-white relative-position group" 
    style="border-radius: 16px; border-color: #e1e3e4;"
  >
    <div class="relative-position overflow-hidden" style="border-top-left-radius: 16px; border-top-right-radius: 16px;">
      <q-img 
        :src="producto.imagen" 
        height="150px" 
        class="transition-transform duration-500"
        :class="'group-hover:scale-105'"
        style="object-fit: cover;" 
      />
      
      <div 
        class="absolute-top-right bg-primary text-white q-px-sm q-py-xs text-weight-bold shadow-1" 
        style="border-radius: 8px; margin: 8px; font-size: 13px;"
      >
        ${{ producto.precio_unitario.toFixed(2) }}
      </div>
    </div>

    <q-card-section class="col column q-pb-xl">
      <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs" style="line-height: 1.2;">
        {{ producto.nombre }}
      </div>
      <div class="text-caption text-grey-6" style="line-height: 1.4;">
        {{ producto.descripcion || 'Sin descripción...' }}
      </div>
    </q-card-section>
    
    <q-btn 
      unelevated 
      color="orange-9" 
      text-color="white" 
      icon="add" 
      class="absolute-bottom-right transition-all active:scale-90"
      style="border-radius: 8px; width: 40px; height: 40px; margin-right: 16px; margin-bottom: -16px; z-index: 10; box-shadow: 0 4px 10px rgba(253, 139, 0, 0.4);" 
      @click="$emit('agregar', producto)" 
    />
  </q-card>
</template>

<script setup lang="ts">
import type { Producto } from '@/types/producto'

defineProps<{
  producto: Producto
}>();

defineEmits<{
  (e: 'agregar', producto: Producto): void
}>();
</script>

<style scoped>
/* Transición elegante para el efecto Zoom que tiene el diseño de Stitch */
.transition-transform {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}
</style>