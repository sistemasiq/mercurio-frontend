<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registration'

const store = useRegistrationStore()

// Pulsera del TUTOR
const tutorScanActive = ref(false)
const tutorScanInput = ref('')
const tutorScanError = ref('')
const tutorScanFieldRef = ref<HTMLInputElement | null>(null)

function activateTutorScan() {
  tutorScanActive.value = true
  tutorScanError.value = ''
  tutorScanInput.value = ''
  setTimeout(() => tutorScanFieldRef.value?.focus(), 100)
}

function onTutorScanEnter() {
  const scanned = tutorScanInput.value.trim()
  if (!scanned) return

  // Validar que exista en la lista de pulseras disponibles
  const found = store.pulseras.find((p) => p.pulseraRfid === scanned)
  if (!found) {
    tutorScanError.value = `Pulsera "${scanned}" no encontrada en el sistema.`
    tutorScanInput.value = ''
    return
  }

  // Validar que no esté ya asignada a un niño
  const usedByChild = store.children.some((c) => c.rfidBracelet === found.id)
  if (usedByChild) {
    tutorScanError.value = `Pulsera "${scanned}" ya está asignada a un niño.`
    tutorScanInput.value = ''
    return
  }

  store.tutor.braceletGuardianId = found.id
  tutorScanActive.value = false
  tutorScanError.value = ''
}

function clearTutorBracelet() {
  store.tutor.braceletGuardianId = ''
  tutorScanInput.value = ''
  tutorScanError.value = ''
  tutorScanActive.value = false
}

const tutorBraceletLabel = computed(() => {
  if (!store.tutor.braceletGuardianId) return null
  return store.pulseras.find((p) => p.id === store.tutor.braceletGuardianId)?.pulseraRfid ?? null
})

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

  // Validar que no esté usada por otro niño ni por el tutor
  const usedByOtherChild = store.savedChildren.some(
    (c) => c.id !== childId && c.rfidBracelet === found.id,
  )
  const usedByTutor = store.tutor.braceletGuardianId === found.id

  if (usedByOtherChild || usedByTutor) {
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
        <q-icon name="nfc" size="22px" color="blue-8" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Vinculación de pulseras</span>
        <q-chip
          dense
          :color="store.allChildrenHaveBracelet && store.tutorHasBracelet ? 'positive' : 'orange'"
          text-color="white"
          :label="
            store.allChildrenHaveBracelet && store.tutorHasBracelet
              ? 'Todos vinculados'
              : 'Pendientes'
          "
          size="md"
          class="q-ml-sm"
        />
      </div>

      <!-- ── PULSERA DEL TUTOR ── -->
      <div
        class="rfid-row q-mb-md q-pa-sm"
        :class="store.tutorHasBracelet ? 'rfid-assigned' : 'rfid-pending'"
      >
        <div class="row items-center q-mb-sm">
          <q-icon
            :name="store.tutorHasBracelet ? 'check_circle' : 'radio_button_unchecked'"
            :color="store.tutorHasBracelet ? 'positive' : 'grey-5'"
            size="20px"
            class="q-mr-sm"
          />
          <div class="col">
            <div class="text-weight-medium" style="font-size: 16px">
              {{ store.tutor.fullName || 'Tutor' }}
              <q-chip
                dense
                color="blue-1"
                text-color="blue-9"
                label="Tutor"
                size="md"
                class="q-ml-md"
              />
            </div>
          </div>

          <!-- Ya asignada -->
          <template v-if="store.tutorHasBracelet">
            <q-chip
              dense
              color="positive"
              text-color="white"
              icon="nfc"
              :label="tutorBraceletLabel ?? ''"
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
              @click="clearTutorBracelet"
            />
          </template>

          <!-- Sin asignar / escaneando -->
          <template v-else-if="!store.tutorHasBracelet">
            <q-btn
              v-if="!tutorScanActive"
              unelevated
              dense
              size="sm"
              icon="nfc"
              label="Escanear pulsera"
              color="blue-8"
              @click="activateTutorScan"
            />
            <div v-else class="row items-center q-gutter-xs">
              <q-chip
                dense
                color="blue-8"
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
                @click="tutorScanActive = false"
              />
            </div>
          </template>
        </div>

        <!-- Input invisible — captura el lector RFID sin mostrarse -->
        <input
          v-if="tutorScanActive && !store.tutorHasBracelet"
          :ref="(el) => (tutorScanFieldRef = el as HTMLInputElement)"
          v-model="tutorScanInput"
          class="hidden-scan-input"
          autocomplete="off"
          @keydown.enter.prevent="onTutorScanEnter"
        />

        <div v-if="tutorScanError" class="text-caption text-negative q-mt-xs">
          <q-icon name="error_outline" size="14px" class="q-mr-xs" />{{ tutorScanError }}
        </div>
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
              :disable="!store.tutorHasBracelet"
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

      <!-- Aviso: primero asignar pulsera al tutor -->
      <q-banner
        v-if="!store.tutorHasBracelet && store.savedChildren.length > 0"
        dense
        rounded
        class="bg-blue-1 text-blue-9 q-mt-sm"
        style="font-size: 12px"
      >
        <template #avatar>
          <q-icon name="info" color="blue-8" size="16px" />
        </template>
        Primero asigna la pulsera al tutor antes de asignar las de los niños.
      </q-banner>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.rfid-card {
  border-radius: 12px;
}

.rfid-row {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.rfid-pending {
  background: #fafafa;
}

.rfid-assigned {
  background: #f0fdf4;
  border-color: #86efac;
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
