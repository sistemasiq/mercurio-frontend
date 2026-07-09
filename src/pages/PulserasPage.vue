<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Pulseras</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Pulseras RFID disponibles para el control de acceso de la sucursal.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Pulsera"
          unelevated
          no-caps
          :disable="!authStore.currentBranchId"
          style="border-radius: 8px; font-weight: 600"
          @click="abrirCrear"
        />
      </div>

      <!-- Sin sucursal activa -->
      <q-banner
        v-if="!authStore.currentBranchId"
        dense
        rounded
        class="bg-orange-1 text-orange-9 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="info" color="orange-9" /></template>
        No hay una sucursal activa en la sesión.
      </q-banner>

      <!-- Error -->
      <q-banner
        v-if="store.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ store.error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="store.pulseras"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay pulseras registradas"
          class="fec-table"
        >
          <template #body-cell-activo="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.activo ? 'positive' : 'grey-5'"
                :label="props.row.activo ? 'Activa' : 'Inactiva'"
                style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                :icon="props.row.activo ? 'toggle_on' : 'toggle_off'"
                :color="props.row.activo ? 'positive' : 'grey-5'"
                size="sm"
                class="q-mr-xs"
                @click="toggleActivo(props.row)"
              >
                <q-tooltip>{{ props.row.activo ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                color="negative"
                size="sm"
                :disable="!props.row.activo"
                @click="confirmarEliminar(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Crear ─────────────────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 380px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Nueva Pulsera</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">CÓDIGO RFID</div>
            <q-input
              ref="rfidRef"
              v-model="formDialog.pulsera_rfid"
              dense
              outlined
              autofocus
              placeholder="Ej. RFID-001"
              :rules="[(v) => !!v || 'El código RFID es requerido']"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Crear pulsera"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Confirmar Eliminar ────────────────────────────────────────── -->
    <q-dialog v-model="dialogEliminar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar pulsera</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Estás seguro de que deseas eliminar
            <strong>{{ filaEliminar?.pulsera_rfid }}</strong
            >? Esta acción no se puede deshacer.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Eliminar"
            style="border-radius: 8px; font-weight: 600"
            :loading="eliminando"
            @click="ejecutarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { usePulserasStore } from '@/stores/pulseras'
import type { PulseraAdmin } from '@/types/pulsera'

const $q = useQuasar()
const authStore = useAuthStore()
const store = usePulserasStore()

const cargar = () => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

const columns: QTableColumn[] = [
  {
    name: 'pulsera_rfid',
    label: 'CÓDIGO RFID',
    field: 'pulsera_rfid',
    align: 'left',
    sortable: true,
  },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const guardando = ref(false)
const rfidRef = ref()

const formDialog = ref({ pulsera_rfid: '' })

const abrirCrear = () => {
  formDialog.value = { pulsera_rfid: '' }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
}

const guardar = async () => {
  if (!formDialog.value.pulsera_rfid.trim()) {
    rfidRef.value?.validate()
    return
  }
  if (!authStore.currentBranchId) return
  guardando.value = true
  try {
    await store.crear({
      pulsera_rfid: formDialog.value.pulsera_rfid.trim(),
      sucursal_id: authStore.currentBranchId,
    })
    $q.notify({ type: 'positive', message: 'Pulsera creada', position: 'top-right' })
    cerrarDialog()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ocurrió un error. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    guardando.value = false
  }
}

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: PulseraAdmin) => {
  try {
    await store.actualizar(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Pulsera ${!row.activo ? 'activada' : 'desactivada'}`,
      position: 'top-right',
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cambiar el estado.', position: 'top-right' })
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<PulseraAdmin | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: PulseraAdmin) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminar(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Pulsera eliminada', position: 'top-right' })
    dialogEliminar.value = false
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo eliminar. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    eliminando.value = false
  }
}
</script>

<style scoped>
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
</style>
