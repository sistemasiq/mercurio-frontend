<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { NinoActivo } from '@/types/padres'

const props = defineProps<{ nino: NinoActivo }>()
const { nino } = props

const now = ref(new Date())
let timerId: ReturnType<typeof setInterval> | undefined

const estado = computed(() => (nino.estadoVisita ?? '').toLowerCase())

const pagados = computed(() => Math.max(0, nino.minutosPagados ?? 0))

const minutosTranscurridos = computed(() => {
  if (estado.value !== 'activo') return Math.max(0, nino.minutosTranscurridos ?? 0)
  const entrada = new Date(nino.horaEntrada).getTime()
  if (Number.isNaN(entrada)) return Math.max(0, nino.minutosTranscurridos ?? 0)
  return Math.max(0, Math.floor((now.value.getTime() - entrada) / 60000))
})

const tiempoVencido = computed(
  () => estado.value === 'activo' && minutosTranscurridos.value > pagados.value,
)

const minutosRestantes = computed(() => Math.max(0, pagados.value - minutosTranscurridos.value))

const excedido = computed(() => Math.max(0, minutosTranscurridos.value - pagados.value))

const progreso = computed(() => {
  if (pagados.value <= 0) return 0
  return Math.min(1, minutosTranscurridos.value / pagados.value)
})

const tone = computed<'success' | 'danger' | 'warning' | 'neutral'>(() => {
  if (estado.value === 'activo') return tiempoVencido.value ? 'danger' : 'success'
  if (estado.value === 'por_entrar') return 'warning'
  return 'neutral'
})

const ui = computed(() => {
  switch (tone.value) {
    case 'danger':
      return {
        badgeBg: 'bg-red-1',
        badgeText: 'text-red-8',
        dot: 'red',
        barColor: 'red',
        icon: 'text-red-6',
        value: 'text-red-7',
      }
    case 'warning':
      return {
        badgeBg: 'bg-orange-1',
        badgeText: 'text-orange-8',
        dot: 'orange',
        barColor: 'orange',
        icon: 'text-orange-6',
        value: 'text-orange-7',
      }
    case 'neutral':
      return {
        badgeBg: 'bg-grey-2',
        badgeText: 'text-grey-7',
        dot: 'grey',
        barColor: 'grey',
        icon: 'text-grey-6',
        value: 'text-grey-7',
      }
    default:
      return {
        badgeBg: 'bg-green-1',
        badgeText: 'text-green-8',
        dot: 'green',
        barColor: 'green',
        icon: 'text-green-6',
        value: 'text-green-7',
      }
  }
})

const badgeLabel = computed(() => {
  if (estado.value === 'activo') {
    return tiempoVencido.value ? 'Tiempo vencido' : 'Activo'
  }
  if (!nino.estadoVisita) return 'Desconocido'
  return nino.estadoVisita.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
})

const banner = computed(() => {
  switch (tone.value) {
    case 'danger':
      return {
        icon: 'warning_amber',
        text: `Tiempo vencido · ${formatMinutos(excedido.value)} excedidos`,
      }
    case 'warning':
      return { icon: 'schedule', text: 'Por entrar' }
    case 'neutral':
      return { icon: 'check_circle', text: 'Visita finalizada' }
    default:
      return {
        icon: 'check_circle',
        text: `${formatMinutos(minutosRestantes.value)} restantes`,
      }
  }
})

onMounted(() => {
  if (estado.value !== 'activo') return
  timerId = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onUnmounted(() => {
  if (timerId !== undefined) clearInterval(timerId)
})

function formatHora(iso?: string): string {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatMinutos(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}
</script>

<template>
  <q-card flat bordered class="hijo-card">
    <!-- Progress bar: elapsed vs paid -->
    <div class="progress-wrap">
      <q-linear-progress
        :value="progreso"
        :color="ui.barColor"
        track-color="grey-3"
        size="8px"
        rounded
      />
      <div class="progress-labels">
        <span>0 min</span>
        <span>{{ formatMinutos(pagados) }}</span>
      </div>
    </div>

    <q-card-section class="q-pa-lg">
      <!-- Status badge (left) + RFID badge (right) -->
      <div class="row items-center justify-between q-mb-md">
        <span class="status-badge" :class="[ui.badgeBg, ui.badgeText]">
          <span class="status-dot" :class="ui.dot" />
          {{ badgeLabel }}
        </span>
        <span class="pulsera-tag">
          <q-icon name="nfc" size="14px" class="q-mr-xs" />
          {{ nino.pulsera }}
        </span>
      </div>

      <!-- Name + age -->
      <div class="row items-baseline q-mb-lg">
        <h3 class="child-name">{{ nino.nombreCompleto }}</h3>
        <span class="child-age q-ml-sm">{{ nino.edad }} años</span>
      </div>

      <!-- Dynamic remaining-time banner -->
      <div class="time-banner" :data-tone="tone">
        <q-icon :name="banner.icon" size="18px" />
        <span class="time-banner-text">{{ banner.text }}</span>
      </div>

      <!-- Info grid -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Entrada</span>
          <div class="row items-center">
            <q-icon name="schedule" size="16px" class="info-icon" :class="ui.icon" />
            <span class="info-value" :class="ui.value">{{ formatHora(nino.horaEntrada) }}</span>
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">Salida esperada</span>
          <div class="row items-center">
            <q-icon name="flag" size="16px" class="info-icon" :class="ui.icon" />
            <span class="info-value" :class="ui.value">{{
              formatHora(nino.horaSalidaEsperada)
            }}</span>
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">Transcurrido</span>
          <div class="row items-center">
            <q-icon name="timer" size="16px" class="info-icon" :class="ui.icon" />
            <span class="info-value" :class="ui.value">{{
              formatMinutos(minutosTranscurridos)
            }}</span>
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">Pagado</span>
          <div class="row items-center">
            <q-icon name="payments" size="16px" class="info-icon" :class="ui.icon" />
            <span class="info-value" :class="ui.value">{{ formatMinutos(pagados) }}</span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.hijo-card {
  border-radius: 16px;
  border-color: #e8edf2;
  overflow: hidden;
}

/* ── Progress bar ───────────────────── */
.progress-wrap {
  padding: 18px 20px 0;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 6px;
}

/* ── Status badge ───────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.green {
  background: #22c55e;
}

.status-dot.red {
  background: #ef4444;
}

.status-dot.orange {
  background: #f97316;
}

.status-dot.grey {
  background: #9ca3af;
}

/* ── RFID badge ─────────────────────── */
.pulsera-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 8px;
}

/* ── Name + age ─────────────────────── */
.child-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.child-age {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  flex-shrink: 0;
}

/* ── Time banner ────────────────────── */
.time-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 18px;
}

.time-banner[data-tone='success'] {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #16a34a;
}

.time-banner[data-tone='danger'] {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.time-banner[data-tone='warning'] {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
}

.time-banner[data-tone='neutral'] {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

/* ── Info grid ──────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 14px;
}

.info-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin-bottom: 6px;
}

.info-icon {
  margin-right: 4px;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
