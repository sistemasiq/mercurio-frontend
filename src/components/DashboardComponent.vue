<template>
  <q-page>
    <CajaComponent 
      v-if="vistaActual === 'caja'" 
      :search-term="searchTerm"
      @cambiar-vista="vistaActual = $event" 
    />
    
    <CocinaComponent 
      v-if="vistaActual === 'cocina'" 
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import CajaComponent from '@/components/CajaComponent.vue'
import CocinaComponent from '@/components/comandas/VisorCocina.vue'

const vistaActual = ref('caja')
const searchTerm = inject('searchTerm') as any || ref('')

// reuse router only if needed elsewhere
const router = useRouter()
</script>

<style scoped>
/* nothing special here */
</style>
