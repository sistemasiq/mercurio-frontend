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

      <!-- Resumen -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <div class="stat-card">
            <div>
              <div class="stat-card__label">Total</div>
              <div class="stat-card__value">{{ store.pulseras.length }}</div>
            </div>
            <div class="stat-card__icon stat-card__icon--blue">
              <q-icon name="contactless" />
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="stat-card">
            <div>
              <div class="stat-card__label">Activas</div>
              <div class="stat-card__value">{{ totalActivas }}</div>
            </div>
            <div class="stat-card__icon stat-card__icon--green">
              <q-icon name="check_circle" />
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="stat-card">
            <div>
              <div class="stat-card__label">Inactivas</div>
              <div class="stat-card__value">{{ totalInactivas }}</div>
            </div>
            <div class="stat-card__icon stat-card__icon--orange">
              <q-icon name="do_not_disturb_on" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <!-- Toolbar: búsqueda + filtro de estado -->
        <div
          class="row items-center q-pa-md q-gutter-md"
          style="border-bottom: 1px solid var(--border-color)"
        >
          <q-input
            v-model="busqueda"
            dense
            outlined
            clearable
            debounce="150"
            placeholder="Buscar por código RFID…"
            class="col-12 col-sm"
            style="max-width: 320px"
          >
            <template #prepend><q-icon name="search" size="18px" /></template>
          </q-input>
          <q-space />
          <q-btn-toggle
            v-model="filtroEstado"
            no-caps
            unelevated
            dense
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            padding="6px 14px"
            style="border: 1px solid var(--border-color); border-radius: 8px"
            :options="[
              { label: 'Todas', value: 'todas' },
              { label: 'Activas', value: 'activas' },
              { label: 'Inactivas', value: 'inactivas' },
            ]"
          />
        </div>

        <q-table
          :rows="pulserasFiltradas"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          class="fec-table"
        >
          <template #body-cell-pulsera_rfid="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <div class="rfid-chip q-mr-sm">
                  <q-icon name="contactless" size="16px" />
                </div>
                <span class="rfid-code">{{ props.row.pulsera_rfid }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-creado="props">
            <q-td :props="props" style="color: var(--text-secondary)">
              {{ formatearFecha(props.row.creado) }}
            </q-td>
          </template>

          <template #body-cell-activo="props">
            <q-td :props="props">
              <span
                class="estado-pill"
                :class="props.row.activo ? 'estado-pill--activa' : 'estado-pill--inactiva'"
              >
                <span class="estado-pill__dot" />
                {{ props.row.activo ? 'Activa' : 'Inactiva' }}
              </span>
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

          <template #no-data>
            <div class="column items-center q-pa-xl full-width">
              <q-icon name="contactless" size="42px" style="color: var(--text-muted)" />
              <div class="q-mt-sm text-body2" style="color: var(--text-secondary)">
                {{
                  busqueda || filtroEstado !== 'todas'
                    ? 'Ninguna pulsera coincide con el filtro.'
                    : 'No hay pulseras registradas.'
                }}
              </div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

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
import { ref, computed, onMounted } from 'vue'
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
  { name: 'creado', label: 'REGISTRADA', field: 'creado', align: 'left', sortable: true },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Resumen y filtros ─────────────────────────────────────────────────────────

const busqueda = ref('')
const filtroEstado = ref<'todas' | 'activas' | 'inactivas'>('todas')

const totalActivas = computed(() => store.pulseras.filter((p) => p.activo).length)
const totalInactivas = computed(() => store.pulseras.length - totalActivas.value)

const pulserasFiltradas = computed(() => {
  const q = busqueda.value?.trim().toLowerCase() ?? ''
  return store.pulseras.filter((p) => {
    if (filtroEstado.value === 'activas' && !p.activo) return false
    if (filtroEstado.value === 'inactivas' && p.activo) return false
    return !q || p.pulsera_rfid.toLowerCase().includes(q)
  })
})

const formatearFecha = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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
.rfid-chip {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.1);
  color: var(--q-primary);
  flex: 0 0 auto;
}

.rfid-code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
  letter-spacing: 0.4px;
}

.estado-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

.estado-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.estado-pill--activa {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.estado-pill--inactiva {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}
</style>
