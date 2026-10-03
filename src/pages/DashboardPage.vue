<template>
  <q-page class="page-content resumen">
    <PageHeader
      title="Resumen de Eventos"
      subtitle="Gestiona próximas reservaciones, paquetes y pagos."
    >
      <template #actions>
        <q-btn
          outline
          icon="event_note"
          label="Reservaciones"
          :to="{ name: 'eventos-reservaciones' }"
        />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva Reservación"
          @click="irANuevaReservacion"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="kpi-row">
      <KpiCard
        label="Fiestas próximas"
        :value="store.loading ? '—' : eventosProximos"
        :note="eventosEstaSemana ? `+${eventosEstaSemana} esta semana` : undefined"
        note-tone="ok"
      />
      <KpiCard
        label="Depósitos pendientes"
        :value="store.loading ? '—' : depositosPendientes"
        :note="depositosUrgentes ? `${depositosUrgentes} urgentes` : undefined"
        note-tone="bad"
      />
      <KpiCard
        label="Saldo por cobrar"
        :value="store.loading ? '—' : formatMXN(saldoPorCobrar)"
        :note="`${reservacionesConSaldo.length} reservaciones`"
      />
      <KpiCard
        label="Paquete más popular"
        :value="store.loading || paquetesStore.loading ? '—' : paqueteMasPopular"
        :note="conteoPaquetePopular ?? undefined"
      />
    </div>

    <section class="agenda">
      <header class="agenda__head">
        <h2 class="agenda__title">Agenda de la semana</h2>
        <div class="agenda__nav">
          <q-btn
            flat
            round
            dense
            icon="chevron_left"
            aria-label="Semana anterior"
            @click="semanaOffset--"
          />
          <span class="agenda__range">{{ rangoSemanaLabel }}</span>
          <q-btn
            flat
            round
            dense
            icon="chevron_right"
            aria-label="Semana siguiente"
            @click="semanaOffset++"
          />
          <q-btn outline dense label="Hoy" class="agenda__today" @click="semanaOffset = 0" />
        </div>
      </header>
      <div class="agenda__grid">
        <div
          v-for="dia in diasSemana"
          :key="dia.key"
          class="agenda__day"
          :class="{ 'agenda__day--today': dia.hoy }"
        >
          <span class="agenda__dow">
            {{ dia.dow }} <b>{{ dia.num }}</b>
          </span>
          <button
            v-for="ev in dia.eventos"
            :key="ev.id"
            type="button"
            class="agenda-ev"
            :class="{ 'agenda-ev--due': ev.pendiente }"
            @click="irACierre(ev.id)"
          >
            <span class="agenda-ev__time">{{ ev.hora }}</span>
            <span class="agenda-ev__title">{{ ev.titulo }}</span>
            <span class="agenda-ev__pkg">{{ ev.paquete }}</span>
            <span class="agenda-ev__status">{{
              ev.pendiente ? 'Depósito pendiente' : 'Pagado'
            }}</span>
          </button>
        </div>
      </div>
      <q-inner-loading :showing="store.loading"
        ><q-spinner color="primary" size="32px"
      /></q-inner-loading>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReservacionesStore } from '@/stores/reservaciones'
import { usePaquetesStore } from '@/stores/paquetes'
import { useAuthStore } from '@/stores/auth'
import { useNuevaReservacion } from '@/composables/useNuevaReservacion'
import type { Paquetes } from '@/types/paquetes'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import { formatMXN } from '@/utils/formatoMoneda'

const router = useRouter()
const store = useReservacionesStore()
const paquetesStore = usePaquetesStore()
const authStore = useAuthStore()
const irANuevaReservacion = useNuevaReservacion()

onMounted(() => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
  paquetesStore.cargar(authStore.currentBranchId)
})

// Fecha actual normalizada a medianoche (hora local)
const today = new Date()
today.setHours(0, 0, 0, 0)

// Parsea "YYYY-MM-DD" como fecha local para evitar desfase de zona horaria
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ── Semana mostrada (lunes a domingo), navegable con semanaOffset ────────────

const semanaOffset = ref(0)

const inicioSemana = computed(() => {
  const d = new Date(today)
  const dia = d.getDay() // 0 (dom) - 6 (sáb)
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff + semanaOffset.value * 7)
  return d
})

const finSemana = computed(() => {
  const d = new Date(inicioSemana.value)
  d.setDate(d.getDate() + 6)
  return d
})

const rangoSemanaLabel = computed(
  () =>
    `${inicioSemana.value.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} – ${finSemana.value.toLocaleDateString(
      'es-MX',
      { day: '2-digit', month: 'short' },
    )}`,
)

const eventosSemana = computed(() =>
  store.reservaciones
    .filter((r) => {
      const d = parseLocalDate(r.fecha_evento)
      return d >= inicioSemana.value && d <= finSemana.value && r.estado !== 'cancelada'
    })
    .sort((a, b) => {
      const fa = parseLocalDate(a.fecha_evento).getTime()
      const fb = parseLocalDate(b.fecha_evento).getTime()
      return fa !== fb ? fa - fb : a.hora_inicio.localeCompare(b.hora_inicio)
    }),
)

// ── Stats ─────────────────────────────────────────────────────────────────────

const eventosProximos = computed(
  () =>
    store.reservaciones.filter(
      (r) => parseLocalDate(r.fecha_evento) >= today && r.estado !== 'cancelada',
    ).length,
)

// Semana calendario real (independiente de la navegación de la agenda) para el badge del stat card
const eventosEstaSemana = computed(() => {
  const dia = today.getDay()
  const inicio = new Date(today)
  inicio.setDate(inicio.getDate() + (dia === 0 ? -6 : 1 - dia))
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 6)
  return store.reservaciones.filter((r) => {
    const d = parseLocalDate(r.fecha_evento)
    return d >= inicio && d <= fin && r.estado !== 'cancelada'
  }).length
})

const depositosPendientes = computed(
  () =>
    store.reservaciones.filter(
      (r) =>
        r.estado !== 'cancelada' &&
        parseLocalDate(r.fecha_evento) >= today &&
        parseFloat(r.saldo_pendiente || '0') > 0,
    ).length,
)

const depositosUrgentes = computed(() => {
  const en3Dias = new Date(today)
  en3Dias.setDate(en3Dias.getDate() + 3)
  return store.reservaciones.filter((r) => {
    const d = parseLocalDate(r.fecha_evento)
    return (
      r.estado !== 'cancelada' &&
      d >= today &&
      d <= en3Dias &&
      parseFloat(r.saldo_pendiente || '0') > 0
    )
  }).length
})

// ── Paquetes más solicitados ──────────────────────────────────────────────────

const topPaquetes = computed(() => {
  const conteos = new Map<string, number>()
  store.reservaciones.forEach((r) => {
    if (r.estado === 'cancelada') return
    conteos.set(r.paquete_id, (conteos.get(r.paquete_id) ?? 0) + 1)
  })
  return [...conteos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([paqueteId]) => paquetesStore.paquetes.find((p) => p.id === paqueteId))
    .filter((p): p is Paquetes => !!p)
})

const paqueteMasPopular = computed(() => topPaquetes.value[0]?.nombre ?? '—')

// ── Agenda semanal por columnas ───────────────────────────────────────────────

interface EventoAgenda {
  id: string
  hora: string
  titulo: string
  paquete: string
  pendiente: boolean
}

const diasSemana = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana.value)
    d.setDate(d.getDate() + i)
    const eventos: EventoAgenda[] = eventosSemana.value
      .filter((r) => parseLocalDate(r.fecha_evento).toDateString() === d.toDateString())
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .map((r) => {
        const familia = r.apellidos_cliente ? `Fam. ${r.apellidos_cliente}` : r.nombre_cliente
        const festejado = r.nombre_festejado
          ? ` · ${r.nombre_festejado}${r.edad_festejado ? ` (${r.edad_festejado})` : ''}`
          : ''
        return {
          id: r.id,
          hora: r.hora_inicio.slice(0, 5),
          titulo: `${familia}${festejado}`,
          paquete: paquetesStore.paquetes.find((p) => p.id === r.paquete_id)?.nombre ?? '—',
          pendiente: parseFloat(r.saldo_pendiente || '0') > 0,
        }
      })
    return {
      key: d.toISOString(),
      dow: d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''),
      num: d.getDate(),
      hoy: d.toDateString() === today.toDateString(),
      eventos,
    }
  }),
)

// ── KPIs adicionales ─────────────────────────────────────────────────────────

const reservacionesConSaldo = computed(() =>
  store.reservaciones.filter(
    (r) =>
      r.estado !== 'cancelada' &&
      parseLocalDate(r.fecha_evento) >= today &&
      parseFloat(r.saldo_pendiente || '0') > 0,
  ),
)
const saldoPorCobrar = computed(() =>
  reservacionesConSaldo.value.reduce((s, r) => s + parseFloat(r.saldo_pendiente || '0'), 0),
)
const conteoPaquetePopular = computed(() => {
  const top = topPaquetes.value[0]
  if (!top) return null
  const activas = store.reservaciones.filter((r) => r.estado !== 'cancelada')
  return `${activas.filter((r) => r.paquete_id === top.id).length} de ${activas.length}`
})

function irACierre(id: string) {
  router.push({ name: 'eventos-reservaciones-cierre', params: { id } })
}
</script>

<style scoped lang="scss">
.resumen {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.agenda {
  position: relative;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 520px;

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__range {
    min-width: 120px;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__today {
    margin-left: 8px;
    padding: 0 10px;
    font-size: 13px;
  }

  &__grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    overflow-x: auto;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(7, 160px);
    }
  }

  &__day {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 10px;
    border-right: 1px solid var(--border-soft);

    &:last-child {
      border-right: 0;
    }

    &--today {
      background: #f2f6fe;

      .agenda__dow b {
        color: var(--q-primary);
      }
    }
  }

  &__dow {
    padding: 0 2px 4px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);

    b {
      margin-left: 4px;
      font-size: 18px;
      letter-spacing: 0;
      color: var(--text-strong);
    }
  }
}

.agenda-ev {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 0;
  border-left: 3px solid var(--q-primary);
  border-radius: 8px;
  background: #eaf1fd;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &--due {
    border-left-color: var(--q-secondary);
    background: #fdeef3;

    .agenda-ev__status {
      color: var(--tone-warn-fg);
    }
  }

  &:hover {
    filter: brightness(0.98);
  }

  &__time {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-strong);
  }

  &__pkg {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__status {
    font-size: 12px;
    font-weight: 700;
    color: var(--tone-ok-fg);
  }
}
</style>
