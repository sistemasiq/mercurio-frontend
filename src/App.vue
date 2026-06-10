<template>
  <router-view />
</template>

<script setup lang="ts">
/**
 * COMPONENTE RAÍZ DE LA APLICACIÓN
 * 
 * FUNCIÓN:
 * Este es el componente principal (root) de la aplicación que:
 * - Define la estructura general de la aplicación
 * - Renderiza el sistema de rutas mediante <router-view />
 * 
 * CÓMO FUNCIONA:
 * Cuando navegas entre páginas, Vue Router cambia el componente que se muestra
 * dentro de <router-view />. Este componente actúa como contenedor que permite
 * que todas las rutas se rendericen en este punto.
 * 
 * Por ejemplo:
 * - Ruta /dashboard → muestra DashboardPage en router-view
 * - Ruta /reservaciones → muestra ReservacionesPage en router-view
 */
</script>
