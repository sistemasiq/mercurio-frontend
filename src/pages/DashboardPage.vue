<template>
  <q-page class="page-content">
    <!-- Header -->
    <div class="row items-start q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold" style="color: var(--text-primary)">
          Resumen de Eventos
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          Gestiona próximas reservaciones, paquetes y pagos.
        </div>
      </div>
      <q-space />
      <div class="row q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="grey-8"
          icon="filter_list"
          label="Filtrar"
          style="border-radius: 8px"
        >
          <q-tooltip>Función en desarrollo</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nueva Reservación"
          style="border-radius: 8px; font-weight: 600"
          @click="router.push({ name: 'eventos-reservaciones-crear' })"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Columna izquierda: stats + agenda -->
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-4">
            <div class="stat-card">
              <div class="stat-card__top">
                <div class="stat-card__icon stat-card__icon--blue">
                  <q-icon name="celebration" />
                </div>
                <div
                  v-if="eventosEstaSemana > 0"
                  class="stat-card__corner-badge stat-card__corner-badge--positive"
                >
                  +{{ eventosEstaSemana }} esta semana
                </div>
              </div>
              <div class="stat-card__value">{{ store.loading ? '—' : eventosProximos }}</div>
              <div class="stat-card__label">Fiestas Próximas</div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="stat-card">
              <div class="stat-card__top">
                <div class="stat-card__icon stat-card__icon--orange">
                  <q-icon name="pending_actions" />
                </div>
                <div
                  v-if="depositosUrgentes > 0"
                  class="stat-card__corner-badge stat-card__corner-badge--negative"
                >
                  {{ depositosUrgentes }} urgentes
                </div>
              </div>
              <div class="stat-card__value text-warning">
                {{ store.loading ? '—' : depositosPendientes }}
              </div>
              <div class="stat-card__label">Depósitos Pendientes</div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="stat-card">
              <div class="stat-card__top">
                <div class="stat-card__icon stat-card__icon--green">
                  <q-icon name="diamond" />
                </div>
              </div>
              <div class="stat-card__value" style="font-size: 1.4rem">
                {{ store.loading || paquetesStore.loading ? '—' : paqueteMasPopular }}
              </div>
              <div class="stat-card__label">Paquete Más Popular</div>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-card__header">
            <h3>
              <q-icon name="event_note" size="18px" color="primary" class="q-mr-xs" />
              Agenda de Esta Semana
            </h3>
            <div class="week-nav">
              <q-btn flat round dense icon="chevron_left" size="sm" @click="semanaOffset--" />
              <div class="text-caption text-grey-6 week-nav__label">{{ rangoSemanaLabel }}</div>
              <q-btn flat round dense icon="chevron_right" size="sm" @click="semanaOffset++" />
            </div>
          </div>

          <q-table
            :rows="agendaSemana"
            :columns="columns"
            row-key="id"
            flat
            class="fec-table"
            :loading="store.loading"
            hide-pagination
            :rows-per-page-options="[0]"
            no-data-label="No hay eventos programados esta semana"
          >
            <template #body-cell-fecha="props">
              <q-td :props="props">
                <div class="event-name">{{ props.row.diaLabel }}, {{ props.row.hora }}</div>
                <div class="text-caption text-grey-6">{{ props.row.duracion }}</div>
              </q-td>
            </template>
            <template #body-cell-cliente="props">
              <q-td :props="props">
                <div class="event-name">{{ props.row.cliente }}</div>
                <div v-if="props.row.festejado" class="text-caption text-grey-6">
                  {{ props.row.festejado }}
                </div>
              </q-td>
            </template>
            <template #body-cell-paquete="props">
              <q-td :props="props">
                <q-badge
                  outline
                  color="primary"
                  :label="props.row.paquete"
                  style="font-size: 0.7rem; padding: 4px 8px; border-radius: 6px"
                />
              </q-td>
            </template>
            <template #body-cell-deposito="props">
              <q-td :props="props">
                <span
                  class="status-dot"
                  :class="props.row.pendienteNum > 0 ? 'status-dot--pending' : 'status-dot--paid'"
                />
                <span
                  :class="props.row.pendienteNum > 0 ? 'text-warning' : 'text-positive'"
                  class="text-weight-medium"
                >
                  {{ props.row.pendienteNum > 0 ? 'Pendiente' : 'Pagado' }}
                </span>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" auto-width>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="point_of_sale"
                  color="grey-7"
                  @click="
                    router.push({
                      name: 'eventos-reservaciones-cierre',
                      params: { id: props.row.id },
                    })
                  "
                >
                  <q-tooltip>Cerrar evento</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>

          <div class="panel-card__footer">
            <q-btn
              flat
              no-caps
              color="primary"
              label="Ver Calendario Completo"
              style="font-weight: 600"
              @click="router.push({ name: 'eventos-calendario' })"
            />
          </div>
        </div>
      </div>

      <!-- Columna derecha: paquetes más pedidos -->
      <div class="col-12 col-md-4">
        <div class="panel-card panel-packages">
          <div class="panel-packages__header">
            <div class="text-h6 text-weight-bold">Paquetes de Fiesta</div>
            <div class="text-caption" style="opacity: 0.85">Los 3 más solicitados</div>
          </div>
          <div class="q-pa-md">
            <div v-if="paquetesStore.loading" class="q-pa-sm text-grey">Cargando...</div>
            <div v-else-if="topPaquetes.length === 0" class="q-pa-sm text-grey">
              Aún no hay paquetes solicitados
            </div>
            <div
              v-for="(p, i) in topPaquetes"
              v-else
              :key="p.id"
              class="mini-package"
              :class="{ 'mini-package--top': i === 0 }"
            >
              <div class="mini-package__icon">
                <q-icon :name="i === 0 ? 'diamond' : 'celebration'" />
              </div>
              <div class="mini-package__info">
                <div class="mini-package__name">{{ p.nombre }}</div>
                <div class="mini-package__desc">{{ descripcionPaquete(p) }}</div>
              </div>
              <div class="mini-package__price">{{ formatCurrency(p.precio_base) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { QTableColumn } from 'quasar'
import { useReservacionesStore } from '@/stores/reservaciones'
import { usePaquetesStore } from '@/stores/paquetes'
import { useAuthStore } from '@/stores/auth'
import type { Paquetes } from '@/types/paquetes'

const router = useRouter()
const store = useReservacionesStore()
const paquetesStore = usePaquetesStore()
const authStore = useAuthStore()

onMounted(() => {
  store.cargar()
  paquetesStore.cargar(authStore.currentBranchId ?? undefined)
})

// Fecha actual normalizada a medianoche (hora local)
const today = new Date()
today.setHours(0, 0, 0, 0)

// Parsea "YYYY-MM-DD" como fecha local para evitar desfase de zona horaria
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatCurrency(value: string | null | undefined): string {
  const num = parseFloat(value ?? '0')
  if (isNaN(num)) return '$0.00'
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

function descripcionPaquete(p: Paquetes): string {
  if (p.descripcion) return p.descripcion
  return `${p.personas_incluidas} personas · ${p.duracion_minutos} min`
}

// ── Tabla de agenda semanal ───────────────────────────────────────────────────

const columns: QTableColumn[] = [
  { name: 'fecha', label: 'FECHA Y HORA', field: 'diaLabel', align: 'left' },
  { name: 'cliente', label: 'CLIENTE / FESTEJADO', field: 'cliente', align: 'left' },
  { name: 'paquete', label: 'PAQUETE', field: 'paquete', align: 'left' },
  { name: 'deposito', label: 'DEPÓSITO', field: 'pendienteNum', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

const agendaSemana = computed(() =>
  eventosSemana.value.map((r) => {
    const d = parseLocalDate(r.fecha_evento)
    const diffDias = Math.round((d.getTime() - today.getTime()) / 86400000)
    const diaLabel =
      diffDias === 0
        ? 'Hoy'
        : diffDias === 1
          ? 'Mañana'
          : d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })

    const [h1, m1] = r.hora_inicio.split(':').map(Number)
    const [h2, m2] = r.hora_fin.split(':').map(Number)
    const minutos = h2! * 60 + m2! - (h1! * 60 + m1!)
    const horas = Math.max(1, Math.ceil(minutos / 60))

    return {
      id: r.id,
      diaLabel,
      hora: r.hora_inicio.slice(0, 5),
      duracion: `${horas} ${horas === 1 ? 'Hora' : 'Horas'}`,
      cliente: `${r.nombre_cliente}${r.apellidos_cliente ? ' ' + r.apellidos_cliente : ''}`.trim(),
      festejado: r.nombre_festejado
        ? `${r.nombre_festejado}${r.edad_festejado ? ' (Cumple ' + r.edad_festejado + ')' : ''}`
        : null,
      paquete: paquetesStore.paquetes.find((p) => p.id === r.paquete_id)?.nombre ?? '—',
      pendienteNum: parseFloat(r.saldo_pendiente || '0'),
    }
  }),
)
</script>

<style scoped>
.week-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.week-nav__label {
  min-width: 100px;
  text-align: center;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;

  &--paid {
    background: var(--q-positive, #10b981);
  }

  &--pending {
    background: var(--q-warning, #f59e0b);
  }
}

.panel-card__footer {
  display: flex;
  justify-content: center;
  padding: 12px;
  border-top: 1px solid var(--border-color);
}

.panel-packages__header {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(139, 92, 246, 0.1));
  border-bottom: 1px solid var(--border-color);
}

.mini-package {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 10px;
}

.mini-package:last-child {
  margin-bottom: 0;
}

.mini-package--top {
  border-color: var(--q-primary, #4f46e5);
  background: rgba(79, 70, 229, 0.04);
}

.mini-package__icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.1);
  color: var(--q-primary, #4f46e5);
  flex-shrink: 0;
}

.mini-package__info {
  flex: 1;
  min-width: 0;
}

.mini-package__name {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.mini-package__desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-package__price {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--text-primary);
  flex-shrink: 0;
}
</style>
