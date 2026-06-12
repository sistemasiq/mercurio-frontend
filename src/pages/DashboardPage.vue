<template>
  <q-layout view="hHh lpR fFf">
    
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          Sistema Mercurio - Estancia Infantil
        </q-toolbar-title>
        <q-btn flat label="Caja" @click="vistaActual = 'caja'" />
        <q-btn flat label="Cocina" @click="vistaActual = 'cocina'" />
        <q-btn flat round icon="logout" title="Cerrar Sesión" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <CajaComponent 
          v-if="vistaActual === 'caja'" 
          @cambiar-vista="vistaActual = $event" 
        />
        
        <CocinaComponent 
          v-if="vistaActual === 'cocina'" 
        />
      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';


import CajaComponent from '@/components/CajaComponent.vue';
import CocinaComponent from '@/components/CocinaComponent.vue';

// Variable de estado que controla qué componente se ve (por defecto arranca en la caja)
const vistaActual = ref('caja');
</script>
