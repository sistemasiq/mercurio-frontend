<script setup lang="ts">
import type { NinoActivo } from '@/types/padres'

const { nino } = defineProps<{ nino: NinoActivo }>()

function formatHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatMinutos(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

const statusColor: Record<string, string> = {
  Activo: 'green',
  Por_entrar: 'orange',
  Terminado: 'grey',
}
const statusBg: Record<string, string> = {
  Activo: 'bg-green-1',
  Por_entrar: 'bg-orange-1',
  Terminado: 'bg-grey-2',
}
const statusText: Record<string, string> = {
  Activo: 'text-green-8',
  Por_entrar: 'text-orange-8',
  Terminado: 'text-grey-7',
}
</script>

<template>
  <q-card flat bordered class="hijo-card">
    <q-card-section class="q-pa-lg">
      <!-- Status badge -->
      <div class="row items-center justify-between q-mb-md">
        <span
          class="status-badge"
          :class="[
            statusBg[nino.estadoVisita] ?? 'bg-grey-2',
            statusText[nino.estadoVisita] ?? 'text-grey-7',
          ]"
        >
          <span class="status-dot" :class="statusColor[nino.estadoVisita] ?? 'grey'" />
          {{ nino.estadoVisita }}
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

      <!-- Info grid -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Entrada</span>
          <div class="row items-center">
            <q-icon name="schedule" size="16px" class="info-icon" />
            <span class="info-value">{{ formatHora(nino.horaEntrada) }}</span>
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">Tiempo transcurrido</span>
          <div class="row items-center">
            <q-icon name="timer" size="16px" class="info-icon" />
            <span class="info-value">{{ formatMinutos(nino['minutos Transcurridos']) }}</span>
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
}

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

.status-dot.orange {
  background: #f97316;
}

.status-dot.grey {
  background: #9ca3af;
}

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

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  color: #64748b;
  margin-right: 4px;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
</style>
