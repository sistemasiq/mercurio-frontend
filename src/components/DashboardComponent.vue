<template>
  <q-page>
    <CajaComponent
      v-if="vistaActual === 'caja'"
      :search-term="searchTerm"
      @cambiar-vista="vistaActual = $event"
    />

    <CocinaComponent v-if="vistaActual === 'cocina'" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import CajaComponent from '@/components/CajaComponent.vue'
import CocinaComponent from '@/components/comandas/VisorCocina.vue'

const vistaActual = ref('caja')
const searchTerm = inject<Ref<string>>('searchTerm') ?? ref('')
</script>

<style scoped>
/* nothing special here */
</style>
