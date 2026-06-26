<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps<{ collapsed?: boolean }>();
const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>();

const router = useRouter();
const route = useRoute();

const internalCollapsed = ref(!!props.collapsed);

watch(() => props.collapsed, v => {
  internalCollapsed.value = !!v;
});

const toggle = () => {
  internalCollapsed.value = !internalCollapsed.value;
  emit('update:collapsed', internalCollapsed.value);
};

const links = [
  { label: 'Caja', icon: 'store', name: 'dashboard' },
  { label: 'Cocina', icon: 'restaurant', name: 'cocina' },
  { label: 'Historial', icon: 'history', name: 'debug-historial' },
];

const isActive = (name?: string) => {
  if (!name) return false;
  return route.name === name;
};

const go = (name?: string) => {
  if (!name) return;
  router.push({ name }).catch(() => {});
};

const sidebarClass = computed(() => ({
  'stitch-sidebar': true,
  'collapsed-sidebar': internalCollapsed.value,
}));
</script>

<template>
  <aside :class="sidebarClass">
    <div class="sidebar-brand-section">
      <div class="brand-row">
        <h1 class="brand-logo">ComertexPOS</h1>
        <button class="btn-toggle" @click="toggle" aria-label="Toggle sidebar">
          <q-icon name="chevron_left" />
        </button>
      </div>

      <div class="profile-box" v-if="!internalCollapsed">
        <div class="store-icon-circle">
          <q-icon name="storefront" class="icon-filled" />
        </div>
        <div class="profile-text">
          <h2 class="profile-name">Admin Staff</h2>
          <p class="profile-station">Mostrador • #01</p>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in links"
        :key="item.label"
        :class="['nav-link', { 'active-link': isActive(item.name) } ]"
        @click="go(item.name)"
      >
        <q-icon :name="item.icon" :class="{ 'icon-filled': isActive(item.name) }" />
        <span class="nav-text" v-if="!internalCollapsed">{{ item.label }}</span>
      </button>
    </nav>

      <div class="sidebar-footer" v-if="!internalCollapsed">
      <button class="nav-link" @click="go('support')">
        <q-icon name="help" />
        <span class="nav-text">Soporte</span>
      </button>
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
  z-index: 10;
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
  transition: background-color 0.2s, box-shadow 0.15s;
  border: 1px solid transparent;
}

.nav-link:hover {
  background-color: #e1e3e4; /* hover:bg-surface-variant */
  box-shadow: 0 1px 0 rgba(0,0,0,0.06) inset;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

/* Estado Activo (Historial) */
.active-link {
  background-color: #0059bb !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(0, 89, 187, 0.12);
  border-color: rgba(255,255,255,0.08);
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

/* Collapsed styles */
.collapsed-sidebar {
  width: 72px !important;
}

.collapsed-sidebar .brand-logo { font-size: 16px !important; }
.collapsed-sidebar .profile-box { display: none; }
.collapsed-sidebar .nav-link { justify-content: center; padding: 10px 8px; }
.collapsed-sidebar .nav-text { display: none; }
.btn-toggle { background: transparent; border: none; cursor: pointer; color: #414754; }
.brand-row { display:flex; align-items:center; justify-content:space-between; }
</style>