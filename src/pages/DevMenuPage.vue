<template>
  <div class="dev-root">
    <div class="dev-wrap">
      <header class="dev-header">
        <div class="dev-header__text">
          <span class="dev-badge">DEV ONLY</span>
          <h1 class="dev-title">Mercurio — Menú de Desarrollo</h1>
          <p class="dev-sub">
            Solo visible en <code>import.meta.env.DEV</code>. Haz clic en cualquier ruta para
            inyectar la sesión mock y navegar directo.
          </p>
        </div>
        <div v-if="autenticado" class="dev-session dev-session--on">
          <span class="dev-session__dot" />
          <span class="dev-session__text">Sesión activa · {{ authStore.currentUser?.name }}</span>
          <button type="button" class="dev-session__btn" @click="authStore.logout()">
            Limpiar sesión
          </button>
        </div>
        <div v-else class="dev-session dev-session--off">
          <span class="dev-session__dot" />
          <span class="dev-session__text">Sin sesión</span>
          <button type="button" class="dev-session__btn" @click="login">
            Inyectar sesión mock
          </button>
        </div>
      </header>

      <section v-for="grupo in rutas" :key="grupo.label" class="dev-group">
        <span class="dev-group__label" :class="{ 'dev-group__label--hl': grupo.highlight }">
          {{ grupo.label }}
        </span>
        <div class="dev-grid">
          <button
            v-for="ruta in grupo.items"
            :key="ruta.name"
            type="button"
            class="dev-route"
            :class="{ 'dev-route--hl': grupo.highlight }"
            @click="irA(ruta.name)"
          >
            <q-icon :name="ruta.icon" size="20px" class="dev-route__icon" />
            <span class="dev-route__text">
              <span class="dev-route__label">{{ ruta.label }}</span>
              <span class="dev-route__path">{{ ruta.path }}</span>
            </span>
          </button>
        </div>
      </section>
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
    label: '★ CIERRE DE CAJA — MÓDULO NUEVO',
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
    ],
  },
  {
    label: 'CATÁLOGO E INVENTARIO',
    highlight: false,
    items: [
      { name: 'extras-listar', icon: 'add_box', label: 'Extras', path: '/extras' },
      { name: 'paquetes-listar', icon: 'card_giftcard', label: 'Paquetes', path: '/paquetes' },
      { name: 'productos-listar', icon: 'liquor', label: 'Productos', path: '/productos' },
      { name: 'insumos-listar', icon: 'inventory_2', label: 'Insumos', path: '/insumos' },
    ],
  },
  {
    label: 'ADMINISTRACIÓN',
    highlight: false,
    items: [
      { name: 'sucursales-listar', icon: 'store', label: 'Sucursales', path: '/sucursales' },
      { name: 'usuarios-listar', icon: 'group', label: 'Usuarios', path: '/usuarios' },
      { name: 'roles-listar', icon: 'admin_panel_settings', label: 'Roles', path: '/roles' },
      {
        name: 'reportes-dashboard',
        icon: 'analytics',
        label: 'Reportes',
        path: '/reportes/dashboard',
      },
    ],
  },
  {
    label: 'SISTEMA',
    highlight: false,
    items: [{ name: 'dev-ui-kit', icon: 'palette', label: 'Kit de UI', path: '/dev/ui' }],
  },
]
</script>

<style scoped lang="scss">
.dev-root {
  min-height: 100vh;
  background: #0d1230;
  display: flex;
  justify-content: center;
  padding: 48px 24px;
}

.dev-wrap {
  width: 100%;
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.dev-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;

  &__text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 280px;
  }
}

.dev-badge {
  align-self: flex-start;
  padding: 3px 8px;
  border-radius: 6px;
  background: #ffc107;
  color: #0d1230;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.dev-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
}

.dev-sub {
  margin: 0;
  font-size: 14px;
  color: #aeb8e8;

  code {
    font-family: ui-monospace, Menlo, monospace;
    color: #dfe4fa;
  }
}

.dev-session {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 8px 0 14px;
  border-radius: 12px;
  white-space: nowrap;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
  }

  &__text {
    font-size: 13.5px;
    font-weight: 700;
  }

  &__btn {
    height: 30px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: #fff;
    font: inherit;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &--on {
    background: rgba(63, 168, 52, 0.16);
    border: 1px solid rgba(63, 168, 52, 0.4);

    .dev-session__dot {
      background: #3fa834;
    }
    .dev-session__text {
      color: #bfe9b8;
    }
  }

  &--off {
    background: rgba(220, 38, 38, 0.16);
    border: 1px solid rgba(220, 38, 38, 0.4);

    .dev-session__dot {
      background: #dc2626;
    }
    .dev-session__text {
      color: #f5c2c2;
    }
  }
}

.dev-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__label {
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #8f9bd4;

    &--hl {
      color: #ffc107;
    }
  }
}

.dev-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.dev-route {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s;

  &:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.22);
  }

  &__icon {
    color: #aeb8e8;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 13.5px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
  }

  &__path {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11.5px;
    color: #8f9bd4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--hl {
    background: rgba(255, 193, 7, 0.1);
    border-color: rgba(255, 193, 7, 0.35);

    .dev-route__icon {
      color: #ffc107;
    }

    &:hover {
      background: rgba(255, 193, 7, 0.16);
    }
  }
}
</style>
