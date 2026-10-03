<template>
  <q-page class="page-content access">
    <header class="access__head">
      <div class="access__titles">
        <h1 class="access__title">Control de Acceso</h1>
        <span class="access__live" :class="`access__live--${socket.estado.value}`">
          <span class="access__live-dot" />
          {{ socket.estado.value === 'conectado' ? 'En vivo' : 'Actualizando' }} ·
          {{ store.activos.length }} {{ store.activos.length === 1 ? 'niño' : 'niños' }} en estancia
        </span>
      </div>
      <q-input
        v-model="busqueda"
        outlined
        dense
        clearable
        placeholder="Buscar niño, tutor o pulsera"
        class="access__search"
        aria-label="Buscar niño, tutor o pulsera"
      >
        <template #prepend><q-icon name="search" size="20px" /></template>
      </q-input>
      <q-btn
        unelevated
        color="primary"
        icon="person_add"
        label="Nuevo registro"
        class="access__new"
        @click="goToNewRegistration"
      />
    </header>

    <div class="access__bar">
      <div class="access__tabs" role="tablist">
        <button
          v-for="f in filtros"
          :key="f.value"
          type="button"
          role="tab"
          class="access__tab"
          :class="{ 'access__tab--on': filtro === f.value }"
          :aria-selected="filtro === f.value"
          @click="filtro = f.value"
        >
          <span class="access__tab-dot" :class="`access__tab-dot--${f.tone}`" />
          {{ f.label }}
          <span class="access__tab-count">{{ f.count }}</span>
        </button>
      </div>
      <span class="access__sort">Ordenado por tiempo restante</span>
      <span v-if="store.puedeVerPulseras" class="access__bands">
        <q-icon name="sensors" size="18px" />{{ store.pulserasLibres }} pulseras libres
      </span>
      <q-btn
        flat
        round
        dense
        icon="refresh"
        class="action-btn"
        aria-label="Actualizar"
        @click="store.loadActivos()"
      />
    </div>

    <div v-if="store.isLoading && store.activos.length === 0" class="access__grid">
      <q-skeleton v-for="n in 4" :key="n" type="rect" height="210px" class="access__skeleton" />
    </div>

    <div v-else-if="store.error" class="access__state">
      <StateBlock
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="store.loadActivos()"
      />
    </div>

    <div v-else-if="activosVisibles.length === 0" class="access__state">
      <StateBlock
        v-if="store.activos.length === 0"
        variant="empty"
        title="No hay niños en estancia"
        body="Registra una entrada para empezar."
        action-label="Nuevo registro"
        @action="goToNewRegistration"
      />
      <StateBlock
        v-else
        variant="no-results"
        action-label="Limpiar filtros"
        @action="((busqueda = ''), (filtro = 'todos'))"
      />
    </div>

    <div v-else class="access__grid">
      <ActiveChildCard v-for="child in activosVisibles" :key="child.detalleId" :child="child" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessControlStore } from '@/stores/accessControl'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAuthStore } from '@/stores/auth'
import { useEstanciasSocket } from '@/composables/useEstanciasSocket'
import type { EstanciaWsMessage } from '@/types/estancia'
import StateBlock from '@/components/ui/StateBlock.vue'
import type { StayStatus } from '@/stores/accessControl'
import ActiveChildCard from '@/components/control-acceso/ActiveChildCard.vue'

// Si el socket queda 'caido' (ver useEstanciasSocket), se cae a polling  mientras sigue reintentando la reconexión en segundo plano.
const POLLING_FALLBACK_MS = 15000

const store = useAccessControlStore()
const turno = useTurnoCajaStore()
const auth = useAuthStore()
const router = useRouter()

const fallbackIntervalId = ref<number | null>(null)

onMounted(() => {
  store.loadActivos()
  store.startTicking()
  // Roles sin ningún permiso de caja (ej. Personal de atención de niños)
  // nunca tendrán un turno abierto — pedirlo solo genera un 403 de más.
  if (auth.hasPermission('pos:acceder')) {
    void turno.cargarTurnoActivo()
  }
})

onUnmounted(() => {
  store.stopTicking()
  if (fallbackIntervalId.value !== null) {
    window.clearInterval(fallbackIntervalId.value)
    fallbackIntervalId.value = null
  }
})

// Un registro (checkin) o checkout en cualquier caja de la sucursal debe
// reflejarse aquí sin que el cajero tenga que darle a "Actualizar".
function handleMensajeSocket(_msg: EstanciaWsMessage) {
  void store.loadActivos()
}

const socket = useEstanciasSocket(handleMensajeSocket)

watch(socket.estado, (estado) => {
  if (estado === 'caido' && fallbackIntervalId.value === null) {
    fallbackIntervalId.value = window.setInterval(
      () => void store.loadActivos(),
      POLLING_FALLBACK_MS,
    )
  } else if (estado !== 'caido' && fallbackIntervalId.value !== null) {
    window.clearInterval(fallbackIntervalId.value)
    fallbackIntervalId.value = null
  }
})

// ── Filtros y orden ─────────────────────────────────────────────────────────
type Filtro = 'todos' | StayStatus
const filtro = ref<Filtro>('todos')
const busqueda = ref('')

const filtros = computed(() => [
  { value: 'todos' as const, label: 'Todos', count: store.activos.length, tone: 'all' },
  { value: 'excedido' as const, label: 'Excedidos', count: store.excedidos, tone: 'bad' },
  { value: 'por_expirar' as const, label: 'Por expirar', count: store.porExpirar, tone: 'warn' },
  { value: 'activo' as const, label: 'Activos', count: store.totalActivos, tone: 'ok' },
])

// Los que salen primero son los que menos tiempo tienen (o más excedidos van).
const activosVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.activos
    .filter((c) => filtro.value === 'todos' || c.status === filtro.value)
    .filter(
      (c) =>
        !q ||
        c.nino.toLowerCase().includes(q) ||
        c.tutor.toLowerCase().includes(q) ||
        c.pulsera.toLowerCase().includes(q),
    )
    .sort((a, b) => a.minutosRestantes - b.minutosRestantes)
})

function goToNewRegistration() {
  // Exigir turno de caja abierto solo aplica a roles que de hecho operan
  // caja. Un rol sin "pos:acceder" (ej. Personal de atención de niños) va
  // directo al registro — el guard de la ruta ya valida pulseras libres.
  if (auth.hasPermission('pos:acceder') && !turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  router.push({ name: 'estancias-registro-infantes' })
}
</script>

<style scoped lang="scss">
.access {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__head {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 240px;
  }

  &__title {
    margin: 0;
    font-size: 26px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }

  &__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-secondary);

    &--caido .access__live-dot {
      background: var(--tone-warn-dot);
    }
  }

  &__live-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: var(--tone-ok-dot);
  }

  &__search {
    width: 346px;
    max-width: 100%;

    :deep(.q-field__control) {
      height: 42px;
      min-height: 42px;
    }

    :deep(.q-field__marginal) {
      height: 42px;
      color: var(--text-secondary);
    }
  }

  &__new {
    min-height: 40px;
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
  }

  &__tab {
    height: 34px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--text-body);
    font: inherit;
    font-size: 13.5px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    &--on {
      background: var(--text-strong);
      color: #fff;

      .access__tab-count {
        color: #aeb8e8;
      }

      .access__tab-dot--all {
        background: #fff;
      }
    }
  }

  &__tab-dot {
    width: 7px;
    height: 7px;
    border-radius: 4px;

    &--all {
      background: var(--text-strong);
    }
    &--bad {
      background: var(--tone-bad-dot);
    }
    &--warn {
      background: var(--tone-warn-dot);
    }
    &--ok {
      background: var(--tone-ok-dot);
    }
  }

  &__tab-count {
    font-weight: 600;
    color: var(--text-secondary);
  }

  &__sort {
    margin-left: auto;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__bands {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);

    .q-icon {
      color: var(--q-primary);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
  }

  &__skeleton {
    border-radius: var(--radius-md);
  }

  &__state {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }
}
</style>
