<script setup lang="ts">
defineProps<{
  currentRoute?: string
}>();
</script>

<template>
  <aside class="stitch-sidebar">
    <div class="sidebar-brand-section">
      <h1 class="brand-logo">ComertexPOS</h1>
      
      <div class="profile-box">
        <div class="store-icon-circle">
          <span class="material-symbols-outlined icon-filled">storefront</span>
        </div>
        <div class="profile-text">
          <h2 class="profile-name">Admin Staff</h2>
          <p class="profile-station">Estación Principal / #01</p>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <a class="nav-link" href="#">
        <span class="material-symbols-outlined icon-filled">store</span>
        <span class="nav-text">Caja</span>
      </a>
      <a class="nav-link" href="#">
        <span class="material-symbols-outlined">restaurant</span>
        <span class="nav-text">Cocina</span>
      </a>
      <a class="nav-link active-link" href="#">
        <span class="material-symbols-outlined">history</span>
        <span class="nav-text">Historial</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <a class="nav-link" href="#">
        <span class="material-symbols-outlined">help</span>
        <span class="nav-text">Soporte</span>
      </a>
    </div>
  </aside>
</template>

<style scoped>
/* 🌐 BLINDAJE DE DISEÑO NATIVO (Esquivando la falta de Tailwind) */

.stitch-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 256px;
  height: 100vh;
  background-color: #f3f4f5; /* surface-container-low */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  box-sizing: border-box;
  z-index: 50;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Sección superior de marca */
.sidebar-brand-section {
  padding: 0 24px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-logo {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #0059bb !important;
  margin: 0;
  padding: 0;
  line-height: 1.2;
}

/* Caja de perfil de la estación */
.profile-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-icon-circle {
  width: 40px;
  height: 40px;
  background-color: #d8e2ff; /* primary-fixed */
  color: #0059bb; /* primary */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.profile-name {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #191c1d !important;
  margin: 0 !important;
}

.profile-station {
  font-size: 10px !important;
  font-weight: 700 !important;
  color: #414754 !important;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin: 2px 0 0 0 !important;
}

/* Sistema de Navegación */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #414754; /* text-on-surface-variant */
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #e1e3e4; /* hover:bg-surface-variant */
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

/* Estado Activo (Historial) */
.active-link {
  background-color: #0059bb !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(0, 89, 187, 0.2);
}

.active-link .material-symbols-outlined {
  color: #ffffff !important;
}

/* Forzar relleno en iconos específicos */
.icon-filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24 !important;
}

/* Footer / Soporte */
.sidebar-footer {
  padding: 16px 8px 0 8px;
  border-top: 1px solid #c1c6d7; /* border-outline-variant */
}
</style>