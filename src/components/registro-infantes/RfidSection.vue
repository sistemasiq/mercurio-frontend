<script setup lang="ts">
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
  <q-card flat bordered class="rfid-card q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-lg">
        <q-icon name="nfc" size="22px" color="primary" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Vinculación de pulseras</span>
        <q-chip
          dense
          :color="store.allChildrenHaveBracelet ? 'positive' : 'warning'"
          text-color="white"
          :label="store.allChildrenHaveBracelet ? 'Todos vinculados' : 'Pendientes'"
          size="md"
          class="q-ml-sm"
        />
      </div>

      <!-- ── PULSERAS DE NIÑOS ── -->
      <div
        v-for="(child, i) in store.savedChildren"
        :key="child.id"
        class="rfid-row q-mb-sm q-pa-sm"
        :class="child.rfidBracelet ? 'rfid-assigned' : 'rfid-pending'"
      >
        <div class="row items-center q-mb-sm">
          <q-icon
            :name="child.rfidBracelet ? 'check_circle' : 'radio_button_unchecked'"
            :color="child.rfidBracelet ? 'positive' : 'grey-5'"
            size="20px"
            class="q-mr-sm"
          />
          <div class="col">
            <div class="text-weight-medium" style="font-size: 16px">{{ child.name }}</div>
            <div class="text-caption text-grey-6">{{ child.age }} años</div>
          </div>

          <!-- Ya asignada -->
          <template v-if="child.rfidBracelet">
            <q-chip
              dense
              color="positive"
              text-color="white"
              icon="nfc"
              :label="braceletLabelForChild(child.id) ?? ''"
              size="md"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              size="xs"
              color="grey-6"
              class="q-ml-xs"
              @click="clearChildBracelet(child.id)"
            />
          </template>

          <template v-else-if="activeChildScanIndex !== i">
            <q-btn
              unelevated
              dense
              size="sm"
              icon="nfc"
              label="Escanear pulsera"
              color="primary"
              @click="activateChildScan(child.id, i)"
            />
          </template>
          <div v-else class="row items-center q-gutter-xs">
            <q-chip
              dense
              color="primary"
              text-color="white"
              icon="sensors"
              label="Esperando escaneo..."
              size="sm"
              class="scanning-pulse"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              size="xs"
              color="grey-6"
              @click="activeChildScanIndex = -1"
            />
          </div>
        </div>

        <!-- Input invisible para niño -->
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
          @keydown.enter.prevent="onChildScanEnter(child.id)"
        />

        <div v-if="childScanErrors[child.id]" class="text-caption text-negative q-mt-xs">
          <q-icon name="error_outline" size="14px" class="q-mr-xs" />{{ childScanErrors[child.id] }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.rfid-card {
  border-radius: 12px;
}

.rfid-row {
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.rfid-pending {
  background: var(--bg-main);
}

.rfid-assigned {
  background: rgba(63, 168, 52, 0.08);
  border-color: rgba(63, 168, 52, 0.4);
}

.hidden-scan-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.scanning-pulse {
  animation: pulse-opacity 1.2s ease-in-out infinite;
}
</style>
