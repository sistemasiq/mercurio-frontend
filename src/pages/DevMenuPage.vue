<template>
  <div class="dev-root">
    <div class="dev-card">
      <!-- Header -->
      <div class="dev-header">
        <span class="dev-badge">⚗ DEV ONLY</span>
        <h1 class="dev-title">Mercurio — Menú de Desarrollo</h1>
        <p class="dev-sub">
          Solo visible en <code>import.meta.env.DEV</code>. Haz clic en cualquier ruta para inyectar
          la sesión mock y navegar directo.
        </p>
        <div class="dev-session-bar" :class="autenticado ? 'ok' : 'off'">
          <span>{{
            autenticado ? `✓ Sesión activa · ${authStore.currentUser?.name}` : '✗ Sin sesión'
          }}</span>
          <button v-if="!autenticado" class="dev-btn" @click="login">Inyectar sesión mock</button>
          <button v-else class="dev-btn dev-btn--ghost" @click="authStore.logout()">
            Limpiar sesión
          </button>
        </div>
      </div>

      <!-- Grupos de rutas -->
      <div v-for="grupo in rutas" :key="grupo.label" class="dev-group">
        <div class="dev-group-label">{{ grupo.label }}</div>
        <div class="dev-grid">
          <button
            v-for="ruta in grupo.items"
            :key="ruta.name"
            type="button"
            class="dev-route-btn"
            :class="{ 'dev-route-btn--highlight': grupo.highlight }"
            @click="irA(ruta.name)"
          >
            <span class="material-symbols-outlined dev-route-icon">{{ ruta.icon }}</span>
            <span class="dev-route-label">{{ ruta.label }}</span>
            <span class="dev-route-path">{{ ruta.path }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { inyectarSesionDev } from '@/mocks/devAuth'

const router = useRouter()
const authStore = useAuthStore()

const autenticado = computed(() => authStore.isAuthenticated)

async function login() {
  await inyectarSesionDev()
}

async function irA(routeName: string) {
  if (!autenticado.value) await inyectarSesionDev()
  await router.push({ name: routeName })
}

const rutas = [
  {
    label: '★ CIERRE DE CAJA — Módulo nuevo',
    highlight: true,
    items: [
      { name: 'pos-cierre', icon: 'point_of_sale', label: 'Cierre de Caja', path: '/pos/cierre' },
      {
        name: 'pos-historial-arqueos',
        icon: 'receipt_long',
        label: 'Historial de Arqueos',
        path: '/pos/historial-arqueos',
      },
    ],
  },
  {
    label: 'OPERACIÓN',
    highlight: false,
    items: [
      { name: 'pos-caja', icon: 'point_of_sale', label: 'Caja (POS)', path: '/pos/caja' },
      { name: 'pos-cocina', icon: 'restaurant', label: 'Visor Cocina', path: '/pos/cocina' },
      {
        name: 'estancias-control-acceso',
        icon: 'badge',
        label: 'Control de Acceso',
        path: '/estancias/control-acceso',
      },
      {
        name: 'estancias-pulseras',
        icon: 'sensors',
        label: 'Pulseras',
        path: '/estancias/pulseras',
      },
    ],
  },
  {
    label: 'EVENTOS',
    highlight: false,
    items: [
      { name: 'eventos-resumen', icon: 'dashboard', label: 'Resumen', path: '/eventos/resumen' },
      {
        name: 'eventos-reservaciones',
        icon: 'event_note',
        label: 'Reservaciones',
        path: '/eventos/reservaciones',
      },
      {
        name: 'eventos-reservaciones-crear',
        icon: 'add_circle',
        label: 'Nueva Reservación',
        path: '/eventos/reservaciones/nueva',
      },
      {
        name: 'eventos-calendario',
        icon: 'calendar_today',
        label: 'Calendario',
        path: '/eventos/calendario',
      },
      { name: 'eventos-pagos', icon: 'payment', label: 'Pagos', path: '/eventos/pagos' },
    ],
  },
  {
    label: 'CATÁLOGO',
    highlight: false,
    items: [
      { name: 'extras-listar', icon: 'add_box', label: 'Extras', path: '/extras' },
      { name: 'paquetes-listar', icon: 'inventory_2', label: 'Paquetes', path: '/paquetes' },
      {
        name: 'tipos-evento-listar',
        icon: 'category',
        label: 'Tipos de Evento',
        path: '/tipos-evento',
      },
      {
        name: 'metodos-pago-listar',
        icon: 'credit_card',
        label: 'Métodos de Pago',
        path: '/metodos-pago',
      },
      { name: 'productos-listar', icon: 'liquor', label: 'Productos', path: '/productos' },
    ],
  },
  {
    label: 'ADMINISTRACIÓN',
    highlight: false,
    items: [
      { name: 'sucursales-listar', icon: 'store', label: 'Sucursales', path: '/sucursales' },
      { name: 'usuarios-listar', icon: 'group', label: 'Usuarios', path: '/usuarios' },
      {
        name: 'reportes-dashboard',
        icon: 'query_stats',
        label: 'Reportes',
        path: '/reportes/dashboard',
      },
    ],
  },
]
</script>

<style scoped>
.dev-root {
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}
.dev-card {
  width: 100%;
  max-width: 860px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  overflow: hidden;
  align-self: flex-start;
}

/* Header */
.dev-header {
  padding: 28px 32px 20px;
  border-bottom: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dev-badge {
  width: fit-content;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(245, 147, 0, 0.15);
  border: 1px solid rgba(245, 147, 0, 0.35);
  color: #f59300;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.dev-title {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}
.dev-sub {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}
.dev-sub code {
  background: #0f172a;
  padding: 1px 6px;
  border-radius: 4px;
  color: #7dd3fc;
  font-size: 12px;
}

/* Session bar */
.dev-session-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.dev-session-bar.ok {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}
.dev-session-bar.off {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* Buttons */
.dev-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  background: #f59300;
  color: #0f172a;
  transition: opacity 0.15s;
}
.dev-btn:hover {
  opacity: 0.85;
}
.dev-btn--ghost {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
}

/* Groups */
.dev-group {
  padding: 20px 32px;
  border-top: 1px solid #334155;
}
.dev-group-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #475569;
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Grid */
.dev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 8px;
}

/* Route button */
.dev-route-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.dev-route-btn:hover {
  border-color: #3b82f6;
  background: #0d1b3e;
}
.dev-route-btn--highlight {
  border-color: rgba(79, 97, 215, 0.5);
  background: rgba(26, 35, 126, 0.2);
}
.dev-route-btn--highlight:hover {
  border-color: #8690ee;
  background: rgba(26, 35, 126, 0.4);
}
.dev-route-icon {
  font-size: 18px;
  color: #64748b;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.dev-route-btn--highlight .dev-route-icon {
  color: #8690ee;
}
.dev-route-label {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.2;
}
.dev-route-path {
  font-size: 11px;
  color: #475569;
  font-family: 'Roboto Mono', monospace;
}
</style>
