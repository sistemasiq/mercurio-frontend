<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAppNavigation } from '@/composables/useAppNavigation'

defineProps<{
  /** Muestra el botón de menú cuando el sidebar está en modo overlay. */
  showMenuButton: boolean
}>()

const emit = defineEmits<{ 'toggle-menu': [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const alertasInventario = useAlertasInventarioStore()
const reservacionesStore = useReservacionesStore()
const { sectionFor } = useAppNavigation()

const page = computed(() => route.meta.title ?? '')
const section = computed(
  () =>
    route.meta.section ??
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

// ── Centro de notificaciones ─────────────────────────────────────────────────
// Sin backend nuevo: reutiliza las alertas de inventario (ya existían en la
// campana) y agrega los eventos de hoy que todavía no empiezan, a partir del
// catálogo de reservaciones que ya carga Inicio/Calendario.
const insumosConAlerta = computed(() => [
  ...alertasInventario.criticos,
  ...alertasInventario.porReordenar,
])

const eventosPorIniciar = computed(() => {
  if (!auth.hasPermission('reservaciones:listar')) return []
  const hoyISO = format(now.value, 'yyyy-MM-dd')
  const hhmm = format(now.value, 'HH:mm')
  return reservacionesStore.reservaciones
    .filter(
      (r) =>
        r.fecha_evento?.slice(0, 10) === hoyISO &&
        r.estado !== 'cancelada' &&
        r.hora_inicio.slice(0, 5) >= hhmm,
    )
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
})

const nombreEventoNotif = (nombre: string, apellidos: string | null) =>
  apellidos ? `Fam. ${apellidos}` : nombre

const totalNotificaciones = computed(
  () => insumosConAlerta.value.length + eventosPorIniciar.value.length,
)

function irAInventario(): void {
  void router.push({ name: 'reportes-inventario' })
}

function irACalendario(): void {
  void router.push({ name: 'eventos-calendario' })
}
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

    <q-btn
      flat
      round
      dense
      icon="notifications"
      class="tb__icon-btn tb-bell"
      :aria-label="
        totalNotificaciones > 0 ? `${totalNotificaciones} notificaciones` : 'Notificaciones'
      "
    >
      <span v-if="totalNotificaciones > 0" class="tb-bell__dot" />

      <q-menu anchor="bottom right" self="top right" class="tb-notif">
        <div class="tb-notif__panel">
          <header class="tb-notif__head">Notificaciones</header>

          <template v-if="totalNotificaciones === 0">
            <div class="tb-notif__empty">
              <q-icon name="notifications_none" size="22px" />
              <span>Sin novedades por ahora.</span>
            </div>
          </template>

          <template v-else>
            <section v-if="eventosPorIniciar.length" class="tb-notif__section">
              <h3 class="tb-notif__title">Eventos de hoy por iniciar</h3>
              <q-item
                v-for="r in eventosPorIniciar"
                :key="r.id"
                v-close-popup
                clickable
                class="tb-notif__item"
                @click="irACalendario"
              >
                <q-item-section avatar>
                  <q-icon name="celebration" size="18px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{
                    nombreEventoNotif(r.nombre_cliente, r.apellidos_cliente)
                  }}</q-item-label>
                  <q-item-label caption>{{ r.hora_inicio.slice(0, 5) }}</q-item-label>
                </q-item-section>
              </q-item>
            </section>

            <section v-if="insumosConAlerta.length" class="tb-notif__section">
              <h3 class="tb-notif__title">Alertas de inventario</h3>
              <q-item v-close-popup clickable class="tb-notif__item" @click="irAInventario">
                <q-item-section avatar>
                  <q-icon name="inventory_2" size="18px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ insumosConAlerta.length }} insumos con alerta de stock
                  </q-item-label>
                  <q-item-label caption>Ver reporte de stock</q-item-label>
                </q-item-section>
              </q-item>
            </section>
          </template>
        </div>
      </q-menu>
    </q-btn>
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
    text-decoration: none;

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

<style lang="scss">
.tb-notif {
  &__panel {
    width: 320px;
    max-width: calc(100vw - 32px);
    padding: 4px 0;
  }

  &__head {
    padding: 10px 16px 8px;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__section + &__section {
    border-top: 1px solid var(--border-soft);
    padding-top: 4px;
  }

  &__title {
    margin: 0;
    padding: 6px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__item {
    min-height: 44px;
  }

  &__empty {
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13px;
  }
}
</style>
