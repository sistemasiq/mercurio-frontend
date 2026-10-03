<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ref } from 'vue'
import { useRegistrationStore } from '@/stores/registration'

const store = useRegistrationStore()

//Pulseras de NIÑOS
// índice del niño que tiene el escáner activo (-1 = ninguno)
const activeChildScanIndex = ref<number>(-1)
const childScanInputs = ref<Record<string, string>>({})
const childScanErrors = ref<Record<string, string>>({})
const childScanRefs = ref<Record<string, HTMLInputElement>>({})

function activateChildScan(childId: string, index: number) {
  activeChildScanIndex.value = index
  childScanErrors.value[childId] = ''
  childScanInputs.value[childId] = ''
  setTimeout(() => childScanRefs.value[childId]?.focus(), 100)
}

function onChildScanEnter(childId: string) {
  const scanned = (childScanInputs.value[childId] ?? '').trim()
  if (!scanned) return

  const found = store.pulseras.find((p) => p.pulseraRfid === scanned)
  if (!found) {
    childScanErrors.value[childId] = `Pulsera "${scanned}" no encontrada.`
    childScanInputs.value[childId] = ''
    return
  }

  // Validar que no esté usada por otro niño
  const usedByOtherChild = store.savedChildren.some(
    (c) => c.id !== childId && c.rfidBracelet === found.id,
  )

  if (usedByOtherChild) {
    childScanErrors.value[childId] = `Pulsera "${scanned}" ya está en uso.`
    childScanInputs.value[childId] = ''
    return
  }

  // Asignar
  const child = store.children.find((c) => c.id === childId)
  if (child) child.rfidBracelet = found.id

  activeChildScanIndex.value = -1
  childScanErrors.value[childId] = ''
}

function clearChildBracelet(childId: string) {
  const child = store.children.find((c) => c.id === childId)
  if (child) child.rfidBracelet = ''
  childScanInputs.value[childId] = ''
  childScanErrors.value[childId] = ''
  if (activeChildScanIndex.value === store.savedChildren.findIndex((c) => c.id === childId)) {
    activeChildScanIndex.value = -1
  }
}

function braceletLabelForChild(childId: string) {
  const child = store.savedChildren.find((c) => c.id === childId)
  if (!child?.rfidBracelet) return null
  return store.pulseras.find((p) => p.id === child.rfidBracelet)?.pulseraRfid ?? null
}
</script>

<template>
  <section class="rfid">
    <header class="rfid__head">
      <span class="rfid__icon"><q-icon name="sensors" size="22px" /></span>
      <div class="rfid__titles">
        <h2 class="rfid__title">Asignar pulseras</h2>
        <span class="rfid__subtitle">Acerca cada pulsera al lector</span>
      </div>
      <StatusBadge
        :tone="store.allChildrenHaveBracelet ? 'ok' : 'warn'"
        :label="store.allChildrenHaveBracelet ? 'Todos vinculados' : 'Pendientes'"
      />
    </header>

    <div class="rfid__table">
      <div class="rfid__row rfid__row--head"><span>Niño</span><span>Pulsera</span></div>
      <div v-for="(child, i) in store.savedChildren" :key="child.id" class="rfid__row">
        <div class="rfid__kid">
          <span class="rfid__name">{{ child.name }}</span>
          <span class="rfid__meta">{{ child.age }} años · {{ store.tutor.estimatedTime }}</span>
          <span v-if="childScanErrors[child.id]" class="rfid__error">
            <q-icon name="error" size="14px" />{{ childScanErrors[child.id] }}
          </span>
        </div>

        <div class="rfid__band">
          <template v-if="child.rfidBracelet">
            <span class="rfid__code">{{ braceletLabelForChild(child.id) }}</span>
            <q-btn
              flat
              round
              dense
              icon="close"
              size="sm"
              class="action-btn"
              aria-label="Quitar pulsera"
              @click="clearChildBracelet(child.id)"
            />
          </template>
          <q-btn
            v-else-if="activeChildScanIndex !== i"
            outline
            dense
            icon="sensors"
            label="Escanear"
            class="rfid__scan"
            @click="activateChildScan(child.id, i)"
          />
          <template v-else>
            <span class="rfid__waiting">Esperando…</span>
            <q-btn
              flat
              round
              dense
              icon="close"
              size="sm"
              class="action-btn"
              aria-label="Cancelar escaneo"
              @click="activeChildScanIndex = -1"
            />
          </template>
        </div>

        <input
          v-if="activeChildScanIndex === i && !child.rfidBracelet"
          :ref="
            (el) => {
              if (el) childScanRefs[child.id] = el as HTMLInputElement
            }
          "
          v-model="childScanInputs[child.id]"
          class="hidden-scan-input"
          autocomplete="off"
          aria-label="Lectura de pulsera"
          @keydown.enter.prevent="onChildScanEnter(child.id)"
        />
      </div>
    </div>

    <div class="rfid__callout">
      <q-icon name="info" size="19px" />
      Lector listo. {{ store.pulseras.length }} pulseras libres en la sucursal.
    </div>
  </section>
</template>

<style scoped>
.hidden-scan-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>

<style scoped lang="scss">
.rfid {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__table {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }

  &__row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }

    &--head {
      padding: 10px 14px;
      background: var(--bg-subtle);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }
  }

  &__kid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__error {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--tone-bad-fg);
  }

  &__band {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__code {
    font-size: 14px;
    font-weight: 800;
    color: var(--tone-ok-fg);
    font-variant-numeric: tabular-nums;
  }

  &__scan {
    padding: 0 12px;
  }

  &__waiting {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-primary);
    animation: rfid-pulse 1.2s ease-in-out infinite;
  }

  &__callout {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
    font-size: 13px;
    font-weight: 600;
  }
}

@keyframes rfid-pulse {
  50% {
    opacity: 0.45;
  }
}
</style>
