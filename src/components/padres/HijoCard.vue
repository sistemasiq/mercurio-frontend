<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { NinoActivo } from '@/types/padres'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const { nino } = defineProps<{ nino: NinoActivo }>()

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

const badgeLabel = computed(() => {
  if (estado.value === 'activo') {
    return tiempoVencido.value ? 'Excedido' : 'Activo'
  }
  if (!nino.estadoVisita) return 'Desconocido'
  return nino.estadoVisita.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
})

const finalizada = computed(() => tone.value === 'neutral')

const cargoExtra = computed(() => nino.cargoExtra ?? 0)
const importe = computed(() => nino.importe ?? null)
const puntosGanados = computed(() => nino.puntosGanados ?? null)

function formatMoneda(valor: number): string {
  return `$${valor.toFixed(2)}`
}

// Cifra principal de la tarjeta: tiempo excedido o tiempo restante.
const tiempoPrincipal = computed(() => {
  if (tone.value === 'danger') return `+${formatMinutos(excedido.value)}`
  if (tone.value === 'warning') return formatMinutos(pagados.value)
  return formatMinutos(minutosRestantes.value)
})

const iniciales = computed(() => getInitials(nino.nombreCompleto))
const colorAvatar = computed(() => getAvatarColor(nino.nombreCompleto))

function formatFecha(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

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
  <article v-if="finalizada" class="visita-pasada">
    <q-icon name="history" size="20px" class="visita-pasada__icon" />
    <div class="visita-pasada__text">
      <span class="visita-pasada__title">
        {{ nino.nombreCompleto }} · {{ formatFecha(nino.horaEntrada) }}
      </span>
      <span class="visita-pasada__meta">
        {{ formatMinutos(minutosTranscurridos) }} · pulsera {{ nino.pulsera }}
        <template v-if="importe !== null"> · {{ formatMoneda(importe) }}</template>
        <template v-if="puntosGanados">
          · <span class="visita-pasada__puntos">+{{ puntosGanados }} pts</span>
        </template>
      </span>
    </div>
  </article>

  <article v-else class="visita" :data-tone="tone">
    <div class="visita__head">
      <div class="visita__avatar" :style="{ background: colorAvatar }">{{ iniciales }}</div>
      <div class="visita__who">
        <span class="visita__name">{{ nino.nombreCompleto }}</span>
        <span class="visita__meta">
          Entró {{ formatHora(nino.horaEntrada) }} · {{ formatMinutos(pagados) }}
        </span>
      </div>
      <span class="visita__badge">{{ badgeLabel }}</span>
    </div>
    <div class="visita__figure">
      <span class="visita__time">{{ tiempoPrincipal }}</span>
      <span class="visita__aside">
        {{ tone === 'danger' ? 'debía salir' : 'sale' }} {{ formatHora(nino.horaSalidaEsperada) }}
      </span>
    </div>
    <div
      class="visita__bar"
      role="progressbar"
      :aria-valuenow="Math.round(progreso * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="visita__bar-fill" :style="{ width: `${progreso * 100}%` }" />
    </div>
    <div v-if="tone === 'danger' && cargoExtra > 0" class="visita__extra">
      Cargo extra: {{ formatMoneda(cargoExtra) }}
    </div>
  </article>
</template>

<style scoped lang="scss">
.visita {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  --tone-fg: var(--tone-ok-fg);
  --tone-bg: var(--tone-ok-bg);
  --tone-bar: var(--tone-ok-dot);
  --track: #eef1f5;

  &[data-tone='danger'] {
    border-color: #f5c2c2;
    --tone-fg: var(--tone-bad-fg);
    --tone-bg: var(--tone-bad-bg);
    --tone-bar: var(--tone-bad-dot);
    --track: var(--tone-bad-bg);
  }

  &[data-tone='warning'] {
    --tone-fg: var(--tone-warn-fg);
    --tone-bg: var(--tone-warn-bg);
    --tone-bar: var(--tone-warn-dot);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__who {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__badge {
    flex-shrink: 0;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    background: var(--tone-bg);
    color: var(--tone-fg);
  }

  &__figure {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__time {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--tone-fg);
    font-variant-numeric: tabular-nums;
  }

  &__aside {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__bar {
    height: 8px;
    border-radius: 4px;
    background: var(--track);
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 4px;
    background: var(--tone-bar);
    transition: width 0.3s;
  }

  &__extra {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--tone-bad-fg);
  }
}

.visita-pasada {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  &__icon {
    color: var(--text-muted);
  }

  &__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__meta {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__puntos {
    font-weight: 700;
    color: var(--tone-ok-fg);
  }
}
</style>
