<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { useAppNavigation } from '@/composables/useAppNavigation'

defineProps<{
  /** Muestra el botón de menú cuando el sidebar está en modo overlay. */
  showMenuButton: boolean
}>()

const emit = defineEmits<{ 'toggle-menu': [] }>()

const route = useRoute()
const alertasInventario = useAlertasInventarioStore()
const { sectionFor } = useAppNavigation()

const page = computed(() => route.meta.title ?? '')
const section = computed(() =>
  sectionFor(typeof route.name === 'string' ? route.name : null, route.path),
)

// ── Fecha y hora ────────────────────────────────────────────────────────────
const now = ref(new Date())
const clockId = setInterval(() => (now.value = new Date()), 30_000)
onBeforeUnmount(() => clearInterval(clockId))

const clock = computed(() => {
  const text = format(now.value, "EEE d MMM '·' HH:mm", { locale: es })
  return text.charAt(0).toUpperCase() + text.slice(1)
})

// La campana solo aparece cuando hay alertas reales (inventario por ahora).
const totalAlertas = computed(() => alertasInventario.totalAlertas)
</script>

<template>
  <header class="tb">
    <q-btn
      v-if="showMenuButton"
      flat
      round
      dense
      icon="menu"
      class="tb__icon-btn"
      aria-label="Abrir menú"
      @click="emit('toggle-menu')"
    />

    <div class="tb-crumbs">
      <template v-if="section && section !== page">
        <span class="tb-crumbs__section">{{ section }}</span>
        <q-icon name="chevron_right" size="16px" class="tb-crumbs__sep" />
      </template>
      <span class="tb-crumbs__page">{{ page }}</span>
    </div>

    <div class="tb-clock">
      <q-icon name="schedule" size="17px" />
      <span>{{ clock }}</span>
    </div>

    <router-link
      v-if="totalAlertas > 0"
      :to="{ name: 'reportes-inventario' }"
      class="tb__icon-btn tb-bell"
      :aria-label="`${totalAlertas} alertas de inventario`"
    >
      <q-icon name="notifications" size="21px" />
      <span class="tb-bell__dot" />
      <q-tooltip>{{ totalAlertas }} insumos con alerta de stock</q-tooltip>
    </router-link>
  </header>
</template>

<style scoped lang="scss">
.tb {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 28px;
  background: #fff;
  border-bottom: 1px solid var(--border-color);

  @media (max-width: 599px) {
    padding: 0 16px;
  }

  &__icon-btn {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;

    &:hover {
      background: var(--bg-muted);
    }
  }
}

.tb-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 13px;
  white-space: nowrap;

  &__section {
    color: var(--text-secondary);
    font-weight: 500;
  }

  &__sep {
    color: var(--text-muted);
  }

  &__page {
    color: var(--text-primary);
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tb-clock {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bg-muted);
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 599px) {
    display: none;
  }
}

.tb-bell__dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--q-secondary);
  border: 2px solid #fff;
  box-sizing: content-box;
}
</style>
